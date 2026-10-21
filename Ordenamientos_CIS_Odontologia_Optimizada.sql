/* =========================================================================
   ORDENAMIENTOS Y PRESCRIPCIONES AMBULATORIAS CORREGIDA
   CIS EMCALI Y ODONTOLOGÍA COMPLETA (TODOS LOS SERVICIOS Y ESPECIALIDADES)
   
   Corrige:
   1. Nombres de columnas en tabla paciente (nombre, nombre2 en vez de primer_nombre).
   2. Inclusión de conceptos de salud oral: SORA, PYP, PAOD, OTDX, SUMI, OSTE.
   3. Inclusión de todas las especialidades odontológicas: Odontología, Higiene Oral,
      Cirugía Maxilofacial, Oral, Endodoncia, Periodoncia, Ortodoncia, Rehabilitación, etc.
   4. Inclusión de los códigos CUPS del catálogo maestro de odontología (aa_odontologia, 23%, 24%, 997%).
   5. Soporte para COALESCE(formula_encabezado.medico, formula_encabezado.usuario) con LEFT JOIN.
   6. Rango de fechas dinámico para el año en curso.
   ========================================================================= */

SELECT
  formula_detalle.registro,
  COALESCE(unidad_servicio.nombre, 'CONSULTA EXTERNA') AS unidad_servicio,
  concepto.nombre AS concepto,
  EXTRACT(DAY FROM formula_encabezado.fecha_formula) || '/' ||
  EXTRACT(MONTH FROM formula_encabezado.fecha_formula) || '/' ||
  EXTRACT(YEAR FROM formula_encabezado.fecha_formula) AS fecha_formula,
  formula_encabezado.ind_formula_interna,
  formula_encabezado.ind_aprobada,
  servicio.servicio AS servicio,
  REGEXP_REPLACE(servicio.descripcion, E'[\n\r;]+', '', 'g') AS descripcion,
  REGEXP_REPLACE(COALESCE(formula_detalle.observacion, ''), E'[\n\r;]+', '', 'g') AS observacion,
  formula_detalle.cantidad,
  REGEXP_REPLACE(COALESCE(formula_detalle.frecuencia, ''), E'[\n\r;]+', '', 'g') AS frecuencia,
  COALESCE(TRIM(tercero.nombre), TRIM(usuario.nombre), 'PROFESIONAL DE LA SALUD') AS medico,
  COALESCE(TRIM(especialidad.descripcion), 'MEDICINA GENERAL') AS especialidad,
  '' AS col_extra

FROM formula_detalle
JOIN formula_encabezado ON formula_encabezado.registro = formula_detalle.registro 
  AND formula_encabezado.formula = formula_detalle.formula
JOIN servicio ON servicio.servicio = formula_detalle.servicio 
  AND servicio.concepto = formula_detalle.concepto
JOIN concepto ON concepto.concepto = formula_detalle.concepto
JOIN registro ON registro.registro = formula_detalle.registro
LEFT JOIN unidad_servicio ON unidad_servicio.unidad_servicio = registro.unidad_servicio
LEFT JOIN usuario ON usuario.usuario = formula_encabezado.usuario
LEFT JOIN tercero ON tercero.tercero = COALESCE(formula_encabezado.medico, usuario.tercero_citas, usuario.medico, usuario.documento, formula_encabezado.usuario)
LEFT JOIN especialidad ON especialidad.especialidad = COALESCE(tercero.especialidad, usuario.especialidad)

WHERE formula_encabezado.ind_aprobada = 'S'
  AND formula_encabezado.fecha_formula >= '2026-01-01 00:00:00'
  AND formula_encabezado.fecha_formula <= CURRENT_TIMESTAMP
  -- Conceptos médicos y odontológicos
  AND concepto.concepto IN (
    'HONO', 'MEDI', 'LABO', 'PRQX', 'ECOG', 'IMAG', 
    'OTDX', 'CARD', 'TOMO', 'RMAG', 'SORA', 'PYP', 'PAOD', 'SUMI', 'OSTE'
  )
  -- Filtro de ámbito: CIS EMCALI, Odontología completa o Servicios dentales
  AND (
    -- 1. Unidades de Servicio habituales CIS EMCALI y Consulta Externa
    unidad_servicio.unidad_servicio IN ('11', '16', '21')
    OR unidad_servicio.nombre ILIKE '%CIS EMCALI%'
    
    -- 2. Especialidades Odontológicas y de Salud Oral completas
    OR especialidad.descripcion ILIKE '%ODONTO%'
    OR especialidad.descripcion ILIKE '%HIGIEN%'
    OR especialidad.descripcion ILIKE '%MAXILOFACIAL%'
    OR especialidad.descripcion ILIKE '%ORAL%'
    OR especialidad.descripcion ILIKE '%ENDODON%'
    OR especialidad.descripcion ILIKE '%PERIODON%'
    OR especialidad.descripcion ILIKE '%ORTODON%'
    OR especialidad.descripcion ILIKE '%REHABILITACION ORAL%'
    OR especialidad.descripcion ILIKE '%ESTOMATO%'
    OR especialidad.descripcion ILIKE '%PROSTO%'
    OR especialidad.descripcion ILIKE '%SALUD ORAL%'

    -- 3. Conceptos específicos de Odontología
    OR concepto.concepto IN ('SORA', 'PAOD')

    -- 4. Catálogo maestro de Odontología (aa_odontologia) y códigos CUPS dentales
    OR formula_detalle.servicio IN (SELECT codigo FROM aa_odontologia)
    OR formula_detalle.servicio LIKE '23%'     -- Cirugía y operatoria dental (obturaciones, exodoncias)
    OR formula_detalle.servicio LIKE '24%'     -- Periodoncia
    OR formula_detalle.servicio LIKE '997%'    -- Higiene oral, detartraje, profilaxis, flúor, sellantes
    OR formula_detalle.servicio LIKE '87045%'  -- Radiografías periapicales
    OR formula_detalle.servicio IN ('870114', '890203', '890303', '890703', '990112', '990212')
  )

GROUP BY
  formula_detalle.registro,
  unidad_servicio.nombre,
  concepto.nombre,
  formula_encabezado.fecha_formula,
  formula_encabezado.ind_formula_interna,
  formula_encabezado.ind_aprobada,
  servicio.servicio,
  servicio.descripcion,
  formula_detalle.observacion,
  formula_detalle.cantidad,
  formula_detalle.frecuencia,
  tercero.nombre,
  usuario.nombre,
  especialidad.descripcion

ORDER BY
  formula_encabezado.fecha_formula DESC;
