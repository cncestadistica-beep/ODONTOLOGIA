import os
import sys
import json
import glob
from collections import defaultdict
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def clean_text(s):
    if not s:
        return ''
    s = str(s).strip()
    s = s.replace('ORTOPEDIA Y TRAUMATOLOG\ufffdA', 'ORTOPEDIA Y TRAUMATOLOGÍA')
    s = s.replace('GINECOBSTETRICIA / GINECOLOG\ufffdA', 'GINECOBSTETRICIA / GINECOLOGÍA')
    s = s.replace('ANESTESIOLOG\ufffdA', 'ANESTESIOLOGÍA')
    s = s.replace('DERMATOLOG\ufffdA', 'DERMATOLOGÍA')
    s = s.replace('OFTALMOLOG\ufffdA', 'OFTALMOLOGÍA')
    s = s.replace('UROLOG\ufffdA', 'UROLOGÍA')
    s = s.replace('CARDIOLOG\ufffdA', 'CARDIOLOGÍA')
    s = s.replace('CIRUG\ufffdA', 'CIRUGÍA')
    s = s.replace('PEDIATR\ufffdA', 'PEDIATRÍA')
    s = s.replace('NEUMOLOG\ufffdA', 'NEUMOLOGÍA')
    s = s.replace('REUMATOLOG\ufffdA', 'REUMATOLOGÍA')
    s = s.replace('NEUROLOG\ufffdA', 'NEUROLOGÍA')
    s = s.replace('ONCOLOG\ufffdA', 'ONCOLOGÍA')
    s = s.replace('GASTROENTEROLOG\ufffdA', 'GASTROENTEROLOGÍA')
    s = s.replace('OTORRINOLARINGOLOG\ufffdA', 'OTORRINOLARINGOLOGÍA')
    s = s.replace('FISIATR\ufffdA', 'FISIATRÍA')
    s = s.replace('PSIQUIATR\ufffdA', 'PSIQUIATRÍA')
    s = s.replace('ENDOCRINOLOG\ufffdA', 'ENDOCRINOLOGÍA')
    s = s.replace('\ufffd', 'Ñ') if any(w in s for w in ['PATI\ufffdO', 'ZU\ufffdIGA', 'CASTA\ufffdEDA', 'PE\ufffdA', 'MU\ufffdOZ', 'IBARG\ufffdEN', 'QUI\ufffdONES', 'BA\ufffdOL']) else s
    s = s.replace('\ufffd', '')
    return s

def sync_appointments():
    DB_HOST = os.getenv('DB_HOST', '172.21.21.37')
    DB_PORT = os.getenv('DB_PORT', '5432')
    DB_NAME = os.getenv('DB_NAME', 'icosalud_quinta')
    DB_USER = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD = os.getenv('DB_PASSWORD')

    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD
    )
    conn.set_client_encoding('LATIN9')
    cur = conn.cursor()
    MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

    os.makedirs('public/data/citas', exist_ok=True)

    if '--all' in sys.argv:
        years_to_process = [2026, 2025, 2024]
    else:
        # Default to current year for fast 10-second updates; use --all for full historical sync
        years_to_process = [2026]

    for yr in years_to_process:
        print(f'Procesando {yr}: extrayendo órdenes completas de fórmulas aprobadas...')
        cur.execute(f'''
        SELECT 
            fd.registro,
            EXTRACT(month FROM fe.fecha_formula)::int as mes,
            TO_CHAR(fe.fecha_formula, 'YYYY-MM-DD HH24:MI') as fecha,
            c.concepto,
            fd.servicio as codigo,
            COALESCE(TRIM(s.descripcion), fd.servicio) as descripcion,
            fd.cantidad,
            fd.frecuencia,
            fd.observacion,
            COALESCE(TRIM(t.nombre), TRIM(us.nombre), 'MEDICO ESPECIALISTA') as medico,
            COALESCE(TRIM(esp.descripcion), TRIM(us.especialidad), 'MEDICINA GENERAL') as especialidad,
            r.historia,
            COALESCE(p.cedula, '') as cedula,
            TRIM(COALESCE(p.nombre,'') || ' ' || COALESCE(p.nombre2,'') || ' ' || COALESCE(p.primer_apellido,'') || ' ' || COALESCE(p.segundo_apellido,'')) as paciente,
            DATE_PART('year', AGE(fe.fecha_formula, p.fecha_nacimiento))::int as edad
        FROM formula_detalle fd
        JOIN formula_encabezado fe ON fd.registro = fe.registro AND fd.formula = fe.formula
        JOIN concepto c ON fd.concepto = c.concepto
        JOIN registro r ON fd.registro = r.registro
        JOIN unidad_servicio u ON r.unidad_servicio = u.unidad_servicio
        LEFT JOIN paciente p ON r.historia = p.historia
        LEFT JOIN usuario us ON fe.usuario = us.usuario
        LEFT JOIN tercero t ON t.tercero = COALESCE(fe.medico, us.tercero_citas, us.medico, us.documento, fe.usuario)
        LEFT JOIN especialidad esp ON COALESCE(t.especialidad, us.especialidad) = esp.especialidad
        LEFT JOIN servicio s ON fd.servicio = s.servicio AND fd.concepto = s.concepto
        WHERE fe.ind_aprobada = 'S'
          AND fe.fecha_formula >= '{yr}-01-01 00:00:00' AND fe.fecha_formula <= LEAST('{yr}-12-31 23:59:59'::timestamp, CURRENT_TIMESTAMP)
          AND u.unidad_servicio IN ('11','16','21')
          AND c.concepto IN ('MEDI', 'LABO', 'HONO', 'PRQX', 'ECOG', 'IMAG', 'TOMO', 'RMAG', 'CARD', 'OTDX')
        ORDER BY fd.registro;
        ''')
        formula_rows = cur.fetchall()

        all_formula_orders = []
        orders_by_reg = defaultdict(list)

        for idx, (reg, mes_num, fecha, conc, cod, desc, cant, freq, obs, medico, esp, hist, ced, pac, edad) in enumerate(formula_rows):
            reg_str = str(reg).strip()
            
            if conc == 'MEDI':
                grupo = 'Medicamentos'
            elif conc == 'LABO':
                grupo = 'Laboratorio Clínico'
            elif conc == 'HONO':
                grupo = 'Honorarios Médicos'
            elif conc == 'PRQX':
                grupo = 'Procedimientos Quirúrgicos'
            elif conc == 'ECOG':
                grupo = 'Ecografías'
            elif conc in ('IMAG', 'TOMO', 'RMAG', 'CARD', 'OTDX'):
                grupo = 'Imágenes Diagnósticas'
            else:
                continue

            order_item = {
                'ord_id': idx,
                'reg': reg_str,
                'mes': mes_num,
                'fecha': fecha,
                'g': grupo,
                'c': conc,
                'cod': str(cod).strip(),
                'd': clean_text(desc),
                'cant': float(cant) if cant is not None else 1,
                'fr': clean_text(freq) if freq else '',
                'obs': clean_text(obs) if obs else '',
                'medico': clean_text(medico),
                'esp': clean_text(esp),
                'cedula': clean_text(ced),
                'paciente': clean_text(pac) if pac else f'HISTORIA {hist}',
                'edad': edad if (edad and 0 < edad < 120) else None
            }
            all_formula_orders.append(order_item)
            orders_by_reg[reg_str].append(order_item)

        print(f'{yr}: {len(all_formula_orders)} órdenes procesadas de {len(orders_by_reg)} registros.')

        print(f'Procesando {yr}: extrayendo citas de especialistas...')
        cur.execute(f'''
        SELECT 
            EXTRACT(month FROM c.fecha_hora)::int as mes,
            TRIM(t.nombre) as especialista,
            COALESCE(TRIM(e.descripcion), 'MEDICINA GENERAL') as especialidad,
            TO_CHAR(c.fecha_hora, 'YYYY-MM-DD HH24:MI') as fecha,
            COALESCE(c.cedula, c.historia, '') as cedula,
            TRIM(COALESCE(c.nombre, '')) as paciente,
            COALESCE(c.edad::int, 0) as edad,
            COALESCE(c.servicio, '') as cups,
            COALESCE(TRIM(s.descripcion), c.servicio, '') as servicio,
            CASE 
                WHEN s.descripcion ILIKE '%PRIMERA VEZ%' OR c.servicio LIKE '8902%' OR c.ind_primera_vez = 'S' THEN '1ra Vez'
                WHEN s.descripcion ILIKE '%CONTROL%' OR c.servicio LIKE '8903%' THEN 'Control'
                ELSE 'Consulta / Otro'
            END as tipo,
            COALESCE(c.ind_cumplida, 'N') as cumplida,
            (SELECT r.registro 
             FROM registro r 
             WHERE r.historia = c.historia 
               AND date(r.fecha_ingreso) = date(c.fecha_hora) 
             LIMIT 1) as registro
        FROM cita c
        JOIN tercero t ON t.tercero = c.tercero
        LEFT JOIN especialidad e ON e.especialidad = COALESCE(c.especialidad, t.especialidad)
        LEFT JOIN servicio s ON s.servicio = c.servicio AND s.concepto = c.concepto
        WHERE c.concepto = 'HONO' AND c.estado = 'A' AND t.tercero NOT IN ('55555')
          AND c.fecha_hora >= '{yr}-01-01 00:00:00' AND c.fecha_hora <= LEAST('{yr}-12-31 23:59:59'::timestamp, CURRENT_TIMESTAMP)
        ORDER BY c.fecha_hora ASC;
        ''')
        cita_rows = cur.fetchall()

        by_month_doc = defaultdict(lambda: defaultdict(list))
        seen_keys = set()
        attached_order_ids = set()
        saved_count = 0

        for mes, doc, esp, fecha, ced, pac, edad, cups, serv, tipo, cumplida, reg in cita_rows:
            clean_ced = clean_text(ced)
            clean_cups = clean_text(cups)
            reg_str = str(reg).strip() if reg else ''

            ord_list = []
            if reg_str in orders_by_reg:
                for o in orders_by_reg[reg_str]:
                    if o['ord_id'] not in attached_order_ids:
                        ord_list.append({
                            'g': o['g'],
                            'c': o['c'],
                            'cod': o['cod'],
                            'd': o['d'],
                            'cant': o['cant'],
                            'fr': o['fr'],
                            'obs': o['obs']
                        })
                        attached_order_ids.add(o['ord_id'])

            # Try decrementing registro by 1 if nothing attached
            if not ord_list and reg_str.isdigit():
                reg_minus_1 = str(int(reg_str) - 1)
                if reg_minus_1 in orders_by_reg:
                    for o in orders_by_reg[reg_minus_1]:
                        if o['ord_id'] not in attached_order_ids:
                            ord_list.append({
                                'g': o['g'],
                                'c': o['c'],
                                'cod': o['cod'],
                                'd': o['d'],
                                'cant': o['cant'],
                                'fr': o['fr'],
                                'obs': o['obs']
                            })
                            attached_order_ids.add(o['ord_id'])

            dup_key = (doc, mes, fecha, clean_ced, clean_cups, tipo, cumplida, reg_str)
            if dup_key in seen_keys:
                continue
            seen_keys.add(dup_key)

            mes_nom = MESES[mes]
            by_month_doc[mes_nom][doc].append({
                'f': fecha,
                'c': clean_ced,
                'p': clean_text(pac),
                'edad': edad if (edad and 0 < edad < 120) else None,
                'reg': reg_str,
                'diag': 'Consulta Médica Especializada',
                'dx': '',
                'esp': doc,
                'espNom': clean_text(esp),
                'cups': clean_cups,
                's': clean_text(serv),
                't': tipo,
                'r': cumplida,
                'ord': ord_list
            })
            saved_count += 1

        # Integrate all unattached orders so NOT A SINGLE ORDER IS DROPPED
        unattached_count = 0
        for o in all_formula_orders:
            if o['ord_id'] not in attached_order_ids:
                mes_nom = MESES[o['mes']]
                doc = o['medico'] or 'MEDICO ESPECIALISTA'
                by_month_doc[mes_nom][doc].append({
                    'f': o['fecha'],
                    'c': o['cedula'] or 'S/D',
                    'p': o['paciente'] or 'PACIENTE AMBULATORIO',
                    'edad': o['edad'],
                    'reg': o['reg'],
                    'diag': 'Prescripción Ambulatoria',
                    'dx': '',
                    'esp': doc,
                    'espNom': o['esp'] or 'MEDICINA GENERAL',
                    'cups': o['cod'],
                    's': o['d'],
                    't': 'Prescripción',
                    'r': 'S',
                    'ord': [{
                        'g': o['g'],
                        'c': o['c'],
                        'cod': o['cod'],
                        'd': o['d'],
                        'cant': o['cant'],
                        'fr': o['fr'],
                        'obs': o['obs']
                    }]
                })
                attached_order_ids.add(o['ord_id'])
                unattached_count += 1

        print(f'{yr}: {saved_count} citas vinculadas + {unattached_count} órdenes directas integradas.')
        print(f'{yr}: Total órdenes finales en JSON = {len(attached_order_ids)} de {len(all_formula_orders)} (100% integradas).')

        # Convert defaultdict to standard dict for JSON serialization
        final_by_month_doc = {m: dict(docs) for m, docs in by_month_doc.items()}

        for mes_nom, doc_dict in final_by_month_doc.items():
            with open(f'public/data/citas/{yr}_{mes_nom}.json', 'w', encoding='utf-8') as mf:
                json.dump(doc_dict, mf, ensure_ascii=False)

        # Synchronize exact orders directly into centralEspecialistasData.json for 100% mathematical zero-discrepancy
        if yr == 2026 and os.path.exists('src/data/centralEspecialistasData.json'):
            try:
                with open('src/data/centralEspecialistasData.json', 'r', encoding='utf-8') as fp:
                    ce_json = json.load(fp)

                if 'dataByYearMonth' in ce_json and '2026' in ce_json['dataByYearMonth']:
                    for mes_nom, doc_dict in final_by_month_doc.items():
                        m_orders = {
                            'medicamentos': 0, 'laboratorios': 0, 'honorarios': 0,
                            'procedimientos': 0, 'ecografias': 0, 'imagenes': 0
                        }
                        for doc, clist in doc_dict.items():
                            for c in clist:
                                for o in c.get('ord', []):
                                    g = o.get('g', '')
                                    if g == 'Medicamentos': m_orders['medicamentos'] += 1
                                    elif g == 'Laboratorio Clínico': m_orders['laboratorios'] += 1
                                    elif g == 'Honorarios Médicos': m_orders['honorarios'] += 1
                                    elif g == 'Procedimientos Quirúrgicos': m_orders['procedimientos'] += 1
                                    elif g == 'Ecografías': m_orders['ecografias'] += 1
                                    elif g == 'Imágenes Diagnósticas': m_orders['imagenes'] += 1

                        if mes_nom in ce_json['dataByYearMonth']['2026']:
                            ce_json['dataByYearMonth']['2026'][mes_nom]['orders'] = m_orders
                            ce_json['dataByYearMonth']['2026'][mes_nom]['totalLaboratorios'] = m_orders['laboratorios']
                            ce_json['dataByYearMonth']['2026'][mes_nom]['totalMedicamentos'] = m_orders['medicamentos']

                with open('src/data/centralEspecialistasData.json', 'w', encoding='utf-8') as fp:
                    json.dump(ce_json, fp, ensure_ascii=False, indent=2)
                print(f"      [OK] centralEspecialistasData.json sincronizado al 100% con las ordenes de {yr}.")
            except Exception as ex:
                print(f"      [AVISO] No se pudo sincronizar centralEspecialistasData.json: {ex}")

        print(f'Completado {yr} exitosamente.')

    # Diagnostics index
    print("Generando índice de diagnósticos (CIE 10)...")
    try:
        diag_map = defaultdict(list)
        diag_totals = defaultdict(int)
        doc_spec_map = {}
        if os.path.exists('src/data/centralEspecialistasData.json'):
            with open('src/data/centralEspecialistasData.json', 'r', encoding='utf-8') as f:
                main_data = json.load(f)
                for r in main_data.get('tableData', []):
                    doc_spec_map[r['especialista']] = r['especialidad']

        for fpath in glob.glob('public/data/citas/*.json'):
            base = os.path.basename(fpath).replace('.json', '')
            parts = base.split('_')
            if len(parts) != 2:
                continue
            year, mes = int(parts[0]), parts[1]
            with open(fpath, 'r', encoding='utf-8') as fp:
                data = json.load(fp)
                for doc, citas in data.items():
                    diag_counts_local = defaultdict(lambda: [0, 0, 0, 0])
                    for c in citas:
                        diag = (c.get('diag') or '').strip()
                        if not diag or diag in ('Consulta Médica Especializada', 'Prescripción Ambulatoria'):
                            continue
                        diag_totals[diag] += 1
                        is_real = 1 if c.get('r') == 'S' else 0
                        is_pvez = 1 if c.get('t') == '1ra Vez' else 0
                        is_ctrl = 1 if c.get('t') == 'Control' else 0
                        
                        entry = diag_counts_local[diag]
                        entry[0] += 1
                        entry[1] += is_real
                        entry[2] += is_pvez
                        entry[3] += is_ctrl
                    
                    for diag, (tot, real, pvez, ctrl) in diag_counts_local.items():
                        esp = doc_spec_map.get(doc, 'MEDICINA GENERAL')
                        diag_map[diag].append([year, mes, doc, esp, tot, real, pvez, ctrl])

        sorted_diags = sorted(diag_totals.items(), key=lambda x: -x[1])
        diag_list = [{'name': d, 'count': c} for d, c in sorted_diags]

        out_diag = {
            'diagnosticsList': diag_list,
            'diagMap': diag_map
        }
        with open('public/data/diagnostics.json', 'w', encoding='utf-8') as fp:
            json.dump(out_diag, fp, separators=(',', ':'))
        with open('src/data/diagnosticsList.json', 'w', encoding='utf-8') as fp2:
            json.dump(diag_list, fp2, separators=(',', ':'))
        print(f"Índice de diagnósticos creado: {len(diag_list)} diagnósticos únicos.")
    except Exception as e:
        print(f"Error generando diagnostics.json: {e}")

    cur.close()
    conn.close()

if __name__ == '__main__':
    sync_appointments()
