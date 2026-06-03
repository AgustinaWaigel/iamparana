// app.jsx — Inicio IAM Paraná (rediseño)
const { useState, useEffect, useRef, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "newsLayout": "portada",
  "carouselSize": "banda",
  "accent": "#e3a92c",
  "showAgendaTop": false
}/*EDITMODE-END*/;

/* ── Hook: revelar al hacer scroll ───────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  });
}

/* ── Chip de categoría ───────────────────────────────────── */
function Cat({ children, light }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] " +
        (light
          ? "bg-white/20 text-white backdrop-blur"
          : "bg-brand-brown/8 text-brand-brown")
      }
    >
      <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
      {children}
    </span>
  );
}

/* ── HEADER ──────────────────────────────────────────────── */
function Header({ accent }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  return (
    <header className="sticky top-0 z-40">
      <div
        className={
          "relative transition-shadow duration-300 " +
          (scrolled ? "shadow-[0_8px_30px_rgba(58,21,8,0.28)]" : "")
        }
        style={{
          backgroundColor: "#4d220c",
          backgroundImage: "url('assets/headerbg.webp')",
          backgroundSize: "520px",
          backgroundBlendMode: "soft-light",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-brand-deep/85 via-brand-brown/70 to-brand-deep/85" />
        <div className="relative mx-auto flex max-w-[1180px] items-center justify-between gap-6 px-6 py-3.5">
          <a href="#" className="flex items-center gap-3 shrink-0">
            <img src="assets/logo-iam-redondo.png" alt="IAM" className="h-11 w-11 object-contain drop-shadow" />
            <span className="hidden sm:flex flex-col leading-none">
              <span className="font-display text-[19px] font-extrabold tracking-tight text-white">
                IAM <span style={{ color: accent }}>Paraná</span>
              </span>
              <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-white/55">
                Infancia y Adolescencia Misionera
              </span>
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((n, i) => (
              <a
                key={n}
                href="#"
                className={
                  "rounded-full px-3.5 py-2 text-[13.5px] font-semibold transition-colors " +
                  (i === 0
                    ? "text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10")
                }
              >
                {n}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              className="hidden sm:inline-flex rounded-full px-4 py-2 text-[13px] font-bold text-brand-deep shadow-sm transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: accent }}
            >
              Sumate
            </button>
            <button className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white lg:hidden">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
            </button>
          </div>
        </div>
        <div className="relative h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${accent}, #f4cd74, ${accent})` }} />
      </div>
    </header>
  );
}

/* ── CARRUSEL (banda contenida) ──────────────────────────── */
function Carousel({ size, accent }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = SLIDES.length;
  const go = useCallback((d) => setI((p) => (p + d + n) % n), [n]);
  const to = (k) => setI(k);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((p) => (p + 1) % n), 6000);
    return () => clearInterval(t);
  }, [paused, n]);

  const heights = {
    banda: "h-[300px] sm:h-[340px] md:h-[380px]",
    medio: "h-[380px] sm:h-[440px] md:h-[500px]",
    compacto: "h-[220px] sm:h-[250px]",
  };

  return (
    <div
      className={"group relative w-full overflow-hidden rounded-[26px] bg-brand-deep shadow-[0_24px_60px_-20px_rgba(58,21,8,0.5)] ring-1 ring-black/5 " + heights[size]}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SLIDES.map((s, k) => (
        <div
          key={k}
          className="absolute inset-0 transition-opacity duration-[900ms] ease-out"
          style={{ opacity: k === i ? 1 : 0, zIndex: k === i ? 1 : 0 }}
        >
          {s.contain ? (
            <div className="absolute inset-0" style={{ background: s.bg || "#e9a92c" }}>
              <img src={s.img} alt="" className={"absolute inset-0 h-full w-full object-contain p-6 " + (k === i ? "kenburns" : "")} />
            </div>
          ) : (
            <img src={s.img} alt="" className={"absolute inset-0 h-full w-full object-cover " + (k === i ? "kenburns" : "")} />
          )}
          {s.bare ? (
            <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/35 to-transparent" />
          ) : (
            <React.Fragment>
              <div className="absolute inset-0 bg-gradient-to-t from-brand-deep via-brand-deep/45 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-deep/70 via-transparent to-transparent" />
            </React.Fragment>
          )}
        </div>
      ))}

      {/* Texto del slide activo: capa única remontada por key={i} → la animación
          siempre se redispara y el estado en reposo es visible (no oculto). */}
      {!SLIDES[i].bare && (
        <div key={i} className="fadeup pointer-events-none absolute inset-x-0 bottom-0 z-[2] p-6 sm:p-9 md:p-11">
          <div className="pointer-events-auto max-w-[640px]">
            <Cat light>{SLIDES[i].cat}</Cat>
            <h2 className="titlewrap mt-3 font-display text-[26px] sm:text-[34px] md:text-[40px] font-extrabold leading-[1.04] text-white">
              {SLIDES[i].title}
            </h2>
            {size !== "compacto" && (
              <p className="mt-2.5 max-w-[520px] text-[14.5px] sm:text-[15.5px] leading-relaxed text-white/80">
                {SLIDES[i].text}
              </p>
            )}
            <a
              href={SLIDES[i].href}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13.5px] font-bold text-brand-deep transition-transform hover:-translate-y-0.5"
            >
              Leer más
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
          </div>
        </div>
      )}

      {/* flechas */}
      <button
        onClick={() => go(-1)}
        aria-label="Anterior"
        className="absolute left-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur transition hover:bg-white/30 group-hover:opacity-100"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
      </button>
      <button
        onClick={() => go(1)}
        aria-label="Siguiente"
        className="absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur transition hover:bg-white/30 group-hover:opacity-100"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
      </button>

      {/* indicadores */}
      <div className="absolute bottom-5 right-6 z-10 flex items-center gap-2">
        {SLIDES.map((_, k) => (
          <button
            key={k}
            onClick={() => to(k)}
            aria-label={"Ir a " + (k + 1)}
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: k === i ? 28 : 8,
              background: k === i ? accent : "rgba(255,255,255,0.5)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── TARJETA DE NOTICIA ──────────────────────────────────── */
function NewsImg({ item, className }) {
  if (item.contain) {
    return (
      <div className={"overflow-hidden " + className} style={{ background: item.bg || "#fbe6c6" }}>
        <img src={item.img} alt="" className="h-full w-full object-contain p-4 transition-transform duration-700 group-hover:scale-[1.05]" />
      </div>
    );
  }
  return (
    <div className={"overflow-hidden " + className}>
      <img src={item.img} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
    </div>
  );
}

function FeatureCard({ item }) {
  return (
    <a href={item.href} className="group reveal flex flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_18px_44px_-26px_rgba(58,21,8,0.5)] ring-1 ring-brand-brown/8 transition-all hover:-translate-y-1 hover:shadow-[0_28px_60px_-26px_rgba(58,21,8,0.55)]">
      <NewsImg item={item} className="h-[280px] sm:h-[340px] w-full" />
      <div className="flex flex-1 flex-col p-7">
        <div className="flex items-center gap-3">
          <Cat>{item.cat}</Cat>
          <span className="text-[12.5px] font-semibold text-brand-ink/45">{item.date}</span>
        </div>
        <h3 className="titlewrap mt-3.5 font-display text-[24px] sm:text-[28px] font-extrabold leading-[1.1] text-brand-ink">
          {item.title}
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-brand-ink/65">{item.text}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-[14px] font-bold text-brand-brown">
          Leer la nota
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </span>
      </div>
    </a>
  );
}

function MiniCard({ item }) {
  return (
    <a href={item.href} className="group reveal flex gap-4 rounded-2xl p-2.5 transition-colors hover:bg-white">
      <NewsImg item={item} className="h-[92px] w-[120px] shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-center gap-2">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-brand-brown">{item.cat}</span>
          <span className="text-[11px] font-semibold text-brand-ink/40">· {item.date}</span>
        </div>
        <h4 className="titlewrap mt-1 font-display text-[16.5px] font-bold leading-[1.18] text-brand-ink line-clamp-3 group-hover:text-brand-brown">
          {item.title}
        </h4>
      </div>
    </a>
  );
}

function GridCard({ item }) {
  return (
    <a href={item.href} className="group reveal flex flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_14px_36px_-24px_rgba(58,21,8,0.5)] ring-1 ring-brand-brown/8 transition-all hover:-translate-y-1 hover:shadow-[0_24px_50px_-26px_rgba(58,21,8,0.55)]">
      <NewsImg item={item} className="h-[200px] w-full" />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-2.5">
          <Cat>{item.cat}</Cat>
          <span className="text-[12px] font-semibold text-brand-ink/45">{item.date}</span>
        </div>
        <h3 className="titlewrap mt-3 font-display text-[19px] font-extrabold leading-[1.14] text-brand-ink line-clamp-3">
          {item.title}
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-brand-ink/60 line-clamp-2">{item.text}</p>
      </div>
    </a>
  );
}

function WideCard({ item }) {
  return (
    <a href={item.href} className="group reveal flex flex-col sm:flex-row overflow-hidden rounded-[22px] bg-white shadow-[0_14px_36px_-24px_rgba(58,21,8,0.5)] ring-1 ring-brand-brown/8 transition-all hover:-translate-y-0.5">
      <NewsImg item={item} className="h-[200px] sm:h-auto sm:w-[300px] shrink-0" />
      <div className="flex flex-1 flex-col justify-center p-6 sm:p-7">
        <div className="flex items-center gap-3">
          <Cat>{item.cat}</Cat>
          <span className="text-[12.5px] font-semibold text-brand-ink/45">{item.date}</span>
        </div>
        <h3 className="titlewrap mt-3 font-display text-[21px] sm:text-[23px] font-extrabold leading-[1.12] text-brand-ink group-hover:text-brand-brown">
          {item.title}
        </h3>
        <p className="mt-2 text-[14.5px] leading-relaxed text-brand-ink/65">{item.text}</p>
      </div>
    </a>
  );
}

/* ── SECCIÓN NOTICIAS ────────────────────────────────────── */
function SectionHead({ kicker, title, cta }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6">
      <div>
        <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-brand-gold">{kicker}</span>
        <h2 className="mt-1.5 font-display text-[32px] sm:text-[40px] font-extrabold leading-none tracking-tight text-brand-ink">
          {title}
        </h2>
      </div>
      {cta && (
        <a href="#" className="hidden sm:inline-flex items-center gap-2 rounded-full border border-brand-brown/20 px-4 py-2 text-[13.5px] font-bold text-brand-brown transition-colors hover:bg-brand-brown hover:text-white">
          {cta}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </a>
      )}
    </div>
  );
}

function Noticias({ layout }) {
  const [feature, ...rest] = NOTICIAS;

  return (
    <section className="mx-auto max-w-[1180px] px-6 py-16 sm:py-20">
      <SectionHead kicker="Lo último" title="Noticias" cta="Ver todas" />

      {layout === "portada" && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.35fr_1fr]">
          <FeatureCard item={feature} />
          <div className="flex flex-col gap-2 rounded-[24px] bg-brand-cream/70 p-3 ring-1 ring-brand-brown/8">
            {rest.map((it, k) => (
              <React.Fragment key={k}>
                <MiniCard item={it} />
                {k < rest.length - 1 && <div className="mx-3 h-px bg-brand-brown/8" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {layout === "grilla" && (
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {NOTICIAS.map((it, k) => (
            <GridCard key={k} item={it} />
          ))}
        </div>
      )}

      {layout === "lista" && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-6">
            <FeatureCard item={feature} />
            {rest.slice(0, 2).map((it, k) => (
              <WideCard key={k} item={it} />
            ))}
          </div>
          <aside className="flex flex-col gap-2 self-start rounded-[24px] bg-brand-cream/70 p-3 ring-1 ring-brand-brown/8">
            <span className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-brown/60">También te puede interesar</span>
            {rest.slice(2).map((it, k) => (
              <React.Fragment key={k}>
                <MiniCard item={it} />
                {k < rest.slice(2).length - 1 && <div className="mx-3 h-px bg-brand-brown/8" />}
              </React.Fragment>
            ))}
          </aside>
        </div>
      )}
    </section>
  );
}

/* ── AGENDA ──────────────────────────────────────────────── */
function Agenda({ accent }) {
  return (
    <section className="relative overflow-hidden bg-brand-deep py-16 sm:py-20" style={{ backgroundImage: "url('assets/headerbg.webp')", backgroundSize: "520px", backgroundBlendMode: "soft-light" }}>
      <div className="absolute inset-0 bg-brand-deep/80" />
      <div className="relative mx-auto max-w-[1180px] px-6">
        <div className="mb-9 flex items-end justify-between gap-6">
          <div>
            <span className="text-[12px] font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>Próximas fechas</span>
            <h2 className="mt-1.5 font-display text-[32px] sm:text-[40px] font-extrabold leading-none tracking-tight text-white">
              Agenda misionera
            </h2>
          </div>
          <a href="#" className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[13.5px] font-bold text-white backdrop-blur transition-colors hover:bg-white/20">
            Calendario completo
          </a>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AGENDA.map((e, k) => (
            <div key={k} className="reveal group flex flex-col rounded-[20px] bg-white/[0.06] p-5 ring-1 ring-white/10 backdrop-blur transition-colors hover:bg-white/[0.1]">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl text-brand-deep" style={{ background: accent }}>
                  <span className="font-display text-[22px] font-extrabold leading-none">{e.d}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{e.m}</span>
                </div>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-white/70">{e.tag}</span>
              </div>
              <h3 className="mt-4 font-display text-[18px] font-bold leading-tight text-white">{e.title}</h3>
              <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-white/55">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>
                {e.place}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FOOTER (sencillo) ───────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-brand-ink py-10 text-center">
      <img src="assets/logo-iam-redondo.png" alt="IAM" className="mx-auto h-12 w-12 object-contain" />
      <p className="mt-3 font-display text-[16px] font-bold text-white">IAM Paraná</p>
      <p className="mt-1 text-[12.5px] text-white/45">Infancia y Adolescencia Misionera · Obras Misionales Pontificias</p>
    </footer>
  );
}

/* ── APP ─────────────────────────────────────────────────── */
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  useReveal();
  const accent = t.accent;

  return (
    <div className="min-h-screen bg-brand-paper font-sans text-brand-ink">
      <Header accent={accent} />

      {/* Carrusel contenido dentro del ancho de la página */}
      <section className="mx-auto max-w-[1180px] px-6 pt-8 sm:pt-10">
        <Carousel size={t.carouselSize} accent={accent} />
      </section>

      {t.showAgendaTop ? (
        <React.Fragment>
          <Agenda accent={accent} />
          <Noticias layout={t.newsLayout} />
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Noticias layout={t.newsLayout} />
          <Agenda accent={accent} />
        </React.Fragment>
      )}

      <Footer />

      <TweaksPanel>
        <TweakSection label="Noticias" />
        <TweakRadio
          label="Disposición"
          value={t.newsLayout}
          options={["portada", "grilla", "lista"]}
          onChange={(v) => setTweak("newsLayout", v)}
        />
        <TweakToggle
          label="Agenda arriba de noticias"
          value={t.showAgendaTop}
          onChange={(v) => setTweak("showAgendaTop", v)}
        />

        <TweakSection label="Carrusel" />
        <TweakRadio
          label="Tamaño"
          value={t.carouselSize}
          options={["compacto", "banda", "medio"]}
          onChange={(v) => setTweak("carouselSize", v)}
        />

        <TweakSection label="Marca" />
        <TweakColor
          label="Acento"
          value={t.accent}
          options={["#e3a92c", "#d98324", "#c0392b", "#2e7d5b", "#3a1508"]}
          onChange={(v) => setTweak("accent", v)}
        />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
