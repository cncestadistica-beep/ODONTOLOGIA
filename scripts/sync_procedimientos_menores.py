"""
Script de sincronización de Procedimientos Menores desde PostgreSQL.
Ejecuta la lógica de Quirofanos-V3-juan.sql directamente contra icosalud_quinta
y genera src/data/procedimientosMenoresData.json actualizado para el frontend.
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
    print("SINCRONIZANDO TABLERO DE PROCEDIMIENTOS MENORES (Quirofanos-V3-juan)")
    print(f"Conectando a {DB_HOST}:{DB_PORT}/{DB_NAME}...")
    print("=" * 70)

    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD
    )
    cur = conn.cursor()

    # Query matching Quirofanos-V3-juan.sql for units 16, 21, 11
    # Extracts all procedures executed with PRQX concept
    query = """
    SELECT 
        c.cirugia,
        c.fecha,
        EXTRACT(year FROM c.fecha)::int as anio,
        EXTRACT(month FROM c.fecha)::int as mes_num,
        p.cedula,
        TRIM(CONCAT(p.nombre, ' ', COALESCE(p.nombre2, ''), ' ', p.primer_apellido, ' ', COALESCE(p.segundo_apellido, ''))) as paciente_nombre,
        COALESCE(u.usuario, c.usuario_cirujano, 'S/D') as doc_cirujano,
        COALESCE(TRIM(u.nombre), 'SIN CIRUJANO') as cirujano,
        COALESCE(TRIM(e.descripcion), 'CIRUGIA GENERAL') as especialidad,
        cp.servicio as codigo_cups,
        COALESCE(TRIM(s.descripcion), cp.servicio) as procedimiento,
        COALESCE(cp.numero_uvr, 0) as uvr
    FROM cx_cirugia c
    JOIN registro r ON r.registro = c.registro
    JOIN paciente p ON p.historia = r.historia
    LEFT JOIN usuario u ON u.usuario = c.usuario_cirujano
    LEFT JOIN especialidad e ON e.especialidad = u.especialidad
    JOIN cx_cirugia_procedimiento cp ON cp.cirugia = c.cirugia
    JOIN servicio s ON s.servicio = cp.servicio AND s.concepto = 'PRQX'
    WHERE r.unidad_servicio IN ('16','21','11')
      AND c.fecha >= '2026-01-01 00:00:00'
      AND c.fecha <= CURRENT_TIMESTAMP
      AND c.ind_anulada = 'N'
    ORDER BY c.fecha ASC, c.cirugia ASC, cp.item ASC;
    """

    print("1/4. Extrayendo procedimientos menores de la base de datos...")
    cur.execute(query)
    rows = cur.fetchall()
    print(f"   ✓ {len(rows)} procedimientos obtenidos en {time.time() - t0:.2f}s.")

    # Data structures
    years_set = set()
    specialists_map = {}
    specialties_set = set()
    procedures_map = {}
    table_data_map = {}
    data_by_ym = {}
    by_specialist = {}
    by_specialty = {}

    for row in rows:
        cirugia, fecha, anio, mes_num, cedula, pac_nombre, doc_cirujano, cirujano, especialidad, codigo, procedimiento, uvr = row
        mes_nombre = MONTH_NAMES[mes_num - 1]
        anio_str = str(anio)
        years_set.add(anio)

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
        t_entry = table_data_map[table_key]
        t_entry['totalProcedimientos'] += 1
        if cedula:
            t_entry['pacientes'].add(cedula)

    print("2/4. Calculando métricas y agregaciones...")
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
    print("4/4. Resumen mensual 2026 extraído:")
    if '2026' in final_data_by_ym:
        for m_name in MONTH_NAMES:
            m_res = final_data_by_ym['2026'][m_name]
            if m_res['total'] > 0:
                print(f"   • {m_name:10s}: {m_res['total']:5d} procedimientos | {m_res['totalPacientes']:4d} pacientes | {m_res['totalEspecialistas']:2d} profesionales")

    conn.close()
    print("=" * 70)
    print(f"SINCRONIZACIÓN COMPLETADA CON ÉXITO EN {time.time() - t0:.2f} SEGUNDOS")
    print("=" * 70)

if __name__ == '__main__':
    sync_procedimientos_menores()
