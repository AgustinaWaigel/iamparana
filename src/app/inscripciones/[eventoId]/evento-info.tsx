import { Banknote, Clock, MapPin, Wallet } from 'lucide-react';
import type { EventoInfo } from '@/server/db/evento-info-repository';
import { formatMonto, hayMontos, type Montos } from '../montos';
import { MapaEvento, QueLlevar } from './evento-info-cliente';

// Lo que una familia necesita saber del evento: cuánto sale, cómo pagar, cómo llegar y qué llevar.
// El monto sale de la inscripción; el resto lo carga el administrador. Lo que falta, no se muestra.

const CARD = 'rounded-[24px] bg-white p-5 ring-1 ring-brand-brown/10 sm:p-7';
const H2 = 'm-0 flex items-center gap-2.5 text-left font-display text-2xl font-extrabold leading-tight tracking-tight text-brand-ink';
const ICONO = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white';
const DATO = 'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-brand-brown/10 py-2.5 last:border-0';

function fechaLarga(ymd: string) {
  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
}

interface EventoInfoProps {
  eventoId: string;
  info: EventoInfo;
  montos: Montos;
  cierraAt: string | null;
}

export function EventoInfoPublica({ eventoId, info, montos, cierraAt }: EventoInfoProps) {
  const conMontos = hayMontos(montos);
  const { pago } = info;
  const conPago = Boolean(pago.alias || pago.cbu || pago.titular || pago.comprobante || pago.nota);
  const conLugar = Boolean(info.lugar || info.direccion || info.llegada || info.salida);
  if (!conMontos && !conPago && !conLugar && info.queLlevar.length === 0) return null;

  const ciudades = Object.entries(montos.porCiudad).sort((a, b) => a[0].localeCompare(b[0], 'es'));
  const consulta = [info.lugar, info.direccion].filter(Boolean).join(', ');

  return (
    <div className="mx-auto grid max-w-5xl gap-4 px-4 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-2">
      {conMontos && (
        <section aria-labelledby="info-monto" className={CARD}>
          <h2 id="info-monto" className={H2}><span className={`${ICONO} bg-emerald-600`}><Banknote size={21} aria-hidden /></span>Cuánto sale</h2>
          <dl className="m-0 mt-4">
            {ciudades.map(([ciudad, monto]) => (
              <div key={ciudad} className={DATO}>
                <dt className="text-base text-brand-ink/80">Desde {ciudad}</dt>
                <dd className="m-0 font-display text-xl font-extrabold tabular-nums text-brand-ink">{monto === 0 ? 'Sin costo' : formatMonto(monto)}</dd>
              </div>
            ))}
            {montos.otras !== null && (
              <div className={DATO}>
                <dt className="text-base text-brand-ink/80">{ciudades.length > 0 ? 'Desde otras ciudades' : 'Por persona'}</dt>
                <dd className="m-0 font-display text-xl font-extrabold tabular-nums text-brand-ink">{montos.otras === 0 ? 'Sin costo' : formatMonto(montos.otras)}</dd>
              </div>
            )}
          </dl>
          <p className="m-0 mt-3 max-w-none text-left text-sm leading-relaxed text-brand-ink/70">
            Los chicos de jardín no pagan.{cierraAt && ` La inscripción cierra el ${fechaLarga(cierraAt)}: si después te das de baja, igual corresponde pagar.`}
          </p>
        </section>
      )}

      {conPago && (
        <section aria-labelledby="info-pago" className={CARD}>
          <h2 id="info-pago" className={H2}><span className={`${ICONO} bg-blue-700`}><Wallet size={21} aria-hidden /></span>Cómo pagar</h2>
          <dl className="m-0 mt-4">
            {pago.alias && <div className={DATO}><dt className="text-base text-brand-ink/80">Alias</dt><dd className="m-0 break-all font-display text-lg font-extrabold text-brand-ink">{pago.alias}</dd></div>}
            {pago.cbu && <div className={DATO}><dt className="text-base text-brand-ink/80">CBU o CVU</dt><dd className="m-0 break-all font-bold tabular-nums text-brand-ink">{pago.cbu}</dd></div>}
            {pago.titular && <div className={DATO}><dt className="text-base text-brand-ink/80">A nombre de</dt><dd className="m-0 font-bold text-brand-ink">{pago.titular}</dd></div>}
            {pago.comprobante && <div className={DATO}><dt className="text-base text-brand-ink/80">Mandá el comprobante</dt><dd className="m-0 font-bold text-brand-ink">{pago.comprobante}</dd></div>}
          </dl>
          {pago.nota && <p className="m-0 mt-3 max-w-none whitespace-pre-line text-left text-sm leading-relaxed text-brand-ink/75">{pago.nota}</p>}
        </section>
      )}

      {conLugar && (
        <section aria-labelledby="info-lugar" className={CARD}>
          <h2 id="info-lugar" className={H2}><span className={`${ICONO} bg-red-600`}><MapPin size={21} aria-hidden /></span>Cómo llegar</h2>
          {info.lugar && <p className="m-0 mt-4 max-w-none text-left font-display text-xl font-extrabold text-brand-ink">{info.lugar}</p>}
          {info.direccion && <p className="m-0 mt-1 max-w-none text-left text-base text-brand-ink/80">{info.direccion}</p>}
          {(info.llegada || info.salida) && (
            <dl className="m-0 mt-4 grid gap-3 sm:grid-cols-2">
              {info.llegada && <div className="rounded-2xl bg-brand-cream p-4"><dt className="flex items-center gap-1.5 text-sm font-bold text-brand-ink/70"><Clock size={15} aria-hidden /> Llegada</dt><dd className="m-0 mt-1 font-bold text-brand-ink">{info.llegada}</dd></div>}
              {info.salida && <div className="rounded-2xl bg-brand-cream p-4"><dt className="flex items-center gap-1.5 text-sm font-bold text-brand-ink/70"><Clock size={15} aria-hidden /> Salida</dt><dd className="m-0 mt-1 font-bold text-brand-ink">{info.salida}</dd></div>}
            </dl>
          )}
          {consulta && <MapaEvento consulta={consulta} enlace={info.mapaUrl} />}
        </section>
      )}

      {info.queLlevar.length > 0 && <QueLlevar eventoId={eventoId} items={info.queLlevar} />}
    </div>
  );
}
