'use client';

import React, { ReactNode } from 'react';
import { LogisticaEditor } from './logistica-editor';

export function LogisticaClient({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <LogisticaEditor />
    </>
  );
}
