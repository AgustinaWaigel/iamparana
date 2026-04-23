import { NextResponse } from 'next/server';
import { getSessionUserByTokenHash } from '@/server/db/auth-repository';
import { AUTH_COOKIE_NAME, hashPassword, hashSessionToken, verifyPassword } from '@/server/lib/auth-security';
import { getTursoClient } from '@/server/db/turso';

function getCookieValue(cookieHeader: string, name: string) {
  const parts = cookieHeader.split(';').map((value) => value.trim());
  const match = parts.find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export async function PATCH(req: Request) {
  try {
    // Validar autenticación
    const cookieHeader = req.headers.get('cookie') ?? '';
    const token = getCookieValue(cookieHeader, AUTH_COOKIE_NAME);

    if (!token) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const sessionUser = await getSessionUserByTokenHash(hashSessionToken(token));
    if (!sessionUser || !sessionUser.isActive) {
      return NextResponse.json({ message: 'Sesión inválida' }, { status: 401 });
    }

    // Obtener datos del formulario
    const body = await req.json();
    const { nombre, email, currentPassword, newPassword } = body;

    // Validaciones
    if (!nombre || !email) {
      return NextResponse.json(
        { message: 'Nombre y email son requeridos' },
        { status: 400 }
      );
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ message: 'Email inválido' }, { status: 400 });
    }

    const db = getTursoClient();
    if (!db) {
      return NextResponse.json({ message: 'Base de datos no disponible' }, { status: 500 });
    }

    // Obtener usuario actual desde la tabla de autenticación principal
    const result = await db.execute({
      sql: 'SELECT id, email, password_hash FROM users WHERE id = ? LIMIT 1',
      args: [sessionUser.id],
    });

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }

    const currentUser = result.rows[0];

    // Si se intenta cambiar contraseña, verificar la actual
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { message: 'Contraseña actual requerida' },
          { status: 400 }
        );
      }

      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return NextResponse.json(
          { message: 'La nueva contraseña debe tener al menos 8 caracteres' },
          { status: 400 }
        );
      }

      try {
        const passwordMatch = verifyPassword(currentPassword, String(currentUser.password_hash || ''));
        if (!passwordMatch) {
          return NextResponse.json(
            { message: 'Contraseña actual incorrecta' },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { message: 'Error al verificar contraseña' },
          { status: 500 }
        );
      }
    }

    // Actualizar usuario (en users). La tabla no maneja campo nombre.
    if (newPassword) {
      const hashedPassword = hashPassword(newPassword);
      await db.execute({
        sql: 'UPDATE users SET email = ?, display_name = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        args: [email.trim().toLowerCase(), String(nombre).trim(), hashedPassword, sessionUser.id],
      });
    } else {
      await db.execute({
        sql: 'UPDATE users SET email = ?, display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        args: [email.trim().toLowerCase(), String(nombre).trim(), sessionUser.id],
      });
    }

    return NextResponse.json(
      { message: 'Perfil actualizado exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al actualizar perfil:', error);

    const message = String(error instanceof Error ? error.message : error || '').toLowerCase();
    if (message.includes('unique') || message.includes('duplicate')) {
      return NextResponse.json(
        { message: 'Ese email ya está en uso por otro usuario.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
