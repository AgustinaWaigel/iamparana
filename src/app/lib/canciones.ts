import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const cancionesDir = path.join(process.cwd(), 'contents/canciones');

export function getAllCanciones() {
  const files = fs.readdirSync(cancionesDir);

  return files.map((filename) => {
    const filePath = path.join(cancionesDir, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(fileContent);

    const slug = filename.replace(/\.md$/, '');

    return {
      title: data.title,
      artist: data.artist,
      slug,
    };
  });
}
export function getCancionBySlug(slug: string) {
  const filePath = path.join(cancionesDir, `${slug}.md`);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  return {
    title: data.title,
    artist: data.artist,
    content,
  };
}


