'use client';

import React, { useState, useEffect, useRef } from 'react';
import '@/globals.css';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const submenuRef = useRef<HTMLLIElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        submenuRef.current &&
        !submenuRef.current.contains(event.target as Node)
      ) {
        setSubmenuOpen(false);
      }
    }

    if (submenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [submenuOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setSubmenuOpen(false);
  }, [pathname]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleSubmenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setSubmenuOpen(!submenuOpen);
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-container">
          <Link href="/">
            <Image src="/assets/header/LOGOIAMPNA.svg" alt="Logo" width={150}height={50}/>
          </Link>
        </div>

        <button className="hamburger-menu" onClick={toggleMenu}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        <nav>
          <ul className={`menu-list ${menuOpen ? 'show-menu' : ''}`}>
            <li className="inicio">
              <Link href="/" className="menu-link-inicio">
                Inicio
              </Link>
            </li>
            <li ref={submenuRef}>
              <a href="#" onClick={toggleSubmenu}>
                Recursos <ChevronDown size={14} style={{ marginLeft: '5px' }} />
              </a>
              <ul style={{ display: submenuOpen ? 'flex' : 'none' }}>
                <li><Link href="/formacion">Formación</Link></li>
                <li><Link href="/animacion">Animación</Link></li>
                <li><Link href="/espiritualidad">Espiritualidad</Link></li>
                <li><Link href="/comunicacion">Comunicación</Link></li>
                <li><Link href="/logistica">Logística</Link></li>
              </ul>
            </li>
            <li>
              <Link href="/noticias">Noticias</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
