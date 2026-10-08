'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellRing, ChevronDown, ClipboardPen, FileClock, LogOut, UserRound, Users, UsersRound } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from '@/app/hooks/use-session';
import { enablePushNotifications } from '@/app/hooks/use-push-notifications';
import { AREA_ICONS } from '@/app/components/common/area-icons';
import { AREA_ORDER, AREA_THEME } from '@/app/components/common/area-theme';

// Ítem del menú del usuario. Fija color, relleno y escala porque las reglas globales de "nav a" los pisarían.
const USER_ITEM = 'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-brand-ink no-underline transition-colors hover:scale-100 hover:bg-brand-cream hover:text-brand-brown focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-brown';

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsBusy, setNotificationsBusy] = useState(false);

  const submenuRef = useRef<HTMLLIElement>(null);
  const userMenuRef = useRef<HTMLLIElement>(null);

  const pathname = usePathname();
  const { user, isLoading } = useSession();

  useEffect(() => {
    setNotificationsEnabled(typeof Notification !== 'undefined' && Notification.permission === 'granted');
  }, []);

  const handleEnableNotifications = async () => {
    setNotificationsBusy(true);
    try {
      setNotificationsEnabled(await enablePushNotifications());
    } finally {
      setNotificationsBusy(false);
    }
  };

  // Detectar si estamos en mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cierra menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (submenuRef.current && !submenuRef.current.contains(target)) {
        setSubmenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [submenuOpen, userMenuOpen]);

  // Cierra todo cuando navegamos a una nueva página
  useEffect(() => {
    setMenuOpen(false);
    setSubmenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        // Usamos window.location para asegurar un "hard reset" del estado de la app
        window.location.href = '/';
      }
    } catch (err) {
      console.error("Error al salir", err);
    }
  };

  // Hover solo en desktop
  const handleMouseEnter = () => {
    if (!isMobile) setSubmenuOpen(true);
  };

  const handleMouseLeave = () => {
    if (!isMobile) setSubmenuOpen(false);
  };

  const NAV_FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold';
  // "Recursos" queda marcado mientras se navega dentro de cualquiera de las cinco áreas.
  const isInArea = AREA_ORDER.some((key) => pathname === AREA_THEME[key].href || pathname.startsWith(`${AREA_THEME[key].href}/`));

  const navItemClass = (href: string) =>
    `flex w-full items-center justify-center rounded-full px-4 py-3 text-[15px] md:w-auto md:px-3 md:py-2 md:text-[16px] font-bold transition-all ${NAV_FOCUS} ${pathname === href
      ? 'bg-white/20 text-brand-gold shadow-sm'
      : 'text-white hover:bg-white/10 hover:text-brand-gold'
    }`;

  return (
    <header
      className="fixed top-0 z-[60] h-20 w-full text-white shadow-lg"
      style={{ backgroundColor: "#4d220c", backgroundSize: "520px", backgroundBlendMode: "soft-light" }}
    >
      {/* Overlay de gradiente lateral */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-deep/85 via-brand-brown/70 to-brand-deep/85" />
      {/* Línea de acento dorada */}
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-brand-gold via-brand-goldsoft to-brand-gold" />

      <div className="relative mx-auto flex h-full w-full max-w-7xl items-center justify-between pl-3 pr-16 sm:px-6">

        <div className="relative z-[70] flex items-center">
          <Link href="/" aria-label="IAM Paraná, ir al inicio" className={`flex min-w-0 items-center gap-2 rounded-xl sm:gap-3 ${NAV_FOCUS}`}>
            <Image
              src="/assets/header/logoiam2.png"
              alt=""
              width={60} height={60}
              priority
              className="h-[52px] w-[52px] shrink-0 object-contain drop-shadow sm:h-[60px] sm:w-[60px]"
            />
            <span className="flex min-w-0 flex-col leading-none">
              <span className="font-display text-[15px] font-extrabold tracking-tight text-white sm:text-[19px]">
                IAM <span className="text-brand-gold">Paraná</span>
              </span>
              <span className="mt-1 whitespace-nowrap text-[7px] font-medium uppercase tracking-[0.08em] text-white/65 sm:mt-0 sm:text-[10.5px] sm:tracking-[0.22em] sm:text-white/55">
                Infancia y Adolescencia Misionera
              </span>
            </span>
          </Link>
        </div>

        {/* Botón Hamburguesa */}
        <button
          type="button"
          className="absolute right-0 top-1/2 z-[70] flex h-11 w-11 -translate-y-1/2 flex-col items-center justify-center gap-1.5 rounded-full border border-brand-gold/40 bg-black/40 backdrop-blur-md transition-colors hover:bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
        >
          <span className={`block h-0.5 w-6 rounded-full bg-white transition-all duration-300 ${menuOpen ? 'translate-y-2 rotate-45' : ''}`}></span>
          <span className={`block h-0.5 w-6 rounded-full bg-white transition-all duration-300 ${menuOpen ? 'opacity-0 scale-75' : ''}`}></span>
          <span className={`block h-0.5 w-6 rounded-full bg-white transition-all duration-300 ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`}></span>
        </button>

        <nav aria-label="Principal">
          {/* Overlay oscuro para móvil al abrir el menú */}
          {menuOpen && isMobile && (
            <div className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setMenuOpen(false)} />
          )}

          <ul className={`
            absolute left-4 right-4 top-24 z-[66] 
            ${menuOpen ? 'flex animate-in fade-in slide-in-from-top-4 duration-300' : 'hidden'} 
            flex-col items-center gap-3 rounded-3xl border border-white/15 bg-[#3a1508]/95 p-6 text-base shadow-2xl backdrop-blur-xl 
            md:static md:flex md:flex-row md:gap-2 md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-0
          `}>

            <li className="w-full md:w-auto"><Link href="/" className={navItemClass('/')}>Inicio</Link></li>

            {/* --- SUBMENÚ RECURSOS --- */}
            <li
              ref={submenuRef}
              className="relative flex w-full justify-center md:w-auto md:block"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => { if (isMobile) setSubmenuOpen(!submenuOpen); }}
                aria-expanded={submenuOpen}
                aria-haspopup="true"
                className={`flex w-full items-center justify-center rounded-full px-4 py-3 text-[15px] md:w-auto md:px-3 md:py-2 md:text-[16px] font-bold transition-all ${NAV_FOCUS} ${submenuOpen || isInArea ? 'bg-white/20 text-brand-gold shadow-sm' : 'text-white hover:bg-white/10 hover:text-brand-gold'
                  }`}
              >
                Recursos <ChevronDown size={16} className={`ml-1.5 transition-transform duration-300 ${submenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown FLOTANTE (Ya no empuja el contenido hacia abajo) */}
              <ul className={`
                ${submenuOpen ? 'flex' : 'hidden'} 
                absolute top-[110%] z-[100] w-[240px] md:w-auto md:min-w-[220px]
                flex-col gap-1 rounded-2xl border border-white/20 bg-[#4a1c0b]/95 p-3 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-md
                animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200
              `}>
                {AREA_ORDER.map((key) => {
                  const area = AREA_THEME[key];
                  const Icon = AREA_ICONS[key];
                  const isCurrent = pathname === area.href || pathname.startsWith(`${area.href}/`);
                  return (
                    <li key={key}>
                      <Link
                        href={area.href}
                        aria-current={isCurrent ? 'page' : undefined}
                        className={`flex items-center justify-center gap-3 rounded-xl px-4 py-3 text-[15px] font-bold transition-colors hover:bg-white/15 hover:text-brand-gold md:justify-start md:py-2 ${NAV_FOCUS} ${isCurrent ? 'bg-white/10 text-brand-gold' : ''}`}
                        onClick={() => isMobile && setMenuOpen(false)}
                      >
                        <Icon size={17} strokeWidth={2.25} aria-hidden />
                        {area.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>

            <li className="w-full md:w-auto"><Link href="/noticias" className={navItemClass('/noticias')}>Noticias</Link></li>

            {/* --- MENÚ DE USUARIO --- */}
            {isLoading && (
              // Lugar reservado mientras se sabe si hay sesión: evita que el botón aparezca de golpe y corra el menú.
              <li aria-hidden className="mt-2 flex w-full justify-center md:mt-0 md:w-auto">
                <span className="block h-10 w-32 rounded-full bg-white/10 motion-safe:animate-pulse" />
              </li>
            )}
            {!isLoading && (
              <>
                {user ? (
                  <li ref={userMenuRef} className="relative mt-2 flex w-full justify-center border-t border-white/10 pt-3 md:mt-0 md:block md:w-auto md:border-none md:pt-0">
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      onKeyDown={(e) => { if (e.key === 'Escape') setUserMenuOpen(false); }}
                      aria-expanded={userMenuOpen}
                      aria-haspopup="true"
                      aria-controls="menu-usuario"
                      aria-label={`Menú de ${user.nombre || 'tu cuenta'}`}
                      className={`group flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors ${NAV_FOCUS} ${userMenuOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}
                    >
                      <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gold font-display text-sm font-extrabold text-brand-deep">
                        {(user.nombre || user.email || '?').trim().charAt(0).toUpperCase()}
                      </span>
                      <span className="max-w-[9rem] truncate text-[15px] font-bold text-white">{(user.nombre || 'Mi cuenta').split(' ')[0]}</span>
                      <ChevronDown size={16} aria-hidden className={`text-brand-gold transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Panel del usuario. Es un div (no ul) para que no le apliquen las reglas globales de "nav ul ul". */}
                    {userMenuOpen && (
                      <div
                        id="menu-usuario"
                        onKeyDown={(e) => { if (e.key === 'Escape') setUserMenuOpen(false); }}
                        className="absolute left-1/2 top-[calc(100%+0.6rem)] z-[100] w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl bg-white text-left shadow-[0_18px_40px_-12px_rgba(40,14,4,0.45)] ring-1 ring-brand-brown/10 duration-200 ease-out animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 motion-reduce:animate-none md:left-auto md:right-0 md:translate-x-0"
                      >
                        <div className="flex items-center gap-3 border-b border-brand-brown/10 bg-brand-paper px-4 py-3.5">
                          <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-brown font-display text-base font-extrabold text-white">
                            {(user.nombre || user.email || '?').trim().charAt(0).toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[15px] font-bold text-brand-ink">{user.nombre || 'Mi cuenta'}</span>
                            <span className="block truncate text-xs text-brand-ink/60">{user.email}</span>
                          </span>
                        </div>

                        <div className="p-1.5">
                          <Link href="/auth/perfil" className={USER_ITEM} onClick={() => setUserMenuOpen(false)}><UserRound size={17} aria-hidden /> Mi perfil</Link>
                          <Link href="/inscripciones/cuenta" className={USER_ITEM} onClick={() => setUserMenuOpen(false)}><UsersRound size={17} aria-hidden /> Mi cuenta familiar</Link>
                          <button type="button" onClick={handleEnableNotifications} disabled={notificationsBusy || notificationsEnabled} className={`${USER_ITEM} disabled:cursor-default`}>
                            {notificationsEnabled ? <BellRing size={17} aria-hidden /> : <Bell size={17} aria-hidden />}
                            {notificationsBusy ? 'Activando…' : notificationsEnabled ? 'Notificaciones activadas' : 'Activar notificaciones'}
                          </button>
                        </div>

                        {user.role === 'admin' && (
                          <div className="border-t border-brand-brown/10 p-1.5">
                            <p className="m-0 max-w-none px-3 pb-1 pt-2 text-left text-xs font-bold text-brand-ink/50">Administración</p>
                            <Link href="/admin/inscripciones" className={USER_ITEM} onClick={() => setUserMenuOpen(false)}><ClipboardPen size={17} aria-hidden /> Inscripciones</Link>
                            <Link href="/admin/notificaciones" className={USER_ITEM} onClick={() => setUserMenuOpen(false)}><BellRing size={17} aria-hidden /> Avisos al celular</Link>
                            <Link href="/admin/usuarios" className={USER_ITEM} onClick={() => setUserMenuOpen(false)}><Users size={17} aria-hidden /> Usuarios</Link>
                            <Link href="/admin/auditoria" className={USER_ITEM} onClick={() => setUserMenuOpen(false)}><FileClock size={17} aria-hidden /> Auditoría</Link>
                          </div>
                        )}

                        <div className="border-t border-brand-brown/10 p-1.5">
                          <button type="button" onClick={handleLogout} className={`${USER_ITEM} text-red-700 hover:bg-red-50 hover:text-red-800`}>
                            <LogOut size={17} aria-hidden /> Cerrar sesión
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ) : (
                  <li className="mt-2 w-full md:mt-0 md:w-auto">
                    <Link
                      href="/auth/registro"
                      className="block w-full rounded-full bg-brand-gold px-5 py-2 text-center text-[13.5px] font-bold text-brand-deep shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-goldsoft md:w-auto"
                    >
                      Sumate
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
