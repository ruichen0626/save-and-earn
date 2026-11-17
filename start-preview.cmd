@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install the LTS version from https://nodejs.org/
  pause
  exit /b 1
)
echo Save and Earn local preview
echo Open http://127.0.0.1:4173 in your browser.
echo Keep this window open while viewing the website.
echo Press Ctrl+C to stop.
echo.
node "%~dp0server.mjs"
if errorlevel 1 pause
