Created At: 2026-09-03T08:12:31-05:00
Completed At: 2026-09-03T08:12:31-05:00
File Path: `file:///g:/BACKUP/juan%20manuel/odontologia/src/main.jsx`
Total Lines: 1184
Total Bytes: 54471
Showing lines 1120 to 1180
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
1120:         <nav className={mobileOpen ? 'site-nav open' : 'site-nav'} aria-label="Páginas">
1121:           <button className={activePage === 'especialistas' ? 'active' : ''} onClick={() => { setActivePage('especialistas'); setMobileOpen(false); }}>{pageData.especialistas.name}</button>
1122:           <button className={activePage === 'cisen' ? 'active' : ''} onClick={() => { setActivePage('cisen'); setMobileOpen(false); }}>{pageData.cisen.name}</button>
1123:           <button className={activePage === 'odontologia' ? 'active' : ''} onClick={() => { setActivePage('odontologia'); setMobileOpen(false); }}>{pageData.odontologia.name}</button>
1124:           <button className={activePage === 'asistencia' ? 'active' : ''} onClick={() => { setActivePage('asistencia'); setMobileOpen(false); }}>{pageData.asistencia.name}</button>
1125:         </nav>
1126:         <img className="header-logo" src="/logooo-Photoroom.png" alt="Clínica Nueva de Cali" />
1127:       </header>
1128:       <main className="dashboard">
1129:         {activePage === 'asistencia' ? (
1130:           <AttendanceView data={currentData} />
1131:         ) : (
1132:           <>
1133:             <section className="filters" aria-label="Filtros del tablero">
1134:               <SelectField label="Año" icon="calendar" value={year} onChange={setYear} options={yearOptions} />
1135:               <SelectField label="Mes" icon="calendar" value={month} onChange={setMonth} options={monthOptions} />
1136:               <SelectField label="Especialista" icon="user" value={specialist} onChange={setSpecialist} options={specialistOptions} />
1137:               <SelectField label="Especialidad" icon="stethoscope" value={specialty} onChange={setSpecialty} options={specialtyOptions} />
1138:               <SelectField label="Grupo de Ordenamiento" icon="grid" value={group} onChange={setGroup} options={groupOptions} />
1139:               <label className="filter-field patient-field"><span className="field-label">CUPS Ordenado (Código/Nombre)</span><span className="search-control"><Icon name="search" size={18} /><input value={patient} onChange={(event) => setPatient(event.target.value)} placeholder="Buscar" /></span></label>
1140:               <div className="filter-actions"><button className="apply-button" onClick={() => setFiltersApplied(true)}>{filterSummary}</button><button className="reset-button" onClick={reset}>Restablecer</button><button className="cie-button"><Icon name="file" size={19} />CIE 10</button></div>
1141:             </section>
1142:             <section className="metrics-grid">{currentData.cards.map((card) => <MetricCard key={card.title} {...card} />)}</section>
1143:             <AnnualTrendChart cards={currentData.cards} color={currentData.color} dailyData={currentData.dailyData} year={year} />
1144:             <OrdersChart bars={currentData.bars} month={month} year={year} theme={currentData.theme || 'green'} />
1145:             <DataTable 
1146:               data={dbSpecialistsData.tableData || []} 
1147:               year={year} 
1148:               month={month} 
1149:               specialist={specialist} 
1150:               specialty={specialty} 
1151:             />
1152:           </>
1153:         )}
1154:       </main>
1155:       <footer>powered by statistics CNC 2026</footer>
1156:     </div>
1157:   );
1158: }
1159: 
1160: function App() {
1161:   const getInitialPage = () => {
1162:     if (window.location.pathname.includes('cisen') || window.location.pathname.includes('sis-em')) return 'cisen';
1163:     if (window.location.pathname.includes('odontologia')) return 'odontologia';
1164:     if (window.location.pathname.includes('asistencia')) return 'asistencia';
1165:     return 'especialistas';
1166:   };
1167:   const [activePage, setActivePage] = useState(getInitialPage);
1168:   const selectPage = (page) => {
1169:     setActivePage(page);
1170:     const path = page === 'especialistas' 
1171:       ? '/central-de-especialistas' 
1172:       : page === 'cisen' 
1173:       ? '/sis-em-cali' 
1174:       : page === 'odontologia' 
1175:       ? '/odontologia' 
1176:       : '/gestion-asistencias';
1177:     window.history.replaceState({}, '', path);
1178:     document.title = `Dashboard | ${pageData[page].name}`;
1179:   };
1180:   return <Dashboard activePage={activePage} setActivePage={selectPage} />;
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
