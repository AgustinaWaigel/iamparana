'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, EyeOff, ShieldCheck, User, Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import { refreshSession, useSession } from '@/app/hooks/use-session';

type MessageState = { type: 'success' | 'error'; text: string } | null;

type ProfileInputProps = {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
  isPassword?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
};

export default function PerfilPage() {
  const router = useRouter();
  const { user, isLoading } = useSession();
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [message, setMessage] = useState<MessageState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sincronizar datos del usuario al cargar
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/admin');
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        nombre: user.nombre || '',
        email: user.email || '',
      }));
    }
  }, [user, isLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (message) setMessage(null); // Limpiar mensajes al escribir
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validaciones de negocio
    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        setMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        setIsSubmitting(false);
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'Las contraseñas nuevas no coinciden.' });
        setIsSubmitting(false);
        return;
      }
      if (!formData.currentPassword) {
        setMessage({ type: 'error', text: 'Ingresa tu contraseña actual para autorizar el cambio.' });
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const payload = {
        nombre: formData.nombre,
        email: formData.email,
        ...(formData.newPassword && {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      };

      const response = await fetch('/api/auth/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.message || 'Error al actualizar');

      await refreshSession();
      setMessage({ type: 'success', text: 'Perfil actualizado con éxito.' });
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado al actualizar perfil.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingScreen />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50 px-4 pb-12 pt-20 text-brand-brown md:pb-20">
      <div className="mx-auto max-w-2xl">
        {/* Top Bar */}
        <div className="mb-10 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2 text-brand-brown/80 transition-colors hover:text-brand-brown">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Volver</span>
          </Link>
          <h1 className="text-2xl font-black text-brand-brown md:text-3xl">Configuración de Perfil</h1>
        </div>

        <div className="overflow-hidden rounded-3xl border border-brand-brown/15 bg-white shadow-xl">
          {/* Badge de Rol */}
          <div className="flex items-center gap-4 border-b border-brand-brown/10 bg-amber-50/70 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-brown/10 text-brand-brown">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-brown/60">Nivel de Acceso</p>
              <p className="font-black uppercase tracking-tighter text-brand-brown">{user.role}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
            {message && (
              <div className={`animate-in fade-in slide-in-from-top-2 rounded-xl border p-4 text-sm font-bold ${
                message.type === 'success' ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            {/* Datos Personales */}
            <div className="grid gap-6">
              <ProfileInput 
                label="Nombre Completo" 
                name="nombre" 
                icon={<User size={18}/>}
                value={formData.nombre} 
                onChange={handleInputChange} 
              />
              <ProfileInput 
                label="Correo Electrónico" 
                name="email" 
                type="email" 
                icon={<Mail size={18}/>}
                value={formData.email} 
                onChange={handleInputChange} 
              />
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-brand-brown/20 to-transparent"></div>

            {/* Password Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-brand-brown">
                <Lock size={18} />
                <h2 className="font-bold">Seguridad</h2>
              </div>

              <div className="grid gap-4">
                <ProfileInput 
                  label="Contraseña Actual" 
                  name="currentPassword" 
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPassword} 
                  onChange={handleInputChange}
                  isPassword
                  showPassword={showPasswords.current}
                  onTogglePassword={() => setShowPasswords(p => ({...p, current: !p.current}))}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ProfileInput 
                    label="Nueva Contraseña" 
                    name="newPassword" 
                    type={showPasswords.new ? 'text' : 'password'}
                    value={formData.newPassword} 
                    onChange={handleInputChange}
                    isPassword
                    showPassword={showPasswords.new}
                    onTogglePassword={() => setShowPasswords(p => ({...p, new: !p.new}))}
                  />
                  <ProfileInput 
                    label="Confirmar Nueva" 
                    name="confirmPassword" 
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={formData.confirmPassword} 
                    onChange={handleInputChange}
                    isPassword
                    showPassword={showPasswords.confirm}
                    onTogglePassword={() => setShowPasswords(p => ({...p, confirm: !p.confirm}))}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-brown px-8 py-4 font-black text-white transition-all hover:scale-[1.02] hover:bg-[#5b311b] active:scale-95 disabled:opacity-50"
            >
              <Save size={20} />
              {isSubmitting ? 'Procesando...' : 'Actualizar Perfil'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- Subcomponentes Auxiliares ---

function ProfileInput({ label, name, type = 'text', value, onChange, icon, isPassword, showPassword, onTogglePassword }: ProfileInputProps) {
  return (
    <div className="space-y-2">
      <label className="ml-1 text-xs font-bold uppercase tracking-wider text-brand-brown/70">{label}</label>
      <div className="relative group">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-brown/50 transition-colors group-focus-within:text-brand-brown">{icon}</div>}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full rounded-xl border border-brand-brown/20 bg-white py-3 text-brand-brown transition-all placeholder:text-brand-brown/35 focus:border-brand-brown/50 focus:outline-none focus:ring-4 focus:ring-brand-brown/10 ${icon ? 'pl-11' : 'px-4'} ${isPassword ? 'pr-12' : 'pr-4'}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-brand-brown/60 transition-all hover:bg-brand-brown/10 hover:text-brand-brown"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-brown/20 border-t-brand-brown"></div>
        <p className="font-medium text-brand-brown/70">Sincronizando perfil...</p>
      </div>
    </div>
  );
}