"""
Servicio en segundo plano de sincronización continua.
Ejecuta Quirofanos-V3-juan.sql contra PostgreSQL de forma periódica
(por defecto cada 15 minutos) para que el tablero se mantenga actualizado
constantemente sin requerir intervención manual.
"""

import os
import sys
import time
import subprocess

INTERVAL_MINUTES = int(os.getenv('SYNC_INTERVAL_MINUTES', '15'))
INTERVAL_SECONDS = INTERVAL_MINUTES * 60

print("=" * 70)
print("SERVICIO DE AUTO-ACTUALIZACION CONTINUA DESDE ARCHIVOS SQL")
print(f"Intervalo de sincronización: cada {INTERVAL_MINUTES} minutos.")
print("Presiona Ctrl + C para detener el servicio.")
print("=" * 70)

while True:
    try:
        now_str = time.strftime('%Y-%m-%d %H:%M:%S')
        print(f"\n[{now_str}] Iniciando sincronización automática desde Quirofanos-V3-juan.sql...")
        
        # Ejecutar sync_procedimientos_menores.py
        result = subprocess.run([sys.executable, 'scripts/sync_procedimientos_menores.py'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"[{time.strftime('%H:%M:%S')}] ✓ Procedimientos Menores actualizados con éxito desde SQL.")
        else:
            print(f"[{time.strftime('%H:%M:%S')}] [ERROR] {result.stderr or result.stdout}")

        print(f"Próxima actualización en {INTERVAL_MINUTES} minutos. Esperando...")
        time.sleep(INTERVAL_SECONDS)
    except KeyboardInterrupt:
        print("\nServicio de auto-actualización detenido por el usuario.")
        break
    except Exception as e:
        print(f"[ERROR INESPERADO]: {e}")
        time.sleep(60)
