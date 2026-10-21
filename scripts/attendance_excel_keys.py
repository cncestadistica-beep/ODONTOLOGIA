import openpyxl,json,hashlib,collections
from pathlib import Path
w=openpyxl.load_workbook(r'C:/Users/CNESTAD003/Desktop/asistencia09.xlsx',read_only=True,data_only=True)
it=iter(w['asistencia09'].values);h=next(it);rows=[dict(zip(h,r)) for r in it]
def key(r):
 return hashlib.sha256('|'.join(str(r[k]).strip() for k in ['cedula','fecha_hora','doc_medico','servicio']).encode()).hexdigest()
Path('scripts/attendance_excel_keys.json').write_text(json.dumps([{'key':key(r),'status':r['cita_cumplida']} for r in rows]))
print('Excel HONO attendance',collections.Counter(r['cita_cumplida'] for r in rows if r['concepto']=='HONO'))
print('Excel blank concept attendance',collections.Counter(r['cita_cumplida'] for r in rows if r['concepto'] is None))
print('First pivot criterion matches',all((r['registro'] is not None)==(r['cita_cumplida']=='S') for r in rows))
