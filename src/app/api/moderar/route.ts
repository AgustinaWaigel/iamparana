// app/api/moderar/route.ts

import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const ADMIN_KEY = process.env.ADMIN_KEY;

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${ADMIN_KEY}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { slug, index, aprobado } = await req.json();
  const filePath = path.join(process.cwd(), 'data', 'comentarios', `${slug}.json`);

  if (!fs.existsSync(filePath)) return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });

  const comentarios = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  comentarios[index].aprobado = aprobado;
  fs.writeFileSync(filePath, JSON.stringify(comentarios, null, 2));

  return NextResponse.json({ success: true });
}
