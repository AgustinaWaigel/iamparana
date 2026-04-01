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
  const { user, isLoading, isAdmin } = useSession();

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

  return (
    <header className="fixed top-0 z-[100] w-full h-20 bg-brand-brown bg-[url('/assets/header/headerbg.webp')] bg-cover bg-center bg-no-repeat px-4 py-2 text-white shadow-lg md:px-8">
      <div className="mx-auto flex w-full items-center justify-stretch md:justify-between">
        <div className="flex items-center">
          <Link href="/">
            <Image src="/assets/header/LOGOIAMPNA.svg" alt="Logo" width={140} height={45} priority />
          </Link>
        </div>

        <button
          type="button"
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded md:hidden"
          onClick={toggleMenu}
          aria-label="Abrir menú"
        >
          <span className="block h-0.5 w-6 rounded bg-brand-gold"></span>
          <span className="block h-0.5 w-6 rounded bg-brand-gold"></span>
          <span className="block h-0.5 w-6 rounded bg-brand-gold"></span>
        </button>

        <nav>
          <ul
            className={`absolute left-0 right-0 top-[76px] z-[99] ${menuOpen ? 'flex' : 'hidden'} flex-col items-center gap-2 bg-black/90 p-4 text-lg md:static md:flex md:flex-row md:gap-4 md:bg-transparent md:p-0 md:text-base`}
          >
            <li>
              <Link href="/" className="block px-2 py-2 font-bold text-yellow-300 transition hover:scale-105 hover:text-neutral-200">
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
                className="flex items-center px-2 py-2 font-bold transition hover:text-neutral-200"
              >
                Recursos <ChevronDown size={14} className="ml-1" />
              </button>
              <ul
                className={`${submenuOpen ? 'flex' : 'hidden'} flex-col gap-1 rounded bg-[hsl(23,77%,22%)] p-2 md:absolute md:left-0 md:top-[130%] md:min-w-44`}
              >
                <li><Link href="/formacion" className="block px-3 py-3 text-center font-normal hover:text-neutral-200">Formación</Link></li>
                <li><Link href="/animacion" className="block px-3 py-3 text-center font-normal hover:text-neutral-200">Animación</Link></li>
                <li><Link href="/espiritualidad" className="block px-3 py-3 text-center font-normal hover:text-neutral-200">Espiritualidad</Link></li>
                <li><Link href="/comunicacion" className="block px-3 py-3 text-center font-normal hover:text-neutral-200">Comunicación</Link></li>
                <li><Link href="/logistica" className="block px-3 py-3 text-center font-normal hover:text-neutral-200">Logística</Link></li>
              </ul>
            </li>
            <li>
              <Link href="/noticias" className="block px-2 py-2 font-bold transition hover:scale-105 hover:text-neutral-200">Noticias</Link>
            </li>
            
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
                      className="flex items-center gap-2 rounded border border-brand-gold px-3 py-2 font-bold transition hover:bg-brand-gold/20"
                    >
                      <span className="text-sm">{user.email}</span>
                      <ChevronDown size={14} className={`transition ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <ul
                      className={`${userMenuOpen ? 'flex' : 'hidden'} absolute right-0 top-[120%] z-50 flex-col gap-1 rounded bg-[hsl(23,77%,22%)] p-2 min-w-56 md:left-auto`}
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
                            <Link href="/admin/usuarios" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-700 transition">
                              <Users size={16} />
                              Gestión de Usuarios
                            </Link>
                          </li>
                          <li>
                            <Link href="/admin/settings" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-700 transition">
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
                          className="flex items-center gap-2 w-full px-3 py-2 text-red-400 rounded hover:bg-gray-700 transition text-left"
                        >
                          <LogOut size={16} />
                          Cerrar Sesión
                        </button>
                      </li>
                    </ul>
                  </li>
                ) : (
                  <li>
                    <Link href="/admin" className="block rounded border border-brand-gold px-3 py-2 font-bold transition hover:bg-brand-gold/20">Login</Link>
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
