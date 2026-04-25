default:
  @just --list

# 🧪 Run tests
test:
  tree-sitter test

# 💅 Lint project
lint:
  oxlint grammar.js bindings/**/*.js

# 🏗️ Generate
generate:
  tree-sitter generate;

# 🛠️ Run build
build: generate
  tree-sitter build

# 🛠️ Run build for wasm
build-wasm: generate
  tree-sitter build --wasm

# 🛝 Run Tree Sitter playground
play:
  tree-sitter playground
