# Inscripciones a eventos: diseño

Estado: versión 2, con las respuestas de Agus del 7/10/2026. Sin código todavía.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Qué eventos tienen inscripción | Solo los que el admin marca (campamentos, jornadas...) |
| Quién inscribe a los chicos | Sus papás o adulto responsable, que pueden anotar a varios hijos |
| Quién más se inscribe | Adultos de las 5 áreas, animadores, servidores y mayores acompañantes, por el mismo formulario con un rol distinto |
| Cómo se identifica alguien que vuelve | Código por email, más un código de grupo IAM (ver abajo) |
| Pagos | No se cobra por la web; el admin marca el pago a mano |
| Autorizaciones | Firma electrónica en la web: una autorización por evento y otra de uso de imagen |
| Tally | Se deja de usar |
| Seguridad | Prioridad máxima: nada de datos expuestos en el navegador, nadie ve datos ajenos, cumplir la ley de datos personales para menores y mayores |

## Punto de partida (lo que hay hoy)

- La agenda vive en la tabla `agenda` (Turso).
- `/inscripciones` muestra todos los eventos futuros y abre un formulario de Tally, que no guarda nada en nuestra base.
- La tabla `users` es para el equipo que entra al admin, no para participantes.

## Cómo se identifica la gente: "cuenta familiar" con código por email

En vez de buscar por DNI, cada adulto entra con **su email**:

1. Pone su email y le llega un código de 6 números (vence en 10 minutos, máximo 5 intentos).
2. Con eso entra a su cuenta familiar, donde ve **solo** a él mismo y a los chicos que tiene a cargo.
3. Elige el evento, tilda a quiénes anota (él, sus hijos, o ambos), revisa los datos precargados y firma.

No hay contraseña que recordar ni que se pueda filtrar. Es el mismo sistema que usan los bancos para verificar.

**El código de cada IAM:** cada grupo o parroquia tiene un código que da su coordinador. Se pide **la primera vez** que una familia se registra, para:
- Saber a qué grupo pertenece cada chico (y que cada coordinador vea solo los inscriptos de su grupo).
- Frenar registros de gente que no tiene nada que ver con la IAM.

No sirve para entrar a la cuenta: como lo conoce todo el grupo, no protege los datos de una familia. Para eso está el código por email.

## Qué datos se guardan y dónde

### 1. Configuración por evento (`agenda_inscripcion`)
Una fila por evento con inscripción: habilitada, fechas de apertura y cierre, cupo y lista de espera, edades, roles permitidos (participante, área, animador, acompañante), si pide ficha de salud, preguntas propias del evento (talle, transporte...) y el texto de la autorización de ese evento.

### 2. Cuentas familiares (`cuentas`)
Email del adulto, fecha de alta y último ingreso. Sin contraseña.

### 3. Personas (`personas`)
Chicos y adultos: nombre, apellido, DNI, fecha de nacimiento, teléfono, localidad, grupo IAM, área (para adultos de las 5 áreas). Se relacionan con una o más cuentas (`cuenta_persona`), así dos papás separados pueden ver al mismo chico, cada uno desde su email.

### 4. Ficha de salud (`personas_salud`)
Obra social, alergias, medicación, dieta, condiciones. Guardada **cifrada** y con fecha de última confirmación.

### 5. Contactos de emergencia
Nombre, teléfono y vínculo, por persona.

### 6. Inscripciones (`inscripciones`)
Persona, evento, rol, estado (pendiente, confirmada, lista de espera, cancelada), respuestas propias del evento, pago (lo marca el admin), quién la hizo y una copia de los datos al momento de inscribirse.

### 7. Firmas (`firmas`)
Ver la sección siguiente.

## Campos del formulario (a partir del formulario actual)

Cada pregunta del formulario que usan hoy, ubicada en su lugar.

### Se cargan una vez y se precargan siempre (`personas`)
| Hoy | En el nuevo |
|---|---|
| ¿Cómo te llamás? / Apellido | Nombre, apellido |
| Sexo | Sexo |
| CUIL | CUIL (reemplaza al DNI como dato único; va cifrado) |
| Fecha de nacimiento | Fecha de nacimiento |
| Edad | **No se pregunta:** se calcula sola a la fecha del evento |
| Ciudad | Ciudad |
| ¿De qué IAM sos? | Grupo IAM (sale del código de grupo, no se escribe a mano) |
| ¿En qué grado estás? | Grado, con el año en que se cargó; cada año nuevo se pide confirmarlo |
| ¿A qué área pertenecés? | Área (solo adultos de área) |
| ¿Sos animador de? | Grupo o etapa que anima (solo animadores) |

### Ficha de salud, cifrada (`personas_salud`)
Cada condición queda como "Sí / No" y, si es sí, el detalle:
- Grupo sanguíneo
- Enfermedad crónica o condición médica
- Medicación
- Alergias
- Dieta especial o restricción alimentaria

### Contacto de emergencia
Nombre, teléfono y relación. Se precarga y se confirma en cada evento.

### Por evento (`inscripciones`)
- ¿Cómo participás? Es el rol: participante, área, animador, acompañante. Según lo que elija se muestran las preguntas de área o de animador.
- ¿Llevás tu propia comida? Se pregunta solo si marcó dieta especial.
- Preguntas extra que el admin agregue para ese evento.

### Recomiendo agregar
- **Obra social y número de afiliado:** en un campamento es lo primero que piden en una guardia.
- **Adulto responsable de cada chico** (nombre, teléfono, vínculo): sale de la cuenta familiar y es quien firma.

### Recomiendo sacar
- **Edad**, porque se calcula.
- **El campo para subir archivo:** era la autorización de menores, que ahora se firma en la web.
- **"¿Qué IAM sos?":** estaba duplicada con "¿De qué IAM sos?".

## Firma de autorizaciones

Son dos documentos:

1. **Autorización del evento:** una por chico y por evento. Sin esta firma la inscripción queda "pendiente de autorización".
2. **Uso de imagen:** una por persona, vale por el año y se puede revocar desde la cuenta. Es opcional: si el adulto dice que no, el chico se inscribe igual y en la lista del admin aparece marcado "sin permiso de imagen" para que comunicación no publique sus fotos.

Cómo se firma:
- El adulto ya entró con el código de su email, así que está identificado.
- Lee el texto completo, escribe nombre y DNI, tilda "Leí y acepto" y firma con el dedo o el mouse.
- Se guarda: quién firmó, a qué chico y evento corresponde, fecha y hora, desde qué dispositivo, la firma dibujada y una huella (hash) del texto exacto que aceptó.
- Se genera un PDF con todo eso, se le manda por email y queda disponible en el admin.

Nota legal: esto es **firma electrónica** (Ley 25.506). La "firma digital" con validez plena requiere un certificado oficial, que sería imposible de pedir a cada familia. La firma electrónica con verificación por email es válida y es lo que usan la mayoría de los colegios y clubes. Conviene que alguien de la diócesis o un abogado revise el texto de las dos autorizaciones antes de usarlas.

## Cómo se inscribe alguien

1. `/inscripciones` muestra solo los eventos abiertos.
2. Elige el evento y pone su email; recibe el código.
3. **Primera vez:** pone el código de su IAM y carga sus datos y los de sus chicos una vez.
4. **Ya registrado:** ve a su familia con los datos precargados. Cada bloque tiene "Sigue igual" o "Editar". La ficha de salud siempre pide confirmar que está actualizada.
5. Tilda a quiénes anota y con qué rol, contesta las preguntas del evento.
6. Firma la autorización del evento (y la de imagen si no la firmó este año).
7. Recibe email de confirmación con el PDF firmado.

## Qué se ve en el admin

- Interruptor "Tiene inscripción" en el editor de agenda, con su configuración.
- Por evento: inscriptos con filtros (rol, área, grupo, edad, pago, autorización firmada, permiso de imagen), cupo, lista de espera y exportar a Excel.
- Coordinadores de grupo: ven solo a su grupo.
- **Resumen del evento**, con totales que se actualizan solos con cada inscripción:
  - Por rol: chicos, adultos de área (y cuántos de cada una de las 5 áreas), animadores, padres y acompañantes.
  - Chicos por grado escolar.
  - Inscriptos por IAM y por ciudad.
  - Por sexo, útil para armar habitaciones o carpas.
  - Para cocina: cuántas dietas especiales y de qué tipo, y cuántos llevan su comida.
  - Para enfermería: cuántos tienen alergias, medicación o condición médica (solo el número; los nombres siguen protegidos en las fichas).
  - Pendientes: autorizaciones sin firmar, pagos sin marcar y cuántos no dieron permiso de imagen.
  - Cupo usado y lista de espera.
  - Cada número se puede tocar para ver la lista de esas personas, respetando los permisos de cada rol, y todo el resumen se puede exportar a Excel.
- **Vista de logística** (para el área de logística y el admin), pensada para calcular la comida:
  - Una tabla con una fila por IAM y estas columnas: 1° y 2° grado, 3° y 4° grado, todos los demás (chicos más grandes y adultos) y total. Al final, una fila con los totales generales.
  - Los grupos de grados se configuran por evento, por si algún campamento necesita cortarlos distinto.
  - Debajo, la lista de **alergias y dietas** con nombre, IAM y qué tiene, para que cocina sepa a quién separarle el plato.
  - Y la lista de **enfermedades o condiciones médicas** con nombre, IAM y detalle.
  - Esta vista muestra solo lo necesario para logística: no muestra CUIL, contactos ni medicación (eso queda para enfermería). Cada vez que alguien la abre o la imprime queda registrado.
- Fichas de salud: solo admin y quien esté a cargo del evento, y cada vez que alguien las abre queda registrado en la auditoría.

## Seguridad

### Que nada se exponga en el navegador
- Todos los datos se leen y se filtran en el servidor. El navegador recibe únicamente lo que esa cuenta tiene permiso de ver, nunca listas completas para filtrar del lado del cliente.
- Cada pedido verifica que la persona pertenezca a la cuenta que pregunta. Cambiar un número en la dirección o en un pedido no muestra a otro chico.
- Los identificadores son aleatorios (no 1, 2, 3...), para que no se puedan adivinar.
- Nunca hay datos personales en las URLs, ni en los mensajes de error, ni en los registros del servidor.
- El chat con IA que tiene el sitio no tiene acceso a esta base.

### Acceso
- Sesión en cookie segura que JavaScript no puede leer, con vencimiento.
- Límite de intentos para pedir y usar códigos (ya tienen Upstash para esto).
- Al pedir un código, la respuesta es igual exista o no el email, para que nadie pueda averiguar quién está registrado.
- Admin y coordinadores con verificación en dos pasos.

### Datos guardados
- DNI y ficha de salud cifrados en la base; aunque alguien obtuviera una copia, no podría leerlos.
- Copias de seguridad cifradas.
- Se piden solo los datos necesarios.
- Las copias de fichas de salud de cada evento se borran unos meses después de terminado (sugiero 6).

### Ley de datos personales (Argentina)
- Ley 25.326 y su reglamentación, más el Código Civil y Comercial para menores y uso de imagen (art. 53).
- Política de privacidad clara en la web: qué se guarda, para qué, cuánto tiempo y a quién escribir.
- Consentimiento explícito al registrarse, dado por el adulto responsable en el caso de menores.
- Desde la cuenta, cada familia puede ver, corregir, descargar y pedir que se borren sus datos.
- La base de datos debe inscribirse en el Registro Nacional de Bases de Datos de la Agencia de Acceso a la Información Pública (trámite gratuito, online).
- Si en algún momento hubiera una filtración, hay que poder avisar a las familias: lo dejamos previsto.

## Datos iniciales

Sin Tally, la base arranca vacía y se va llenando con cada inscripción. Si tenés planillas de Excel de campamentos anteriores, se pueden importar, pero las familias igual tendrían que entrar con su email para confirmar los datos y firmar. Recomiendo arrancar vacío y simple.

## Preguntas que quedan

1. **Códigos de IAM:** ¿cuántos grupos son y quién los reparte? Recomiendo que lo genere el admin y lo pase a cada coordinador.
2. **Edad de los adultos que se anotan solos:** ¿desde los 18? Recomiendo 18; los de 16 y 17 los anota un adulto responsable.

## Orden sugerido para construirlo

1. Base de datos, cuentas familiares con código por email y medidas de seguridad.
2. Interruptor en la agenda y formulario de inscripción.
3. Firma de las dos autorizaciones y PDF.
4. Panel del admin, exportar a Excel, cupo y lista de espera.
5. Política de privacidad, derechos de las familias y registro de la base.
