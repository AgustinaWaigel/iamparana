// Genera la credencial para que el sitio pueda ENVIAR emails (códigos de acceso,
// recuperación de contraseña, avisos). El permiso que pide es solo "enviar correo":
// no permite leer ni borrar mensajes.
//
// Uso:
//   node scripts/gmail-token.mjs
//   node scripts/gmail-token.mjs cuenta@gmail.com   (además deja esa cuenta como GMAIL_FROM)
//
// Antes de correrlo, en Google Cloud (el mismo proyecto de GOOGLE_CLIENT_ID):
//   1. APIs y servicios → Biblioteca → habilitar "Gmail API".
//   2. Credenciales → tu cliente OAuth → agregar como URI de redirección autorizada:
//        http://localhost:53682/oauth2callback
//      (si el cliente es de tipo "App de escritorio" este paso no hace falta).
//
// Al abrir el enlace, entrá con la cuenta de GMAIL_FROM. El script guarda
// GMAIL_REFRESH_TOKEN en .env.local; después cargá el mismo valor en el hosting.

import fs from 'node:fs';
import http from 'node:http';
import crypto from 'node:crypto';

const ENV_FILE = '.env.local';
const PORT = 53682;
const REDIRECT = `http://localhost:${PORT}/oauth2callback`;
const SCOPE = 'https://www.googleapis.com/auth/gmail.send';

const envText = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : '';
const env = Object.fromEntries(
  envText.split(/\r?\n/).filter((line) => line.includes('=') && !line.trim().startsWith('#'))
    .map((line) => [line.slice(0, line.indexOf('=')).trim(), line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]),
);

const { GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret } = env;
// Si se pasa una dirección, además de generar la credencial queda como GMAIL_FROM.
const newFrom = process.argv[2]?.trim().toLowerCase();
if (newFrom && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newFrom)) {
  console.error('Esa dirección no parece un email válido.');
  process.exit(1);
}
const from = newFrom || env.GMAIL_FROM;
if (!clientId || !clientSecret || !from) {
  console.error('Faltan GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET o GMAIL_FROM en .env.local');
  process.exit(1);
}

const state = crypto.randomBytes(16).toString('hex');
const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.search = new URLSearchParams({
  client_id: clientId,
  redirect_uri: REDIRECT,
  response_type: 'code',
  scope: SCOPE,
  access_type: 'offline',
  prompt: 'consent',
  login_hint: from,
  state,
}).toString();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT);
  if (url.pathname !== '/oauth2callback') { res.writeHead(404).end(); return; }

  const finish = (code, message) => {
    res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<body style="font-family:sans-serif;padding:40px"><h2>${message}</h2><p>Ya podés cerrar esta pestaña y volver a la terminal.</p></body>`);
    server.close();
  };

  if (url.searchParams.get('state') !== state || !url.searchParams.get('code')) {
    console.error('\nGoogle no devolvió un código válido:', url.searchParams.get('error') || 'respuesta inesperada');
    finish(400, 'No se pudo autorizar');
    process.exitCode = 1;
    return;
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code: url.searchParams.get('code'), client_id: clientId, client_secret: clientSecret, redirect_uri: REDIRECT, grant_type: 'authorization_code' }),
  });
  const data = await response.json();

  if (!response.ok || !data.refresh_token) {
    console.error('\nNo se obtuvo la credencial:', data.error_description || data.error || 'Google no envió refresh_token');
    finish(500, 'No se pudo obtener la credencial');
    process.exitCode = 1;
    return;
  }

  // Se guarda en .env.local sin mostrarla en pantalla.
  const line = `GMAIL_REFRESH_TOKEN=${data.refresh_token}`;
  let next = /^GMAIL_REFRESH_TOKEN=.*$/m.test(envText)
    ? envText.replace(/^GMAIL_REFRESH_TOKEN=.*$/m, () => line)
    : `${envText.replace(/\s*$/, '')}\n\n# Envío de emails (solo permiso de enviar). Generado con scripts/gmail-token.mjs\n${line}\n`;
  if (newFrom) {
    next = /^GMAIL_FROM=.*$/m.test(next)
      ? next.replace(/^GMAIL_FROM=.*$/m, () => `GMAIL_FROM=${newFrom}`)
      : `${next.replace(/\s*$/, '')}\nGMAIL_FROM=${newFrom}\n`;
  }
  fs.writeFileSync(ENV_FILE, next);

  console.log('\nListo: GMAIL_REFRESH_TOKEN quedó guardado en .env.local.');
  if (newFrom) console.log(`GMAIL_FROM quedó en ${newFrom}.`);
  console.log('Reiniciá el servidor de desarrollo y cargá la misma variable en el hosting.');
  finish(200, 'Autorización completa');
});

server.on('error', (error) => {
  console.error(`No se pudo abrir el puerto ${PORT}:`, error.message);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Abrí este enlace en el navegador y entrá con ${from}:\n`);
  console.log(authUrl.toString());
  console.log('\nEsperando la autorización... (Ctrl+C para cancelar)');
});
