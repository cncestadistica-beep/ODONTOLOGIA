(function () {
  function closeDetails() {
    var node = document.getElementById('attendance-details-modal');
    if (node) node.remove();
  }

  window.openAttendanceDetails = function (row, type) {
    var monthMap = { Enero:1, Febrero:2, Marzo:3, Abril:4, Mayo:5, Junio:6, Julio:7, Agosto:8, Septiembre:9, Octubre:10, Noviembre:11, Diciembre:12 };
    var params = new URLSearchParams({ year: String(row.anio), month: String(row.mesNum || monthMap[row.mes] || 1), specialty: row.especialidad || '', specialist: row.especialista || '', type: type });
    fetch('/api/attendance/patients?' + params.toString()).then(function (response) { return response.json(); }).then(function (data) {
      closeDetails();
      var modal = document.createElement('div');
      modal.id = 'attendance-details-modal';
      modal.innerHTML = '<div class="attendance-modal-backdrop"><div class="attendance-modal-card"><button class="attendance-modal-close">×</button><h2>Detalle de ' + (type === 'CONTROL' ? 'controles' : 'consultas Primera Vez') + '</h2><p class="attendance-modal-summary">' + data.totalPacientes + ' pacientes · ' + row.mes + ' ' + row.anio + ' · ' + (row.especialidad || 'Todas las especialidades') + '</p><input class="attendance-modal-search" type="search" placeholder="Buscar por nombre o cédula..." aria-label="Buscar por nombre o cédula"><div class="attendance-modal-table-wrap"><table><thead><tr><th>Nombre del paciente</th><th>Identificación</th><th>Citas</th><th>Controles en el mes</th><th>Doctores vistos</th><th>Asistieron</th><th>No asistieron</th><th>Más de 3 controles</th></tr></thead><tbody>' + data.pacientes.map(function (patient) { return '<tr><td><strong>' + patient.nombre + '</strong></td><td>' + patient.identificacion + '</td><td>' + patient.citas + '</td><td>' + patient.controles + '</td><td>' + patient.cantidad_doctores + '<br><small>' + patient.doctores.join(', ') + '</small></td><td>' + patient.asistieron + '</td><td>' + patient.no_asistieron + '</td><td>' + (patient.mas_de_tres_controles ? 'Sí' : 'No') + '</td></tr>'; }).join('') + '</tbody></table></div></div></div>';
      document.body.appendChild(modal);
      var search = modal.querySelector('.attendance-modal-search');
      var tableRows = Array.from(modal.querySelectorAll('tbody tr'));
      search.addEventListener('input', function () {
        var term = search.value.trim().toLowerCase();
        tableRows.forEach(function (tableRow) { tableRow.style.display = tableRow.textContent.toLowerCase().includes(term) ? '' : 'none'; });
      });
      modal.querySelector('.attendance-modal-close').onclick = closeDetails;
      modal.querySelector('.attendance-modal-backdrop').onclick = function (event) { if (event.target === event.currentTarget) closeDetails(); };
    }).catch(function (error) { window.alert('No fue posible consultar el detalle de pacientes: ' + error.message); });
  };
}());
