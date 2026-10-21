import json
import os
import sys
from collections import defaultdict

import psycopg2
from dotenv import load_dotenv

load_dotenv()
params = json.loads(sys.argv[1])
year = int(params.get('year', 2026))
month = int(params.get('month', 1))
specialty = params.get('specialty', '')
specialist = params.get('specialist', '')
kind = params.get('type', 'PRIMERA_VEZ')

conn = psycopg2.connect(
    host=os.getenv('DB_HOST', '172.21.21.37'),
    port=os.getenv('DB_PORT', '5432'),
    dbname=os.getenv('DB_NAME', 'icosalud_quinta'),
    user=os.getenv('DB_USER', 'postgres'),
    password=os.getenv('DB_PASSWORD'),
    connect_timeout=15,
)
cur = conn.cursor()
query = '''
WITH citas AS (
  SELECT
    COALESCE(NULLIF(TRIM(c.cedula), ''), NULLIF(TRIM(c.historia), ''), NULLIF(TRIM(c.nombre), ''), 'SIN IDENTIFICACIÓN') AS paciente,
    NULLIF(TRIM(c.nombre), '') AS nombre_paciente,
    NULLIF(TRIM(c.cedula), '') AS identificacion,
    c.fecha_hora,
    TRIM(t.nombre) AS especialista,
    COALESCE(TRIM(e.descripcion), 'MEDICINA GENERAL') AS especialidad,
    c.ind_cumplida,
    CASE
      WHEN s.descripcion ILIKE '%%PRIMERA VEZ%%' OR c.servicio LIKE '8902%%' OR c.ind_primera_vez = 'S' THEN 'PRIMERA_VEZ'
      WHEN s.descripcion ILIKE '%%CONTROL%%' OR c.servicio LIKE '8903%%' THEN 'CONTROL'
      ELSE 'OTRA'
    END AS tipo
  FROM cita c
  JOIN tercero t ON t.tercero = c.tercero
  LEFT JOIN especialidad e ON e.especialidad = COALESCE(c.especialidad, t.especialidad)
  LEFT JOIN servicio s ON s.servicio = c.servicio AND s.concepto = c.concepto
  WHERE c.concepto = 'HONO' AND c.estado = 'A'
    AND t.tercero NOT IN ('55555')
    AND c.fecha_hora >= make_date(%s, %s, 1)
    AND c.fecha_hora < (make_date(%s, %s, 1) + interval '1 month')
    AND (%s = '' OR COALESCE(TRIM(e.descripcion), 'MEDICINA GENERAL') = %s)
    AND (%s = '' OR TRIM(t.nombre) = %s)
)
SELECT paciente, nombre_paciente, identificacion, fecha_hora, especialista, especialidad, ind_cumplida, tipo
FROM citas ORDER BY paciente, fecha_hora;
'''
cur.execute(query, (year, month, year, month, specialty, specialty, specialist, specialist))

patients = defaultdict(lambda: {'paciente': '', 'nombre': '', 'identificacion': '', 'controles': 0, 'citas': 0, 'doctores': set(), 'fechas': [], 'asistieron': 0, 'no_asistieron': 0, 'tipos': set()})
for patient, patient_name, identification, date, doctor, current_specialty, attended, current_type in cur.fetchall():
    item = patients[patient]
    item['paciente'] = patient
    item['nombre'] = patient_name or item['nombre'] or 'Nombre no registrado'
    item['identificacion'] = identification or item['identificacion'] or patient
    item['citas'] += 1
    item['doctores'].add(doctor or 'Sin especialista')
    item['fechas'].append(date.strftime('%Y-%m-%d %H:%M'))
    item['tipos'].add(current_type)
    if current_type == 'CONTROL':
        item['controles'] += 1
    if attended == 'S':
        item['asistieron'] += 1
    else:
        item['no_asistieron'] += 1

result = []
for item in patients.values():
    if kind not in item['tipos']:
        continue
    item.pop('tipos', None)
    item['doctores'] = sorted(item['doctores'])
    item['cantidad_doctores'] = len(item['doctores'])
    item['mas_de_tres_controles'] = item['controles'] > 3
    result.append(item)

print(json.dumps({'tipo': kind, 'anio': year, 'mes': month, 'totalPacientes': len(result), 'pacientes': result}, ensure_ascii=False, default=str))
cur.close()
conn.close()
