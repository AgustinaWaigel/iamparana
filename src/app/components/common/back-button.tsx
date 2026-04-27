'use client';

import { ArrowLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (!pathname || pathname === '/') {
    return null;
  }

  const handleBack = () => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length <= 1) {
      router.push('/');
      return;
    }

    const parentPath = `/${segments.slice(0, -1).join('/')}`;
    router.push(parentPath);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Volver"
      title="Volver"
      className="fixed left-3 top-24 z-[1100] inline-flex items-center gap-1.5 rounded-full border border-amber-300/70 bg-white/85 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-amber-950 hover:shadow md:left-4"
      data-path={pathname}
    >
      <ArrowLeft size={14} />
      Volver
    </button>
  );
}
