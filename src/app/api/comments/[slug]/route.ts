import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const COMMENTS_DIR = path.join(process.cwd(), 'comments');

function getFilePath(slug: string) {
  return path.join(COMMENTS_DIR, `${slug}.json`);
}

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  if (!slug) return NextResponse.json([], { status: 400 });

  try {
    const filePath = getFilePath(slug);
    if (!fs.existsSync(filePath)) return NextResponse.json([]);
    const content = fs.readFileSync(filePath, 'utf-8');
    const comments = JSON.parse(content);
    const approved = comments.filter((c: any) => c.approved);
    return NextResponse.json(approved);
  } catch (error) {
    return NextResponse.json({ error: 'Error leyendo comentarios' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug;

  try {
    const { content } = await req.json();
    if (!slug || !content) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const filePath = getFilePath(slug);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const newComment = {
      id: uuidv4(),
      content,
      timestamp: Date.now(),
      approved: false, // 👈 pendiente de aprobación
    };

    let comments: any[] = [];
    if (fs.existsSync(filePath)) {
      comments = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    comments.push(newComment);
    fs.writeFileSync(filePath, JSON.stringify(comments, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error guardando comentario' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  const { id, action } = await req.json(); // action: "approve" o "delete"

  if (!slug || !id || !['approve', 'delete'].includes(action)) {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }

  const filePath = getFilePath(slug);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'No hay comentarios para este slug' }, { status: 404 });
  }

  let comments = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  if (action === 'approve') {
    comments = comments.map((c: any) => (c.id === id ? { ...c, approved: true } : c));
  } else if (action === 'delete') {
    comments = comments.filter((c: any) => c.id !== id);
  }

  fs.writeFileSync(filePath, JSON.stringify(comments, null, 2));
  return NextResponse.json({ success: true });
}
