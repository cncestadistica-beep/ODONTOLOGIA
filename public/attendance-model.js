export function attendanceTable(rows, previous) {
  const key = r => JSON.stringify([r.anio,r.mesNum,r.especialidad,r.especialista]);
  const table = new Map(previous.map(r => [key(r), {...r,totalCitas:0,realizadas:0,primeraVez:0,control:0}]));
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  for (const r of rows) {
    const identity={anio:r.year,mesNum:r.month,mes:months[r.month-1],especialidad:r.specialty,especialista:r.specialist};
    const id=key(identity);
    const item=table.get(id)||{...identity,totalCitas:0,realizadas:0,primeraVez:0,control:0,medicamentos:0,laboratorios:0,imagenes:0};
    item.totalCitas+=r.yes+r.no;
    item.realizadas+=r.yes;
    if(r.kind==='primeraVez') item.primeraVez+=r.yes+r.no;
    if(r.kind==='control') item.control+=r.yes+r.no;
    table.set(id,item);
  }
  return [...table.values()].map(r=>({...r,cumplimiento:`${r.totalCitas?(r.realizadas/r.totalCitas*100).toFixed(2):0}%`}));
}

// Every percentage uses the full selected month (or year), before other filters.
export function buildAttendanceCharts(rows, year, month, specialty, specialist, first = true, control = true) {
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const period = rows.filter(r => String(r.year) === String(year) && (month === 'Todos los Meses' || r.month === months.indexOf(month) + 1));
  const selected = period.filter(r => (specialty === 'Todas las Especialidades' || r.specialty === specialty) && (specialist === 'Todos los Especialistas' || r.specialist === specialist));
  const sum = list => list.reduce((a, r) => ({yes:a.yes+r.yes, no:a.no+r.no}), {yes:0,no:0});
  const monthly = sum(period);
  const base = monthly.yes + monthly.no;
  const visible = selected.filter(r => r.kind === 'otras' || (r.kind === 'primeraVez' ? first : control));
  const groups = [
    {name:month === 'Todos los Meses' ? 'Año' : 'Mes', sub:`(${month === 'Todos los Meses' ? year : month})`, ...monthly},
    {name:'Selección', sub:specialist !== 'Todos los Especialistas' ? specialist : specialty === 'Todas las Especialidades' ? '(Todas)' : specialty, ...sum(visible)},
  ];
  if (first) groups.push({name:'Consulta Primera',sub:'Vez',...sum(selected.filter(r=>r.kind==='primeraVez'))});
  if (control) groups.push({name:'Consulta Control',sub:'',...sum(selected.filter(r=>r.kind==='control'))});
  const other = sum(selected.filter(r=>r.kind==='otras'));
  if (other.yes + other.no) groups.push({name:'Otras consultas',sub:'',...other});
  const chart = mode => ({
    maxY:base || 1,
    ticks:Array.from({length:6},(_,i)=>Math.round(base*(5-i)/5)),
    items:groups.map(g=>({name:g.name,sub:g.sub,total:g[mode],
      percent:base ? g[mode]/base*100 : 0,
      recordsTotal:g.yes+g.no,attended:g.yes,absent:g.no,baseTotal:base})),
  });
  return {yesData:chart('yes'),noData:chart('no')};
}
