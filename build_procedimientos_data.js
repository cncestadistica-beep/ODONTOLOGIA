import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('--- Sincronizando datos de Procedimientos Menores (Quirofanos-V3-juan.sql) ---');

try {
  // Ejecuta la sincronización directa con PostgreSQL
  console.log('Ejecutando scripts/sync_procedimientos_menores.py contra PostgreSQL...');
  execSync('python scripts/sync_procedimientos_menores.py', { stdio: 'inherit' });
  console.log('✓ Sincronización finalizada exitosamente.');
} catch (error) {
  console.error('Error al ejecutar la sincronización con PostgreSQL:', error.message);
  process.exit(1);
}
