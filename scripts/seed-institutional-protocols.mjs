import { createClient } from '@libsql/client';

const url = process.env.TURSO_CONNECTION_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) throw new Error('Falta la configuración de Turso');

const db = createClient({ url, authToken });
const adminResult = await db.execute("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
const adminId = Number(adminResult.rows[0]?.id || 0);
if (!adminId) throw new Error('No se encontró un administrador para asociar los documentos');

let pageResult = await db.execute({ sql: "SELECT id FROM resource_pages WHERE section = 'institucional' AND slug = 'protocolos' LIMIT 1", args: [] });
let pageId = Number(pageResult.rows[0]?.id || 0);
if (!pageId) {
  const inserted = await db.execute({
    sql: "INSERT INTO resource_pages (slug, title, section, description, texture_url, created_by_user_id) VALUES (?, ?, ?, ?, ?, ?)",
    args: ['protocolos', 'Protocolos', 'institucional', 'Protocolos y normas oficiales para el cuidado y la actuación responsable.', '/assets/textures/areasg.webp', adminId],
  });
  pageId = Number(inserted.lastInsertRowid);
  await db.execute({ sql: "INSERT OR REPLACE INTO resource_page_styles (page_id, template, updated_at) VALUES (?, 'earth', CURRENT_TIMESTAMP)", args: [pageId] });
}

let sectionResult = await db.execute({ sql: "SELECT id, section_key FROM resource_sections WHERE page_id = ? AND slug = 'protocolos-oficiales' LIMIT 1", args: [pageId] });
let sectionKey = String(sectionResult.rows[0]?.section_key || '');
if (!sectionKey) {
  sectionKey = 'rp:protocolos:protocolos-oficiales';
  await db.execute({ sql: 'INSERT INTO resource_sections (page_id, slug, title, section_key, position) VALUES (?, ?, ?, ?, 0)', args: [pageId, 'protocolos-oficiales', 'Protocolos', sectionKey] });
}

const documents = [
  ['Normas arquidiocesanas de comportamiento para el trato con niños, adolescentes y personas vulnerables', '1lx8BD5uiEke50tY0Qby4C473E92F9k4j'],
  ['Protocolo arquidiocesano de actuación ante la sospecha o descubrimiento de abusos sexuales', '1cBmbT9Htkgi9iomNodYdAuQI67f_-spn'],
];

for (const [title, fileId] of documents) {
  const existing = await db.execute({ sql: 'SELECT id FROM documents WHERE google_drive_id = ? LIMIT 1', args: [fileId] });
  if (existing.rows.length) {
    await db.execute({ sql: 'UPDATE documents SET section = ?, title = ?, google_drive_url = ? WHERE google_drive_id = ?', args: [sectionKey, title, `https://drive.google.com/file/d/${fileId}/view`, fileId] });
  } else {
    await db.execute({ sql: 'INSERT INTO documents (section, title, google_drive_id, google_drive_url, file_size, file_type, uploaded_by_user_id) VALUES (?, ?, ?, ?, 0, ?, ?)', args: [sectionKey, title, fileId, `https://drive.google.com/file/d/${fileId}/view`, 'application/pdf', adminId] });
  }
}

console.log('Protocolos institucionales preparados correctamente.');
db.close();
