@echo off
title Emprime Baskı & Renk Ayrımı Stüdyosu
echo ========================================================
echo    Emprime Baskı & Film Stüdyosu Başlatılıyor...
echo    Port: 8002
echo ========================================================
echo.
cd /d "%~dp0"
python -m pip install -r requirements.txt
echo.
echo Tarayıcınızda açılıyor: http://127.0.0.1:8002
start http://127.0.0.1:8002
python -m uvicorn app:app --host 127.0.0.1 --port 8002 --reload
pause
