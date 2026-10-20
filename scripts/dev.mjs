// Arranque de desarrollo con un solo comando (`npm start`), en macOS, Windows y Linux.
// Solo usa módulos de Node: nada de comandos propios de bash o de cmd.

import { copyFileSync, existsSync, readFileSync, statSync } from 'node:fs';
import { execSync, spawn } from 'node:child_process';
import path from 'node:path';

const NODE_MINIMO = 20;

const color = (codigo) => (texto) => (process.stdout.isTTY ? `\x1b[${codigo}m${texto}\x1b[0m` : texto);
const verde = color(32);
const amarillo = color(33);
const rojo = color(31);

const ok = (msg) => console.log(`${verde('✔')} ${msg}`);
const aviso = (msg) => console.log(`${amarillo('!')} ${msg}`);

/** Binario local de node_modules/.bin (en Windows, el shell resuelve el .cmd). */
const bin = (nombre) => path.join('node_modules', '.bin', nombre);

function verificarNode() {
  const mayor = Number(process.versions.node.split('.')[0]);
  if (mayor < NODE_MINIMO) {
    console.error(`\n${rojo('✖')} Se necesita Node ${NODE_MINIMO} o superior (tenés ${process.versions.node}).`);
    console.error('  Instalalo desde https://nodejs.org (versión LTS).\n');
    process.exit(1);
  }
  ok(`Node ${process.versions.node}`);
}

function claves(archivo) {
  return readFileSync(archivo, 'utf-8')
    .split(/\r?\n/)
    .map((linea) => linea.match(/^\s*([A-Z0-9_]+)\s*=/)?.[1])
    .filter(Boolean);
}

function leerEnv() {
  const variables = {};
  for (const linea of readFileSync('.env', 'utf-8').split(/\r?\n/)) {
    const coincidencia = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (coincidencia) variables[coincidencia[1]] = coincidencia[2].replace(/^["']|["']$/g, '');
  }
  return variables;
}

// Los valores de .env.example sirven tal cual para desarrollo local: si falta el .env, se copia.
function asegurarEnv() {
  if (!existsSync('.env')) {
    copyFileSync('.env.example', '.env');
    aviso('No había .env: se creó a partir de .env.example');
  }
  const presentes = new Set(claves('.env'));
  const faltantes = claves('.env.example').filter((clave) => !presentes.has(clave));
  if (faltantes.length > 0) {
    aviso(`Al .env le faltan variables que sí están en .env.example: ${faltantes.join(', ')}. Copialas de ahí.`);
  }
  ok('.env');
  return leerEnv();
}

function asegurarDependencias() {
  const marca = 'node_modules/.package-lock.json';
  const desactualizadas = existsSync(marca) && statSync('package-lock.json').mtimeMs > statSync(marca).mtimeMs;
  if (!existsSync('node_modules') || desactualizadas) {
    aviso(desactualizadas ? 'package-lock.json cambió: actualizando dependencias...' : 'Instalando dependencias...');
    execSync('npm install', { stdio: 'inherit' });
  }
  ok('Dependencias instaladas');
}

/** No bloquea: el front puede arrancar antes que el back, pero conviene avisar. */
async function verificarBackend(apiUrl) {
  try {
    await fetch(apiUrl, { signal: AbortSignal.timeout(2000) });
    ok(`Backend respondiendo en ${apiUrl}`);
  } catch {
    aviso(`El backend no responde en ${apiUrl}. Levantalo con "npm start" en prog4-tp-int-be.`);
  }
}

async function main() {
  verificarNode();
  const env = asegurarEnv();
  asegurarDependencias();
  await verificarBackend(env.VITE_API_URL ?? 'http://localhost:3000');

  const vite = spawn(bin('vite'), { shell: true, stdio: 'inherit' });
  vite.on('exit', (code) => process.exit(code ?? 0));
  // Ctrl+C ya le llega a Vite desde la terminal; acá solo se espera a que cierre.
  process.on('SIGINT', () => {});
}

main();
