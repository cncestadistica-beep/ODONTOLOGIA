import openpyxl,json,collections
from pathlib import Path
w=openpyxl.load_workbook(r'C:/Users/CNESTAD003/Desktop/asistencia09.xlsx',read_only=True,data_only=True)
print('SUMMARY SHEET',[(i,list(r)) for i,r in enumerate(w['Hoja1'].values,1) if any(v is not None for v in r)])
s=w['asistencia09']; it=iter(s.values); headers=next(it); rows=[dict(zip(headers,r)) for r in it if any(v is not None for v in r)]
for field in ['cita_cumplida','ind_cancelada','concepto','unidad_servicio']:
 print(field,collections.Counter(str(r[field]) for r in rows))
print('months',collections.Counter(str(r['fecha_hora'])[:7] for r in rows))
for f in ['registro','registro2','reg3']:
 c=collections.Counter(str(r[f]) for r in rows); print(f,'unique',len(c),'duplicate excess',sum(v-1 for v in c.values()))
print('status cancel',collections.Counter((r['cita_cumplida'],r['ind_cancelada']) for r in rows))
print('formulas Hoja1',[(c.coordinate,c.value) for row in openpyxl.load_workbook(r'C:/Users/CNESTAD003/Desktop/asistencia09.xlsx',read_only=True,data_only=False)['Hoja1'] for c in row if c.value is not None])
Path('scripts/attendance_excel_audit.json').write_text(json.dumps([{k:str(r[k]) for k in ['registro','registro2','reg3','cita_cumplida','ind_cancelada','concepto','doc_medico','especialidad','fecha_hora','servicio']} for r in rows]),encoding='utf-8')
