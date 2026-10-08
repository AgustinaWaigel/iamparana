import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { CONTACTO_EMAIL } from "@/lib/contacto";
import { ArrowRight, ChevronDown, EyeOff, HeartPulse, Lock, ShieldCheck, UserCheck } from "lucide-react";

// Política de privacidad. Describe lo que el sitio hace de verdad: si cambia cómo se guardan
// o se usan los datos, hay que actualizar esta página y la fecha de abajo.

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Qué datos guarda IAM Paraná, para qué los usa, quién los puede ver y cómo ejercer tus derechos.",
  alternates: { canonical: "/privacidad" },
};

const ACTUALIZADA = "8 de octubre de 2026";

const SECCIONES = [
  { id: "que-cubre", titulo: "¿Qué cubre esta política?" },
  { id: "que-recopilamos", titulo: "¿Qué información recopilamos?" },
  { id: "como-usamos", titulo: "¿Cómo usamos tu información?" },
  { id: "chicos", titulo: "¿Qué cuidados tenemos con los chicos?" },
  { id: "quien-ve", titulo: "¿Quién puede ver tu información?" },
  { id: "servicios", titulo: "¿Con qué servicios trabajamos?" },
  { id: "obligacion-legal", titulo: "¿Cuándo la compartiríamos por obligación legal?" },
  { id: "proteccion", titulo: "¿Cómo la protegemos?" },
  { id: "conservacion", titulo: "¿Cuánto tiempo la conservamos?" },
  { id: "derechos", titulo: "¿Cómo podés administrarla o eliminarla?" },
  { id: "cookies", titulo: "¿Usamos cookies?" },
  { id: "cambios", titulo: "¿Cómo vas a saber si la política cambió?" },
  { id: "contacto", titulo: "¿Cómo comunicarte con nosotros?" },
] as const;

const RESUMEN = [
  { icon: EyeOff, titulo: "Sin publicidad", texto: "No vendemos tus datos, no mostramos anuncios y no armamos perfiles." },
  { icon: Lock, titulo: "Lo sensible, cifrado", texto: "El CUIL, el DNI de quien firma y la ficha de salud se guardan cifrados." },
  { icon: HeartPulse, titulo: "La salud, para cuidar", texto: "Solo la ve el equipo organizador. Los animadores no tienen acceso." },
  { icon: UserCheck, titulo: "Vos decidís", texto: "Podés ver, corregir o borrar tus datos y los de los chicos a tu cargo." },
] as const;

const H2 = "m-0 mb-4 scroll-mt-28 text-left font-display text-2xl font-extrabold leading-tight tracking-tight text-brand-ink sm:text-[28px]";
const H3 = "m-0 mb-2 mt-6 text-left font-display text-lg font-bold text-brand-ink";
const P = "m-0 mb-4 max-w-none text-left text-base leading-relaxed text-brand-ink/80";
const UL = "m-0 mb-4 list-disc space-y-1.5 pl-5 text-left text-base leading-relaxed text-brand-ink/80 marker:text-brand-brown/50";
const LINK = "font-bold text-brand-brown underline";

/** Texto ampliado que se abre a pedido, para que la política se pueda leer primero en corto. */
function MasDetalles({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <details className="group mb-4 rounded-2xl bg-white ring-1 ring-brand-brown/10 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left font-bold text-brand-ink transition-colors hover:bg-brand-brown/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown">
        {titulo}
        <ChevronDown size={18} aria-hidden className="shrink-0 text-brand-brown transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" />
      </summary>
      <div className="px-5 pb-2 pt-1">{children}</div>
    </details>
  );
}

/** Accesos directos a lo que cada persona puede hacer sola con sus datos. */
function TomarElControl({ acciones }: { acciones: { href: string; texto: string }[] }) {
  return (
    <aside aria-label="Tomar el control" className="mb-4 rounded-2xl bg-brand-deep p-5 text-white sm:p-6">
      <p className="m-0 mb-3 flex max-w-none items-center gap-2 text-left font-display text-lg font-extrabold">
        <ShieldCheck size={20} aria-hidden className="text-brand-gold" />
        Tomar el control
      </p>
      <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
        {acciones.map((accion) => (
          <li key={accion.texto}>
            <Link href={accion.href} className="group flex items-center justify-between gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white no-underline transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold">
              {accion.texto}
              <ArrowRight size={16} aria-hidden className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none" />
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default function PrivacidadPage() {
  const Mail = () => <a href={`mailto:${CONTACTO_EMAIL}`} className={`break-all ${LINK}`}>{CONTACTO_EMAIL}</a>;

  return (
    <div className="min-h-screen bg-brand-paper">
      <header className="border-b border-brand-brown/10 bg-brand-cream/60">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-16">
          <h1 className="m-0 text-balance text-left font-display text-[clamp(2.2rem,6vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-brand-ink">
            Política de privacidad
          </h1>
          <p className="m-0 mt-4 max-w-2xl text-left text-lg leading-relaxed text-brand-ink/75">
            Qué información guardamos, para qué, quién la puede ver y cómo podés controlarla. La escribimos en simple a propósito: si algo no se entiende, preguntanos.
          </p>
          <p className="m-0 mt-4 max-w-none text-left text-sm font-semibold text-brand-ink/60">Vigente desde el {ACTUALIZADA}</p>

          <ul className="m-0 mt-8 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {RESUMEN.map(({ icon: Icon, titulo, texto }) => (
              <li key={titulo} className="rounded-2xl bg-white p-5 ring-1 ring-brand-brown/10">
                <Icon size={22} aria-hidden className="text-brand-brown" />
                <p className="m-0 mt-3 max-w-none text-left font-display text-base font-extrabold text-brand-ink">{titulo}</p>
                <p className="m-0 mt-1 max-w-none text-left text-sm leading-relaxed text-brand-ink/70">{texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-24 pt-10 sm:px-6 lg:grid-cols-[17rem_1fr] lg:gap-14 lg:pt-14">
        <nav aria-label="Preguntas" className="lg:sticky lg:top-28 lg:self-start">
          <details className="group rounded-2xl bg-white ring-1 ring-brand-brown/10 lg:hidden [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-bold text-brand-ink">
              Ir a una pregunta
              <ChevronDown size={18} aria-hidden className="text-brand-brown transition-transform group-open:rotate-180" />
            </summary>
            <Indice />
          </details>
          <div className="hidden lg:block">
            <Indice />
          </div>
        </nav>

        <article className="min-w-0 max-w-[68ch] space-y-14">
          <section id="que-cubre">
            <h2 className={H2}>¿Qué cubre esta política?</h2>
            <p className={P}>
              Este sitio es de <strong>IAM Paraná</strong>, la Infancia y Adolescencia Misionera de la Arquidiócesis de Paraná. Somos los responsables de la información que se carga acá.
            </p>
            <p className={P}>
              Esta política explica cómo recopilamos, usamos, compartimos, protegemos y conservamos esa información, y cuáles son tus derechos. Aplica a todo el sitio: a quien solo lo recorre, a quien tiene cuenta para comentar y a las familias que inscriben a alguien en un evento.
            </p>
          </section>

          <section id="que-recopilamos">
            <h2 className={H2}>¿Qué información recopilamos?</h2>
            <p className={P}>
              Depende de cómo uses el sitio. Por ejemplo, no guardamos lo mismo si solo leés las noticias que si inscribís a tus hijos a un campamento.
            </p>

            <h3 className={H3}>Si solo navegás</h3>
            <p className={P}>
              Casi nada. Contamos visitas con herramientas que no usan cookies y no te identifican, y guardamos en tu navegador un número al azar para mostrar cuánta gente está en línea.
            </p>

            <h3 className={H3}>Si tenés una cuenta en el sitio</h3>
            <p className={P}>Es la cuenta para comentar y, si sos animador o animadora, para ver a los inscriptos de tu IAM.</p>
            <ul className={UL}>
              <li>Tu email y el nombre que elijas mostrar.</li>
              <li>Tu contraseña, guardada de forma que nadie, ni nosotros, la puede leer. Si entrás con Google, Google nos pasa tu nombre y tu email, nunca tu contraseña.</li>
              <li>Los comentarios que publiques, que ve cualquier visitante una vez que el equipo los aprueba.</li>
              <li>Si pedís ser animador o animadora: tu IAM y si ya te aprobaron.</li>
            </ul>

            <h3 className={H3}>Si inscribís a alguien a un evento</h3>
            <p className={P}>Las inscripciones usan una cuenta familiar aparte, a la que se entra con un código que llega por mail.</p>
            <MasDetalles titulo="Ver todos los datos de una inscripción">
              <ul className={UL}>
                <li><strong>De la cuenta:</strong> el email de quien la usa y de los adultos que invite.</li>
                <li><strong>De cada persona:</strong> nombre, apellido, fecha de nacimiento, CUIL, IAM o ciudad y grado escolar. De quien inscribe, también su teléfono.</li>
                <li><strong>Ficha de salud:</strong> grupo sanguíneo, enfermedades, medicación, alergias y dieta.</li>
                <li><strong>Contactos de emergencia:</strong> el adulto que inscribe y, si se agrega, otra persona con su teléfono.</li>
                <li><strong>De cada inscripción:</strong> el evento, el rol (por ejemplo, niño o adolescente, animador, área o acompañante), las respuestas que pida ese evento, el monto y si ya se pagó.</li>
                <li><strong>Firmas y autorizaciones:</strong> nombre y DNI de quien firma, la imagen de la firma, la fecha, el texto firmado y el tipo de navegador desde el que se firmó. Incluye la autorización para usar imágenes, si se da.</li>
              </ul>
            </MasDetalles>

            <h3 className={H3}>Otras funciones</h3>
            <ul className={UL}>
              <li><strong>Notificaciones:</strong> si las activás, guardamos el permiso que da tu navegador para mandarte avisos.</li>
              <li><strong>Chat con IA:</strong> lo que escribís se envía a un servicio de inteligencia artificial para generar la respuesta, y no lo guardamos. El chat no tiene acceso a las inscripciones ni a los datos de nadie. No escribas datos personales en el chat.</li>
            </ul>

            <h3 className={H3}>¿Qué pasa si no nos das cierta información?</h3>
            <p className={P}>
              Algunos datos son necesarios para inscribir a alguien: sin nombre, fecha de nacimiento o firma de un adulto, la inscripción no se puede completar. En la ficha de salud alcanza con contestar lo que corresponda: si alguien no tiene enfermedades ni alergias, se indica así.
            </p>

            <TomarElControl
              acciones={[
                { href: "/inscripciones/cuenta", texto: "Revisar los datos de tu familia" },
                { href: "/auth/perfil", texto: "Editar tu perfil del sitio" },
              ]}
            />
          </section>

          <section id="como-usamos">
            <h2 className={H2}>¿Cómo usamos tu información?</h2>
            <ul className={UL}>
              <li><strong>Para organizar cada evento:</strong> quién va, cuántos son, cómo se agrupan y qué hace falta para la logística.</li>
              <li><strong>Para cuidar a las personas:</strong> la ficha de salud y los contactos de emergencia están para actuar rápido si pasa algo.</li>
              <li><strong>Para tener las autorizaciones:</strong> firmadas por un adulto responsable.</li>
              <li><strong>Para llevar los pagos:</strong> cuánto corresponde y si ya se pagó.</li>
              <li><strong>Para comunicarnos con vos:</strong> códigos para entrar, avisos de firma y comprobantes por mail.</li>
            </ul>
            <div className="mb-4 rounded-2xl bg-brand-cream p-5 ring-1 ring-brand-brown/10 sm:p-6">
              <p className="m-0 mb-2 max-w-none text-left font-display text-lg font-extrabold text-brand-ink">Lo que no hacemos</p>
              <ul className="m-0 list-disc space-y-1 pl-5 text-left text-base leading-relaxed text-brand-ink/80 marker:text-brand-brown/50">
                <li>No vendemos ni prestamos tu información, y nunca lo vamos a hacer.</li>
                <li>No mostramos publicidad ni mandamos mails de marketing.</li>
                <li>No armamos perfiles ni usamos tus datos para entrenar inteligencia artificial.</li>
                <li>No usamos los datos de inscripción para nada que no sea un evento de IAM Paraná.</li>
              </ul>
            </div>
            <p className={P}>
              Guardamos tu información porque nos das tu consentimiento al cargarla, como pide la Ley 25.326 de Protección de Datos Personales. Los datos de salud son datos sensibles: los pedimos solo para cuidar a las personas en los eventos.
            </p>
          </section>

          <section id="chicos">
            <h2 className={H2}>¿Qué cuidados tenemos con los chicos?</h2>
            <ul className={UL}>
              <li>Para tener una cuenta familiar propia hay que tener 17 años o más.</li>
              <li>Los datos de los menores los carga un adulto responsable (madre, padre, tutor o tutora), que da el consentimiento por ellos.</li>
              <li>Las autorizaciones de los menores siempre las firma un adulto. Si quien inscribe todavía es menor, firma un adulto desde su propio mail.</li>
              <li>A los chicos no les pedimos teléfono ni mail.</li>
              <li>La autorización para usar imágenes es aparte y se puede retirar en cualquier momento.</li>
            </ul>
          </section>

          <section id="quien-ve">
            <h2 className={H2}>¿Quién puede ver tu información?</h2>
            <ul className={UL}>
              <li><strong>Tu familia:</strong> los adultos con acceso a la cuenta familiar ven y editan los datos de esa cuenta. Nadie ve los datos de otra familia.</li>
              <li><strong>El equipo organizador:</strong> quienes administran el sitio en IAM Paraná ven lo necesario para organizar los eventos, incluida la ficha de salud. Entran con contraseña y un código que les llega por mail.</li>
              <li><strong>Animadores y coordinadores de cada IAM:</strong> después de ser aprobados, ven solo a los inscriptos de su propia IAM: nombre, apellido, edad, grado, rol y si la autorización está firmada. <strong>No</strong> ven la ficha de salud, el CUIL ni los contactos.</li>
              <li><strong>En una emergencia:</strong> el equipo puede compartir la ficha de salud con quien atienda a la persona, como un médico o una guardia.</li>
              <li><strong>Todos los visitantes:</strong> solo ven lo que es público, como las noticias y los comentarios aprobados.</li>
            </ul>
          </section>

          <section id="servicios">
            <h2 className={H2}>¿Con qué servicios trabajamos?</h2>
            <p className={P}>
              Para que el sitio funcione usamos servicios de otras empresas. Cada uno recibe solo lo que necesita para hacer su parte y no puede usarlo para otra cosa.
            </p>
            <MasDetalles titulo="Ver la lista de servicios">
              <ul className={UL}>
                <li><strong>Vercel:</strong> donde está alojado el sitio.</li>
                <li><strong>Turso:</strong> la base de datos donde se guardan las cuentas y las inscripciones.</li>
                <li><strong>Google:</strong> manda los mails (Gmail), permite entrar con Google y guarda las imágenes y el calendario del sitio.</li>
                <li><strong>Upstash:</strong> cuenta los intentos para entrar y frena abusos. Para eso guarda por poco tiempo un identificador de la conexión.</li>
                <li><strong>Groq:</strong> genera las respuestas del chat con IA.</li>
                <li><strong>Simple Analytics y Vercel Analytics:</strong> cuentan visitas sin cookies y sin identificarte.</li>
                <li><strong>YouTube y Spotify:</strong> los videos y la música de algunas páginas vienen de esos servicios, que tienen sus propias políticas. En el inicio, el video recién se carga cuando tocás reproducir.</li>
              </ul>
            </MasDetalles>
            <h3 className={H3}>¿Tu información sale del país?</h3>
            <p className={P}>
              Sí, puede pasar: algunos de estos servicios tienen sus servidores fuera de Argentina. Al cargar tus datos aceptás que se guarden ahí, siempre con los cuidados que explicamos más abajo.
            </p>
          </section>

          <section id="obligacion-legal">
            <h2 className={H2}>¿Cuándo la compartiríamos por obligación legal?</h2>
            <p className={P}>
              Solo si una ley o una orden de un juez o de una autoridad competente nos obliga. En ese caso compartimos únicamente lo que se pida y sea necesario para cumplirla, y nada más.
            </p>
          </section>

          <section id="proteccion">
            <h2 className={H2}>¿Cómo la protegemos?</h2>
            <ul className={UL}>
              <li>El CUIL, el DNI de quien firma y la ficha de salud se guardan cifrados: en la base de datos no se pueden leer sin una clave que tiene solo el sitio.</li>
              <li>Toda la conexión con el sitio va cifrada (HTTPS).</li>
              <li>Las sesiones usan cookies protegidas que el código de la página no puede leer y que vencen solas.</li>
              <li>Hay un límite de intentos para entrar, y el sitio responde lo mismo exista o no un mail, para que no se pueda averiguar quién está registrado.</li>
              <li>Los datos personales no aparecen en las direcciones de las páginas, en los mensajes de error ni en los registros del servidor.</li>
            </ul>
          </section>

          <section id="conservacion">
            <h2 className={H2}>¿Cuánto tiempo la conservamos?</h2>
            <p className={P}>
              Los datos de tu cuenta y de las personas a tu cargo quedan guardados mientras uses la cuenta, así no tenés que cargarlos de nuevo en cada evento. Las inscripciones, firmas y autorizaciones de un evento se conservan como respaldo de ese evento.
            </p>
            <p className={P}>
              Podés pedir que borremos tu información cuando quieras. Si hubiera algo que tenemos que conservar por una obligación legal, te lo vamos a explicar.
            </p>
          </section>

          <section id="derechos">
            <h2 className={H2}>¿Cómo podés administrarla o eliminarla?</h2>
            <p className={P}>Según la Ley 25.326, sobre tus datos y los de los menores a tu cargo podés:</p>
            <ul className={UL}>
              <li><strong>Acceder:</strong> saber qué datos tenemos. Respondemos dentro de los 10 días corridos.</li>
              <li><strong>Corregir y actualizar:</strong> la mayoría lo podés hacer vos desde Mi cuenta familiar. Lo que no, lo pedís por mail.</li>
              <li><strong>Eliminar:</strong> pedir que borremos tus datos o los de una persona a tu cargo. Para corregir o borrar tenemos 5 días hábiles.</li>
              <li><strong>Retirar tu consentimiento</strong> cuando quieras, incluida la autorización de imagen.</li>
            </ul>
            <TomarElControl
              acciones={[
                { href: "/inscripciones/cuenta", texto: "Corregir datos de tu familia" },
                { href: "/inscripciones/cuenta", texto: "Retirar la autorización de imagen" },
                { href: "/inscripciones/cuenta", texto: "Ver tus inscripciones" },
                { href: "/auth/perfil", texto: "Cambiar tu contraseña" },
              ]}
            />
            <p className={P}>Para pedir una copia de tus datos o que los borremos, escribinos a <Mail /> desde el mail de tu cuenta.</p>
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
            <h2 className={H2}>¿Usamos cookies?</h2>
            <p className={P}>
              Solo las necesarias para que el sitio funcione. No hay cookies de publicidad ni de seguimiento, por eso no te pedimos que las aceptes.
            </p>
            <MasDetalles titulo="Ver qué cookies usamos">
              <div className="mb-4 overflow-x-auto rounded-xl ring-1 ring-brand-brown/10">
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
              <p className={P}>
                Si activás las notificaciones, tu navegador recuerda esa elección. Los reproductores de YouTube y Spotify pueden usar sus propias cookies cuando los usás.
              </p>
            </MasDetalles>
          </section>

          <section id="cambios">
            <h2 className={H2}>¿Cómo vas a saber si la política cambió?</h2>
            <p className={P}>
              Si cambiamos algo importante sobre cómo usamos tu información, lo vamos a avisar en el sitio antes de que empiece a regir, y vamos a actualizar la fecha de arriba.
            </p>
          </section>

          <section id="contacto">
            <h2 className={H2}>¿Cómo comunicarte con nosotros?</h2>
            <p className={P}>
              Si tenés preguntas sobre esta política, o algún pedido o reclamo sobre tu información, escribinos a <Mail />. Si querés, después también podés hacer un reclamo ante la Agencia de Acceso a la Información Pública.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}

function Indice() {
  return (
    <ol className="m-0 grid list-none gap-0.5 p-2 text-sm lg:p-0">
      {SECCIONES.map((seccion) => (
        <li key={seccion.id}>
          <a href={`#${seccion.id}`} className="block rounded-lg px-3 py-2 font-semibold leading-snug text-brand-ink/70 no-underline transition-colors hover:bg-brand-brown/5 hover:text-brand-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-brown">
            {seccion.titulo}
          </a>
        </li>
      ))}
    </ol>
  );
}
