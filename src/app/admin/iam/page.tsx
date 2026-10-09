import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/server/lib/admin-page";
import { IamManager } from "./iam-manager";

// Las IAM y el mapa: alta y edición de cada IAM, con lo que se muestra en "Quiénes somos".

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Las IAM y el mapa", robots: { index: false, follow: false } };

export default async function AdminIamPage() {
  await requireAdminPage();

  return (
    <div className="min-h-screen bg-brand-paper">
      <div className="mx-auto max-w-4xl px-4 pb-20 pt-20 sm:px-6 sm:pt-24">
        <h1 className="m-0 text-left font-display text-[clamp(2rem,5vw,2.75rem)] font-extrabold leading-tight tracking-tight text-brand-ink">Las IAM y el mapa</h1>
        <p className="m-0 mt-3 max-w-2xl text-left text-base leading-relaxed text-brand-ink/75">
          Agregá una IAM o corregí sus datos: dirección, número de contacto, redes y el lugar donde aparece en el mapa de{" "}
          <Link href="/quienes-somos#donde-estamos" className="font-bold text-brand-brown underline">Quiénes somos</Link>. Los animadores de cada IAM se manejan desde{" "}
          <Link href="/admin/inscripciones" className="font-bold text-brand-brown underline">Inscripciones</Link>.
        </p>
        <IamManager />
      </div>
    </div>
  );
}
