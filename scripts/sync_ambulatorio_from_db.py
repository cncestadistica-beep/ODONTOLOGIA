"""
Script para sincronizar consultas y ordenamientos ambulatorios (CIS EMCALI y Odontología)
directamente desde PostgreSQL usando los archivos SQL optimizados:
- Consulta_Externa_CIS_Odontologia_Optimizada.sql -> consultas_ambulatorio.csv
- Ordenamientos_CIS_Odontologia_Optimizada.sql     -> ordenamientos_ambulatorio.csv
"""

import os
import csv
import time
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def sync_ambulatorio():
    DB_HOST = os.getenv('DB_HOST', '172.21.21.37')
    DB_PORT = os.getenv('DB_PORT', '5432')
    DB_NAME = os.getenv('DB_NAME', 'icosalud_quinta')
    DB_USER = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD = os.getenv('DB_PASSWORD')

    print(f"Conectando a {DB_HOST}:{DB_PORT}/{DB_NAME}...")
    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD
    )
    conn.set_client_encoding('LATIN9')
    cur = conn.cursor()

    # 1. Consultas Ambulatorias (CIS EMCALI y Odontología)
    sql_consultas_path = 'Consulta_Externa_CIS_Odontologia_Optimizada.sql'
    if os.path.exists(sql_consultas_path):
        print(f"[1/2] Extrayendo consultas ambulatorias usando {sql_consultas_path}...")
        t0 = time.time()
        with open(sql_consultas_path, 'r', encoding='utf-8') as f:
            sql_consultas = f.read()

        cur.execute(sql_consultas)
        headers = [desc[0] for desc in cur.description]
        
        out_csv = 'consultas_ambulatorio.csv'
        with open(out_csv, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f, delimiter=';')
            writer.writerow(headers)
            count = 0
            while True:
                rows = cur.fetchmany(10000)
                if not rows:
                    break
                writer.writerows(rows)
                count += len(rows)

        print(f"      [OK] {count} consultas exportadas a {out_csv} en {time.time()-t0:.2f}s")
    else:
        print(f"[!] No se encontró {sql_consultas_path}")

    # 2. Ordenamientos Ambulatorios (CIS EMCALI y Odontología)
    sql_orden_path = 'Ordenamientos_CIS_Odontologia_Optimizada.sql'
    if os.path.exists(sql_orden_path):
        print(f"[2/2] Extrayendo ordenamientos ambulatorios usando {sql_orden_path}...")
        t0 = time.time()
        with open(sql_orden_path, 'r', encoding='utf-8') as f:
            sql_orden = f.read()

        cur.execute(sql_orden)
        headers = [desc[0] for desc in cur.description]

        out_csv = 'ordenamientos_ambulatorio.csv'
        with open(out_csv, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f, delimiter=';')
            writer.writerow(headers)
            count = 0
            while True:
                rows = cur.fetchmany(10000)
                if not rows:
                    break
                writer.writerows(rows)
                count += len(rows)

        print(f"      [OK] {count} ordenes exportadas a {out_csv} en {time.time()-t0:.2f}s")
    else:
        print(f"[!] No se encontró {sql_orden_path}")

    cur.close()
    conn.close()
    print("Sincronización ambulatoria desde PostgreSQL completada exitosamente.")

if __name__ == '__main__':
    sync_ambulatorio()
