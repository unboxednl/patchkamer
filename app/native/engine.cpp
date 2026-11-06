// SPDX-License-Identifier: AGPL-3.0-or-later
#include "engine.h"
#include "ring.h"
#include "convert.h"
#include <atomic>
#include <chrono>
#include <cmath>
#include <cstring>
#include <thread>

#if defined(_WIN32) && defined(PK_ASIO)
#include <windows.h>
#include "asiosys.h"
#include "asio.h"
#include "asiodrivers.h"
extern AsioDrivers* asioDrivers;
bool loadAsioDriver(char* name);
#define PK_HAVE_ASIO 1
#endif

namespace pkengine {
const char* kTestClock = "Test clock (no sound)";

namespace {
const int kMaxBlock = 8192;
DriftRing g_ring(16384);
float g_L[kMaxBlock], g_R[kMaxBlock];
std::atomic<uint64_t> g_blocks{0};
std::atomic<float> g_peak{0.f};
std::atomic<bool> g_running{false}, g_reset{false};
int g_bufSize = 0; double g_rate = 48000; bool g_open = false; bool g_isAsio = false;

// One block from the ring for the device (device thread). Peak is kept for the test.
void render(int n) {
  g_ring.read(g_L, g_R, (uint32_t)n);
  float p = 0.f; for (int i = 0; i < n; i++) { float a = std::fabs(g_L[i]), b = std::fabs(g_R[i]); if (a > p) p = a; if (b > p) p = b; }
  float old = g_peak.load(std::memory_order_relaxed); if (p > old) g_peak.store(p, std::memory_order_relaxed);
  g_blocks.fetch_add(1, std::memory_order_relaxed);
}

// ---- test clock: a thread that asks for a block every buffer period, like a sound card would
std::thread g_clock; std::atomic<bool> g_clockRun{false};
void clockLoop() {
  using clk = std::chrono::steady_clock;
  const auto period = std::chrono::duration_cast<clk::duration>(std::chrono::duration<double>(g_bufSize / g_rate));
  auto next = clk::now() + period;
  while (g_clockRun.load()) { std::this_thread::sleep_until(next); render(g_bufSize); next += period; }
}

#ifdef PK_HAVE_ASIO
ASIOBufferInfo g_infos[2]; ASIOCallbacks g_cb; int g_types[2] = {0, 0}; bool g_post = false;
void onBuffer(long index, ASIOBool) {
  render(g_bufSize);
  pkconv::write(g_infos[0].buffers[index], g_types[0], g_L, g_bufSize);
  pkconv::write(g_infos[1].buffers[index], g_types[1], g_R, g_bufSize);
  if (g_post) ASIOOutputReady();
}
ASIOTime* onBufferTime(ASIOTime*, long index, ASIOBool d) { onBuffer(index, d); return 0; }
void onRate(ASIOSampleRate) { g_reset.store(true); }
long onMessage(long selector, long value, void*, double*) {
  switch (selector) {
    case kAsioSelectorSupported: return (value == kAsioEngineVersion || value == kAsioResetRequest || value == kAsioResyncRequest ||
                                         value == kAsioLatenciesChanged || value == kAsioSupportsTimeInfo) ? 1 : 0;
    case kAsioEngineVersion: return 2;
    case kAsioResetRequest: case kAsioResyncRequest: g_reset.store(true); return 1;
    case kAsioLatenciesChanged: return 1;
    case kAsioSupportsTimeInfo: return 0;   // plain bufferSwitch is enough
    case kAsioSupportsTimeCode: return 0;
    default: return 0;
  }
}
long pickBuffer(long want, long mn, long mx, long gran) {
  if (want < mn) want = mn; if (want > mx) want = mx;
  if (mn == mx || gran == 0) return mn;
  if (gran > 0) { long k = (want - mn + gran / 2) / gran; long v = mn + k * gran; return v > mx ? mx : v; }
  long best = mn; double bd = 1e30;               // gran -1: powers of two times the minimum
  for (long v = mn; v <= mx; v *= 2) { double d = std::fabs(std::log((double)v / (double)want)); if (d < bd) { bd = d; best = v; } }
  return best;
}
#endif
}  // namespace

bool asioAvailable() {
#ifdef PK_HAVE_ASIO
  return true;
#else
  return false;
#endif
}

std::vector<std::string> list() {
  std::vector<std::string> out; out.push_back(kTestClock);
#ifdef PK_HAVE_ASIO
  CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);
  AsioDriverList lst; long n = lst.asioGetNumDev();
  for (long i = 0; i < n; i++) { char nm[128] = {0}; if (lst.asioGetDriverName((int)i, nm, 128) == 0) out.push_back(nm); }
#endif
  return out;
}

bool open(const OpenArgs& a, OpenInfo& out, std::string& err) {
  if (g_open) close();
  g_blocks = 0; g_peak = 0.f; g_reset = false;
  out = OpenInfo(); out.driver = a.driver; out.pair = a.pair;
  if (a.driver == kTestClock) {
    g_isAsio = false; g_rate = a.sampleRate > 0 ? a.sampleRate : 48000; g_bufSize = a.bufferSize > 0 ? a.bufferSize : 128;
    if (g_bufSize > kMaxBlock) g_bufSize = kMaxBlock;
    out.sampleRate = g_rate; out.bufferSize = g_bufSize; out.outputChannels = 2; out.sampleType = "Float32LSB";
    out.inputLatency = out.outputLatency = g_bufSize;
  } else {
#ifdef PK_HAVE_ASIO
    g_isAsio = true;
    CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);
    char nm[128]; std::strncpy(nm, a.driver.c_str(), sizeof nm - 1); nm[sizeof nm - 1] = 0;
    if (!loadAsioDriver(nm)) { err = "could not load the driver"; return false; }
    ASIODriverInfo di; std::memset(&di, 0, sizeof di); di.asioVersion = 2; di.sysRef = GetDesktopWindow();
    if (ASIOInit(&di) != ASE_OK) { err = std::string("driver does not start: ") + di.errorMessage; if (asioDrivers) asioDrivers->removeCurrentDriver(); return false; }
    long nin = 0, nout = 0; ASIOGetChannels(&nin, &nout);
    int pair = a.pair < 0 ? 0 : a.pair; if (nout < 2) { err = "the driver has fewer than 2 outputs"; ASIOExit(); asioDrivers->removeCurrentDriver(); return false; }
    if (2 * pair + 1 >= nout) pair = 0;
    long mn = 0, mx = 0, pf = 0, gr = 0; ASIOGetBufferSize(&mn, &mx, &pf, &gr);
    long bs = pickBuffer(a.bufferSize > 0 ? a.bufferSize : pf, mn, mx, gr);
    if (bs > kMaxBlock) bs = kMaxBlock;
    ASIOSampleRate sr = a.sampleRate > 0 ? a.sampleRate : 48000;
    if (ASIOCanSampleRate(sr) == ASE_OK) ASIOSetSampleRate(sr); else ASIOGetSampleRate(&sr);
    ASIOSampleRate cur = 0; if (ASIOGetSampleRate(&cur) == ASE_OK && cur > 0) sr = cur;
    g_infos[0].isInput = ASIOFalse; g_infos[0].channelNum = 2 * pair; g_infos[1].isInput = ASIOFalse; g_infos[1].channelNum = 2 * pair + 1;
    g_cb.bufferSwitch = onBuffer; g_cb.sampleRateDidChange = onRate; g_cb.asioMessage = onMessage; g_cb.bufferSwitchTimeInfo = onBufferTime;
    if (ASIOCreateBuffers(g_infos, 2, bs, &g_cb) != ASE_OK) { err = "could not create the buffers"; ASIOExit(); asioDrivers->removeCurrentDriver(); return false; }
    for (int i = 0; i < 2; i++) { ASIOChannelInfo ci; std::memset(&ci, 0, sizeof ci); ci.channel = 2 * pair + i; ci.isInput = ASIOFalse; ASIOGetChannelInfo(&ci); g_types[i] = (int)ci.type; }
    if (!pkconv::supported(g_types[0]) || !pkconv::supported(g_types[1])) {
      err = "sample type " + std::to_string(g_types[0]) + " is not supported"; ASIODisposeBuffers(); ASIOExit(); asioDrivers->removeCurrentDriver(); return false; }
    long il = 0, ol = 0; ASIOGetLatencies(&il, &ol);
    g_post = (ASIOOutputReady() == ASE_OK);
    g_bufSize = (int)bs; g_rate = sr; out.sampleRate = sr; out.bufferSize = (int)bs; out.inputLatency = (int)il; out.outputLatency = (int)ol;
    out.outputChannels = (int)nout; out.pair = pair; out.sampleType = pkconv::name(g_types[0]); out.asio = true;
#else
    err = "this build has no ASIO (only the test clock)"; return false;
#endif
  }
  double target = a.targetMs * 0.001 * g_rate; double minTarget = g_bufSize * 1.5; if (target < minTarget) target = minTarget;
  g_ring.configure(g_rate, target);
  g_open = true; return true;
}

bool start(std::string& err) {
  if (!g_open) { err = "no device open"; return false; }
  if (g_running.load()) return true;
  if (!g_isAsio) { g_clockRun = true; g_clock = std::thread(clockLoop); }
#ifdef PK_HAVE_ASIO
  else {
    for (int h = 0; h < 2; h++) { pkconv::zero(g_infos[0].buffers[h], g_types[0], g_bufSize); pkconv::zero(g_infos[1].buffers[h], g_types[1], g_bufSize); }
    if (ASIOStart() != ASE_OK) { err = "the driver does not start"; return false; }
  }
#endif
  g_running = true; return true;
}

void stop() {
  if (!g_running.load()) return;
  if (!g_isAsio) { g_clockRun = false; if (g_clock.joinable()) g_clock.join(); }
#ifdef PK_HAVE_ASIO
  else ASIOStop();
#endif
  g_running = false;
}

void close() {
  stop();
#ifdef PK_HAVE_ASIO
  if (g_open && g_isAsio) { ASIODisposeBuffers(); ASIOExit(); if (asioDrivers) asioDrivers->removeCurrentDriver(); }
#endif
  g_open = false;
}

bool controlPanel() {
#ifdef PK_HAVE_ASIO
  if (g_open && g_isAsio) return ASIOControlPanel() == ASE_OK;
#endif
  return false;
}

uint32_t write(const float* interleaved, uint32_t frames) { return g_open ? g_ring.write(interleaved, frames) : 0; }

Stats stats() {
  Stats s; s.blocks = g_blocks.load(); s.underruns = g_ring.underruns(); s.overruns = g_ring.overruns(); s.skips = g_ring.skips();
  s.fill = g_ring.fill(); s.target = g_ring.target(); s.ratioPpm = g_ring.ratioPpm(); s.peak = g_peak.load();
  s.running = g_running.load(); s.resetRequested = g_reset.load(); s.bufferSize = g_bufSize; s.sampleRate = g_rate; return s;
}
}  // namespace pkengine
