"use client";
import { useSession } from '@/app/hooks/use-session';
import { Settings } from 'lucide-react';


export default function AgendaTitle({ isAdmin}: { isAdmin: boolean }) {
  const handleToggleAdmin = () => {
    window.dispatchEvent(new Event("agendaAdminToggle"));
  }
  const { user, isLoading } = useSession();

  return (
    <div className="mb-4 flex min-h-[64px] items-center justify-between gap-3 rounded-lg bg-brand-brown px-4 py-3 text-white">
      <h2 className="m-0 text-2xl font-bold leading-none text-white">Agenda</h2>
      {isAdmin && (
      <button
        type="button"
        onClick={handleToggleAdmin}
        className="flex h-10 w-10 items-center justify-center self-center rounded-full bg-white/10 transition hover:bg-white/20"
        aria-label="Abrir gestión de agenda"
        title="Gestión de agenda"
      >
       <Settings size={16} className="text-white" />
      </button>
      )}
    </div>
  );
}