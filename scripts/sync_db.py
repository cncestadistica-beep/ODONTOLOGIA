"""
Script de sincronización de datos de PostgreSQL a JSON para Central de Especialistas.
Integra la consulta exacta de Ordenamientos (Ordenamientos_V3_Juan.sql) y Citas de Especialistas.
Elimina duplicados mediante consultas limpias y genera src/data/centralEspecialistasData.json.
"""

import os
import json
import time
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv('DB_HOST', '172.21.21.37')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'icosalud_quinta')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD')

MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

def sync_data():
    t0 = time.time()
    print(f"Conectando a {DB_HOST}:{DB_PORT}/{DB_NAME}...")
    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD
    )
    cur = conn.cursor()

    # 1. Specialists list
    print("1/7. Obteniendo lista de especialistas...")
    cur.execute('''
    SELECT DISTINCT t.tercero, TRIM(t.nombre) as nombre, COALESCE(TRIM(e.descripcion), 'MEDICINA GENERAL') as esp
    FROM cita c
    JOIN tercero t ON t.tercero = c.tercero
    LEFT JOIN especialidad e ON e.especialidad = COALESCE(c.especialidad, t.especialidad)
    WHERE c.concepto = 'HONO' AND c.estado = 'A' AND t.tercero NOT IN ('55555')
      AND c.fecha_hora >= '2024-01-01'
    ORDER BY nombre;
    ''')
    specialists = [{'id': str(r[0]), 'name': r[1], 'specialty': r[2]} for r in cur.fetchall() if r[1]]

    # 2. Specialties list
    print("2/7. Obteniendo lista de especialidades...")
    cur.execute('''
    SELECT DISTINCT COALESCE(TRIM(e.descripcion), 'MEDICINA GENERAL') as esp
    FROM cita c
    JOIN tercero t ON t.tercero = c.tercero
    LEFT JOIN especialidad e ON e.especialidad = COALESCE(c.especialidad, t.especialidad)
    WHERE c.concepto = 'HONO' AND c.estado = 'A' AND t.tercero NOT IN ('55555')
      AND c.fecha_hora >= '2024-01-01'
    ORDER BY esp;
    ''')
    specialties = [r[0] for r in cur.fetchall() if r[0]]

    # 3. Monthly metrics for 2024, 2025, 2026 (Clean Citas)
    print("3/7. Extrayendo métricas mensuales de citas...")
    cur.execute('''
    WITH clean_citas AS (
        SELECT 
            c.fecha_hora,
            EXTRACT(year FROM c.fecha_hora)::int as anio,
            EXTRACT(month FROM c.fecha_hora)::int as mes,
            DATE(c.fecha_hora) as dia,
            c.tercero as doc_medico,
            COALESCE(TRIM(e.descripcion), 'MEDICINA GENERAL') as especialidad,
            c.servicio as cups_codigo,
            COALESCE(TRIM(s.descripcion), c.servicio) as cups_nombre,
            c.ind_cumplida,
            CASE 
                WHEN s.descripcion ILIKE '%PRIMERA VEZ%' OR c.servicio LIKE '8902%' OR c.ind_primera_vez = 'S' THEN 'PRIMERA_VEZ'
                WHEN s.descripcion ILIKE '%CONTROL%' OR c.servicio LIKE '8903%' THEN 'CONTROL'
                ELSE 'OTRA'
            END as tipo_consulta
        FROM cita c
        JOIN tercero t ON t.tercero = c.tercero
        LEFT JOIN especialidad e ON e.especialidad = COALESCE(c.especialidad, t.especialidad)
        LEFT JOIN servicio s ON s.servicio = c.servicio AND s.concepto = c.concepto
        WHERE c.concepto = 'HONO'
          AND c.estado = 'A'
          AND t.tercero NOT IN ('55555')
          AND c.fecha_hora >= '2024-01-01 00:00:00'
          AND c.fecha_hora <= '2026-12-31 23:59:59'
    )
    SELECT 
        anio, 
        mes, 
        COUNT(*) as total_hono,
        COUNT(CASE WHEN ind_cumplida = 'S' THEN 1 END) as realizadas,
        COUNT(CASE WHEN tipo_consulta = 'PRIMERA_VEZ' THEN 1 END) as primera_vez,
        COUNT(CASE WHEN tipo_consulta = 'CONTROL' THEN 1 END) as control
    FROM clean_citas
    GROUP BY anio, mes
    ORDER BY anio, mes;
    ''')
    citas_monthly = {}
    for anio, mes, total_hono, realizadas, primera_vez, control in cur.fetchall():
        citas_monthly[(anio, mes)] = {
            'totalHonorarios': total_hono,
            'consultasRealizadas': realizadas,
            'consultasPrimeraVez': primera_vez,
            'consultasControl': control
        }

    # 4. Extract Orders according to Ordenamientos_V3_Juan.sql
    print("4/7. Extrayendo ordenamientos médicos (Ordenamientos V3)...")
    cur.execute('''
    WITH clean_orders AS (
        SELECT 
            EXTRACT(year FROM fe.fecha_formula)::int as anio,
            EXTRACT(month FROM fe.fecha_formula)::int as mes,
            COALESCE(TRIM(esp.descripcion), 'MEDICINA GENERAL') as especialidad_nombre,
            TRIM(us.nombre) as medico_nombre,
            c.concepto
        FROM formula_detalle fd
        JOIN formula_encabezado fe ON fd.registro = fe.registro AND fd.formula = fe.formula
        JOIN concepto c ON fd.concepto = c.concepto
        JOIN registro r ON fd.registro = r.registro
        JOIN unidad_servicio u ON r.unidad_servicio = u.unidad_servicio
        JOIN usuario us ON fe.usuario = us.usuario
        LEFT JOIN especialidad esp ON us.especialidad = esp.especialidad
        WHERE fe.ind_aprobada = 'S'
          AND fe.fecha_formula >= '2024-01-01 00:00:00' AND fe.fecha_formula <= '2026-12-31 23:59:59'
          AND u.unidad_servicio IN ('11','16','21')
    )
    SELECT 
        anio,
        mes,
        COUNT(CASE WHEN concepto = 'MEDI' THEN 1 END) as medi,
        COUNT(CASE WHEN concepto = 'LABO' THEN 1 END) as labo,
        COUNT(CASE WHEN concepto = 'HONO' THEN 1 END) as hono,
        COUNT(CASE WHEN concepto = 'PRQX' THEN 1 END) as prqx,
        COUNT(CASE WHEN concepto = 'ECOG' THEN 1 END) as ecog,
        COUNT(CASE WHEN concepto IN ('IMAG', 'TOMO', 'RMAG', 'CARD', 'OTDX') THEN 1 END) as imag,
        COUNT(*) as total
    FROM clean_orders
    GROUP BY anio, mes
    ORDER BY anio, mes;
    ''')
    orders_monthly = {}
    for anio, mes, medi, labo, hono, prqx, ecog, imag, total in cur.fetchall():
        orders_monthly[(anio, mes)] = {
            'medicamentos': medi,
            'laboratorios': labo,
            'honorarios': hono,
            'procedimientos': prqx,
            'ecografias': ecog,
            'imagenes': imag,
            'total': total
        }

    # 4b. Orders by Specialty
    cur.execute('''
    WITH clean_orders AS (
        SELECT 
            EXTRACT(year FROM fe.fecha_formula)::int as anio,
            EXTRACT(month FROM fe.fecha_formula)::int as mes,
            COALESCE(TRIM(esp.descripcion), 'MEDICINA GENERAL') as especialidad_nombre,
            c.concepto
        FROM formula_detalle fd
        JOIN formula_encabezado fe ON fd.registro = fe.registro AND fd.formula = fe.formula
        JOIN concepto c ON fd.concepto = c.concepto
        JOIN registro r ON fd.registro = r.registro
        JOIN unidad_servicio u ON r.unidad_servicio = u.unidad_servicio
        JOIN usuario us ON fe.usuario = us.usuario
        LEFT JOIN especialidad esp ON us.especialidad = esp.especialidad
        WHERE fe.ind_aprobada = 'S'
          AND fe.fecha_formula >= '2024-01-01 00:00:00' AND fe.fecha_formula <= '2026-12-31 23:59:59'
          AND u.unidad_servicio IN ('11','16','21')
    )
    SELECT 
        anio,
        mes,
        especialidad_nombre,
        COUNT(CASE WHEN concepto = 'MEDI' THEN 1 END) as medi,
        COUNT(CASE WHEN concepto = 'LABO' THEN 1 END) as labo,
        COUNT(CASE WHEN concepto = 'HONO' THEN 1 END) as hono,
        COUNT(CASE WHEN concepto = 'PRQX' THEN 1 END) as prqx,
        COUNT(CASE WHEN concepto = 'ECOG' THEN 1 END) as ecog,
        COUNT(CASE WHEN concepto IN ('IMAG', 'TOMO', 'RMAG', 'CARD', 'OTDX') THEN 1 END) as imag,
        COUNT(*) as total
    FROM clean_orders
    GROUP BY anio, mes, especialidad_nombre
    ORDER BY anio, mes, especialidad_nombre;
    ''')
    orders_by_specialty = {}
    for anio, mes, esp, medi, labo, hono, prqx, ecog, imag, total in cur.fetchall():
        key = f'{anio}_{mes}_{esp}'
        orders_by_specialty[key] = {
            'medicamentos': medi,
            'laboratorios': labo,
            'honorarios': hono,
            'procedimientos': prqx,
            'ecografias': ecog,
            'imagenes': imag,
            'total': total
        }

    # 4c. Orders by Specialist (Doctor)
    cur.execute('''
    WITH clean_orders AS (
        SELECT 
            EXTRACT(year FROM fe.fecha_formula)::int as anio,
            EXTRACT(month FROM fe.fecha_formula)::int as mes,
            TRIM(us.nombre) as medico_nombre,
            c.concepto
        FROM formula_detalle fd
        JOIN formula_encabezado fe ON fd.registro = fe.registro AND fd.formula = fe.formula
        JOIN concepto c ON fd.concepto = c.concepto
        JOIN registro r ON fd.registro = r.registro
        JOIN unidad_servicio u ON r.unidad_servicio = u.unidad_servicio
        JOIN usuario us ON fe.usuario = us.usuario
        WHERE fe.ind_aprobada = 'S'
          AND fe.fecha_formula >= '2024-01-01 00:00:00' AND fe.fecha_formula <= '2026-12-31 23:59:59'
          AND u.unidad_servicio IN ('11','16','21')
    )
    SELECT 
        anio,
        mes,
        medico_nombre,
        COUNT(CASE WHEN concepto = 'MEDI' THEN 1 END) as medi,
        COUNT(CASE WHEN concepto = 'LABO' THEN 1 END) as labo,
        COUNT(CASE WHEN concepto = 'HONO' THEN 1 END) as hono,
        COUNT(CASE WHEN concepto = 'PRQX' THEN 1 END) as prqx,
        COUNT(CASE WHEN concepto = 'ECOG' THEN 1 END) as ecog,
        COUNT(CASE WHEN concepto IN ('IMAG', 'TOMO', 'RMAG', 'CARD', 'OTDX') THEN 1 END) as imag,
        COUNT(*) as total
    FROM clean_orders
    GROUP BY anio, mes, medico_nombre
    ORDER BY anio, mes, medico_nombre;
    ''')
    orders_by_specialist = {}
    for anio, mes, med, medi, labo, hono, prqx, ecog, imag, total in cur.fetchall():
        key = f'{anio}_{mes}_{med}'
        orders_by_specialist[key] = {
            'medicamentos': medi,
            'laboratorios': labo,
            'honorarios': hono,
            'procedimientos': prqx,
            'ecografias': ecog,
            'imagenes': imag,
            'total': total
        }

    # 5. Daily trend data
    print("5/7. Extrayendo tendencia diaria...")
    cur.execute('''
    SELECT 
        EXTRACT(year FROM c.fecha_hora)::int as anio,
        DATE(c.fecha_hora)::text as dia,
        COUNT(*) as total_hono,
        COUNT(CASE WHEN c.ind_cumplida = 'S' THEN 1 END) as realizadas,
        COUNT(CASE WHEN s.descripcion ILIKE '%PRIMERA VEZ%' OR c.servicio LIKE '8902%' OR c.ind_primera_vez = 'S' THEN 1 END) as primera_vez,
        COUNT(CASE WHEN s.descripcion ILIKE '%CONTROL%' OR c.servicio LIKE '8903%' THEN 1 END) as control
    FROM cita c
    JOIN tercero t ON t.tercero = c.tercero
    LEFT JOIN servicio s ON s.servicio = c.servicio AND s.concepto = c.concepto
    WHERE c.concepto = 'HONO' AND c.estado = 'A' AND t.tercero NOT IN ('55555')
      AND c.fecha_hora >= '2024-01-01 00:00:00' AND c.fecha_hora <= '2026-12-31 23:59:59'
    GROUP BY anio, dia
    ORDER BY dia;
    ''')
    daily_by_year = {}
    for anio, dia, total_hono, realizadas, primera_vez, control in cur.fetchall():
        if anio not in daily_by_year:
            daily_by_year[anio] = []
        daily_by_year[anio].append({
            'date': dia,
            'honorarios': total_hono,
            'realizadas': realizadas,
            'primeraVez': primera_vez,
            'control': control
        })

    # 6. Breakdown by (anio, mes, especialidad) for Citas
    print("6/7. Agrupando citas por especialidad y especialista...")
    cur.execute('''
    SELECT 
        EXTRACT(year FROM c.fecha_hora)::int as anio,
        EXTRACT(month FROM c.fecha_hora)::int as mes,
        COALESCE(TRIM(e.descripcion), 'MEDICINA GENERAL') as esp,
        COUNT(*) as total_hono,
        COUNT(CASE WHEN c.ind_cumplida = 'S' THEN 1 END) as realizadas,
        COUNT(CASE WHEN s.descripcion ILIKE '%PRIMERA VEZ%' OR c.servicio LIKE '8902%' OR c.ind_primera_vez = 'S' THEN 1 END) as primera_vez,
        COUNT(CASE WHEN s.descripcion ILIKE '%CONTROL%' OR c.servicio LIKE '8903%' THEN 1 END) as control
    FROM cita c
    JOIN tercero t ON t.tercero = c.tercero
    LEFT JOIN especialidad e ON e.especialidad = COALESCE(c.especialidad, t.especialidad)
    LEFT JOIN servicio s ON s.servicio = c.servicio AND s.concepto = c.concepto
    WHERE c.concepto = 'HONO' AND c.estado = 'A' AND t.tercero NOT IN ('55555')
      AND c.fecha_hora >= '2024-01-01 00:00:00' AND c.fecha_hora <= '2026-12-31 23:59:59'
    GROUP BY anio, mes, esp;
    ''')
    by_specialty = {}
    for anio, mes, esp, total, real, pvez, ctrl in cur.fetchall():
        key = f'{anio}_{mes}_{esp}'
        by_specialty[key] = {
            'totalHonorarios': total,
            'consultasRealizadas': real,
            'consultasPrimeraVez': pvez,
            'consultasControl': ctrl
        }

    # 7. Breakdown by (anio, mes, medico) for Citas & TableData
    cur.execute('''
    SELECT 
        EXTRACT(year FROM c.fecha_hora)::int as anio,
        EXTRACT(month FROM c.fecha_hora)::int as mes,
        TRIM(t.nombre) as medico,
        COALESCE(TRIM(e.descripcion), 'MEDICINA GENERAL') as esp,
        COUNT(*) as total_hono,
        COUNT(CASE WHEN c.ind_cumplida = 'S' THEN 1 END) as realizadas,
        COUNT(CASE WHEN s.descripcion ILIKE '%PRIMERA VEZ%' OR c.servicio LIKE '8902%' OR c.ind_primera_vez = 'S' THEN 1 END) as primera_vez,
        COUNT(CASE WHEN s.descripcion ILIKE '%CONTROL%' OR c.servicio LIKE '8903%' THEN 1 END) as control
    FROM cita c
    JOIN tercero t ON t.tercero = c.tercero
    LEFT JOIN especialidad e ON e.especialidad = COALESCE(c.especialidad, t.especialidad)
    LEFT JOIN servicio s ON s.servicio = c.servicio AND s.concepto = c.concepto
    WHERE c.concepto = 'HONO' AND c.estado = 'A' AND t.tercero NOT IN ('55555')
      AND c.fecha_hora >= '2024-01-01 00:00:00' AND c.fecha_hora <= '2026-12-31 23:59:59'
    GROUP BY anio, mes, medico, esp
    ORDER BY anio DESC, mes DESC, total_hono DESC;
    ''')
    by_specialist = {}
    table_data = []
    for anio, mes, med, esp, total, real, pvez, ctrl in cur.fetchall():
        key = f'{anio}_{mes}_{med}'
        if key not in by_specialist:
            by_specialist[key] = {
                'totalHonorarios': 0,
                'consultasRealizadas': 0,
                'consultasPrimeraVez': 0,
                'consultasControl': 0
            }
        by_specialist[key]['totalHonorarios'] += total
        by_specialist[key]['consultasRealizadas'] += real
        by_specialist[key]['consultasPrimeraVez'] += pvez
        by_specialist[key]['consultasControl'] += ctrl

        table_data.append({
            'anio': anio,
            'mes': MESES[mes],
            'especialista': med,
            'especialidad': esp,
            'totalCitas': total,
            'realizadas': real,
            'primeraVez': pvez,
            'control': ctrl
        })

    # 8. Attendance Aggregations for Gestión de Asistencias (AttendanceView)
    print("8/8. Extrayendo datos de asistencia por año, mes, especialidad y especialista...")
    cur.execute('''
    SELECT 
        EXTRACT(year FROM c.fecha_hora)::int as anio,
        EXTRACT(month FROM c.fecha_hora)::int as mes,
        COALESCE(TRIM(e.descripcion), 'MEDICINA GENERAL') as esp,
        TRIM(t.nombre) as med,
        c.ind_cumplida = 'S' as cumplida,
        CASE 
            WHEN s.descripcion ILIKE '%PRIMERA VEZ%' OR c.servicio LIKE '8902%' OR c.ind_primera_vez = 'S' THEN '1ra Vez'
            WHEN s.descripcion ILIKE '%CONTROL%' OR c.servicio LIKE '8903%' THEN 'Control'
            ELSE 'Otra'
        END as tipo,
        COUNT(*) as total
    FROM cita c
    JOIN tercero t ON t.tercero = c.tercero
    LEFT JOIN especialidad e ON e.especialidad = COALESCE(c.especialidad, t.especialidad)
    LEFT JOIN servicio s ON s.servicio = c.servicio AND s.concepto = c.concepto
    WHERE c.concepto = 'HONO' AND c.estado = 'A' AND t.tercero NOT IN ('55555')
      AND c.fecha_hora >= '2024-01-01 00:00:00' AND c.fecha_hora <= '2026-12-31 23:59:59'
    GROUP BY anio, mes, esp, med, cumplida, tipo;
    ''')

    attendance_by_ym = {str(y): {m: {'total': 0, 'si': {'total': 0, 'primeraVez': 0, 'control': 0}, 'no': {'total': 0, 'primeraVez': 0, 'control': 0}} for m in MESES if m} for y in [2026, 2025, 2024]}
    attendance_by_spec = {}
    attendance_by_doc = {}

    for anio, mes, esp, med, cumplida, tipo, count in cur.fetchall():
        if anio not in [2024, 2025, 2026] or mes < 1 or mes > 12:
            continue
        anio_str = str(anio)
        mes_nom = MESES[mes]
        side = 'si' if cumplida else 'no'

        # Update YM
        ym_entry = attendance_by_ym[anio_str][mes_nom]
        ym_entry['total'] += count
        ym_entry[side]['total'] += count
        if tipo == '1ra Vez':
            ym_entry[side]['primeraVez'] += count
        elif tipo == 'Control':
            ym_entry[side]['control'] += count

        # Update Specialty
        spec_key = f'{anio}_{mes}_{esp}'
        if spec_key not in attendance_by_spec:
            attendance_by_spec[spec_key] = {
                'total': 0,
                'si': {'total': 0, 'primeraVez': 0, 'control': 0},
                'no': {'total': 0, 'primeraVez': 0, 'control': 0}
            }
        attendance_by_spec[spec_key]['total'] += count
        attendance_by_spec[spec_key][side]['total'] += count
        if tipo == '1ra Vez':
            attendance_by_spec[spec_key][side]['primeraVez'] += count
        elif tipo == 'Control':
            attendance_by_spec[spec_key][side]['control'] += count

        # Update Specialist
        doc_key = f'{anio}_{mes}_{med}'
        if doc_key not in attendance_by_doc:
            attendance_by_doc[doc_key] = {
                'total': 0,
                'si': {'total': 0, 'primeraVez': 0, 'control': 0},
                'no': {'total': 0, 'primeraVez': 0, 'control': 0}
            }
        attendance_by_doc[doc_key]['total'] += count
        attendance_by_doc[doc_key][side]['total'] += count
        if tipo == '1ra Vez':
            attendance_by_doc[doc_key][side]['primeraVez'] += count
        elif tipo == 'Control':
            attendance_by_doc[doc_key][side]['control'] += count

    # Build final result JSON structure
    print("Consolidando dataset central...")
    result = {
        'years': [2026, 2025, 2024],
        'months': [m for m in MESES if m],
        'specialists': specialists,
        'specialties': specialties,
        'orderingGroups': ['Medicamentos', 'Laboratorio Clínico', 'Honorarios Médicos', 'Procedimientos Quirúrgicos', 'Ecografías', 'Imágenes Diagnósticas'],
        'dataByYearMonth': {},
        'ordersBySpecialty': orders_by_specialty,
        'ordersBySpecialist': orders_by_specialist,
        'dailyTrend': daily_by_year,
        'bySpecialty': by_specialty,
        'bySpecialist': by_specialist,
        'tableData': table_data,
        'attendanceByYM': attendance_by_ym,
        'attendanceBySpecialty': attendance_by_spec,
        'attendanceBySpecialist': attendance_by_doc
    }

    for anio in [2026, 2025, 2024]:
        result['dataByYearMonth'][str(anio)] = {}
        for mes in range(1, 13):
            mes_nombre = MESES[mes]
            cdata = citas_monthly.get((anio, mes), {'totalHonorarios': 0, 'consultasRealizadas': 0, 'consultasPrimeraVez': 0, 'consultasControl': 0})
            odata = orders_monthly.get((anio, mes), {'medicamentos': 0, 'laboratorios': 0, 'honorarios': 0, 'procedimientos': 0, 'ecografias': 0, 'imagenes': 0, 'total': 0})
            
            result['dataByYearMonth'][str(anio)][mes_nombre] = {
                'totalHonorarios': cdata['totalHonorarios'],
                'totalLaboratorios': odata['laboratorios'],
                'totalMedicamentos': odata['medicamentos'],
                'totalConsultasRealizadas': cdata['consultasRealizadas'],
                'totalConsultasPrimeraVez': cdata['consultasPrimeraVez'],
                'totalConsultasControl': cdata['consultasControl'],
                'orders': {
                    'medicamentos': odata['medicamentos'],
                    'laboratorios': odata['laboratorios'],
                    'honorarios': odata['honorarios'] if odata['honorarios'] > 0 else cdata['totalHonorarios'],
                    'procedimientos': odata['procedimientos'],
                    'ecografias': odata['ecografias'],
                    'imagenes': odata['imagenes']
                }
            }

    os.makedirs('src/data', exist_ok=True)
    with open('src/data/centralEspecialistasData.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"Sincronización completada exitosamente en src/data/centralEspecialistasData.json en {time.time() - t0:.2f}s")
    cur.close()
    conn.close()

if __name__ == '__main__':
    sync_data()
