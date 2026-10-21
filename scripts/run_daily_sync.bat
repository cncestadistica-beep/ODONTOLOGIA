@echo off
setlocal enabledelayedexpansion

cd /d "g:\BACKUP\juan manuel\odontologia"
echo ======================================================== >> scripts\daily_sync.log
echo [ %DATE% %TIME% ] Iniciando sincronizacion diaria de datos (1:00 AM) >> scripts\daily_sync.log
echo ======================================================== >> scripts\daily_sync.log

echo [1/4] Sincronizando datos de Central de Especialistas y Ordenamientos V3... >> scripts\daily_sync.log
python scripts\sync_db.py >> scripts\daily_sync.log 2>&1

echo [2/4] Sincronizando Procedimientos Menores (Quirofanos-V3-juan)... >> scripts\daily_sync.log
python scripts\sync_procedimientos_menores.py >> scripts\daily_sync.log 2>&1

echo [3/4] Sincronizando detalle de citas y pacientes... >> scripts\daily_sync.log
python scripts\sync_appointments_detail.py >> scripts\daily_sync.log 2>&1

echo [4/4] Reconstruyendo frontend de produccion (Vite build)... >> scripts\daily_sync.log
call npm run build >> scripts\daily_sync.log 2>&1

echo [ %DATE% %TIME% ] Sincronizacion diaria completada con exito. >> scripts\daily_sync.log
echo ======================================================== >> scripts\daily_sync.log
