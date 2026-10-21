@echo off
chcp 65001 >nul
title Actualizador y Lanzador de Tableros - CIS EMCALI, Odontologia y Procedimientos Menores
color 0b

echo ========================================================================
echo        SISTEMA DE ACTUALIZACION Y CARGA DE DATOS ESTADISTICOS
echo            CIS EMCALI - ODONTOLOGIA - PROCEDIMIENTOS MENORES
echo ========================================================================
echo.

cd /d "%~dp0"

echo [1/4] Procesando consultas_ambulatorio.csv y ordenamientos_ambulatorio.csv...
call node process_ambulatorio_csv.js
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [ERROR] Hubo un problema al procesar los archivos CSV.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/4] Sincronizando Procedimientos Menores desde PostgreSQL (Quirofanos-V3-juan)...
python scripts\sync_procedimientos_menores.py
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [ERROR] Hubo un problema al sincronizar Procedimientos Menores.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/4] Compilando y empaquetando la aplicacion web...
call npm run build
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [ERROR] Hubo un problema al compilar la aplicacion.
    pause
    exit /b %errorlevel%
)

echo.
echo [4/4] Iniciando el servidor y abriendo los tableros en tu navegador...
echo.
echo Los tableros se abriran automaticamente en tu navegador web predeterminado.
echo Puedes mantener esta ventana abierta mientras utilizas la aplicacion.
echo.
call npx vite --open
