#!/usr/bin/env node

/**
 * Script para generar claves VAPID para Web Push
 * Uso: node scripts/generate-vapid-keys.js
 */

const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

// Generar claves VAPID
const vapidKeys = webpush.generateVAPIDKeys();

console.log('🔑 Generadas nuevas claves VAPID:');
console.log('');
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY:');
console.log(vapidKeys.publicKey);
console.log('');
console.log('VAPID_PRIVATE_KEY:');
console.log(vapidKeys.privateKey);
console.log('');
console.log('='.repeat(80));
console.log('');
console.log('Copia estas claves en tu archivo .env.local:');
console.log('');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('');
console.log('O en Netlify, agrega estas variables de entorno en la configuración del sitio.');
console.log('');
