SELECT
  formula_detalle.registro,
  unidad_servicio.nombre as unidad_servicio, 
  concepto.nombre as concepto, 
  EXTRACT(day FROM formula_encabezado.fecha_formula )||'/'||EXTRACT(month FROM formula_encabezado.fecha_formula )||'/'||EXTRACT(year FROM 			formula_encabezado.fecha_formula ) as fecha_formula,  
  formula_encabezado.ind_formula_interna,
  formula_encabezado.ind_aprobada,
  --EXTRACT(day FROM formula_encabezado.fecha_formula )||'/'||EXTRACT(month FROM formula_encabezado.fecha_formula )||'/'||EXTRACT(year FROM formula_encabezado.fecha_formula ) as fecha_formula,  
  servicio.servicio,
  regexp_replace(servicio.descripcion, E'[\n\r;]+', '', 'g') as descripcion,
  regexp_replace(formula_detalle.observacion, E'[\n\r;]+', '', 'g') as observacion,
  formula_detalle.cantidad,
  regexp_replace(formula_detalle.frecuencia, E'[\n\r;]+', '', 'g') as frecuencia,


  --formula_encabezado.usuario,
  usuario.nombre as medico,
  especialidad.descripcion as especialidad,

  --formula_encabezado.fecha_formula as hora_fecha_formula, 
  


 -- paciente.direccion, 
  -- paciente.fecha_nacimiento, 
  --paciente.sexo, 
  --formula_detalle.usuario,
  
   ''
FROM 
  public.formula_detalle, 
  public.formula_encabezado, 
  public.servicio, 
  public.concepto, 
  public.unidad_servicio,  
  public.registro,
  public.usuario,
  especialidad
WHERE 
  formula_detalle.registro = formula_encabezado.registro AND
  formula_detalle.formula = formula_encabezado.formula and
  formula_detalle.servicio = servicio.servicio AND
  formula_detalle.concepto = concepto.concepto AND
  formula_detalle.registro = registro.registro and
  registro.unidad_servicio = unidad_servicio.unidad_servicio and
  usuario.especialidad=especialidad.especialidad AND
  --formula_encabezado.ind_formula_interna = 'N' AND
  formula_encabezado.ind_aprobada = 'S' AND
  formula_encabezado.fecha_formula BETWEEN '2026/06/01 00:00:00' AND current_timestamp AND 
  formula_encabezado.usuario=usuario.usuario AND
  concepto.concepto IN ('HONO','MEDI','LABO','PRQX','ECOG','IMAG')
 


  and unidad_Servicio.unidad_SERVICIO IN ('11','16','21') 
--AND unidad_servicio.nombre in ('CE CIS EMCALI GENERAL','CE CIS EMCALI SUBESPECIALISTAS')

  --and formula_detalle.registro='113923'
  /*and paciente.cedula in
  (
  '14623081',
  '16605442',
  '6279978',
  '16703961',
  '20153749'
  )*/


  group by

  formula_detalle.registro,
  formula_encabezado.ind_formula_interna,
  formula_detalle.cantidad,
  formula_detalle.frecuencia,
  servicio.descripcion,
  concepto.nombre, 
  unidad_servicio.nombre,
  formula_encabezado.fecha_formula, 
  servicio.servicio,

  --paciente.direccion, 

  --paciente.sexo,
  --formula_detalle.usuario,
  --formula_encabezado.usuario,
 formula_encabezado.ind_aprobada,
 usuario.nombre,
 especialidad.descripcion,
 formula_detalle.observacion

  
  
  order by
  formula_detalle.registro
 