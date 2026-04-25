#include "tree_sitter/parser.h"
#include <napi.h>

extern "C" TSLanguage *tree_sitter_achitekfile();

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports["name"] = Napi::String::New(env, "achitekfile");
  exports["language"] = Napi::External<TSLanguage>::New(env, tree_sitter_achitekfile());
  return exports;
}

NODE_API_MODULE(tree_sitter_achitekfile_binding, Init)
