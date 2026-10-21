Attendance dashboard maintenance

The active entry is index.html → public/assets/index-f698ba9e.js. The older
src/main.jsx is not loaded. Do not replace the active bundle with that old UI.

The calculation source is public/attendance-model.js. The readable component
snapshots are src/attendance-view.js and src/attendance-chart.js; integration
into the preserved dashboard is performed by scripts/install_attendance_fix.cjs.

Refresh attendance with `python scripts/sync_attendance.py` (read-only database
query using .env). It writes aggregate counts only to public/attendance-snapshot.json.
Each appointment belongs to exactly one of primeraVez, control, otras. Service
classification uses EXISTS to avoid multiplying appointments by service matches.
Both charts and attendance columns in the table use this snapshot. Order columns
keep the existing order data. The monthly base is computed before specialist,
specialty and consultation-type filters; all percentages share that base.

Run with a modern Node runtime:
  node scripts/install_attendance_fix.cjs
  node scripts/test_attendance.mjs
  node node_modules/vite/bin/vite.js build
