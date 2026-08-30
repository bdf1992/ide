(function (root, factory) {
  const api = factory(root.OpenChatWorkspaceMaterialization);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenChatPyodideWorkspace = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (materializationApi) {
  'use strict';

  if (!materializationApi) throw new Error('OpenChatWorkspaceMaterialization must load before pyodide-adapter.js.');

  class PyodideFilesystemAdapter {
    constructor(pyodide) {
      if (!pyodide?.FS || typeof pyodide.runPythonAsync !== 'function') throw new Error('A loaded Pyodide runtime is required.');
      this.pyodide = pyodide;
    }

    async withGlobal(name, value, fn) {
      this.pyodide.globals.set(name, value);
      try {
        return await fn();
      } finally {
        try { this.pyodide.globals.delete(name); } catch {}
      }
    }

    async resetRoot(rootPath) {
      return this.withGlobal('__oc_root__', rootPath, () => this.pyodide.runPythonAsync(
        "import pathlib, shutil\nshutil.rmtree(__oc_root__, ignore_errors=True)\npathlib.Path(__oc_root__).mkdir(parents=True, exist_ok=True)"
      ));
    }

    async mkdir(path) {
      return this.withGlobal('__oc_path__', path, () => this.pyodide.runPythonAsync(
        "import pathlib\npathlib.Path(__oc_path__).mkdir(parents=True, exist_ok=True)"
      ));
    }

    async writeFile(path, content) {
      this.pyodide.FS.writeFile(path, content, { encoding: 'utf8' });
    }

    exists(path) {
      try {
        return Boolean(this.pyodide.FS.analyzePath(path).exists);
      } catch {
        return false;
      }
    }
  }

  async function runPythonFile(pyodide, descriptor, entryPath) {
    if (!descriptor || descriptor.protocol !== 'WORKSPACE_MATERIALIZATION/1') throw new Error('Expected WORKSPACE_MATERIALIZATION/1.');
    const relative = materializationApi.normalizeWorkspacePath(entryPath);
    const fullPath = `${descriptor.root}/${relative}`;
    pyodide.globals.set('__oc_view_root__', descriptor.root);
    pyodide.globals.set('__oc_entry__', fullPath);
    try {
      const raw = await pyodide.runPythonAsync(`
import contextlib, io, json, os, runpy, sys, traceback
_root = os.path.realpath(__oc_view_root__)
_entry = os.path.realpath(__oc_entry__)
_parent = os.path.dirname(_entry)
_buf = io.StringIO()
_error = None
_old_cwd = os.getcwd()
_old_path = list(sys.path)
try:
    for _name, _module in list(sys.modules.items()):
        _file = getattr(_module, "__file__", None)
        if _file:
            try:
                _resolved = os.path.realpath(_file)
                if _resolved == _root or _resolved.startswith(_root + os.sep):
                    del sys.modules[_name]
            except Exception:
                pass
    os.chdir(_parent)
    sys.path.insert(0, _parent)
    with contextlib.redirect_stdout(_buf), contextlib.redirect_stderr(_buf):
        runpy.run_path(_entry, run_name="__main__")
except Exception:
    _error = traceback.format_exc()
finally:
    os.chdir(_old_cwd)
    sys.path[:] = _old_path
json.dumps({"stdout": _buf.getvalue(), "error": _error, "entry": _entry})
`);
      const parsed = JSON.parse(String(raw));
      return {
        status: parsed.error ? 'failed' : 'completed',
        stdout: parsed.stdout || '',
        error: parsed.error || null,
        entry: parsed.entry,
        materialization: {
          revision: descriptor.revision,
          root: descriptor.root,
          manifest_id: descriptor.manifest_id,
        },
      };
    } finally {
      try { pyodide.globals.delete('__oc_view_root__'); } catch {}
      try { pyodide.globals.delete('__oc_entry__'); } catch {}
    }
  }

  return Object.freeze({ PyodideFilesystemAdapter, runPythonFile });
});
