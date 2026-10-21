 select 
--cx_cirugia.tipo_procedimiento  ACTUALIZADO AL 03-01-2026,
/*'' as dia_semana,
'' as semana_mes,*/
(select unidad_servicio.nombre from unidad_servicio where unidad_servicio.unidad_servicio = registro.unidad_servicio) as unidad,
cx_cirugia.cirugia,
	cx_cirugia.registro,
	case 
when (select extract (month from cx_cirugia.fecha))=1 then 'ENERO' 
when (select extract (month from cx_cirugia.fecha))=2 then 'FEBRERO'
when (select extract (month from cx_cirugia.fecha))=3 then 'MARZO'  
when (select extract (month from cx_cirugia.fecha))=4 then 'ABRIL' 
when (select extract (month from cx_cirugia.fecha))=5 then 'MAYO' 
when (select extract (month from cx_cirugia.fecha))=6 then 'JUNIO' 
when (select extract (month from cx_cirugia.fecha))=7 then 'JULIO' 
when (select extract (month from cx_cirugia.fecha))=8 then 'AGOSTO' 
when (select extract (month from cx_cirugia.fecha))=9 then 'SEPTIEMBRE' 
when (select extract (month from cx_cirugia.fecha))=10 then 'OCTUBRE' 
when (select extract (month from cx_cirugia.fecha))=11 then 'NOVIEMBRE'
when (select extract (month from cx_cirugia.fecha))=12 then 'DICIEMBRE' 
else '0' end as Mes,
	EXTRACT(day FROM cx_cirugia.fecha ) as dia,
	cx_cirugia.fecha,
	paciente.cedula,
	paciente.NOMBRE, 
	paciente.NOMBRE2, 
	paciente.PRIMER_APELLIDO,
	paciente.SEGUNDO_APELLIDO,
	paciente.FECHA_NACIMIENTO,
	date_part('year',age(fecha_nacimiento)) as edad, 
	(select nombre from empresa where registro.empresa = empresa.empresa) as EMPRESA,
	(select plan1.nombre from plan1,empresa where empresa.empresa = plan1.empresa and plan1.plan1 = registro.plan1 and registro.empresa = empresa.empresa) as plan,
	--''  as Tipo_vinc,
	(select nombre from unidad_servicio where registro.unidad_servicio = unidad_servicio.unidad_servicio) as servicio,
	/*
	(select valores_iss2001.area from cx_cirugia_procedimiento , servicio, valores_iss2001 where cx_cirugia.cirugia = cx_cirugia_procedimiento.cirugia and servicio.servicio = valores_iss2001.codigo and cx_cirugia_procedimiento.servicio = servicio.servicio order by cx_cirugia_procedimiento.numero_uvr desc ,cx_cirugia_procedimiento.grupo desc   limit 1 offset 0) as Area,
	(select valores_iss2001.grupo from cx_cirugia_procedimiento , servicio, valores_iss2001 where cx_cirugia.cirugia = cx_cirugia_procedimiento.cirugia and servicio.servicio = valores_iss2001.codigo and cx_cirugia_procedimiento.servicio = servicio.servicio order by cx_cirugia_procedimiento.numero_uvr desc ,cx_cirugia_procedimiento.grupo desc   limit 1 offset 0) as Grupo,
	(select valores_iss2001.subgrupo from cx_cirugia_procedimiento , servicio, valores_iss2001 where cx_cirugia.cirugia = cx_cirugia_procedimiento.cirugia and servicio.servicio = valores_iss2001.codigo and cx_cirugia_procedimiento.servicio = servicio.servicio order by cx_cirugia_procedimiento.numero_uvr desc ,cx_cirugia_procedimiento.grupo desc   limit 1 offset 0) as Subgrupo,
	

	'' as Area,
	'' as Grupo,
	'' as Subgrupo,*/
	'' as cups_homologo,
	'' as desc_homologo,

	
		(select servicio.servicio from cx_cirugia_procedimiento, servicio 
				where
				servicio.concepto ='PRQX' AND
				 cx_cirugia.cirugia = cx_cirugia_procedimiento.cirugia and 
						cx_cirugia_procedimiento.servicio = servicio.servicio 
			order by cx_cirugia_procedimiento.item asc limit 1 offset 0) as Cups1,

		(select cx_cirugia_procedimiento.numero_uvr from cx_cirugia_procedimiento , servicio 
				where
				servicio.concepto ='PRQX' AND
				 cx_cirugia.cirugia = cx_cirugia_procedimiento.cirugia and
						cx_cirugia_procedimiento.servicio = servicio.servicio 
			order by cx_cirugia_procedimiento.item asc  limit 1 offset 0) as Uvr1,

		(select servicio.descripcion from cx_cirugia_procedimiento , servicio 
				where 
				servicio.concepto ='PRQX' AND
				cx_cirugia.cirugia = cx_cirugia_procedimiento.cirugia and
						cx_cirugia_procedimiento.servicio = servicio.servicio 
			order by cx_cirugia_procedimiento.item asc limit 1 offset 0) as qx1,


		   (select  servicio.servicio from cx_cirugia_procedimiento , servicio
				where
				servicio.concepto ='PRQX' AND
				 cx_cirugia.cirugia = cx_cirugia_procedimiento.cirugia and 
						cx_cirugia_procedimiento.servicio = servicio.servicio  
		      order by cx_cirugia_procedimiento.item asc limit 1 offset 1) as Cups2,

		  (select cx_cirugia_procedimiento.numero_uvr from cx_cirugia_procedimiento , servicio 
				where
				servicio.concepto ='PRQX' AND
				 cx_cirugia.cirugia = cx_cirugia_procedimiento.cirugia and
						cx_cirugia_procedimiento.servicio = servicio.servicio 
			order by cx_cirugia_procedimiento.item asc limit 1 offset 1) as Uvr2,


		   (select  servicio.descripcion from cx_cirugia_procedimiento , servicio
				where 
				servicio.concepto ='PRQX' AND
				cx_cirugia.cirugia = cx_cirugia_procedimiento.cirugia and 
						cx_cirugia_procedimiento.servicio = servicio.servicio  
		      order by cx_cirugia_procedimiento.item asc limit 1 offset 1) as qx2,

		   (select  servicio.servicio from cx_cirugia_procedimiento , servicio
				where
				servicio.concepto ='PRQX' AND
				 cx_cirugia.cirugia = cx_cirugia_procedimiento.cirugia and 
						cx_cirugia_procedimiento.servicio = servicio.servicio  
		      order by cx_cirugia_procedimiento.item asc limit 1 offset 2) as Cups3,

		   (select  servicio.descripcion from cx_cirugia_procedimiento , servicio
				where
				servicio.concepto ='PRQX' AND
				 cx_cirugia.cirugia = cx_cirugia_procedimiento.cirugia and 
						cx_cirugia_procedimiento.servicio = servicio.servicio  
		      order by cx_cirugia_procedimiento.item asc limit 1 offset 2) as qx3,

		   (select  servicio.servicio from cx_cirugia_procedimiento , servicio
				where
				servicio.concepto ='PRQX' AND
				 cx_cirugia.cirugia = cx_cirugia_procedimiento.cirugia and 
						cx_cirugia_procedimiento.servicio = servicio.servicio  
		      order by cx_cirugia_procedimiento.item asc limit 1 offset 3) as Cups4,


		   (select  servicio.descripcion from cx_cirugia_procedimiento , servicio
				where
				servicio.concepto ='PRQX' AND
				 cx_cirugia.cirugia = cx_cirugia_procedimiento.cirugia and 
						cx_cirugia_procedimiento.servicio = servicio.servicio  
		      order by cx_cirugia_procedimiento.item asc limit 1 offset 3) as qx4,
	
	   (select  servicio.servicio from cx_cirugia_procedimiento , servicio
				where
				servicio.concepto ='PRQX' AND
				 cx_cirugia.cirugia = cx_cirugia_procedimiento.cirugia and 
						cx_cirugia_procedimiento.servicio = servicio.servicio  
		      order by cx_cirugia_procedimiento.item asc limit 1 offset 4) as Cups5,

		   (select  servicio.descripcion from cx_cirugia_procedimiento , servicio
				where
				servicio.concepto ='PRQX' AND
				 cx_cirugia.cirugia = cx_cirugia_procedimiento.cirugia and 
						cx_cirugia_procedimiento.servicio = servicio.servicio  
		      order by cx_cirugia_procedimiento.item asc limit 1 offset 4) as qx5,

		      --'' as tipo_intervencion_qx,

		   (select  cx_cirugia_procedimiento.diagnostico_principal from cx_cirugia_procedimiento , servicio
				where cx_cirugia.cirugia = cx_cirugia_procedimiento.cirugia and 
						cx_cirugia_procedimiento.servicio = servicio.servicio  
		      order by cx_cirugia_procedimiento.item asc limit 1 offset 0) as Dx,

		   (select  diagnostico.descripcion from cx_cirugia_procedimiento , diagnostico, servicio
				where cx_cirugia.cirugia = cx_cirugia_procedimiento.cirugia and 
cx_cirugia_procedimiento.diagnostico_principal = diagnostico.diagnostico and
						cx_cirugia_procedimiento.servicio = servicio.servicio  
		      order by cx_cirugia_procedimiento.item asc limit 1 offset 0) as Dx_Desc,

EXTRACT (hour FROM cx_cirugia.hora_inicio) ||':'|| EXTRACT (minute FROM cx_cirugia.hora_inicio) as H_Inicio,
EXTRACT (hour FROM cx_cirugia.hora_fin) ||':'|| EXTRACT (minute FROM cx_cirugia.hora_fin) as H_Fin,

extract('day' from (cx_cirugia.hora_fin - cx_cirugia.hora_inicio)) * 1440 +  
     extract('hour' from (cx_cirugia.hora_fin - cx_cirugia.hora_inicio)) * 60 +  
            extract('minute' from (cx_cirugia.hora_fin - cx_cirugia.hora_inicio)) as Tiempo_Qx,
            
(select cx_sala.descripcion from cx_sala where cx_sala.sala = cx_cirugia.sala) as sala,
COALESCE(
(select tercero.tercero FROM tercero, cx_liquidacion  where cx_liquidacion.tercero = tercero.tercero and cx_cirugia.cirugia = cx_liquidacion.cirugia  and cx_liquidacion.subconcepto_cirugia = 'AN' limit 1 ),(select tercero.tercero FROM tercero, cx_cirugia_honorario  where cx_cirugia_honorario.tercero = tercero.tercero and cx_cirugia.cirugia = cx_cirugia_honorario.cirugia  and cx_cirugia_honorario.subconcepto_cirugia = 'AN' limit 1 ))  As doc_Anestesiologo,
COALESCE(
(select tercero.nombre FROM tercero, cx_liquidacion  where cx_liquidacion.tercero = tercero.tercero and cx_cirugia.cirugia = cx_liquidacion.cirugia  and cx_liquidacion.subconcepto_cirugia = 'AN' limit 1 ),(select tercero.nombre FROM tercero, cx_cirugia_honorario  where cx_cirugia_honorario.tercero = tercero.tercero and cx_cirugia.cirugia = cx_cirugia_honorario.cirugia  and cx_cirugia_honorario.subconcepto_cirugia = 'AN' limit 1 ))   As Anestesiologo,
(select usuario.USUARIO FROM usuario, especialidad where especialidad.especialidad = usuario.especialidad and cx_cirugia.usuario_cirujano = usuario.usuario) As DOC_Cirujano,
(select usuario.nombre FROM usuario, especialidad where especialidad.especialidad = usuario.especialidad and cx_cirugia.usuario_cirujano = usuario.usuario) As Cirujano,
(select especialidad.descripcion FROM usuario, especialidad where especialidad.especialidad = usuario.especialidad and cx_cirugia.usuario_cirujano = usuario.usuario) As Espec,


COALESCE(
(select tercero.nombre FROM tercero, cx_liquidacion  where cx_liquidacion.tercero = tercero.tercero and cx_cirugia.cirugia = cx_liquidacion.cirugia  and cx_liquidacion.subconcepto_cirugia = 'AY' limit 1 ),(select tercero.nombre FROM tercero, cx_cirugia_honorario  where cx_cirugia_honorario.tercero = tercero.tercero and cx_cirugia.cirugia = cx_cirugia_honorario.cirugia  and cx_cirugia_honorario.subconcepto_cirugia = 'AY' limit 1 ))   As Ayudante_Qx,


case when cx_cirugia.clasificacion_herida_qx = 'L' then 'LIMPIA'
when cx_cirugia.clasificacion_herida_qx = 'D' then 'LIMPIA CONTAMINADA'
when cx_cirugia.clasificacion_herida_qx = 'C' then 'CONTAMINADA'
when cx_cirugia.clasificacion_herida_qx = 'S' then 'INFECTADA'
end as clasificacion_herida,

(select descripcion from cx_tipo_anestesia where cx_cirugia.tipo_anestesia = cx_tipo_anestesia.tipo_anestesia ) as Tipo_Anest,

/*cx_cirugia.ind_programado,
 case 	when cx_cirugia.ind_programado = 'U' then 'URGENCIAS' 
	when cx_cirugia.ind_programado = 'P' then 'PROGRAMADA' 
	end as Pograma,

cx_cirugia.clase_procedimiento,

 case 	when cx_cirugia.clase_procedimiento = 'H' then 'HOSPITALARIA' 
	when cx_cirugia.clase_procedimiento = 'A' then 'AMBULATORIA' 
	end as Clase_Proced,

'' as Fecha_solic_Cx_registro,

'' as Fecha_solic_Cx_paciente,

'' as orden_interna_o_externa,

--'' as Fecha_solic_Cx,
--cx_cirugia.hora_inicio,
'' as Fecha_Asig_Cx,
'' as Programado_Ext,

'' as Dias_solicitud,


'' as AN_VALOR,
'' as CI_VALOR,
'' as AY_VALOR,
'' as DS_VALOR,
'' as DM_VALOR,

'' as valor_Total_Fact,
'' as AN_VALOR,
'' as CI_VALOR,
'' as AY_VALOR,
'' as DS_VALOR,
'' as DM_VALOR,

'' as valor_Total_Iss,*/

--cx_cirugia.fecha_hora_ingreso_sala AS INGRESO_PACIENTE_A_SALA,
--cx_cirugia.fecha_hora_inicio_anestesia AS INICIO_ANESTESIA,
--cx_cirugia.fecha_hora_preparacion_paciente AS HORA_DE_PRE_DE_PACIENTE,
cx_cirugia.hora_inicio AS INICIO_CX,
cx_cirugia.hora_fin AS FINAL_CX,
--cx_cirugia.fecha_hora_fin_anestesia AS FINAL_ANESTESIA,
--cx_cirugia.fecha_hora_salida_sala AS SALE_PACEINTE_DE_SALA_RECUPERACION_UCI,
(select tercero.nombre FROM tercero, cx_cirugia_honorario  where cx_cirugia_honorario.tercero = tercero.tercero and cx_cirugia.cirugia = cx_cirugia_honorario.cirugia  and cx_cirugia_honorario.subconcepto_cirugia = 'AN' limit 1 ) AS ANESTESIOLOGO_NOTA,
(select tercero.TERCERO FROM tercero, cx_cirugia_honorario  where cx_cirugia_honorario.tercero = tercero.tercero and cx_cirugia.cirugia = cx_cirugia_honorario.cirugia  and cx_cirugia_honorario.subconcepto_cirugia = 'CI' limit 1 ) AS CIRUJANO_NOTA,
(select tercero.nombre FROM tercero, cx_cirugia_honorario  where cx_cirugia_honorario.tercero = tercero.tercero and cx_cirugia.cirugia = cx_cirugia_honorario.cirugia  and cx_cirugia_honorario.subconcepto_cirugia = 'CI' limit 1 ) AS CIRUJANO_NOTA,
(select ESPECIALIDAD.DESCRIPCION FROM tercero, cx_cirugia_honorario,ESPECIALIDAD  where ESPECIALIDAD.ESPECIALIDAD = TERCERO.ESPECIALIDAD AND cx_cirugia_honorario.tercero = tercero.tercero and cx_cirugia.cirugia = cx_cirugia_honorario.cirugia  and cx_cirugia_honorario.subconcepto_cirugia = 'CI' limit 1 ) AS ESP_CIRUJANO_NOTA,
(select tercero.nombre FROM tercero, cx_cirugia_honorario  where cx_cirugia_honorario.tercero = tercero.tercero and cx_cirugia.cirugia = cx_cirugia_honorario.cirugia  and cx_cirugia_honorario.subconcepto_cirugia = 'AY' limit 1 ) AS AYUDANTE_NOTA,
/*'' as MEDI,
'' as OSTE,
'' as SUMI,
'' as COSTO_INSUMOS,*/


case when (select registro.registro from tipo_evolucion, progreso where cx_cirugia.registro = registro.registro and progreso.tipo = tipo_evolucion.tipo_evolucion and progreso.registro = registro.registro and tipo_evolucion in ('UR1','TRI','TRM','UR2') order by tipo_evolucion desc limit 1)>'0' then 'URGENCIA' else 'AMBULATORIA' end as cx_Programada_o_urg, 

(SELECT PROGRESO.FECHA 
FROM PROGRESO, REGISTRO R,USUARIO, ESPECIALIDAD 
WHERE USUARIO.ESPECIALIDAD = ESPECIALIDAD.ESPECIALIDAD AND 
PROGRESO.USUARIO = USUARIO.USUARIO AND 
PROGRESO.REGISTRO = R.REGISTRO AND 
R.HISTORIA = REGISTRO.HISTORIA AND 
ESPECIALIDAD.ESPECIALIDAD IN ('021','022','020','023','024') AND
PROGRESO.FECHA < cx_cirugia.fecha ORDER BY PROGRESO.FECHA DESC LIMIT 1 ) AS ULTIMA_CITA_ANESTESIA,
/*(SELECT PROGRESO.REGISTRO 
FROM PROGRESO, REGISTRO R,USUARIO, ESPECIALIDAD 
WHERE USUARIO.ESPECIALIDAD = ESPECIALIDAD.ESPECIALIDAD AND 
PROGRESO.USUARIO = USUARIO.USUARIO AND 
PROGRESO.REGISTRO = R.REGISTRO AND 
R.HISTORIA = REGISTRO.HISTORIA AND 
ESPECIALIDAD.ESPECIALIDAD IN ('021','022','020','023','024') AND
PROGRESO.FECHA < cx_cirugia.fecha ORDER BY PROGRESO.FECHA DESC LIMIT 1 ) AS REGISTRO_ULTIMA_CITA_ANESTESIA,*/

/*(SELECT USUARIO.NOMBRE 
FROM PROGRESO, REGISTRO R,USUARIO, ESPECIALIDAD 
WHERE USUARIO.ESPECIALIDAD = ESPECIALIDAD.ESPECIALIDAD AND 
PROGRESO.USUARIO = USUARIO.USUARIO AND 
PROGRESO.REGISTRO = R.REGISTRO AND 
R.HISTORIA = REGISTRO.HISTORIA AND 
ESPECIALIDAD.ESPECIALIDAD IN ('021','022','020','023','024') AND
PROGRESO.FECHA < cx_cirugia.fecha ORDER BY PROGRESO.FECHA DESC LIMIT 1 ) AS MEDICO_ULTIMA_CITA_ANESTESIA,*/

--cx_cirugia.ind_anulada,
''
 
from cx_cirugia,   registro,  paciente 



where 
registro.unidad_servicio in ('16','21','11') and
registro.registro = cx_cirugia.registro and
--registro.registro= '1028893' and
paciente.historia = registro.historia and
--cx_cirugia.cirugia in ('119526') and
cx_cirugia.fecha between '2026/01/01 00:00:00' and CURRENT_TIMESTAMP /* se modifica fecha*/
--and cx_cirugia.usuario_cirujano = '94516386'
and cx_cirugia.ind_anulada = 'N'


Group by 
cx_cirugia.cirugia,
cx_cirugia.fecha,
cx_cirugia.registro,
registro.plan1,
registro.empresa,
cx_cirugia.sala,
cx_cirugia.hora_inicio,
cx_cirugia.hora_fin,
cx_cirugia.tipo_anestesia,
cx_cirugia.tiempo,
cx_cirugia.ind_programado,
cx_cirugia.clasificacion_herida_qx,
cx_cirugia.hallazgos,
registro.historia,
paciente.historia,
registro.registro,
registro.unidad_servicio,
cx_cirugia.usuario_cirujano,
registro.medico,
registro.especialidad,
cx_cirugia.clase_procedimiento,
registro.EMPRESA,
paciente.cedula,
			paciente.NOMBRE, 
			paciente.NOMBRE2, 
			paciente.PRIMER_APELLIDO,
			paciente.FECHA_NACIMIENTO,
 			paciente.SEGUNDO_APELLIDO

order by cx_cirugia.cirugia;