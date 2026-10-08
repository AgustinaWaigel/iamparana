import Link from 'next/link';
import { Download, PenLine } from 'lucide-react';
import type { InscripcionConFirmas } from '@/server/db/inscripciones-repository';
import type { EventoAgenda } from '@/server/lib/inscripciones-eventos';
import { formatMonto } from '../montos';
import { CARD_CLASS, ESTADO_LABEL, ROL_LABEL, TEXT_BUTTON, formatFecha } from '../ui';
import { ImagenRevocar } from './imagen-revocar';

// A quiénes inscribió esta cuenta, evento por evento, con el estado de cada autorización.

interface MisInscripcionesProps {
  inscripciones: InscripcionConFirmas[];
  eventos: Map<string, EventoAgenda>;
}

const ESTADO_CLASS: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-900',
  confirmada: 'bg-emerald-100 text-emerald-900',
  lista_espera: 'bg-stone-200 text-stone-800',
};

export function MisInscripciones({ inscripciones, eventos }: MisInscripcionesProps) {
  // Se agrupa por evento, con los más próximos primero; los que ya no están en la agenda van al final.
  const grupos = new Map<string, InscripcionConFirmas[]>();
  for (const item of inscripciones) grupos.set(item.eventoId, [...(grupos.get(item.eventoId) ?? []), item]);
  const ordenados = [...grupos.entries()].sort(([a], [b]) => (eventos.get(a)?.fecha ?? '9999').localeCompare(eventos.get(b)?.fecha ?? '9999'));

  // El permiso de imagen es por persona, no por evento: se muestra una vez por cada una.
  const personas = new Map<string, InscripcionConFirmas>();
  for (const item of inscripciones) if (!personas.has(item.personaId)) personas.set(item.personaId, item);

  return (
    <section aria-labelledby="mis-inscripciones" className="mt-14">
      <h2 id="mis-inscripciones" className="m-0 mb-5 text-left font-display text-2xl font-extrabold tracking-tight text-brand-ink">Mis inscripciones</h2>

      {inscripciones.length === 0 ? (
        <p className="m-0 max-w-none rounded-2xl border border-dashed border-brand-brown/20 px-5 py-8 text-center text-base text-brand-ink/65">
          Todavía no inscribiste a nadie. <Link href="/inscripciones" className="font-bold text-brand-brown">Ver eventos</Link>
        </p>
      ) : (
        <div className="space-y-4">
          {ordenados.map(([eventoId, items]) => {
            const evento = eventos.get(eventoId);
            const faltaFirmar = items.some((item) => !item.firmaEventoId || item.imagen === null);
            return (
              <div key={eventoId} className={`${CARD_CLASS} p-5 sm:p-6`}>
                <h3 className="m-0 text-left font-display text-lg font-bold leading-snug text-brand-ink">{evento?.evento ?? 'Evento'}</h3>
                {evento && (
                  <p className="m-0 mt-1 max-w-none text-left text-sm font-semibold text-brand-ink/65 first-letter:uppercase">
                    {formatFecha(evento.fecha)}
                    {evento.fechaFin && evento.fechaFin !== evento.fecha ? ` al ${formatFecha(evento.fechaFin)}` : ''}
                  </p>
                )}

                <ul className="m-0 mt-4 list-none divide-y divide-brand-brown/10 border-t border-brand-brown/10 p-0">
                  {items.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
                      <div className="min-w-0">
                        <p className="m-0 max-w-none text-left text-base font-bold text-brand-ink">{item.nombre} {item.apellido}</p>
                        <p className="m-0 mt-0.5 max-w-none text-left text-sm text-brand-ink/65">
                          {ROL_LABEL[item.rol] ?? item.rol}{item.monto !== null ? ` · ${formatMonto(item.monto)}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${ESTADO_CLASS[item.estado] ?? 'bg-stone-200 text-stone-800'}`}>
                          {ESTADO_LABEL[item.estado] ?? item.estado}
                        </span>
                        {item.firmaEventoId && (
                          <a href={`/api/inscripciones/firmas/${item.firmaEventoId}`} className={TEXT_BUTTON}>
                            <Download size={14} aria-hidden />
                            Autorización (PDF)
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                {faltaFirmar && evento && (
                  <Link href={`/inscripciones/${encodeURIComponent(eventoId)}#paso-firma-seccion`} className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-brand-brown px-5 py-2.5 text-sm font-bold text-white no-underline transition-colors hover:bg-brand-wood focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown">
                    <PenLine size={16} aria-hidden />
                    Firmar autorización
                  </Link>
                )}
              </div>
            );
          })}

          <div className={`${CARD_CLASS} p-5 sm:p-6`}>
            <h3 className="m-0 text-left font-display text-lg font-bold leading-snug text-brand-ink">Uso de imagen</h3>
            <p className="m-0 mt-1 max-w-none text-left text-sm leading-relaxed text-brand-ink/65">Vale por este año. Lo podés retirar cuando quieras.</p>
            <ul className="m-0 mt-4 list-none divide-y divide-brand-brown/10 border-t border-brand-brown/10 p-0">
              {[...personas.values()].map((item) => (
                <li key={item.personaId} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
                  <p className="m-0 max-w-none text-left text-base text-brand-ink">
                    <strong className="font-bold">{item.nombre} {item.apellido}:</strong>{' '}
                    {item.imagen === null ? 'falta responder' : item.imagen ? 'autorizado' : 'no autorizado'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    {item.firmaImagenId && (
                      <a href={`/api/inscripciones/firmas/${item.firmaImagenId}`} className={TEXT_BUTTON}>
                        <Download size={14} aria-hidden />
                        Constancia (PDF)
                      </a>
                    )}
                    {item.imagen === true && <ImagenRevocar personaId={item.personaId} nombre={item.nombre} />}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
