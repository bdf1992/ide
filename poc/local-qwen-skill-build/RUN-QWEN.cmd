@echo off
setlocal
cd /d "%~dp0\..\.."
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 18+ is required for this POC.
  echo Install Node.js, then run this file again.
  pause
  exit /b 1
)

echo Running local Qwen skill-build advisor...
echo.
node poc\local-qwen-skill-build\run-local.mjs --scenario trace
set EXIT_CODE=%ERRORLEVEL%
echo.
if not "%EXIT_CODE%"=="0" (
  echo If no endpoint was found, start the Qwen workbench first:
  echo   1 = one-click llama.cpp + Qwen + Computer
  echo   2 = one-click Ollama + Qwen + Computer
  echo   7/8/9 = start llama.cpp directly
  echo   10 = test llama.cpp endpoint
)
pause
exit /b %EXIT_CODE%
