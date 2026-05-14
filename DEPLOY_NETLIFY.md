# Guía de Despliegue en Netlify - Notificaciones Push

## Paso a Paso para Activar Notificaciones en Netlify

### 1. Variables de Entorno en Netlify Dashboard

Ve a: **Site settings → Build & deploy → Environment**

Asegúrate de que estas variables estén presente:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
TURSO_CONNECTION_URL
TURSO_AUTH_TOKEN
NEXT_PUBLIC_APP_URL=https://tu-dominio.netlify.app (o iamparana.com.ar)
```

Si no las ves, agrégalas manualmente.

### 2. Push a tu Repositorio

```bash
cd c:\Users\agusw\OneDrive\Documentos\iamparana\iamparana
git add .
git commit -m "feat: add push notifications system with Netlify scheduled functions"
git push
```

### 3. Verificar Despliegue

- Ve a tu dashboard de Netlify
- Espera a que se complete el build
- Si hay error, verifica los logs: **Deploys → Mostrar detalles → Build log**

### 4. Probar Funciones Scheduled

Una vez desplegado:

1. **Verifica que la función está disponible**:
   ```
   https://tu-dominio.netlify.app/.netlify/functions/check-notifications
   ```

2. **Ve a los logs de la función**:
   - Dashboard → Funciones → check-notifications
   - Pestaña "Invocations"

3. **Verifica la próxima ejecución programada**:
   - Dashboard → Funciones → check-notifications  
   - Verás "Runs daily at 00:00 UTC"

### 5. Prueba Completa

Para asegurar que todo funciona:

1. **Instala la PWA** en tu móvil:
   - Abre https://iamparana.com.ar en Chrome/Safari
   - Toca "Instalar" o "Agregar a pantalla de inicio"
   - Acepta notificaciones cuando se solicite

2. **Crea un evento de prueba** a 7 días:
   - Ve a Admin → Calendario
   - Crea un evento con fecha = Hoy + 7 días

3. **Ejecuta la función manualmente**:
   ```bash
   curl https://tu-dominio.netlify.app/.netlify/functions/check-notifications
   ```

4. **Revisa los logs** en Netlify:
   - Deberías ver que se enviaron notificaciones
   - Si hay errores, aparecerán en los logs

### 6. Configurar Dominio Personalizado

Si usas `iamparana.com.ar`:

1. Ve a **Site settings → Domain management**
2. Si es tu primer dominio personalizado:
   - Agrega dominio
   - Sigue instrucciones para DNS
3. Si ya tienes el dominio vinculado, actualiza `NEXT_PUBLIC_APP_URL` en variables de entorno

### 7. Cambiar Horario de Ejecución

La función se ejecuta a las **00:00 UTC** (medianoche UTC).

Para cambiar a otra hora (ej: 8 AM UTC):
- Edita `netlify/functions/check-notifications.ts`
- Cambia `schedule: "@daily"` a `schedule: "0 8 * * *"`
- Haz push al repo

Opciones comunes:
- `"0 8 * * *"` → 8 AM UTC = 5 AM ART (Argentina)
- `"0 12 * * *"` → 12 PM UTC = 9 AM ART
- `"0 14 * * *"` → 2 PM UTC = 11 AM ART
- `"0 18 * * *"` → 6 PM UTC = 3 PM ART

**Nota**: Argentina en invierno es UTC-3 (ART), en verano es UTC-2 (ARST)

### 8. Verificar que las Notificaciones se Guardan

Conéctate a tu BD Turso y verifica:

```sql
-- Ver suscripciones
SELECT COUNT(*) as total_suscripciones FROM push_subscriptions;

-- Ver notificaciones enviadas
SELECT * FROM notifications_sent ORDER BY created_at DESC LIMIT 10;

-- Ver registros de eventos
SELECT id, evento, fecha FROM agenda WHERE fecha >= date('now') ORDER BY fecha ASC;
```

### 9. Troubleshooting

#### "Build failed"
```
Error: Cannot find module
```
**Solución**: Asegúrate de que `@netlify/plugin-nextjs` está en package.json
```bash
npm install @netlify/plugin-nextjs
```

#### "Function timed out"
- La función tardó más de 26 segundos
- Verifica que Turso está respondiendo
- Reduce la cantidad de suscripciones en un test

#### "VAPID key error"
- Verifica que VAPID_PRIVATE_KEY está correctamente configurado
- No debe tener espacios extras ni saltos de línea

#### "No se envían notificaciones"
1. Verifica que hay usuarios suscritos (tabla `push_subscriptions`)
2. Verifica que hay eventos próximos
3. Revisa los logs de la función en Netlify
4. Comprueba que VAPID_PRIVATE_KEY es válido

### 10. Monitoreo

**Cada día**, verifica:

1. **Logs de función**:
   - Dashboard → Funciones → check-notifications → Invocations
   - Debe haber una invocación a las 00:00 UTC

2. **Notificaciones enviadas**:
   - Query: `SELECT COUNT(*) FROM notifications_sent WHERE created_at > datetime('now', '-1 day')`
   - Debería > 0 si hay eventos próximos

3. **Errores**:
   - Si la función falla, aparecerá en logs rojo

### Rollback (si algo falla)

Si necesitas desactivar las notificaciones temporalmente:

```bash
# Revert último commit
git revert HEAD
git push
```

O simplemente comenta la línea de schedule:
```typescript
// export const config = {
//   schedule: "@daily",
// };
```

---

✅ **Listo para producción**
🎯 **Usuarios recibirán notificaciones automáticas** todos los días
📱 **Completamente offline-first** con Service Worker
