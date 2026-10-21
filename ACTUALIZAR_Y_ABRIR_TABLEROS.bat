@echo off
chcp 65001 >nul
title Actualizador y Lanzador de Tableros Estadisticos - Clinica Nuestra
color 0b

echo ========================================================================
echo        SISTEMA DE ACTUALIZACION Y CARGA DE DATOS ESTADISTICOS
echo   CENTRAL DE ESPECIALISTAS - CIS EMCALI - ODONTOLOGIA - PROCEDIMIENTOS
echo ========================================================================
echo.

cd /d "%~dp0"

echo [1/6] Sincronizando metricas de Central de Especialistas desde PostgreSQL...
python scripts\sync_db.py
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [ERROR] Hubo un problema al sincronizar Central de Especialistas.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/6] Sincronizando detalle de citas y ordenes de Central de Especialistas...
python scripts\sync_appointments_detail.py
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [ERROR] Hubo un problema al sincronizar detalle de ordenes de Central de Especialistas.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/6] Sincronizando Procedimientos Menores desde PostgreSQL (Quirofanos-V3-juan)...
python scripts\sync_procedimientos_menores.py
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [ERROR] Hubo un problema al sincronizar Procedimientos Menores.
    pause
    exit /b %errorlevel%
)

echo.
echo [4/6] Procesando datos ambulatorios CIS EMCALI y Odontologia...
call node process_ambulatorio_csv.js
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [ERROR] Hubo un problema al procesar los archivos CSV ambulatorios.
    pause
    exit /b %errorlevel%
)

echo.
echo [5/6] Compilando y empaquetando la aplicacion web...
call npm run build
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [ERROR] Hubo un problema al compilar la aplicacion.
    pause
    exit /b %errorlevel%
)

echo.
echo [6/6] Iniciando el servidor y abriendo los tableros en tu navegador...
echo.
echo Los tableros se abriran automaticamente en tu navegador web predeterminado.
echo Puedes mantener esta ventana abierta mientras utilizas la aplicacion.
echo.
call npx vite --open
