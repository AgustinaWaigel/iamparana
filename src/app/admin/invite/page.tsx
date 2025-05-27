'use client';

import { useEffect } from 'react';

export default function Invite() {
  useEffect(() => {
    import('netlify-identity-widget').then(netlifyIdentity => {
      netlifyIdentity.init();
    });
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
      <h1>Aceptar Invitación</h1>
      <p>Por favor, completá la creación de tu cuenta para acceder al CMS.</p>
    </div>
  );
}
