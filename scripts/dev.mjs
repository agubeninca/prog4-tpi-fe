import { existsSync } from 'node:fs';
import { execSync, spawn } from 'node:child_process';

function asegurarDependencias() {
  if (!existsSync('node_modules')) {
    console.log('Dependencias no instaladas, corriendo npm install...');
    execSync('npm install', { stdio: 'inherit' });
  } else {
    console.log('Dependencias ya instaladas.');
  }
}

asegurarDependencias();

const child = spawn('npx vite', { stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code ?? 0));
