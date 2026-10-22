@echo off
chcp 65001 >nul
title Servicio de Auto-Actualización Continua desde SQL - Clinica Nuestra
color 0a

echo ========================================================================
echo   INICIANDO SERVICIO DE ACTUALIZACION CONTINUA EN SEGUNDO PLANO
echo ========================================================================
echo.
echo Este proceso ejecutará los archivos SQL contra la base de datos PostgreSQL
echo periódicamente (cada 15 minutos) de forma automática.
echo.
echo Puedes minimizar esta ventana para que siga trabajando en segundo plano.
echo.

cd /d "%~dp0"
python scripts\auto_sync_procedimientos_loop.py
pause
