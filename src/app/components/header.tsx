'use client';

import React, { useState, useEffect, useRef } from 'react';
import '@/globals.css';
import { ChevronDown } from 'lucide-react';

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const submenuRef = useRef<HTMLLIElement>(null);

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

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleSubmenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setSubmenuOpen(!submenuOpen);
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-container">
          <a href="/">
            <img src="/assets/header/LOGOIAMPNA.svg" alt="Logo" />
          </a>
        </div>

        <button className="hamburger-menu" onClick={toggleMenu}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        <nav>
          <ul className={`menu-list ${menuOpen ? 'show-menu' : ''}`}>
            <li className="inicio">
              <a href="/" className="menu-link-inicio">
                Inicio
              </a>
            </li>
            <li ref={submenuRef}>
              <a href="#" onClick={toggleSubmenu}>
                Recursos <ChevronDown size={14} style={{ marginLeft: '5px' }} />
              </a>
              <ul style={{ display: submenuOpen ? 'flex' : 'none' }}>
                <li><a href="/formacion">Formación</a></li>
                <li><a href="/animacion">Animación</a></li>
                <li><a href="/espiritualidad">Espiritualidad</a></li>
                <li><a href="/comunicacion">Comunicación</a></li>
                <li><a href="/logistica">Logística</a></li>
              </ul>
            </li>
            <li>
              <a href="/noticias">Noticias</a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
