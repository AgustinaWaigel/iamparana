'use client';

import { INPUT_CLASS, LABEL_CLASS } from './ui';

// Preguntas de salud con "Sí / No" y, si es sí, el detalle. Se usan al cargar a la
// persona y de nuevo en cada inscripción, para revisar que sigan al día.

export type Condicion = { tiene: boolean; detalle: string };
export type CondicionKey = 'enfermedad' | 'medicacion' | 'alergias' | 'dieta';
export type Condiciones = Record<CondicionKey, Condicion | null>;

export const CONDICIONES: Array<{ key: CondicionKey; pregunta: string; detalle: string }> = [
  { key: 'enfermedad', pregunta: '¿Tiene alguna enfermedad crónica o condición médica?', detalle: '¿Cuál?' },
  { key: 'medicacion', pregunta: '¿Toma alguna medicación?', detalle: '¿Cuál y en qué dosis?' },
  { key: 'alergias', pregunta: '¿Tiene alergias?', detalle: '¿A qué?' },
  { key: 'dieta', pregunta: '¿Sigue una dieta especial o tiene alguna restricción alimentaria?', detalle: '¿Cuál?' },
];

/** Primera pregunta que quedó sin responder, o undefined si están todas. */
export function condicionSinResponder(value: Condiciones) {
  return CONDICIONES.find((item) => value[item.key] === null);
}

interface CondicionesCamposProps {
  /** Prefijo único para los ids y los grupos de radio. */
  uid: string;
  value: Condiciones;
  onChange: (next: Condiciones) => void;
}

export function CondicionesCampos({ uid, value, onChange }: CondicionesCamposProps) {
  return (
    <div className="space-y-5">
      {CONDICIONES.map((item) => {
        const valor = value[item.key];
        const set = (next: Condicion) => onChange({ ...value, [item.key]: next });
        return (
          <fieldset key={item.key} className="m-0 min-w-0 border-0 p-0">
            <legend className={`${LABEL_CLASS} p-0`}>{item.pregunta}</legend>
            <div className="flex gap-2">
              {[{ label: 'Sí', tiene: true }, { label: 'No', tiene: false }].map((opcion) => (
                <label key={opcion.label} className="cursor-pointer">
                  <input
                    type="radio"
                    name={`${uid}-${item.key}`}
                    className="peer sr-only"
                    checked={valor?.tiene === opcion.tiene}
                    onChange={() => set({ tiene: opcion.tiene, detalle: opcion.tiene ? valor?.detalle ?? '' : '' })}
                  />
                  <span className="inline-flex min-w-[4.5rem] items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-2 text-sm font-bold text-brand-ink transition-colors peer-checked:border-brand-brown peer-checked:bg-brand-brown peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-brown">
                    {opcion.label}
                  </span>
                </label>
              ))}
            </div>
            {valor?.tiene && (
              <div className="mt-3">
                <label htmlFor={`${uid}-${item.key}-detalle`} className={LABEL_CLASS}>{item.detalle}</label>
                <textarea
                  id={`${uid}-${item.key}-detalle`}
                  className={`${INPUT_CLASS} resize-y`}
                  rows={2}
                  maxLength={500}
                  value={valor.detalle}
                  onChange={(e) => set({ tiene: true, detalle: e.target.value })}
                  required
                />
              </div>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
