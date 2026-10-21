/* =========================================================================
   CONSULTA EXTERNA OPTIMIZADA: CIS EMCALI Y ODONTOLOGÍA COMPLETA
   Incluye: 
   - Nombre de Paciente corregido (nombre, nombre2, apellidos)
   - Cédula, Diagnósticos CIE-10, Registro, Cita Cumplida
   - Inclusión de TODOS los servicios de ODONTOLOGÍA e HIGIENISTA ORAL:
     * Educación individual y grupal (990112, 990212, 990212A, 990312A, 990103, 990203)
     * Procedimientos de higiene oral y detartraje (991201, PYP010, PYP30, 997%)
     * Operatorias, exodoncias y cirugía (23%, 24%)
     * Conceptos HONO, PYP, SORA y PRQX
   - Rango de fechas dinámico desde 2026-01-01 hasta CURRENT_TIMESTAMP (incluye Octubre)
   - Optimizado: LEFT JOINs eficientes
   ========================================================================= */

SELECT
  empresa.nombre AS eps,
  plan1.nombre AS plan,
  cita.fecha_hora,
  cita.fecha_actualizacion,
  cita.cedula,
  TRIM(CONCAT_WS(' ', paciente.nombre, paciente.nombre2, paciente.primer_apellido, paciente.segundo_apellido)) AS paciente,
  paciente.sexo AS sexo,
  paciente.fecha_nacimiento AS f_nacimiento,
  EXTRACT(YEAR FROM AGE(cita.fecha_hora, paciente.fecha_nacimiento)) AS edad,
  tercero.tercero AS doc_medico,
  tercero.nombre AS medico,
  COALESCE(
    REGEXP_REPLACE(REPLACE(especialidad.descripcion, ',', ''), E'[\n\r]+', '', 'g'),
    'MEDICINA GENERAL'
  ) AS especialidad,
  progreso.fecha AS fecha_evol,
  cita.observacion,
  CASE 
    WHEN progreso.registro IS NOT NULL THEN 'S'
    WHEN cita.ind_cumplida = 'S' THEN 'S'
    ELSE 'N'
  END AS cita_cumplida,
  cita.ind_cancelada,
  cita.ind_primera_vez,
  COALESCE(val_serv.total_valor, 0) AS valor,
  registro.registro AS registro,
  progreso.registro AS registro2,
  COALESCE(unidad_servicio.nombre, 'CE CIS EMCALI GENERAL') AS unidad_servicio,
  registro.fecha_egreso AS fecha_egreso,
  cita.duracion,
  registro.diagnostico_ingreso AS dx_ingreso,
  diag.descripcion AS diagnostico_descripcion,
  EXTRACT(DAY FROM cita.fecha_actualizacion) || '/' ||
  EXTRACT(MONTH FROM cita.fecha_actualizacion) || '/' ||
  EXTRACT(YEAR FROM cita.fecha_actualizacion) AS fecha_sol,
  usr_asigna.nombre AS usuario_asigna,
  usr_modifica.nombre AS usuario_actualiza,
  cita.servicio,
  servicio.descripcion AS servicio_des,
  cita.fecha_solicitada AS cita_deseada,
  cita.concepto
FROM cita
JOIN tercero ON tercero.tercero = cita.tercero
LEFT JOIN especialidad ON especialidad.especialidad = COALESCE(tercero.especialidad, (SELECT usuario.especialidad FROM usuario WHERE usuario.usuario = cita.usuario LIMIT 1))
JOIN empresa ON empresa.empresa = cita.empresa
JOIN plan1 ON plan1.plan1 = cita.plan1 AND plan1.empresa = cita.empresa
LEFT JOIN usuario usr_asigna ON usr_asigna.usuario = cita.usuario
LEFT JOIN usuario usr_modifica ON usr_modifica.usuario = cita.usuario_modifica
LEFT JOIN servicio ON servicio.concepto = cita.concepto AND servicio.servicio = cita.servicio
-- Unión con Paciente por Cédula o Historia
LEFT JOIN paciente ON paciente.cedula = cita.cedula
-- Unión con Registro hospitalario/ambulatorio de la misma fecha
LEFT JOIN registro ON registro.historia = paciente.historia 
  AND DATE(registro.fecha_ingreso) = DATE(cita.fecha_hora)
  AND (registro.unidad_servicio IN ('11','16','21','18','CG','CS') OR registro.unidad_servicio IS NOT NULL)
LEFT JOIN unidad_servicio ON unidad_servicio.unidad_servicio = registro.unidad_servicio
-- Progreso médico / Evolución de la cita
LEFT JOIN progreso ON progreso.registro = registro.registro
-- Diagnóstico CIE 10
LEFT JOIN diagnostico diag ON diag.diagnostico = registro.diagnostico_ingreso
-- Valores facturados / conceptos
LEFT JOIN LATERAL (
  SELECT SUM(servicio_detalle.valor) AS total_valor
  FROM servicio_detalle
  WHERE servicio_detalle.registro = registro.registro
    AND servicio_detalle.concepto IN ('HONO', 'PYP', 'SORA')
) val_serv ON true

WHERE cita.estado = 'A'
  AND tercero.tercero NOT IN ('55555')
  -- Rango de Fechas: Dinámico desde inicio de 2026 hasta la fecha actual (Octubre y posteriores)
  AND cita.fecha_hora >= '2026-01-01 00:00:00'
  AND cita.fecha_hora <= CURRENT_TIMESTAMP

  -- Conceptos: Permite HONO habitual, y para Odontología / Higiene Oral permite PYP, SORA y PRQX
  AND (
    cita.concepto IN ('HONO')
    OR cita.concepto IN ('PYP', 'SORA', 'PRQX')
    OR especialidad.descripcion ILIKE '%ODONTO%'
    OR especialidad.descripcion ILIKE '%HIGIEN%'
    OR especialidad.descripcion ILIKE '%MAXILOFACIAL%'
    OR especialidad.descripcion ILIKE '%ORAL%'
    OR servicio.descripcion ILIKE '%HIGIENE%'
    OR servicio.descripcion ILIKE '%ODONTO%'
    OR servicio.descripcion ILIKE '%SALUD ORAL%'
    OR servicio.descripcion ILIKE '%EDUCAC%'
    OR cita.servicio LIKE '23%'
    OR cita.servicio LIKE '24%'
    OR cita.servicio LIKE '997%'
    OR cita.servicio IN ('990112', '990212', '990212A', '990312A', '990103', '990203', '890203T', 'PYP010', 'PYP30', '991201', 'S41236')
  )

  -- Filtro de Ámbito: CIS EMCALI, Odontología, Higiene Oral y Especialidades
  AND (
    -- 1. Unidades de Servicio CIS EMCALI
    unidad_servicio.unidad_servicio IN ('11', '16', '21')
    OR unidad_servicio.nombre ILIKE '%CIS EMCALI%'
    OR registro.unidad_servicio IN ('11', '16', '21')

    -- 2. Todo el ámbito de Odontología, Higiene Oral y Educación en Salud Oral
    OR especialidad.descripcion ILIKE '%ODONTO%'
    OR especialidad.descripcion ILIKE '%HIGIEN%'
    OR especialidad.descripcion ILIKE '%MAXILOFACIAL%'
    OR especialidad.descripcion ILIKE '%ORAL%'
    OR servicio.descripcion ILIKE '%HIGIENE%'
    OR servicio.descripcion ILIKE '%ODONTO%'
    OR servicio.descripcion ILIKE '%SALUD ORAL%'
    OR servicio.descripcion ILIKE '%EDUCAC%'
    OR cita.servicio LIKE '23%'
    OR cita.servicio LIKE '24%'
    OR cita.servicio LIKE '997%'
    OR cita.servicio IN ('990112', '990212', '990212A', '990312A', '990103', '990203', '890203T', 'PYP010', 'PYP30', '991201', 'S41236')

    -- 3. Si no hay registro vinculado aún, filtrar por especialidades ambulatorias
    OR (
      registro.registro IS NULL AND (
        especialidad.descripcion ILIKE '%MEDICINA GENERAL%'
        OR especialidad.descripcion ILIKE '%ODONTO%'
        OR especialidad.descripcion ILIKE '%HIGIEN%'
        OR especialidad.descripcion ILIKE '%NUTRICION%'
        OR especialidad.descripcion ILIKE '%PSICOLOG%'
        OR especialidad.descripcion ILIKE '%PEDIATR%'
        OR especialidad.descripcion ILIKE '%GINECOLOG%'
        OR especialidad.descripcion ILIKE '%ENFERMER%'
      )
    )
  )

ORDER BY cita.fecha_hora DESC;
