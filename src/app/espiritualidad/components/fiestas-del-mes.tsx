import { FadeInSection } from '@/app/components/common/fade-in-section';
import type { FechaDelMes } from '@/server/lib/agenda-mes';

// Santos, fiestas y eventos del mes, tomados de la agenda del sitio (el calendario): no se cargan aparte.

interface FiestasDelMesProps {
  mes: string;
  /** Día de hoy, para marcar lo que ya pasó y lo que es hoy. */
  hoy: number;
  fechas: FechaDelMes[];
}

export function FiestasDelMes({ mes, hoy, fechas }: FiestasDelMesProps) {
  if (fechas.length === 0) return null;
  const delMes = fechas.filter((fecha) => fecha.dia === null);
  const conDia = fechas.filter((fecha) => fecha.dia !== null);

  return (
    <section aria-labelledby="fiestas-titulo" className="mb-12 sm:mb-16">
      <FadeInSection>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <h2 id="fiestas-titulo" className="pop-in m-0 text-left font-display text-[clamp(1.9rem,4.6vw,3rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-brand-ink">
            Fiestas de {mes.toLowerCase()}
          </h2>
          {delMes.length > 0 && (
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {delMes.map((fecha) => (
                <li key={fecha.nombre} className="pop-in rounded-full bg-stone-800 px-4 py-1.5 text-sm font-bold text-white" style={{ ['--d' as string]: '120ms' }}>
                  {fecha.nombre}
                </li>
              ))}
            </ul>
          )}
        </div>

        {conDia.length > 0 && (
          <ol className="m-0 mt-6 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {conDia.map((fecha, index) => {
              const fin = fecha.hasta ?? fecha.dia!;
              const esHoy = hoy >= fecha.dia! && hoy <= fin;
              const yaPaso = fin < hoy;
              return (
                <li
                  key={`${fecha.dia}-${fecha.nombre}`}
                  className={`pop-in flex flex-col overflow-hidden rounded-2xl shadow-[0_14px_26px_-22px_rgba(41,37,36,0.8)] ring-1 ${esHoy ? 'ring-2 ring-red-600' : 'ring-stone-200'} ${yaPaso ? 'bg-stone-100' : 'bg-white'}`}
                  style={{ ['--d' as string]: `${160 + index * 70}ms` }}
                >
                  {/* Hoja de almanaque: franja de color arriba y el día en grande. */}
                  <span className={`px-3 py-1.5 text-center text-xs font-extrabold text-white ${yaPaso ? 'bg-stone-500' : fecha.evento ? 'bg-blue-700' : 'bg-red-600'}`}>
                    {esHoy ? 'Hoy' : yaPaso ? 'Ya pasó' : fecha.evento ? 'Evento' : mes}
                  </span>
                  <span className={`px-3 pt-3 text-center font-display text-5xl font-extrabold leading-none tabular-nums ${yaPaso ? 'text-stone-500' : 'text-stone-800'}`}>
                    {fecha.dia}
                    {fecha.hasta && <span className="text-2xl"> {fecha.hasta - fecha.dia! === 1 ? 'y' : 'al'} {fecha.hasta}</span>}
                  </span>
                  <span className="px-3 pb-4 pt-2 text-center text-sm font-semibold leading-snug text-stone-700">{fecha.nombre}</span>
                </li>
              );
            })}
          </ol>
        )}
      </FadeInSection>
    </section>
  );
}
