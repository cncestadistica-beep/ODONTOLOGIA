const fs = require('node:fs');
const parser = require('@babel/parser');
const generate = require('@babel/generator').default;
const file = 'public/assets/index-f698ba9e.js';
let code = fs.readFileSync(file, 'utf8');
let view = fs.readFileSync('src/attendance-view.js', 'utf8');
const note = view.indexOf('P.createElement("p", {\n    className: "attendance-base-note"');
if (note !== -1) {
  const end = view.indexOf('P.createElement("section", {\n    className: "attendance-grid"', note);
  if(end === -1) throw new Error('Chart section missing');
  view = view.slice(0,note) + '(attendanceError || !attendanceRows) && P.createElement("p", { role: "status" }, attendanceError ? "No fue posible cargar los datos de asistencia." : "Cargando asistencias…"), ' + view.slice(end);
}
fs.writeFileSync('src/attendance-view.js', view);
const start=code.indexOf('function l_(');
const end=code.indexOf('function Qra(',start);
if(start<0||end<0) throw new Error('Dashboard integration points missing');
const chart=fs.readFileSync('src/attendance-chart.js','utf8');
const replacement=generate(parser.parse(chart+'\n'+view),{compact:true}).code;
code=code.slice(0,start)+replacement+code.slice(end);
parser.parse(code,{sourceType:'module'});
fs.writeFileSync(file,code);
console.log('Attendance components installed.');
