# Sistema de Notificaciones Push

Este documento explica cómo configurar y usar el sistema de notificaciones push para campamentos y días festivos.

## Configuración

### Variables de Entorno Requeridas

Agrega estas variables al archivo `.env.local`:

```env
# VAPID Keys - Genera con web-push o en https://www.danioop.com/webpush-generator/
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here

# FCM (Firebase Cloud Messaging) - Opcional si usas FCM
FCM_SERVER_KEY=your_fcm_server_key_here
```

### Generar Claves VAPID

1. Instala `web-push` globalmente:
```bash
npm install -g web-push
```

2. Genera las claves:
```bash
web-push generate-vapid-keys
```

3. Copia los valores generados a `.env.local`

## Cómo Funciona

### 1. Suscripción del Usuario

Cuando un usuario instala la PWA y abre la app:
- El navegador solicita permiso para notificaciones
- Si el usuario acepta, se crea una suscripción push
- La suscripción se envía al servidor y se guarda en BD

### 2. Detección de Eventos

El servidor verifica cada día:
- **Campamentos a 7 días**: Envía notificación "Faltan 7 días para..."
- **Campamentos a 1 día**: Envía notificación "¡Mañana es...!"
- **Campamentos hoy**: Envía notificación "¡Hoy es...!"

### 3. Días Festivos

Se incluye una lista de días festivos argentinos. Cuando es festivo, se puede enviar una notificación especial.

## APIs

### POST /api/notifications/subscribe

Suscribirse a notificaciones push.

```javascript
const subscription = await registration.pushManager.getSubscription();

fetch('/api/notifications/subscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'subscribe',
    subscription: subscription.toJSON()
  })
});
```

### POST /api/notifications/send (Admin)

Verificar y enviar notificaciones pendientes.

```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token_aqui" \
  -d '{"action": "check"}'
```

## Pruebas

### Enviar Notificación de Prueba

Crea una rueda con 7 días de diferencia:

```javascript
// En la consola del navegador
const registration = await navigator.serviceWorker.ready;
const sub = await registration.pushManager.getSubscription();

// Simular un evento a 7 días
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 7);
const formatted = futureDate.toISOString().split('T')[0];

// Crear evento en el calendario con esa fecha
```

Luego, ejecuta:
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{"action": "check"}'
```

## Estructura de Base de Datos

### Tabla: push_subscriptions
- `id`: ID único
- `user_id`: ID del usuario (nullable)
- `endpoint`: URL de suscripción push
- `auth`: Clave de autenticación
- `p256dh`: Clave de encriptación
- `created_at`: Fecha de creación
- `updated_at`: Última actualización

### Tabla: notifications_sent
- `id`: ID único
- `event_type`: Tipo de evento (event_7days, event_1day, event_today)
- `event_id`: ID del evento del calendario
- `title`: Título de la notificación
- `body`: Cuerpo del mensaje
- `sent_at`: Fecha de envío
- `created_at`: Fecha de creación

### Tabla: holiday_dates
- `id`: ID único
- `date`: Fecha en formato YYYY-MM-DD
- `name`: Nombre del festivo
- `is_fixed`: 1 si es siempre en la misma fecha, 0 si es variable
- `month`: Mes (si es fijo)
- `day`: Día (si es fijo)

## Configuración de Cron Job (Vercel)

Para que las notificaciones se envíen automáticamente, configura un cron job en `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/notifications/send",
      "schedule": "0 8 * * *"
    }
  ]
}
```

Esto ejecutará `/api/notifications/send` a las 8:00 AM UTC todos los días.

## Arquitectura

```
Componentes:
├── Hooks
│   └── use-push-notifications.ts (Maneja suscripción en cliente)
├── Providers
│   └── push-notifications-provider.tsx (Iniciador global)
├── APIs
│   ├── /api/notifications/subscribe (POST - Suscribirse)
│   └── /api/notifications/send (POST - Enviar notificaciones)
├── Repositorio
│   └── notifications-repository.ts (BD)
└── Servicios
    ├── push-notification-service.ts (Envío de notificaciones)
    └── notification-scheduler.ts (Detección de eventos)
```

## Solución de Problemas

### No se reciben notificaciones
1. Verifica que tienes VAPID_PUBLIC_KEY configurado
2. Comprueba permisos en el navegador
3. Revisa la consola del navegador para errores
4. Asegúrate de que el service worker está registrado

### Notificaciones duplicadas
- El sistema verifica si ya fue enviada para evitar duplicados
- Si se duplican, limpia la tabla `notifications_sent`

### Permisos no solicitados
- El navegador solo solicita permiso si aún no se ha decidido
- Si el usuario rechazó antes, debe cambiar los permisos en la configuración del navegador
