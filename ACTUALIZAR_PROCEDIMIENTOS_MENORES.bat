@echo off
chcp 65001 >nul
title Actualizador de Procedimientos Menores desde Quirofanos-V3-juan.sql
color 0b

echo ========================================================================
echo   ACTUALIZACION DE PROCEDIMIENTOS MENORES DESDE Quirofanos-V3-juan.sql
echo ========================================================================
echo.

cd /d "%~dp0"

echo [1/2] Ejecutando Quirofanos-V3-juan.sql contra PostgreSQL (icosalud_quinta)...
python scripts\sync_procedimientos_menores.py
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [ERROR] Hubo un problema al ejecutar la consulta SQL.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Recompilando frontend para produccion...
call npm run build
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [ERROR] Hubo un problema al compilar la aplicacion.
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================================================
echo   ¡DATOS DE PROCEDIMIENTOS MENORES ACTUALIZADOS CON EXITO DESDE SQL!
echo ========================================================================
echo.
pause
