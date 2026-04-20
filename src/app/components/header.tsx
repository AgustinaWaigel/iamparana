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
  const submenuRef = useRef<HTMLLIElement>(null);
  const userMenuRef = useRef<HTMLLIElement>(null);
  const pathname = usePathname();
  const { user, isLoading } = useSession();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.replace('/');
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        submenuRef.current &&
        !submenuRef.current.contains(event.target as Node)
      ) {
        setSubmenuOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }

    if (submenuOpen || userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [submenuOpen, userMenuOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setSubmenuOpen(false);
  }, [pathname]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleSubmenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setSubmenuOpen((prev) => !prev);
  };

  const handleMouseEnter = () => {
    if (window.innerWidth >= 768) {
      setSubmenuOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 768) {
      setSubmenuOpen(false);
    }
  };

  const navItemClass = (href: string) =>
    `block rounded-full px-3 py-2 font-bold transition ${
      pathname === href
        ? 'bg-white/20 text-brand-gold shadow-sm'
        : 'text-white hover:bg-white/10 hover:text-brand-gold'
    }`;

  return (
    <header className="fixed top-0 z-[10] h-20 w-full border-b border-white/10 bg-brand-brown bg-[url('/assets/header/headerbg.webp')] bg-cover bg-center bg-no-repeat px-4 text-white shadow-lg md:px-8">
      <div className="mx-auto flex h-full w-full items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <Image src="/assets/header/LOGOIAMPNA.svg" alt="Logo" width={140} height={45} priority />
          </Link>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full border border-brand-gold/50 bg-black/30 backdrop-blur-sm transition hover:bg-black/50 md:hidden"
          onClick={toggleMenu}
          aria-label="Abrir menú"
        >
          <span className="block h-0.5 w-6 rounded bg-brand-gold"></span>
          <span className="block h-0.5 w-6 rounded bg-brand-gold"></span>
          <span className="block h-0.5 w-6 rounded bg-brand-gold"></span>
        </button>

        <nav>
          <ul
            className={`absolute left-3 right-3 top-20 z-[99] ${menuOpen ? 'flex' : 'hidden'} flex-col items-center gap-2 rounded-2xl border border-white/10 bg-black/85 p-4 text-lg shadow-xl backdrop-blur-md md:static md:flex md:flex-row md:gap-2 md:border-0 md:bg-transparent md:p-0 md:text-base md:shadow-none md:backdrop-blur-0`}
          >
            <li>
              <Link href="/" className={navItemClass('/')}>
                Inicio
              </Link>
            </li>
            <li 
              ref={submenuRef} 
              className="relative group"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={toggleSubmenu}
                className={`flex items-center rounded-full px-3 py-2 font-bold transition ${
                  submenuOpen ? 'bg-white/20 text-brand-gold shadow-sm' : 'text-white hover:bg-white/10 hover:text-brand-gold'
                }`}
              >
                Recursos <ChevronDown size={14} className={`ml-1 transition ${submenuOpen ? 'rotate-180' : ''}`} />
              </button>
              <ul
                className={`${submenuOpen ? 'flex opacity-100 translate-y-0' : 'hidden opacity-0 -translate-y-1'} flex-col gap-1 rounded-xl border border-white/10 bg-[hsl(23,77%,22%)]/95 p-2 shadow-lg transition-all duration-200 md:absolute md:left-0 md:top-[130%] md:min-w-52`}
              >
                <li><Link href="/formacion" className="block rounded-lg px-3 py-2 text-center font-semibold transition hover:bg-white/10 hover:text-brand-gold">Formación</Link></li>
                <li><Link href="/animacion" className="block rounded-lg px-3 py-2 text-center font-semibold transition hover:bg-white/10 hover:text-brand-gold">Animación</Link></li>
                <li><Link href="/espiritualidad" className="block rounded-lg px-3 py-2 text-center font-semibold transition hover:bg-white/10 hover:text-brand-gold">Espiritualidad</Link></li>
                <li><Link href="/comunicacion" className="block rounded-lg px-3 py-2 text-center font-semibold transition hover:bg-white/10 hover:text-brand-gold">Comunicación</Link></li>
                <li><Link href="/logistica" className="block rounded-lg px-3 py-2 text-center font-semibold transition hover:bg-white/10 hover:text-brand-gold">Logística</Link></li>
              </ul>
            </li>
            <li>
              <Link href="/noticias" className={navItemClass('/noticias')}>Noticias</Link>
            </li>
            
            {/*<li>
              <Link href="/calendario" className="block px-2 py-2 font-bold transition hover:scale-105 hover:text-neutral-200">Calendario</Link>
            </li>*/}
            
            {!isLoading && (
              <>
                {user ? (
                  <li 
                    ref={userMenuRef}
                    className="relative group"
                  >
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 rounded-full border border-brand-gold/70 bg-black/25 px-3 py-2 font-bold transition hover:bg-brand-gold/20"
                    >
                      <span className="text-sm">{user.email}</span>
                      <ChevronDown size={14} className={`transition ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <ul
                      className={`${userMenuOpen ? 'flex opacity-100 translate-y-0' : 'hidden opacity-0 -translate-y-1'} absolute right-0 top-[120%] z-50 flex-col gap-1 rounded-xl border border-white/10 bg-[hsl(23,77%,22%)]/95 p-2 min-w-56 shadow-xl transition-all duration-200 md:left-auto`}
                    >
                      <li className="px-3 py-2 text-xs text-gray-400">
                        Rol: <span className="font-bold text-brand-gold">{user.role}</span>
                      </li>
                      <li>
                        <hr className="my-1 border-gray-600" />
                      </li>
                      {user.role === 'admin' && (
                        <>
                          <li>
                            <Link href="/admin/usuarios" className="flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-white/10">
                              <Users size={16} />
                              Gestión de Usuarios
                            </Link>
                          </li>
                          <li>
                            <Link href="/admin/recursos" className="flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-white/10">
                              <Settings size={16} />
                              Páginas de Recursos
                            </Link>
                          </li>
                          <li>
                            <Link href="/admin/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-white/10">
                              <Settings size={16} />
                              Configuración
                            </Link>
                          </li>
                          <li>
                            <hr className="my-1 border-gray-600" />
                          </li>
                        </>
                      )}
                      <li>
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-red-300 transition hover:bg-red-500/10"
                        >
                          <LogOut size={16} />
                          Cerrar Sesión
                        </button>
                      </li>
                    </ul>
                  </li>
                ) : (
                  <li>
                    <Link href="/admin" className="block rounded-full border border-brand-gold/70 bg-black/25 px-3 py-2 font-bold transition hover:bg-brand-gold/20">Login</Link>
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
