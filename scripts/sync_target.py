"""
Helper para sincronización modular por tablero.
Ejecuta las consultas SQL correspondientes a cada dominio y devuelve el JSON fresco.
Uso: python scripts/sync_target.py <especialistas|cisen|odontologia|procedimientos|asistencia>
"""

import sys
import os
import json
import subprocess

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

target = sys.argv[1].lower() if len(sys.argv) > 1 else 'all'

try:
    if target == 'especialistas':
        # 1. Metricas y ordenes desde SQL
        subprocess.run([sys.executable, 'scripts/sync_db.py'], check=True)
        # 2. Detalle de prescripciones y citas
        subprocess.run([sys.executable, 'scripts/sync_appointments_detail.py'], check=True)
        with open('src/data/centralEspecialistasData.json', 'r', encoding='utf-8') as f:
            sys.stdout.write(f.read())

    elif target in ('cisen', 'odontologia'):
        # 1. Extraccion SQL directa de consultas y ordenamientos ambulatorios
        subprocess.run([sys.executable, 'scripts/sync_ambulatorio_from_db.py'], check=True)
        # 2. Procesamiento de modelos y particiones mensuales
        subprocess.run(['node', 'process_ambulatorio_csv.js'], check=True, shell=True)
        file_to_read = 'src/data/cisenData.json' if target == 'cisen' else 'src/data/odontologiaData.json'
        with open(file_to_read, 'r', encoding='utf-8') as f:
            sys.stdout.write(f.read())

    elif target in ('procedimientos', 'procedimientos-menores'):
        # 1. Extraccion directa de Quirofanos-V3-juan.sql
        subprocess.run([sys.executable, 'scripts/sync_procedimientos_menores.py'], check=True)
        with open('src/data/procedimientosMenoresData.json', 'r', encoding='utf-8') as f:
            sys.stdout.write(f.read())

    elif target == 'asistencia':
        if os.path.exists('scripts/sync_attendance.py'):
            subprocess.run([sys.executable, 'scripts/sync_attendance.py'], check=True)
        sys.stdout.write(json.dumps({"success": True, "message": "Asistencias sincronizadas"}))

    else:
        sys.stderr.write(f"Target desconocido: {target}\n")
        sys.exit(1)

except Exception as e:
    sys.stderr.write(f"Error sincronizando {target}: {str(e)}\n")
    sys.exit(1)
