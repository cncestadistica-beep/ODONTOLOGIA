import fs from 'fs';
import readline from 'readline';
import path from 'path';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function getMonthName(monthNum) {
  const idx = parseInt(monthNum, 10) - 1;
  return MONTH_NAMES[idx] || 'Enero';
}

function normalizeOrderGroup(concepto, descripcion) {
  const c = (concepto || '').toUpperCase().trim();
  const d = (descripcion || '').toLowerCase().trim();

  if (c === 'MEDICAMENTOS' || c === 'MEDI') return 'Medicamentos';
  if (c === 'LABORATORIO CLINICO' || c === 'LABO' || c === 'LABORATORIOS') return 'Laboratorio Clínico';
  if (c === 'HONORARIOS MEDICOS' || c === 'HONO' || c === 'HONORARIOS') return 'Honorarios Médicos';
  if (c === 'ECOGRAFIAS' || c === 'ECOG') return 'Ecografías';
  if (c === 'IMAGENOLOGIA' || c === 'IMAG' || c === 'IMAGENES' || c === 'TOMO' || c === 'RMAG') return 'Imágenes Diagnósticas';
  if (c === 'PROCEDIMIENTOS QUIRURGICOS' || c === 'PRQX' || c === 'OTDX' || c === 'CARD' || c === 'SORA' || c === 'PAOD') return 'Procedimientos Quirúrgicos';

  if (d.includes('medicamento')) return 'Medicamentos';
  if (d.includes('laboratorio')) return 'Laboratorio Clínico';
  if (d.includes('ecograf')) return 'Ecografías';
  if (d.includes('radiolog') || d.includes('imagen') || d.includes('tomograf') || d.includes('resonanc')) return 'Imágenes Diagnósticas';
  if (d.includes('quirurg') || d.includes('procedimiento') || d.includes('cirug')) return 'Procedimientos Quirúrgicos';
  if (d.includes('consulta') || d.includes('interconsulta') || d.includes('honorario')) return 'Honorarios Médicos';

  return 'Otros';
}

async function processAll() {
  console.log('========================================================================');
  console.log('   PROCESAMIENTO DE CSV: CIS EMCALI, ODONTOLOGIA Y ESPECIALISTAS        ');
  console.log('========================================================================');

  const consultasFile = 'consultas_ambulatorio.csv';
  const ordenamientosFile = 'ordenamientos_ambulatorio.csv';

  if (!fs.existsSync(consultasFile)) {
    console.error(`[ERROR] No se encontró el archivo: ${consultasFile}`);
    console.error('Por favor, coloca el archivo "consultas_ambulatorio.csv" en la carpeta principal del proyecto.');
    return;
  }

  // 1. Build patient name lookup dictionary
  console.log('[1/4] Construyendo diccionario maestro de nombres de pacientes...');
  const cedulaToName = new Map();
  const citasDir = 'public/data/citas';

  if (fs.existsSync(citasDir)) {
    const jsonFiles = fs.readdirSync(citasDir).filter(f => f.endsWith('.json'));
    jsonFiles.forEach(f => {
      try {
        const d = JSON.parse(fs.readFileSync(path.join(citasDir, f), 'utf8'));
        Object.values(d).forEach(citas => {
          (citas || []).forEach(c => {
            const ced = c.c ? String(c.c).trim() : null;
            const nom = c.p ? String(c.p).trim() : null;
            if (ced && nom && !/^\d+$/.test(nom) && nom !== 'PACIENTE SIN REGISTRO' && nom.length > 2) {
              cedulaToName.set(ced, nom);
            }
          });
        });
      } catch (e) {}
    });
  }
  console.log(`      ✓ ${cedulaToName.size} pacientes registrados en el diccionario.`);

  // Load CIE 10 Dictionary
  let cie10Dict = {};
  const cie10DictPath = 'src/data/cie10Dictionary.json';
  if (fs.existsSync(cie10DictPath)) {
    try {
      cie10Dict = JSON.parse(fs.readFileSync(cie10DictPath, 'utf8'));
      console.log(`      ✓ Diccionario CIE 10 cargado con ${Object.keys(cie10Dict).length} diagnósticos.`);
    } catch (e) {}
  }

  function getDiagnosisDescription(rawCode) {
    if (!rawCode) return 'SIN DIAGNÓSTICO ESPECIFICADO';
    const codeClean = String(rawCode).trim().toUpperCase();
    if (cie10Dict[codeClean]) return cie10Dict[codeClean];
    if (cie10Dict[codeClean.slice(0, 3)]) return cie10Dict[codeClean.slice(0, 3)];
    if (codeClean.length > 5 && !/^[A-Z]\d{2}/.test(codeClean)) {
      return codeClean;
    }
    return `DIAGNÓSTICO ${codeClean}`;
  }

  // 2. Ingest Consultas
  console.log(`[2/4] Leyendo ${consultasFile}...`);
  const cStream = fs.createReadStream(consultasFile, { encoding: 'utf8' });
  const cRl = readline.createInterface({ input: cStream, crlfDelay: Infinity });

  let cHeader = null;
  const cisenConsultas = [];
  const odontoConsultas = [];
  const regToCitaMap = new Map();
  const citasByMonthAndDoc = {};

  MONTH_NAMES.forEach(m => {
    citasByMonthAndDoc[m] = {};
  });

  for await (const line of cRl) {
    if (!cHeader) {
      cHeader = line.split(';');
      continue;
    }
    if (!line.trim()) continue;
    const cols = line.split(';');

    const fecha = cols[2]?.trim();
    const cedula = cols[4]?.trim();
    const medico = cols[8]?.trim().toUpperCase();
    const especialidad = cols[9]?.trim();
    const cumplida = cols[12]?.trim().toUpperCase() === 'S';
    const cancelada = cols[13]?.trim().toUpperCase() === 'S';
    const primeraVez = cols[14]?.trim().toUpperCase() === 'S';
    const registro = cols[16]?.trim();
    const rawDx = cols[21]?.trim() || '';
    const diagDescription = getDiagnosisDescription(rawDx);
    const servicio = cols[25]?.trim() || '';
    const servicioDes = cols[26]?.trim() || '';

    if (!fecha || !medico) continue;

    const mMatch = fecha.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
    if (!mMatch) continue;

    const year = mMatch[1];
    const monthNum = mMatch[2];
    const monthName = getMonthName(monthNum);
    const day = mMatch[3];
    const hourMin = `${mMatch[4]}:${mMatch[5]}`;
    const fStr = `${year}-${monthNum}-${day} ${hourMin}`;

    const espLower = (especialidad || '').toLowerCase();
    const servDesLower = (servicioDes || '').toLowerCase();
    const sClean = (servicio || '').trim();

    const isOralHygieneService = sClean.startsWith('990112') || 
                                 sClean.startsWith('990212') || 
                                 sClean.startsWith('990312') || 
                                 sClean === 'PYP010' || 
                                 sClean === 'PYP30' || 
                                 sClean === '991201' ||
                                 servDesLower.includes('higiene oral') ||
                                 (servDesLower.includes('educac') && servDesLower.includes('higiene'));

    const isDentalService = isOralHygieneService ||
                            servDesLower.includes('salud oral') ||
                            servDesLower.includes('odontolog') ||
                            (servDesLower.includes('educac') && (servDesLower.includes('oral') || servDesLower.includes('odonto') || servDesLower.includes('dient'))) ||
                            ['990103', '990203', '890203T', 'S41236'].includes(sClean) ||
                            sClean.startsWith('23') || sClean.startsWith('24') || sClean.startsWith('997');

    const isOdonto = espLower.includes('odonto') || 
                     espLower.includes('higien') ||
                     espLower.includes('maxilo') ||
                     espLower.includes('oral') ||
                     isDentalService;

    let finalEsp = especialidad ? especialidad.toUpperCase() : 'ODONTOLOGÍA';
    if (isOralHygieneService && !finalEsp.includes('ODONTO') && !finalEsp.includes('HIGIEN')) {
      finalEsp = 'HIGIENISTA ORAL';
    }

    const currentMaxMonthNum = new Date().getMonth() + 1;
    if (year === '2026' && parseInt(monthNum, 10) > currentMaxMonthNum) {
      continue;
    }

    const patientName = cedulaToName.get(cedula) || cedula;

    const citaObj = {
      f: fStr,
      c: cedula,
      p: patientName,
      edad: 0,
      reg: registro,
      diag: diagDescription,
      dx: rawDx,
      esp: medico,
      espNom: finalEsp,
      cups: servicio,
      s: servicioDes || `CONSULTA POR ${finalEsp}`,
      t: primeraVez ? '1ra Vez' : 'Control',
      r: cumplida ? 'S' : 'N',
      ord: [],
      year,
      monthName,
      monthNum: parseInt(monthNum, 10),
      medico,
      especialidad: finalEsp,
      cumplida,
      cancelada,
      primeraVez,
      isOdonto
    };

    if (registro) {
      if (!regToCitaMap.has(registro)) {
        regToCitaMap.set(registro, []);
      }
      regToCitaMap.get(registro).push(citaObj);
    }

    if (isOdonto) {
      odontoConsultas.push(citaObj);
    } else {
      cisenConsultas.push(citaObj);
    }

    // Accumulate by month & doctor for detail modal JSONs
    if (year === '2026') {
      if (!citasByMonthAndDoc[monthName][medico]) {
        citasByMonthAndDoc[monthName][medico] = [];
      }
      citasByMonthAndDoc[monthName][medico].push(citaObj);
    }
  }

  console.log(`      ✓ Consultas procesadas: CIS EMCALI = ${cisenConsultas.length}, Odontología = ${odontoConsultas.length}`);

  // 3. Ingest Ordenamientos
  let totalOrdersCount = 0;
  const cisenOrders = [];
  const odontoOrders = [];

  if (fs.existsSync(ordenamientosFile)) {
    console.log(`[3/4] Leyendo ${ordenamientosFile}...`);
    const oStream = fs.createReadStream(ordenamientosFile, { encoding: 'utf8' });
    const oRl = readline.createInterface({ input: oStream, crlfDelay: Infinity });

    let oHeader = null;
    for await (const line of oRl) {
      if (!oHeader) {
        oHeader = line.split(';');
        continue;
      }
      if (!line.trim()) continue;
      const cols = line.split(';');

      const reg = cols[0]?.trim();
      const concepto = cols[2]?.trim();
      const fecha = cols[3]?.trim();
      const servicio = cols[6]?.trim();
      const descripcion = cols[7]?.trim();
      const observacion = cols[8]?.trim();
      const cantidad = parseFloat(cols[9]?.replace(',', '.')) || 1;
      const frecuencia = cols[10]?.trim();
      const medico = (cols[11]?.trim() || 'MEDICO AMBULATORIO').toUpperCase();
      const especialidad = (cols[12]?.trim() || 'MEDICINA GENERAL').toUpperCase();

      const grupo = normalizeOrderGroup(concepto, descripcion);
      let gKey = null;
      if (grupo === 'Medicamentos') gKey = 'medicamentos';
      else if (grupo === 'Laboratorio Clínico') gKey = 'laboratorios';
      else if (grupo === 'Honorarios Médicos') gKey = 'honorarios';
      else if (grupo === 'Procedimientos Quirúrgicos') gKey = 'procedimientos';
      else if (grupo === 'Ecografías') gKey = 'ecografias';
      else if (grupo === 'Imágenes Diagnósticas') gKey = 'imagenes';

      if (!gKey) continue;

      const espLower = especialidad.toLowerCase();
      const servDesLower = (descripcion || '').toLowerCase();
      const sClean = servicio.replace(/[^a-zA-Z0-9]/g, '');

      const isOdonto = espLower.includes('odonto') || 
                       espLower.includes('higien') ||
                       espLower.includes('maxilo') ||
                       espLower.includes('oral') ||
                       servDesLower.includes('salud oral') ||
                       servDesLower.includes('odontolog') ||
                       sClean.startsWith('23') || sClean.startsWith('24') || sClean.startsWith('997');

      const dateParts = fecha.split('/');
      let monthName = 'Enero';
      let monthNum = 1;
      let yr = '2026';
      if (dateParts.length >= 3) {
        monthNum = parseInt(dateParts[1], 10) || 1;
        monthName = MONTH_NAMES[monthNum - 1] || 'Enero';
        yr = dateParts[2].trim();
      }

      if (yr === '2026' && monthNum > (new Date().getMonth() + 1)) {
        continue;
      }

      const orderItem = {
        g: grupo,
        gKey,
        c: concepto,
        cod: servicio,
        d: descripcion,
        cant: cantidad,
        fr: frecuencia,
        obs: observacion,
        medico,
        especialidad,
        reg,
        fecha,
        monthName,
        monthNum,
        year: yr,
        isOdonto
      };

      totalOrdersCount++;

      if (isOdonto) {
        odontoOrders.push(orderItem);
      } else {
        cisenOrders.push(orderItem);
      }

      // Link to cita for detail modals without duplicating
      if (reg && regToCitaMap.has(reg)) {
        const citas = regToCitaMap.get(reg);
        const targetCita = citas.find(c => c.medico === medico) || citas[0];
        targetCita.ord.push(orderItem);
      } else if (yr === '2026') {
        // Prescribe in doctor's monthly bucket for detail modals so it is not dropped
        if (!citasByMonthAndDoc[monthName]) citasByMonthAndDoc[monthName] = {};
        if (!citasByMonthAndDoc[monthName][medico]) citasByMonthAndDoc[monthName][medico] = [];
        citasByMonthAndDoc[monthName][medico].push({
          f: fecha,
          c: 'S/D',
          p: 'PACIENTE AMBULATORIO',
          edad: null,
          reg: reg || 'S/D',
          diag: 'Prescripción Ambulatoria',
          dx: '',
          esp: medico,
          espNom: especialidad,
          cups: servicio,
          s: descripcion,
          t: 'Consulta',
          r: 'S',
          ord: [orderItem],
          year: yr,
          monthName,
          monthNum,
          medico,
          especialidad,
          cumplida: true,
          cancelada: false,
          primeraVez: false,
          isOdonto
        });
      }
    }
    console.log(`      ✓ Total órdenes vinculadas: ${totalOrdersCount} (CIS EMCALI: ${cisenOrders.length}, Odonto: ${odontoOrders.length})`);
  } else {
    console.log(`      [AVISO] No se encontró ${ordenamientosFile}. Se procesarán solo consultas.`);
  }

  // 4. Build Dashboard Data Models
  console.log('[4/4] Generando modelos de tableros y actualizando JSONs...');

  function buildDashboardData(consultas, ordenesList, orderingGroupsList) {
    const specialistsMap = new Map();
    const specialtiesSet = new Set();
    const dataByYearMonth = { '2026': {} };
    const bySpecialty = {};
    const bySpecialist = {};
    const ordersBySpecialty = {};
    const ordersBySpecialist = {};
    const tableDataMap = new Map();
    const diagMap = {};
    const diagCounts = {};
    const procMap = {};
    const procCounts = {};

    const maxMonthNum = new Date().getMonth() + 1;
    MONTH_NAMES.slice(0, maxMonthNum).forEach(m => {
      dataByYearMonth['2026'][m] = {
        totalHonorarios: 0,
        totalLaboratorios: 0,
        totalMedicamentos: 0,
        totalConsultasRealizadas: 0,
        totalConsultasPrimeraVez: 0,
        totalConsultasControl: 0,
        orders: {
          medicamentos: 0,
          laboratorios: 0,
          honorarios: 0,
          procedimientos: 0,
          ecografias: 0,
          imagenes: 0
        }
      };
    });

    consultas.forEach(c => {
      const { year, monthName, monthNum, medico, especialidad, cumplida, primeraVez, diag } = c;
      if (year !== '2026') return;

      specialistsMap.set(medico, { id: c.c || '', name: medico, specialty: especialidad });
      specialtiesSet.add(especialidad);

      const mData = dataByYearMonth['2026'][monthName];
      mData.totalHonorarios++;
      if (cumplida) mData.totalConsultasRealizadas++;
      if (primeraVez) mData.totalConsultasPrimeraVez++;
      else mData.totalConsultasControl++;

      const specKey = `2026_${monthNum}_${especialidad}`;
      if (!bySpecialty[specKey]) {
        bySpecialty[specKey] = {
          totalHonorarios: 0,
          consultasRealizadas: 0,
          consultasPrimeraVez: 0,
          consultasControl: 0
        };
      }
      bySpecialty[specKey].totalHonorarios++;
      if (cumplida) bySpecialty[specKey].consultasRealizadas++;
      if (primeraVez) bySpecialty[specKey].consultasPrimeraVez++;
      else bySpecialty[specKey].consultasControl++;

      const docKey = `2026_${monthNum}_${medico}`;
      if (!bySpecialist[docKey]) {
        bySpecialist[docKey] = {
          totalHonorarios: 0,
          consultasRealizadas: 0,
          consultasPrimeraVez: 0,
          consultasControl: 0
        };
      }
      bySpecialist[docKey].totalHonorarios++;
      if (cumplida) bySpecialist[docKey].consultasRealizadas++;
      if (primeraVez) bySpecialist[docKey].consultasPrimeraVez++;
      else bySpecialist[docKey].consultasControl++;

      const tableKey = `2026_${monthName}_${medico}_${especialidad}`;
      if (!tableDataMap.has(tableKey)) {
        tableDataMap.set(tableKey, {
          anio: 2026,
          mes: monthName,
          especialista: medico,
          especialidad: especialidad,
          totalCitas: 0,
          realizadas: 0,
          primeraVez: 0,
          control: 0
        });
      }
      const tRow = tableDataMap.get(tableKey);
      tRow.totalCitas++;
      if (cumplida) tRow.realizadas++;
      if (primeraVez) tRow.primeraVez++;
      else tRow.control++;

      if (diag) {
        diagCounts[diag] = (diagCounts[diag] || 0) + 1;
        if (!diagMap[diag]) diagMap[diag] = [];
        diagMap[diag].push([2026, monthName, medico, especialidad, 1, cumplida ? 1 : 0, primeraVez ? 1 : 0, primeraVez ? 0 : 1]);
      }

      const procDesc = (c.s || '').trim() || `CONSULTA POR ${especialidad}`;
      const procCode = (c.cups || '').trim();
      const procLabel = procCode ? `${procCode} - ${procDesc}` : procDesc;

      procCounts[procLabel] = (procCounts[procLabel] || 0) + 1;
      if (!procMap[procLabel]) procMap[procLabel] = [];
      procMap[procLabel].push([2026, monthName, medico, especialidad, 1, cumplida ? 1 : 0, primeraVez ? 1 : 0, primeraVez ? 0 : 1, procCode, procDesc]);
    });

    // Process exact orders without dropping or duplicating
    ordenesList.forEach(o => {
      const { year, monthName, monthNum, medico, especialidad, gKey } = o;
      if (year !== '2026' || !gKey) return;

      const mData = dataByYearMonth['2026'][monthName];
      if (mData && mData.orders) {
        mData.orders[gKey] = (mData.orders[gKey] || 0) + 1;
        if (gKey === 'laboratorios') mData.totalLaboratorios++;
        if (gKey === 'medicamentos') mData.totalMedicamentos++;
      }

      const specKey = `2026_${monthNum}_${especialidad}`;
      if (!ordersBySpecialty[specKey]) {
        ordersBySpecialty[specKey] = { medicamentos: 0, laboratorios: 0, honorarios: 0, procedimientos: 0, ecografias: 0, imagenes: 0 };
      }
      ordersBySpecialty[specKey][gKey]++;

      const docKey = `2026_${monthNum}_${medico}`;
      if (!ordersBySpecialist[docKey]) {
        ordersBySpecialist[docKey] = { medicamentos: 0, laboratorios: 0, honorarios: 0, procedimientos: 0, ecografias: 0, imagenes: 0 };
      }
      ordersBySpecialist[docKey][gKey]++;

      specialistsMap.set(medico, { id: '', name: medico, specialty: especialidad });
      specialtiesSet.add(especialidad);

      const tableKey = `2026_${monthName}_${medico}_${especialidad}`;
      if (!tableDataMap.has(tableKey)) {
        tableDataMap.set(tableKey, {
          anio: 2026,
          mes: monthName,
          especialista: medico,
          especialidad: especialidad,
          totalCitas: 0,
          realizadas: 0,
          primeraVez: 0,
          control: 0
        });
      }
    });

    const diagnosticsList = Object.entries(diagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    const proceduresList = Object.entries(procCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => {
        const parts = name.split(' - ');
        const code = parts.length > 1 ? parts[0] : '';
        return { name, code, count };
      });

    const currentMaxMonthNum = new Date().getMonth() + 1;
    return {
      years: [2026],
      months: MONTH_NAMES.slice(0, currentMaxMonthNum),
      specialists: Array.from(specialistsMap.values()),
      specialties: Array.from(specialtiesSet).sort(),
      orderingGroups: orderingGroupsList,
      dataByYearMonth,
      ordersBySpecialty,
      ordersBySpecialist,
      bySpecialty,
      bySpecialist,
      tableData: Array.from(tableDataMap.values()),
      diagnosticsList,
      diagMap,
      proceduresList,
      procMap
    };
  }

  const cisenData = buildDashboardData(cisenConsultas, cisenOrders, [
    'Medicamentos', 'Laboratorio Clínico', 'Honorarios Médicos',
    'Procedimientos Quirúrgicos', 'Ecografías', 'Imágenes Diagnósticas'
  ]);

  const odontoData = buildDashboardData(odontoConsultas, odontoOrders, [
    'Medicamentos', 'Laboratorio Clínico', 'Honorarios Médicos',
    'Procedimientos Quirúrgicos', 'Imágenes Diagnósticas'
  ]);

  fs.writeFileSync('src/data/cisenData.json', JSON.stringify(cisenData, null, 2));
  fs.writeFileSync('src/data/odontologiaData.json', JSON.stringify(odontoData, null, 2));
  console.log('      ✓ src/data/cisenData.json actualizado.');
  console.log('      ✓ src/data/odontologiaData.json actualizado.');

  // Clean up any future month files for 2026
  const currentMaxMonthNum = new Date().getMonth() + 1;
  for (let mIdx = currentMaxMonthNum; mIdx < 12; mIdx++) {
    const fPath = path.join(citasDir, `2026_${MONTH_NAMES[mIdx]}.json`);
    if (fs.existsSync(fPath)) {
      try { fs.unlinkSync(fPath); } catch (e) {}
    }
  }

  // Merge into monthly detail JSON files (public/data/citas/2026_*.json) only up to current month
  MONTH_NAMES.slice(0, currentMaxMonthNum).forEach(m => {
    const fPath = path.join(citasDir, `2026_${m}.json`);
    let monthData = {};
    if (fs.existsSync(fPath)) {
      try {
        monthData = JSON.parse(fs.readFileSync(fPath, 'utf8'));
      } catch (e) {}
    }
    const newDocCitas = citasByMonthAndDoc[m] || {};
    Object.entries(newDocCitas).forEach(([doc, citas]) => {
      monthData[doc] = citas;
    });
    fs.writeFileSync(fPath, JSON.stringify(monthData));
  });
  console.log('      ✓ public/data/citas/2026_*.json sincronizados.');

  // Sync master citas_2026.json
  const masterPath = 'public/data/citas_2026.json';
  if (fs.existsSync(masterPath)) {
    const combined = {};
    MONTH_NAMES.forEach(m => {
      const fPath = path.join(citasDir, `2026_${m}.json`);
      if (fs.existsSync(fPath)) {
        try {
          combined[m] = JSON.parse(fs.readFileSync(fPath, 'utf8'));
        } catch (e) {}
      }
    });
    fs.writeFileSync(masterPath, JSON.stringify(combined));
    console.log('      ✓ public/data/citas_2026.json sincronizado.');
  }

  console.log('========================================================================');
  console.log('   ¡TODOS LOS TABLEROS HAN SIDO ACTUALIZADOS CON EXITO!                 ');
  console.log('========================================================================');
}

processAll();
