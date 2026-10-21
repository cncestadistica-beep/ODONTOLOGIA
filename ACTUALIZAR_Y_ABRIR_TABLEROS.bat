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

echo [1/6] Sincronizando metricas de Central de Especialistas desde PostgreSQL (Ordenamientos_V3_Juan.sql)...
python scripts\sync_db.py
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [ERROR] Hubo un problema al sincronizar Central de Especialistas.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/6] Sincronizando detalle de citas y prescripciones de Central de Especialistas...
python scripts\sync_appointments_detail.py
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [ERROR] Hubo un problema al sincronizar detalle de citas de Central de Especialistas.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/6] Sincronizando Procedimientos Menores desde PostgreSQL (Quirofanos-V3-juan.sql)...
python scripts\sync_procedimientos_menores.py
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [ERROR] Hubo un problema al sincronizar Procedimientos Menores.
    pause
    exit /b %errorlevel%
)

echo.
echo [4/6] Extrayendo CIS EMCALI y Odontologia desde PostgreSQL mediante archivos SQL optimizados...
python scripts\sync_ambulatorio_from_db.py
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [ERROR] Hubo un problema al extraer datos ambulatorios desde PostgreSQL.
    pause
    exit /b %errorlevel%
)

echo.
echo [5/6] Procesando modelos y fragmentos mensuales de CIS EMCALI y Odontologia...
call node process_ambulatorio_csv.js
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [ERROR] Hubo un problema al procesar los modelos de CIS EMCALI y Odontologia.
    pause
    exit /b %errorlevel%
)

echo.
echo [6/6] Compilando frontend ultrarrapido de produccion...
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
echo   ¡DATOS ACTUALIZADOS CON EXITO! INICIANDO SERVIDOR Y NAVEGADOR...
echo ========================================================================
echo.
call npx vite --open
