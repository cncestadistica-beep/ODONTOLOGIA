import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildAttendanceCharts,attendanceTable} from '../public/attendance-model.js';
const rows = JSON.parse(fs.readFileSync(new URL('../public/attendance-snapshot.json',import.meta.url)));
const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre','Todos los Meses'];
let checks=0;
for (const year of [2024,2025,2026]) for (const month of months) {
  const baseline=buildAttendanceCharts(rows,year,month,'Todas las Especialidades','Todos los Especialistas');
  const scopes=[['Todas las Especialidades','Todos los Especialistas'],...new Map(rows.filter(r=>r.year===year&&(month==='Todos los Meses'||r.month===months.indexOf(month)+1)).map(r=>[r.specialty+'|'+r.specialist,[r.specialty,r.specialist]])).values(),['No existe','No existe']];
  for (const [specialty,specialist] of scopes) {
    const result=buildAttendanceCharts(rows,year,month,specialty,specialist);
    for(const key of ['yesData','noData']) {
      const chart=result[key];
      assert.deepEqual(chart.items[0],baseline[key].items[0]);
      assert.equal(chart.items.slice(2).reduce((s,r)=>s+r.total,0),chart.items[1].total);
      assert(chart.items[1].total<=chart.items[0].total);
      assert.equal(chart.maxY,baseline[key].maxY);
      for(const item of chart.items) assert(item.percent>=0&&item.percent<=100);
    }
    checks++;
  }
  const hidden=buildAttendanceCharts(rows,year,month,'Todas las Especialidades','Todos los Especialistas',false,false);
  assert.deepEqual(hidden.yesData.items[0],baseline.yesData.items[0]);
  assert.equal(hidden.yesData.items[1].total,hidden.yesData.items.slice(2).reduce((s,r)=>s+r.total,0));
  const y=baseline.yesData.items[0],n=baseline.noData.items[0];
  if(y.baseTotal) assert(Math.abs(y.percent+n.percent-100)<1e-10);
}
console.log(`${checks} filter combinations passed; monthly bases, partitions, percentages and empty selections verified.`);
const previous=JSON.parse(fs.readFileSync(new URL('../public/attendance-table-data.json',import.meta.url)));
const table=attendanceTable(rows,previous);
assert.equal(table.reduce((s,r)=>s+r.totalCitas,0),rows.reduce((s,r)=>s+r.yes+r.no,0));
assert.equal(table.reduce((s,r)=>s+r.realizadas,0),rows.reduce((s,r)=>s+r.yes,0));
console.log('Table attendance totals match the charts.');
