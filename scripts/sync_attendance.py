"""Read-only attendance snapshot: one appointment, one consultation category."""
import json
import os
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / '.env')
with psycopg2.connect(host=os.environ['DB_HOST'], port=os.getenv('DB_PORT', '5432'),
                     dbname=os.environ['DB_NAME'], user=os.environ['DB_USER'],
                     password=os.environ['DB_PASSWORD'], connect_timeout=15) as conn:
    conn.set_session(readonly=True)
    with conn.cursor() as cur:
        cur.execute("""
          WITH appointments AS (
            SELECT EXTRACT(year FROM c.fecha_hora)::int AS year,
                   EXTRACT(month FROM c.fecha_hora)::int AS month,
                   COALESCE(TRIM(e.descripcion), 'MEDICINA GENERAL') AS specialty,
                   TRIM(t.nombre) AS specialist,
                   c.ind_cumplida = 'S' AS attended,
                   CASE WHEN c.servicio LIKE '8902%' OR c.ind_primera_vez = 'S'
                          OR EXISTS (SELECT 1 FROM servicio s WHERE s.servicio=c.servicio
                            AND s.concepto=c.concepto AND s.descripcion ILIKE '%PRIMERA VEZ%')
                        THEN 'primeraVez'
                        WHEN c.servicio LIKE '8903%'
                          OR EXISTS (SELECT 1 FROM servicio s WHERE s.servicio=c.servicio
                            AND s.concepto=c.concepto AND s.descripcion ILIKE '%CONTROL%')
                        THEN 'control' ELSE 'otras' END AS kind
            FROM cita c
            JOIN tercero t ON t.tercero=c.tercero
            LEFT JOIN especialidad e ON e.especialidad=COALESCE(c.especialidad,t.especialidad)
            WHERE c.concepto='HONO' AND c.estado='A' AND t.tercero NOT IN ('55555')
              AND c.fecha_hora >= '2024-01-01' AND c.fecha_hora < '2027-01-01'
          )
          SELECT year,month,specialty,specialist,kind,
                 COUNT(*) FILTER (WHERE attended),
                 COUNT(*) FILTER (WHERE attended IS NOT TRUE)
          FROM appointments GROUP BY year,month,specialty,specialist,kind
          ORDER BY year,month,specialty,specialist,kind
        """)
        rows = [dict(zip(['year','month','specialty','specialist','kind','yes','no'], row))
                for row in cur.fetchall()]
(ROOT / 'public' / 'attendance-snapshot.json').write_text(
    json.dumps(rows, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(f'Attendance snapshot: {len(rows)} aggregate rows')
