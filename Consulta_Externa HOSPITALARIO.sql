/*__________ULTIMO CON VALORES SEGUN modificado AGOSTO 2023---------------*/

SELECT
empresa.nombre as Eps,
plan1.nombre as Plan,
cita.fecha_hora,
cita.fecha_actualizacion,
cita.cedula,
 (SELECT paciente.sexo from registro,paciente, progreso where registro.historia= paciente.historia and paciente.cedula = cita.cedula and date(registro.fecha_ingreso) = date(cita.fecha_hora) and progreso.registro = registro.registro limit 1)  as sexo,
 (SELECT paciente.fecha_nacimiento from registro,paciente, progreso where registro.historia= paciente.historia and paciente.cedula = cita.cedula and date(registro.fecha_ingreso) = date(cita.fecha_hora) and progreso.registro = registro.registro limit 1) as f_nacimiento,
tercero.TERCERO as DOC_medico,
tercero.nombre as medico,
  COALESCE(regexp_replace(replace((SELECT especialidad.descripcion FROM ESPECIALIDAD WHERE tercero.especialidad= especialidad.especialidad),',',''), E'[\n\r]+', '', 'g'),'PSICOLOGIA')  as Especialidad,
  (SELECT progreso.fecha from registro,paciente, progreso where registro.historia= paciente.historia and registro.unidad_servicio in('11','16','21','18','CG','CS') and paciente.cedula = cita.cedula and date(registro.fecha_ingreso) = date(cita.fecha_hora) and progreso.registro = registro.registro limit 1)  as fecha_evol,
'' AS observacion,
  CASE WHEN(SELECT registro.registro from registro,paciente, progreso where registro.historia= paciente.historia and registro.unidad_servicio in('11','16','21','18','CG','CS') and paciente.cedula = cita.cedula and date(registro.fecha_ingreso) = date(cita.fecha_hora) and progreso.registro = registro.registro limit 1)>'0' THEN 'S' ELSE 'N' END AS cita_cumplida,
cita.ind_cancelada,
cita.ind_primera_vez,
  (SELECT SUM(servicio_detalle.valor) from registro,servicio_detalle,paciente where registro.registro = servicio_detalle.registro and registro.unidad_servicio in('11','16','21','18','CG','CS') and registro.historia= paciente.historia and paciente.cedula = cita.cedula and date(registro.fecha_ingreso) = date(cita.fecha_hora) and servicio_detalle.concepto IN ('HONO', 'PYP')) as valor,
  (SELECT registro.registro from registro,paciente, progreso where registro.historia= paciente.historia and registro.unidad_servicio in('11','16','21','18','CG','CS') and paciente.cedula = cita.cedula and date(registro.fecha_ingreso) = date(cita.fecha_hora) and progreso.registro = registro.registro limit 1)  as registro,  	
  (SELECT progreso.registro from registro,paciente, progreso where tercero.tercero=progreso.usuario and registro.historia= paciente.historia and registro.unidad_servicio in('11','16','21','18','CG','CS') and paciente.cedula = cita.cedula and date(registro.fecha_ingreso) = date(cita.fecha_hora) and progreso.registro = registro.registro  limit 1)  as registro2,
  (SELECT unidad_servicio.nombre from registro,paciente, progreso, unidad_servicio where registro.unidad_servicio = unidad_servicio.unidad_servicio and registro.unidad_servicio in('11','16','21','18','CG','CS') and registro.historia= paciente.historia and paciente.cedula = cita.cedula and date(registro.fecha_ingreso) = date(cita.fecha_hora) and progreso.registro = registro.registro limit 1)  as unidad_servicio,
  (SELECT registro.FECHA_EGRESO from registro,paciente, progreso where registro.historia= paciente.historia and registro.unidad_servicio in('11','16','21','18','CG','CS') and paciente.cedula = cita.cedula and date(registro.fecha_ingreso) = date(cita.fecha_hora) and progreso.registro = registro.registro limit 1)  as fecha_egreso,
CITA.DURACION,
  (SELECT registro.diagnostico_ingreso from registro,paciente, progreso where registro.historia= paciente.historia and registro.unidad_servicio in('11','16','21','18','CG','CS') and paciente.cedula = cita.cedula and date(registro.fecha_ingreso) = date(cita.fecha_hora) and progreso.registro = registro.registro limit 1)  as Dx_Ingreso,
EXTRACT(day FROM cita.fecha_actualizacion )||'/'||EXTRACT(month FROM cita.fecha_actualizacion )||'/'||EXTRACT(year FROM cita.fecha_actualizacion ) as fecha_sol,

 ( SELECT USUARIO.NOMBRE FROM USUARIO WHERE USUARIO.USUARIO=CITA.USUARIO ) AS USUARIO_ASIGNA, 
 ( SELECT USUARIO.NOMBRE FROM USUARIO WHERE USUARIO.USUARIO=CITA.USUARIO_MODIFICA) AS USUARIO_ACTUALIZA,
 cita.servicio,
 (select servicio.descripcion from servicio where cita.concepto = servicio.concepto and servicio.servicio = cita.servicio) as servicio_des,
 cita.fecha_solicitada as cita_deseada,
 '', '','',
 cita.concepto,
(SELECT progreso.registro from registro,paciente, progreso where registro.historia= paciente.historia and registro.unidad_servicio in('11','16','21','18','CG','CS') and paciente.cedula = cita.cedula and date(registro.fecha_ingreso) = date(cita.fecha_hora) and progreso.registro = registro.registro limit 1)  as reg3
 

--cita.observacion,
--cita.fecha_actualizacion,

FROM 
cita, 
tercero, 
especialidad, 
empresa, 
plan1, 
parametro

WHERE 1=1 
/*( SELECT registro.registro from registro,paciente, progreso where registro.historia= paciente.historia 
and registro.unidad_servicio in('11','16','21','18','CG','CS') and paciente.cedula = cita.cedula and date(registro.fecha_ingreso) = date(cita.fecha_hora) */
--AND cita.registro IN ('2248257')
--AND cita.servicio in ('751200', '751100', '751101')
--AND CITA.CEDULA IN ()
AND tercero.TERCERO NOT IN ('55555')
AND cita.concepto IN ('HONO')
AND fecha_hora between '2026/06/01 00:00:00' and '2026/06/30 23:59:59' /*se modifica fecha */
AND tercero.tercero=cita.tercero
--AND tercero.especialidad= especialidad.especialidad
AND cita.empresa= empresa.empresa
AND plan1.plan1 = cita.plan1

AND plan1.empresa= cita.empresa
AND cita.estado = 'A'

GROUP BY 
--especialidad.descripcion,
tercero.especialidad,
empresa.nombre,
plan1.nombre ,
cita.fecha_hora,
cita.fecha_actualizacion,
cita.nombre,
parametro.nombre,
cita.cedula,
tercero.TERCERO,
tercero.nombre,
cita.observacion,
cita.ind_cumplida,
cita.ind_cancelada,
CITA.DURACION,
cita.ind_primera_vez,
CITA.USUARIO,
CITA.USUARIO_MODIFICA,
cita.servicio,
cita.concepto,
cita.fecha_solicitada

ORDER BY 
cita.fecha_solicitada DESC