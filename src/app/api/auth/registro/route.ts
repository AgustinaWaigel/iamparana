import { NextResponse } from 'next/server';
import { findUserByEmail, createUser } from '@/server/db/auth-repository';
import { hashPassword } from '@/server/lib/auth-security';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email || !EMAIL_PATTERN.test(email) || !password || password.length < 10) {
      return NextResponse.json({ error: 'Email y contraseña válidos son requeridos.' }, { status: 400 });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Ese email ya está registrado.' }, { status: 409 });
    }

    await createUser(email, hashPassword(password), 'miembro');

    return NextResponse.json({ success: true, role: 'miembro' });
  } catch (error) {
    console.error('Registro fallido', error);
    return NextResponse.json({ error: 'No se pudo crear la cuenta.' }, { status: 500 });
  }
}
