@echo off
echo === Iniciando Ngrok para el frontend en el puerto 5173 ===
cd %~dp0
ngrok http 5173
pause
