@echo off
chcp 65001 >nul
title Actualizador de Datos - Clinica Nuestra
color 0b

echo ========================================================================
echo        SISTEMA DE ACTUALIZACION DE DATOS ESTADISTICOS
echo   CENTRAL DE ESPECIALISTAS - CIS EMCALI - ODONTOLOGIA - PROCEDIMIENTOS
echo ========================================================================
echo.

cd /d "%~dp0"

echo [1/4] Sincronizando Central de Especialistas desde PostgreSQL...
python scripts\sync_db.py
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [ERROR] Hubo un problema al sincronizar Central de Especialistas.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/4] Sincronizando Procedimientos Menores desde PostgreSQL...
python scripts\sync_procedimientos_menores.py
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [ERROR] Hubo un problema al sincronizar Procedimientos Menores.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/4] Procesando datos ambulatorios CIS EMCALI y Odontologia...
call node process_ambulatorio_csv.js
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [ERROR] Hubo un problema al procesar los archivos CSV ambulatorios.
    pause
    exit /b %errorlevel%
)

echo.
echo [4/4] Compilando frontend de produccion (npm run build)...
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
echo   ¡TODOS LOS DATOS Y MODELOS FUERON ACTUALIZADOS CON EXITO!
echo ========================================================================
echo.
pause
