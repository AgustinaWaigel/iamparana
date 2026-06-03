/* ════════════════════════════════════════════════════════════════════
   REEMPLAZO PARA page.tsx
   Sustituí TU bloque "3. NOTICIAS + AGENDA" (la <section> con el
   flex lg:flex-row que tenía Noticias + Agenda al costado) por estos
   DOS bloques. El resto de page.tsx (areas, redes, imports) queda igual.

   Cambios:
   • Noticias a TODO EL ANCHO y arriba (protagonistas) → <Novedades gridLayout />
   • Agenda movida ABAJO, en su propia banda, secundaria.
   ════════════════════════════════════════════════════════════════════ */

{/* ══════════════════════════════════════════
    3. NOTICIAS  (protagonistas, ancho completo)
══════════════════════════════════════════ */}
<section className="w-full max-w-6xl mx-auto px-4 py-12 md:py-16">
  <FadeInSection>
    <div className="mb-8 flex items-end justify-between gap-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e3a92c]">
          Lo último
        </span>
        <h2 className="mt-1.5 text-3xl md:text-4xl font-black text-stone-900 tracking-tight leading-none">
          Noticias
        </h2>
      </div>
      <Link
        href="/noticias"
        className="hidden sm:inline-flex items-center gap-2 rounded-full border border-brand-brown/20 px-4 py-2 text-[13.5px] font-bold text-brand-brown transition-colors hover:bg-brand-brown hover:text-white no-underline"
      >
        Ver todas
        <ChevronRight size={15} />
      </Link>
    </div>
  </FadeInSection>

  <FadeInSection delay={80}>
    {/* gridLayout = portada editorial (destacada + lista) */}
    <Novedades gridLayout limit={5} />
  </FadeInSection>
</section>

{/* ══════════════════════════════════════════
    3b. AGENDA  (banda secundaria, abajo)
══════════════════════════════════════════ */}
<section className="w-full bg-[#3a1508] py-14 md:py-16">
  <div className="max-w-6xl mx-auto px-4">
    <FadeInSection>
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e3a92c]">
            Próximas fechas
          </span>
          <h2 className="mt-1.5 text-3xl md:text-4xl font-black text-white tracking-tight leading-none">
            Agenda misionera
          </h2>
        </div>
        <Link
          href="/calendario"
          className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[13.5px] font-bold text-white backdrop-blur transition-colors hover:bg-white/20 no-underline"
        >
          <CalendarDays size={14} />
          Calendario completo
        </Link>
      </div>
    </FadeInSection>

    <FadeInSection delay={80}>
      {/* Tu componente <Agenda /> tal cual; el contenedor oscuro lo
          vuelve secundario respecto a las noticias de arriba.
          Si tu <Agenda /> renderiza texto oscuro, pasale una prop de
          variante o envolvelo en una card blanca como abajo: */}
      <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10 backdrop-blur">
        <Agenda />
      </div>
    </FadeInSection>
  </div>
</section>
