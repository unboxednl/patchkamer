// SPDX-License-Identifier: AGPL-3.0-or-later
// The audio device behind the app: a ring buffer (ring.h) that a device clock empties. The device is either an
// ASIO driver (Windows, when built with the ASIO SDK) or a test clock that makes no sound (every platform).
#pragma once
#include <cstdint>
#include <string>
#include <vector>

namespace pkengine {
extern const char* kTestClock;                 // name of the test clock in the list of devices

struct OpenArgs { std::string driver; double sampleRate = 48000; int bufferSize = 0; int pair = 0; double targetMs = 8; };
struct OpenInfo { std::string driver; double sampleRate = 0; int bufferSize = 0; int inputLatency = 0, outputLatency = 0;
                  int outputChannels = 0; int pair = 0; std::string sampleType; bool asio = false; };
struct Stats { uint64_t blocks = 0; uint32_t underruns = 0, overruns = 0, skips = 0; double fill = 0, target = 0, ratioPpm = 0;
               double peak = 0; bool running = false, resetRequested = false; int bufferSize = 0; double sampleRate = 0; };

bool asioAvailable();
std::vector<std::string> list();
bool open(const OpenArgs& a, OpenInfo& out, std::string& err);
bool start(std::string& err);
void stop();
void close();
bool controlPanel();
uint32_t write(const float* interleaved, uint32_t frames);  // stereo; returns the frames taken
Stats stats();
}
