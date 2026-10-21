import os
import json
import csv
import re
import unicodedata
from collections import defaultdict
from datetime import datetime
import psycopg2
from dotenv import load_dotenv

load_dotenv()

MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

def clean_text(s):
    if not s or not isinstance(s, str):
        return ''
    s = s.replace('\ufffd', 'I').replace('\xad', '')
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'\s+', ' ', s).strip().upper()

def get_dx_dict():
    dx_dict = {}
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', '172.21.21.37'),
            port=os.getenv('DB_PORT', '5432'),
            dbname=os.getenv('DB_NAME', 'icosalud_quinta'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD')
        )
        cur = conn.cursor()
        cur.execute("SELECT diagnostico, TRIM(descripcion) FROM diagnostico;")
        for code, desc in cur.fetchall():
            if code:
                dx_dict[str(code).strip().upper()] = clean_text(desc)
        conn.close()
        print(f"Loaded {len(dx_dict)} diagnoses from database.")
    except Exception as e:
        print(f"Warning: Could not connect to DB for diagnoses: {e}")
    return dx_dict

def parse_date(d_str):
    if not d_str:
        return None
    d_str = d_str.strip().split(' ')[0]
    parts = d_str.replace('-', '/').split('/')
    if len(parts) == 3:
        p1, p2, p3 = int(parts[0]), int(parts[1]), int(parts[2])
        if p1 > 1000: # YYYY-MM-DD
            return datetime(p1, p2, p3)
        elif p3 > 1000: # DD/MM/YYYY
            return datetime(p3, p2, p1)
    return None

def calc_age(f_nac, f_cita):
    if not f_nac or not f_cita:
        return 0
    dt_nac = parse_date(f_nac)
    dt_cita = parse_date(f_cita)
    if not dt_nac or not dt_cita:
        return 0
    age = dt_cita.year - dt_nac.year
    if (dt_cita.month, dt_cita.day) < (dt_nac.month, dt_nac.day):
        age -= 1
    return max(0, age)

def process_ambulatorio():
    print("1. Cargando catálogo de diagnósticos...")
    dx_dict = get_dx_dict()

    print("2. Procesando ordenamientos_ambulatorio.csv...")
    orders_by_reg = defaultdict(list)
    
    orders_monthly_cisen = defaultdict(lambda: defaultdict(int))
    orders_monthly_odo = defaultdict(lambda: defaultdict(int))
    
    orders_by_spec_cisen = defaultdict(lambda: defaultdict(int))
    orders_by_spec_odo = defaultdict(lambda: defaultdict(int))
    
    orders_by_doc_cisen = defaultdict(lambda: defaultdict(int))
    orders_by_doc_odo = defaultdict(lambda: defaultdict(int))

    concept_map = {
        'MEDICAMENTOS': ('medicamentos', 'Medicamentos', 'MEDI'),
        'LABORATORIO CLINICO': ('laboratorios', 'Laboratorio Clínico', 'LABO'),
        'HONORARIOS MEDICOS': ('honorarios', 'Honorarios Médicos', 'HONO'),
        'PROCEDIMIENTOS QUIRURGICOS': ('procedimientos', 'Procedimientos Quirúrgicos', 'PRQX'),
        'ECOGRAFIAS': ('ecografias', 'Ecografías', 'ECOG'),
        'IMAGENOLOGIA': ('imagenes', 'Imágenes Diagnósticas', 'IMAG'),
    }

    odontologia_specs = {'ODONTOLOGIA', 'HIGIENISTA ORAL'}

    with open('ordenamientos_ambulatorio.csv', 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            reg = str(row['registro']).strip().split('.')[0]
            conc_raw = clean_text(row['concepto'])
            spec = clean_text(row['especialidad'])
            med = clean_text(row['medico'])
            dt = parse_date(row['fecha_formula'])
            if not dt or dt.year != 2026:
                continue
            
            mes = dt.month
            is_odo = spec in odontologia_specs
            c_info = concept_map.get(conc_raw, ('honorarios', 'Honorarios Médicos', 'HONO'))
            c_key, g_name, c_code = c_info
            
            cant = 1.0
            try:
                if row.get('cantidad'):
                    cant = float(str(row['cantidad']).replace(',', '.'))
            except:
                pass
            
            orders_by_reg[reg].append({
                'g': g_name,
                'c': c_code,
                'cod': str(row.get('servicio', '')).strip(),
                'd': clean_text(row.get('descripcion', '')),
                'cant': cant,
                'fr': clean_text(row.get('frecuencia', '')),
                'obs': clean_text(row.get('observacion', ''))
            })

            target_monthly = orders_monthly_odo if is_odo else orders_monthly_cisen
            target_spec = orders_by_spec_odo if is_odo else orders_by_spec_cisen
            target_doc = orders_by_doc_odo if is_odo else orders_by_doc_cisen

            target_monthly[mes][c_key] += 1
            target_monthly[mes]['total'] += 1

            target_spec[(mes, spec)][c_key] += 1
            target_spec[(mes, spec)]['total'] += 1

            target_doc[(mes, med)][c_key] += 1
            target_doc[(mes, med)]['total'] += 1

    print(f"Ordenamientos procesados. Registros con órdenes: {len(orders_by_reg)}")

    print("3. Procesando consultas_ambulatorio.csv...")
    citas_monthly_cisen = defaultdict(lambda: defaultdict(int))
    citas_monthly_odo = defaultdict(lambda: defaultdict(int))

    citas_by_spec_cisen = defaultdict(lambda: defaultdict(int))
    citas_by_spec_odo = defaultdict(lambda: defaultdict(int))

    citas_by_doc_cisen = defaultdict(lambda: defaultdict(int))
    citas_by_doc_odo = defaultdict(lambda: defaultdict(int))

    table_data_cisen_map = defaultdict(lambda: {'totalCitas': 0, 'realizadas': 0, 'primeraVez': 0, 'control': 0})
    table_data_odo_map = defaultdict(lambda: {'totalCitas': 0, 'realizadas': 0, 'primeraVez': 0, 'control': 0})

    daily_cisen = defaultdict(lambda: {'honorarios': 0, 'realizadas': 0, 'primeraVez': 0, 'control': 0})
    daily_odo = defaultdict(lambda: {'honorarios': 0, 'realizadas': 0, 'primeraVez': 0, 'control': 0})

    attendance_ym_cisen = {str(m): {'total': 0, 'si': {'total': 0, 'primeraVez': 0, 'control': 0}, 'no': {'total': 0, 'primeraVez': 0, 'control': 0}} for m in MESES if m}
    attendance_ym_odo = {str(m): {'total': 0, 'si': {'total': 0, 'primeraVez': 0, 'control': 0}, 'no': {'total': 0, 'primeraVez': 0, 'control': 0}} for m in MESES if m}

    attendance_spec_cisen = defaultdict(lambda: {'total': 0, 'si': {'total': 0, 'primeraVez': 0, 'control': 0}, 'no': {'total': 0, 'primeraVez': 0, 'control': 0}})
    attendance_spec_odo = defaultdict(lambda: {'total': 0, 'si': {'total': 0, 'primeraVez': 0, 'control': 0}, 'no': {'total': 0, 'primeraVez': 0, 'control': 0}})

    attendance_doc_cisen = defaultdict(lambda: {'total': 0, 'si': {'total': 0, 'primeraVez': 0, 'control': 0}, 'no': {'total': 0, 'primeraVez': 0, 'control': 0}})
    attendance_doc_odo = defaultdict(lambda: {'total': 0, 'si': {'total': 0, 'primeraVez': 0, 'control': 0}, 'no': {'total': 0, 'primeraVez': 0, 'control': 0}})

    # Diagnostics aggregations per board
    diag_totals_cisen = defaultdict(int)
    diag_totals_odo = defaultdict(int)
    diag_counts_cisen = defaultdict(lambda: [0, 0, 0, 0])
    diag_counts_odo = defaultdict(lambda: [0, 0, 0, 0])

    specialists_cisen = {}
    specialists_odo = {}
    specialties_cisen = set()
    specialties_odo = set()

    appointments_by_month_doc = defaultdict(lambda: defaultdict(list))

    with open('consultas_ambulatorio.csv', 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            dt = parse_date(row['fecha_hora'])
            if not dt or dt.year != 2026:
                continue
            
            mes = dt.month
            mes_nom = MESES[mes]
            dia_str = dt.strftime('%Y-%m-%d')

            med = clean_text(row['medico'])
            spec = clean_text(row['especialidad'])
            doc_med = str(row.get('doc_medico', '')).strip()
            cedula = str(row.get('cedula', '')).strip()
            reg = str(row.get('registro', '')).strip().split('.')[0]
            serv_cod = str(row.get('servicio', '')).strip()
            serv_des = clean_text(row.get('servicio_des', ''))
            dx_code = str(row.get('dx_ingreso', '')).strip().upper()
            dx_desc = dx_dict.get(dx_code, f'DIAGNOSTICO {dx_code}' if dx_code else 'CONSULTA GENERAL')
            
            is_odo = spec in odontologia_specs

            # Determine appointment type
            if 'PRIMERA VEZ' in serv_des or '1ERA VEZ' in serv_des or serv_cod.startswith('8902'):
                tipo = 'PRIMERA_VEZ'
                t_label = '1ra Vez'
            elif 'CONTROL' in serv_des or 'SEGUIMIENTO' in serv_des or serv_cod.startswith('8903'):
                tipo = 'CONTROL'
                t_label = 'Control'
            else:
                tipo = 'OTRA'
                t_label = 'Otra'

            cumplida = row.get('cita_cumplida', '').strip().upper() == 'S'
            r_val = 'S' if cumplida else 'N'
            side = 'si' if cumplida else 'no'
            is_real_int = 1 if cumplida else 0
            is_pv_int = 1 if tipo == 'PRIMERA_VEZ' else 0
            is_ctrl_int = 1 if tipo == 'CONTROL' else 0

            # Diagnostics tracking
            if is_odo:
                diag_totals_odo[dx_desc] += 1
                mapKey = (2026, mes_nom, med, spec, dx_desc)
                diag_counts_odo[mapKey][0] += 1
                diag_counts_odo[mapKey][1] += is_real_int
                diag_counts_odo[mapKey][2] += is_pv_int
                diag_counts_odo[mapKey][3] += is_ctrl_int
            else:
                diag_totals_cisen[dx_desc] += 1
                mapKey = (2026, mes_nom, med, spec, dx_desc)
                diag_counts_cisen[mapKey][0] += 1
                diag_counts_cisen[mapKey][1] += is_real_int
                diag_counts_cisen[mapKey][2] += is_pv_int
                diag_counts_cisen[mapKey][3] += is_ctrl_int

            # Save specialist info
            target_specialists = specialists_odo if is_odo else specialists_cisen
            target_specialties = specialties_odo if is_odo else specialties_cisen
            target_specialties.add(spec)
            if med not in target_specialists:
                target_specialists[med] = {'id': doc_med or med, 'name': med, 'specialty': spec}

            # Accumulate monthly metrics
            target_monthly = citas_monthly_odo if is_odo else citas_monthly_cisen
            target_monthly[mes]['total'] += 1
            if cumplida:
                target_monthly[mes]['realizadas'] += 1
            if tipo == 'PRIMERA_VEZ':
                target_monthly[mes]['primera_vez'] += 1
            elif tipo == 'CONTROL':
                target_monthly[mes]['control'] += 1

            # Accumulate by spec
            target_spec = citas_by_spec_odo if is_odo else citas_by_spec_cisen
            target_spec[(mes, spec)]['total'] += 1
            if cumplida:
                target_spec[(mes, spec)]['realizadas'] += 1
            if tipo == 'PRIMERA_VEZ':
                target_spec[(mes, spec)]['primera_vez'] += 1
            elif tipo == 'CONTROL':
                target_spec[(mes, spec)]['control'] += 1

            # Accumulate by doc
            target_doc = citas_by_doc_odo if is_odo else citas_by_doc_cisen
            target_doc[(mes, med)]['total'] += 1
            if cumplida:
                target_doc[(mes, med)]['realizadas'] += 1
            if tipo == 'PRIMERA_VEZ':
                target_doc[(mes, med)]['primera_vez'] += 1
            elif tipo == 'CONTROL':
                target_doc[(mes, med)]['control'] += 1

            # Accumulate tableData
            target_table_map = table_data_odo_map if is_odo else table_data_cisen_map
            tbl_key = (2026, mes_nom, med, spec)
            target_table_map[tbl_key]['totalCitas'] += 1
            if cumplida:
                target_table_map[tbl_key]['realizadas'] += 1
            if tipo == 'PRIMERA_VEZ':
                target_table_map[tbl_key]['primeraVez'] += 1
            elif tipo == 'CONTROL':
                target_table_map[tbl_key]['control'] += 1

            # Accumulate daily
            target_daily = daily_odo if is_odo else daily_cisen
            target_daily[dia_str]['honorarios'] += 1
            if cumplida:
                target_daily[dia_str]['realizadas'] += 1
            if tipo == 'PRIMERA_VEZ':
                target_daily[dia_str]['primeraVez'] += 1
            elif tipo == 'CONTROL':
                target_daily[dia_str]['control'] += 1

            # Accumulate attendance
            target_att_ym = attendance_ym_odo if is_odo else attendance_ym_cisen
            target_att_ym[mes_nom]['total'] += 1
            target_att_ym[mes_nom][side]['total'] += 1
            if tipo == 'PRIMERA_VEZ':
                target_att_ym[mes_nom][side]['primeraVez'] += 1
            elif tipo == 'CONTROL':
                target_att_ym[mes_nom][side]['control'] += 1

            att_spec_key = f'2026_{mes}_{spec}'
            target_att_spec = attendance_spec_odo if is_odo else attendance_spec_cisen
            target_att_spec[att_spec_key]['total'] += 1
            target_att_spec[att_spec_key][side]['total'] += 1
            if tipo == 'PRIMERA_VEZ':
                target_att_spec[att_spec_key][side]['primeraVez'] += 1
            elif tipo == 'CONTROL':
                target_att_spec[att_spec_key][side]['control'] += 1

            att_doc_key = f'2026_{mes}_{med}'
            target_att_doc = attendance_doc_odo if is_odo else attendance_doc_cisen
            target_att_doc[att_doc_key]['total'] += 1
            target_att_doc[att_doc_key][side]['total'] += 1
            if tipo == 'PRIMERA_VEZ':
                target_att_doc[att_doc_key][side]['primeraVez'] += 1
            elif tipo == 'CONTROL':
                target_att_doc[att_doc_key][side]['control'] += 1

            # Modal appointment item
            edad = calc_age(row.get('f_nacimiento'), row.get('fecha_hora'))
            f_clean = row.get('fecha_hora', '')[:16].replace('T', ' ')
            ord_list = orders_by_reg.get(reg, [])

            cita_obj = {
                'f': f_clean,
                'c': cedula,
                'p': cedula,
                'edad': edad,
                'reg': reg,
                'diag': dx_desc,
                'dx': dx_code,
                'esp': med,
                'espNom': spec,
                'cups': serv_cod,
                's': serv_des,
                't': t_label,
                'r': r_val,
                'ord': ord_list
            }
            appointments_by_month_doc[mes_nom][med].append(cita_obj)

    print("4. Consolidando JSON para CIS EMCALI y Odontología con Diagnósticos propios...")

    def build_dashboard_json(is_odo):
        name = "odontologia" if is_odo else "cisen"
        specialists = list((specialists_odo if is_odo else specialists_cisen).values())
        specialists.sort(key=lambda s: s['name'])
        specialties = sorted(list(specialties_odo if is_odo else specialties_cisen))
        
        c_monthly = citas_monthly_odo if is_odo else citas_monthly_cisen
        o_monthly = orders_monthly_odo if is_odo else orders_monthly_cisen
        
        c_by_spec = citas_by_spec_odo if is_odo else citas_by_spec_cisen
        o_by_spec = orders_by_spec_odo if is_odo else orders_by_spec_cisen

        c_by_doc = citas_by_doc_odo if is_odo else citas_by_doc_cisen
        o_by_doc = orders_by_doc_odo if is_odo else orders_by_doc_cisen

        table_map = table_data_odo_map if is_odo else table_data_cisen_map
        table_data = []
        for (anio, mes_nom, med, spec), vals in sorted(table_map.items(), key=lambda x: (x[0][0], x[0][1], -x[1]['totalCitas'])):
            table_data.append({
                'anio': anio,
                'mes': mes_nom,
                'especialista': med,
                'especialidad': spec,
                'totalCitas': vals['totalCitas'],
                'realizadas': vals['realizadas'],
                'primeraVez': vals['primeraVez'],
                'control': vals['control']
            })

        daily_data = daily_odo if is_odo else daily_cisen
        daily_list = [{'date': d, **vals} for d, vals in sorted(daily_data.items())]

        data_by_ym = {'2026': {}}
        months_with_data = []
        for m in range(1, 13):
            mes_nom = MESES[m]
            cdata = c_monthly.get(m, {})
            odata = o_monthly.get(m, {})
            tot_hono = cdata.get('total', 0)
            if tot_hono > 0:
                months_with_data.append(mes_nom)
            tot_lab = odata.get('laboratorios', 0)
            tot_med = odata.get('medicamentos', 0)
            tot_real = cdata.get('realizadas', 0)
            tot_pv = cdata.get('primera_vez', 0)
            tot_ctrl = cdata.get('control', 0)

            data_by_ym['2026'][mes_nom] = {
                'totalHonorarios': tot_hono,
                'totalLaboratorios': tot_lab,
                'totalMedicamentos': tot_med,
                'totalConsultasRealizadas': tot_real,
                'totalConsultasPrimeraVez': tot_pv,
                'totalConsultasControl': tot_ctrl,
                'orders': {
                    'medicamentos': odata.get('medicamentos', 0),
                    'laboratorios': odata.get('laboratorios', 0),
                    'honorarios': odata.get('honorarios', 0),
                    'procedimientos': odata.get('procedimientos', 0),
                    'ecografias': odata.get('ecografias', 0),
                    'imagenes': odata.get('imagenes', 0)
                }
            }

        # bySpecialty and ordersBySpecialty
        by_spec = {}
        orders_by_spec = {}
        for (m, spec), cvals in c_by_spec.items():
            key = f'2026_{m}_{spec}'
            by_spec[key] = {
                'totalHonorarios': cvals['total'],
                'consultasRealizadas': cvals['realizadas'],
                'consultasPrimeraVez': cvals['primera_vez'],
                'consultasControl': cvals['control']
            }
        
        for (m, spec), ovals in o_by_spec.items():
            key = f'2026_{m}_{spec}'
            orders_by_spec[key] = {
                'medicamentos': ovals.get('medicamentos', 0),
                'laboratorios': ovals.get('laboratorios', 0),
                'honorarios': ovals.get('honorarios', 0),
                'procedimientos': ovals.get('procedimientos', 0),
                'ecografias': ovals.get('ecografias', 0),
                'imagenes': ovals.get('imagenes', 0),
                'total': ovals.get('total', 0)
            }

        # bySpecialist and ordersBySpecialist
        by_doc = {}
        orders_by_doc = {}
        for (m, med), cvals in c_by_doc.items():
            key = f'2026_{m}_{med}'
            by_doc[key] = {
                'totalHonorarios': cvals['total'],
                'consultasRealizadas': cvals['realizadas'],
                'consultasPrimeraVez': cvals['primera_vez'],
                'consultasControl': cvals['control']
            }

        for (m, med), ovals in o_by_doc.items():
            key = f'2026_{m}_{med}'
            orders_by_doc[key] = {
                'medicamentos': ovals.get('medicamentos', 0),
                'laboratorios': ovals.get('laboratorios', 0),
                'honorarios': ovals.get('honorarios', 0),
                'procedimientos': ovals.get('procedimientos', 0),
                'ecografias': ovals.get('ecografias', 0),
                'imagenes': ovals.get('imagenes', 0),
                'total': ovals.get('total', 0)
            }

        # Build board-specific diagMap and diagnosticsList
        target_diag_totals = diag_totals_odo if is_odo else diag_totals_cisen
        target_diag_counts = diag_counts_odo if is_odo else diag_counts_cisen
        diag_map = defaultdict(list)
        for (anio, mes_n, med_n, sp_n, dx_n), (tot, real, pvez, ctrl) in target_diag_counts.items():
            diag_map[dx_n].append([anio, mes_n, med_n, sp_n, tot, real, pvez, ctrl])

        sorted_diags = sorted(target_diag_totals.items(), key=lambda x: -x[1])
        diag_list = [{'name': d, 'count': c} for d, c in sorted_diags]

        # Ordering groups for this board
        if is_odo:
            ord_groups = ['Medicamentos', 'Honorarios Médicos', 'Imágenes Diagnósticas']
        else:
            ord_groups = ['Medicamentos', 'Laboratorio Clínico', 'Honorarios Médicos', 'Procedimientos Quirúrgicos', 'Ecografías', 'Imágenes Diagnósticas']

        result = {
            'years': [2026],
            'months': months_with_data if len(months_with_data) > 0 else [m for m in MESES if m],
            'specialists': specialists,
            'specialties': specialties,
            'orderingGroups': ord_groups,
            'dataByYearMonth': data_by_ym,
            'ordersBySpecialty': orders_by_spec,
            'ordersBySpecialist': orders_by_doc,
            'dailyTrend': {'2026': daily_list},
            'bySpecialty': by_spec,
            'bySpecialist': by_doc,
            'tableData': table_data,
            'diagnosticsList': diag_list,
            'diagMap': diag_map,
            'attendanceByYM': {'2026': attendance_ym_odo if is_odo else attendance_ym_cisen},
            'attendanceBySpecialty': attendance_spec_odo if is_odo else attendance_spec_cisen,
            'attendanceBySpecialist': attendance_doc_odo if is_odo else attendance_doc_cisen
        }

        out_path = f'src/data/{name}Data.json'
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"Generado {out_path} exitosamente. Especialistas: {len(specialists)}, Especialidades: {len(specialties)}, Diagnósticos: {len(diag_list)}, Filas tabla: {len(table_data)}")

    build_dashboard_json(is_odo=False) # CIS EMCALI
    build_dashboard_json(is_odo=True)  # Odontología

    print("5. Actualizando archivos de citas mensuales para el modal...")
    for m in range(1, 13):
        mes_nom = MESES[m]
        citas_file = f'public/data/citas/2026_{mes_nom}.json'
        
        existing_data = {}
        if os.path.exists(citas_file):
            try:
                with open(citas_file, 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)
            except Exception as e:
                print(f"Error leyendo {citas_file}: {e}")

        new_data = {**existing_data}
        amb_docs = appointments_by_month_doc.get(mes_nom, {})
        for med, citas_list in amb_docs.items():
            new_data[med] = citas_list

        with open(citas_file, 'w', encoding='utf-8') as f:
            json.dump(new_data, f, ensure_ascii=False)

    print("\n¡Proceso de generación completado exitosamente!")

if __name__ == '__main__':
    process_ambulatorio()
