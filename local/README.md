# Local Workbench Adapter

This optional adapter serves the same `index.html` used by the in-chat IDE. It does
not create a second workspace, semantic kernel, or authority path.

It is deliberately **not an MCP server**. These are same-origin browser HTTP routes.
A later MCP binding can expose the same transport-neutral capability names after the
workspace contract is extracted without pretending it can see browser-local state.

## Start the IDE

Windows PowerShell:

```powershell
.\local\start.ps1
```

macOS, Linux, or WSL:

```bash
./local/start.sh
```

Then open `http://127.0.0.1:4310`. The server uses only the Python standard library.
It binds to loopback by default.

## Connect an optional model

Start any OpenAI-compatible local inference server on loopback, then point the IDE
adapter at it:

```powershell
.\local\start.ps1 `
  -ModelUrl http://127.0.0.1:8000 `
  -Model Qwen3-VL-4B-Instruct
```

```bash
./local/start.sh \
  --model-url http://127.0.0.1:8000 \
  --model Qwen3-VL-4B-Instruct
```

The model server must provide:

- `GET /v1/models`
- `POST /v1/chat/completions`

The adapter exposes these local HTTP routes to the browser IDE:

| Route | Capability | Authority |
|---|---|---|
| `GET /api/health` | bridge discovery | availability evidence only |
| `GET /api/model/health` | `model.health` | availability evidence only |
| `POST /api/model/propose` | `semantic.propose` | untrusted candidate only |

`semantic.propose` requires a valid `SEMANTIC_PROPOSAL/1` envelope. A proposed result
must include `TSR/0.1` typed structure. The bridge does not admit the proposal, execute
it, apply a patch, or grant S-level standing.

## Browser workspace custody

The browser remains the workspace owner. The local server never reads or writes its
files. The IDE sends one explicit source snapshot when the user requests a proposal.
Use the Explorer import/export controls to move a versioned `IDE_WORKSPACE/1` snapshot
between browsers.

## Run tests

```bash
python3 -m unittest local.tests.test_server -v
```

These tests use a fake OpenAI-compatible endpoint and do not download or invoke model
weights.
