let usoAmericano = false;
let transposicionActual = 0;

const tonosLatinos = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
const tonosAmericanos = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function normalizarAcorde(acorde: string): { base: string; resto: string } {
  acorde = acorde.trim();

  for (let i = 0; i < tonosLatinos.length; i++) {
    if (acorde.startsWith(tonosLatinos[i])) {
      return { base: tonosLatinos[i], resto: acorde.slice(tonosLatinos[i].length) };
    }
  }

  for (let i = 0; i < tonosAmericanos.length; i++) {
    if (acorde.startsWith(tonosAmericanos[i])) {
      return { base: tonosAmericanos[i], resto: acorde.slice(tonosAmericanos[i].length) };
    }
  }

  return { base: acorde, resto: '' };
}

export function inicializarAcordes() {
  document.querySelectorAll<HTMLSpanElement>('.Chord').forEach((span) => {
    span.dataset.original = span.textContent ?? '';
  });
  actualizarAcordes();
}

export function cambiarTonalidad(shift: number) {
  transposicionActual = (transposicionActual + shift + 12) % 12;
  actualizarAcordes();
}

export function alternarCifrado() {
  usoAmericano = !usoAmericano;
  actualizarAcordes();
}

function actualizarAcordes() {
  document.querySelectorAll<HTMLSpanElement>('.Chord').forEach((span) => {
    const original = span.dataset.original ?? '';
    const { base, resto } = normalizarAcorde(original);

    let indexLat = tonosLatinos.indexOf(base);
    let indexAm = tonosAmericanos.indexOf(base);

    let index = indexLat !== -1 ? indexLat : indexAm;
    if (index === -1) return;

    const nuevoIndex = (index + transposicionActual + 12) % 12;
    const nuevoBase = usoAmericano ? tonosAmericanos[nuevoIndex] : tonosLatinos[nuevoIndex];

    span.textContent = nuevoBase + resto;
  });
}
