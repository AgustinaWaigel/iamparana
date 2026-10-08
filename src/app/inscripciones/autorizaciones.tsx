'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { FirmaPad } from './firma-pad';
import { CARD_CLASS, ERROR_CLASS, HELP_CLASS, INPUT_CLASS, LABEL_CLASS, NOTICE_CLASS, PRIMARY_BUTTON, postJson } from './ui';

// Paso de firma: el adulto lee el texto, completa nombre y DNI y firma una vez
// por todas las personas que inscribió en el evento.

export interface AutorizacionPendiente {
  personaId: string;
  nombre: string;
  /** Falta firmar la autorización de este evento. */
  faltaFirma: boolean;
  /** Falta responder el uso de imagen de este año. */
  faltaImagen: boolean;
}

interface AutorizacionesProps {
  eventoId: string;
  textoEvento: string;
  textoImagen: string;
  pendientes: AutorizacionPendiente[];
  firmanteSugerido: string;
}

const TEXTO_CLASS = 'm-0 max-h-72 max-w-none overflow-y-auto whitespace-pre-line rounded-xl border border-stone-200 bg-brand-paper p-4 text-left text-[15px] leading-relaxed text-brand-ink';

export function Autorizaciones({ eventoId, textoEvento, textoImagen, pendientes, firmanteSugerido }: AutorizacionesProps) {
  const router = useRouter();
  const [nombre, setNombre] = useState(firmanteSugerido);
  const [dni, setDni] = useState('');
  const [acepto, setAcepto] = useState(false);
  const [firma, setFirma] = useState<string | null>(null);
  const [imagen, setImagen] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hecho, setHecho] = useState<{ emailEnviado: boolean } | null>(null);

  const conFirma = pendientes.filter((item) => item.faltaFirma);
  const conImagen = pendientes.filter((item) => item.faltaImagen);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    const sinImagen = conImagen.find((item) => imagen[item.personaId] === undefined);
    if (sinImagen) {
      setError(`Indicá si autorizás el uso de imagen de ${sinImagen.nombre}.`);
      return;
    }
    if (!acepto) {
      setError('Para firmar tenés que marcar que leíste y aceptás.');
      return;
    }
    if (!firma) {
      setError('Falta la firma. Dibujala en el recuadro.');
      return;
    }

    setBusy(true);
    const result = await postJson<{ emailEnviado: boolean }>('/api/inscripciones/firmar', {
      eventoId,
      firmanteNombre: nombre,
      firmanteDni: dni,
      acepto,
      firma,
      imagen,
    });
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setHecho({ emailEnviado: result.data.emailEnviado });
    router.refresh();
  };

  if (hecho) {
    return (
      <p role="status" className={`${NOTICE_CLASS} mb-12`}>
        Listo, la firma quedó registrada.{' '}
        {hecho.emailEnviado
          ? 'Te mandamos una copia en PDF por email.'
          : 'Podés descargar la copia en PDF desde tu cuenta, en «Mis inscripciones».'}
      </p>
    );
  }

  if (pendientes.length === 0) return null;

  return (
    <form onSubmit={submit} className={`${CARD_CLASS} space-y-8 p-6 sm:p-8`}>
      {conFirma.length > 0 && (
        <div>
          <h3 className="m-0 mb-1 text-left font-display text-xl font-bold text-brand-ink">Autorización del evento</h3>
          <p className={`${HELP_CLASS} mb-3 mt-0`}>
            Vale para: <strong className="font-bold text-brand-ink">{conFirma.map((item) => item.nombre).join(', ')}</strong>.
          </p>
          <p className={TEXTO_CLASS} tabIndex={0}>{textoEvento}</p>
        </div>
      )}

      {conImagen.length > 0 && (
        <div>
          <h3 className="m-0 mb-1 text-left font-display text-xl font-bold text-brand-ink">Uso de imagen</h3>
          <p className={`${HELP_CLASS} mb-3 mt-0`}>Es opcional: si decís que no, la inscripción sigue igual.</p>
          <p className={TEXTO_CLASS} tabIndex={0}>{textoImagen}</p>
          <div className="mt-4 space-y-3">
            {conImagen.map((item) => (
              <fieldset key={item.personaId} className="m-0 flex min-w-0 flex-wrap items-center justify-between gap-3 border-0 p-0">
                <legend className="sr-only">Uso de imagen de {item.nombre}</legend>
                <span aria-hidden className="text-base font-bold text-brand-ink">{item.nombre}</span>
                <div className="flex gap-2">
                  {[{ label: 'Autorizo', value: true }, { label: 'No autorizo', value: false }].map((opcion) => (
                    <label key={opcion.label} className="cursor-pointer">
                      <input
                        type="radio"
                        name={`imagen-${item.personaId}`}
                        className="peer sr-only"
                        checked={imagen[item.personaId] === opcion.value}
                        onChange={() => setImagen((prev) => ({ ...prev, [item.personaId]: opcion.value }))}
                      />
                      <span className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-brand-ink transition-colors peer-checked:border-brand-brown peer-checked:bg-brand-brown peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-brown">
                        {opcion.label}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="m-0 mb-4 text-left font-display text-xl font-bold text-brand-ink">Tu firma</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firmante-nombre" className={LABEL_CLASS}>Tu nombre y apellido</label>
            <input id="firmante-nombre" className={INPUT_CLASS} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} autoComplete="off" required />
          </div>
          <div>
            <label htmlFor="firmante-dni" className={LABEL_CLASS}>Tu DNI</label>
            <input id="firmante-dni" className={INPUT_CLASS} value={dni} onChange={(e) => setDni(e.target.value)} inputMode="numeric" maxLength={11} autoComplete="off" placeholder="Solo números" required />
          </div>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-brand-cream p-4">
          <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 rounded border-stone-400 accent-brand-brown" />
          <span className="text-sm leading-relaxed text-brand-ink/85">Leí el texto completo y lo acepto. Soy mayor de edad y tengo a mi cargo a las personas que estoy autorizando.</span>
        </label>

        <p id="firma-titulo" className={`${LABEL_CLASS} mt-5`}>Firma</p>
        <FirmaPad onChange={setFirma} labelledBy="firma-titulo" />
      </div>

      {error && <p role="alert" className={ERROR_CLASS}>{error}</p>}

      <button type="submit" disabled={busy} className={PRIMARY_BUTTON}>
        {busy && <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden />}
        {busy ? 'Guardando la firma...' : 'Firmar'}
      </button>
    </form>
  );
}
