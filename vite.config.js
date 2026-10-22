import { spawn } from 'node:child_process';
import { defineConfig } from 'vite';

function sqlSyncAndAttendanceApi() {
  return {
    name: 'sql-sync-and-attendance-api',
    configureServer(server) {
      server.middlewares.use('/api/attendance/patients', (req, res) => {
        const query = new URL(req.url, 'http://localhost').searchParams;
        const payload = JSON.stringify(Object.fromEntries(query.entries()));
        const child = spawn('python', ['scripts/attendance_details.py', payload], { cwd: process.cwd() });
        let output = '';
        let error = '';
        child.stdout.on('data', chunk => { output += chunk; });
        child.stderr.on('data', chunk => { error += chunk; });
        child.on('close', code => {
          res.statusCode = code === 0 ? 200 : 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(code === 0 ? output : JSON.stringify({ error: error || 'No fue posible consultar los pacientes' }));
        });
      });

      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/api/sync/')) {
          const target = req.url.split('/api/sync/')[1]?.split('?')[0];
          const child = spawn('python', ['scripts/sync_target.py', target || 'all'], { cwd: process.cwd(), shell: true });
          let output = '';
          let error = '';
          child.stdout.on('data', chunk => { output += chunk; });
          child.stderr.on('data', chunk => { error += chunk; });
          child.on('close', code => {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            if (code === 0 && output) {
              res.statusCode = 200;
              res.end(output);
            } else if (code === 0) {
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, message: `Tablero ${target} actualizado con éxito` }));
            } else {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error || `Error al actualizar datos de ${target}` }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({ plugins: [sqlSyncAndAttendanceApi()] });
