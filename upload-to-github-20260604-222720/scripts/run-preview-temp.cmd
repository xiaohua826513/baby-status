@echo off
cd /d "%~dp0"
set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

echo Starting baby preview server...
echo Open: http://127.0.0.1:3000/baby
echo Keep this window open while previewing.
echo.

"%NODE_EXE%" "local-preview-server.cjs"

echo.
echo Server stopped. Press any key to close this window.
pause >nul
