'use client';

import React, { ReactNode } from 'react';
import { EspiritualidadEditor } from './espiritualidad-editor';

export function EspiritualidadClient({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <EspiritualidadEditor />
    </>
  );
}
