// Arranque de desarrollo con un solo comando (`npm start`), en macOS, Windows y Linux.
// Solo usa módulos de Node: nada de comandos propios de bash o de cmd.

import { copyFileSync, existsSync, readFileSync, statSync } from 'node:fs';
import { execSync, spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const NODE_MINIMO = 20;
const PUERTO_VITE = 5173;

const color = (codigo) => (texto) => (process.stdout.isTTY ? `\x1b[${codigo}m${texto}\x1b[0m` : texto);
const verde = color(32);
const gris = color(90);
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

// Adaptadores que no son la red real (WSL, Hyper-V, VirtualBox, VMware, Docker, VPNs, AirDrop...).
const ADAPTADOR_VIRTUAL = /vethernet|virtualbox|vmware|vbox|docker|wsl|hyper-v|loopback|utun|bridge|awdl|llw|tailscale|zerotier|vpn/i;

function esIpPrivada(ip) {
  return /^192\.168\./.test(ip) || /^10\./.test(ip) || /^172\.(1[6-9]|2\d|3[01])\./.test(ip);
}

/** IP de esta PC en la red local (la que va en el QR). Se puede forzar con KITCH_IP_LAN en el .env. */
function detectarIpLan(env) {
  const forzada = process.env.KITCH_IP_LAN || env.KITCH_IP_LAN;
  if (forzada) return { ip: forzada, origen: 'KITCH_IP_LAN' };

  const candidatas = [];
  for (const [nombre, direcciones] of Object.entries(os.networkInterfaces())) {
    if (ADAPTADOR_VIRTUAL.test(nombre)) continue;
    for (const dir of direcciones ?? []) {
      if (dir.family === 'IPv4' && !dir.internal && esIpPrivada(dir.address)) {
        candidatas.push({ nombre, ip: dir.address });
      }
    }
  }
  // Preferencia: WiFi/Ethernet de macOS (en0, en1) o Windows (Wi-Fi, Ethernet) y redes hogareñas 192.168.x.
  const puntaje = ({ nombre, ip }) =>
    (/^(en\d|wi-?fi|wlan|ethernet|eth\d)/i.test(nombre) ? 2 : 0) + (ip.startsWith('192.168.') ? 1 : 0);
  candidatas.sort((a, b) => puntaje(b) - puntaje(a));
  return candidatas[0] ? { ip: candidatas[0].ip, origen: candidatas[0].nombre } : null;
}

async function main() {
  verificarNode();
  const env = asegurarEnv();
  asegurarDependencias();
  await verificarBackend(env.VITE_API_URL ?? 'http://localhost:3000');

  // La URL de los QR de las mesas usa la IP de la red para que el celular la pueda abrir.
  const red = detectarIpLan(env);
  const entornoVite = { ...process.env };
  if (red) {
    const urlRed = `http://${red.ip}:${PUERTO_VITE}`;
    entornoVite.VITE_PUBLIC_APP_URL = urlRed;
    ok(`Red local: ${red.ip} (${red.origen}). Los QR de las mesas apuntan a ${urlRed}`);
    console.log(gris('  Para probar desde el celular: conectalo a la misma red WiFi y escaneá el QR de Admin → Mesas.'));
    if (process.platform === 'win32') {
      console.log(
        gris('  Windows: si el Firewall pregunta por Node.js o Java, permití el acceso en redes "Privadas".'),
      );
      console.log(gris('  Y la red WiFi tiene que estar como "Privada" (Configuración → Red e Internet → Wi-Fi).'));
    } else if (process.platform === 'darwin') {
      console.log(gris('  macOS: si aparece "¿Permitir conexiones entrantes?" para node o java, elegí Permitir.'));
    }
  } else {
    aviso('No se detectó una red local: los QR van a apuntar a localhost (solo sirven en esta PC).');
  }

  const vite = spawn(bin('vite'), { shell: true, stdio: 'inherit', env: entornoVite });
  vite.on('exit', (code) => process.exit(code ?? 0));
  // Ctrl+C ya le llega a Vite desde la terminal; acá solo se espera a que cierre.
  process.on('SIGINT', () => {});
}

main();
