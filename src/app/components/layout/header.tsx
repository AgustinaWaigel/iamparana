'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, LogOut, Users, Settings } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from '@/app/hooks/use-session';

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const submenuRef = useRef<HTMLLIElement>(null);
  const userMenuRef = useRef<HTMLLIElement>(null);

  const pathname = usePathname();
  const { user, isLoading } = useSession();

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

  const navItemClass = (href: string) =>
    `flex w-full items-center justify-center rounded-full px-4 py-3 text-[15px] md:w-auto md:px-3 md:py-2 md:text-[16px] font-bold transition-all ${pathname === href
      ? 'bg-white/20 text-brand-gold shadow-sm'
      : 'text-white hover:bg-white/10 hover:text-brand-gold'
    }`;

  return (
    <header className="fixed top-0 z-[60] h-20 w-full border-b border-white/10 bg-brand-brown bg-[url('/assets/header/headerbg.webp')] bg-cover bg-center bg-no-repeat px-4 text-white shadow-lg md:px-8">
      <div className="relative mx-auto flex h-full w-full max-w-7xl items-center justify-between">

        <div className="relative z-[70] flex items-center">
          <Link href="/">
            <Image src="/assets/header/LOGOIAMPNA.svg" alt="Logo" width={140} height={45} priority className="drop-shadow-sm" />
          </Link>
        </div>

        {/* Botón Hamburguesa */}
        <button
          type="button"
          className="absolute right-0 top-1/2 z-[70] flex h-11 w-11 -translate-y-1/2 flex-col items-center justify-center gap-1.5 rounded-full border border-brand-gold/40 bg-black/40 backdrop-blur-md transition-colors hover:bg-black/60 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menú"
        >
          <span className={`block h-0.5 w-6 rounded-full bg-brand-gold transition-all duration-300 ${menuOpen ? 'translate-y-2 rotate-45' : ''}`}></span>
          <span className={`block h-0.5 w-6 rounded-full bg-brand-gold transition-all duration-300 ${menuOpen ? 'opacity-0 scale-75' : ''}`}></span>
          <span className={`block h-0.5 w-6 rounded-full bg-brand-gold transition-all duration-300 ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`}></span>
        </button>

        <nav>
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
                className={`flex w-full items-center justify-center rounded-full px-4 py-3 text-[15px] md:w-auto md:px-3 md:py-2 md:text-[16px] font-bold transition-all ${submenuOpen ? 'bg-white/20 text-brand-gold shadow-sm' : 'text-white hover:bg-white/10 hover:text-brand-gold'
                  }`}
              >
                Recursos <ChevronDown size={16} className={`ml-1.5 transition-transform duration-300 ${submenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown FLOTANTE (Ya no empuja el contenido hacia abajo) */}
              <ul className={`
                ${submenuOpen ? 'flex' : 'hidden'} 
                absolute top-[110%] z-[100] w-[240px] md:w-auto md:min-w-[200px]
                flex-col gap-1 rounded-2xl border border-white/20 bg-[#4a1c0b]/95 p-3 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-md
                animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200
              `}>
                {['Formación', 'Animación', 'Espiritualidad', 'Comunicación', 'Logística'].map((item) => (
                  <li key={item}>
                    <Link
                      href={`/${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                      className="block rounded-xl px-4 py-3 text-center text-[15px] font-bold transition-colors hover:bg-white/15 hover:text-brand-gold md:py-2 md:text-left"
                      onClick={() => isMobile && setMenuOpen(false)}
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            <li className="w-full md:w-auto"><Link href="/noticias" className={navItemClass('/noticias')}>Noticias</Link></li>

            {/* --- MENÚ DE USUARIO --- */}
            {!isLoading && (
              <>
                {user ? (
                  <li ref={userMenuRef} className="relative flex w-full justify-center md:w-auto md:block mt-2 md:mt-0 pt-2 md:pt-0 border-t border-white/10 md:border-none">
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-brand-gold/40 bg-black/20 px-4 py-3 text-[15px] font-bold transition-all hover:border-brand-gold/80 hover:bg-brand-gold/10 md:w-auto md:px-4 md:py-2 md:text-[16px]"
                    >
                      <span className="max-w-[150px] truncate text-[13px] text-brand-gold/90 md:text-sm">Perfil</span>
                      <ChevronDown size={16} className={`transition-transform duration-300 text-brand-gold ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Usuario FLOTANTE */}
                    <ul className={`
                      ${userMenuOpen ? 'flex' : 'hidden'} 
                      absolute top-[110%] left-1/2 z-[100] w-[calc(100vw-2rem)] max-w-[260px] -translate-x-1/2 md:left-auto md:right-0 md:w-64 md:translate-x-0
                      flex-col gap-1 rounded-2xl border border-white/20 bg-[#4a1c0b]/95 p-3 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-md
                      max-h-[70vh] overflow-y-auto
                      animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200
                    `}>
                      <li className="mb-2 rounded-xl bg-black/30 px-4 py-3 text-center md:text-left">
                        <span className="block text-xs text-stone-400">Sesión iniciada como</span>
                        <span className="block text-base font-black text-white">{user.nombre || 'Usuario'}</span>
                        <span className="block text-sm font-black tracking-wider text-brand-gold uppercase">{user.role}</span>
                      </li>

                      <li><Link href="/auth/perfil" className="flex items-center justify-center md:justify-start gap-3 rounded-xl px-4 py-3 text-[15px] md:py-2.5 font-semibold transition-colors hover:bg-white/15 hover:text-brand-gold" onClick={() => isMobile && setUserMenuOpen(false)}><Settings size={16} /> Mi Perfil</Link></li>

                      {user.role === 'admin' && (
                        <>
                          <li><Link href="/admin/usuarios" className="flex items-center justify-center md:justify-start gap-3 rounded-xl px-4 py-3 text-[15px] md:py-2.5 font-semibold transition-colors hover:bg-white/15 hover:text-brand-gold" onClick={() => isMobile && setUserMenuOpen(false)}><Users size={16} /> Gestión Usuarios</Link></li>
                          <li><Link href="/admin/settings" className="flex items-center justify-center md:justify-start gap-3 rounded-xl px-4 py-3 text-[15px] md:py-2.5 font-semibold transition-colors hover:bg-white/15 hover:text-brand-gold" onClick={() => isMobile && setUserMenuOpen(false)}><Settings size={16} /> Configuración</Link></li>
                          <div className="mx-3 my-1 h-px bg-white/15" />
                        </>
                      )}

                      <li>
                        <button onClick={handleLogout} className="flex w-full items-center justify-center md:justify-start gap-3 rounded-xl px-4 py-3 text-[15px] md:py-2.5 font-bold text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200">
                          <LogOut size={16} /> Cerrar Sesión
                        </button>
                      </li>
                    </ul>
                  </li>
                ) : (
                  /*<li className="mt-4 w-full md:mt-0 md:w-auto">
                    <Link href="/auth/login" className="block w-full rounded-full bg-brand-gold px-6 py-3 text-center font-black text-brand-brown shadow-lg transition-all hover:bg-yellow-400 md:py-2">
                      Ingresar
                    </Link>
                  </li>*/
                  null // Retornamos null para que no rompa la estructura del fragmento si el usuario no existe
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