"use client";
import { useSession } from '@/app/hooks/use-session';


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
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.26 2.632 1.732-.25.651-.025 1.39.56 1.972a1.724 1.724 0 001.063 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.26 3.31-1.732 2.632-.651-.25-1.39.025-1.972.56a1.724 1.724 0 00-2.573 1.063c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.26-2.632-1.732.25-.651.025-1.39-.56-1.972a1.724 1.724 0 00-1.063-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.26-3.31 1.732-2.632.651.25 1.39.025 1.972-.56a1.724 1.724 0 002.573-1.063z"
          />
        </svg>
      </button>
      )}
    </div>
  );
}