@echo off
setlocal
cd /d "%~dp0"

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\open-preview.ps1" %*
set "PREVIEW_EXIT_CODE=%ERRORLEVEL%"

if not "%PREVIEW_EXIT_CODE%"=="0" (
  echo.
  echo Apollo 11 preview could not be started. Review the message above.
  pause
)

exit /b %PREVIEW_EXIT_CODE%
