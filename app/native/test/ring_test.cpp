// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ring.h and convert.h in simulated time (no threads, no sleeping): g++ -O2 -std=c++17 ring_test.cpp && ./a.out
#include <cstdio>
#include <cstdlib>
#include <cmath>
#include <vector>
#include "../ring.h"
#include "../convert.h"

static int fails = 0;
#define CHECK(c, ...) do { if (!(c)) { fails++; std::printf("FAIL %s: ", #c); std::printf(__VA_ARGS__); std::printf("\n"); } } while (0)

// Writer period w and reader period r in seconds; jitter in seconds (uniform, writer only).
struct Result { uint32_t under, over, skips; double fillMin, fillMax, fillEnd, maxStep, ppmEnd; };
static Result run(double seconds, double skew, double jitter, double targetMs, uint32_t wBlock = 128, uint32_t rBlock = 64) {
  const double fs = 48000.0;
  DriftRing ring; ring.configure(fs, targetMs * 0.001 * fs);
  const double wDt = wBlock / (fs * (1.0 + skew)), rDt = rBlock / fs;
  double tw = 0, tr = 0, phase = 0; uint64_t kw = 0;
  std::vector<float> in(wBlock * 2), L(rBlock), R(rBlock);
  Result res{0, 0, 0, 1e9, -1e9, 0, 0, 0}; float last = 0; bool haveLast = false;
  uint32_t under0 = 0; bool began = false; double start = 1.0; // skip the first second (prefill) when judging
  std::srand(7);
  while (tw < seconds || tr < seconds) {
    if (tw <= tr) {
      for (uint32_t i = 0; i < wBlock; i++) { float s = 0.5f * (float)std::sin(phase); phase += 2 * M_PI * 440.0 / fs; in[2*i] = in[2*i+1] = s; }
      ring.write(in.data(), wBlock);
      kw++; // block k arrives at k * period, shifted by the jitter (the jitter does not add up)
      tw = kw * wDt + jitter * ((std::rand() / (double)RAND_MAX) - 0.5) * 2;
      if (tw < 0) tw = 0;
    } else {
      ring.read(L.data(), R.data(), rBlock);
      if (tr >= start) {
        if (!began) { began = true; under0 = ring.underruns(); }
        res.fillMin = std::min(res.fillMin, ring.fill()); res.fillMax = std::max(res.fillMax, ring.fill());
        for (uint32_t i = 0; i < rBlock; i++) { if (haveLast) res.maxStep = std::max(res.maxStep, (double)std::fabs(L[i] - last)); last = L[i]; haveLast = true; }
      }
      tr += rDt;
    }
  }
  res.under = ring.underruns() - under0; res.over = ring.overruns(); res.skips = ring.skips(); res.fillEnd = ring.fill(); res.ppmEnd = ring.ratioPpm();
  return res;
}

int main() {
  // 1. equal clocks, small jitter: no gaps, fill steady
  { Result r = run(20, 0.0, 0.0005, 8); std::printf("equal      : under=%u over=%u skips=%u fill %.0f..%.0f step=%.4f\n", r.under, r.over, r.skips, r.fillMin, r.fillMax, r.maxStep);
    CHECK(r.under == 0 && r.over == 0, "equal clocks"); CHECK(r.maxStep < 0.1, "no jumps in the sine (%f)", r.maxStep); }
  // 2. writer 200 ppm faster, then 200 ppm slower: the fill must stay near the target
  for (double skew : {200e-6, -200e-6, 1000e-6, -1000e-6}) {
    Result r = run(60, skew, 0.0005, 8); const double tgt = 8 * 0.048;
    std::printf("skew %+6.0f : under=%u over=%u skips=%u fill %.0f..%.0f end=%.0f ratio=%.0f ppm step=%.4f\n", skew * 1e6, r.under, r.over, r.skips, r.fillMin, r.fillMax, r.fillEnd, r.ppmEnd, r.maxStep);
    CHECK(r.under == 0 && r.over == 0 && r.skips == 0, "skew %.0f ppm", skew * 1e6);
    CHECK(std::fabs(r.fillEnd - tgt * 48000 / 48 ) < 400, "fill end %f", r.fillEnd);
    CHECK(r.maxStep < 0.1, "no jumps (%f)", r.maxStep); }
  // 3. writer jitter up to 3 ms with target 8 ms: still no gaps
  { Result r = run(30, 100e-6, 0.003, 8); std::printf("jitter 3ms : under=%u over=%u skips=%u fill %.0f..%.0f\n", r.under, r.over, r.skips, r.fillMin, r.fillMax); CHECK(r.under == 0, "jitter 3 ms"); }
  // 4. a writer that stalls for 50 ms: one gap is allowed, after that audio comes back
  { DriftRing ring; ring.configure(48000, 384); std::vector<float> in(256), L(64), R(64);
    for (int b = 0; b < 8; b++) ring.write(in.data(), 128);
    for (int b = 0; b < 20; b++) ring.read(L.data(), R.data(), 64);
    uint32_t u1 = ring.underruns(); CHECK(u1 >= 1, "the stall causes an underrun");
    for (int b = 0; b < 12; b++) ring.write(in.data(), 128);
    for (int b = 0; b < 4; b++) ring.read(L.data(), R.data(), 64);
    CHECK(ring.underruns() == u1, "recovers after a refill (%u -> %u)", u1, ring.underruns()); }
  // 5. NaN and Infinity never reach the output
  { DriftRing ring; ring.configure(48000, 128); std::vector<float> in(512, 0.25f), L(64), R(64);
    in[10] = NAN; in[11] = INFINITY; in[12] = -INFINITY; ring.write(in.data(), 256);
    bool ok = true; for (int b = 0; b < 3; b++) { ring.read(L.data(), R.data(), 64); for (int i = 0; i < 64; i++) ok = ok && std::isfinite(L[i]) && std::isfinite(R[i]); }
    CHECK(ok, "finite output"); }
  // 6. overrun: a full ring takes no more and does not break
  { DriftRing ring(1024); ring.configure(48000, 128); std::vector<float> in(2048, 0.1f);
    uint32_t a = ring.write(in.data(), 1000), b = ring.write(in.data(), 1000); CHECK(a == 1000 && b == 24 && ring.overruns() == 1, "overrun %u %u", a, b); }
  // 8. a writer that delivers in bursts of 1024 frames: after a few underruns the target has grown and it stays quiet
  { DriftRing ring; const double fs = 48000; ring.configure(fs, 384); std::vector<float> in(2048, 0.1f), L(128), R(128);
    double tr = 0; uint64_t sent = 0; uint32_t uLate = 0;
    for (int blk = 0; tr < 20; blk++) {
      uint64_t want = (uint64_t)(tr * fs) + 1024; while (sent < want) sent += ring.write(in.data(), 1024);
      ring.read(L.data(), R.data(), 128); tr += 128 / fs; if (tr > 10) { static uint32_t u10 = ~0u; if (u10 == ~0u) u10 = ring.underruns(); uLate = ring.underruns() - u10; } }
    std::printf("bursts 1024: under=%u (after 10 s: %u) target=%.0f\n", ring.underruns(), uLate, ring.target());
    CHECK(ring.target() > 384 && uLate == 0, "target grows and settles"); }
  // 7. conversion
  { int32_t i32[3]; float s[3] = {1.f, -1.f, NAN}; pkconv::write(i32, pkconv::Int32LSB, s, 3);
    CHECK(i32[0] == 2147483647 && i32[1] == -2147483647 && i32[2] == 0, "int32 %d %d %d", i32[0], i32[1], i32[2]);
    uint8_t b[6]; float t[2] = {1.f, -1.f}; pkconv::write(b, pkconv::Int24LSB, t, 2);
    CHECK(b[0] == 0xFF && b[1] == 0xFF && b[2] == 0x7F && b[3] == 0x01 && b[4] == 0x00 && b[5] == 0x80, "int24 bytes");
    int16_t i16[2]; pkconv::write(i16, pkconv::Int16LSB, t, 2); CHECK(i16[0] == 32767 && i16[1] == -32767, "int16");
    float big[2] = {5.f, -INFINITY}, f32[2]; pkconv::write(f32, pkconv::Float32LSB, big, 2); CHECK(f32[0] == 1.f && f32[1] == -1.f, "float clip"); }
  std::printf(fails ? "FAILED (%d)\n" : "OK\n", fails);
  return fails ? 1 : 0;
}
