import "server-only";

import { createClient } from "@libsql/client";

let cachedClient: ReturnType<typeof createClient> | null = null;
let schemaInitialized = false;

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

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
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
  url TEXT NOT NULL,
  icon TEXT,
  created_by_user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_links_section ON links(section);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);
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

async function initializeSchema() {
  if (schemaInitialized || !cachedClient) {
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

    schemaInitialized = true;
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
