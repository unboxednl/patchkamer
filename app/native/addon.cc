// SPDX-License-Identifier: AGPL-3.0-or-later
// Node addon (N-API) around engine.h. All calls come from the JavaScript thread; only the device thread
// touches the ring buffer besides, through atomics.
#include <napi.h>
#include "engine.h"

namespace {
using namespace pkengine;

Napi::Value List(const Napi::CallbackInfo& i) {
  Napi::Env env = i.Env(); auto v = list(); Napi::Array a = Napi::Array::New(env, v.size());
  for (size_t k = 0; k < v.size(); k++) a.Set((uint32_t)k, Napi::String::New(env, v[k]));
  return a;
}
Napi::Value Available(const Napi::CallbackInfo& i) { return Napi::Boolean::New(i.Env(), asioAvailable()); }

Napi::Value Open(const Napi::CallbackInfo& i) {
  Napi::Env env = i.Env(); OpenArgs a; Napi::Object r = Napi::Object::New(env);
  if (i.Length() > 0 && i[0].IsObject()) {
    Napi::Object o = i[0].As<Napi::Object>();
    if (o.Has("driver")) a.driver = o.Get("driver").ToString().Utf8Value();
    if (o.Has("sampleRate")) a.sampleRate = o.Get("sampleRate").ToNumber().DoubleValue();
    if (o.Has("bufferSize")) a.bufferSize = o.Get("bufferSize").ToNumber().Int32Value();
    if (o.Has("pair")) a.pair = o.Get("pair").ToNumber().Int32Value();
    if (o.Has("targetMs")) a.targetMs = o.Get("targetMs").ToNumber().DoubleValue();
  }
  OpenInfo info; std::string err;
  if (!open(a, info, err)) { r.Set("ok", false); r.Set("error", err); return r; }
  r.Set("ok", true); r.Set("driver", info.driver); r.Set("asio", info.asio); r.Set("sampleRate", info.sampleRate); r.Set("bufferSize", info.bufferSize);
  r.Set("inputLatency", info.inputLatency); r.Set("outputLatency", info.outputLatency); r.Set("outputChannels", info.outputChannels);
  r.Set("pair", info.pair); r.Set("sampleType", info.sampleType);
  return r;
}
Napi::Value Start(const Napi::CallbackInfo& i) {
  std::string err; bool ok = start(err); Napi::Object r = Napi::Object::New(i.Env()); r.Set("ok", ok); if (!ok) r.Set("error", err); return r;
}
Napi::Value Stop(const Napi::CallbackInfo& i) { stop(); return i.Env().Undefined(); }
Napi::Value Close(const Napi::CallbackInfo& i) { close(); return i.Env().Undefined(); }
Napi::Value Panel(const Napi::CallbackInfo& i) { return Napi::Boolean::New(i.Env(), controlPanel()); }

// write(Float32Array interleaved stereo) -> frames taken
Napi::Value Write(const Napi::CallbackInfo& i) {
  Napi::Env env = i.Env();
  if (i.Length() < 1 || !i[0].IsTypedArray() || i[0].As<Napi::TypedArray>().TypedArrayType() != napi_float32_array) {
    Napi::TypeError::New(env, "write needs a Float32Array").ThrowAsJavaScriptException(); return env.Undefined(); }
  Napi::Float32Array f = i[0].As<Napi::Float32Array>();
  return Napi::Number::New(env, write(f.Data(), (uint32_t)(f.ElementLength() / 2)));
}
Napi::Value StatsFn(const Napi::CallbackInfo& i) {
  Napi::Env env = i.Env(); Stats s = stats(); Napi::Object r = Napi::Object::New(env);
  r.Set("blocks", (double)s.blocks); r.Set("underruns", s.underruns); r.Set("overruns", s.overruns); r.Set("skips", s.skips);
  r.Set("fill", s.fill); r.Set("target", s.target); r.Set("ratioPpm", s.ratioPpm); r.Set("peak", s.peak); r.Set("running", s.running);
  r.Set("resetRequested", s.resetRequested); r.Set("bufferSize", s.bufferSize); r.Set("sampleRate", s.sampleRate);
  return r;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("asioAvailable", Napi::Function::New(env, Available));
  exports.Set("list", Napi::Function::New(env, List));
  exports.Set("open", Napi::Function::New(env, Open));
  exports.Set("start", Napi::Function::New(env, Start));
  exports.Set("stop", Napi::Function::New(env, Stop));
  exports.Set("close", Napi::Function::New(env, Close));
  exports.Set("controlPanel", Napi::Function::New(env, Panel));
  exports.Set("write", Napi::Function::New(env, Write));
  exports.Set("stats", Napi::Function::New(env, StatsFn));
  return exports;
}
}  // namespace
NODE_API_MODULE(patchkamer_asio, Init)
