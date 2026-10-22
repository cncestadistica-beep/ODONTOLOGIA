import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
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

      server.middlewares.use('/api/sync/procedimientos', (req, res) => {
        const child = spawn('python', ['scripts/sync_procedimientos_menores.py'], { cwd: process.cwd() });
        let output = '';
        let error = '';
        child.stdout.on('data', chunk => { output += chunk; });
        child.stderr.on('data', chunk => { error += chunk; });
        child.on('close', code => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          if (code === 0) {
            try {
              const freshData = fs.readFileSync(path.join(process.cwd(), 'src/data/procedimientosMenoresData.json'), 'utf8');
              res.statusCode = 200;
              res.end(freshData);
            } catch (readErr) {
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, message: 'Sincronizado con éxito' }));
            }
          } else {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error || 'Error ejecutando Quirofanos-V3-juan.sql' }));
          }
        });
      });
    }
  };
}

export default defineConfig({ plugins: [sqlSyncAndAttendanceApi()] });
