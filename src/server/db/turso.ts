import "server-only";

import { createClient } from "@libsql/client";

let cachedClient: ReturnType<typeof createClient> | null = null;
const globalForTurso = globalThis as typeof globalThis & {
  __iamparanaSchemaInitialized?: boolean;
};

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS noticias (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  cat TEXT DEFAULT 'NACIONAL',
  bajada TEXT,
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_noticias_date ON noticias(date DESC);

CREATE TABLE IF NOT EXISTS noticias_galeria (
  id INTEGER PRIMARY KEY,
  noticia_slug TEXT NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  "order" INTEGER DEFAULT 999,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (noticia_slug) REFERENCES noticias(slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_noticias_galeria_slug ON noticias_galeria(noticia_slug);
CREATE INDEX IF NOT EXISTS idx_noticias_galeria_order ON noticias_galeria("order");

CREATE TABLE IF NOT EXISTS canciones (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carousel (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE,
  imageDesktop TEXT NOT NULL,
  imageMobile TEXT NOT NULL,
  alt TEXT NOT NULL,
  link TEXT,
  buttonText TEXT,
  "order" INTEGER DEFAULT 999,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_carousel_order ON carousel("order");

CREATE TABLE IF NOT EXISTS juegos (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  youtubeId TEXT,
  category TEXT DEFAULT 'general',
  "order" INTEGER DEFAULT 999,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_juegos_order ON juegos("order");

CREATE TABLE IF NOT EXISTS agenda (
  id INTEGER PRIMARY KEY,
  evento TEXT NOT NULL,
  fecha TEXT NOT NULL,
  fecha_fin TEXT,
  color TEXT,
  descripcion TEXT,
  hora_inicio TEXT,
  hora_fin TEXT,
  todo_el_dia INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agenda_fecha ON agenda(fecha);

CREATE TABLE IF NOT EXISTS comentarios (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL,
  content TEXT,
  aprobado INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comentarios_slug ON comentarios(slug);

CREATE TABLE IF NOT EXISTS animacion_content (
  id INTEGER PRIMARY KEY,
  section TEXT UNIQUE NOT NULL DEFAULT 'main',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO animacion_content (section, title, description) VALUES
  ('main', 'Animación', 'Cantar, bailar, jugar. Parte de nuestro día a día en la IAM es esto, por eso venimos a ayudarte con recursos para tus encuentros, y con el día a día. Acá vas a poder encontrar las canciones que cantamos siempre en la IAM y también muchos juegos y dinámicas que te van a servir. ¡A jugar y a bailar!');

CREATE TABLE IF NOT EXISTS custom_content (
  id INTEGER PRIMARY KEY,
  seccion TEXT UNIQUE NOT NULL,
  titulo TEXT,
  contenido TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO custom_content (seccion, titulo, contenido) VALUES
  ('espiritualidad', 'Espiritualidad', '## Oraciones\n\n### Oración del Animador\nSeñor Jesús, alabado seas porque has dado tu vida por la salvación de todos los hombres y de todos los pueblos. Te doy gracias porque me has escogido para ser tu apóstol y me has llamado a cultivar en mí y en los niños y adolescentes el amor universal. Te pido que me ayudes a ser un misionero como Tú, que anhela ir por el mundo para hacer discípulos tuyos en todos los pueblos. Guíame con la luz de tu Espíritu para saber despertar en los niños y adolescentes que me has encomendado el gusto por la misión así, que su alegría sea plena. Enséñame a quererlos con el mismo amor con que los amas Tú y a guiarlos con el fervor ardiente de mi juventud. Que Tu amor sea mi amor. Que Tu paciencia sea mi paciencia. Que Tus palabras sean mis palabras. Te lo pido a Tí, Enviado del Padre, con la fuerza del Espíritu, que vives y reinas por los siglos de los siglos. Amén.\n\n### Oración por los niños y adolescentes\nSeñor Jesús, apenas estoy empezando la vida y Tú me llamas a una misión. Bien sabes, Señor, que no tengo nada, solo deseos de servirte. Dame tu sabiduría, tu amor, tu paz, y un corazón grande que abrace a todo el mundo. Solo, Señor, no puedo hacer nada, pero contigo será mucho lo que lograré. Señor, millones de niños y adolescentes no te conocen y, por lo tanto, no son felices. Yo te ofrezco mi vida entera y me pongo en tus manos; Iléname de valentía, sinceridad y responsabilidad para con mis hermanos. Señor, yo sé que me escuchas y me acompañas siempre. Solo quiero que tu nombre sea conocido en todo el universo, y tu Reino de Amor se extienda cada vez más. Amén.\n\n### Oración a San Francisco Javier\nTú, que diste hasta el último suspiro por ser fiel a Jesús: danos fortaleza en la fe. Tú, que dejaste nobleza y tierra por la causa de Jesús: ayudanos a ser generosos. Tú, que viviste tan cerca del dolor y de los enfermos: intercede, ante Dios, por nuestras necesidades. Tú, que tuviste como gran tesoro a Cristo: haznos descubrir su presencia. Tú, que naciste para gloria de tu pueblo: animanos a dar gloria a Dios en nuestra Patria. Tú, que surcaste tierra y mares: imprime valentía en nuestra misión. Tú, que hiciste de Jesús tu pasión y la razón de tu existir: empujanos a vivir siempre en Él, con Él y por El. Amén.\n\n### Oración a Santa Teresita\n¡Santa Teresita del Niño Jesús, modelo de humildad, de confianza y de amor! Desde lo alto de los cielos deshoja sobre nosotros esas rosas que llevas en tus brazos: La rosa de la humildad, para que sujete nuestro orgullo; La rosa de la confianza, para que nos abandonemos a la voluntad de Dios y descansemos en su misericordia; La rosa del amor, para que abriendo nuestras almas sin medida a la gracia, realicemos el único fin para el que Dios nos ha creado a su imagen; amarle y hacerle amar. Tú que pasas tu cielo haciendo bien en la tierra, concédeme imitarte en tus virtudes y amar a Jesucristo como tú lo amaste. Amén.\n\n## Guiones\n\n- Guión 1 - Compromiso Animadores: https://drive.google.com/file/d/14pYMAo5rrhnTLPIzYa1PTZk1wN2QIzLa/view?usp=drive_link\n- Guión 2 - Entrega de la Pañoleta: https://drive.google.com/file/d/1y9vGuTQX4IbW4ziqxQ0Z7aoK8pITlRvo/view?usp=drive_link\n- Guión 3 - Entrega del Carnet: https://drive.google.com/file/d/1u20udvULUX_hnIs-bHkrr3Sov49pZWdx/view?usp=drive_link\n- Guión 4 - Entrega del Escudo: https://drive.google.com/file/d/1FjL5gUwJXq0Y3QYscq5x9Ne6HeWTFl2m/view?usp=drive_link\n- Guión 5 - Renovación Consagración: https://drive.google.com/file/d/1vQcl8dJ-eVF196COHI1XZLObpvWw3x8i/view?usp=drive_link');

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  password_hash TEXT NOT NULL,
  role_id INTEGER NOT NULL DEFAULT 5,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY,
  section TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  google_drive_id TEXT NOT NULL UNIQUE,
  google_drive_url TEXT,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by_user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_documents_section ON documents(section);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

CREATE TABLE IF NOT EXISTS google_drive_config (
  id INTEGER PRIMARY KEY,
  section TEXT UNIQUE NOT NULL,
  folder_id TEXT NOT NULL,
  folder_name TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_urls (
  id INTEGER PRIMARY KEY,
  document_id INTEGER,
  original_filename TEXT NOT NULL,
  mime_type TEXT,
  google_drive_url TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY,
  section TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  url TEXT NOT NULL,
  icon TEXT,
  created_by_user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_links_section ON links(section);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);

CREATE TABLE IF NOT EXISTS resource_pages (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  texture_url TEXT,
  created_by_user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_resource_pages_slug ON resource_pages(slug);

CREATE TABLE IF NOT EXISTS resource_sections (
  id INTEGER PRIMARY KEY,
  page_id INTEGER NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  section_key TEXT UNIQUE NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (page_id) REFERENCES resource_pages(id) ON DELETE CASCADE,
  UNIQUE(page_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_resource_sections_page ON resource_sections(page_id, position ASC);

CREATE TABLE IF NOT EXISTS resource_page_styles (
  page_id INTEGER PRIMARY KEY,
  template TEXT NOT NULL DEFAULT 'gold',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (page_id) REFERENCES resource_pages(id) ON DELETE CASCADE
);
`;

// Ejecutar inserts de datos iniciales
const INITIAL_DATA_SQL = `
INSERT OR IGNORE INTO roles (name, description) VALUES
  ('admin', 'Administrador del sistema'),
  ('equipo', 'Miembro del equipo'),
  ('redactor', 'Redactor de contenido'),
  ('coordinador', 'Coordinador de actividades'),
  ('animador', 'Animador de eventos');

INSERT OR IGNORE INTO google_drive_config (section, folder_id, folder_name) VALUES
  ('noticias', '', 'Noticias'),
  ('formacion', '', 'Formación'),
  ('comunicacion', '', 'Comunicación'),
  ('espiritualidad', '', 'Espiritualidad'),
  ('institucional', '', 'Institucional'),
  ('logistica', '', 'Logística');
`;

async function ensureAgendaColumns() {
  if (!cachedClient) {
    return;
  }

  try {
    await cachedClient.execute("ALTER TABLE agenda ADD COLUMN color TEXT");
  } catch (error) {
    const message = String(error instanceof Error ? error.message : error || "").toLowerCase();
    if (!message.includes("duplicate column")) {
      throw error;
    }
  }

  try {
    await cachedClient.execute("ALTER TABLE agenda ADD COLUMN descripcion TEXT");
  } catch (error) {
    const message = String(error instanceof Error ? error.message : error || "").toLowerCase();
    if (!message.includes("duplicate column")) {
      throw error;
    }
  }

  try {
    await cachedClient.execute("ALTER TABLE agenda ADD COLUMN hora_inicio TEXT");
  } catch (error) {
    const message = String(error instanceof Error ? error.message : error || "").toLowerCase();
    if (!message.includes("duplicate column")) {
      throw error;
    }
  }

  try {
    await cachedClient.execute("ALTER TABLE agenda ADD COLUMN hora_fin TEXT");
  } catch (error) {
    const message = String(error instanceof Error ? error.message : error || "").toLowerCase();
    if (!message.includes("duplicate column")) {
      throw error;
    }
  }

  try {
    await cachedClient.execute("ALTER TABLE agenda ADD COLUMN todo_el_dia INTEGER NOT NULL DEFAULT 1");
  } catch (error) {
    const message = String(error instanceof Error ? error.message : error || "").toLowerCase();
    if (!message.includes("duplicate column")) {
      throw error;
    }
  }
}

async function ensureUsersColumns() {
  if (!cachedClient) {
    return;
  }

  try {
    await cachedClient.execute("ALTER TABLE users ADD COLUMN display_name TEXT");
  } catch (error) {
    const message = String(error instanceof Error ? error.message : error || "").toLowerCase();
    if (!message.includes("duplicate column")) {
      throw error;
    }
  }
}

async function ensureThumbnailColumns() {
  if (!cachedClient) {
    return;
  }

  try {
    await cachedClient.execute("ALTER TABLE documents ADD COLUMN thumbnail_url TEXT");
  } catch (error) {
    const message = String(error instanceof Error ? error.message : error || "").toLowerCase();
    if (!message.includes("duplicate column")) {
      throw error;
    }
  }

  try {
    await cachedClient.execute("ALTER TABLE links ADD COLUMN thumbnail_url TEXT");
  } catch (error) {
    const message = String(error instanceof Error ? error.message : error || "").toLowerCase();
    if (!message.includes("duplicate column")) {
      throw error;
    }
  }

  try {
    await cachedClient.execute("ALTER TABLE resource_pages ADD COLUMN thumbnail_url TEXT");
  } catch (error) {
    const message = String(error instanceof Error ? error.message : error || "").toLowerCase();
    if (!message.includes("duplicate column")) {
      throw error;
    }
  }
}

async function initializeSchema() {
  if (globalForTurso.__iamparanaSchemaInitialized || !cachedClient) {
    return;
  }

  try {
    // Ejecutar schema
    const statements = SCHEMA_SQL.split(';').filter((s) => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await cachedClient.execute(statement.trim());
      }
    }

    // Ejecutar datos iniciales
    const dataStatements = INITIAL_DATA_SQL.split(';').filter((s) => s.trim());
    for (const statement of dataStatements) {
      if (statement.trim()) {
        await cachedClient.execute(statement.trim());
      }
    }

    await ensureAgendaColumns();
    await ensureUsersColumns();
    await ensureThumbnailColumns();

    globalForTurso.__iamparanaSchemaInitialized = true;
    console.log('✓ Schema de base de datos inicializado');
  } catch (error) {
    console.error('Error inicializando schema:', error);
  }
}

export function getTursoClient() {
  const url = process.env.TURSO_CONNECTION_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient({
      url,
      authToken,
    });
  }

  return cachedClient;
}

export async function ensureSchemaInitialized() {
  getTursoClient(); // Asegurar que el cliente existe
  await initializeSchema();
}
