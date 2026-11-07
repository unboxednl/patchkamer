// SPDX-License-Identifier: AGPL-3.0-or-later
// Stereo ring buffer between the audio of the host (writer) and the clock of the sound card (reader).
// The two clocks never run exactly equal, so the reader reads slightly faster or slower (linear
// interpolation, at most +-0.3%) to keep the fill of the buffer at the target. Writer and reader may be
// different threads (one writer, one reader). Nothing here allocates or locks after configure().
#pragma once
#include <atomic>
#include <cmath>
#include <cstdint>
#include <vector>

class DriftRing {
public:
  explicit DriftRing(uint32_t capacityFrames = 16384) { // must be a power of two
    cap_ = capacityFrames; mask_ = cap_ - 1; buf_.assign(size_t(cap_) * 2, 0.f);
  }

  // Not while running. targetFrames: how many frames the ring keeps ready (this is latency).
  void configure(double sampleRate, double targetFrames) {
    fs_ = sampleRate > 1000 ? sampleRate : 48000.0;
    target_ = targetFrames < 32 ? 32 : targetFrames; base_ = target_;
    maxTarget_ = fs_ * 0.06 < cap_ * 0.25 ? fs_ * 0.06 : cap_ * 0.25;   // never more than 60 ms
    if (maxTarget_ < target_) maxTarget_ = target_;
    reset();
  }
  void reset() {
    target_ = base_; w_.store(0); r_.store(0); pos_ = 0; fillAvg_ = base_; prefill_ = true; ratio_ = 1.0; winMax_.store(0); maxChunk_ = 0; sinceUnder_ = 0;
    underruns_.store(0); overruns_.store(0); skips_.store(0);
  }

  // Writer thread. Interleaved stereo. NaN and Infinity become 0. Returns the number of frames taken.
  uint32_t write(const float* inter, uint32_t frames) {
    if (frames > winMax_.load(std::memory_order_relaxed)) winMax_.store(frames, std::memory_order_relaxed);
    const uint64_t w = w_.load(std::memory_order_relaxed), r = r_.load(std::memory_order_acquire);
    const uint32_t freeFrames = cap_ - uint32_t(w - r);
    uint32_t n = frames < freeFrames ? frames : freeFrames;
    if (n < frames) overruns_.fetch_add(1, std::memory_order_relaxed);
    for (uint32_t i = 0; i < n; i++) {
      float l = inter[2 * i], rr = inter[2 * i + 1];
      if (!std::isfinite(l)) l = 0.f;
      if (!std::isfinite(rr)) rr = 0.f;
      const size_t k = size_t((w + i) & mask_) * 2;
      buf_[k] = l; buf_[k + 1] = rr;
    }
    w_.store(w + n, std::memory_order_release);
    return n;
  }

  // Reader thread (the callback of the sound card). Fills n frames; silence while there is not enough.
  void read(float* L, float* R, uint32_t n) {
    const uint64_t w = w_.load(std::memory_order_acquire);
    double avail = double(w) - pos_;
    adaptTarget(n);
    if (prefill_) {
      if (avail < target_) { silence(L, R, 0, n); return; }
      prefill_ = false; fillAvg_ = avail;
    }
    // a burst far above the target: jump forward instead of waiting seconds for the drift control
    const double hi = target_ * 4 + 256 < cap_ * 0.5 ? target_ * 4 + 256 : cap_ * 0.5;
    if (avail > hi) { pos_ = double(w) - target_; avail = target_; fillAvg_ = target_; skips_.fetch_add(1, std::memory_order_relaxed); }
    // smooth the fill; the speed corrects the excess over about 4 seconds
    fillAvg_ += (avail - fillAvg_) * (double(n) / (fs_ * 0.5));
    double adj = (fillAvg_ - target_) / (fs_ * 4.0);
    if (adj > 0.003) adj = 0.003; else if (adj < -0.003) adj = -0.003;
    ratio_ = 1.0 + adj;
    for (uint32_t i = 0; i < n; i++) {
      if (pos_ + 1.0 >= double(w)) { // not enough: silence and wait for a new prefill
        // the writer delivers in bursts that are larger than the target: ask for a larger margin (auto latency)
        underruns_.fetch_add(1, std::memory_order_relaxed); prefill_ = true; silence(L, R, i, n);
        target_ = target_ + 128 > maxTarget_ ? maxTarget_ : target_ + 128; sinceUnder_ = 0; break;
      }
      const uint64_t i0 = uint64_t(pos_); const double f = pos_ - double(i0);
      const size_t a = size_t(i0 & mask_) * 2, b = size_t((i0 + 1) & mask_) * 2;
      L[i] = float(buf_[a] + (buf_[b] - buf_[a]) * f);
      R[i] = float(buf_[a + 1] + (buf_[b + 1] - buf_[a + 1]) * f);
      pos_ += ratio_;
    }
    r_.store(uint64_t(pos_), std::memory_order_release);
  }

  double fill() const { return fillAvg_; }
  double ratioPpm() const { return (ratio_ - 1.0) * 1e6; }
  double target() const { return target_; }
  uint32_t underruns() const { return underruns_.load(std::memory_order_relaxed); }
  uint32_t overruns() const { return overruns_.load(std::memory_order_relaxed); }
  uint32_t skips() const { return skips_.load(std::memory_order_relaxed); }
  // frames that are written but not yet played (thread-safe estimate, for the writer side)
  uint32_t queued() const { return uint32_t(w_.load(std::memory_order_acquire) - r_.load(std::memory_order_acquire)); }

private:
  // The writer delivers in bursts (the audio of the host is made in blocks of the size of its device buffer). The margin must
  // hold one burst: go up at once when a larger burst is seen, and come down slowly (64 frames per 5 seconds) when it was a one-off.
  void adaptTarget(uint32_t n) {
    uint32_t seen = winMax_.load(std::memory_order_relaxed); if (maxChunk_ > seen) seen = maxChunk_;
    double need = seen * 1.1 + 64; if (need > maxTarget_) need = maxTarget_;
    double t = target_;
    if (need > t) { target_ = need; return; }
    sinceUnder_ += n;
    if (sinceUnder_ >= uint64_t(fs_ * 5)) {
      sinceUnder_ = 0; maxChunk_ = winMax_.exchange(0, std::memory_order_relaxed);
      double floorT = need > base_ ? need : base_;
      if (t > floorT) { t -= 64; target_ = t < floorT ? floorT : t; }
    }
  }
  static void silence(float* L, float* R, uint32_t from, uint32_t to) { for (uint32_t i = from; i < to; i++) L[i] = R[i] = 0.f; }
  std::vector<float> buf_;
  uint32_t cap_, mask_;
  double fs_ = 48000.0, base_ = 384.0, maxTarget_ = 2880.0;
  std::atomic<double> target_{384.0};
  std::atomic<uint64_t> w_{0}, r_{0};
  std::atomic<uint32_t> underruns_{0}, overruns_{0}, skips_{0};
  std::atomic<uint32_t> winMax_{0};   // largest write of this window (writer thread), taken over by the reader
  uint32_t maxChunk_ = 0;             // largest write of the previous window (reader thread)
  uint64_t sinceUnder_ = 0;           // frames read without an underrun (reader thread)
  double pos_ = 0, fillAvg_ = 384.0, ratio_ = 1.0; // reader thread only
  bool prefill_ = true;
};
