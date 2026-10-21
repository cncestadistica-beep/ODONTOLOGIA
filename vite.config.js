import { spawn } from 'node:child_process';
import { defineConfig } from 'vite';

function attendanceDetailsApi() {
  return {
    name: 'attendance-details-api',
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
    }
  };
}

export default defineConfig({ plugins: [attendanceDetailsApi()] });
