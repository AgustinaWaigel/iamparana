import "server-only";
import { google } from "googleapis";
import nodemailer from "nodemailer";
import { CONTACTO_EMAIL } from "@/lib/contacto";

// El envío usa la API de Gmail por HTTPS con una credencial que solo puede ENVIAR
// correo (permiso gmail.send). Antes se usaba SMTP con la credencial de Drive, que
// no tiene permiso de correo: Gmail cerraba la conexión y ningún email salía.
//
// GMAIL_REFRESH_TOKEN se genera con `node scripts/gmail-token.mjs`, entrando con la
// cuenta de GMAIL_FROM.
function createTransporter() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const from = process.env.GMAIL_FROM;

  if (!clientId || !clientSecret || !from) {
    throw new Error("Faltan variables de entorno de email: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GMAIL_FROM");
  }
  if (!refreshToken) {
    throw new Error("Falta GMAIL_REFRESH_TOKEN. Generalo con: node scripts/gmail-token.mjs");
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
  const gmail = google.gmail({ version: "v1", auth });
  // nodemailer solo arma el mensaje (cabeceras, HTML y texto); no abre ninguna conexión.
  const builder = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: "unix" });

  return {
    async sendMail(message: { from: string; to: string; subject: string; html: string; text: string; replyTo?: string; attachments?: Array<{ filename: string; content: Buffer; contentType: string }> }) {
      // Las respuestas van al mail de contacto, no a la cuenta que envía.
      const built = await builder.sendMail({ replyTo: CONTACTO_EMAIL, ...message });
      await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw: (built.message as Buffer).toString("base64url") },
      });
    },
  };
}

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
  nombreUsuario?: string
) {
  const from = process.env.GMAIL_FROM;
  if (!from) throw new Error("GMAIL_FROM no configurado");

  const transporter = createTransporter();

  const nombre = nombreUsuario || to.split("@")[0];

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recuperar contraseña — IAM Paraná</title>
</head>
<body style="margin:0;padding:0;background:#f5f0ea;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#622d0d;padding:32px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:28px;">🔐</p>
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">
                Recuperar contraseña
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,220,190,0.8);font-size:13px;">
                Panel IAM — Arquidiócesis de Paraná
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;color:#44332a;font-size:15px;line-height:1.6;">
                Hola <strong>${nombre}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#6b5c53;font-size:14px;line-height:1.7;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en el panel administrativo de IAM Paraná. Hacé clic en el botón para crear una nueva contraseña:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${resetLink}" 
                       style="display:inline-block;background:#622d0d;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.2px;">
                      Restablecer contraseña →
                    </a>
                  </td>
                </tr>
              </table>
              <div style="background:#fef9f5;border:1px solid #f0e6da;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#622d0d;text-transform:uppercase;letter-spacing:0.5px;">
                  ⏱ Este link expira en 1 hora
                </p>
                <p style="margin:0;font-size:13px;color:#8a7269;line-height:1.5;">
                  Si no solicitaste este cambio, podés ignorar este email. Tu contraseña actual no se verá afectada.
                </p>
              </div>
              <p style="margin:0;font-size:12px;color:#b8a9a0;line-height:1.6;">
                Si el botón no funciona, copiá y pegá este link en tu navegador:<br/>
                <span style="color:#622d0d;word-break:break-all;">${resetLink}</span>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f0ece8;text-align:center;">
              <p style="margin:0;font-size:11px;color:#c4b8b0;letter-spacing:0.15em;text-transform:uppercase;">
                Área de Comunicación • Arquidiócesis de Paraná
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  await transporter.sendMail({
    from: `"IAM Paraná" <${from}>`,
    to,
    subject: "Restablecer contraseña — Panel IAM",
    html,
    text: `Hola ${nombre},\n\nRecibimos una solicitud para restablecer tu contraseña.\n\nHacé clic en este link (válido por 1 hora):\n${resetLink}\n\nSi no solicitaste este cambio, ignorá este email.\n\n— Área de Comunicación, Arquidiócesis de Paraná`,
  });
}

/**
 * Código de acceso a la cuenta familiar de inscripciones.
 * El email no lleva enlaces: solo el código, para que no se pueda usar como phishing.
 */
export async function sendAccessCodeEmail(to: string, code: string, minutes: number) {
  const from = process.env.GMAIL_FROM;
  if (!from) throw new Error("GMAIL_FROM no configurado");

  const transporter = createTransporter();

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tu código de acceso — IAM Paraná</title>
</head>
<body style="margin:0;padding:0;background:#fbf8f3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#3a1508;padding:28px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Tu código de acceso</h1>
              <p style="margin:6px 0 0;color:#f4cd74;font-size:13px;">Inscripciones — IAM Paraná</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 20px;color:#2c1d11;font-size:15px;line-height:1.6;">
                Usá este código para entrar a tu cuenta familiar:
              </p>
              <p style="margin:0 0 20px;font-size:34px;font-weight:700;letter-spacing:8px;color:#622d0d;font-family:'Courier New',monospace;">
                ${code}
              </p>
              <p style="margin:0 0 20px;color:#6b5c53;font-size:14px;line-height:1.6;">
                Vence en ${minutes} minutos y sirve una sola vez.
              </p>
              <p style="margin:0;color:#6b5c53;font-size:13px;line-height:1.6;">
                Nadie de IAM te va a pedir este código. Si no lo pediste vos, ignorá este mensaje: sin el código nadie puede entrar a tu cuenta.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  await transporter.sendMail({
    from: `"IAM Paraná" <${from}>`,
    to,
    subject: "Tu código de acceso — Inscripciones IAM Paraná",
    html,
    text: `Tu código de acceso a la cuenta familiar de IAM Paraná es: ${code}\n\nVence en ${minutes} minutos y sirve una sola vez.\n\nNadie de IAM te va a pedir este código. Si no lo pediste vos, ignorá este mensaje.`,
  });
}

/** Plantilla simple para los avisos del módulo de inscripciones. */
function inscripcionesNoticeHtml(title: string, paragraphs: string[]) {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${title}</title></head>
<body style="margin:0;padding:0;background:#fbf8f3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:#3a1508;padding:28px 40px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">${title}</h1>
          <p style="margin:6px 0 0;color:#f4cd74;font-size:13px;">Inscripciones — IAM Paraná</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          ${paragraphs.map((text) => `<p style="margin:0 0 16px;color:#2c1d11;font-size:15px;line-height:1.6;">${text}</p>`).join("")}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

function inscripcionesSiteUrl() {
  return (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://iamparana.com.ar").replace(/\/$/, "");
}

/** Aviso al email anterior cuando una cuenta familiar cambia su email de acceso. */
export async function sendEmailChangedNotice(to: string) {
  const from = process.env.GMAIL_FROM;
  if (!from) throw new Error("GMAIL_FROM no configurado");

  const paragraphs = [
    "El email de acceso de tu cuenta familiar de IAM Paraná se cambió por otro.",
    "Si fuiste vos, no tenés que hacer nada: desde ahora entrás con el email nuevo.",
    "Si no fuiste vos, escribinos cuanto antes respondiendo este mensaje para que lo revisemos.",
  ];

  await createTransporter().sendMail({
    from: `"IAM Paraná" <${from}>`,
    to,
    subject: "Cambió el email de tu cuenta familiar — IAM Paraná",
    html: inscripcionesNoticeHtml("Cambió tu email de acceso", paragraphs),
    text: paragraphs.join("\n\n"),
  });
}

/** Invitación a otro adulto para compartir a las personas a cargo de una cuenta. */
export async function sendAdultInvitationEmail(to: string, days: number) {
  const from = process.env.GMAIL_FROM;
  if (!from) throw new Error("GMAIL_FROM no configurado");

  const url = `${inscripcionesSiteUrl()}/inscripciones/cuenta`;
  const paragraphs = [
    "Un adulto responsable te sumó a su cuenta familiar de IAM Paraná para que también puedas ver e inscribir a los chicos a su cargo en los eventos.",
    `Para aceptar, entrá a ${url} con este mismo email. Te va a llegar un código para confirmar que sos vos.`,
    `La invitación vale por ${days} días. Si no esperabas este mensaje, podés ignorarlo: nadie accede a nada si no entrás.`,
  ];

  await createTransporter().sendMail({
    from: `"IAM Paraná" <${from}>`,
    to,
    subject: "Te sumaron a una cuenta familiar — IAM Paraná",
    html: inscripcionesNoticeHtml("Te sumaron a una cuenta familiar", paragraphs),
    text: paragraphs.join("\n\n"),
  });
}

/** Confirmación de autorizaciones firmadas, con los PDF adjuntos. */
export async function sendAutorizacionesEmail(to: string, eventoNombre: string, adjuntos: Array<{ filename: string; content: Buffer }>) {
  const from = process.env.GMAIL_FROM;
  if (!from) throw new Error("GMAIL_FROM no configurado");

  const evento = eventoNombre.replace(/[<>&"]/g, "");
  const paragraphs = [
    `Recibimos tu firma de las autorizaciones para ${evento}. La inscripción quedó confirmada.`,
    "Te adjuntamos una copia en PDF de cada autorización. También las podés descargar cuando quieras desde tu cuenta familiar, en la sección Mis inscripciones.",
    "Si no fuiste vos quien firmó, escribinos respondiendo este email.",
  ];
  await createTransporter().sendMail({
    from: `"IAM Paraná" <${from}>`,
    to,
    subject: `Autorizaciones firmadas: ${evento} — IAM Paraná`,
    html: inscripcionesNoticeHtml("Autorizaciones firmadas", paragraphs),
    text: paragraphs.join("\n\n"),
    attachments: adjuntos.map((adjunto) => ({ ...adjunto, contentType: "application/pdf" })),
  });
}

/** Aviso al adulto que tiene que firmar la autorización de un menor que se inscribió solo. Sin nombres. */
export async function sendFirmaAdultoEmail(to: string, eventoNombre: string, days: number) {
  const from = process.env.GMAIL_FROM;
  if (!from) throw new Error("GMAIL_FROM no configurado");

  const evento = eventoNombre.replace(/[<>&"]/g, "");
  const url = `${inscripcionesSiteUrl()}/inscripciones/cuenta`;
  const paragraphs = [
    `Una persona menor de edad a tu cargo se inscribió en ${evento}, de IAM Paraná, y dio tu email para que firmes su autorización. Sin tu firma, la inscripción queda pendiente.`,
    `Para firmar, entrá a ${url} con este mismo email. Te va a llegar un código para confirmar que sos vos; después, en «Mis inscripciones», tocá «Firmar autorización».`,
    `Tenés ${days} días. Si no esperabas este mensaje, podés ignorarlo: nadie accede a nada si no entrás.`,
  ];
  await createTransporter().sendMail({
    from: `"IAM Paraná" <${from}>`,
    to,
    subject: `Falta tu firma para una inscripción — IAM Paraná`,
    html: inscripcionesNoticeHtml("Falta tu firma", paragraphs),
    text: paragraphs.join("\n\n"),
  });
}

/** Código del segundo paso de ingreso de un administrador. */
export async function sendAdminLoginCodeEmail(to: string, code: string, minutes: number) {
  const from = process.env.GMAIL_FROM;
  if (!from) throw new Error("GMAIL_FROM no configurado");

  const paragraphs = [
    `Tu código para entrar al panel de administración es: ${code}`,
    `Vale por ${minutes} minutos y sirve una sola vez.`,
    "Si no estabas iniciando sesión, alguien tiene tu contraseña: cambiala cuanto antes.",
  ];
  await createTransporter().sendMail({
    from: `"IAM Paraná" <${from}>`,
    to,
    subject: `${code} es tu código de ingreso — IAM Paraná`,
    html: inscripcionesNoticeHtml("Código de ingreso", paragraphs),
    text: paragraphs.join("\n\n"),
  });
}

function escaparHtml(texto: string) {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Le avisa a Comunicación que alguien propuso una noticia desde el sitio. */
export async function sendNoticiaPropuestaEmail(datos: { nombre: string; iam: string; contacto: string; titulo: string; texto: string; fotos: string }) {
  const from = process.env.GMAIL_FROM;
  if (!from) throw new Error("GMAIL_FROM no configurado");

  const campos: Array<[string, string]> = [
    ["De", datos.nombre],
    ["IAM o comunidad", datos.iam],
    ["Contacto", datos.contacto],
    ["Título", datos.titulo],
    ["Fotos", datos.fotos || "No mandó enlace"],
  ];
  const text = `${campos.map(([nombre, valor]) => `${nombre}: ${valor}`).join("\n")}\n\n${datos.texto}`;
  // Todo lo que escribió la persona va escapado: llega como texto, nunca como HTML.
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2c1d11;max-width:560px">
<h1 style="font-size:20px;margin:0 0 16px">Propuesta de noticia</h1>
${campos.map(([nombre, valor]) => `<p style="margin:0 0 6px"><strong>${nombre}:</strong> ${escaparHtml(valor)}</p>`).join("")}
<p style="margin:18px 0 0;white-space:pre-wrap">${escaparHtml(datos.texto)}</p>
</div>`;
  const esEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.contacto);

  await createTransporter().sendMail({
    from: `"Sitio IAM Paraná" <${from}>`,
    to: CONTACTO_EMAIL,
    // Si dejó un mail, al responder le llega directo a esa persona.
    ...(esEmail ? { replyTo: datos.contacto } : {}),
    subject: `Propuesta de noticia: ${datos.titulo.slice(0, 80)}`,
    html,
    text,
  });
}

/** Le avisa al equipo que alguien quiere empezar una IAM en su parroquia. */
export async function sendNuevaIamEmail(datos: { nombre: string; contacto: string; parroquia: string; ciudad: string; mensaje: string }) {
  const from = process.env.GMAIL_FROM;
  if (!from) throw new Error("GMAIL_FROM no configurado");

  const campos: Array<[string, string]> = [
    ["De", datos.nombre],
    ["Contacto", datos.contacto],
    ["Parroquia, capilla o colegio", datos.parroquia],
    ["Ciudad", datos.ciudad],
  ];
  const text = `${campos.map(([nombre, valor]) => `${nombre}: ${valor}`).join("\n")}\n\n${datos.mensaje || "(Sin mensaje)"}`;
  // Todo lo que escribió la persona va escapado: llega como texto, nunca como HTML.
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2c1d11;max-width:560px">
<h1 style="font-size:20px;margin:0 0 16px">Quieren empezar una IAM</h1>
${campos.map(([nombre, valor]) => `<p style="margin:0 0 6px"><strong>${nombre}:</strong> ${escaparHtml(valor)}</p>`).join("")}
<p style="margin:18px 0 0;white-space:pre-wrap">${escaparHtml(datos.mensaje || "(Sin mensaje)")}</p>
</div>`;
  const esEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.contacto);

  await createTransporter().sendMail({
    from: `"Sitio IAM Paraná" <${from}>`,
    to: CONTACTO_EMAIL,
    // Si dejó un mail, al responder le llega directo a esa persona.
    ...(esEmail ? { replyTo: datos.contacto } : {}),
    subject: `Quieren empezar una IAM: ${datos.parroquia.slice(0, 60)} (${datos.ciudad.slice(0, 40)})`,
    html,
    text,
  });
}
