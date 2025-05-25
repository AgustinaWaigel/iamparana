import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const noticiasDir = path.join(process.cwd(), 'contents', 'noticias');

export function getAllNoticiasSlugs() {
  return fs.readdirSync(noticiasDir).map((file) => file.replace(/\.md$/, ''));
}

export function getNoticiaBySlug(slug: string) {
  const filePath = path.join(noticiasDir, `${slug}.md`);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  return {
    slug,
    frontmatter: data,
    content,
  };
}
