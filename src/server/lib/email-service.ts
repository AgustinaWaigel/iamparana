import "server-only";
import nodemailer from "nodemailer";

function createTransporter() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const from = process.env.GMAIL_FROM;

  if (!clientId || !clientSecret || !refreshToken || !from) {
    throw new Error(
      "Faltan variables de entorno de email: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GMAIL_FROM"
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: from,
      clientId,
      clientSecret,
      refreshToken,
    },
  });
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
