'use client';

import { useId, useState, type FormEvent } from 'react';
import { ArrowDown, Loader2, Send } from 'lucide-react';

// Cierre de "Quiénes somos": invitación a empezar una IAM. El botón despliega un formulario
// corto; el mensaje le llega por mail al equipo de IAM Paraná.

const VACIO = { nombre: '', parroquia: '', ciudad: '', contacto: '', mensaje: '', web: '' };
const CAMPO = 'w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-base text-brand-ink placeholder:text-stone-400 focus:border-brand-brown focus:outline-none focus:ring-4 focus:ring-brand-gold/30';
const ETIQUETA = 'mb-1 block text-sm font-bold text-brand-ink';

export function EmpezarIam() {
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
      const response = await fetch('/api/contacto/nueva-iam', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || 'No pudimos enviar tu mensaje. Probá de nuevo en un rato.');
      setEnviada(true);
      setDatos(VACIO);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos enviar tu mensaje. Probá de nuevo en un rato.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section aria-labelledby={`${id}-titulo`} className="relative isolate overflow-hidden bg-yellow-400 text-brand-deep">
      <div aria-hidden className="absolute -right-20 -top-24 -z-10 h-80 w-80 rounded-full bg-white/30" />
      <div aria-hidden className="absolute -bottom-28 -left-16 -z-10 h-72 w-72 rounded-full bg-white/20" />
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 id={`${id}-titulo`} className="m-0 text-balance text-left font-display text-[clamp(2.2rem,6vw,4rem)] font-extrabold leading-[0.98] tracking-[-0.035em]">
          ¿Querés empezar una IAM en tu parroquia?
        </h2>
        <p className="m-0 mt-5 max-w-2xl text-left text-lg leading-relaxed text-brand-deep/85 sm:text-xl">
          Escribinos. Te contamos cómo se arma un grupo y te acompañamos en los primeros pasos.
        </p>

        {!abierto && (
          <button
            type="button"
            aria-expanded={false}
            aria-controls={`${id}-panel`}
            onClick={() => setAbierto(true)}
            className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-brand-deep px-8 py-4 text-lg font-extrabold text-white transition-transform duration-300 ease-out hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep motion-reduce:transform-none"
          >
            Quiero que me contacten
            <ArrowDown size={20} aria-hidden className="transition-transform duration-300 ease-out group-hover:translate-y-0.5 motion-reduce:transform-none" />
          </button>
        )}

        <div id={`${id}-panel`} hidden={!abierto} className="mt-8 rounded-[26px] bg-brand-paper p-5 text-brand-ink shadow-[0_26px_50px_-28px_rgba(58,21,8,0.8)] duration-300 ease-out animate-in fade-in-0 slide-in-from-bottom-3 motion-reduce:animate-none sm:p-8">
          {enviada ? (
            <div role="status">
              <p className="m-0 max-w-none text-left font-display text-2xl font-extrabold text-brand-ink">¡Gracias por escribirnos!</p>
              <p className="m-0 mt-2 max-w-none text-left text-base leading-relaxed text-brand-ink/80">Ya nos llegó tu mensaje. Alguien del equipo te va a contactar pronto.</p>
            </div>
          ) : (
            <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={`${id}-nombre`} className={ETIQUETA}>Tu nombre</label>
                <input id={`${id}-nombre`} required maxLength={80} autoComplete="name" value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} className={CAMPO} />
              </div>
              <div>
                <label htmlFor={`${id}-contacto`} className={ETIQUETA}>Mail o teléfono</label>
                <input id={`${id}-contacto`} required maxLength={120} value={datos.contacto} onChange={(e) => cambiar('contacto', e.target.value)} className={CAMPO} />
              </div>
              <div>
                <label htmlFor={`${id}-parroquia`} className={ETIQUETA}>Parroquia, capilla o colegio</label>
                <input id={`${id}-parroquia`} required maxLength={120} value={datos.parroquia} onChange={(e) => cambiar('parroquia', e.target.value)} className={CAMPO} />
              </div>
              <div>
                <label htmlFor={`${id}-ciudad`} className={ETIQUETA}>Ciudad</label>
                <input id={`${id}-ciudad`} required maxLength={80} autoComplete="address-level2" value={datos.ciudad} onChange={(e) => cambiar('ciudad', e.target.value)} className={CAMPO} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor={`${id}-mensaje`} className={ETIQUETA}>Contanos un poco (opcional)</label>
                <textarea id={`${id}-mensaje`} rows={4} maxLength={2000} value={datos.mensaje} onChange={(e) => cambiar('mensaje', e.target.value)} placeholder="Por ejemplo: cuántos chicos hay, si ya tienen animadores, qué dudas tenés." className={`${CAMPO} resize-y`} />
              </div>
              {/* Campo trampa para programas automáticos: las personas no lo ven ni lo completan. */}
              <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label htmlFor={`${id}-web`}>No completar</label>
                <input id={`${id}-web`} tabIndex={-1} autoComplete="off" value={datos.web} onChange={(e) => cambiar('web', e.target.value)} />
              </div>

              {error && <p role="alert" className="m-0 max-w-none rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-800 sm:col-span-2">{error}</p>}

              <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
                <p className="m-0 max-w-md text-left text-xs leading-relaxed text-brand-ink/60">
                  Tus datos le llegan solo al equipo de IAM Paraná, para poder responderte. Más información en la <a href="/privacidad" className="font-bold text-brand-brown underline">política de privacidad</a>.
                </p>
                <button type="submit" disabled={enviando} className="inline-flex items-center gap-2 rounded-full bg-brand-brown px-6 py-3 text-base font-extrabold text-white transition-colors hover:bg-brand-wood focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown disabled:opacity-60">
                  {enviando ? <Loader2 size={18} aria-hidden className="animate-spin motion-reduce:animate-none" /> : <Send size={18} aria-hidden />}
                  {enviando ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
