# Third-Party Components

Open Chat IDE intentionally reuses mature open-source browser components instead of recreating editor/runtime infrastructure.

Current browser-loaded dependencies:

- **Monaco Editor 0.56.0** — editor core from the VS Code project; loaded from jsDelivr.
- **xterm.js 6.0.0** — terminal UI component; loaded from jsDelivr.
- **Pyodide 314.0.6** — CPython/WebAssembly runtime for in-browser Python execution; loaded from jsDelivr.

Each dependency remains governed by its upstream license and notices. Contributors adding or upgrading dependencies should verify upstream licensing and update this file when the dependency is part of the durable core.

Experimental/browser POC dependencies:

- **@vscode/tree-sitter-wasm 0.3.1** — MIT-licensed prebuilt Tree-sitter browser runtime and grammar WASM files used by VS Code; loaded from jsDelivr only by `poc/provider-syntax/`. The POC uses the package's matching `tree-sitter.js`, `tree-sitter.wasm`, and `tree-sitter-python.wasm` assets as one compatibility set. It is not yet a stable IDE dependency.

Experimental/offline tooling:

- **Pillow 12.3.0** — pinned only for deterministic visual-corpus rendering under
  `poc/neural-elaboration/`; it is not loaded by the IDE.
- **Qwen3-VL / qwen-vl-finetune** — optional open-weight model and upstream training
  framework for the POC 0.2 candidate. No model weights or training framework code are
  vendored into this repository.

The license for this repository's own original code has not yet been declared. Choosing or changing that project license is an owner decision and should be handled explicitly rather than inferred during unrelated work.
