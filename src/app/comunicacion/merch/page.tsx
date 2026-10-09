import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AreaHero } from '@/app/components/common/area-hero';
import { listCatalogo } from '@/server/lib/ventas-catalogo';
import { Catalogo } from '../components/catalogo';

// Merch de la IAM: lo que Comunicación vende en los eventos, con los precios al día.

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Merch de la IAM',
  description: 'Llaveros, stickers, mates y más: lo que vendemos en los eventos de IAM Paraná, con los precios al día.',
  alternates: { canonical: '/comunicacion/merch' },
};

export default async function MerchPage() {
  const productos = await listCatalogo();

  return (
    <div className="min-h-screen bg-brand-paper">
      <AreaHero area="comunicacion" title="Merch de la IAM" crumbs={[]} />
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12">
        {productos && productos.length > 0 ? (
          <Catalogo productos={productos} />
        ) : (
          <p className="m-0 max-w-none rounded-2xl border border-dashed border-brand-brown/20 px-5 py-12 text-center text-base text-brand-ink/70">
            {productos ? 'Por ahora no hay productos a la venta.' : 'No pudimos cargar los productos en este momento. Probá de nuevo en unos minutos.'}
          </p>
        )}

        <Link href="/comunicacion" className="mt-10 inline-flex items-center gap-2 rounded-full border border-brand-brown/20 px-5 py-2.5 text-sm font-bold text-brand-brown no-underline transition-colors hover:bg-brand-brown hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown">
          <ArrowLeft size={16} aria-hidden /> Volver a Comunicación
        </Link>
      </div>
    </div>
  );
}
