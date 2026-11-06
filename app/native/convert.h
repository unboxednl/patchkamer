// SPDX-License-Identifier: AGPL-3.0-or-later
// Converts float samples (-1..1) to the sample types of an ASIO driver. The numbers of the types are those of ASIO.
#pragma once
#include <cmath>
#include <cstdint>
#include <cstring>

namespace pkconv {
enum { Int16LSB = 16, Int24LSB = 17, Int32LSB = 18, Float32LSB = 19, Float64LSB = 20, Int32LSB24 = 27 };

inline bool supported(int t) { return t == Int16LSB || t == Int24LSB || t == Int32LSB || t == Float32LSB || t == Float64LSB || t == Int32LSB24; }
inline const char* name(int t) {
  switch (t) { case Int16LSB: return "Int16LSB"; case Int24LSB: return "Int24LSB"; case Int32LSB: return "Int32LSB";
    case Float32LSB: return "Float32LSB"; case Float64LSB: return "Float64LSB"; case Int32LSB24: return "Int32LSB24"; default: return "other"; }
}
inline float clean(float x) { if (!(x == x)) return 0.f; return x > 1.f ? 1.f : (x < -1.f ? -1.f : x); } // NaN -> 0, clip

// n samples of one channel from src to the buffer of the driver
inline void write(void* dst, int type, const float* src, int n) {
  switch (type) {
    case Int16LSB: { int16_t* d = (int16_t*)dst; for (int i = 0; i < n; i++) d[i] = (int16_t)std::lrint(clean(src[i]) * 32767.0); break; }
    case Int24LSB: { uint8_t* d = (uint8_t*)dst; for (int i = 0; i < n; i++) { int32_t v = (int32_t)std::lrint(clean(src[i]) * 8388607.0); d[3*i] = v & 255; d[3*i+1] = (v >> 8) & 255; d[3*i+2] = (v >> 16) & 255; } break; }
    case Int32LSB: { int32_t* d = (int32_t*)dst; for (int i = 0; i < n; i++) d[i] = (int32_t)std::lrint(clean(src[i]) * 2147483647.0); break; }
    case Int32LSB24: { int32_t* d = (int32_t*)dst; for (int i = 0; i < n; i++) d[i] = (int32_t)std::lrint(clean(src[i]) * 8388607.0); break; }
    case Float32LSB: { float* d = (float*)dst; for (int i = 0; i < n; i++) d[i] = clean(src[i]); break; }
    case Float64LSB: { double* d = (double*)dst; for (int i = 0; i < n; i++) d[i] = clean(src[i]); break; }
    default: break;
  }
}
// silence in the type of the driver
inline void zero(void* dst, int type, int n) {
  int bytes = (type == Int16LSB) ? 2 : (type == Int24LSB) ? 3 : (type == Float64LSB) ? 8 : 4;
  std::memset(dst, 0, size_t(bytes) * size_t(n));
}
}
