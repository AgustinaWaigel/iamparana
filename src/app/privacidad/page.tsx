import type { Metadata } from "next";
import Link from "next/link";

// Política de privacidad. Describe lo que el sitio hace de verdad: si cambia cómo se guardan
// o se usan los datos, hay que actualizar esta página y la fecha de abajo.

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Qué datos guarda IAM Paraná, para qué los usa, quién los puede ver y cómo ejercer tus derechos.",
  alternates: { canonical: "/privacidad" },
};

const ACTUALIZADA = "8 de octubre de 2026";

const SECCIONES = [
  { id: "quienes", titulo: "Quiénes somos" },
  { id: "datos", titulo: "Qué datos guardamos" },
  { id: "para-que", titulo: "Para qué los usamos" },
  { id: "menores", titulo: "Chicos y adolescentes" },
  { id: "quien-ve", titulo: "Quién puede verlos" },
  { id: "servicios", titulo: "Servicios que usamos" },
  { id: "seguridad", titulo: "Cómo los cuidamos" },
  { id: "tiempo", titulo: "Cuánto tiempo los guardamos" },
  { id: "derechos", titulo: "Tus derechos" },
  { id: "cookies", titulo: "Cookies" },
  { id: "cambios", titulo: "Cambios en esta política" },
] as const;

const H2 = "m-0 mb-4 scroll-mt-28 text-left font-display text-2xl font-extrabold tracking-tight text-brand-ink sm:text-[28px]";
const H3 = "m-0 mb-2 mt-6 text-left font-display text-lg font-bold text-brand-ink";
const P = "m-0 mb-4 max-w-none text-left text-base leading-relaxed text-brand-ink/80";
const UL = "m-0 mb-4 list-disc space-y-1.5 pl-5 text-left text-base leading-relaxed text-brand-ink/80 marker:text-brand-brown/50";

export default function PrivacidadPage() {
  // El mail para pedidos de privacidad: uno propio si se configura, si no el mismo desde el que salen los avisos.
  const contacto = process.env.CONTACTO_PRIVACIDAD || process.env.GMAIL_FROM || null;
  const Mail = () =>
    contacto ? (
      <a href={`mailto:${contacto}`} className="break-all font-bold text-brand-brown underline">{contacto}</a>
    ) : (
      <span className="font-bold">el mail de contacto de IAM Paraná</span>
    );

  return (
    <div className="min-h-screen bg-brand-paper">
      <header className="border-b border-brand-brown/10 bg-brand-cream/60">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-16">
          <h1 className="m-0 text-balance text-left font-display text-[clamp(2.2rem,6vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-brand-ink">
            Política de privacidad
          </h1>
          <p className="m-0 mt-4 max-w-2xl text-left text-lg leading-relaxed text-brand-ink/75">
            Qué datos guardamos, para qué, quién los puede ver y cómo pedirnos que los corrijamos o los borremos. La escribimos en simple a propósito.
          </p>
          <p className="m-0 mt-4 max-w-none text-left text-sm font-semibold text-brand-ink/60">Última actualización: {ACTUALIZADA}</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-24 pt-10 sm:px-6 lg:grid-cols-[15rem_1fr] lg:gap-14 lg:pt-14">
        <nav aria-label="Secciones" className="lg:sticky lg:top-28 lg:self-start">
          <ol className="m-0 grid list-none gap-0.5 p-0 text-sm sm:grid-cols-2 lg:grid-cols-1">
            {SECCIONES.map((seccion, index) => (
              <li key={seccion.id}>
                <a href={`#${seccion.id}`} className="flex gap-2 rounded-lg px-2 py-1.5 font-semibold text-brand-ink/70 no-underline transition-colors hover:bg-brand-brown/5 hover:text-brand-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-brown">
                  <span className="w-5 shrink-0 tabular-nums text-brand-brown/50">{index + 1}.</span>
                  {seccion.titulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="min-w-0 max-w-[68ch] space-y-12">
          <section id="quienes">
            <h2 className={H2}>1. Quiénes somos</h2>
            <p className={P}>
              Este sitio es de <strong>IAM Paraná</strong>, la Infancia y Adolescencia Misionera de la Arquidiócesis de Paraná. Somos los responsables de los datos que se cargan acá.
            </p>
            <p className={P}>
              Para cualquier consulta o pedido sobre tus datos escribinos a <Mail />.
            </p>
          </section>

          <section id="datos">
            <h2 className={H2}>2. Qué datos guardamos</h2>
            <p className={P}>Depende de lo que hagas en el sitio. Si solo lo recorrés, casi nada.</p>

            <h3 className={H3}>Si solo navegás</h3>
            <p className={P}>
              No usamos cookies de publicidad ni de seguimiento. Contamos visitas con herramientas que no usan cookies y no te identifican (Simple Analytics y Vercel Analytics). Para mostrar cuánta gente está en línea guardamos un número al azar en tu navegador (ver <a href="#cookies" className="font-bold text-brand-brown underline">Cookies</a>).
            </p>

            <h3 className={H3}>Si creás una cuenta en el sitio</h3>
            <p className={P}>La cuenta del sitio sirve para comentar y, si sos animador o animadora, para ver a los inscriptos de tu IAM.</p>
            <ul className={UL}>
              <li>Tu email y el nombre que elijas mostrar.</li>
              <li>Tu contraseña, guardada de forma que nadie, ni nosotros, la puede leer. Si entrás con Google, Google nos pasa tu nombre y tu email; nunca tu contraseña.</li>
              <li>Los comentarios que publiques, que ve cualquier visitante una vez que el equipo los aprueba.</li>
              <li>Si pedís ser animador o animadora: tu IAM y si ya te aprobaron.</li>
            </ul>

            <h3 className={H3}>Si inscribís a alguien a un evento</h3>
            <p className={P}>Las inscripciones usan una cuenta familiar aparte, a la que se entra con un código que llega por mail. Ahí guardamos:</p>
            <ul className={UL}>
              <li><strong>De la cuenta:</strong> el email de quien la usa y de los adultos que invite.</li>
              <li><strong>De cada persona:</strong> nombre, apellido, fecha de nacimiento, CUIL, IAM o ciudad y grado escolar. De quien inscribe, también su teléfono.</li>
              <li><strong>Ficha de salud:</strong> grupo sanguíneo, enfermedades, medicación, alergias y dieta.</li>
              <li><strong>Contactos de emergencia:</strong> el adulto que inscribe y, si se agrega, otra persona con su teléfono.</li>
              <li><strong>De cada inscripción:</strong> el evento, el rol (por ejemplo, niño o adolescente, animador, área o acompañante), las respuestas que pida ese evento, el monto y si ya se pagó.</li>
              <li><strong>Firmas y autorizaciones:</strong> nombre y DNI de quien firma, la imagen de la firma, la fecha, el texto firmado y el tipo de navegador desde el que se firmó. Incluye la autorización para usar imágenes, si se da.</li>
            </ul>

            <h3 className={H3}>Otros</h3>
            <ul className={UL}>
              <li><strong>Notificaciones:</strong> si las activás, guardamos el permiso que da tu navegador para mandarte avisos. Las podés desactivar cuando quieras.</li>
              <li><strong>Chat con IA:</strong> lo que escribís se envía a un servicio de inteligencia artificial para generar la respuesta y no lo guardamos. El chat no tiene ningún acceso a las inscripciones ni a los datos de nadie. No escribas datos personales en el chat.</li>
            </ul>
          </section>

          <section id="para-que">
            <h2 className={H2}>3. Para qué los usamos</h2>
            <ul className={UL}>
              <li>Organizar cada evento: quién va, cuántos son, cómo se agrupan y qué hace falta para la logística.</li>
              <li>Cuidar a las personas durante el evento: la ficha de salud y los contactos de emergencia están para eso.</li>
              <li>Tener las autorizaciones firmadas por un adulto responsable.</li>
              <li>Llevar el registro de pagos de cada evento.</li>
              <li>Mandarte los mails necesarios: códigos para entrar, avisos de firma y comprobantes.</li>
            </ul>
            <p className={P}>
              <strong>No vendemos ni prestamos tus datos</strong>, no los usamos para publicidad y no armamos perfiles. Los datos de las inscripciones se usan solo para los eventos de IAM Paraná.
            </p>
            <p className={P}>
              Los guardamos porque nos das tu consentimiento al cargarlos, como pide la Ley 25.326 de Protección de Datos Personales. Los datos de salud son datos sensibles: los pedimos solo para cuidar a las personas en los eventos, y nadie está obligado a darlos.
            </p>
          </section>

          <section id="menores">
            <h2 className={H2}>4. Chicos y adolescentes</h2>
            <ul className={UL}>
              <li>Para tener una cuenta familiar propia hay que tener 17 años o más.</li>
              <li>Los datos de los menores los carga un adulto responsable (madre, padre, tutor o tutora), que da el consentimiento por ellos.</li>
              <li>Las autorizaciones de los menores siempre las firma un adulto. Si quien inscribe todavía es menor, la firma la hace un adulto desde su propio mail.</li>
              <li>A los chicos no les pedimos teléfono ni mail.</li>
            </ul>
          </section>

          <section id="quien-ve">
            <h2 className={H2}>5. Quién puede verlos</h2>
            <ul className={UL}>
              <li><strong>Tu familia:</strong> los adultos con acceso a la cuenta familiar ven y editan los datos de esa cuenta. Nadie ve los datos de otra familia.</li>
              <li><strong>El equipo organizador:</strong> las personas que administran el sitio en IAM Paraná ven lo necesario para organizar los eventos, incluida la ficha de salud. Entran con contraseña y un código que les llega por mail.</li>
              <li><strong>Animadores y coordinadores de cada IAM:</strong> después de ser aprobados, ven solo a los inscriptos de su propia IAM: nombre, apellido, edad, grado, rol y si la autorización está firmada. <strong>No</strong> ven la ficha de salud, el CUIL ni los contactos.</li>
              <li><strong>En una emergencia:</strong> el equipo puede compartir la ficha de salud con quien atienda a la persona, como un médico o una guardia.</li>
            </ul>
          </section>

          <section id="servicios">
            <h2 className={H2}>6. Servicios que usamos</h2>
            <p className={P}>
              Para que el sitio funcione usamos estos servicios externos. Cada uno recibe solo lo que necesita para hacer su parte:
            </p>
            <ul className={UL}>
              <li><strong>Vercel:</strong> donde está alojado el sitio.</li>
              <li><strong>Turso:</strong> la base de datos donde se guardan las cuentas y las inscripciones.</li>
              <li><strong>Google:</strong> manda los mails (Gmail), permite entrar con Google y guarda las imágenes y el calendario del sitio.</li>
              <li><strong>Upstash:</strong> cuenta los intentos para entrar y frena abusos. Para eso guarda por poco tiempo un identificador de la conexión.</li>
              <li><strong>Groq:</strong> genera las respuestas del chat con IA.</li>
              <li><strong>Simple Analytics y Vercel Analytics:</strong> cuentan visitas sin cookies y sin identificarte.</li>
              <li><strong>YouTube y Spotify:</strong> los videos y la música que se ven en algunas páginas vienen de esos servicios, que tienen sus propias políticas. En el inicio, el video recién se carga cuando tocás reproducir.</li>
            </ul>
            <p className={P}>
              Algunos de estos servicios tienen sus servidores fuera de Argentina, así que los datos pueden guardarse en otros países. Al cargar tus datos aceptás que se guarden ahí, con los cuidados de la sección siguiente.
            </p>
          </section>

          <section id="seguridad">
            <h2 className={H2}>7. Cómo los cuidamos</h2>
            <ul className={UL}>
              <li>El CUIL, el DNI de quien firma y la ficha de salud se guardan cifrados: en la base de datos no se pueden leer sin una clave que tiene solo el sitio.</li>
              <li>Toda la conexión con el sitio va cifrada (HTTPS).</li>
              <li>Las sesiones usan cookies protegidas que el código de la página no puede leer y que vencen solas.</li>
              <li>Hay un límite de intentos para entrar, y el sitio responde lo mismo exista o no un mail, para que no se pueda averiguar quién está registrado.</li>
              <li>Los datos personales no aparecen en las direcciones de las páginas, en los mensajes de error ni en los registros del servidor.</li>
            </ul>
          </section>

          <section id="tiempo">
            <h2 className={H2}>8. Cuánto tiempo los guardamos</h2>
            <p className={P}>
              Los datos de tu cuenta y de las personas a tu cargo quedan guardados mientras uses la cuenta, así no tenés que cargarlos de nuevo en cada evento. Las inscripciones, firmas y autorizaciones de un evento se conservan como respaldo de ese evento.
            </p>
            <p className={P}>
              Podés pedir que borremos tus datos cuando quieras. Si hubiera algo que tenemos que conservar por una obligación legal, te lo vamos a explicar.
            </p>
          </section>

          <section id="derechos">
            <h2 className={H2}>9. Tus derechos</h2>
            <p className={P}>Según la Ley 25.326, sobre tus datos y los de los menores a tu cargo podés:</p>
            <ul className={UL}>
              <li><strong>Acceder:</strong> saber qué datos tenemos. Respondemos dentro de los 10 días corridos.</li>
              <li><strong>Corregir y actualizar:</strong> la mayoría lo podés hacer vos desde <Link href="/inscripciones/cuenta" className="font-bold text-brand-brown underline">Mi cuenta familiar</Link>. Lo que no, lo pedís por mail.</li>
              <li><strong>Borrar:</strong> pedir que eliminemos tus datos o los de una persona a tu cargo. Para corregir o borrar tenemos 5 días hábiles.</li>
              <li><strong>Retirar tu consentimiento</strong> cuando quieras, incluida la autorización de imagen, que también podés retirar desde Mi cuenta familiar.</li>
            </ul>
            <p className={P}>Para cualquiera de estos pedidos escribinos a <Mail /> desde el mail de tu cuenta.</p>
            <div className="rounded-2xl bg-brand-cream p-5 ring-1 ring-brand-brown/10 sm:p-6">
              <p className="m-0 mb-3 max-w-none text-left text-sm leading-relaxed text-brand-ink/80">
                El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley N° 25.326.
              </p>
              <p className="m-0 max-w-none text-left text-sm leading-relaxed text-brand-ink/80">
                La Agencia de Acceso a la Información Pública, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.
              </p>
            </div>
          </section>

          <section id="cookies">
            <h2 className={H2}>10. Cookies</h2>
            <p className={P}>
              Usamos solo las cookies necesarias para que el sitio funcione. No hay cookies de publicidad ni de seguimiento, por eso no te pedimos que las aceptes.
            </p>
            <div className="overflow-x-auto rounded-2xl ring-1 ring-brand-brown/10">
              <table className="w-full min-w-[34rem] border-collapse bg-white text-left text-sm">
                <thead className="bg-brand-cream text-brand-ink">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-bold">Cookie</th>
                    <th scope="col" className="px-4 py-3 font-bold">Para qué</th>
                    <th scope="col" className="px-4 py-3 font-bold">Dura</th>
                  </tr>
                </thead>
                <tbody className="text-brand-ink/80 [&_td]:border-t [&_td]:border-brand-brown/10 [&_td]:px-4 [&_td]:py-3 [&_td]:align-top">
                  <tr><td><code>iam_auth</code></td><td>Mantener abierta tu sesión en el sitio.</td><td>12 horas</td></tr>
                  <tr><td><code>iam_familia</code></td><td>Mantener abierta tu cuenta familiar de inscripciones.</td><td>2 horas</td></tr>
                  <tr><td><code>iam_2fa</code></td><td>El código de acceso del equipo organizador.</td><td>10 minutos</td></tr>
                  <tr><td><code>iam_g_state</code></td><td>Proteger el ingreso con Google.</td><td>10 minutos</td></tr>
                  <tr><td><code>iam_visitor_presence</code></td><td>Un número al azar para contar cuánta gente está en línea. No te identifica.</td><td>1 año</td></tr>
                </tbody>
              </table>
            </div>
            <p className={`${P} mt-4`}>
              Si activás las notificaciones, tu navegador recuerda esa elección. Los reproductores de YouTube y Spotify pueden usar sus propias cookies cuando los usás.
            </p>
          </section>

          <section id="cambios">
            <h2 className={H2}>11. Cambios en esta política</h2>
            <p className={P}>
              Si cambiamos algo importante sobre cómo usamos los datos, lo vamos a avisar en el sitio y a actualizar la fecha de arriba.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
