// data.jsx — contenido de ejemplo para el inicio de IAM Paraná
// (texto de muestra, reemplazable por el contenido real del CMS)

const SLIDES = [
  {
    img: "assets/iam-santo-espiritu.webp",
    cat: "Encuentros",
    title: "Jornada diocesana de la infancia misionera",
    text: "Más de 200 chicos y chicas se reunieron en la parroquia Espíritu Santo para celebrar la misión.",
    href: "#",
  },
  {
    img: "assets/foto-francisco.png",
    href: "#",
    bare: true,
  },
  {
    img: "assets/campadol.png",
    cat: "Campamento",
    title: "Campamento de adolescentes 2026",
    text: "Tres días de juegos, oración y aventura. ¡Inscripciones abiertas hasta fin de mes!",
    href: "#",
    contain: true,
    bg: "#e9a92c",
  },
];

const NOTICIAS = [
  {
    img: "assets/foto-francisco.png",
    cat: "Iglesia",
    date: "28 abr 2026",
    title: "Gracias, Francisco: el legado misionero del Papa para los más chicos",
    text: "Recordamos las palabras de Francisco a la Infancia Misionera y su llamado constante a una Iglesia en salida, cercana a los niños del mundo entero.",
    href: "#",
    feature: true,
  },
  {
    img: "assets/iam-santo-espiritu.webp",
    cat: "Encuentros",
    date: "12 abr 2026",
    title: "Una jornada para celebrar la misión en la parroquia Espíritu Santo",
    text: "Talleres, juegos y una misa que reunió a las comunidades de toda la diócesis.",
    href: "#",
  },
  {
    img: "assets/campadol.png",
    cat: "Campamento",
    date: "05 abr 2026",
    title: "Abrimos las inscripciones al Campamento de Adolescentes 2026",
    text: "Cupos limitados. Conocé las fechas, el lugar y todo lo que tenés que llevar.",
    href: "#",
    contain: true,
    bg: "#e9a92c",
  },
  {
    img: "assets/cris-camargo.webp",
    cat: "Formación",
    date: "30 mar 2026",
    title: "Nuevos materiales para animadores y catequistas",
    text: "Descargá las guías del año misionero con dinámicas para cada encuentro.",
    href: "#",
    contain: true,
    bg: "#fbe6c6",
  },
  {
    img: "assets/fano.webp",
    cat: "Espiritualidad",
    date: "22 mar 2026",
    title: "Mes de la oración misionera: rezamos por los niños del mundo",
    text: "Una propuesta semanal para acompañar a los chicos en su vida de fe.",
    href: "#",
    contain: true,
    bg: "#cfe8e6",
  },
];

const AGENDA = [
  { d: "10", m: "MAY", title: "Encuentro de animadores IAM", place: "Curia · Paraná", tag: "Formación" },
  { d: "18", m: "MAY", title: "Jornada misionera de la infancia", place: "Parroquia Espíritu Santo", tag: "Encuentro" },
  { d: "07", m: "JUN", title: "Campamento de adolescentes 2026", place: "Villa Urquiza", tag: "Campamento" },
  { d: "21", m: "JUN", title: "Misa de envío misionero", place: "Catedral de Paraná", tag: "Celebración" },
];

const NAV = ["Inicio", "Quiénes somos", "Noticias", "Recursos", "Agenda", "Contacto"];

Object.assign(window, { SLIDES, NOTICIAS, AGENDA, NAV });
