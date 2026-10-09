'use client';

import { useId, useState, type FormEvent } from 'react';
import { ChevronDown, Loader2, Megaphone, Send } from 'lucide-react';

// "Mandanos tu noticia": un botón que despliega el formulario. La propuesta le llega por mail
// al equipo de Comunicación; no se publica sola.

const VACIO = { nombre: '', iam: '', contacto: '', titulo: '', texto: '', fotos: '', web: '' };
const CAMPO = 'w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-base text-brand-ink placeholder:text-stone-400 focus:border-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200';
const ETIQUETA = 'mb-1 block text-sm font-bold text-brand-ink';

export function MandarNoticia() {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [datos, setDatos] = useState(VACIO);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [enviada, setEnviada] = useState(false);

  const cambiar = (campo: keyof typeof VACIO, valor: string) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
    setError('');
  };

  const enviar = async (event: FormEvent) => {
    event.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const response = await fetch('/api/comunicacion/noticia', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || 'No pudimos enviar tu noticia. Probá de nuevo en un rato.');
      setEnviada(true);
      setDatos(VACIO);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos enviar tu noticia. Probá de nuevo en un rato.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section aria-labelledby={`${id}-titulo`} className="mt-14 overflow-hidden rounded-[28px] bg-white ring-1 ring-brand-brown/10 sm:mt-20">
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls={`${id}-panel`}
        onClick={() => setAbierto((valor) => !valor)}
        className="group flex w-full items-center gap-4 px-5 py-6 text-left transition-colors hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-700 sm:px-8 sm:py-7"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white transition-transform duration-300 ease-out group-hover:-rotate-6 motion-reduce:transform-none">
          <Megaphone size={26} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span id={`${id}-titulo`} role="heading" aria-level={2} className="block font-display text-2xl font-extrabold leading-tight tracking-tight text-brand-ink sm:text-3xl">
            Mandanos tu noticia
          </span>
          <span className="mt-1 block text-base text-brand-ink/70">¿Pasó algo lindo en tu IAM y queres compartirlo con la comunidad? Mandanos!.</span>
        </span>
        <ChevronDown size={24} aria-hidden className={`shrink-0 text-blue-700 transition-transform duration-300 motion-reduce:transition-none ${abierto ? 'rotate-180' : ''}`} />
      </button>

      <div id={`${id}-panel`} hidden={!abierto} className="border-t border-brand-brown/10 px-5 py-6 duration-300 ease-out animate-in fade-in-0 slide-in-from-top-2 motion-reduce:animate-none sm:px-8 sm:py-8">
        {enviada ? (
          <div role="status" className="rounded-2xl bg-green-50 p-5 ring-1 ring-green-200">
            <p className="m-0 max-w-none text-left font-display text-xl font-extrabold text-green-900">¡Gracias! Ya nos llegó.</p>
            <p className="m-0 mt-1 max-w-none text-left text-base text-green-900/85">El equipo de Comunicación la va a leer y, si hace falta algo más, te escribe.</p>
            <button type="button" onClick={() => setEnviada(false)} className="mt-4 rounded-full border border-green-800/30 px-5 py-2 text-sm font-bold text-green-900 transition-colors hover:bg-green-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800">
              Mandar otra
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${id}-nombre`} className={ETIQUETA}>Tu nombre</label>
              <input id={`${id}-nombre`} required maxLength={80} autoComplete="name" value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} className={CAMPO} />
            </div>
            <div>
              <label htmlFor={`${id}-iam`} className={ETIQUETA}>Tu IAM o comunidad</label>
              <input id={`${id}-iam`} required maxLength={100} value={datos.iam} onChange={(e) => cambiar('iam', e.target.value)} className={CAMPO} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor={`${id}-contacto`} className={ETIQUETA}>Mail o teléfono</label>
              <input id={`${id}-contacto`} required maxLength={120} value={datos.contacto} onChange={(e) => cambiar('contacto', e.target.value)} aria-describedby={`${id}-contacto-ayuda`} className={CAMPO} />
              <p id={`${id}-contacto-ayuda`} className="m-0 mt-1 max-w-none text-left text-xs text-brand-ink/60">Solo para escribirte si necesitamos algún dato más.</p>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor={`${id}-titulo-noticia`} className={ETIQUETA}>Título de la noticia</label>
              <input id={`${id}-titulo-noticia`} required maxLength={120} value={datos.titulo} onChange={(e) => cambiar('titulo', e.target.value)} className={CAMPO} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor={`${id}-texto`} className={ETIQUETA}>¿Qué pasó?</label>
              <textarea id={`${id}-texto`} required rows={6} minLength={30} maxLength={4000} value={datos.texto} onChange={(e) => cambiar('texto', e.target.value)} aria-describedby={`${id}-texto-ayuda`} className={`${CAMPO} resize-y`} />
              <p id={`${id}-texto-ayuda`} className="m-0 mt-1 max-w-none text-left text-xs text-brand-ink/60">Contanos qué hicieron, cuándo, dónde y quiénes participaron.</p>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor={`${id}-fotos`} className={ETIQUETA}>Enlace a las fotos (opcional)</label>
              <input id={`${id}-fotos`} type="url" maxLength={300} value={datos.fotos} onChange={(e) => cambiar('fotos', e.target.value)} placeholder="https://photos.app.goo.gl/..." aria-describedby={`${id}-fotos-ayuda`} className={CAMPO} />
              <p id={`${id}-fotos-ayuda`} className="m-0 mt-1 max-w-none text-left text-xs text-brand-ink/60">Un álbum de Google Fotos o una carpeta de Drive. Si hay chicos en las fotos, mandá solo las que tengan permiso de la familia.</p>
            </div>
            {/* Campo trampa para programas automáticos: las personas no lo ven ni lo completan. */}
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor={`${id}-web`}>No completar</label>
              <input id={`${id}-web`} tabIndex={-1} autoComplete="off" value={datos.web} onChange={(e) => cambiar('web', e.target.value)} />
            </div>

            {error && <p role="alert" className="m-0 max-w-none rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-800 sm:col-span-2">{error}</p>}

            <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
              <p className="m-0 max-w-md text-left text-xs leading-relaxed text-brand-ink/60">
                Tus datos le llegan solo al equipo de Comunicación. Más información en la <a href="/privacidad" className="font-bold text-brand-brown underline">política de privacidad</a>.
              </p>
              <button type="submit" disabled={enviando} className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-6 py-3 text-base font-extrabold text-white transition-colors hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 disabled:opacity-60">
                {enviando ? <Loader2 size={18} aria-hidden className="animate-spin motion-reduce:animate-none" /> : <Send size={18} aria-hidden />}
                {enviando ? 'Enviando...' : 'Enviar noticia'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
