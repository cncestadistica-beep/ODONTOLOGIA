import glob, json

def audit(domain, main_json_path, folder_path):
    with open(main_json_path, 'r', encoding='utf-8') as f:
        main_d = json.load(f)
    
    chart_totals = {}
    for m, v in main_d.get('dataByYearMonth', {}).get('2026', {}).items():
        for grp, cnt in v.get('orders', {}).items():
            chart_totals[grp] = chart_totals.get(grp, 0) + cnt
            
    modal_totals = {}
    for f in glob.glob(f'{folder_path}/2026_*.json'):
        with open(f, 'r', encoding='utf-8') as fp:
            d = json.load(fp)
            for doc, clist in d.items():
                for c in clist:
                    for o in c.get('ord', []):
                        conc = (o.get('c') or '').upper().strip()
                        raw_g = (o.get('g') or '').strip().lower()
                        grp = 'otros'
                        if conc == 'MEDI' or 'medicamento' in raw_g: grp = 'medicamentos'
                        elif conc == 'LABO' or 'laboratorio' in raw_g: grp = 'laboratorios'
                        elif conc == 'HONO' or 'honorario' in raw_g: grp = 'honorarios'
                        elif conc == 'PRQX' or any(x in raw_g for x in ['quirurg', 'procedimiento', 'cirug']): grp = 'procedimientos'
                        elif conc == 'ECOG' or 'ecograf' in raw_g: grp = 'ecografias'
                        elif conc in ['IMAG', 'TOMO', 'RMAG', 'CARD', 'OTDX'] or any(x in raw_g for x in ['imagen', 'imágen', 'radiolog', 'tomograf', 'resonanc']): grp = 'imagenes'
                        modal_totals[grp] = modal_totals.get(grp, 0) + 1
                        
    print('========================================================================')
    print(f'   AUDITORIA MATEMATICA: {domain.upper()}')
    print('========================================================================')
    all_keys = sorted(set(chart_totals.keys()) | set(modal_totals.keys()))
    diff_count = 0
    for k in all_keys:
        c_val = chart_totals.get(k, 0)
        m_val = modal_totals.get(k, 0)
        diff = c_val - m_val
        status = 'EXACTO (0 DIF)' if diff == 0 else f'DIFERENCIA: {diff:+d}'
        if diff != 0: diff_count += 1
        print(f'  {k.capitalize():<18}: Tablero/Grafico = {c_val:>8} | Modal Detalle = {m_val:>8} -> [{status}]')
    result = "PERFECTO 100%" if diff_count == 0 else f"{diff_count} DISCREPANCIAS"
    print(f'Resultado final {domain}: {result}\n')

audit('Central de Especialistas', 'src/data/centralEspecialistasData.json', 'public/data/citas')
audit('CIS EMCALI', 'src/data/cisenData.json', 'public/data/citas_cisen')
audit('Odontologia', 'src/data/odontologiaData.json', 'public/data/citas_odonto')
