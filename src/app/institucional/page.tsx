import { redirect } from 'next/navigation';

// "Info Institucional" ahora es una sección de "Quiénes somos". La dirección vieja sigue
// funcionando: lleva directo a los documentos.
export default function InstitucionalPage() {
  redirect('/quienes-somos#documentos');
}
