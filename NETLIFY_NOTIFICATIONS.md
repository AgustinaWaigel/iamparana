# Configuración de Notificaciones Push en Netlify

## Tipos de Notificaciones

Tu aplicación envía notificaciones push en dos casos:

### 1. **Noticias Nuevas** (Automático)
- Se envía **inmediatamente** cuando un admin publica una noticia
- Título: "Nueva noticia: [título de la noticia]"
- Descripción: La bajada o descripción de la noticia
- El usuario puede clickear para ir a leerla

### 2. **Eventos de Agenda** (Scheduled diariamente)
- Se ejecuta **diariamente** a las 00:00 UTC
- Notificación 7 días antes del evento
- Notificación 1 día antes del evento
- Notificación el día del evento
- Respeta días festivos registrados

## Configuración de Netlify

### Funciones Serverless Configuradas

**`netlify/functions/check-notifications.ts`**
- Se ejecuta **diariamente** (configurable)
- Verifica eventos con 7 días, 1 día y hoy
- Verifica días festivos
- Envía notificaciones a todos los usuarios suscritos

**`src/app/api/admin/noticias/route.ts` (POST)**
- Intercepta la creación de nuevas noticias
- Envía notificación push a todos los suscriptos
- No bloquea si falla la notificación (se crea la noticia igual)

### Variables de Entorno en Netlify

Asegúrate de que en tu dashboard de Netlify tengas configuradas estas variables:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BOlYBNxeoCb5NhzkZF0HYFittsyVkyJawfOc5n8bnoXxTF0P0mYfH9E3brHpI0beNfkegbjmelKXokvlxJo3IiY
VAPID_PRIVATE_KEY=ymbaYLroJBi8RhSqR7dYtnNwEZgKjELmUJ_PZCLt4iM
TURSO_CONNECTION_URL=libsql://iamparana-agustinawaigel.aws-eu-west-1.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
FCM_SERVER_KEY=your_fcm_key (opcional)
```

### Horario de Ejecución

La función se ejecuta **diariamente a las 00:00 UTC**. 

Para cambiar el horario, edita `netlify/functions/check-notifications.ts`:

```typescript
export const config = {
  schedule: "@daily", // O especifica horario: "0 8 * * *" (8 AM UTC)
};
```

Formatos soportados en Netlify Scheduled Functions:
- `@hourly` - Cada hora
- `@daily` - Cada día
- `@weekly` - Cada semana
- `@monthly` - Cada mes
- Cron: `"0 8 * * *"` (8:00 AM UTC todos los días)
3. Ve la pestaña "Invocations" para ver historial

### Verificación Manual

Si quieres probar la función, puedes hacer:

```bash
curl -X POST https://tu-dominio.netlify.app/.netlify/functions/check-notifications \
  -H "Authorization: Bearer tu_token"
```

O directamente en la URL (sin autenticación en desarrollo):
```
https://tu-dominio.netlify.app/.netlify/functions/check-notifications
```

### Headers Configurados

Se agregaron headers especiales en `netlify.toml` para que el Service Worker funcione correctamente:

```
/sw.js → Cache-Control: max-age=0 (sin cachear)
/workbox-*.js → Cache-Control: max-age=1 año (inmutable)
/manifest.json → Cache-Control: max-age=1 hora
```

### Flujo Completo

1. **Usuario instala la PWA** → Se suscribe a notificaciones
2. **Diariamente**, la función `check-notifications` se ejecuta
3. **Verifica** si hay eventos próximos o días festivos
4. **Envía notificaciones push** a todos los usuarios suscritos
5. **Registra** para evitar duplicados

### Solución de Problemas

#### Las notificaciones no se envían
- Verifica que la función se ejecutó en Netlify Logs
- Comprueba que VAPID_PRIVATE_KEY está configurado
- Verifica que los usuarios se suscribieron (tabla `push_subscriptions`)

#### Error: "Build failed"
- Asegúrate de tener TypeScript correctamente configurado
- Netlify debería compilar automáticamente con `@netlify/plugin-nextjs`

#### La función falla
- Verifica que tu base de datos Turso está disponible
- Comprueba TURSO_CONNECTION_URL y TURSO_AUTH_TOKEN

### Actualizar la Lógica de Notificaciones

Para cambiar cuándo se envían notificaciones, edita `src/server/lib/notification-scheduler.ts`:

```typescript
// Cambiar días de anticipación
if (daysUntil === 7) { ... }  // 7 días antes
if (daysUntil === 1) { ... }  // 1 día antes
if (daysUntil === 0) { ... }  // Hoy
```

### Próximos Cambios

Si necesitas:
- **Más frecuencia**: Cambia `@daily` a `@hourly`
- **Diferente horario**: Usa cron como `"0 8 * * *"`
- **Notificaciones por rol**: Modifica `getAllPushSubscriptions()` en `notifications-repository.ts`
- **Mensajes personalizados**: Edita templates en `notification-scheduler.ts`

---

✅ **Estado**: Sistema completamente configurado para Netlify
🚀 **Próximo paso**: Haz push a tu repositorio y verifica los logs en Netlify Dashboard
