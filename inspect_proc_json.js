import fs from 'fs';

const d = JSON.parse(fs.readFileSync('src/data/procedimientosMenoresData.json', 'utf8'));

console.log('Specialists count:', d.specialists.length);
console.log('Specialties count:', d.specialties.length);
console.log('Top 5 overall procedures:');
console.log(d.topProcedures.slice(0, 5));

console.log('\nData by month 2026:');
Object.entries(d.dataByYearMonth['2026']).forEach(([m, v]) => {
  console.log(`${m}: Total = ${v.total}, Pacientes = ${v.totalPacientes}, Especialistas = ${v.totalEspecialistas}`);
});
