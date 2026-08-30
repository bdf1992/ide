# Third-Party Components

Open Chat IDE intentionally reuses mature open-source browser components instead of recreating editor/runtime infrastructure.

Current browser-loaded dependencies:

- **Monaco Editor 0.56.0** — editor core from the VS Code project; loaded from jsDelivr.
- **xterm.js 6.0.0** — terminal UI component; loaded from jsDelivr.
- **Pyodide 314.0.6** — CPython/WebAssembly runtime for in-browser Python execution; loaded from jsDelivr.

Each dependency remains governed by its upstream license and notices. Contributors adding or upgrading dependencies should verify upstream licensing and update this file when the dependency is part of the durable core.

The license for this repository's own original code has not yet been declared. Choosing or changing that project license is an owner decision and should be handled explicitly rather than inferred during unrelated work.
