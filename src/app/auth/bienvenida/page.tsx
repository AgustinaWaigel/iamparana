import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function BienvenidaPage() {
  return (
    <main className="min-h-screen bg-[#fcfaf8] px-4 py-16">
      <div className="mx-auto flex max-w-3xl flex-col items-center rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:p-12">
        <div className="mb-5 rounded-full bg-amber-100 p-3 text-amber-700">
          <Sparkles size={24} />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-stone-800 sm:text-4xl">¡Tu cuenta ya está lista!</h1>
        <p className="mt-4 max-w-2xl text-lg text-stone-600">
          Ya podés entrar al sitio, explorar noticias, consultar la agenda y seguir las novedades de IAM Paraná desde una cuenta simple y segura.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-brand-brown px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-900">
            Ir al inicio <ArrowRight size={16} />
          </Link>
          <Link href="/auth/login" className="inline-flex items-center rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-50">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
