// Textos del Rosario Misionero, en el orden que pasó el equipo: señal de la cruz, acto de contrición
// y Credo, los cinco misterios, las intenciones del Papa, la Salve, las letanías y la oración final.
// Para corregir una oración alcanza con editar este archivo.

export const MISTERIOS = [
  { orden: 'Primer', continente: 'África', color: 'verde', hex: '#34b560', intencion: 'Ofrecemos esta decena por los niños y los pueblos de África. Pidamos por quienes sufren pobreza, enfermedad o violencia, y por todos los que anuncian allí el Evangelio.' },
  { orden: 'Segundo', continente: 'América', color: 'rojo', hex: '#e2453c', intencion: 'Ofrecemos esta decena por los niños y los pueblos de América. Pidamos por las familias, por quienes pasan necesidad y por los niños que trabajan por la paz y la justicia.' },
  { orden: 'Tercer', continente: 'Europa', color: 'blanco', hex: '#ffffff', intencion: 'Ofrecemos esta decena por los niños y los pueblos de Europa. Pidamos para que crezcan en la fe, la esperanza y el amor, y para que muchos conozcan a Jesús.' },
  { orden: 'Cuarto', continente: 'Oceanía', color: 'azul', hex: '#4f8df7', intencion: 'Ofrecemos esta decena por los niños y los pueblos de Oceanía, especialmente por quienes viven en islas lejanas. Pidamos que las comunidades puedan compartir el Evangelio y cuidarse unas a otras.' },
  { orden: 'Quinto', continente: 'Asia', color: 'amarillo', hex: '#f6c445', intencion: 'Ofrecemos esta decena por los niños y los pueblos de Asia. Pidamos por quienes tienen dificultades para vivir su fe, por la paz y por los niños que todavía no conocen a Jesús.' },
] as const;

// Los misterios de cada día y la intención misionera de cada uno, tomados del folleto
// "Reza el Rosario Misionero Mundial" de las Obras Misionales Pontificias.
export interface GrupoDeMisterios {
  nombre: string;
  misterios: Array<{ titulo: string; intencion: string }>;
}

const GOZOSOS: GrupoDeMisterios = {
  nombre: 'gozosos',
  misterios: [
    { titulo: 'La Anunciación', intencion: 'Que la Buena Nueva de un Salvador, anunciada por primera vez a María, sea proclamada a todo el mundo.' },
    { titulo: 'La Visitación', intencion: 'Que los misioneros que recorren largos caminos llevando a Cristo a los necesitados puedan fortalecerse en la fe y la santidad.' },
    { titulo: 'El nacimiento de Jesús', intencion: 'Por los niños de las misiones, especialmente los pobres y sin hogar, para que conozcan el amor de Jesús.' },
    { titulo: 'La presentación en el templo', intencion: 'Que las familias católicas de las Misiones, con el ejemplo de sus vidas, muestren el amor de Cristo a sus prójimos.' },
    { titulo: 'El Niño Jesús perdido y hallado en el Templo', intencion: 'Que todas las personas de las Misiones puedan encontrar alegría y paz en el Evangelio.' },
  ],
};

const LUMINOSOS: GrupoDeMisterios = {
  nombre: 'luminosos',
  misterios: [
    { titulo: 'El Bautismo en el Jordán', intencion: 'Al entrar Jesús humildemente en las aguas del bautismo, estamos llamados a renovar nuestras propias promesas bautismales y a solidarizarnos con aquellos que, en tierras de misión, descubren su identidad como hijos amados de Dios.' },
    { titulo: 'Las bodas de Caná', intencion: 'En Caná, Jesús transforma el agua en vino, recordándonos que debemos confiar en Su poder para satisfacer las necesidades materiales y espirituales de las familias de las comunidades misioneras que se enfrentan a retos diarios.' },
    { titulo: 'El anuncio del Reino de Dios', intencion: 'Jesús proclama el Reino con palabras y hechos; apoyemos a quienes, en los territorios de misión, proclaman el Evangelio con sus vidas, a menudo en lugares de gran pobreza o persecución.' },
    { titulo: 'La Transfiguración', intencion: 'En la montaña, los discípulos vislumbran la gloria de Cristo; que seamos inspirados para ser portadores de Su luz a las regiones misioneras que anhelan esperanza, sanación y justicia.' },
    { titulo: 'La Institución de la Eucaristía', intencion: 'En la Eucaristía, Jesús se ofrece a sí mismo: recordemos y recemos por los misioneros y los fieles locales que se reúnen en lugares remotos para recibir este don sagrado, a menudo con gran sacrificio personal.' },
  ],
};

const DOLOROSOS: GrupoDeMisterios = {
  nombre: 'dolorosos',
  misterios: [
    { titulo: 'La oración en el Huerto', intencion: 'En su soledad y temor, Jesús se entregó a la voluntad del Padre. Oremos por los misioneros que enfrentan el aislamiento y la incertidumbre, pero siguen fieles a su “sí” a Dios.' },
    { titulo: 'La flagelación de Jesús atado a la columna', intencion: 'Cristo soportó un sufrimiento brutal por amor; recordemos a aquellos que en los territorios de misión soportan dificultades y persecución por vivir y proclamar el Evangelio.' },
    { titulo: 'La coronación de espinas', intencion: 'Burlado y humillado, Jesús soportó la injusticia con fuerza y serenidad. Ojalá podamos solidarizarnos con los misioneros y los pobres que se enfrentan al ridículo, el rechazo y la opresión sistémica.' },
    { titulo: 'Jesús con la Cruz a cuestas', intencion: 'Jesús llevó el peso del mundo sobre sus hombros; que nosotros podamos aliviar a las familias de las zonas misioneras que soportan la pesada carga de la pobreza, la enfermedad y el dolor, mediante nuestras oraciones y nuestras generosas acciones.' },
    { titulo: 'La crucifixión y muerte de Jesús', intencion: 'En la cruz, el amor se derramó por completo; honremos el sacrificio de Cristo apoyando a quienes dan su vida al servicio de los demás, especialmente en los rincones más olvidados del mundo.' },
  ],
};

const GLORIOSOS: GrupoDeMisterios = {
  nombre: 'gloriosos',
  misterios: [
    { titulo: 'La Resurrección', intencion: 'Por toda la Iglesia, para que nuestra fe en Cristo Resucitado atraiga a otros hacia Él.' },
    { titulo: 'La Ascensión', intencion: 'Por nuestro Santo Padre, para que el Espíritu le conceda sabiduría, fortaleza y santidad en su guía de la Iglesia por el camino de Cristo.' },
    // El folleto no trae este misterio (en su lugar repite "La presentación en el templo"):
    // va sin intención hasta que el equipo pase el texto.
    { titulo: 'La venida del Espíritu Santo', intencion: '' },
    { titulo: 'La Asunción de Nuestra Señora al Cielo', intencion: 'Que María, que dio al mundo el cuerpo humano de Cristo, nos inspire a nosotros, que formamos el Cuerpo de Cristo, a anhelar el cielo y traer el Reino de Dios a la tierra.' },
    { titulo: 'La Coronación de María como Reina del Cielo', intencion: 'Que por intercesión de María, Reina de las Misiones, los jóvenes y las jóvenes ofrezcan sus vidas a Dios como sacerdotes y religiosos al servicio del prójimo.' },
  ],
};

/** Qué misterios se rezan cada día de la semana, empezando por el domingo. */
export const MISTERIOS_DEL_DIA = [GLORIOSOS, GOZOSOS, DOLOROSOS, GLORIOSOS, LUMINOSOS, DOLOROSOS, GOZOSOS];

export const SENAL_DE_LA_CRUZ = `Guía: Por la señal de la Santa Cruz, de nuestros enemigos líbranos, Señor, Dios nuestro.
En el nombre del Padre, y del Hijo, y del Espíritu Santo.
Todos: Amén.`;

export const ACTO_DE_CONTRICION = `Jesús, me arrepiento de todo corazón de haberte ofendido.
Quiero amar a Dios sobre todas las cosas
y amar a los demás como Tú nos enseñaste.
Ayúdame a evitar el pecado,
a hacer el bien y a pedir perdón cuando me equivoco.
Amén.`;

export const CREDO = `Creo en Dios, Padre todopoderoso,
creador del cielo y de la tierra.
Creo en Jesucristo, su único Hijo, nuestro Señor,
que fue concebido por obra y gracia del Espíritu Santo,
nació de Santa María Virgen,
padeció bajo el poder de Poncio Pilato,
fue crucificado, muerto y sepultado,
descendió a los infiernos,
al tercer día resucitó de entre los muertos,
subió a los cielos y está sentado a la derecha de Dios, Padre todopoderoso.
Desde allí ha de venir a juzgar a vivos y muertos.
Creo en el Espíritu Santo,
la santa Iglesia católica,
la comunión de los santos,
el perdón de los pecados,
la resurrección de la carne
y la vida eterna. Amén.`;

// Las oraciones que se rezan a dos voces llevan una línea "//" donde se dividen: una mitad la dice
// quien guía y la otra el resto. En el texto de las demás, "Guía:" y "Todos:" marcan quién dice cada parte;
// en pantalla no se escriben esas palabras: cada voz se ve de un color.
export const PADRENUESTRO = `Padre nuestro, que estás en el cielo,
santificado sea tu nombre;
venga a nosotros tu reino;
hágase tu voluntad en la tierra como en el cielo.
//
Danos hoy nuestro pan de cada día;
perdona nuestras ofensas,
como también nosotros perdonamos a los que nos ofenden;
no nos dejes caer en la tentación
y líbranos del mal. Amén.`;

export const AVEMARIA = `Dios te salve, María,
llena eres de gracia; el Señor es contigo.
Bendita tú eres entre todas las mujeres
y bendito es el fruto de tu vientre, Jesús.
//
Santa María, Madre de Dios,
ruega por nosotros, pecadores,
ahora y en la hora de nuestra muerte. Amén.`;

export const GLORIA = `Gloria al Padre, y al Hijo, y al Espíritu Santo.
//
Como era en el principio, ahora y siempre,
por los siglos de los siglos. Amén.`;

export const OH_JESUS_MIO = `Oh Jesús mío, perdona nuestros pecados,
líbranos del fuego del infierno,
lleva al cielo a todas las almas,
especialmente a las más necesitadas de tu misericordia. Amén.`;

/** Lo que dice quien guía antes de rezar por el Papa. Lleva su nombre: hay que actualizarlo cuando cambie. */
export const INTENCIONES_DEL_PAPA = 'Jesús, te pedimos por el papa León XIV y por las intenciones que lleva en su corazón. Te pedimos también por la paz, por la Iglesia y por los niños de todo el mundo.';

export const SALVE = `Dios te salve, Reina y Madre de misericordia,
vida, dulzura y esperanza nuestra, Dios te salve.
A ti llamamos los desterrados hijos de Eva;
a ti suspiramos, gimiendo y llorando
en este valle de lágrimas.
Ea, pues, Señora, abogada nuestra,
vuelve a nosotros esos tus ojos misericordiosos;
y después de este destierro,
muéstranos a Jesús, fruto bendito de tu vientre.
¡Oh clemente, oh piadosa, oh dulce Virgen María!

Guía: Ruega por nosotros, Santa Madre de Dios.
Todos: Para que seamos dignos de alcanzar las promesas de nuestro Señor Jesucristo. Amén.`;

/** Invocaciones a María: a cada una se responde "Ruega por nosotros". */
const INVOCACIONES = [
  'Santa María', 'Santa Madre de Dios', 'Santa Virgen de las vírgenes', 'Madre de Cristo', 'Madre de la Iglesia', 'Madre de la misericordia',
  'Madre de la divina gracia', 'Madre de la esperanza', 'Madre purísima', 'Madre castísima', 'Madre siempre virgen', 'Madre inmaculada',
  'Madre amable', 'Madre admirable', 'Madre del buen consejo', 'Madre del Creador', 'Madre del Salvador', 'Virgen prudentísima',
  'Virgen digna de veneración', 'Virgen digna de alabanza', 'Virgen poderosa', 'Virgen clemente', 'Virgen fiel', 'Espejo de justicia',
  'Trono de la sabiduría', 'Causa de nuestra alegría', 'Vaso espiritual', 'Vaso digno de honor', 'Vaso insigne de devoción', 'Rosa mística',
  'Torre de David', 'Torre de marfil', 'Casa de oro', 'Arca de la Alianza', 'Puerta del cielo', 'Estrella de la mañana',
  'Salud de los enfermos', 'Refugio de los pecadores', 'Consuelo de los migrantes', 'Consoladora de los afligidos', 'Auxilio de los cristianos',
  'Reina de los ángeles', 'Reina de los patriarcas', 'Reina de los profetas', 'Reina de los apóstoles', 'Reina de los mártires',
  'Reina de los confesores de la fe', 'Reina de las vírgenes', 'Reina de todos los santos', 'Reina concebida sin pecado original',
  'Reina asunta al cielo', 'Reina del santísimo Rosario', 'Reina de la familia', 'Reina de la paz',
];

export const LETANIA = `Guía: Señor, ten piedad.
Todos: Señor, ten piedad.
Guía: Cristo, ten piedad.
Todos: Cristo, ten piedad.
Guía: Señor, ten piedad.
Todos: Señor, ten piedad.

Guía: Cristo, óyenos.
Todos: Cristo, óyenos.
Guía: Cristo, escúchanos.
Todos: Cristo, escúchanos.

Dios, Padre celestial. — Ten misericordia de nosotros.
Dios, Hijo, Redentor del mundo. — Ten misericordia de nosotros.
Dios, Espíritu Santo. — Ten misericordia de nosotros.
Santísima Trinidad, un solo Dios. — Ten misericordia de nosotros.

${INVOCACIONES.map((invocacion) => `${invocacion}. — Ruega por nosotros.`).join('\n')}

Guía: Cordero de Dios, que quitas el pecado del mundo.
Todos: Perdónanos, Señor.

Guía: Cordero de Dios, que quitas el pecado del mundo.
Todos: Escúchanos, Señor.

Guía: Cordero de Dios, que quitas el pecado del mundo.
Todos: Ten misericordia de nosotros.

Guía: Ruega por nosotros, Santa Madre de Dios.
Todos: Para que seamos dignos de las promesas de Cristo.`;

export const ORACION_FINAL = `Guía: Jesús, amigo de todos los niños, recibe nuestra oración por los pueblos del mundo. Ayúdanos a compartir lo que somos y tenemos, a tratar a todos como hermanos y a anunciarte con nuestras palabras y acciones. María, acompaña a los niños misioneros y enséñanos a decirle a Jesús: “Aquí estoy, envíame”. Amén.

En el nombre del Padre, y del Hijo, y del Espíritu Santo.
Todos: Amén.`;
