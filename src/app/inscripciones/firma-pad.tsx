'use client';

import { useEffect, useRef, useState } from 'react';
import { Eraser } from 'lucide-react';
import { TEXT_BUTTON } from './ui';

// Recuadro para firmar con el dedo o el mouse. Devuelve la firma como imagen PNG.

interface FirmaPadProps {
  onChange: (dataUrl: string | null) => void;
  labelledBy: string;
}

export function FirmaPad({ onChange, labelledBy }: FirmaPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  // El lienzo se dimensiona una vez, con la densidad de la pantalla acotada para que la imagen no pese de más.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const context = canvas.getContext('2d');
    if (!context) return;
    context.scale(ratio, ratio);
    context.lineWidth = 2.2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#1f1410';
  }, []);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const context = event.currentTarget.getContext('2d');
    if (!context) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    const { x, y } = point(event);
    context.beginPath();
    context.moveTo(x, y);
    // Un toque sin arrastrar también deja marca.
    context.lineTo(x + 0.1, y + 0.1);
    context.stroke();
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const context = event.currentTarget.getContext('2d');
    if (!context) return;
    const { x, y } = point(event);
    context.lineTo(x, y);
    context.stroke();
  };

  const end = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    setHasInk(true);
    onChange(event.currentTarget.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
    setHasInk(false);
    onChange(null);
  };

  return (
    <div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          role="img"
          aria-labelledby={labelledBy}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          className="block h-44 w-full touch-none rounded-xl border border-stone-300 bg-white"
        />
        {!hasInk && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-stone-500">
            Firmá acá con el dedo o el mouse
          </span>
        )}
      </div>
      <div className="mt-2">
        <button type="button" onClick={clear} disabled={!hasInk} className={TEXT_BUTTON}>
          <Eraser size={14} aria-hidden />
          Borrar y firmar de nuevo
        </button>
      </div>
    </div>
  );
}
