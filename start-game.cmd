@echo off
cd /d "%~dp0"
if not exist ".output\server\index.mjs" (
  call npm run build
  if errorlevel 1 exit /b 1
)
set NITRO_HOST=127.0.0.1
set NITRO_PORT=4173
echo Kanafall: abri http://127.0.0.1:4173 en tu navegador.
echo Deja esta ventana abierta mientras jugas. Ctrl+C para cerrar.
node .output/server/index.mjs
pause
