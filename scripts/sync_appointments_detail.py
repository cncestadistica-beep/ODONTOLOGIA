import os
import json
import glob
from collections import defaultdict
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def clean_text(s):
    if not s:
        return ''
    s = s.strip()
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

    for yr in [2026, 2025, 2024]:
        print(f'Procesando {yr}: extrayendo órdenes y recetas de fórmulas aprobadas...')
        cur.execute(f'''
        SELECT 
            fd.registro,
            c.concepto,
            c.nombre as concepto_nombre,
            fd.servicio as codigo,
            COALESCE(TRIM(s.descripcion), fd.servicio) as descripcion,
            fd.cantidad,
            fd.frecuencia,
            fd.observacion
        FROM formula_detalle fd
        JOIN formula_encabezado fe ON fd.registro = fe.registro AND fd.formula = fe.formula
        JOIN concepto c ON fd.concepto = c.concepto
        JOIN registro r ON fd.registro = r.registro
        JOIN unidad_servicio u ON r.unidad_servicio = u.unidad_servicio
        LEFT JOIN servicio s ON fd.servicio = s.servicio AND fd.concepto = s.concepto
        WHERE fe.ind_aprobada = 'S'
          AND fe.fecha_formula >= '{yr}-01-01 00:00:00' AND fe.fecha_formula <= '{yr}-12-31 23:59:59'
          AND u.unidad_servicio IN ('11','16','21')
          AND c.concepto IN ('MEDI', 'LABO', 'HONO', 'PRQX', 'ECOG', 'IMAG', 'TOMO', 'RMAG', 'CARD', 'OTDX')
        ORDER BY fd.registro;
        ''')
        formula_rows = cur.fetchall()
        orders_by_reg = {}
        for reg, conc, conc_nom, cod, desc, cant, freq, obs in formula_rows:
            reg_str = str(reg).strip()
            if reg_str not in orders_by_reg:
                orders_by_reg[reg_str] = []
            
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

            orders_by_reg[reg_str].append({
                'g': grupo,
                'c': conc,
                'cod': str(cod).strip(),
                'd': clean_text(desc),
                'cant': float(cant) if cant is not None else 1,
                'fr': clean_text(freq) if freq else '',
                'obs': clean_text(obs) if obs else ''
            })
        print(f'{yr}: {len(formula_rows)} órdenes indexadas en {len(orders_by_reg)} registros.')

        print(f'Procesando {yr}: extrayendo citas con edad, controles y diagnóstico...')
        cur.execute(f'''
        SELECT 
            EXTRACT(month FROM c.fecha_hora)::int as mes,
            TRIM(t.nombre) as especialista,
            COALESCE(TRIM(e.descripcion), 'MEDICINA GENERAL') as especialidad,
            TO_CHAR(c.fecha_hora, 'YYYY-MM-DD HH24:MI') as fecha,
            COALESCE(c.cedula, c.historia, '') as cedula,
            TRIM(COALESCE(c.nombre, '')) as paciente,
            COALESCE(
                DATE_PART('year', AGE(c.fecha_hora, (SELECT p.fecha_nacimiento FROM paciente p WHERE p.historia = c.historia OR p.cedula = c.cedula LIMIT 1)))::int,
                c.edad::int, 
                0
            ) as edad,
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
             LIMIT 1) as registro,
            diag.diag_desc,
            diag.diag_code
        FROM cita c
        JOIN tercero t ON t.tercero = c.tercero
        LEFT JOIN especialidad e ON e.especialidad = COALESCE(c.especialidad, t.especialidad)
        LEFT JOIN servicio s ON s.servicio = c.servicio AND s.concepto = c.concepto
        LEFT JOIN LATERAL (
            SELECT 
                COALESCE(TRIM(d.descripcion), TRIM(dp.diagnostico), TRIM(r.diagnostico_ingreso), '') as diag_desc,
                COALESCE(TRIM(dp.diagnostico), TRIM(r.diagnostico_ingreso), '') as diag_code
            FROM registro r
            LEFT JOIN diagnostico_paciente dp ON dp.registro = r.registro OR dp.registro = r.registro_principal
            LEFT JOIN diagnostico d ON d.diagnostico = COALESCE(dp.diagnostico, r.diagnostico_ingreso, r.diagnostico_1, r.diagnostico)
            WHERE r.historia = c.historia AND date(r.fecha_ingreso) = date(c.fecha_hora)
            ORDER BY dp.ind_principal DESC NULLS LAST, dp.fecha DESC NULLS LAST
            LIMIT 1
        ) diag ON true
        WHERE c.concepto = 'HONO' AND c.estado = 'A' AND t.tercero NOT IN ('55555')
          AND c.fecha_hora >= '{yr}-01-01 00:00:00' AND c.fecha_hora <= '{yr}-12-31 23:59:59'
        ORDER BY c.fecha_hora ASC;
        ''')
        rows = cur.fetchall()
        
        by_month_doc = {}
        seen_keys = set()
        saved_count = 0

        excluded_keywords = [
            'AUDITOR', 'ENFERMER', 'TRABAJO SOCIAL', 'TRABAJADORA SOCIAL',
            'TRABAJADOR SOCIAL', 'AUXILIAR'
        ]

        for mes, doc, esp, fecha, ced, pac, edad, cups, serv, tipo, cumplida, reg, diag_desc, diag_code in rows:
            clean_ced = ced.strip()
            clean_cups = cups.strip()
            reg_str = str(reg).strip() if reg else ''
            diag_str = clean_text(diag_desc) if diag_desc else ''
            code_str = str(diag_code).strip() if diag_code else ''
            
            full_role = f"{doc} {esp}".upper()
            is_excluded = any(k in full_role for k in excluded_keywords)

            # Check if original registro has orders
            ord_list = orders_by_reg.get(reg_str, [])
            
            # If no orders found and it is a doctor/specialist (not in excluded roles), decrement registro by 1 digit
            if not ord_list and not is_excluded and reg_str.isdigit():
                reg_minus_1 = str(int(reg_str) - 1)
                reg_str = reg_minus_1
                ord_list = orders_by_reg.get(reg_str, [])

            # Unique appointment key
            dup_key = (doc, mes, fecha, clean_ced, clean_cups, tipo, cumplida, reg_str)
            if dup_key in seen_keys:
                continue
            seen_keys.add(dup_key)

            mes_nom = MESES[mes]
            if mes_nom not in by_month_doc:
                by_month_doc[mes_nom] = {}
            if doc not in by_month_doc[mes_nom]:
                by_month_doc[mes_nom][doc] = []
            
            by_month_doc[mes_nom][doc].append({
                'f': fecha,
                'c': clean_ced,
                'p': clean_text(pac),
                'edad': edad if (edad and 0 < edad < 120) else None,
                'reg': reg_str,
                'diag': diag_str,
                'dx': code_str,
                'esp': doc,
                'espNom': esp,
                'cups': clean_cups,
                's': clean_text(serv),
                't': tipo,
                'r': cumplida,
                'ord': ord_list
            })
            saved_count += 1
        
        with open(f'public/data/citas_{yr}.json', 'w', encoding='utf-8') as f:
            json.dump(by_month_doc, f, ensure_ascii=False)
            
        for mes_nom, doc_dict in by_month_doc.items():
            with open(f'public/data/citas/{yr}_{mes_nom}.json', 'w', encoding='utf-8') as mf:
                json.dump(doc_dict, mf, ensure_ascii=False)
                
        print(f'Completado {yr}: {saved_count} citas únicas guardadas con órdenes vinculadas.')

    # Generar índice consolidado de diagnósticos (diagnostics.json)
    print("Generando índice de diagnósticos (CIE 10)...")
    try:
        diag_map = defaultdict(list)
        diag_totals = defaultdict(int)
        
        # Mapa de especialidad por doctor
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
                        if not diag:
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
        print(f"Índice de diagnósticos creado exitosamente: {len(diag_list)} diagnósticos únicos.")
    except Exception as e:
        print(f"Error generando diagnostics.json: {e}")

    cur.close()
    conn.close()
    print('Proceso finalizado exitosamente.')

if __name__ == '__main__':
    sync_appointments()
