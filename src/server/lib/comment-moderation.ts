import "server-only";

type ModerationResult = { allowed: true } | { allowed: false; message: string };

const BLOCKED_PATTERNS = [
  /^put[ao]s?$/,
  /^pelotud[ao]s?$/,
  /^bolud[ao]s?$/,
  /^mierdas?$/,
  /^carajos?$/,
  /^conchas?$/,
  /^culos?$/,
  /^forr[ao]s?$/,
  /^pajer[ao]s?$/,
  /^pijas?$/,
  /^chupapijas?$/,
  /^vergas?$/,
  /^idiotas?$/,
  /^imbeciles?$/,
  /^estupid[ao]s?$/,
  /^tarad[ao]s?$/,
  /^mogolic[ao]s?$/,
  /^maricones?$/,
  /^trol[ao]s?$/,
  /^hdp$/,
];

function normalizeForModeration(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/(.)\1{2,}/g, "$1");
}

function containsBlockedLanguage(value: string) {
  const normalized = normalizeForModeration(value);
  const words = normalized
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z]/g, ""))
    .filter(Boolean);

  if (words.some((word) => BLOCKED_PATTERNS.some((pattern) => pattern.test(word)))) return true;

  // Detecta intentos como "p.u.t.o" sin buscar dentro de palabras legítimas.
  let separatedLetters = "";
  for (const word of words) {
    if (word.length === 1) {
      separatedLetters += word;
      if (separatedLetters.length >= 3 && BLOCKED_PATTERNS.some((pattern) => pattern.test(separatedLetters))) return true;
    } else {
      separatedLetters = "";
    }
  }
  return false;
}

export function moderateComment(content: string): ModerationResult {
  if (containsBlockedLanguage(content)) {
    return { allowed: false, message: "El comentario contiene lenguaje inapropiado. Reformulalo para poder publicarlo." };
  }

  const links = content.match(/https?:\/\/|www\./gi)?.length || 0;
  if (links > 2) {
    return { allowed: false, message: "El comentario contiene demasiados enlaces." };
  }

  if (/(.)\1{14,}/i.test(content)) {
    return { allowed: false, message: "El comentario parece contener texto repetitivo o spam." };
  }

  return { allowed: true };
}
