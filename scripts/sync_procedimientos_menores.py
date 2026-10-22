"""
Script de sincronización de Procedimientos Menores desde PostgreSQL.
Lee y ejecuta la consulta EXACTA directamente desde el archivo Quirofanos-V3-juan.sql,
procesa los procedimientos quirúrgicos y menores, y genera src/data/procedimientosMenoresData.json
y procedimientos_menores_2026.csv para mantener la información siempre actualizada.
"""

import os
import sys
import json
import time
import psycopg2
from dotenv import load_dotenv

load_dotenv()

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DB_HOST = os.getenv('DB_HOST', '172.21.21.37')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'icosalud_quinta')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD')

MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

def sync_procedimientos_menores():
    t0 = time.time()
    print("=" * 70)
    print("SINCRONIZANDO TABLERO DE PROCEDIMIENTOS MENORES DESDE Quirofanos-V3-juan.sql")
    print(f"Conectando a {DB_HOST}:{DB_PORT}/{DB_NAME}...")
    print("=" * 70)

    sql_file = 'Quirofanos-V3-juan.sql'
    if not os.path.exists(sql_file):
        raise FileNotFoundError(f"No se encontró el archivo SQL en el repositorio: {sql_file}")

    print(f"Leyendo consulta directamente desde el archivo: {sql_file}...")
    with open(sql_file, 'r', encoding='utf-8-sig', errors='ignore') as f:
        query = f.read()

    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD
    )
    cur = conn.cursor()

    print("1/4. Ejecutando Quirofanos-V3-juan.sql en PostgreSQL...")
    cur.execute(query)
    rows = cur.fetchall()
    desc = cur.description
    col_map = {d[0].lower(): idx for idx, d in enumerate(desc)}
    print(f"   ✓ {len(rows)} cirugías obtenidas desde {sql_file} en {time.time() - t0:.2f}s.")

    # Data structures
    years_set = set()
    specialists_map = {}
    specialties_set = set()
    procedures_map = {}
    table_data_map = {}
    data_by_ym = {}
    by_specialist = {}
    by_specialty = {}

    total_procedures_extracted = 0

    for r in rows:
        fecha = r[col_map['fecha']] if 'fecha' in col_map else None
        if not fecha:
            continue

        anio = fecha.year if hasattr(fecha, 'year') else int(str(fecha)[:4])
        mes_num = fecha.month if hasattr(fecha, 'month') else 1
        mes_nombre = MONTH_NAMES[mes_num - 1]
        anio_str = str(anio)
        years_set.add(anio)

        cedula = str(r[col_map['cedula']] or '').strip() if 'cedula' in col_map else ''
        doc_cirujano = str(r[col_map['doc_cirujano']] or 'S/D').strip() if 'doc_cirujano' in col_map else 'S/D'
        cirujano = str(r[col_map['cirujano']] or 'SIN CIRUJANO').strip() if 'cirujano' in col_map else 'SIN CIRUJANO'
        especialidad = str(r[col_map['espec']] or 'CIRUGIA GENERAL').strip() if 'espec' in col_map else 'CIRUGIA GENERAL'

        # Extract all procedures (cups1..cups5)
        for i in range(1, 6):
            c_col = f'cups{i}'
            q_col = f'qx{i}'
            if c_col not in col_map or q_col not in col_map:
                continue

            codigo = str(r[col_map[c_col]] or '').strip()
            procedimiento = str(r[col_map[q_col]] or '').strip()

            if not codigo and not procedimiento:
                continue
            if not procedimiento:
                procedimiento = codigo
            if not codigo:
                codigo = procedimiento

            total_procedures_extracted += 1

            # Specialist & Specialty
            specialists_map[cirujano] = {
                'id': doc_cirujano,
                'name': cirujano,
                'specialty': especialidad
            }
            specialties_set.add(especialidad)

            # Structure by Year Month
            if anio_str not in data_by_ym:
                data_by_ym[anio_str] = {}
                for m in MONTH_NAMES:
                    data_by_ym[anio_str][m] = {
                        'total': 0,
                        'pacientes': set(),
                        'especialistas': set(),
                        'especialidades': set(),
                        'procedimientos': {}
                    }

            ym = data_by_ym[anio_str][mes_nombre]
            ym['total'] += 1
            if cedula:
                ym['pacientes'].add(cedula)
            ym['especialistas'].add(cirujano)
            ym['especialidades'].add(especialidad)
            ym['procedimientos'][procedimiento] = ym['procedimientos'].get(procedimiento, 0) + 1

            # bySpecialist
            doc_key = f"{anio}_{mes_num}_{cirujano}"
            if doc_key not in by_specialist:
                by_specialist[doc_key] = {'total': 0, 'procedimientos': {}, 'especialidad': especialidad}
            by_specialist[doc_key]['total'] += 1
            by_specialist[doc_key]['procedimientos'][procedimiento] = by_specialist[doc_key]['procedimientos'].get(procedimiento, 0) + 1

            # bySpecialty
            spec_key = f"{anio}_{mes_num}_{especialidad}"
            if spec_key not in by_specialty:
                by_specialty[spec_key] = {'total': 0, 'procedimientos': {}}
            by_specialty[spec_key]['total'] += 1
            by_specialty[spec_key]['procedimientos'][procedimiento] = by_specialty[spec_key]['procedimientos'].get(procedimiento, 0) + 1

            # proceduresMap
            if procedimiento not in procedures_map:
                procedures_map[procedimiento] = {
                    'codigo': codigo,
                    'name': procedimiento,
                    'count': 0,
                    'especialidades': set(),
                    'medicos': set()
                }
            p_obj = procedures_map[procedimiento]
            p_obj['count'] += 1
            p_obj['especialidades'].add(especialidad)
            p_obj['medicos'].add(cirujano)

            # Aggregate table row
            table_key = (anio, mes_nombre, mes_num, codigo, procedimiento, cirujano, especialidad)
            if table_key not in table_data_map:
                table_data_map[table_key] = {
                    'anio': anio,
                    'mes': mes_nombre,
                    'mesNum': mes_num,
                    'codigo': codigo,
                    'procedimiento': procedimiento,
                    'especialista': cirujano,
                    'especialidad': especialidad,
                    'totalProcedimientos': 0,
                    'pacientes': set()
                }
            table_data_map[table_key]['totalProcedimientos'] += 1
            if cedula:
                table_data_map[table_key]['pacientes'].add(cedula)

    print(f"2/4. Calculando métricas y agregaciones ({total_procedures_extracted} procedimientos clasificados)...")
    # Finalize dataByYearMonth
    final_data_by_ym = {}
    for anio_str, months_dict in data_by_ym.items():
        final_data_by_ym[anio_str] = {}
        for m_name, m_data in months_dict.items():
            top_procs = sorted(
                [{'name': k, 'count': v} for k, v in m_data['procedimientos'].items()],
                key=lambda x: x['count'],
                reverse=True
            )[:10]
            final_data_by_ym[anio_str][m_name] = {
                'total': m_data['total'],
                'totalPacientes': len(m_data['pacientes']),
                'totalEspecialistas': len(m_data['especialistas']),
                'totalEspecialidades': len(m_data['especialidades']),
                'topProcedimientos': top_procs
            }

    # Final table data
    final_table_data = []
    for item in table_data_map.values():
        final_table_data.append({
            'anio': item['anio'],
            'mes': item['mes'],
            'mesNum': item['mesNum'],
            'codigo': item['codigo'],
            'procedimiento': item['procedimiento'],
            'especialista': item['especialista'],
            'especialidad': item['especialidad'],
            'totalProcedimientos': item['totalProcedimientos'],
            'pacientesUnicos': len(item['pacientes']) or item['totalProcedimientos']
        })

    final_table_data.sort(key=lambda x: x['totalProcedimientos'], reverse=True)

    # Top overall procedures
    top_overall_procedures = []
    for p_name, p_data in procedures_map.items():
        top_overall_procedures.append({
            'codigo': p_data['codigo'],
            'name': p_name,
            'count': p_data['count'],
            'especialidadesCount': len(p_data['especialidades']),
            'medicosCount': len(p_data['medicos'])
        })
    top_overall_procedures.sort(key=lambda x: x['count'], reverse=True)

    final_json = {
        'years': sorted(list(years_set), reverse=True),
        'months': MONTH_NAMES,
        'specialists': sorted(list(specialists_map.values()), key=lambda x: x['name']),
        'specialties': sorted(list(specialties_set)),
        'topProcedures': top_overall_procedures,
        'dataByYearMonth': final_data_by_ym,
        'bySpecialist': by_specialist,
        'bySpecialty': by_specialty,
        'tableData': final_table_data
    }

    out_path = os.path.join('src', 'data', 'procedimientosMenoresData.json')
    print(f"3/4. Guardando {out_path} y procedimientos_menores_2026.csv...")
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(final_json, f, ensure_ascii=False, indent=2)

    # Export CSV
    csv_path = 'procedimientos_menores_2026.csv'
    with open(csv_path, 'w', encoding='utf-8-sig') as f:
        f.write("Año;Mes;Código CUPS;Procedimiento Menor;Especialista / Personal;Especialidad;Total Procedimientos;Pacientes Únicos\n")
        for r in final_table_data:
            f.write(f"{r['anio']};{r['mes']};{r['codigo']};\"{r['procedimiento']}\";\"{r['especialista']}\";\"{r['especialidad']}\";{r['totalProcedimientos']};{r['pacientesUnicos']}\n")

    print(f"   ✓ Guardado exitosamente con {len(final_table_data)} filas de tabla y CSV exportado.")

    # 4/4. Resumen por mes
    print("4/4. Resumen mensual 2026 extraído directamente de Quirofanos-V3-juan.sql:")
    if '2026' in final_data_by_ym:
        for m_name in MONTH_NAMES:
            m_res = final_data_by_ym['2026'].get(m_name, {'total': 0, 'totalPacientes': 0, 'totalEspecialistas': 0})
            if m_res['total'] > 0:
                print(f"   • {m_name:10s}: {m_res['total']:5d} procedimientos | {m_res['totalPacientes']:4d} pacientes | {m_res['totalEspecialistas']:2d} profesionales")

    cur.close()
    conn.close()
    print("=" * 70)
    print(f"SINCRONIZACIÓN DESDE Quirofanos-V3-juan.sql COMPLETADA EN {time.time() - t0:.2f}s")
    print("=" * 70)

if __name__ == '__main__':
    sync_procedimientos_menores()
