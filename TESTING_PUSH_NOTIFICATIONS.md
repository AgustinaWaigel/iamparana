# Testing Push Notifications

## Verificar que las notificaciones funcionen correctamente

### 1. Abrir la aplicación
- Abre http://localhost:3000 en tu navegador
- Abre la consola del navegador (F12)

### 2. Permitir notificaciones
- Cuando el sitio cargue, deberías ver un prompt solicitando permiso para notificaciones
- Haz clic en "Permitir"
- En la consola deberías ver logs como:
  ```
  ✅ Service Worker registered (workbox)
  ✅ Custom push handler registered
  ✅ Service Worker is active
  ✅ Push subscription created
  ```

### 3. Verificar que la suscripción se guardó
- En la consola, busca: `✅ Push subscription created` o `✅ Existing push subscription`
- Si ves esto, la suscripción fue exitosa

### 4. Crear una nueva noticia para testear
- Ve a la sección de Admin
- Ve a "Noticias" → "Crear Noticia"
- Rellena los datos:
  - Título: "Noticia de Prueba"
  - Descripción: "Esta es una noticia de prueba"
  - Contenido: "Test"
  - Imagen: Sube una imagen
- Haz clic en "Crear"

### 5. Verificar que la notificación se envió
- En la consola del servidor (terminal), deberías ver:
  ```
  📢 Sending notification to X subscribers...
  ✅ Push notification sent to: <endpoint>
  ✅ Notifications sent: X/X
  ```

### 6. Recibir la notificación
- Si el navegador está en segundo plano, recibirás una notificación del sistema
- Si está en primer plano, verás la notificación en el Service Worker
- Haz clic en la notificación para abrir la noticia

## Solucionar problemas

### Si no ves el prompt de notificaciones
- Verifica que la consola no muestre errores en rojo
- Revisa que los Service Workers se hayan registrado exitosamente
- Comprueba que VAPID keys estén configuradas en .env.local

### Si ves error "VAPID private key not configured"
- Revisa que estas variables estén en .env.local:
  ```
  NEXT_PUBLIC_VAPID_PUBLIC_KEY=BG-V4CQg-9bvQzpb6ntQH2qACfNM7DPH6Ff5huBxO3gAvMMe4tFtIKW57fI6jPkyfXJltg4YrXBSwKkK7OwpOF8
  VAPID_PRIVATE_KEY=vLmybThzufBPqnd3_HbBsCBkkYM782KI4DbY_2j0dRs
  ```

### Si las notificaciones no se envían
- Verifica que el servidor esté recibiendo las VAPID keys en el log inicial
- Comprueba que `console.log("✅ Web Push configured with VAPID keys")` aparezca en el servidor

## Variables de Entorno Importantes

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BG-V4CQg-9bvQzpb6ntQH2qACfNM7DPH6Ff5huBxO3gAvMMe4tFtIKW57fI6jPkyfXJltg4YrXBSwKkK7OwpOF8
VAPID_PRIVATE_KEY=vLmybThzufBPqnd3_HbBsCBkkYM782KI4DbY_2j0dRs
```

Estas ya están configuradas en tu .env.local local.

Para producción (Netlify), agrega estas variables en:
- Sitio → Site Settings → Build & Deploy → Environment
