'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { refreshSession, useSession } from '@/app/hooks/use-session';
import { CARD_CLASS, ERROR_CLASS, HELP_CLASS, INPUT_CLASS, LABEL_CLASS, NOTICE_CLASS, PRIMARY_BUTTON, SECONDARY_BUTTON, TEXT_BUTTON } from '@/app/inscripciones/ui';
import { PerfilAnimador } from './perfil-animador';

// Perfil del usuario del sitio: sus datos, si es animador/a de una IAM y su contraseña.
// Cada bloque se guarda por separado.

type Seccion = 'datos' | 'clave';
type MessageState = { seccion: Seccion; type: 'success' | 'error'; text: string } | null;

const ROL_LABEL: Record<string, string> = {
  admin: 'Administrador/a',
  miembro: 'Miembro',
  equipo: 'Equipo',
  redactor: 'Redactor/a',
  coordinador: 'Coordinador/a',
  animador: 'Animador/a',
};

const H2 = 'm-0 text-left font-display text-xl font-bold text-brand-ink';

export default function PerfilPage() {
  const router = useRouter();
  const { user, isLoading } = useSession();

  const [formData, setFormData] = useState({ nombre: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [message, setMessage] = useState<MessageState>(null);
  const [saving, setSaving] = useState<Seccion | null>(null);
  // Los campos de contraseña aparecen solo si la persona quiere cambiarla.
  const [cambiandoClave, setCambiandoClave] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/auth/login');
    } else if (user) {
      setFormData((prev) => ({ ...prev, nombre: user.nombre || '', email: user.email || '' }));
    }
  }, [user, isLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (message) setMessage(null);
  };

  const guardar = async (seccion: Seccion) => {
    if (seccion === 'clave') {
      if (formData.newPassword.length < 6) return setMessage({ seccion, type: 'error', text: 'La contraseña nueva tiene que tener al menos 6 caracteres.' });
      if (formData.newPassword !== formData.confirmPassword) return setMessage({ seccion, type: 'error', text: 'Las dos contraseñas nuevas no coinciden.' });
      if (!formData.currentPassword) return setMessage({ seccion, type: 'error', text: 'Escribí tu contraseña actual para autorizar el cambio.' });
    }

    setSaving(seccion);
    setMessage(null);
    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          ...(seccion === 'clave' && { currentPassword: formData.currentPassword, newPassword: formData.newPassword }),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'No se pudo guardar.');

      await refreshSession();
      setMessage({ seccion, type: 'success', text: seccion === 'clave' ? 'Listo, cambiaste tu contraseña.' : 'Listo, guardamos tus datos.' });
      if (seccion === 'clave') {
        setFormData((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
        setCambiandoClave(false);
      }
    } catch (err: unknown) {
      setMessage({ seccion, type: 'error', text: err instanceof Error ? err.message : 'No se pudo guardar.' });
    } finally {
      setSaving(null);
    }
  };

  const aviso = (seccion: Seccion) =>
    message?.seccion === seccion ? (
      <p role={message.type === 'error' ? 'alert' : 'status'} className={message.type === 'error' ? ERROR_CLASS : NOTICE_CLASS}>{message.text}</p>
    ) : null;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-paper">
        <p className="flex items-center gap-2 text-base font-semibold text-brand-ink/70"><Loader2 size={20} className="animate-spin motion-reduce:animate-none" aria-hidden /> Cargando tu perfil…</p>
      </div>
    );
  }
  if (!user) return null;

  const inicial = (user.nombre || user.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-brand-paper">
      <div className="mx-auto max-w-2xl px-4 pb-20 pt-16 sm:px-6 sm:pt-20">
        {/* ── Quién sos ── (el botón "Volver" ya lo pone el sitio arriba) */}
        <div className="flex items-center gap-4">
          <span aria-hidden className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-brown font-display text-2xl font-extrabold text-white">{inicial}</span>
          <div className="min-w-0">
            <h1 className="m-0 truncate text-left font-display text-[clamp(1.75rem,6vw,2.5rem)] font-extrabold leading-tight tracking-[-0.03em] text-brand-ink">{user.nombre || 'Mi perfil'}</h1>
            <p className="m-0 mt-1 flex max-w-none flex-wrap items-center gap-2 text-left text-sm text-brand-ink/70">
              <span className="break-all">{user.email}</span>
              <span className="rounded-full bg-brand-cream px-2.5 py-0.5 text-xs font-bold text-brand-brown">{ROL_LABEL[user.role] ?? user.role}</span>
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          {/* ── Tus datos ── */}
          <section aria-labelledby="perfil-datos" className={`${CARD_CLASS} p-6 sm:p-7`}>
            <h2 id="perfil-datos" className={H2}>Tus datos</h2>
            <form onSubmit={(e) => { e.preventDefault(); void guardar('datos'); }} className="mt-5 space-y-4">
              <div>
                <label htmlFor="perfil-nombre" className={LABEL_CLASS}>Nombre y apellido</label>
                <input id="perfil-nombre" name="nombre" className={INPUT_CLASS} value={formData.nombre} onChange={handleInputChange} autoComplete="name" maxLength={80} required />
              </div>
              <div>
                <label htmlFor="perfil-email" className={LABEL_CLASS}>Email</label>
                <input id="perfil-email" name="email" type="email" className={INPUT_CLASS} value={formData.email} onChange={handleInputChange} autoComplete="email" required />
                <p className={HELP_CLASS}>Es el que usás para entrar. Si entrás con Google, tiene que ser el de tu cuenta de Google.</p>
              </div>
              {aviso('datos')}
              <button type="submit" disabled={saving !== null} className={PRIMARY_BUTTON}>
                {saving === 'datos' && <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden />}
                {saving === 'datos' ? 'Guardando…' : 'Guardar mis datos'}
              </button>
            </form>
          </section>

          {/* ── Animador/a ── */}
          <PerfilAnimador />

          {/* ── Áreas (las asigna el equipo) ── */}
          {(user.areas || []).length > 0 && (
            <section aria-labelledby="perfil-areas" className={`${CARD_CLASS} p-6 sm:p-7`}>
              <h2 id="perfil-areas" className={H2}>Tus áreas</h2>
              <ul className="m-0 mt-4 flex list-none flex-wrap gap-2 p-0">
                {user.areas!.map((area) => <li key={area} className="rounded-full bg-brand-cream px-3 py-1 text-sm font-bold capitalize text-brand-brown">{area}</li>)}
              </ul>
            </section>
          )}

          {/* ── Contraseña ── */}
          <section aria-labelledby="perfil-clave" className={`${CARD_CLASS} p-6 sm:p-7`}>
            <h2 id="perfil-clave" className={H2}>Contraseña</h2>
            <p className={`${HELP_CLASS} mt-1`}>Si entrás con Google no necesitás una.</p>
            {!cambiandoClave && aviso('clave') && <div className="mt-4">{aviso('clave')}</div>}

            {!cambiandoClave ? (
              <button type="button" onClick={() => { setCambiandoClave(true); setMessage(null); }} className={`${SECONDARY_BUTTON} mt-5`}>
                <KeyRound size={16} aria-hidden /> Cambiar contraseña
              </button>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); void guardar('clave'); }} className="mt-5 space-y-4 duration-300 ease-out animate-in fade-in-0 slide-in-from-top-2 motion-reduce:animate-none">
                <CampoClave id="perfil-clave-actual" name="currentPassword" label="Contraseña actual" autoComplete="current-password" value={formData.currentPassword} onChange={handleInputChange} visible={showPasswords.current} onToggle={() => setShowPasswords((p) => ({ ...p, current: !p.current }))} autoFocus />
                <p className={`${HELP_CLASS} -mt-2`}>¿No la sabés? Pedí una nueva con «¿Olvidaste tu contraseña?» en la pantalla de inicio de sesión.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <CampoClave id="perfil-clave-nueva" name="newPassword" label="Contraseña nueva" autoComplete="new-password" value={formData.newPassword} onChange={handleInputChange} visible={showPasswords.new} onToggle={() => setShowPasswords((p) => ({ ...p, new: !p.new }))} />
                  <CampoClave id="perfil-clave-repetir" name="confirmPassword" label="Repetí la nueva" autoComplete="new-password" value={formData.confirmPassword} onChange={handleInputChange} visible={showPasswords.confirm} onToggle={() => setShowPasswords((p) => ({ ...p, confirm: !p.confirm }))} />
                </div>
                {aviso('clave')}
                <div className="flex flex-wrap items-center gap-4">
                  <button type="submit" disabled={saving !== null || !formData.newPassword} className={PRIMARY_BUTTON}>
                    {saving === 'clave' && <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden />}
                    {saving === 'clave' ? 'Cambiando…' : 'Guardar contraseña nueva'}
                  </button>
                  <button type="button" disabled={saving !== null} onClick={() => { setCambiandoClave(false); setMessage(null); setFormData((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' })); }} className={TEXT_BUTTON}>
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

interface CampoClaveProps {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  visible: boolean;
  onToggle: () => void;
  autoFocus?: boolean;
}

function CampoClave({ id, name, label, autoComplete, value, onChange, visible, onToggle, autoFocus }: CampoClaveProps) {
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>{label}</label>
      <div className="relative">
        <input id={id} name={name} type={visible ? 'text' : 'password'} className={`${INPUT_CLASS} pr-12`} value={value} onChange={onChange} autoComplete={autoComplete} autoFocus={autoFocus} />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-brand-ink/50 transition-colors hover:bg-brand-cream hover:text-brand-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-brown"
        >
          {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      </div>
    </div>
  );
}
