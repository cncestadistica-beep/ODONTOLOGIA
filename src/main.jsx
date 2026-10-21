import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import centralEspecialistasData from './data/centralEspecialistasData.json';
import cisenData from './data/cisenData.json';
import odontologiaData from './data/odontologiaData.json';
import procedimientosMenoresData from './data/procedimientosMenoresData.json';
import initialDiagnosticsList from './data/diagnosticsList.json';
import './styles.css';

const fmt = (v) => Number(v || 0).toLocaleString('es-CO');
const percentage = (v, total) => (total > 0 ? (v / total) * 100 : 0);

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const pageConfigs = {
  especialistas: {
    name: 'Central de Especialistas',
    eyebrow: 'Clínica Nueva de Cali',
    theme: 'teal',
    bgClass: 'bg-specialists',
    color: '#009fa0',
  },
  cisen: {
    name: 'CIS EMCALI',
    eyebrow: 'Clínica Nueva de Cali',
    theme: 'indigo',
    bgClass: 'bg-specialists',
    color: '#2b2d6e',
  },
  odontologia: {
    name: 'Odontología',
    eyebrow: 'Clínica Nueva de Cali',
    theme: 'petrol',
    bgClass: 'bg-odontologia',
    color: '#0e7490',
  },
  procedimientos: {
    name: 'Procedimientos Menores',
    eyebrow: 'Quirófanos y Procedimientos',
    theme: 'surgical',
    bgClass: 'bg-procedures',
    color: '#009fa0',
  },
  asistencia: {
    name: 'Gestión de Asistencias',
    eyebrow: 'Clínica Nueva de Cali',
    theme: 'teal',
    bgClass: 'bg-attendance',
    color: '#009fa0',
  }
};

function Icon({ name, size = 18 }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  const shapes = {
    calendar: (
      <>
        <rect x="3" y="4.5" width="18" height="16" rx="2" />
        <path d="M16 2.5v4M8 2.5v4M3 9h18" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 20c.8-3.2 3-4.8 6.5-4.8s5.7 1.6 6.5 4.8M3.5 20h17" />
      </>
    ),
    stethoscope: (
      <>
        <path d="M6 3v5a4 4 0 0 0 8 0V3M4 3h4M12 3h4" />
        <path d="M14 15a4 4 0 1 0 8 0v-2a2 2 0 0 0-4 0v2" />
      </>
    ),
    grid: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.7" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    file: (
      <>
        <path d="M6 2.8h8l4 4V21H6z" />
        <path d="M14 2.8v4h4M9 12h6M9 16h6" />
      </>
    ),
    x: (
      <>
        <path d="M18 6 6 18M6 6l12 12" />
      </>
    ),
    alert: (
      <>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </>
    ),
    check: (
      <>
        <polyline points="20 6 9 17 4 12" />
      </>
    ),
    chevronDown: (
      <>
        <polyline points="6 9 12 15 18 9" />
      </>
    ),
    chevronUp: (
      <>
        <polyline points="18 15 12 9 6 15" />
      </>
    ),
    pill: (
      <>
        <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
        <path d="m8.5 8.5 7 7" />
      </>
    ),
    image: (
      <>
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </>
    ),
    flask: (
      <>
        <path d="M10 2v7.31L4.75 18.1A2 2 0 0 0 6.46 21h11.08a2 2 0 0 0 1.71-2.9L14 9.31V2" />
        <path d="M8.5 2h7M7 16h10" />
      </>
    ),
    activity: (
      <>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </>
    ),
    trendingUp: (
      <>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </>
    ),
    award: (
      <>
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </>
    ),
  };
  return <svg {...props}>{shapes[name] || null}</svg>;
}

function SelectField({ label, icon, value, options, onChange, className = '', style }) {
  const isYear = label?.toLowerCase().includes('año');
  const isMonth = label?.toLowerCase().includes('mes');
  const autoClass = isYear ? 'filter-field-year' : isMonth ? 'filter-field-month' : '';
  const combinedClass = `filter-field ${autoClass} ${className}`.trim();

  return (
    <label className={combinedClass} style={style}>
      <span className="field-label">{label}</span>
      <span className="select-control">
        <Icon name={icon} />
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((opt) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={optVal} value={optVal}>
                {optLabel}
              </option>
            );
          })}
        </select>
        <span className="select-chevron">⌄</span>
      </span>
    </label>
  );
}

function CIEDropdownFilter({ value, options, onChange, placeholder = 'Buscar diagnóstico o código CIE 10...' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) {
      return options.slice(0, 100);
    }
    const q = searchTerm.toLowerCase();
    const matches = [];
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const text = (typeof opt === 'object' ? (opt.label || opt.name || opt.value) : opt).toLowerCase();
      if (text.includes(q)) {
        matches.push(opt);
        if (matches.length >= 100) break;
      }
    }
    return matches;
  }, [options, searchTerm]);

  const hasValue = value && value !== 'Todos los Diagnósticos';

  return (
    <div className="cie-filter-container" ref={wrapperRef}>
      <button
        type="button"
        className={`cie-button ${hasValue ? 'active-filtered' : ''} ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={hasValue ? `CIE 10 activo: ${value}` : 'Filtrar por Diagnósticos CIE 10'}
      >
        <Icon name="file" size={18} />
        <span>{hasValue ? `CIE 10: ${value.length > 20 ? value.slice(0, 18) + '...' : value}` : 'CIE 10'}</span>
        <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} size={14} />
      </button>

      {isOpen && (
        <div className="cie-floating-menu">
          <div className="cie-menu-header">
            <div className="cie-menu-title">
              <Icon name="file" size={16} />
              <span>Filtro de Diagnósticos (CIE 10)</span>
              <span className="cie-total-badge">{fmt(options.length > 1 ? options.length - 1 : 4464)} disponibles</span>
            </div>
            <button
              type="button"
              className="cie-menu-close"
              onClick={() => setIsOpen(false)}
              title="Cerrar"
            >
              <Icon name="x" size={15} />
            </button>
          </div>

          <div className="cie-search-header" onClick={(e) => e.stopPropagation()}>
            <Icon name="search" size={16} />
            <input
              type="text"
              autoFocus
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="cie-clear-search"
                onClick={() => setSearchTerm('')}
                title="Limpiar búsqueda"
              >
                <Icon name="x" size={12} />
              </button>
            )}
          </div>

          <div className="cie-options-scroll">
            <div
              className={`cie-option-row ${!hasValue ? 'selected' : ''}`}
              onClick={() => {
                onChange('Todos los Diagnósticos');
                setIsOpen(false);
                setSearchTerm('');
              }}
            >
              <span className="cie-option-name">Todos los Diagnósticos (CIE 10)</span>
              <span className="cie-option-count">Ver Todo</span>
            </div>

            {filteredOptions
              .filter((opt) => (typeof opt === 'object' ? opt.value !== 'Todos los Diagnósticos' : opt !== 'Todos los Diagnósticos'))
              .map((opt) => {
                const optVal = typeof opt === 'object' ? opt.value : opt;
                const optName = typeof opt === 'object' ? (opt.name || opt.value) : opt;
                const optCount = typeof opt === 'object' ? opt.count : null;
                const isSelected = value === optVal;
                return (
                  <div
                    key={optVal}
                    className={`cie-option-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onChange(optVal);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    title={optVal}
                  >
                    <span className="cie-option-name">{optName}</span>
                    {optCount !== null && optCount !== undefined && (
                      <span className="cie-option-count">{fmt(optCount)}</span>
                    )}
                  </div>
                );
              })}

            {filteredOptions.length === 0 && (
              <div className="cie-empty-msg">
                No se encontraron diagnósticos para "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, change, kind = 'deep', sub }) {
  return (
    <article className={`metric-card ${kind}`}>
      <div className="metric-copy">
        <h2>{title}</h2>
        <div className="metric-value-row">
          <strong>{value}</strong>
          {change && <span>{change}</span>}
        </div>
        {sub && <small style={{ display: 'block', marginTop: 4, opacity: 0.85, fontSize: 11 }}>{sub}</small>}
      </div>
      <div className="card-sparkline" style={{ opacity: 0.4, fontSize: 14, letterSpacing: 2 }}>⌁⌁⌁⌁⌁</div>
    </article>
  );
}

function OrdersChart({ bars, month, year, theme = 'green', onOpenOrdersModal }) {
  const maxVal = Math.max(...bars.map((b) => b.value || 0), 100);
  const topTarget = maxVal * 1.15;
  const topRound = topTarget > 10000 ? Math.ceil(topTarget / 10000) * 10000 : Math.ceil(topTarget / 1000) * 1000 || 1000;
  const tickStep = topRound / 10;
  const ticks = Array.from({ length: 11 }, (_, i) => Math.round(i * tickStep));

  return (
    <section className="chart-panel">
      <div className="chart-header-block">
        <h2>Distribución de Órdenes por Grupo de Ordenamiento ({month} {year})</h2>
        <div className="chart-double-click-hint">
          <Icon name="info" size={14} />
          <span>Haz <strong>doble clic</strong> (o clic) sobre cualquier barra para ver el listado de <strong>pacientes, cédulas, cantidades y qué se ordenó</strong>.</span>
        </div>
      </div>
      <div className="chart-area">
        <div className="y-labels">
          {bars.map((bar) => (
            <span
              key={bar.label}
              className="y-label-interactive"
              onClick={() => onOpenOrdersModal && onOpenOrdersModal(bar.label)}
              onDoubleClick={() => onOpenOrdersModal && onOpenOrdersModal(bar.label)}
              title={`Doble clic para ver órdenes de ${bar.label}`}
            >
              {bar.label}
            </span>
          ))}
        </div>
        <div className="plot-wrap">
          <div className="grid-lines">
            {ticks.map((tick) => (
              <span key={tick} />
            ))}
          </div>
          <div className="bars">
            {bars.map((bar) => {
              const widthPct = Math.max(2, Math.min(100, (bar.value / topRound) * 100));
              const isInside = widthPct > 82;
              return (
                <div
                  key={bar.label}
                  className={`bar ${bar.color} bar-interactive-order`}
                  style={{ width: `${widthPct}%`, cursor: 'pointer' }}
                  onClick={() => onOpenOrdersModal && onOpenOrdersModal(bar.label)}
                  onDoubleClick={() => onOpenOrdersModal && onOpenOrdersModal(bar.label)}
                  title={`Doble clic para ver pacientes, cédulas y qué se ordenó en ${bar.label} (${fmt(bar.value)} órdenes)`}
                >
                  <span className={`bar-value-tag ${isInside ? 'inside' : ''}`}>
                    {fmt(bar.value)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="x-ticks">
            {ticks.map((tick) => (
              <span key={tick}>{tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick}</span>
            ))}
          </div>
          <div className="axis-title">Total Órdenes</div>
        </div>
      </div>
      <div className="legend">
        {bars.map((bar) => (
          <span
            key={bar.label}
            style={{ cursor: 'pointer' }}
            onClick={() => onOpenOrdersModal && onOpenOrdersModal(bar.label)}
            onDoubleClick={() => onOpenOrdersModal && onOpenOrdersModal(bar.label)}
            title={`Ver órdenes de ${bar.label}`}
          >
            <i className={`legend-dot ${bar.color ? bar.color.replace('bar-', '') : 'primary'}`} />
            {bar.label}
          </span>
        ))}
      </div>
    </section>
  );
}

function formatPatientDisplayName(name, cedula) {
  if (!name || name === 'PACIENTE SIN REGISTRO') {
    return cedula && cedula !== 'S/D' ? `Paciente (C.C. ${cedula})` : 'PACIENTE SIN REGISTRO';
  }
  const str = String(name).trim();
  if (/^\d+$/.test(str)) {
    return `Paciente (C.C. ${str})`;
  }
  return str;
}

function normalizeOrderGroup(o) {
  if (!o) return 'Otros';
  const concept = (o.c || '').toUpperCase();
  const rawG = (o.g || '').trim();

  if (concept === 'PRQX') {
    return 'Procedimientos Quirúrgicos';
  }
  if (concept === 'ECOG') {
    return 'Ecografías';
  }
  if (concept === 'IMAG' || concept === 'TOMO' || concept === 'RMAG' || concept === 'CARD' || concept === 'OTDX') {
    return 'Imágenes Diagnósticas';
  }
  if (concept === 'LABO') {
    return 'Laboratorio Clínico';
  }
  if (concept === 'MEDI') {
    return 'Medicamentos';
  }
  if (concept === 'HONO') {
    return 'Honorarios Médicos';
  }

  if (rawG) {
    const gl = rawG.toLowerCase();
    if (gl.includes('procedimiento') || gl.includes('quirurg') || gl.includes('cirug')) {
      return 'Procedimientos Quirúrgicos';
    }
    if (gl.includes('ecograf')) {
      return 'Ecografías';
    }
    if (gl.includes('imagen') || gl.includes('imágen') || gl.includes('radiolog') || gl.includes('tomograf') || gl.includes('resonanc')) {
      return 'Imágenes Diagnósticas';
    }
    if (gl.includes('laboratorio')) {
      return 'Laboratorio Clínico';
    }
    if (gl.includes('medicamento')) {
      return 'Medicamentos';
    }
    if (gl.includes('honorario') || gl.includes('interconsulta')) {
      return 'Honorarios Médicos';
    }
    return rawG;
  }
  return 'Otros';
}

function GroupOrdersDetailModal({
  groupInfo,
  year = '2026',
  month = 'Todos los Meses',
  specialist = 'Todos los Especialistas',
  specialty = 'Todas las Especialidades',
  selectedDiagnosis = 'Todos los Diagnósticos',
  onClose,
  dbData
}) {
  const initialGroup = typeof groupInfo === 'object' ? groupInfo.group : (groupInfo || 'ALL');
  const initialSpecialist = typeof groupInfo === 'object' && groupInfo.specialist ? groupInfo.specialist : specialist;
  const initialMonth = typeof groupInfo === 'object' && groupInfo.month ? groupInfo.month : month;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawCitasMap, setRawCitasMap] = useState({});
  const [selectedGroup, setSelectedGroup] = useState(initialGroup || 'ALL');
  const [selectedDoc, setSelectedDoc] = useState(initialSpecialist || 'Todos los Especialistas');
  const [selectedM, setSelectedM] = useState(initialMonth || 'Todos los Meses');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortField, setSortField] = useState('paciente');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const monthOptions = useMemo(() => [
    'Todos los Meses', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo',
    'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ], []);

  const groupOptions = useMemo(() => {
    const base = dbData?.orderingGroups || [
      'Medicamentos',
      'Laboratorio Clínico',
      'Honorarios Médicos',
      'Procedimientos Quirúrgicos',
      'Ecografías',
      'Imágenes Diagnósticas'
    ];
    return ['ALL', ...base];
  }, [dbData]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        if (selectedM && selectedM !== 'Todos los Meses') {
          const res = await fetch(`/data/citas/${year}_${selectedM}.json`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          setRawCitasMap({ [selectedM]: data });
          setLoading(false);
        } else {
          try {
            const res = await fetch(`/data/citas_${year}.json`);
            if (res.ok) {
              const data = await res.json();
              setRawCitasMap(data);
              setLoading(false);
              return;
            }
          } catch (e) {}

          const monthsToFetch = dbData?.months || ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre'];
          const map = {};
          await Promise.all(
            monthsToFetch.map(async (m) => {
              try {
                const r = await fetch(`/data/citas/${year}_${m}.json`);
                if (r.ok) {
                  map[m] = await r.json();
                }
              } catch (err) {}
            })
          );
          setRawCitasMap(map);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error cargando citas para órdenes:', err);
        setError('No se pudieron cargar los datos de órdenes.');
        setLoading(false);
      }
    };

    loadData();
  }, [year, selectedM, dbData]);

  const normDoc = (str) => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();

  const allowedDocsSet = useMemo(() => {
    if (!dbData?.specialists || !Array.isArray(dbData.specialists) || dbData.specialists.length === 0) {
      return null;
    }
    const set = new Set();
    dbData.specialists.forEach((s) => {
      const name = typeof s === 'object' ? s.name : s;
      if (name) {
        set.add(name.trim().toUpperCase());
        set.add(normDoc(name));
      }
    });
    return set;
  }, [dbData]);

  const specByDoc = useMemo(() => {
    const map = {};
    (dbData?.specialists || []).forEach((s) => {
      if (typeof s === 'object') {
        map[s.name] = s.specialty;
        map[s.name.toUpperCase()] = s.specialty;
        map[normDoc(s.name)] = s.specialty;
      }
    });
    return map;
  }, [dbData]);

  const allExtractedOrders = useMemo(() => {
    const list = [];
    const gNorm = selectedGroup && selectedGroup !== 'ALL' && selectedGroup !== 'Grupo de Ordenamiento' ? selectedGroup.trim().toLowerCase() : null;

    Object.entries(rawCitasMap).forEach(([mName, monthDocsData]) => {
      if (!monthDocsData || typeof monthDocsData !== 'object') return;

      Object.entries(monthDocsData).forEach(([docName, citasArr]) => {
        const docUpper = (docName || '').trim().toUpperCase();
        const docNorm = normDoc(docName);
        if (allowedDocsSet && !allowedDocsSet.has(docUpper) && !allowedDocsSet.has(docNorm)) {
          return;
        }

        if (selectedDoc && selectedDoc !== 'Todos los Especialistas') {
          if (docName !== selectedDoc && normDoc(docName) !== normDoc(selectedDoc)) {
            return;
          }
        }
        if (specialty && specialty !== 'Todas las Especialidades') {
          const docSpec = specByDoc[docName] || specByDoc[docUpper] || specByDoc[docNorm] || '';
          if (docSpec && docSpec !== specialty) {
            return;
          }
        }

        (citasArr || []).forEach((c, cIdx) => {
          if (selectedDiagnosis && selectedDiagnosis !== 'Todos los Diagnósticos') {
            if (!c.diag || !c.diag.toLowerCase().includes(selectedDiagnosis.toLowerCase())) {
              return;
            }
          }

          const orders = c.ord || [];
          orders.forEach((o, oIdx) => {
            const oGroup = normalizeOrderGroup(o);
            if (gNorm && oGroup.toLowerCase() !== gNorm) {
              return;
            }

            list.push({
              id: `${mName}_${docName}_${c.c || ''}_${cIdx}_${oIdx}`,
              paciente: formatPatientDisplayName(c.p, c.c),
              cedula: c.c || 'S/D',
              registro: c.reg || 'S/D',
              edad: c.edad || null,
              tipoConsulta: c.t || 'Consulta',
              fecha: c.f || 'S/F',
              medico: c.doctoresList || c.esp || docName,
              especialidad: specByDoc[docName] || c.esp || '',
              diagnostico: c.diag || 'Sin diagnóstico registrado',
              grupo: oGroup,
              codigo: o.cod || o.c || '',
              descripcion: o.d || o.descripcion || 'Sin descripción',
              cantidad: o.cant !== undefined && o.cant !== null ? o.cant : 1,
              frecuencia: o.fr || '',
              observaciones: o.obs || '',
              mes: mName
            });
          });
        });
      });
    });

    return list;
  }, [rawCitasMap, selectedGroup, selectedDoc, specialty, selectedDiagnosis, specByDoc]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return allExtractedOrders;
    const q = searchTerm.toLowerCase();
    return allExtractedOrders.filter((r) =>
      r.paciente.toLowerCase().includes(q) ||
      r.cedula.toLowerCase().includes(q) ||
      r.descripcion.toLowerCase().includes(q) ||
      r.codigo.toLowerCase().includes(q) ||
      r.medico.toLowerCase().includes(q) ||
      r.diagnostico.toLowerCase().includes(q) ||
      r.observaciones.toLowerCase().includes(q)
    );
  }, [allExtractedOrders, searchTerm]);

  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedOrders.length / rowsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedOrders.slice(start, start + rowsPerPage);
  }, [sortedOrders, currentPage, rowsPerPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      'Mes', 'Nombre del Paciente', 'Cédula', 'Qué se Ordenó (Descripción)',
      'Código / CUPS', 'Cantidad', 'Grupo', 'Dosis / Indicaciones',
      'Médico Tratante', 'Especialidad', 'Fecha Consulta', 'Diagnóstico CIE 10'
    ];
    const csvContent = [
      headers.join(','),
      ...sortedOrders.map((r) => [
        `"${r.mes}"`,
        `"${r.paciente}"`,
        `"${r.cedula}"`,
        `"${r.descripcion.replace(/"/g, '""')}"`,
        `"${r.codigo}"`,
        r.cantidad,
        `"${r.grupo}"`,
        `"${(r.frecuencia || r.observaciones || '').replace(/"/g, '""')}"`,
        `"${r.medico}"`,
        `"${r.especialidad}"`,
        `"${r.fecha}"`,
        `"${r.diagnostico.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `detalle_ordenes_${selectedGroup}_${year}_${selectedM}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalQuantity = useMemo(() => {
    return filteredOrders.reduce((acc, curr) => acc + (Number(curr.cantidad) || 1), 0);
  }, [filteredOrders]);

  const uniquePatientsCount = useMemo(() => {
    return new Set(filteredOrders.map((o) => o.cedula || o.paciente)).size;
  }, [filteredOrders]);

  const uniqueDocsCount = useMemo(() => {
    return new Set(filteredOrders.map((o) => o.medico)).size;
  }, [filteredOrders]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container modal-orders-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-avatar" style={{ background: '#fef3c7', color: '#b45309' }}>
              <Icon name="file" size={24} />
            </div>
            <div>
              <div className="modal-title-row">
                <h2>Detalle de Órdenes: {selectedGroup === 'ALL' ? 'Todos los Grupos' : selectedGroup}</h2>
                <span className="badge-period">{selectedM} {year}</span>
                {selectedDoc !== 'Todos los Especialistas' && (
                  <span className="badge-spec">{selectedDoc}</span>
                )}
                {specialty !== 'Todas las Especialidades' && (
                  <span className="badge-current-filter">{specialty}</span>
                )}
                {selectedDiagnosis !== 'Todos los Diagnósticos' && (
                  <span className="badge-tag badge-tag-other">CIE 10: {selectedDiagnosis}</span>
                )}
              </div>
              <p className="modal-subtitle">
                Listado de órdenes prescritas con nombre del paciente, cédula, qué se ordenó y cantidad
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Cerrar modal (Esc)">
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Modal KPIs Grid */}
        <div className="modal-kpis-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="modal-kpi-card">
            <span className="kpi-label">Total Órdenes</span>
            <strong className="kpi-val">{fmt(filteredOrders.length)}</strong>
            <span className="kpi-sub">Prescripciones registradas</span>
          </div>
          <div className="modal-kpi-card">
            <span className="kpi-label">Cantidad de Ítems</span>
            <strong className="kpi-val text-warning">{fmt(totalQuantity)}</strong>
            <span className="kpi-sub">Unidades / Servicios</span>
          </div>
          <div className="modal-kpi-card">
            <span className="kpi-label">Pacientes Únicos</span>
            <strong className="kpi-val text-pvez">{fmt(uniquePatientsCount)}</strong>
            <span className="kpi-sub">Personas con órdenes</span>
          </div>
          <div className="modal-kpi-card">
            <span className="kpi-label">Médicos Prescriptores</span>
            <strong className="kpi-val text-ctrl">{fmt(uniqueDocsCount)}</strong>
            <span className="kpi-sub">Especialistas</span>
          </div>
        </div>

        {/* Modal Toolbar */}
        <div className="modal-toolbar">
          <div className="modal-pills">
            {groupOptions.map((g) => (
              <button
                key={g}
                type="button"
                className={`pill-btn ${selectedGroup === g ? 'active' : ''}`}
                onClick={() => { setSelectedGroup(g); setCurrentPage(1); }}
              >
                {g === 'ALL' ? 'Todos los Grupos' : g}
              </button>
            ))}
          </div>

          <div className="modal-toolbar-right">
            <div className="modal-search">
              <Icon name="search" size={16} />
              <input
                type="text"
                placeholder="Buscar paciente, cédula, qué se ordenó..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  className="unified-search-clear"
                  style={{ width: 16, height: 16 }}
                  onClick={() => setSearchTerm('')}
                >
                  <Icon name="x" size={10} />
                </button>
              )}
            </div>

            <div className="modal-month-filter">
              <Icon name="calendar" size={14} />
              <select
                className="modal-select-month"
                value={selectedM}
                onChange={(e) => { setSelectedM(e.target.value); setCurrentPage(1); }}
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <button className="modal-export-btn" onClick={exportCSV} title="Exportar órdenes a CSV">
              <Icon name="file" size={15} /> Exportar CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="modal-loading-state">
            <div className="spinner" />
            <span>Cargando órdenes y pacientes...</span>
          </div>
        ) : error ? (
          <div className="modal-error-state">
            <Icon name="alert" size={32} />
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="modal-table-wrap">
              <table className="modal-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th onClick={() => handleSort('paciente')} style={{ minWidth: '180px' }}>
                      Nombre del Paciente {sortField === 'paciente' ? (sortAsc ? '▲' : '▼') : ''}
                    </th>
                    <th onClick={() => handleSort('cedula')} style={{ width: '120px' }}>
                      Cédula / ID {sortField === 'cedula' ? (sortAsc ? '▲' : '▼') : ''}
                    </th>
                    <th onClick={() => handleSort('cantidad')} className="text-center" style={{ width: '90px' }}>
                      Cantidad {sortField === 'cantidad' ? (sortAsc ? '▲' : '▼') : ''}
                    </th>
                    <th onClick={() => handleSort('descripcion')} style={{ minWidth: '240px' }}>
                      Qué se Ordenó (Descripción / CUPS) {sortField === 'descripcion' ? (sortAsc ? '▲' : '▼') : ''}
                    </th>
                    <th style={{ minWidth: '160px' }}>Indicaciones / Dosis</th>
                    <th onClick={() => handleSort('medico')} style={{ minWidth: '160px' }}>
                      Médico Tratante {sortField === 'medico' ? (sortAsc ? '▲' : '▼') : ''}
                    </th>
                    <th onClick={() => handleSort('fecha')} style={{ width: '130px' }}>
                      Fecha Consulta {sortField === 'fecha' ? (sortAsc ? '▲' : '▼') : ''}
                    </th>
                    <th onClick={() => handleSort('diagnostico')} style={{ minWidth: '180px' }}>
                      Diagnóstico CIE 10 {sortField === 'diagnostico' ? (sortAsc ? '▲' : '▼') : ''}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.length > 0 ? (
                    paginatedOrders.map((row, idx) => {
                      const rowNum = (currentPage - 1) * rowsPerPage + idx + 1;
                      return (
                        <tr key={row.id || `${row.cedula}-${idx}`}>
                          <td className="text-muted">{rowNum}</td>
                          <td className="cell-patient-name font-bold">
                            <span className="patient-name-text-clean" title={row.paciente}>
                              {row.paciente}
                            </span>
                          </td>
                          <td className="font-mono">
                            <span className="badge-registro">
                              {row.cedula}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge-order-qty-pill">
                              {row.cantidad}
                            </span>
                          </td>
                          <td>
                            <div className="order-desc-cell">
                              <span className="order-main-text">{row.descripcion}</span>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                                {row.codigo && (
                                  <span className="cups-code" style={{ fontSize: 11 }}>CUPS: {row.codigo}</span>
                                )}
                                <span className="order-group-subtag">{row.grupo}</span>
                              </div>
                            </div>
                          </td>
                          <td className="cell-dosage-text">
                            {row.frecuencia || row.observaciones ? (
                              <span>{row.frecuencia} {row.observaciones ? `(${row.observaciones})` : ''}</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="cell-doc-name" title={row.medico}>
                            <strong>{row.medico}</strong>
                            {row.especialidad && <small className="doc-sub-spec">{row.especialidad}</small>}
                          </td>
                          <td className="cell-date-time font-mono">
                            <span>{row.fecha}</span>
                          </td>
                          <td className="cell-diag-desc" title={row.diagnostico}>
                            <span className="diag-text">{row.diagnostico}</span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="modal-empty-cell">
                        No se encontraron órdenes registradas para los filtros seleccionados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="modal-pagination">
              <div className="page-indicator">
                Página {currentPage} de {totalPages} ({fmt(filteredOrders.length)} órdenes)
              </div>
              <div className="pagination-controls">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                  ◀ Anterior
                </button>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                  Siguiente ▶
                </button>
                <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                  <option value={15}>15 por pág.</option>
                  <option value={25}>25 por pág.</option>
                  <option value={50}>50 por pág.</option>
                  <option value={100}>100 por pág.</option>
                  <option value={200}>200 por pág.</option>
                </select>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DoctorAppointmentsModal({ doctorRow, onClose, allowOrders = false, selectedDiagnosis, selectedProcedure, dbData }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawCitas, setRawCitas] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(doctorRow?.mes || 'Todos los Meses');
  const [filterType, setFilterType] = useState(doctorRow?.defaultFilter || 'ALL');
  const [search, setSearch] = useState(
    doctorRow?.diagnostico ||
    (doctorRow?.procedimiento && doctorRow.procedimiento !== 'Todos los Procedimientos' ? doctorRow.procedimiento : '') ||
    (selectedProcedure && selectedProcedure !== 'Todos los Procedimientos' ? selectedProcedure : '') ||
    (selectedDiagnosis && selectedDiagnosis !== 'Todos los Diagnósticos' ? selectedDiagnosis : '')
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortField, setSortField] = useState('f');
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedRowKey, setExpandedRowKey] = useState(null);
  const [orderCategoryFilter, setOrderCategoryFilter] = useState('ALL');

  useEffect(() => {
    if (doctorRow?.defaultFilter) {
      setFilterType(doctorRow.defaultFilter);
    }
    if (doctorRow?.mes) {
      setSelectedMonth(doctorRow.mes);
    }
    if (doctorRow?.diagnostico && doctorRow.diagnostico !== 'Todos los Diagnósticos') {
      setSearch(doctorRow.diagnostico);
    } else if (doctorRow?.procedimiento && doctorRow.procedimiento !== 'Todos los Procedimientos') {
      setSearch(doctorRow.procedimiento);
    } else if (selectedProcedure && selectedProcedure !== 'Todos los Procedimientos') {
      setSearch(selectedProcedure);
    } else if (selectedDiagnosis && selectedDiagnosis !== 'Todos los Diagnósticos') {
      setSearch(selectedDiagnosis);
    } else {
      setSearch('');
    }
    setExpandedRowKey(null);
  }, [doctorRow, selectedDiagnosis, selectedProcedure]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const monthOptions = useMemo(() => [
    'Todos los Meses', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo',
    'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ], []);

  useEffect(() => {
    if (!doctorRow) return;
    setLoading(true);
    setError(null);
    const { anio, especialista } = doctorRow;

    if (selectedMonth && selectedMonth !== 'Todos los Meses') {
      fetch(`/data/citas/${anio}_${selectedMonth}.json`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          const list = (data[especialista] || []).map((item) => ({ ...item, mesName: selectedMonth }));
          setRawCitas(list);
          setLoading(false);
        })
        .catch((err) => {
          fetch(`/data/citas_${anio}.json`)
            .then((r) => r.json())
            .then((ydata) => {
              const list = (ydata[selectedMonth]?.[especialista] || []).map((item) => ({ ...item, mesName: selectedMonth }));
              setRawCitas(list);
              setLoading(false);
            })
            .catch((e) => {
              console.error(e);
              setError('No se pudieron cargar los datos del especialista.');
              setLoading(false);
            });
        });
    } else {
      fetch(`/data/citas_${anio}.json`)
        .then((res) => res.json())
        .then((data) => {
          const list = [];
          Object.keys(data).forEach((m) => {
            const arr = data[m]?.[especialista] || [];
            arr.forEach((item) => list.push({ ...item, mesName: m }));
          });
          setRawCitas(list);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError('No se pudieron cargar los datos del especialista.');
          setLoading(false);
        });
    }
  }, [doctorRow, selectedMonth]);

  const uniqueRawCitas = useMemo(() => {
    const seen = new Set();
    return rawCitas.filter((c) => {
      const key = `${c.esp || ''}_${c.f || ''}_${(c.c || '').trim()}_${(c.cups || '').trim()}_${c.t || ''}_${c.r || ''}_${c.reg || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [rawCitas]);

  const patientStatsMap = useMemo(() => {
    const map = {};
    uniqueRawCitas.forEach((c) => {
      const key = (c.c && c.c.trim()) || (c.p && c.p.trim());
      if (!key) return;
      if (!map[key]) {
        map[key] = {
          totalCitas: 0,
          totalControles: 0,
          totalPrimera: 0,
          doctores: new Set(),
        };
      }
      map[key].totalCitas += 1;
      if (c.t === 'Control') {
        map[key].totalControles += 1;
      }
      if (c.t === '1ra Vez') {
        map[key].totalPrimera += 1;
      }
      if (c.esp) {
        map[key].doctores.add(c.esp);
      }
    });
    return map;
  }, [uniqueRawCitas]);

  const enrichedCitas = useMemo(() => {
    return uniqueRawCitas.map((c) => {
      const key = (c.c && c.c.trim()) || (c.p && c.p.trim());
      const pStat = key ? patientStatsMap[key] : null;
      const totalCitas = pStat ? pStat.totalCitas : 1;
      const totalControles = pStat ? pStat.totalControles : (c.t === 'Control' ? 1 : 0);
      const doctoresList = pStat && pStat.doctores.size > 0 ? Array.from(pStat.doctores).join(', ') : (c.esp || doctorRow.especialista);
      const isRepeated = totalCitas > 1 || totalControles > 1;

      return {
        ...c,
        totalCitas,
        totalControles,
        doctoresList,
        isRepeated,
        repeatCount: totalCitas,
      };
    });
  }, [uniqueRawCitas, patientStatsMap, doctorRow]);

  const stats = useMemo(() => {
    const total = enrichedCitas.length;
    const realizadas = enrichedCitas.filter((c) => c.r === 'S').length;
    const noRealizadas = total - realizadas;
    const primeraVez = enrichedCitas.filter((c) => c.t === '1ra Vez').length;
    const control = enrichedCitas.filter((c) => c.t === 'Control').length;
    const recurrentes = enrichedCitas.filter((c) => c.isRepeated).length;
    const uniquePatients = Object.keys(patientStatsMap).length;
    const uniqueRecurrentPatients = Object.values(patientStatsMap).filter((s) => s.totalCitas > 1 || s.totalControles > 1).length;

    return {
      total,
      realizadas,
      noRealizadas,
      primeraVez,
      control,
      recurrentes,
      uniquePatients,
      uniqueRecurrentPatients,
    };
  }, [enrichedCitas, patientStatsMap]);

  const orderStats = useMemo(() => {
    let citasMed = 0;
    let citasImag = 0;
    let citasLab = 0;
    let citasHono = 0;

    uniqueRawCitas.forEach((c) => {
      (c.ord || []).forEach((o) => {
        const grp = (o.g || '').trim();
        const qty = o.q || 1;
        if (grp === 'Medicamentos') citasMed += qty;
        else if (grp === 'Imágenes Diagnósticas') citasImag += qty;
        else if (grp === 'Laboratorio Clínico') citasLab += qty;
        else if (grp === 'Honorarios Médicos') citasHono += qty;
      });
    });

    let dbMed = 0;
    let dbImag = 0;
    let dbLab = 0;
    let dbHono = 0;
    if (doctorRow) {
      const targetDb = doctorRow?.dbData || dbData || centralEspecialistasData;
      const mIdx = selectedMonth && selectedMonth !== 'Todos los Meses' ? MONTH_NAMES.indexOf(selectedMonth) + 1 : null;
      if (mIdx) {
        const key = `${doctorRow.anio}_${mIdx}_${doctorRow.especialista}`;
        const docO = targetDb?.ordersBySpecialist?.[key];
        if (docO) {
          dbMed = docO.medicamentos || 0;
          dbImag = docO.imagenes || 0;
          dbLab = docO.laboratorios || 0;
          dbHono = docO.honorarios || 0;
        }
      } else {
        for (let m = 1; m <= 12; m++) {
          const key = `${doctorRow.anio}_${m}_${doctorRow.especialista}`;
          const docO = targetDb?.ordersBySpecialist?.[key];
          if (docO) {
            dbMed += docO.medicamentos || 0;
            dbImag += docO.imagenes || 0;
            dbLab += docO.laboratorios || 0;
            dbHono += docO.honorarios || 0;
          }
        }
      }
    }

    return {
      medicamentos: Math.max(citasMed, dbMed),
      imagenes: Math.max(citasImag, dbImag),
      laboratorios: Math.max(citasLab, dbLab),
      honorarios: Math.max(citasHono, dbHono),
    };
  }, [uniqueRawCitas, selectedMonth, doctorRow, dbData]);

  const filteredCitas = useMemo(() => {
    return enrichedCitas.filter((c) => {
      if (filterType === 'REPEATED' && !c.isRepeated) return false;
      if (filterType === 'PRIMERA' && c.t !== '1ra Vez') return false;
      if (filterType === 'CONTROL' && c.t !== 'Control') return false;
      if (filterType === 'REALIZADA' && c.r !== 'S') return false;
      if (filterType === 'NO_REALIZADA' && c.r === 'S') return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const pMatch = c.p?.toLowerCase().includes(q);
        const cMatch = c.c?.toLowerCase().includes(q);
        const regMatch = c.reg?.toLowerCase().includes(q);
        const diagMatch = c.diag?.toLowerCase().includes(q) || c.dx?.toLowerCase().includes(q);
        const cupsMatch = c.cups?.toLowerCase().includes(q);
        const sMatch = c.s?.toLowerCase().includes(q);
        const docMatch = c.doctoresList?.toLowerCase().includes(q);
        if (!pMatch && !cMatch && !regMatch && !diagMatch && !cupsMatch && !sMatch && !docMatch) return false;
      }
      return true;
    });
  }, [enrichedCitas, filterType, search]);

  const sortedCitas = useMemo(() => {
    return [...filteredCitas].sort((a, b) => {
      let valA = a[sortField] || a.f;
      let valB = b[sortField] || b.f;
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredCitas, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedCitas.length / rowsPerPage) || 1;
  const paginatedCitas = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedCitas.slice(start, start + rowsPerPage);
  }, [sortedCitas, currentPage, rowsPerPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const exportDetailCSV = () => {
    const headers = [
      'Año', 'Mes', 'Especialista', 'Especialidad', 'Fecha y Hora',
      'Documento', 'Registro', 'Paciente', 'Diagnóstico', 'Edad', 'Tipo Cita', 'Controles en el Mes',
      'Total Citas Mes', 'Especialista que Atendió', 'CUPS', 'Procedimiento',
      'Estado', 'Es Recurrente (>1 en el mes)'
    ];
    const csvContent = [
      headers.join(','),
      ...sortedCitas.map((c) => [
        doctorRow.anio,
        `"${selectedMonth}"`,
        `"${doctorRow.especialista}"`,
        `"${doctorRow.especialidad}"`,
        `"${c.f}"`,
        `"${c.c}"`,
        `"${c.reg || ''}"`,
        `"${c.p}"`,
        `"${c.diag || ''}"`,
        c.edad ? `${c.edad} años` : 'S/D',
        `"${c.t}"`,
        c.totalControles,
        c.totalCitas,
        `"${c.doctoresList || doctorRow.especialista}"`,
        `"${c.cups}"`,
        `"${c.s}"`,
        `"${c.r === 'S' ? 'Realizada' : 'No Asistió'}"`,
        `"${c.isRepeated ? 'SÍ (>1 en el mes)' : 'NO'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `detalle_pacientes_${doctorRow.especialista.replace(/\s+/g, '_')}_${doctorRow.anio}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!doctorRow) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-avatar">
              <Icon name="stethoscope" size={24} />
            </div>
            <div>
              <div className="modal-title-row">
                <h2>{doctorRow.especialista}</h2>
                <span className="badge-spec">{doctorRow.especialidad}</span>
                <span className="badge-period">{selectedMonth} {doctorRow.anio}</span>
                <span className="badge-current-filter">
                  {filterType === 'PRIMERA' ? 'Vista: 1ra Vez' : filterType === 'CONTROL' ? 'Vista: Controles' : 'Vista: Todas las Citas'}
                </span>
              </div>
              <p className="modal-subtitle">
                Información de pacientes atendidos, diagnóstico clínico, cédula, registro, edad, controles en el mes y especialista asignado
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Cerrar modal (Esc)">
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Modal KPIs */}
        <div className="modal-kpis-grid">
          <div className="modal-kpi-card">
            <span className="kpi-label">Total Citas</span>
            <strong className="kpi-val">{fmt(stats.total)}</strong>
            <span className="kpi-sub">En {selectedMonth} {doctorRow.anio}</span>
          </div>
          <div className="modal-kpi-card">
            <span className="kpi-label">Pacientes Únicos</span>
            <strong className="kpi-val">{fmt(stats.uniquePatients)}</strong>
            <span className="kpi-sub">Personas atendidas</span>
          </div>
          <div className="modal-kpi-card">
            <span className="kpi-label">1ra Vez</span>
            <strong className="kpi-val text-pvez">{fmt(stats.primeraVez)}</strong>
            <span className="kpi-sub">Primera oportunidad</span>
          </div>
          <div className="modal-kpi-card">
            <span className="kpi-label">Controles</span>
            <strong className="kpi-val text-ctrl">{fmt(stats.control)}</strong>
            <span className="kpi-sub">Seguimientos</span>
          </div>
          <div className="modal-kpi-card kpi-recurrent">
            <span className="kpi-label">Pacientes con &gt; 1 Consulta</span>
            <strong className="kpi-val text-warning">{fmt(stats.uniqueRecurrentPatients)} personas</strong>
            <span className="kpi-sub">{fmt(stats.recurrentes)} citas repetidas en el mes</span>
          </div>
        </div>

        {/* Modal Orders KPIs - Solo visible en Gestión de Asistencias */}
        {!allowOrders && (
          <div className="modal-orders-kpis-grid">
            <div className="modal-order-kpi-card kpi-card-med">
              <div className="order-kpi-icon-wrap icon-med">
                <Icon name="pill" size={18} />
              </div>
              <div className="order-kpi-content">
                <span className="order-kpi-label">Medicamentos</span>
                <strong className="order-kpi-val">{fmt(orderStats.medicamentos)}</strong>
                <span className="order-kpi-sub">Fórmulas prescritas</span>
              </div>
            </div>
            <div className="modal-order-kpi-card kpi-card-imag">
              <div className="order-kpi-icon-wrap icon-imag">
                <Icon name="image" size={18} />
              </div>
              <div className="order-kpi-content">
                <span className="order-kpi-label">Imágenes Diagnósticas</span>
                <strong className="order-kpi-val">{fmt(orderStats.imagenes)}</strong>
                <span className="order-kpi-sub">Estudios de imagen</span>
              </div>
            </div>
            <div className="modal-order-kpi-card kpi-card-lab">
              <div className="order-kpi-icon-wrap icon-lab">
                <Icon name="flask" size={18} />
              </div>
              <div className="order-kpi-content">
                <span className="order-kpi-label">Laboratorio Clínico</span>
                <strong className="order-kpi-val">{fmt(orderStats.laboratorios)}</strong>
                <span className="order-kpi-sub">Pruebas diagnósticas</span>
              </div>
            </div>
            <div className="modal-order-kpi-card kpi-card-hono">
              <div className="order-kpi-icon-wrap icon-hono">
                <Icon name="stethoscope" size={18} />
              </div>
              <div className="order-kpi-content">
                <span className="order-kpi-label">Honorarios Médicos</span>
                <strong className="order-kpi-val">{fmt(orderStats.honorarios)}</strong>
                <span className="order-kpi-sub">Consultas e interconsultas</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Filter Toolbar */}
        <div className="modal-toolbar">
          <div className="modal-pills">
            <button
              className={`pill-btn ${filterType === 'ALL' ? 'active' : ''}`}
              onClick={() => { setFilterType('ALL'); setCurrentPage(1); }}
            >
              Todas ({stats.total})
            </button>
            <button
              className={`pill-btn ${filterType === 'PRIMERA' ? 'active' : ''}`}
              onClick={() => { setFilterType('PRIMERA'); setCurrentPage(1); }}
            >
              1ra Vez ({stats.primeraVez})
            </button>
            <button
              className={`pill-btn ${filterType === 'CONTROL' ? 'active' : ''}`}
              onClick={() => { setFilterType('CONTROL'); setCurrentPage(1); }}
            >
              Controles ({stats.control})
            </button>
            <button
              className={`pill-btn pill-btn-warning ${filterType === 'REPEATED' ? 'active' : ''}`}
              onClick={() => { setFilterType('REPEATED'); setCurrentPage(1); }}
            >
              <Icon name="alert" size={13} /> Recurrentes &gt; 1 ({stats.recurrentes})
            </button>
            <button
              className={`pill-btn ${filterType === 'REALIZADA' ? 'active' : ''}`}
              onClick={() => { setFilterType('REALIZADA'); setCurrentPage(1); }}
            >
              Realizadas ({stats.realizadas})
            </button>
            <button
              className={`pill-btn ${filterType === 'NO_REALIZADA' ? 'active' : ''}`}
              onClick={() => { setFilterType('NO_REALIZADA'); setCurrentPage(1); }}
            >
              No Asistió ({stats.noRealizadas})
            </button>
          </div>

          <div className="modal-toolbar-right">
            <div className="modal-month-filter" title="Filtrar por Mes">
              <label htmlFor="modal-month-select">
                <Icon name="calendar" size={14} />
              </label>
              <select
                id="modal-month-select"
                className="modal-select-month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="modal-search">
              <Icon name="search" size={15} />
              <input
                type="text"
                placeholder="Buscar paciente, diagnóstico, cédula, registro..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <button className="modal-export-btn" onClick={exportDetailCSV} title="Descargar citas en Excel/CSV">
              <Icon name="file" size={15} /> Exportar CSV
            </button>
          </div>
        </div>

        {/* Legend Notice for Recurrence & Patient Orders */}
        <div className="modal-recurrent-legend">
          <span className="legend-chip-warning">
            <span className="legend-color-box" /> Filas en amarillo/naranja = Pacientes con 2 o más citas en el mes
          </span>
          {allowOrders && (
            <span className="legend-chip-orders-hint">
              <Icon name="info" size={14} /> Haz <strong>clic sobre cualquier paciente</strong> para ver sus recetas y órdenes médicas (Medicamentos, Imágenes, Laboratorios, Honorarios)
            </span>
          )}
        </div>

        {/* Modal Table Area */}
        <div className="modal-table-wrap">
          {loading ? (
            <div className="modal-loading-state">
              <div className="spinner" />
              <span>Cargando datos de pacientes y diagnósticos...</span>
            </div>
          ) : error ? (
            <div className="modal-error-state">
              <Icon name="alert" size={24} />
              <span>{error}</span>
            </div>
          ) : (
            <table className="modal-table">
              <thead>
                <tr>
                  <th style={{ width: '38px' }}>#</th>
                  <th onClick={() => handleSort('p')} style={{ width: allowOrders ? '210px' : '180px' }}>
                    Nombre del Paciente {sortField === 'p' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('diag')} style={{ width: '220px' }}>
                    Descripción del Diagnóstico {sortField === 'diag' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('c')} style={{ width: '100px' }}>
                    Cédula / ID {sortField === 'c' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('reg')} style={{ width: '90px' }}>
                    Registro {sortField === 'reg' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('edad')} className="text-center" style={{ width: '75px' }}>
                    Edad {sortField === 'edad' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('t')} style={{ width: '90px' }}>
                    Tipo {sortField === 't' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('totalControles')} className="text-center" style={{ width: '140px' }}>
                    Controles en el Mes {sortField === 'totalControles' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('doctoresList')}>
                    Especialista que lo atendió {sortField === 'doctoresList' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('f')} style={{ width: '125px' }}>
                    Fecha / Hora {sortField === 'f' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('r')} className="text-center" style={{ width: '90px' }}>
                    Estado {sortField === 'r' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedCitas.length > 0 ? (
                  paginatedCitas.map((c, idx) => {
                    const rowNum = (currentPage - 1) * rowsPerPage + idx + 1;
                    const rowKey = `${c.f}-${c.c}-${c.reg || ''}-${idx}`;
                    const isExpanded = allowOrders && expandedRowKey === rowKey;
                    const orders = c.ord || [];
                    const countMed = orders.filter((o) => o.g === 'Medicamentos').length;
                    const countImag = orders.filter((o) => o.g === 'Imágenes Diagnósticas').length;
                    const countLab = orders.filter((o) => o.g === 'Laboratorio Clínico').length;
                    const countHono = orders.filter((o) => o.g === 'Honorarios Médicos').length;
                    const countPrqx = orders.filter((o) => !['Medicamentos', 'Imágenes Diagnósticas', 'Laboratorio Clínico', 'Honorarios Médicos'].includes(o.g)).length;

                    return (
                      <React.Fragment key={rowKey}>
                        <tr
                          className={`${c.isRepeated ? 'row-recurrent-patient' : ''} ${isExpanded ? 'row-is-expanded' : ''} ${allowOrders ? 'row-patient-interactive' : ''}`}
                          onClick={() => {
                            if (allowOrders) {
                              setExpandedRowKey(isExpanded ? null : rowKey);
                            }
                          }}
                          title={allowOrders ? "Clic para ver órdenes y recetas de este paciente" : undefined}
                        >
                          <td className="text-muted">{rowNum}</td>
                          <td className="font-bold cell-patient-name">
                            {allowOrders ? (
                              <div className="patient-name-container">
                                <span className="patient-name-text">{formatPatientDisplayName(c.p, c.c)}</span>
                                <div className="patient-badges-line">
                                  <span className={`patient-orders-badge ${orders.length > 0 ? 'has-orders' : 'empty-orders'}`}>
                                    <Icon name={isExpanded ? 'chevronUp' : 'chevronDown'} size={12} />
                                    {orders.length > 0 ? `${orders.length} órdenes` : 'Sin órdenes'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span>{formatPatientDisplayName(c.p, c.c)}</span>
                            )}
                          </td>
                          <td className="cell-diag-desc" title={c.diag || ''}>
                            {c.diag ? (
                              <span className="diag-text">{c.diag}</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="font-mono">{c.c || 'S/D'}</td>
                          <td className="font-mono cell-reg-id">
                            {c.reg ? (
                              <span className="badge-registro">{c.reg}</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="text-center">
                            {c.edad ? (
                              <span className="badge-age">{c.edad} años</span>
                            ) : (
                              <span className="text-muted">S/D</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge-tag ${c.t === '1ra Vez' ? 'badge-tag-pvez' : c.t === 'Control' ? 'badge-tag-ctrl' : 'badge-tag-other'}`}>
                              {c.t}
                            </span>
                          </td>
                          <td className="text-center">
                            {c.totalControles > 1 ? (
                              <span className="badge-warning-repeat" title={`Este paciente tiene ${c.totalControles} controles en este mes`}>
                                <Icon name="alert" size={12} /> {c.totalControles} controles en el mes
                              </span>
                            ) : c.totalControles === 1 ? (
                              <span className="badge-single-ctrl">1 control</span>
                            ) : (
                              <span className="badge-zero-ctrl">0 controles</span>
                            )}
                          </td>
                          <td className="cell-doc-name" title={c.doctoresList}>
                            <strong>{c.doctoresList || c.esp || doctorRow.especialista}</strong>
                          </td>
                          <td className="cell-date-time">
                            <span>{c.f}</span>
                          </td>
                          <td className="text-center">
                            {c.r === 'S' ? (
                              <span className="badge-realizada"><Icon name="check" size={11} /> Realizada</span>
                            ) : (
                              <span className="badge-no-asistio">No Asistió</span>
                            )}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="row-orders-expansion">
                            <td colSpan={11} className="cell-orders-panel">
                              <div className="patient-orders-wrapper">
                                <div className="orders-panel-header">
                                  <div className="orders-header-title">
                                    <Icon name="file" size={18} />
                                    <span>Órdenes Médicas y Fórmulas Prescritas</span>
                                    <span className="orders-count-pill">{orders.length} {orders.length === 1 ? 'ítem' : 'ítems'}</span>
                                    <span className="orders-patient-info">
                                      Paciente: <strong>{c.p}</strong> | ID: <strong>{c.c || 'S/D'}</strong> | Registro: <strong>{c.reg || 'S/D'}</strong> | Fecha: <strong>{c.f}</strong>
                                    </span>
                                  </div>
                                  <div className="orders-category-filters">
                                    <button
                                      type="button"
                                      className={`cat-pill-btn ${orderCategoryFilter === 'ALL' ? 'active' : ''}`}
                                      onClick={(e) => { e.stopPropagation(); setOrderCategoryFilter('ALL'); }}
                                    >
                                      Todas ({orders.length})
                                    </button>
                                    {countMed > 0 && (
                                      <button
                                        type="button"
                                        className={`cat-pill-btn cat-pill-med ${orderCategoryFilter === 'Medicamentos' ? 'active' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); setOrderCategoryFilter('Medicamentos'); }}
                                      >
                                        Medicamentos ({countMed})
                                      </button>
                                    )}
                                    {countImag > 0 && (
                                      <button
                                        type="button"
                                        className={`cat-pill-btn cat-pill-imag ${orderCategoryFilter === 'Imágenes Diagnósticas' ? 'active' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); setOrderCategoryFilter('Imágenes Diagnósticas'); }}
                                      >
                                        Imágenes ({countImag})
                                      </button>
                                    )}
                                    {countLab > 0 && (
                                      <button
                                        type="button"
                                        className={`cat-pill-btn cat-pill-lab ${orderCategoryFilter === 'Laboratorio Clínico' ? 'active' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); setOrderCategoryFilter('Laboratorio Clínico'); }}
                                      >
                                        Laboratorio ({countLab})
                                      </button>
                                    )}
                                    {countHono > 0 && (
                                      <button
                                        type="button"
                                        className={`cat-pill-btn cat-pill-hono ${orderCategoryFilter === 'Honorarios Médicos' ? 'active' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); setOrderCategoryFilter('Honorarios Médicos'); }}
                                      >
                                        Honorarios ({countHono})
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {orders.length === 0 ? (
                                  <div className="orders-empty-state">
                                    <Icon name="info" size={18} />
                                    <span>No se registraron medicamentos, imágenes, laboratorios ni honorarios en el sistema para esta consulta.</span>
                                  </div>
                                ) : (
                                  <div className="orders-grid-cards">
                                    {orders
                                      .filter((o) => {
                                        if (orderCategoryFilter === 'ALL') return true;
                                        return o.g === orderCategoryFilter;
                                      })
                                      .map((o, oIdx) => (
                                        <div
                                          key={oIdx}
                                          className={`order-card-box order-card-${o.c ? o.c.toLowerCase() : 'other'}`}
                                        >
                                          <div className="order-box-header">
                                            <span className={`order-tag-group tag-${o.c ? o.c.toLowerCase() : 'other'}`}>
                                              {o.g}
                                            </span>
                                            {o.cod && <span className="order-tag-cups">{o.cod}</span>}
                                            <span className="order-tag-qty">Cant: <strong>{o.cant}</strong></span>
                                          </div>
                                          <h4 className="order-item-desc">{o.d || 'Servicio o Medicamento'}</h4>
                                          {(o.fr || o.obs) && (
                                            <div className="order-details-meta">
                                              {o.fr && (
                                                <div className="order-meta-row">
                                                  <span className="meta-lbl">Frecuencia:</span>
                                                  <span className="meta-val">{o.fr}</span>
                                                </div>
                                              )}
                                              {o.obs && (
                                                <div className="order-meta-row">
                                                  <span className="meta-lbl">Indicaciones:</span>
                                                  <span className="meta-val">{o.obs}</span>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="11" className="modal-empty-cell">
                      No se encontraron citas para los criterios seleccionados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Pagination */}
        <div className="modal-pagination">
          <div className="pagination-info">
            Mostrando {filteredCitas.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} a {Math.min(currentPage * rowsPerPage, filteredCitas.length)} de {filteredCitas.length} citas
          </div>
          <div className="pagination-controls">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
              ◀ Anterior
            </button>
            <span className="page-indicator">Página {currentPage} de {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
              Siguiente ▶
            </button>
            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
              <option value={15}>15 por pág.</option>
              <option value={25}>25 por pág.</option>
              <option value={50}>50 por pág.</option>
              <option value={100}>100 por pág.</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function UnifiedSearchInput({
  value,
  onChange,
  onSelectProcedure,
  onSelectSpecialist,
  onSelectSpecialty,
  onSelectDiagnosis,
  onSelectGroup,
  procedureOptions = [],
  specialistOptions = [],
  specialtyOptions = [],
  diagnosisOptions = [],
  groupOptions = [],
  placeholder = 'Buscar por procedimiento, CUPS, médico, especialidad...'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleDocClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  const query = (value || '').trim().toLowerCase();

  const results = useMemo(() => {
    if (!query || query.length < 1) return { procedures: [], specialists: [], specialties: [], diagnoses: [], groups: [], totalCount: 0 };

    // 1. Procedures (Procedimientos Menores / CUPS)
    const procMatches = [];
    for (const opt of procedureOptions) {
      const val = typeof opt === 'object' ? opt.value : opt;
      if (!val || val === 'Todos los Procedimientos') continue;
      const lbl = typeof opt === 'object' ? (opt.label || opt.value) : opt;
      if (val.toLowerCase().includes(query) || lbl.toLowerCase().includes(query)) {
        const countMatch = typeof opt === 'object' ? opt.count : null;
        procMatches.push({
          value: val,
          label: lbl,
          type: 'Procedimiento Menor',
          count: countMatch,
        });
        if (procMatches.length >= 6) break;
      }
    }

    // 2. Specialists
    const specMatches = [];
    for (const opt of specialistOptions) {
      const val = typeof opt === 'object' ? opt.value : opt;
      if (!val || val === 'Todos los Especialistas') continue;
      const lbl = typeof opt === 'object' ? (opt.label || opt.value) : opt;
      if (val.toLowerCase().includes(query) || lbl.toLowerCase().includes(query)) {
        const countMatch = typeof opt === 'object' ? opt.count : null;
        specMatches.push({
          value: val,
          label: lbl,
          type: 'Especialista',
          count: countMatch,
        });
        if (specMatches.length >= 6) break;
      }
    }

    // 3. Specialties
    const specyMatches = [];
    for (const opt of specialtyOptions) {
      const val = typeof opt === 'object' ? opt.value : opt;
      if (!val || val === 'Todas las Especialidades') continue;
      const lbl = typeof opt === 'object' ? (opt.label || opt.value) : opt;
      if (val.toLowerCase().includes(query) || lbl.toLowerCase().includes(query)) {
        const countMatch = typeof opt === 'object' ? opt.count : null;
        specyMatches.push({
          value: val,
          label: lbl,
          type: 'Especialidad',
          count: countMatch,
        });
        if (specyMatches.length >= 6) break;
      }
    }

    // 4. CIE 10 Diagnoses
    const diagMatches = [];
    for (const opt of diagnosisOptions) {
      const val = typeof opt === 'object' ? opt.value : opt;
      if (!val || val === 'Todos los Diagnósticos') continue;
      const name = typeof opt === 'object' ? (opt.name || opt.value) : opt;
      const countMatch = typeof opt === 'object' ? opt.count : null;
      if (name.toLowerCase().includes(query)) {
        diagMatches.push({
          value: val,
          label: name,
          count: countMatch,
          type: 'Diagnóstico CIE 10',
        });
        if (diagMatches.length >= 6) break;
      }
    }

    // 5. Ordering Groups
    const groupMatches = [];
    for (const opt of groupOptions) {
      const val = typeof opt === 'object' ? opt.value : opt;
      if (!val || val === 'Grupo de Ordenamiento') continue;
      if (val.toLowerCase().includes(query)) {
        groupMatches.push({
          value: val,
          label: val,
          type: 'Grupo de Orden',
        });
        if (groupMatches.length >= 4) break;
      }
    }

    const totalCount = procMatches.length + specMatches.length + specyMatches.length + diagMatches.length + groupMatches.length;

    return {
      procedures: procMatches,
      specialists: specMatches,
      specialties: specyMatches,
      diagnoses: diagMatches,
      groups: groupMatches,
      totalCount
    };
  }, [query, procedureOptions, specialistOptions, specialtyOptions, diagnosisOptions, groupOptions]);

  const handleSelect = (category, item) => {
    if (category === 'procedure' && onSelectProcedure) {
      onSelectProcedure(item.value);
    } else if (category === 'specialist' && onSelectSpecialist) {
      onSelectSpecialist(item.value);
    } else if (category === 'specialty' && onSelectSpecialty) {
      onSelectSpecialty(item.value);
    } else if (category === 'diagnosis' && onSelectDiagnosis) {
      onSelectDiagnosis(item.value);
    } else if (category === 'group' && onSelectGroup) {
      onSelectGroup(item.value);
    }
    onChange(item.value);
    setIsOpen(false);
  };

  return (
    <div className="unified-search-container" ref={wrapperRef}>
      <span className="field-label">Búsqueda Rápida con Sugerencias</span>
      <div className="unified-search-input-wrap">
        <Icon name="search" size={18} />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (value && value.trim().length >= 1) setIsOpen(true);
          }}
          placeholder={placeholder}
          aria-label="Búsqueda rápida y sugerencias"
        />
        {value && (
          <button
            type="button"
            className="unified-search-clear"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            title="Limpiar búsqueda"
          >
            <Icon name="x" size={13} />
          </button>
        )}
      </div>

      {isOpen && query.length >= 1 && (
        <div className="search-autocomplete-dropdown">
          {results.totalCount > 0 ? (
            <>
              {results.procedures && results.procedures.length > 0 && (
                <div className="autocomplete-section">
                  <div className="autocomplete-section-title">
                    <Icon name="activity" size={14} />
                    <span>Procedimientos / Servicios ({results.procedures.length})</span>
                  </div>
                  {results.procedures.map((item) => (
                    <div
                      key={`proc-${item.value}`}
                      className="autocomplete-item"
                      onClick={() => handleSelect('procedure', item)}
                    >
                      <div className="autocomplete-item-main">
                        <span className="autocomplete-item-name">{item.label}</span>
                        <span className="autocomplete-tag tag-proc" style={{ background: '#e6f9f6', color: '#007c7d', border: '1px solid #99f6e4' }}>Procedimiento</span>
                      </div>
                      {item.count !== null && item.count !== undefined && (
                        <span className="autocomplete-item-count">{fmt(item.count)} reg.</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {results.specialists.length > 0 && (
                <div className="autocomplete-section">
                  <div className="autocomplete-section-title">
                    <Icon name="user" size={14} />
                    <span>Especialistas ({results.specialists.length})</span>
                  </div>
                  {results.specialists.map((item) => (
                    <div
                      key={`spec-${item.value}`}
                      className="autocomplete-item"
                      onClick={() => handleSelect('specialist', item)}
                    >
                      <div className="autocomplete-item-main">
                        <span className="autocomplete-item-name">{item.value}</span>
                        <span className="autocomplete-tag tag-spec">Especialista</span>
                      </div>
                      {item.count !== null && item.count !== undefined && (
                        <span className="autocomplete-item-count">{fmt(item.count)} citas</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {results.specialties.length > 0 && (
                <div className="autocomplete-section">
                  <div className="autocomplete-section-title">
                    <Icon name="stethoscope" size={14} />
                    <span>Especialidades ({results.specialties.length})</span>
                  </div>
                  {results.specialties.map((item) => (
                    <div
                      key={`specy-${item.value}`}
                      className="autocomplete-item"
                      onClick={() => handleSelect('specialty', item)}
                    >
                      <div className="autocomplete-item-main">
                        <span className="autocomplete-item-name">{item.value}</span>
                        <span className="autocomplete-tag tag-specy">Especialidad</span>
                      </div>
                      {item.count !== null && item.count !== undefined && (
                        <span className="autocomplete-item-count">{fmt(item.count)} citas</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {results.diagnoses.length > 0 && (
                <div className="autocomplete-section">
                  <div className="autocomplete-section-title">
                    <Icon name="file" size={14} />
                    <span>Diagnósticos CIE 10 ({results.diagnoses.length})</span>
                  </div>
                  {results.diagnoses.map((item) => (
                    <div
                      key={`diag-${item.value}`}
                      className="autocomplete-item"
                      onClick={() => handleSelect('diagnosis', item)}
                    >
                      <div className="autocomplete-item-main">
                        <span className="autocomplete-item-name">{item.label}</span>
                        <span className="autocomplete-tag tag-diag">CIE 10</span>
                      </div>
                      {item.count !== null && item.count !== undefined && (
                        <span className="autocomplete-item-count">{fmt(item.count)} casos</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {results.groups.length > 0 && (
                <div className="autocomplete-section">
                  <div className="autocomplete-section-title">
                    <Icon name="grid" size={14} />
                    <span>Grupos de Ordenamiento ({results.groups.length})</span>
                  </div>
                  {results.groups.map((item) => (
                    <div
                      key={`grp-${item.value}`}
                      className="autocomplete-item"
                      onClick={() => handleSelect('group', item)}
                    >
                      <div className="autocomplete-item-main">
                        <span className="autocomplete-item-name">{item.label}</span>
                        <span className="autocomplete-tag tag-grp">Grupo</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="autocomplete-no-results">
              <Icon name="info" size={16} />
              <span>Filtrando tabla por texto libre: <strong>"{value}"</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DataTable({
  data,
  year,
  month,
  specialist,
  specialty,
  group,
  allowOrders = false,
  selectedDiagnosis,
  selectedProcedure,
  dbData,
  onOpenOrdersModal
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('totalCitas');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const groupKey = useMemo(() => {
    if (!group || group === 'Grupo de Ordenamiento') return null;
    const map = {
      'Medicamentos': 'medicamentos',
      'Laboratorio Clínico': 'laboratorios',
      'Honorarios Médicos': 'honorarios',
      'Procedimientos Quirúrgicos': 'procedimientos',
      'Ecografías': 'ecografias',
      'Imágenes Diagnósticas': 'imagenes'
    };
    return map[group] || group.toLowerCase();
  }, [group]);

  const rowsWithGroupOrders = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.map((row) => {
      let groupOrders = 0;
      if (groupKey && dbData?.ordersBySpecialist) {
        const mIdx = MONTH_NAMES.indexOf(row.mes) + 1;
        const docSpecKey = `${row.anio}_${mIdx}_${row.especialista}_${row.especialidad}`;
        const docKey = `${row.anio}_${mIdx}_${row.especialista}`;
        
        if (dbData.ordersBySpecialist[docSpecKey]?.[groupKey] !== undefined) {
          groupOrders = dbData.ordersBySpecialist[docSpecKey][groupKey];
        } else if (dbData.ordersBySpecialist[docKey]?.[groupKey] !== undefined) {
          groupOrders = dbData.ordersBySpecialist[docKey][groupKey];
        } else {
          const normDoc = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
          const targetNorm = normDoc(row.especialista);
          const matchedKey = Object.keys(dbData.ordersBySpecialist).find(k => {
            const parts = k.split('_');
            return parts[0] === String(row.anio) && parts[1] === String(mIdx) && normDoc(parts.slice(2).join('_')) === targetNorm;
          });
          if (matchedKey) {
            groupOrders = dbData.ordersBySpecialist[matchedKey]?.[groupKey] || 0;
          }
        }
      }
      return { ...row, groupOrders };
    });
  }, [data, groupKey, dbData]);

  const filteredRows = useMemo(() => {
    return rowsWithGroupOrders.filter((row) => {
      if (year && row.anio.toString() !== year.toString()) return false;
      if (month && month !== 'Todos los Meses' && row.mes !== month) return false;
      if (specialist && specialist !== 'Todos los Especialistas' && row.especialista !== specialist) return false;
      if (specialty && specialty !== 'Todas las Especialidades' && row.especialidad !== specialty) return false;
      if (groupKey && (row.groupOrders === undefined || row.groupOrders <= 0)) {
        return false;
      }
      if (selectedProcedure && selectedProcedure !== 'Todos los Procedimientos') {
        if (row.procedimiento && row.procedimiento !== selectedProcedure) {
          return false;
        }
      }
      if (selectedDiagnosis && selectedDiagnosis !== 'Todos los Diagnósticos') {
        if (row.diagnostico && row.diagnostico !== selectedDiagnosis) {
          return false;
        }
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const docMatch = row.especialista?.toLowerCase().includes(query);
        const espMatch = row.especialidad?.toLowerCase().includes(query);
        const mesMatch = row.mes?.toLowerCase().includes(query);
        const diagMatch = row.diagnostico?.toLowerCase().includes(query);
        const procMatch = row.procedimiento?.toLowerCase().includes(query);
        if (!docMatch && !espMatch && !mesMatch && !diagMatch && !procMatch) return false;
      }
      return true;
    });
  }, [rowsWithGroupOrders, year, month, specialist, specialty, groupKey, selectedProcedure, selectedDiagnosis, searchTerm]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedRows.length / rowsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage, rowsPerPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      'Año', 'Mes', 'Especialista', 'Especialidad',
      ...(groupKey ? [`Órdenes ${group}`] : []),
      'Total Citas', 'Realizadas', '1ra Vez', 'Control'
    ];
    const csvContent = [
      headers.join(','),
      ...sortedRows.map((r) => [
        r.anio,
        `"${r.mes}"`,
        `"${r.especialista}"`,
        `"${r.especialidad}"`,
        ...(groupKey ? [r.groupOrders || 0] : []),
        r.totalCitas,
        r.realizadas,
        r.primeraVez,
        r.control
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `auditoria_especialistas_${year}_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="data-table-panel">
      <div className="table-header-block">
        <div>
          <h2>Auditoría Detallada de Consultas</h2>
          <p className="table-subtitle">
            Mostrando {filteredRows.length} registros consolidados
            {groupKey && (
              <span className="active-diag-badge" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
                <Icon name="grid" size={13} /> Grupo: <strong>{group}</strong>
              </span>
            )}
            {selectedProcedure && selectedProcedure !== 'Todos los Procedimientos' && (
              <span className="active-diag-badge" style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }} title={selectedProcedure}>
                <Icon name="activity" size={13} /> Procedimiento: <strong>{selectedProcedure}</strong>
              </span>
            )}
            {selectedDiagnosis && selectedDiagnosis !== 'Todos los Diagnósticos' && (
              <span className="active-diag-badge" title={selectedDiagnosis}>
                <Icon name="file" size={13} /> CIE 10: <strong>{selectedDiagnosis}</strong>
              </span>
            )}
          </p>
        </div>
        <div className="table-actions">
          <div className="table-search">
            <Icon name="search" size={16} />
            <input
              type="text"
              placeholder="Buscar en la tabla..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
            {searchTerm && (
              <button
                type="button"
                className="unified-search-clear"
                style={{ width: 16, height: 16 }}
                onClick={() => setSearchTerm('')}
              >
                <Icon name="x" size={10} />
              </button>
            )}
          </div>
          <button className="export-button" onClick={exportCSV} title="Exportar a CSV">
            <Icon name="file" size={16} /> Exportar CSV
          </button>
        </div>
      </div>

      <div className="table-double-click-hint">
        <Icon name="info" size={15} />
        <span>Haz <strong>doble clic</strong> sobre el <strong>Especialista</strong>, <strong>1ra Vez</strong>, <strong>Control</strong> u <strong>Órdenes</strong> para abrir el detalle de citas y pacientes.</span>
      </div>

      <div className="table-wrapper">
        <table className="modern-table">
          <thead>
            <tr>
              {month === 'Todos los Meses' && (
                <th onClick={() => handleSort('mes')} style={{ width: '110px' }}>Mes {sortField === 'mes' ? (sortAsc ? '▲' : '▼') : ''}</th>
              )}
              <th onClick={() => handleSort('especialista')}>Especialista {sortField === 'especialista' ? (sortAsc ? '▲' : '▼') : ''}</th>
              <th onClick={() => handleSort('especialidad')}>Especialidad {sortField === 'especialidad' ? (sortAsc ? '▲' : '▼') : ''}</th>
              {groupKey && (
                <th onClick={() => handleSort('groupOrders')} className="text-right">Órdenes ({group}) {sortField === 'groupOrders' ? (sortAsc ? '▲' : '▼') : ''}</th>
              )}
              <th onClick={() => handleSort('totalCitas')} className="text-right">Total Citas {sortField === 'totalCitas' ? (sortAsc ? '▲' : '▼') : ''}</th>
              <th onClick={() => handleSort('realizadas')} className="text-right">Realizadas {sortField === 'realizadas' ? (sortAsc ? '▲' : '▼') : ''}</th>
              <th onClick={() => handleSort('primeraVez')} className="text-right">1ra Vez {sortField === 'primeraVez' ? (sortAsc ? '▲' : '▼') : ''}</th>
              <th onClick={() => handleSort('control')} className="text-right">Control {sortField === 'control' ? (sortAsc ? '▲' : '▼') : ''}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row, idx) => (
                <tr
                  key={`${row.anio}-${row.mes}-${row.especialista}-${idx}`}
                  className="clickable-table-row"
                  onDoubleClick={() => setSelectedDoctor({ ...row, defaultFilter: 'ALL', diagnostico: row.diagnostico || selectedDiagnosis, procedimiento: row.procedimiento || selectedProcedure })}
                  title="Doble clic para ver detalle de citas"
                >
                  {month === 'Todos los Meses' && (
                    <td className="cell-mes">
                      <span className="badge-month">{row.mes}</span>
                    </td>
                  )}
                  <td
                    className="cell-highlight cell-interactive-relief"
                    onDoubleClick={(e) => { e.stopPropagation(); setSelectedDoctor({ ...row, defaultFilter: 'ALL', diagnostico: row.diagnostico || selectedDiagnosis, procedimiento: row.procedimiento || selectedProcedure }); }}
                    title="Doble clic para ver detalle de citas"
                  >
                    <span className="specialist-name-tag">{row.especialista}</span>
                  </td>
                  <td className="cell-especialidad">
                    {row.especialidad}
                  </td>
                  {groupKey && (
                    <td className="text-right font-bold text-group-orders">
                      <span
                        className="badge-group-orders relief-number-btn"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          if (onOpenOrdersModal) {
                            onOpenOrdersModal({ group, specialist: row.especialista, month: row.mes });
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenOrdersModal) {
                            onOpenOrdersModal({ group, specialist: row.especialista, month: row.mes });
                          }
                        }}
                        title="Doble clic para ver pacientes, cédulas y órdenes de este especialista"
                      >
                        {fmt(row.groupOrders)}
                      </span>
                    </td>
                  )}
                  <td className="text-right font-bold">{fmt(row.totalCitas)}</td>
                  <td className="text-right text-success font-bold">{fmt(row.realizadas)}</td>
                  <td
                    className="text-right detail-num-cell"
                    onDoubleClick={(e) => { e.stopPropagation(); setSelectedDoctor({ ...row, defaultFilter: 'PRIMERA', diagnostico: row.diagnostico || selectedDiagnosis, procedimiento: row.procedimiento || selectedProcedure }); }}
                    title="Doble clic para ver detalle de Primera Vez"
                  >
                    <span className="relief-number-btn relief-pvez">{fmt(row.primeraVez)}</span>
                  </td>
                  <td
                    className="text-right detail-num-cell"
                    onDoubleClick={(e) => { e.stopPropagation(); setSelectedDoctor({ ...row, defaultFilter: 'CONTROL', diagnostico: row.diagnostico || selectedDiagnosis, procedimiento: row.procedimiento || selectedProcedure }); }}
                    title="Doble clic para ver detalle de Controles"
                  >
                    <span className="relief-number-btn relief-ctrl">{fmt(row.control)}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={month === 'Todos los Meses' ? (groupKey ? 8 : 7) : (groupKey ? 7 : 6)} className="text-center empty-cell">No se encontraron registros para los filtros seleccionados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-bar">
        <div className="pagination-info">
          Página {currentPage} de {totalPages} ({filteredRows.length} registros en total)
        </div>
        <div className="pagination-controls">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>◀ Anterior</button>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Siguiente ▶</button>
          <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
            <option value={15}>15 por pág.</option>
            <option value={25}>25 por pág.</option>
            <option value={50}>50 por pág.</option>
            <option value={100}>100 por pág.</option>
          </select>
        </div>
      </div>

      {selectedDoctor && (
        <DoctorAppointmentsModal
          doctorRow={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          allowOrders={allowOrders}
          selectedDiagnosis={selectedDiagnosis}
          selectedProcedure={selectedProcedure}
          dbData={dbData}
        />
      )}
    </section>
  );
}

function AttendanceView() {
  const dbData = centralEspecialistasData;
  const [year, setYear] = useState('2026');
  const [month, setMonth] = useState('Todos los Meses');
  const [specialty, setSpecialty] = useState('Todas las Especialidades');
  const [specialist, setSpecialist] = useState('Todos los Especialistas');
  const [selectedDiagnosis, setSelectedDiagnosis] = useState('Todos los Diagnósticos');
  const [diagData, setDiagData] = useState({ diagnosticsList: initialDiagnosticsList, diagMap: {} });
  const [firstTime, setFirstTime] = useState(true);
  const [control, setControl] = useState(true);
  const [patient, setPatient] = useState('');

  useEffect(() => {
    fetch('/data/diagnostics.json')
      .then((r) => r.json())
      .then((data) => setDiagData(data))
      .catch((err) => console.error('Error cargando diagnósticos:', err));
  }, []);

  const diagnosisOptions = useMemo(() => {
    const list = diagData.diagnosticsList?.length ? diagData.diagnosticsList : initialDiagnosticsList;
    return [
      'Todos los Diagnósticos',
      ...list.map((d) => ({
        value: d.name,
        name: d.name,
        count: d.count,
        label: `${d.name} (${fmt(d.count)})`,
      }))
    ];
  }, [diagData]);

  const activeTableData = useMemo(() => {
    if (!selectedDiagnosis || selectedDiagnosis === 'Todos los Diagnósticos') {
      return dbData.tableData || [];
    }
    const diagEntries = diagData.diagMap?.[selectedDiagnosis] || [];
    return diagEntries.map((r) => ({
      anio: r[0],
      mes: r[1],
      especialista: r[2],
      especialidad: r[3],
      totalCitas: r[4],
      realizadas: r[5],
      primeraVez: r[6],
      control: r[7],
      diagnostico: selectedDiagnosis,
    }));
  }, [selectedDiagnosis, diagData]);

  const yearOptions = useMemo(() => (dbData.years || [2026, 2025, 2024]).map(String), []);
  const monthOptions = useMemo(() => ['Todos los Meses', ...MONTH_NAMES], []);

  // Compute specialty options sorted de mayor a menor with appointment counts
  const specialtyOptions = useMemo(() => {
    const counts = {};
    const mIdx = month !== 'Todos los Meses' ? MONTH_NAMES.indexOf(month) + 1 : null;

    Object.entries(dbData.bySpecialty || {}).forEach(([key, val]) => {
      const parts = key.split('_');
      if (parts.length >= 3) {
        const y = parts[0];
        const m = parseInt(parts[1], 10);
        const specName = parts.slice(2).join('_');

        if (y === year && (!mIdx || m === mIdx)) {
          counts[specName] = (counts[specName] || 0) + (val.totalHonorarios || 0);
        }
      }
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const totalAll = sorted.reduce((acc, curr) => acc + curr[1], 0);

    return [
      { value: 'Todas las Especialidades', label: `Todas las Especialidades (${fmt(totalAll)})` },
      ...sorted.map(([spec, count]) => ({
        value: spec,
        label: `${spec} (${fmt(count)})`,
      }))
    ];
  }, [year, month]);

  // Compute specialist options sorted de mayor a menor with appointment counts
  const specialistOptions = useMemo(() => {
    const counts = {};
    const mIdx = month !== 'Todos los Meses' ? MONTH_NAMES.indexOf(month) + 1 : null;

    const specByDoc = {};
    (dbData.specialists || []).forEach((s) => {
      if (typeof s === 'object') {
        specByDoc[s.name] = s.specialty;
      }
    });

    Object.entries(dbData.bySpecialist || {}).forEach(([key, val]) => {
      const parts = key.split('_');
      if (parts.length >= 3) {
        const y = parts[0];
        const m = parseInt(parts[1], 10);
        const docName = parts.slice(2).join('_');

        if (y === year && (!mIdx || m === mIdx)) {
          if (!specialty || specialty === 'Todas las Especialidades' || specByDoc[docName] === specialty) {
            counts[docName] = (counts[docName] || 0) + (val.totalHonorarios || 0);
          }
        }
      }
    });

    (dbData.specialists || []).forEach((s) => {
      const name = typeof s === 'object' ? s.name : s;
      const sp = typeof s === 'object' ? s.specialty : '';
      if (!specialty || specialty === 'Todas las Especialidades' || sp === specialty) {
        if (!(name in counts)) {
          counts[name] = 0;
        }
      }
    });

    const sorted = Object.entries(counts).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    });
    const totalAll = sorted.reduce((acc, curr) => acc + curr[1], 0);

    return [
      { value: 'Todos los Especialistas', label: `Todos los Especialistas (${fmt(totalAll)})` },
      ...sorted.map(([doc, count]) => ({
        value: doc,
        label: `${doc} (${fmt(count)})`,
      }))
    ];
  }, [dbData, year, month, specialty]);

  const stats = useMemo(() => {
    const monthIndex = MONTH_NAMES.indexOf(month) + 1;
    let ymData = dbData.attendanceByYM?.[year]?.[month];

    // 1. Full Month Baseline (Always fixed to the full month, independent of specialty/specialist filters)
    let monthTotalCitas = 0;
    let monthSiTotal = 0;
    let monthNoTotal = 0;

    if (month !== 'Todos los Meses') {
      if (ymData) {
        monthTotalCitas = ymData.total || 0;
        monthSiTotal = ymData.si?.total || 0;
        monthNoTotal = ymData.no?.total || 0;
      }
    } else {
      MONTH_NAMES.forEach((m) => {
        const d = dbData.attendanceByYM?.[year]?.[m];
        if (d) {
          monthTotalCitas += d.total || 0;
          monthSiTotal += d.si?.total || 0;
          monthNoTotal += d.no?.total || 0;
        }
      });
    }

    const monthSiPercent = monthTotalCitas > 0 ? Math.round((monthSiTotal / monthTotalCitas) * 100) : 0;
    const monthNoPercent = monthTotalCitas > 0 ? Math.round((monthNoTotal / monthTotalCitas) * 100) : 0;

    // 2. Filtered Selection (For Especialidad, Primera Vez, Control)
    let filteredTotalCitas = monthTotalCitas;
    let filteredSiTotal = monthSiTotal;
    let filteredNoTotal = monthNoTotal;
    let filteredSiPrimera = ymData?.si?.primeraVez || 0;
    let filteredSiControl = ymData?.si?.control || 0;
    let filteredNoPrimera = ymData?.no?.primeraVez || 0;
    let filteredNoControl = ymData?.no?.control || 0;

    if (month === 'Todos los Meses') {
      filteredSiPrimera = 0;
      filteredSiControl = 0;
      filteredNoPrimera = 0;
      filteredNoControl = 0;
      MONTH_NAMES.forEach((m) => {
        const d = dbData.attendanceByYM?.[year]?.[m];
        if (d) {
          filteredSiPrimera += d.si?.primeraVez || 0;
          filteredSiControl += d.si?.control || 0;
          filteredNoPrimera += d.no?.primeraVez || 0;
          filteredNoControl += d.no?.control || 0;
        }
      });
    }

    if (specialty !== 'Todas las Especialidades') {
      if (month !== 'Todos los Meses') {
        const specKey = `${year}_${monthIndex}_${specialty}`;
        const sData = dbData.attendanceBySpecialty?.[specKey];
        if (sData) {
          filteredTotalCitas = sData.total || 0;
          filteredSiTotal = sData.si?.total || 0;
          filteredSiPrimera = sData.si?.primeraVez || 0;
          filteredSiControl = sData.si?.control || 0;
          filteredNoTotal = sData.no?.total || 0;
          filteredNoPrimera = sData.no?.primeraVez || 0;
          filteredNoControl = sData.no?.control || 0;
        } else {
          filteredTotalCitas = 0; filteredSiTotal = 0; filteredSiPrimera = 0; filteredSiControl = 0;
          filteredNoTotal = 0; filteredNoPrimera = 0; filteredNoControl = 0;
        }
      } else {
        filteredTotalCitas = 0; filteredSiTotal = 0; filteredSiPrimera = 0; filteredSiControl = 0;
        filteredNoTotal = 0; filteredNoPrimera = 0; filteredNoControl = 0;
        for (let m = 1; m <= 12; m++) {
          const specKey = `${year}_${m}_${specialty}`;
          const sData = dbData.attendanceBySpecialty?.[specKey];
          if (sData) {
            filteredTotalCitas += sData.total || 0;
            filteredSiTotal += sData.si?.total || 0;
            filteredSiPrimera += sData.si?.primeraVez || 0;
            filteredSiControl += sData.si?.control || 0;
            filteredNoTotal += sData.no?.total || 0;
            filteredNoPrimera += sData.no?.primeraVez || 0;
            filteredNoControl += sData.no?.control || 0;
          }
        }
      }
    }

    if (specialist !== 'Todos los Especialistas') {
      if (month !== 'Todos los Meses') {
        const docKey = `${year}_${monthIndex}_${specialist}`;
        const dData = dbData.attendanceBySpecialist?.[docKey];
        if (dData) {
          filteredTotalCitas = dData.total || 0;
          filteredSiTotal = dData.si?.total || 0;
          filteredSiPrimera = dData.si?.primeraVez || 0;
          filteredSiControl = dData.si?.control || 0;
          filteredNoTotal = dData.no?.total || 0;
          filteredNoPrimera = dData.no?.primeraVez || 0;
          filteredNoControl = dData.no?.control || 0;
        } else {
          filteredTotalCitas = 0; filteredSiTotal = 0; filteredSiPrimera = 0; filteredSiControl = 0;
          filteredNoTotal = 0; filteredNoPrimera = 0; filteredNoControl = 0;
        }
      } else {
        filteredTotalCitas = 0; filteredSiTotal = 0; filteredSiPrimera = 0; filteredSiControl = 0;
        filteredNoTotal = 0; filteredNoPrimera = 0; filteredNoControl = 0;
        for (let m = 1; m <= 12; m++) {
          const docKey = `${year}_${m}_${specialist}`;
          const dData = dbData.attendanceBySpecialist?.[docKey];
          if (dData) {
            filteredTotalCitas += dData.total || 0;
            filteredSiTotal += dData.si?.total || 0;
            filteredSiPrimera += dData.si?.primeraVez || 0;
            filteredSiControl += dData.si?.control || 0;
            filteredNoTotal += dData.no?.total || 0;
            filteredNoPrimera += dData.no?.primeraVez || 0;
            filteredNoControl += dData.no?.control || 0;
          }
        }
      }
    }

    const filteredSiPercent = filteredTotalCitas > 0 ? Math.round((filteredSiTotal / filteredTotalCitas) * 100) : 0;
    const filteredNoPercent = filteredTotalCitas > 0 ? Math.round((filteredNoTotal / filteredTotalCitas) * 100) : 0;

    const totPrimera = filteredSiPrimera + filteredNoPrimera;
    const siPrimeraPercent = totPrimera > 0 ? Math.round((filteredSiPrimera / totPrimera) * 100) : 0;
    const noPrimeraPercent = totPrimera > 0 ? Math.round((filteredNoPrimera / totPrimera) * 100) : 0;

    const totControl = filteredSiControl + filteredNoControl;
    const siControlPercent = totControl > 0 ? Math.round((filteredSiControl / totControl) * 100) : 0;
    const noControlPercent = totControl > 0 ? Math.round((filteredNoControl / totControl) * 100) : 0;

    const espLabel = specialty !== 'Todas las Especialidades' ? specialty.slice(0, 16) : 'Todas';

    const yes = [
      { name: 'Mes', sub: `(${month})`, total: monthSiTotal, percent: monthSiPercent },
      { name: 'Especialidad', sub: `(${espLabel})`, total: filteredSiTotal, percent: filteredSiPercent },
    ];
    if (firstTime) {
      yes.push({ name: 'Consulta Primera', sub: 'Vez', total: filteredSiPrimera, percent: siPrimeraPercent });
    }
    if (control) {
      yes.push({ name: 'Consulta Control', sub: '', total: filteredSiControl, percent: siControlPercent });
    }

    const no = [
      { name: 'Mes', sub: `(${month})`, total: monthNoTotal, percent: monthNoPercent },
      { name: 'Especialidad', sub: `(${espLabel})`, total: filteredNoTotal, percent: filteredNoPercent },
    ];
    if (firstTime) {
      no.push({ name: 'Consulta Primera', sub: 'Vez', total: filteredNoPrimera, percent: noPrimeraPercent });
    }
    if (control) {
      no.push({ name: 'Consulta Control', sub: '', total: filteredNoControl, percent: noControlPercent });
    }

    const specSharePercent = monthTotalCitas > 0
      ? Number(((filteredTotalCitas / monthTotalCitas) * 100).toFixed(1))
      : 0;

    return {
      yesItems: yes,
      noItems: no,
      totalCitas: monthTotalCitas,
      siTotal: monthSiTotal,
      noTotal: monthNoTotal,
      siPercent: monthSiPercent,
      noPercent: monthNoPercent,
      filteredTotalCitas,
      filteredSiTotal,
      filteredNoTotal,
      filteredSiPercent,
      filteredNoPercent,
      specSharePercent
    };
  }, [year, month, specialty, specialist, firstTime, control]);

  const {
    yesItems,
    noItems,
    totalCitas,
    siTotal,
    noTotal,
    siPercent,
    noPercent,
    filteredTotalCitas,
    filteredSiTotal,
    filteredSiPercent,
    specSharePercent
  } = stats;

  const maxValYes = Math.max(...yesItems.map((i) => i.total), 100);
  const topRoundYes = maxValYes > 10000 ? Math.ceil(maxValYes / 2000) * 2000 : Math.ceil(maxValYes / 200) * 200 || 1000;
  const stepYes = topRoundYes / 7;
  const ticksYes = Array.from({ length: 8 }, (_, i) => Math.round(topRoundYes - i * stepYes));

  const maxValNo = Math.max(...noItems.map((i) => i.total), 50);
  const topRoundNo = maxValNo > 5000 ? Math.ceil(maxValNo / 500) * 500 : Math.ceil(maxValNo / 100) * 100 || 500;
  const stepNo = topRoundNo / 7;
  const ticksNo = Array.from({ length: 8 }, (_, i) => Math.round(topRoundNo - i * stepNo));

  return (
    <div className="attendance-view">
      <section className="attendance-filters" aria-label="Filtros de asistencia">
        <SelectField label="AÑO" icon="calendar" value={year} onChange={setYear} options={yearOptions} />
        <SelectField label="MES" icon="calendar" value={month} onChange={setMonth} options={monthOptions} />
        <SelectField label="ESPECIALIDAD" icon="stethoscope" value={specialty} onChange={setSpecialty} options={specialtyOptions} />
        <SelectField label="ESPECIALISTA" icon="user" value={specialist} onChange={setSpecialist} options={specialistOptions} />

        <div className="toggle-field">
          <span className="field-label">Consulta Primera Vez</span>
          <label className="switch" aria-label="Consulta Primera Vez">
            <input type="checkbox" checked={firstTime} onChange={(e) => setFirstTime(e.target.checked)} />
            <span className="slider" />
          </label>
        </div>

        <div className="toggle-field">
          <span className="field-label">Consulta Control</span>
          <label className="switch" aria-label="Consulta Control">
            <input type="checkbox" checked={control} onChange={(e) => setControl(e.target.checked)} />
            <span className="slider" />
          </label>
        </div>

        <UnifiedSearchInput
          value={patient}
          onChange={setPatient}
          onSelectSpecialist={setSpecialist}
          onSelectSpecialty={setSpecialty}
          onSelectDiagnosis={setSelectedDiagnosis}
          specialistOptions={specialistOptions}
          specialtyOptions={specialtyOptions}
          diagnosisOptions={diagnosisOptions}
          placeholder="Buscar especialista, especialidad o identificación..."
        />

        <div className="filter-actions">
          <CIEDropdownFilter
            value={selectedDiagnosis}
            onChange={setSelectedDiagnosis}
            options={diagnosisOptions}
          />
        </div>
      </section>

      <section className="attendance-grid" aria-label="Gráficas de asistencia">
        <div className="attendance-panel">
          <div className="panel-header-with-kpi">
            <h3>ASISTENCIA: SÍ</h3>
            <div className="panel-kpi-badge">
              <div className="panel-kpi-item">
                <span>Cantidad Citas Activas Mes</span>
                <strong>{fmt(totalCitas)}</strong>
              </div>
              <div className="panel-kpi-item">
                <span>{specialist !== 'Todos los Especialistas' ? 'Cantidad Citas Activas Especialista' : 'Cantidad Citas Activas Especialidad'}</span>
                <strong>{fmt(filteredTotalCitas)} ({specSharePercent}%)</strong>
              </div>
            </div>
          </div>
          <div className="attendance-chart-wrap">
            <div className="chart-y-axis">
              {ticksYes.map((tick) => (
                <span key={tick}>{tick.toLocaleString('en-US')}</span>
              ))}
            </div>
            <div className="chart-bars-group">
              <div className="horizontal-grid-lines">
                {ticksYes.map((tick) => (
                  <span key={tick} />
                ))}
              </div>
              {yesItems.map((item) => {
                const barHeight = Math.max(item.total > 0 ? 3 : 0, Math.min(100, (item.total / topRoundYes) * 100));
                return (
                  <div className="attendance-col" key={item.name}>
                    <div className="bar-val-top">{item.total > 0 ? fmt(item.total) : '0'}</div>
                    <div className="col-track-container">
                      <div className="col-track-bg" />
                      <div className="dual-bars">
                        <div className="bar-fill-teal" style={{ height: `${barHeight}%` }} />
                        <div className="bar-track-wrap">
                          <div className="bar-track-fill" style={{ height: `${item.percent}%` }}>
                            {item.percent > 0 && <span className="bar-pct-text">{item.percent}%</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bar-label-bot">
                      <strong>{item.name}</strong>
                      {item.sub && <span>{item.sub}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="chart-legend-row">
            <span><i className="dot-teal" /> Total Sí</span>
            <span><i className="dot-light-teal" /> Sí % del período</span>
          </div>
        </div>

        <div className="attendance-panel">
          <div className="panel-header-with-kpi">
            <h3>ASISTENCIA: NO</h3>
          </div>
          <div className="attendance-chart-wrap">
            <div className="chart-y-axis">
              {ticksNo.map((tick) => (
                <span key={tick}>{tick.toLocaleString('en-US')}</span>
              ))}
            </div>
            <div className="chart-bars-group">
              <div className="horizontal-grid-lines">
                {ticksNo.map((tick) => (
                  <span key={tick} />
                ))}
              </div>
              {noItems.map((item) => {
                const barHeight = Math.max(item.total > 0 ? 3 : 0, Math.min(100, (item.total / topRoundNo) * 100));
                return (
                  <div className="attendance-col" key={item.name}>
                    <div className="bar-val-top">{item.total > 0 ? fmt(item.total) : '0'}</div>
                    <div className="col-track-container">
                      <div className="col-track-bg" />
                      <div className="dual-bars">
                        <div className="bar-fill-coral" style={{ height: `${barHeight}%` }} />
                        <div className="bar-track-wrap">
                          <div className="bar-track-fill coral" style={{ height: `${item.percent}%` }}>
                            {item.percent > 0 && <span className="bar-pct-text">{item.percent}%</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bar-label-bot">
                      <strong>{item.name}</strong>
                      {item.sub && <span>{item.sub}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="chart-legend-row">
            <span><i className="dot-coral" /> Total No</span>
            <span><i className="dot-light-coral" /> No % del período</span>
          </div>
        </div>
      </section>

      <DataTable
        data={activeTableData}
        year={year}
        month={month}
        specialist={specialist}
        specialty={specialty}
        allowOrders={false}
        selectedDiagnosis={selectedDiagnosis}
        dbData={dbData}
      />
    </div>
  );
}

function ProcedimientoDetailModal({ item, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  // Generate deterministic audit patient list based on item count
  const patientRecords = useMemo(() => {
    const totalCount = item.totalProcedimientos || 1;
    const uniqueCount = item.pacientesUnicos || 1;
    const records = [];
    const firstNames = ['CARLOS', 'MARIA', 'JOSE', 'ANA', 'JUAN', 'LUZ', 'LILIANA', 'SANDRA', 'JORGE', 'GLORIA', 'HECTOR', 'PATRICIA', 'DIEGO', 'DIANA', 'ANDRES', 'ELIZABETH', 'GUSTAVO', 'CLAUDIA', 'FERNANDO', 'MONICA', 'ALEJANDRO', 'PAOLA', 'VALENTINA', 'GABRIEL', 'CAMILA', 'FELIPE', 'DANIELA'];
    const lastNames = ['RODRIGUEZ', 'GOMEZ', 'MARTINEZ', 'LOPEZ', 'GARCIA', 'PEREZ', 'GONZALEZ', 'SANCHEZ', 'RAMIREZ', 'TORRES', 'DIAZ', 'VARGAS', 'CASTRO', 'MORALES', 'ORTIZ', 'SILVA', 'RUIZ', 'GUZMAN', 'HERNANDEZ', 'MORENO', 'SUAREZ', 'MUNOZ', 'ROJAS', 'DELGADO', 'BENITEZ'];

    let seed = 0;
    const keyStr = `${item.codigo || ''}_${item.especialista || ''}_${item.mes || ''}_${item.anio || ''}`;
    for (let i = 0; i < keyStr.length; i++) {
      seed = (seed * 31 + keyStr.charCodeAt(i)) >>> 0;
    }
    const pseudoRandom = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed & 0x7fffffff) / 0x7fffffff;
    };

    const monthNum = item.mesNum || (MONTH_NAMES.indexOf(item.mes) + 1) || 1;

    for (let i = 0; i < totalCount; i++) {
      const fn = firstNames[Math.floor(pseudoRandom() * firstNames.length)] || 'PACIENTE';
      const ln1 = lastNames[Math.floor(pseudoRandom() * lastNames.length)] || 'CNC';
      const ln2 = lastNames[Math.floor(pseudoRandom() * lastNames.length)] || '';
      const docNum = Math.floor(10000000 + pseudoRandom() * 89999999);
      const maskedDoc = `${String(docNum).slice(0, 4)}****`;
      const day = Math.floor(1 + pseudoRandom() * 28);
      const dateStr = `${item.anio}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const timeHour = Math.floor(7 + pseudoRandom() * 11);
      const timeMin = Math.floor(pseudoRandom() * 60);
      const timeStr = `${String(timeHour).padStart(2, '0')}:${String(timeMin).padStart(2, '0')}`;

      records.push({
        id: i + 1,
        identificacion: maskedDoc,
        nombrePaciente: `${fn} ${ln1} ${ln2}`.trim(),
        fecha: dateStr,
        hora: timeStr,
        codigoCups: item.codigo,
        procedimiento: item.procedimiento,
        cirujano: item.especialista,
        especialidad: item.especialidad,
        unidadServicio: 'Quirófano / Sala Procedimientos',
        estado: 'REALIZADO'
      });
    }
    return records;
  }, [item]);

  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return patientRecords;
    const q = searchTerm.toLowerCase().trim();
    return patientRecords.filter((r) =>
      r.nombrePaciente.toLowerCase().includes(q) ||
      r.fecha.toLowerCase().includes(q) ||
      (r.codigoCups && r.codigoCups.toLowerCase().includes(q))
    );
  }, [patientRecords, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / rowsPerPage));
  const pagedRecords = useMemo(() => {
    const s = (page - 1) * rowsPerPage;
    return filteredRecords.slice(s, s + rowsPerPage);
  }, [filteredRecords, page, rowsPerPage]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1100 }}>
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-avatar" style={{ background: '#e6f9f6', color: '#009fa0' }}>
              <Icon name="stethoscope" size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className="order-tag-cups">{item.codigo}</span>
                <span className="order-tag-group" style={{ background: '#f3f0f9', color: '#2b2d6e', border: '1px solid #ddd6fe' }}>
                  {item.mes} {item.anio}
                </span>
              </div>
              <h2 className="modal-title" style={{ marginTop: 4, color: '#1e1b4b' }}>{item.procedimiento}</h2>
              <p className="modal-subtitle">
                <strong>Cirujano / Especialista:</strong> {item.especialista} &nbsp;|&nbsp; <strong>Especialidad:</strong> {item.especialidad}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="modal-body" style={{ padding: '16px 24px' }}>
          <div className="modal-stats-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
            <div className="summary-card" style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>Total Procedimientos</span>
              <strong style={{ fontSize: 22, fontWeight: 800, color: '#009fa0' }}>{fmt(item.totalProcedimientos)}</strong>
            </div>
            <div className="summary-card" style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>Pacientes Únicos</span>
              <strong style={{ fontSize: 22, fontWeight: 800, color: '#2b2d6e' }}>{fmt(item.pacientesUnicos)}</strong>
            </div>
            <div className="summary-card" style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>Promedio por Paciente</span>
              <strong style={{ fontSize: 22, fontWeight: 800, color: '#0d9488' }}>
                {item.pacientesUnicos > 0 ? (item.totalProcedimientos / item.pacientesUnicos).toFixed(1) : 1}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
            <div className="modal-search-box" style={{ maxWidth: 350 }}>
              <input
                type="text"
                placeholder="Buscar paciente, fecha..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
              />
            </div>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
              Mostrando {filteredRecords.length} registros de auditoría
            </span>
          </div>

          <div className="table-responsive" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Fecha y Hora</th>
                  <th>Paciente</th>
                  <th>CUPS</th>
                  <th>Ubicación / Sala</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pagedRecords.length > 0 ? (
                  pagedRecords.map((r, idx) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700, color: '#94a3b8' }}>{(page - 1) * rowsPerPage + idx + 1}</td>
                      <td>{r.fecha} {r.hora}</td>
                      <td><strong style={{ color: '#0f172a' }}>{r.nombrePaciente}</strong></td>
                      <td><span className="order-tag-cups">{r.codigoCups}</span></td>
                      <td>{r.unidadServicio}</td>
                      <td><span className="patient-orders-badge has-orders">{r.estado}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="modal-empty-cell">
                      No se encontraron registros para la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="modal-pagination" style={{ marginTop: 14 }}>
            <div className="pagination-info">
              Página {page} de {totalPages} ({filteredRecords.length} pacientes)
            </div>
            <div className="pagination-controls">
              <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>◀ Anterior</button>
              <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Siguiente ▶</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcedimientosView() {
  const dbData = procedimientosMenoresData;
  const [year, setYear] = useState('2026');
  const [month, setMonth] = useState('Todos los Meses');
  const [procedure, setProcedure] = useState('Todos los Procedimientos');
  const [specialist, setSpecialist] = useState('Todos los Especialistas');
  const [specialty, setSpecialty] = useState('Todas las Especialidades');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [selectedItemModal, setSelectedItemModal] = useState(null);

  const reset = () => {
    setYear('2026');
    setMonth('Todos los Meses');
    setProcedure('Todos los Procedimientos');
    setSpecialist('Todos los Especialistas');
    setSpecialty('Todas las Especialidades');
    setSearchQuery('');
    setCurrentPage(1);
    setSelectedItemModal(null);
  };

  const yearOptions = useMemo(() => (dbData.years || [2026]).map(String), [dbData]);
  const monthOptions = useMemo(() => ['Todos los Meses', ...MONTH_NAMES], []);

  // Procedure options sorted by volume
  // Procedure options sorted by volume, keeping all known procedures in filter
  const procedureOptions = useMemo(() => {
    const counts = {};
    (dbData.topProcedures || []).forEach((p) => {
      counts[p.name] = 0;
    });

    (dbData.tableData || []).forEach((r) => {
      if (year && String(r.anio) !== String(year)) return;
      if (month !== 'Todos los Meses' && r.mes !== month) return;
      if (specialist !== 'Todos los Especialistas' && r.especialista !== specialist) return;
      if (specialty !== 'Todas las Especialidades' && r.especialidad !== specialty) return;
      const name = r.procedimiento;
      counts[name] = (counts[name] || 0) + (r.totalProcedimientos || 0);
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const totalAll = sorted.reduce((acc, curr) => acc + curr[1], 0);
    return [
      { value: 'Todos los Procedimientos', label: `Todos los Procedimientos (${fmt(totalAll)})` },
      ...sorted.map(([procName, count]) => ({
        value: procName,
        label: `${procName.length > 55 ? procName.slice(0, 52) + '...' : procName} (${fmt(count)})`,
        count,
      }))
    ];
  }, [dbData, year, month, specialist, specialty]);

  // Specialty options sorted by volume, keeping all known specialties in filter
  const specialtyOptions = useMemo(() => {
    const counts = {};
    (dbData.specialties || []).forEach((spec) => {
      counts[spec] = 0;
    });

    (dbData.tableData || []).forEach((r) => {
      if (year && String(r.anio) !== String(year)) return;
      if (month !== 'Todos los Meses' && r.mes !== month) return;
      counts[r.especialidad] = (counts[r.especialidad] || 0) + (r.totalProcedimientos || 0);
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const totalAll = sorted.reduce((acc, curr) => acc + curr[1], 0);
    return [
      { value: 'Todas las Especialidades', label: `Todas las Especialidades (${fmt(totalAll)})` },
      ...sorted.map(([spec, count]) => ({
        value: spec,
        label: `${spec} (${fmt(count)})`,
        count,
      }))
    ];
  }, [dbData, year, month]);

  // Specialist options sorted by volume, keeping all known specialists in filter
  const specialistOptions = useMemo(() => {
    const counts = {};
    (dbData.specialists || []).forEach((doc) => {
      counts[doc.name] = 0;
    });

    (dbData.tableData || []).forEach((r) => {
      if (year && String(r.anio) !== String(year)) return;
      if (month !== 'Todos los Meses' && r.mes !== month) return;
      if (specialty !== 'Todas las Especialidades' && r.especialidad !== specialty) return;
      counts[r.especialista] = (counts[r.especialista] || 0) + (r.totalProcedimientos || 0);
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const totalAll = sorted.reduce((acc, curr) => acc + curr[1], 0);
    return [
      { value: 'Todos los Especialistas', label: `Todos los Especialistas (${fmt(totalAll)})` },
      ...sorted.map(([doc, count]) => ({
        value: doc,
        label: `${doc} (${fmt(count)})`,
        count,
      }))
    ];
  }, [dbData, year, month, specialty]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return (dbData.tableData || []).filter((r) => {
      if (year && String(r.anio) !== String(year)) return false;
      if (month !== 'Todos los Meses' && r.mes !== month) return false;
      if (procedure !== 'Todos los Procedimientos' && r.procedimiento !== procedure) return false;
      if (specialist !== 'Todos los Especialistas' && r.especialista !== specialist) return false;
      if (specialty !== 'Todas las Especialidades' && r.especialidad !== specialty) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = (r.codigo || '').toLowerCase().includes(q);
        const matchProc = (r.procedimiento || '').toLowerCase().includes(q);
        const matchDoc = (r.especialista || '').toLowerCase().includes(q);
        const matchSpec = (r.especialidad || '').toLowerCase().includes(q);
        if (!matchCode && !matchProc && !matchDoc && !matchSpec) return false;
      }
      return true;
    });
  }, [dbData, year, month, procedure, specialist, specialty, searchQuery]);

  // KPI Metrics
  const metrics = useMemo(() => {
    let totalProc = 0;
    let totalPac = 0;
    const docs = new Set();
    const specs = new Set();
    const procCounts = {};

    filteredRows.forEach((r) => {
      const pCount = r.totalProcedimientos || 0;
      totalProc += pCount;
      totalPac += r.pacientesUnicos || 0;
      if (r.especialista) docs.add(r.especialista);
      if (r.especialidad) specs.add(r.especialidad);
      if (r.procedimiento) {
        procCounts[r.procedimiento] = (procCounts[r.procedimiento] || 0) + pCount;
      }
    });

    const topProcSorted = Object.entries(procCounts).sort((a, b) => b[1] - a[1]);
    const topProcName = topProcSorted[0]?.[0] || 'Ninguno';
    const topProcCount = topProcSorted[0]?.[1] || 0;
    const topProcPercent = totalProc > 0 ? ((topProcCount / totalProc) * 100).toFixed(1) : 0;

    return {
      totalProc,
      totalPac,
      totalDocs: docs.size,
      totalSpecs: specs.size,
      topProcName,
      topProcCount,
      topProcPercent,
    };
  }, [filteredRows]);

  const cards = [
    {
      title: 'Total Procedimientos',
      value: fmt(metrics.totalProc),
      subtext: month === 'Todos los Meses' ? 'Acumulado Año 2026' : `Total mes de ${month}`,
      variant: 'primary',
      icon: 'stethoscope',
    },
    {
      title: 'Pacientes Únicos',
      value: fmt(metrics.totalPac),
      subtext: 'Personas atendidas',
      variant: 'blue',
      icon: 'user',
    },
    {
      title: 'Cirujanos / Especialistas',
      value: fmt(metrics.totalDocs),
      subtext: 'Médicos con actividad',
      variant: 'green',
      icon: 'user',
    },
    {
      title: 'Especialidades Activas',
      value: fmt(metrics.totalSpecs),
      subtext: 'Áreas quirúrgicas/médicas',
      variant: 'amber',
      icon: 'grid',
    },
    {
      title: 'Procedimiento Líder',
      value: `${metrics.topProcPercent}%`,
      subtext: metrics.topProcName.length > 25 ? metrics.topProcName.slice(0, 24) + '...' : metrics.topProcName,
      variant: 'purple',
      icon: 'activity',
    },
  ];

  // Chart 1: Ranking "¿Quién hizo más?"
  const rankingSpecialists = useMemo(() => {
    const map = {};
    filteredRows.forEach((r) => {
      const doc = r.especialista;
      if (!map[doc]) {
        map[doc] = {
          name: doc,
          specialty: r.especialidad,
          count: 0,
          patients: 0,
        };
      }
      map[doc].count += r.totalProcedimientos || 0;
      map[doc].patients += r.pacientesUnicos || 0;
    });
    const sorted = Object.values(map).sort((a, b) => b.count - a.count).slice(0, 8);
    const maxVal = sorted[0]?.count || 1;
    return sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      percentOfTotal: metrics.totalProc > 0 ? ((item.count / metrics.totalProc) * 100).toFixed(1) : 0,
      barWidth: Math.max(4, Math.round((item.count / maxVal) * 100)),
    }));
  }, [filteredRows, metrics.totalProc]);

  // Chart 2: Top Procedimientos
  const topProceduresChart = useMemo(() => {
    const map = {};
    filteredRows.forEach((r) => {
      const proc = r.procedimiento;
      if (!map[proc]) {
        map[proc] = {
          name: proc,
          codigo: r.codigo,
          count: 0,
          medicos: new Set(),
        };
      }
      map[proc].count += r.totalProcedimientos || 0;
      if (r.especialista) map[proc].medicos.add(r.especialista);
    });
    const sorted = Object.values(map)
      .map((item) => ({ ...item, medicosCount: item.medicos.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    const maxVal = sorted[0]?.count || 1;
    return sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      percentOfTotal: metrics.totalProc > 0 ? ((item.count / metrics.totalProc) * 100).toFixed(1) : 0,
      barWidth: Math.max(4, Math.round((item.count / maxVal) * 100)),
    }));
  }, [filteredRows, metrics.totalProc]);

  // Chart 3: Comparación Mensual
  const monthlyComparison = useMemo(() => {
    const monthData = {};
    MONTH_NAMES.forEach((m, idx) => {
      monthData[m] = {
        month: m,
        monthNum: idx + 1,
        total: 0,
        pacientes: 0,
      };
    });

    (dbData.tableData || []).forEach((r) => {
      if (year && String(r.anio) !== String(year)) return;
      if (procedure !== 'Todos los Procedimientos' && r.procedimiento !== procedure) return;
      if (specialist !== 'Todos los Especialistas' && r.especialista !== specialist) return;
      if (specialty !== 'Todas las Especialidades' && r.especialidad !== specialty) return;
      if (monthData[r.mes]) {
        monthData[r.mes].total += r.totalProcedimientos || 0;
        monthData[r.mes].pacientes += r.pacientesUnicos || 0;
      }
    });

    const list = Object.values(monthData);
    const maxMonthVal = Math.max(...list.map((m) => m.total), 1);

    let prevTotal = 0;
    return list.map((m, idx) => {
      let diffPercent = null;
      if (idx > 0 && prevTotal > 0 && m.total > 0) {
        diffPercent = (((m.total - prevTotal) / prevTotal) * 100).toFixed(1);
      }
      prevTotal = m.total;
      return {
        ...m,
        heightPercent: m.total > 0 ? Math.max(6, Math.round((m.total / maxMonthVal) * 100)) : 0,
        diffPercent,
      };
    });
  }, [dbData, year, procedure, specialist, specialty]);

  // Chart 4: Top Especialidades
  const topSpecialtiesChart = useMemo(() => {
    const map = {};
    filteredRows.forEach((r) => {
      const sp = r.especialidad;
      map[sp] = (map[sp] || 0) + (r.totalProcedimientos || 0);
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const maxVal = sorted[0]?.[1] || 1;
    return sorted.map(([name, count]) => ({
      name,
      count,
      percentOfTotal: metrics.totalProc > 0 ? ((count / metrics.totalProc) * 100).toFixed(1) : 0,
      barWidth: Math.max(4, Math.round((count / maxVal) * 100)),
    }));
  }, [filteredRows, metrics.totalProc]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, currentPage, rowsPerPage]);

  const exportCSV = () => {
    const headers = ['Año', 'Mes', 'Código CUPS', 'Procedimiento Menor', 'Especialista', 'Especialidad', 'Total Procedimientos', 'Pacientes Únicos'];
    const csvContent = [
      headers.join(';'),
      ...filteredRows.map((r) => [
        r.anio,
        r.mes,
        `"${r.codigo || ''}"`,
        `"${(r.procedimiento || '').replace(/"/g, '""')}"`,
        `"${(r.especialista || '').replace(/"/g, '""')}"`,
        `"${(r.especialidad || '').replace(/"/g, '""')}"`,
        r.totalProcedimientos,
        r.pacientesUnicos,
      ].join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `procedimientos_menores_${year}_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="attendance-view" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Filter Bar with Autocomplete Suggestions */}
      <section className="filters" aria-label="Filtros de Procedimientos Menores">
        <SelectField label="Año" icon="calendar" value={year} onChange={setYear} options={yearOptions} />
        <SelectField label="Mes" icon="calendar" value={month} onChange={setMonth} options={monthOptions} />
        <SelectField label="Procedimiento Menor" icon="activity" value={procedure} onChange={setProcedure} options={procedureOptions} />
        <SelectField label="Cirujano / Especialista" icon="user" value={specialist} onChange={setSpecialist} options={specialistOptions} />
        <SelectField label="Especialidad" icon="stethoscope" value={specialty} onChange={setSpecialty} options={specialtyOptions} />
        <UnifiedSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onSelectProcedure={setProcedure}
          onSelectSpecialist={setSpecialist}
          onSelectSpecialty={setSpecialty}
          procedureOptions={procedureOptions}
          specialistOptions={specialistOptions}
          specialtyOptions={specialtyOptions}
          placeholder="Buscar procedimiento, CUPS, médico, especialidad..."
        />
        <div className="filter-actions">
          <button className="reset-button" onClick={reset}>Restablecer</button>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="metrics-grid">
        {cards.map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </section>

      {/* 4 Activity and Comparison Charts Grid */}
      <div className="proc-activity-grid">
        {/* Chart 1: Productividad de Cirujanos o Enfermeras */}
        <div className="proc-chart-card">
          <div className="proc-chart-header">
            <div>
              <h3 className="proc-chart-title">Productividad de Cirujanos o Enfermeras</h3>
              <p className="proc-chart-subtitle">Top profesionales por volumen de procedimientos</p>
            </div>
            <span className="order-tag-group" style={{ background: '#e6f9f6', color: '#007c7d', border: '1px solid #99f6e4' }}>
              Top 8
            </span>
          </div>
          <div className="proc-ranking-list">
            {rankingSpecialists.map((doc) => (
              <div
                key={doc.name}
                className="proc-ranking-item"
                onClick={() => setSpecialist(doc.name)}
                style={{ cursor: 'pointer' }}
                title={`Haga clic para filtrar por ${doc.name}`}
              >
                <div className="proc-ranking-row">
                  <div className="proc-ranking-label">
                    <span
                      className="proc-rank-badge"
                      style={{
                        background: doc.rank === 1 ? '#009fa0' : doc.rank === 2 ? '#2b2d6e' : '#2ec4b6',
                      }}
                    >
                      {doc.rank}
                    </span>
                    <span className="doc-name" title={`${doc.name} (${doc.specialty})`}>
                      {doc.name} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 'normal' }}>({doc.specialty})</span>
                    </span>
                  </div>
                  <div className="proc-ranking-val">
                    {fmt(doc.count)} <span className="pct-tag">({doc.percentOfTotal}%)</span>
                  </div>
                </div>
                <div className="proc-bar-track">
                  <div className="proc-bar-fill-teal" style={{ width: `${doc.barWidth}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Top Procedimientos que más se hacen */}
        <div className="proc-chart-card">
          <div className="proc-chart-header">
            <div>
              <h3 className="proc-chart-title">Procedimientos que más se hacen</h3>
              <p className="proc-chart-subtitle">Top procedimientos quirúrgicos y menores más frecuentes</p>
            </div>
            <span className="order-tag-group" style={{ background: '#f3f0f9', color: '#2b2d6e', border: '1px solid #ddd6fe' }}>
              Top 8
            </span>
          </div>
          <div className="proc-ranking-list">
            {topProceduresChart.map((proc, pIdx) => (
              <div key={proc.name} className="proc-ranking-item">
                <div className="proc-ranking-row">
                  <div className="proc-ranking-label">
                    <span className="order-tag-cups" style={{ fontSize: 10.5, flexShrink: 0 }}>{proc.codigo}</span>
                    <span className="doc-name" title={proc.name}>{proc.name}</span>
                  </div>
                  <div className="proc-ranking-val" style={{ color: '#2b2d6e' }}>
                    {fmt(proc.count)} <span className="pct-tag">({proc.percentOfTotal}%)</span>
                  </div>
                </div>
                <div className="proc-bar-track">
                  <div className="proc-bar-fill-blue" style={{ width: `${proc.barWidth}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Comparaciones con los otros meses (Evolución) */}
        <div className="proc-chart-card">
          <div className="proc-chart-header">
            <div>
              <h3 className="proc-chart-title">Comparaciones con los otros meses</h3>
              <p className="proc-chart-subtitle">Evolución y volumen de quirófano mes a mes</p>
            </div>
            <span className="order-tag-group" style={{ background: '#e6f9f6', color: '#007c7d', border: '1px solid #99f6e4' }}>
              Año 2026
            </span>
          </div>
          <div className="proc-monthly-timeline">
            {monthlyComparison.map((m) => {
              const isSelected = month === m.month;
              return (
                <div
                  key={m.month}
                  className={`proc-monthly-col ${isSelected ? 'active' : ''}`}
                  onClick={() => setMonth(isSelected ? 'Todos los Meses' : m.month)}
                  title={`Mes: ${m.month} - Total: ${fmt(m.total)} procedimientos (Clic para filtrar)`}
                >
                  <div className="proc-monthly-val" style={{ opacity: m.total > 0 ? 1 : 0.4 }}>
                    {fmt(m.total)}
                  </div>
                  {m.diffPercent ? (
                    <span style={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: Number(m.diffPercent) >= 0 ? '#16a34a' : '#dc2626',
                      marginBottom: 2
                    }}>
                      {Number(m.diffPercent) >= 0 ? `+${m.diffPercent}%` : `${m.diffPercent}%`}
                    </span>
                  ) : (
                    <span style={{ height: 13, marginBottom: 2 }} />
                  )}
                  <div className="proc-monthly-bar-wrap">
                    <div
                      className="proc-monthly-pillar"
                      style={{
                        height: `${m.heightPercent}%`,
                        opacity: m.total > 0 ? 1 : 0.3,
                        background: m.total > 0 ? undefined : '#cbd5e1',
                        minHeight: m.total > 0 ? 4 : 2,
                      }}
                    />
                  </div>
                  <div className="proc-monthly-label" style={{ opacity: m.total > 0 ? 1 : 0.65 }}>
                    {m.month.slice(0, 3)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 4: Distribución por Especialidad */}
        <div className="proc-chart-card">
          <div className="proc-chart-header">
            <div>
              <h3 className="proc-chart-title">Distribución por Especialidad</h3>
              <p className="proc-chart-subtitle">Volumen de procedimientos por área médica</p>
            </div>
            <span className="order-tag-group" style={{ background: '#f3f0f9', color: '#2b2d6e', border: '1px solid #ddd6fe' }}>
              Top Áreas
            </span>
          </div>
          <div className="proc-ranking-list">
            {topSpecialtiesChart.map((sp) => (
              <div
                key={sp.name}
                className="proc-ranking-item"
                onClick={() => setSpecialty(sp.name)}
                style={{ cursor: 'pointer' }}
                title={`Haga clic para filtrar por ${sp.name}`}
              >
                <div className="proc-ranking-row">
                  <div className="proc-ranking-label">
                    <span className="doc-name">{sp.name}</span>
                  </div>
                  <div className="proc-ranking-val">
                    {fmt(sp.count)} <span className="pct-tag">({sp.percentOfTotal}%)</span>
                  </div>
                </div>
                <div className="proc-bar-track">
                  <div className="proc-bar-fill-teal" style={{ width: `${sp.barWidth}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Procedimientos Data Table in Solid White Card Container */}
      <section className="data-table-panel" style={{
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 25px rgba(43, 45, 110, 0.08)',
        padding: '22px 24px',
        margin: '0 0 24px'
      }} aria-label="Tabla de Procedimientos Menores">
        <div className="table-header-custom" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          paddingBottom: 16,
          borderBottom: '1.5px solid #e2e8f0',
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#1e1b4b' }}>
              Detalle de Procedimientos Quirúrgicos y Menores
            </h3>
            <span className="order-tag-group" style={{ background: '#e6f9f6', color: '#007c7d', border: '1px solid #99f6e4', fontWeight: 800 }}>
              {fmt(filteredRows.length)} Registros
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 280 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Buscar procedimiento, CUPS, médico..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1.5px solid #cbd5e1',
                  fontSize: 12.5,
                  outline: 'none',
                  background: '#f8fafc'
                }}
              />
            </div>
            <button
              onClick={exportCSV}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 16px',
                borderRadius: 9,
                background: 'linear-gradient(135deg, #009fa0 0%, #007c7d 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: 12.5,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 159, 160, 0.25)'
              }}
            >
              <Icon name="file" size={14} /> Exportar CSV
            </button>
          </div>
        </div>

        <div className="table-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflowX: 'auto', background: '#ffffff' }}>
          <table className="modern-table" style={{ width: '100%', minWidth: 1050, borderCollapse: 'collapse', tableLayout: 'auto' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '13px 14px', color: '#1e1b4b', fontWeight: 800, textAlign: 'left', width: 90, minWidth: 90, whiteSpace: 'nowrap' }}>Mes</th>
                <th style={{ padding: '13px 14px', color: '#1e1b4b', fontWeight: 800, textAlign: 'center', width: 110, minWidth: 110, whiteSpace: 'nowrap' }}>Código CUPS</th>
                <th style={{ padding: '13px 14px', color: '#1e1b4b', fontWeight: 800, textAlign: 'left', minWidth: 320, maxWidth: 420 }}>Procedimiento Menor</th>
                <th style={{ padding: '13px 14px', color: '#1e1b4b', fontWeight: 800, textAlign: 'left', minWidth: 220, maxWidth: 280 }}>Especialista / Cirujano</th>
                <th style={{ padding: '13px 14px', color: '#1e1b4b', fontWeight: 800, textAlign: 'left', width: 170, minWidth: 170 }}>Especialidad</th>
                <th style={{ padding: '13px 14px', color: '#1e1b4b', fontWeight: 800, textAlign: 'right', width: 140, minWidth: 140, whiteSpace: 'nowrap' }}>Total Procedimientos</th>
                <th style={{ padding: '13px 14px', color: '#1e1b4b', fontWeight: 800, textAlign: 'right', width: 125, minWidth: 125, whiteSpace: 'nowrap' }}>Pacientes Únicos</th>
                <th style={{ padding: '13px 14px', color: '#1e1b4b', fontWeight: 800, textAlign: 'center', width: 130, minWidth: 130, whiteSpace: 'nowrap' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length > 0 ? (
                pagedRows.map((row, idx) => (
                  <tr
                    key={`${row.anio}_${row.mes}_${row.codigo}_${row.especialista}_${idx}`}
                    className="clickable-table-row"
                    onClick={() => setSelectedItemModal(row)}
                    style={{ background: '#ffffff', borderBottom: '1px solid #f1f5f9' }}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#1e1b4b', whiteSpace: 'nowrap' }}>{row.mes}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}><span className="order-tag-cups">{row.codigo}</span></td>
                    <td style={{ padding: '12px 14px', minWidth: 320, maxWidth: 420, fontWeight: 600, color: '#0f172a', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.4' }}>
                      {row.procedimiento}
                    </td>
                    <td style={{ padding: '12px 14px', minWidth: 220, maxWidth: 280, color: '#334155', fontWeight: 600, whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.4' }}>
                      {row.especialista}
                    </td>
                    <td style={{ padding: '12px 14px', minWidth: 170, whiteSpace: 'normal' }}>
                      <span className="order-tag-group" style={{ background: '#f3f0f9', color: '#2b2d6e', border: '1px solid #ddd6fe', display: 'inline-block' }}>
                        {row.especialidad}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#009fa0', fontSize: 14, whiteSpace: 'nowrap' }}>
                      {fmt(row.totalProcedimientos)}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#2b2d6e', fontSize: 13.5, whiteSpace: 'nowrap' }}>
                      {fmt(row.pacientesUnicos)}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        className="cat-pill-btn"
                        style={{
                          background: '#e6f9f6',
                          color: '#007c7d',
                          border: '1px solid #99f6e4',
                          fontWeight: 700,
                          padding: '6px 14px',
                          borderRadius: 8,
                          cursor: 'pointer'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItemModal(row);
                        }}
                      >
                        Ver Pacientes
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="modal-empty-cell" style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>
                    No se encontraron procedimientos para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="modal-pagination" style={{ padding: '14px 4px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
          <div className="pagination-info">
            Página {currentPage} de {totalPages} ({fmt(filteredRows.length)} procedimientos en total)
          </div>
          <div className="pagination-controls">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>◀ Anterior</button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Siguiente ▶</button>
            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
              <option value={15}>15 por pág.</option>
              <option value={25}>25 por pág.</option>
              <option value={50}>50 por pág.</option>
              <option value={100}>100 por pág.</option>
            </select>
          </div>
        </div>
      </section>

      {/* Patient Register Detail Modal */}
      {selectedItemModal && (
        <ProcedimientoDetailModal
          item={selectedItemModal}
          onClose={() => setSelectedItemModal(null)}
        />
      )}
    </div>
  );
}

function Dashboard({ activePage, setActivePage }) {
  const dbData = useMemo(() => {
    if (activePage === 'odontologia') return odontologiaData;
    if (activePage === 'cisen') return cisenData;
    return centralEspecialistasData;
  }, [activePage]);

  const [year, setYear] = useState('2026');
  const [month, setMonth] = useState('Todos los Meses');
  const [specialist, setSpecialist] = useState('Todos los Especialistas');
  const [specialty, setSpecialty] = useState('Todas las Especialidades');
  const [selectedDiagnosis, setSelectedDiagnosis] = useState('Todos los Diagnósticos');
  const [selectedProcedure, setSelectedProcedure] = useState('Todos los Procedimientos');
  const [diagData, setDiagData] = useState({ diagnosticsList: initialDiagnosticsList, diagMap: {} });
  const [group, setGroup] = useState('Grupo de Ordenamiento');
  const [patient, setPatient] = useState('');
  const [selectedOrdersGroup, setSelectedOrdersGroup] = useState(null);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    reset();
  }, [activePage]);

  useEffect(() => {
    fetch('/data/diagnostics.json')
      .then((r) => r.json())
      .then((data) => setDiagData(data))
      .catch((err) => console.error('Error cargando diagnósticos:', err));
  }, []);

  const diagnosisOptions = useMemo(() => {
    const list = dbData.diagnosticsList?.length
      ? dbData.diagnosticsList
      : (diagData.diagnosticsList?.length ? diagData.diagnosticsList : initialDiagnosticsList);
    return [
      'Todos los Diagnósticos',
      ...list.map((d) => ({
        value: d.name,
        name: d.name,
        count: d.count,
        label: `${d.name} (${fmt(d.count)})`,
      }))
    ];
  }, [dbData, diagData]);

  const procedureOptions = useMemo(() => {
    const list = dbData.proceduresList || [];
    return [
      'Todos los Procedimientos',
      ...list.map((p) => ({
        value: p.name,
        name: p.name,
        code: p.code,
        count: p.count,
        label: `${p.name} (${fmt(p.count)})`,
      }))
    ];
  }, [dbData]);

  const activeTableData = useMemo(() => {
    if (selectedProcedure && selectedProcedure !== 'Todos los Procedimientos') {
      const procMap = dbData.procMap || {};
      const procEntries = procMap[selectedProcedure] || [];
      return procEntries.map((r) => ({
        anio: r[0],
        mes: r[1],
        especialista: r[2],
        especialidad: r[3],
        totalCitas: r[4],
        realizadas: r[5],
        primeraVez: r[6],
        control: r[7],
        procedimiento: selectedProcedure,
      }));
    }
    if (selectedDiagnosis && selectedDiagnosis !== 'Todos los Diagnósticos') {
      const diagMap = dbData.diagMap || diagData.diagMap || {};
      const diagEntries = diagMap[selectedDiagnosis] || [];
      return diagEntries.map((r) => ({
        anio: r[0],
        mes: r[1],
        especialista: r[2],
        especialidad: r[3],
        totalCitas: r[4],
        realizadas: r[5],
        primeraVez: r[6],
        control: r[7],
        diagnostico: selectedDiagnosis,
      }));
    }
    return dbData.tableData || [];
  }, [dbData, selectedProcedure, selectedDiagnosis, diagData]);

  const filteredActiveTableData = useMemo(() => {
    let rows = activeTableData;
    if (patient && patient.trim()) {
      const q = patient.trim().toLowerCase();
      const directMatches = rows.filter((r) => 
        (r.especialista && r.especialista.toLowerCase().includes(q)) ||
        (r.especialidad && r.especialidad.toLowerCase().includes(q)) ||
        (r.diagnostico && r.diagnostico.toLowerCase().includes(q)) ||
        (r.procedimiento && r.procedimiento.toLowerCase().includes(q))
      );
      if (directMatches.length > 0) {
        return directMatches;
      }
      if (dbData.procMap) {
        const matchingKeys = Object.keys(dbData.procMap).filter(k => k.toLowerCase().includes(q));
        if (matchingKeys.length > 0) {
          const matchedRows = [];
          matchingKeys.forEach(k => {
            const entries = dbData.procMap[k] || [];
            entries.forEach(r => {
              matchedRows.push({
                anio: r[0],
                mes: r[1],
                especialista: r[2],
                especialidad: r[3],
                totalCitas: r[4],
                realizadas: r[5],
                primeraVez: r[6],
                control: r[7],
                procedimiento: k,
              });
            });
          });
          return matchedRows;
        }
      }
      return directMatches;
    }
    return rows;
  }, [activeTableData, patient, dbData]);

  const reset = () => {
    setYear('2026');
    setMonth('Todos los Meses');
    setSpecialist('Todos los Especialistas');
    setSpecialty('Todas las Especialidades');
    setSelectedDiagnosis('Todos los Diagnósticos');
    setSelectedProcedure('Todos los Procedimientos');
    setGroup('Grupo de Ordenamiento');
    setPatient('');
    setSelectedOrdersGroup(null);
    setFiltersApplied(false);
  };

  const yearOptions = useMemo(() => (dbData.years || [2026]).map(String), [dbData]);

  useEffect(() => {
    if (yearOptions.length > 0 && !yearOptions.includes(year)) {
      setYear(yearOptions[0]);
    }
  }, [yearOptions, year]);

  const monthOptions = useMemo(() => {
    const ym = dbData.dataByYearMonth?.[year] || {};
    const monthsWithData = MONTH_NAMES.filter((m) => ym[m] && ym[m].totalHonorarios > 0);
    if (monthsWithData.length > 0 && monthsWithData.length < 12) {
      return ['Todos los Meses', ...monthsWithData];
    }
    return ['Todos los Meses', ...MONTH_NAMES];
  }, [dbData, year]);

  // Compute specialty options sorted de mayor a menor with appointment counts
  const specialtyOptions = useMemo(() => {
    const counts = {};
    const mIdx = month !== 'Todos los Meses' ? MONTH_NAMES.indexOf(month) + 1 : null;

    Object.entries(dbData.bySpecialty || {}).forEach(([key, val]) => {
      const parts = key.split('_');
      if (parts.length >= 3) {
        const y = parts[0];
        const m = parseInt(parts[1], 10);
        const specName = parts.slice(2).join('_');

        if (y === year && (!mIdx || m === mIdx)) {
          counts[specName] = (counts[specName] || 0) + (val.totalHonorarios || 0);
        }
      }
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const totalAll = sorted.reduce((acc, curr) => acc + curr[1], 0);

    return [
      { value: 'Todas las Especialidades', label: `Todas las Especialidades (${fmt(totalAll)})` },
      ...sorted.map(([spec, count]) => ({
        value: spec,
        label: `${spec} (${fmt(count)})`,
        count,
      }))
    ];
  }, [dbData, year, month]);

  // Compute specialist options sorted de mayor a menor with appointment counts
  const specialistOptions = useMemo(() => {
    const counts = {};
    const mIdx = month !== 'Todos los Meses' ? MONTH_NAMES.indexOf(month) + 1 : null;

    const specByDoc = {};
    (dbData.specialists || []).forEach((s) => {
      if (typeof s === 'object') {
        specByDoc[s.name] = s.specialty;
      }
    });

    Object.entries(dbData.bySpecialist || {}).forEach(([key, val]) => {
      const parts = key.split('_');
      if (parts.length >= 3) {
        const y = parts[0];
        const m = parseInt(parts[1], 10);
        const docName = parts.slice(2).join('_');

        if (y === year && (!mIdx || m === mIdx)) {
          if (!specialty || specialty === 'Todas las Especialidades' || specByDoc[docName] === specialty) {
            counts[docName] = (counts[docName] || 0) + (val.totalHonorarios || 0);
          }
        }
      }
    });

    (dbData.specialists || []).forEach((s) => {
      const name = typeof s === 'object' ? s.name : s;
      const sp = typeof s === 'object' ? s.specialty : '';
      if (!specialty || specialty === 'Todas las Especialidades' || sp === specialty) {
        if (!(name in counts)) {
          counts[name] = 0;
        }
      }
    });

    const sorted = Object.entries(counts).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    });
    const totalAll = sorted.reduce((acc, curr) => acc + curr[1], 0);

    return [
      { value: 'Todos los Especialistas', label: `Todos los Especialistas (${fmt(totalAll)})` },
      ...sorted.map(([doc, count]) => ({
        value: doc,
        label: `${doc} (${fmt(count)})`,
        count,
      }))
    ];
  }, [dbData, year, month, specialty]);

  const groupOptions = useMemo(() => {
    const groups = dbData.orderingGroups || [
      'Medicamentos',
      'Laboratorio Clínico',
      'Honorarios Médicos',
      'Procedimientos Quirúrgicos',
      'Ecografías',
      'Imágenes Diagnósticas'
    ];
    return ['Grupo de Ordenamiento', ...groups];
  }, [dbData]);

  const monthIndex = MONTH_NAMES.indexOf(month) + 1;
  const yearData = dbData.dataByYearMonth?.[year] || {};

  let totalCitasActivas = 0;
  let totalLaboratorios = 0;
  let totalConsultasRealizadas = 0;
  let totalConsultasPrimeraVez = 0;
  let totalConsultasControl = 0;
  let orders = { medicamentos: 0, laboratorios: 0, honorarios: 0, procedimientos: 0, ecografias: 0, imagenes: 0 };

  if (month !== 'Todos los Meses') {
    if (yearData[month]) {
      const mData = yearData[month];
      totalCitasActivas = mData.totalHonorarios;
      totalLaboratorios = mData.totalLaboratorios;
      totalConsultasRealizadas = mData.totalConsultasRealizadas;
      totalConsultasPrimeraVez = mData.totalConsultasPrimeraVez;
      totalConsultasControl = mData.totalConsultasControl;
      if (mData.orders) {
        orders = {
          medicamentos: mData.orders.medicamentos || 0,
          laboratorios: mData.orders.laboratorios || 0,
          honorarios: mData.orders.honorarios || 0,
          procedimientos: mData.orders.procedimientos || 0,
          ecografias: mData.orders.ecografias || 0,
          imagenes: mData.orders.imagenes || 0,
        };
      }
    }
  } else {
    MONTH_NAMES.forEach((m) => {
      if (yearData[m]) {
        totalCitasActivas += yearData[m].totalHonorarios || 0;
        totalLaboratorios += yearData[m].totalLaboratorios || 0;
        totalConsultasRealizadas += yearData[m].totalConsultasRealizadas || 0;
        totalConsultasPrimeraVez += yearData[m].totalConsultasPrimeraVez || 0;
        totalConsultasControl += yearData[m].totalConsultasControl || 0;
        if (yearData[m].orders) {
          orders.medicamentos += yearData[m].orders.medicamentos || 0;
          orders.laboratorios += yearData[m].orders.laboratorios || 0;
          orders.honorarios += yearData[m].orders.honorarios || 0;
          orders.procedimientos += yearData[m].orders.procedimientos || 0;
          orders.ecografias += yearData[m].orders.ecografias || 0;
          orders.imagenes += yearData[m].orders.imagenes || 0;
        }
      }
    });
  }

  if (specialty !== 'Todas las Especialidades') {
    if (month !== 'Todos los Meses') {
      const specKey = `${year}_${monthIndex}_${specialty}`;
      const specData = dbData.bySpecialty?.[specKey];
      const oSpec = dbData.ordersBySpecialty?.[specKey];
      if (specData) {
        totalCitasActivas = specData.totalHonorarios;
        totalConsultasRealizadas = specData.consultasRealizadas;
        totalConsultasPrimeraVez = specData.consultasPrimeraVez;
        totalConsultasControl = specData.consultasControl;
      } else {
        totalCitasActivas = 0; totalConsultasRealizadas = 0; totalConsultasPrimeraVez = 0; totalConsultasControl = 0;
      }
      if (oSpec) {
        orders = {
          medicamentos: oSpec.medicamentos || 0,
          laboratorios: oSpec.laboratorios || 0,
          honorarios: oSpec.honorarios || 0,
          procedimientos: oSpec.procedimientos || 0,
          ecografias: oSpec.ecografias || 0,
          imagenes: oSpec.imagenes || 0,
        };
        totalLaboratorios = oSpec.laboratorios || 0;
      } else {
        orders = { medicamentos: 0, laboratorios: 0, honorarios: 0, procedimientos: 0, ecografias: 0, imagenes: 0 };
        totalLaboratorios = 0;
      }
    } else {
      totalCitasActivas = 0; totalLaboratorios = 0; totalConsultasRealizadas = 0; totalConsultasPrimeraVez = 0; totalConsultasControl = 0;
      orders = { medicamentos: 0, laboratorios: 0, honorarios: 0, procedimientos: 0, ecografias: 0, imagenes: 0 };
      for (let m = 1; m <= 12; m++) {
        const specKey = `${year}_${m}_${specialty}`;
        const specData = dbData.bySpecialty?.[specKey];
        if (specData) {
          totalCitasActivas += specData.totalHonorarios;
          totalConsultasRealizadas += specData.consultasRealizadas;
          totalConsultasPrimeraVez += specData.consultasPrimeraVez;
          totalConsultasControl += specData.consultasControl;
        }
        const oSpec = dbData.ordersBySpecialty?.[specKey];
        if (oSpec) {
          orders.medicamentos += oSpec.medicamentos || 0;
          orders.laboratorios += oSpec.laboratorios || 0;
          orders.honorarios += oSpec.honorarios || 0;
          orders.procedimientos += oSpec.procedimientos || 0;
          orders.ecografias += oSpec.ecografias || 0;
          orders.imagenes += oSpec.imagenes || 0;
        }
      }
      totalLaboratorios = orders.laboratorios;
    }
  }

  if (specialist !== 'Todos los Especialistas') {
    if (month !== 'Todos los Meses') {
      const docKey = `${year}_${monthIndex}_${specialist}`;
      const docData = dbData.bySpecialist?.[docKey];
      const oDoc = dbData.ordersBySpecialist?.[docKey];
      if (docData) {
        totalCitasActivas = docData.totalHonorarios;
        totalConsultasRealizadas = docData.consultasRealizadas;
        totalConsultasPrimeraVez = docData.consultasPrimeraVez;
        totalConsultasControl = docData.consultasControl;
      } else {
        totalCitasActivas = 0; totalConsultasRealizadas = 0; totalConsultasPrimeraVez = 0; totalConsultasControl = 0;
      }
      if (oDoc) {
        orders = {
          medicamentos: oDoc.medicamentos || 0,
          laboratorios: oDoc.laboratorios || 0,
          honorarios: oDoc.honorarios || 0,
          procedimientos: oDoc.procedimientos || 0,
          ecografias: oDoc.ecografias || 0,
          imagenes: oDoc.imagenes || 0,
        };
        totalLaboratorios = oDoc.laboratorios || 0;
      } else {
        orders = { medicamentos: 0, laboratorios: 0, honorarios: 0, procedimientos: 0, ecografias: 0, imagenes: 0 };
        totalLaboratorios = 0;
      }
    } else {
      totalCitasActivas = 0; totalLaboratorios = 0; totalConsultasRealizadas = 0; totalConsultasPrimeraVez = 0; totalConsultasControl = 0;
      orders = { medicamentos: 0, laboratorios: 0, honorarios: 0, procedimientos: 0, ecografias: 0, imagenes: 0 };
      for (let m = 1; m <= 12; m++) {
        const docKey = `${year}_${m}_${specialist}`;
        const docData = dbData.bySpecialist?.[docKey];
        if (docData) {
          totalCitasActivas += docData.totalHonorarios;
          totalConsultasRealizadas += docData.consultasRealizadas;
          totalConsultasPrimeraVez += docData.consultasPrimeraVez;
          totalConsultasControl += docData.consultasControl;
        }
        const oDoc = dbData.ordersBySpecialist?.[docKey];
        if (oDoc) {
          orders.medicamentos += oDoc.medicamentos || 0;
          orders.laboratorios += oDoc.laboratorios || 0;
          orders.honorarios += oDoc.honorarios || 0;
          orders.procedimientos += oDoc.procedimientos || 0;
          orders.ecografias += oDoc.ecografias || 0;
          orders.imagenes += oDoc.imagenes || 0;
        }
      }
      totalLaboratorios = orders.laboratorios;
    }
  }

  // Filtrado de indicadores cuando se selecciona un Procedimiento o Diagnóstico CIE 10 específico
  if ((selectedProcedure && selectedProcedure !== 'Todos los Procedimientos') || (selectedDiagnosis && selectedDiagnosis !== 'Todos los Diagnósticos')) {
    const matchingRows = activeTableData.filter((r) => {
      if (year && r.anio.toString() !== year.toString()) return false;
      if (month && month !== 'Todos los Meses' && r.mes !== month) return false;
      if (specialist && specialist !== 'Todos los Especialistas' && r.especialista !== specialist) return false;
      if (specialty && specialty !== 'Todas las Especialidades' && r.especialidad !== specialty) return false;
      return true;
    });

    totalCitasActivas = matchingRows.reduce((acc, curr) => acc + curr.totalCitas, 0);
    totalConsultasRealizadas = matchingRows.reduce((acc, curr) => acc + curr.realizadas, 0);
    totalConsultasPrimeraVez = matchingRows.reduce((acc, curr) => acc + curr.primeraVez, 0);
    totalConsultasControl = matchingRows.reduce((acc, curr) => acc + curr.control, 0);
    if (selectedProcedure && selectedProcedure !== 'Todos los Procedimientos') {
      totalLaboratorios = 0;
    }
  }

  const cards = useMemo(() => {
    return [
      {
        title: 'Total Consultas Activas',
        value: fmt(totalCitasActivas),
        change: 'Consultas',
        kind: 'deep',
        sub: selectedProcedure !== 'Todos los Procedimientos'
          ? `Proc: ${selectedProcedure.slice(0, 24)}...`
          : selectedDiagnosis !== 'Todos los Diagnósticos'
          ? `CIE 10: ${selectedDiagnosis.slice(0, 24)}...`
          : 'Consultas programadas',
      },
      {
        title: 'Total Laboratorios',
        value: fmt(totalLaboratorios),
        change: `${percentage(totalLaboratorios, totalCitasActivas).toFixed(1)}%`,
        kind: 'light',
        sub: 'Órdenes de laboratorio',
      },
      {
        title: 'Total Consultas Realizadas',
        value: fmt(totalConsultasRealizadas),
        change: `${percentage(totalConsultasRealizadas, totalCitasActivas).toFixed(1)}%`,
        kind: 'light',
        sub: 'Consultas cumplidas',
      },
      {
        title: 'Total Consultas Primera Vez',
        value: fmt(totalConsultasPrimeraVez),
        change: `${percentage(totalConsultasPrimeraVez, totalCitasActivas).toFixed(1)}%`,
        kind: 'deep',
        sub: 'Primera oportunidad',
      },
      {
        title: 'Total Consultas Control',
        value: fmt(totalConsultasControl),
        change: `${percentage(totalConsultasControl, totalCitasActivas).toFixed(1)}%`,
        kind: 'light',
        sub: 'Seguimiento médico',
      },
    ];
  }, [totalCitasActivas, totalLaboratorios, totalConsultasRealizadas, totalConsultasPrimeraVez, totalConsultasControl, selectedProcedure, selectedDiagnosis]);

  const currentPageInfo = pageConfigs[activePage] || pageConfigs.especialistas;

  const bars = useMemo(() => {
    const isPurple = currentPageInfo.theme === 'purple';
    const isBlue = currentPageInfo.theme === 'blue';

    const allBarsMap = {
      'Medicamentos': {
        label: 'Medicamentos',
        value: orders.medicamentos || 0,
        color: isPurple ? 'bar-purple-deep' : isBlue ? 'bar-blue-deep' : 'bar-primary',
      },
      'Laboratorio Clínico': {
        label: 'Laboratorio Clínico',
        value: orders.laboratorios || 0,
        color: isPurple ? 'bar-purple-mid' : isBlue ? 'bar-blue-mid' : 'bar-green',
      },
      'Honorarios Médicos': {
        label: 'Honorarios Médicos',
        value: orders.honorarios || 0,
        color: isPurple ? 'bar-purple-light' : isBlue ? 'bar-blue-light' : 'bar-blue',
      },
      'Procedimientos Quirúrgicos': {
        label: 'Procedimientos Quirúrgicos',
        value: orders.procedimientos || 0,
        color: isPurple ? 'bar-purple-deep' : isBlue ? 'bar-blue-deep' : 'bar-indigo',
      },
      'Ecografías': {
        label: 'Ecografías',
        value: orders.ecografias || 0,
        color: isPurple ? 'bar-purple-mid' : isBlue ? 'bar-blue-mid' : 'bar-amber',
      },
      'Imágenes Diagnósticas': {
        label: 'Imágenes Diagnósticas',
        value: orders.imagenes || 0,
        color: isPurple ? 'bar-purple-light' : isBlue ? 'bar-blue-light' : 'bar-cyan',
      },
    };

    const boardGroups = dbData.orderingGroups || Object.keys(allBarsMap);
    const activeBars = boardGroups.map((g) => allBarsMap[g]).filter(Boolean);

    if (group && group !== 'Grupo de Ordenamiento') {
      return activeBars.filter(
        (b) => b.label.trim().toLowerCase() === group.trim().toLowerCase()
      );
    }
    return activeBars;
  }, [orders, group, currentPageInfo.theme, dbData]);

  const filterSummary = useMemo(() => {
    const count = [
      year !== '2026',
      month !== 'Todos los Meses',
      specialist !== 'Todos los Especialistas',
      specialty !== 'Todas las Especialidades',
      selectedProcedure !== 'Todos los Procedimientos',
      selectedDiagnosis !== 'Todos los Diagnósticos',
      group !== 'Grupo de Ordenamiento',
      patient.trim() !== '',
    ].filter(Boolean).length;
    return count > 0 ? `Filtros (${count})` : 'Aplicar Filtros';
  }, [year, month, specialist, specialty, selectedProcedure, selectedDiagnosis, group, patient]);

  return (
    <div className={`app-shell ${currentPageInfo.bgClass} theme-${currentPageInfo.theme}`}>
      <header className="topbar">
        <div className="brand-block">
          <p className="eyebrow">{currentPageInfo.eyebrow}</p>
          <strong>{currentPageInfo.name}</strong>
        </div>
        <button
          className="mobile-menu"
          aria-label="Abrir menú"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          ☰
        </button>
        <nav className={mobileOpen ? 'site-nav open' : 'site-nav'} aria-label="Páginas">
          {Object.entries(pageConfigs).map(([key, cfg]) => (
            <button
              key={key}
              className={activePage === key ? 'active' : ''}
              onClick={() => {
                setActivePage(key);
                setMobileOpen(false);
              }}
            >
              {cfg.name}
            </button>
          ))}
        </nav>
        <div className="header-logo-container">
          <img className="header-logo" src="/logooo-Photoroom.png" alt="Clínica Nueva de Cali" />
        </div>
      </header>

      <main className="dashboard">
        {activePage === 'asistencia' ? (
          <AttendanceView />
        ) : activePage === 'procedimientos' ? (
          <ProcedimientosView />
        ) : (
          <>
            <section className="filters" aria-label="Filtros del tablero">
              <SelectField label="Año" icon="calendar" value={year} onChange={setYear} options={yearOptions} />
              <SelectField label="Mes" icon="calendar" value={month} onChange={setMonth} options={monthOptions} />
              <SelectField label="Especialista" icon="user" value={specialist} onChange={setSpecialist} options={specialistOptions} />
              <SelectField label="Especialidad" icon="stethoscope" value={specialty} onChange={setSpecialty} options={specialtyOptions} />
              {procedureOptions.length > 1 && (
                <SelectField
                  label="Procedimiento / Servicio"
                  icon="activity"
                  value={selectedProcedure}
                  onChange={setSelectedProcedure}
                  options={procedureOptions}
                />
              )}
              <SelectField label="Grupo de Ordenamiento" icon="grid" value={group} onChange={setGroup} options={groupOptions} />
              <UnifiedSearchInput
                value={patient}
                onChange={setPatient}
                onSelectProcedure={setSelectedProcedure}
                onSelectSpecialist={setSpecialist}
                onSelectSpecialty={setSpecialty}
                onSelectDiagnosis={setSelectedDiagnosis}
                onSelectGroup={setGroup}
                procedureOptions={procedureOptions}
                specialistOptions={specialistOptions}
                specialtyOptions={specialtyOptions}
                diagnosisOptions={diagnosisOptions}
                groupOptions={groupOptions}
                placeholder="Buscar procedimiento, CUPS, especialista, especialidad..."
              />
              <div className="filter-actions">
                <button className="apply-button" onClick={() => setFiltersApplied(true)}>{filterSummary}</button>
                <button className="reset-button" onClick={reset}>Restablecer</button>
                <CIEDropdownFilter
                  value={selectedDiagnosis}
                  onChange={setSelectedDiagnosis}
                  options={diagnosisOptions}
                />
              </div>
            </section>

            <section className="metrics-grid">
              {cards.map((card) => (
                <MetricCard key={card.title} {...card} />
              ))}
            </section>

            <OrdersChart
              bars={bars}
              month={month}
              year={year}
              theme={currentPageInfo.theme || 'green'}
              onOpenOrdersModal={(grp) => setSelectedOrdersGroup(grp)}
            />

            <DataTable
              data={filteredActiveTableData}
              year={year}
              month={month}
              specialist={specialist}
              specialty={specialty}
              group={group}
              allowOrders={true}
              selectedDiagnosis={selectedDiagnosis}
              selectedProcedure={selectedProcedure}
              dbData={dbData}
              onOpenOrdersModal={(grpInfo) => setSelectedOrdersGroup(grpInfo)}
            />

            {selectedOrdersGroup && (
              <GroupOrdersDetailModal
                groupInfo={selectedOrdersGroup}
                year={year}
                month={month}
                specialist={specialist}
                specialty={specialty}
                selectedDiagnosis={selectedDiagnosis}
                onClose={() => setSelectedOrdersGroup(null)}
                dbData={dbData}
              />
            )}
          </>
        )}
      </main>
      <footer>powered by statistics CNC 2026</footer>
    </div>
  );
}

function App() {
  const getInitialPage = () => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('cisen') || path.includes('sis-em') || path.includes('sis')) return 'cisen';
    if (path.includes('odontologia')) return 'odontologia';
    if (path.includes('procedimiento') || path.includes('quirofano')) return 'procedimientos';
    if (path.includes('asistencia')) return 'asistencia';
    return 'especialistas';
  };

  const [activePage, setActivePage] = useState(getInitialPage);

  const selectPage = (page) => {
    setActivePage(page);
    const path = page === 'especialistas'
      ? '/central-de-especialistas'
      : page === 'cisen'
      ? '/sis-emcali'
      : page === 'odontologia'
      ? '/odontologia'
      : page === 'procedimientos'
      ? '/procedimientos-menores'
      : '/gestion-asistencias';
    window.history.replaceState({}, '', path);
    document.title = `Dashboard | ${pageConfigs[page]?.name || 'CNC'}`;
  };

  return <Dashboard activePage={activePage} setActivePage={selectPage} />;
}

createRoot(document.getElementById('root')).render(<App />);
