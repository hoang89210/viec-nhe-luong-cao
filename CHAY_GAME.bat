@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Dang mo game Viec Nhe Luong Cao tai http://localhost:8000 ...
echo (Dong cua so nay de tat game)
start "" http://localhost:8000
python -m http.server 8000
if errorlevel 1 py -m http.server 8000
pause
