@echo off
setlocal

rem HemoSync local station launcher. Run this file from any copied project folder.
set "ROOT=%~dp0"
set "WEB=%ROOT%web"
set "PORT=3000"
set "URL=http://localhost:%PORT%"

title HemoSync Local Station

echo.
echo ========================================
echo   HEMOSYNC LOCAL STATION
echo ========================================
echo.

if not exist "%WEB%\package.json" (
  echo ERROR: Missing "%WEB%\package.json".
  echo Keep this file beside HemoSync "web" folder.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not in PATH.
  echo Install Node.js LTS, then run this file again.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm is not available. Reinstall Node.js LTS.
  pause
  exit /b 1
)

echo Stopping existing app on port %PORT%...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /r /c:":%PORT% .*LISTENING"') do (
  taskkill /PID %%P /F >nul 2>nul
)

echo Preparing local application...
cd /d "%WEB%"
if not exist "node_modules" (
  echo Installing packages. First run may take a few minutes...
  call npm.cmd install
  if errorlevel 1 goto :failed
)

echo Building application...
call npm.cmd run build
if errorlevel 1 goto :failed

echo.
echo Starting HemoSync at %URL%
start "HemoSync Browser" "%URL%"
call npm.cmd run start
goto :end

:failed
echo.
echo HemoSync could not start. Read error above.
pause
exit /b 1

:end
endlocal
