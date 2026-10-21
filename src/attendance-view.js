function Xra() {
  const [i, a] = ga.useState("2026"),
    [e, o] = ga.useState("Agosto"),
    [s, t] = ga.useState("Todas las Especialidades"),
    [r, m] = ga.useState("Todos los Especialistas"),
    [l, A] = ga.useState(!0),
    [n, c] = ga.useState(!0),
    [E, R] = ga.useState(""),
    I = ga.useMemo(() => ["2026", "2025", "2024"], []),
    N = ga.useMemo(() => ["Todos los Meses", ...po], []),
    d = ga.useMemo(() => ["Todas las Especialidades", ...oe.specialties], []),
    O = ga.useMemo(() => ["Todos los Especialistas", ...oe.specialists.map(u => u.name)], []),
    [attendanceRows, setAttendanceRows] = ga.useState(null),
    [attendanceError, setAttendanceError] = ga.useState(false);
  ga.useEffect(() => {
    fetch("/attendance-snapshot.json").then(r => {
      if (!r.ok) throw new Error("snapshot");
      return r.json();
    }).then(setAttendanceRows).catch(() => setAttendanceError(true));
  }, []);
  const {
    yesData: p,
    noData: L
  } = ga.useMemo(() => buildAttendanceCharts(attendanceRows || [], i, e, s, r, l, n), [attendanceRows, i, e, s, r, l, n]);
  return P.createElement("div", {
    className: "attendance-view"
  }, P.createElement("section", {
    className: "attendance-filters",
    "aria-label": "Filtros de asistencia"
  }, P.createElement(Rs, {
    label: "Año",
    icon: "calendar",
    value: i,
    onChange: a,
    options: I
  }), P.createElement(Rs, {
    label: "Mes",
    icon: "calendar",
    value: e,
    onChange: o,
    options: N
  }), P.createElement(Rs, {
    label: "Especialidad",
    icon: "stethoscope",
    value: s,
    onChange: t,
    options: d
  }), P.createElement(Rs, {
    label: "Especialista",
    icon: "user",
    value: r,
    onChange: m,
    options: O
  }), P.createElement("div", {
    className: "toggle-field"
  }, P.createElement("span", {
    className: "field-label"
  }, "Consulta Primera Vez"), P.createElement("label", {
    className: "switch",
    "aria-label": "Consulta Primera Vez"
  }, P.createElement("input", {
    type: "checkbox",
    checked: l,
    onChange: u => A(u.target.checked)
  }), P.createElement("span", {
    className: "slider"
  }))), P.createElement("div", {
    className: "toggle-field"
  }, P.createElement("span", {
    className: "field-label"
  }, "Consulta Control"), P.createElement("label", {
    className: "switch",
    "aria-label": "Consulta Control"
  }, P.createElement("input", {
    type: "checkbox",
    checked: n,
    onChange: u => c(u.target.checked)
  }), P.createElement("span", {
    className: "slider"
  }))), P.createElement("label", {
    className: "filter-field patient-field"
  }, P.createElement("span", {
    className: "field-label"
  }, "Identificación del Paciente"), P.createElement("span", {
    className: "search-control"
  }, P.createElement(Vt, {
    name: "search",
    size: 18
  }), P.createElement("input", {
    value: E,
    onChange: u => R(u.target.value),
    placeholder: "Buscar identificación..."
  })))), (attendanceError || !attendanceRows) && P.createElement("p", { role: "status" }, attendanceError ? "No fue posible cargar los datos de asistencia." : "Cargando asistencias…"), P.createElement("section", {
    className: "attendance-grid"
  }, P.createElement(l_, {
    title: "ASISTENCIA: SÍ",
    type: "yes",
    chartData: p
  }), P.createElement(l_, {
    title: "ASISTENCIA: NO",
    type: "no",
    chartData: L
  })), P.createElement(gP, {
    data: attendanceTable(attendanceRows || [], oe.tableData || []),
    year: i,
    month: e,
    specialist: r,
    specialty: s
  }));
}
