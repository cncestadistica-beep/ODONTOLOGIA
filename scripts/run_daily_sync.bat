@echo off
setlocal enabledelayedexpansion

cd /d "g:\BACKUP\juan manuel\odontologia"
echo ======================================================== >> scripts\daily_sync.log
echo [ %DATE% %TIME% ] Iniciando sincronizacion automatica de datos >> scripts\daily_sync.log
echo ======================================================== >> scripts\daily_sync.log

echo [1/5] Sincronizando metricas de Central de Especialistas desde PostgreSQL... >> scripts\daily_sync.log
python scripts\sync_db.py >> scripts\daily_sync.log 2>&1

echo [2/5] Sincronizando detalle de citas y ordenes de Central de Especialistas... >> scripts\daily_sync.log
python scripts\sync_appointments_detail.py >> scripts\daily_sync.log 2>&1

echo [3/5] Sincronizando Procedimientos Menores desde PostgreSQL... >> scripts\daily_sync.log
python scripts\sync_procedimientos_menores.py >> scripts\daily_sync.log 2>&1

echo [4/5] Extrayendo CIS EMCALI y Odontologia desde PostgreSQL mediante SQL... >> scripts\daily_sync.log
python scripts\sync_ambulatorio_from_db.py >> scripts\daily_sync.log 2>&1

echo [5/5] Procesando datos ambulatorios CIS EMCALI y Odontologia... >> scripts\daily_sync.log
call node process_ambulatorio_csv.js >> scripts\daily_sync.log 2>&1

echo [Compilacion] Reconstruyendo frontend de produccion (npm run build)... >> scripts\daily_sync.log
call npm run build >> scripts\daily_sync.log 2>&1

echo [ %DATE% %TIME% ] Sincronizacion completada con exito. >> scripts\daily_sync.log
echo ======================================================== >> scripts\daily_sync.log
