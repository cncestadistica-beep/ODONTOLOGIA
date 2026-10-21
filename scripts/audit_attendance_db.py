import os,psycopg2,json,hashlib,collections
from dotenv import load_dotenv
load_dotenv()
c=psycopg2.connect(host=os.environ['DB_HOST'],dbname=os.environ['DB_NAME'],user=os.environ['DB_USER'],password=os.environ['DB_PASSWORD'],connect_timeout=15)
c.set_session(readonly=True)
q=c.cursor()
q.execute("""SELECT c.cedula,c.fecha_hora,c.tercero,c.servicio,c.ind_cumplida,c.ind_cancelada,
 EXISTS(SELECT 1 FROM empresa e JOIN plan1 p ON p.empresa=e.empresa WHERE e.empresa=c.empresa AND p.plan1=c.plan1)
 FROM cita c JOIN tercero t ON t.tercero=c.tercero
 LEFT JOIN especialidad e ON e.especialidad=COALESCE(c.especialidad,t.especialidad)
 WHERE c.concepto='HONO' AND c.estado='A' AND t.tercero<>'55555'
 AND c.fecha_hora>='2026-08-01' AND c.fecha_hora<'2026-09-01'""")
rows=q.fetchall();print('DB current status',collections.Counter(r[4] for r in rows))
print('DB cancel/status',collections.Counter((r[5],r[4]) for r in rows));print('DB company-plan match/status',collections.Counter((r[6],r[4]) for r in rows))
def key(r): return hashlib.sha256('|'.join(str(v.replace(tzinfo=None) if hasattr(v, 'tzinfo') else v).strip() for v in r[:4]).encode()).hexdigest()
excel=json.load(open('scripts/attendance_excel_keys.json')); ex=collections.defaultdict(list);db=collections.defaultdict(list)
for r in excel: ex[r['key']].append(r['status'])
for r in rows: db[key(r)].append(r[4])
print('Excel key count',len(ex),'DB key count',len(db))
print('DB-only rows by status',collections.Counter(s for k,v in db.items() if k not in ex for s in v))
print('Excel-only rows by status',collections.Counter(s for k,v in ex.items() if k not in db for s in v))
print('Matched one-to-one statuses (Excel,DB)',collections.Counter((v[0],db[k][0]) for k,v in ex.items() if len(v)==1 and len(db.get(k,[]))==1))
print('Ambiguous matched keys',sum(1 for k,v in ex.items() if k in db and (len(v)!=1 or len(db[k])!=1)))
print('DB key types',[(type(v).__name__,len(str(v)),repr(v) if i else 'ID omitted') for i,v in enumerate(rows[0][:4])])

