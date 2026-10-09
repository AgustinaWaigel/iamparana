"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MapPin, MapPinOff, Pencil, Plus, Search } from "lucide-react";
import { MapaPunto, type Punto } from "./mapa-punto";

// Las IAM de la arquidiócesis: se agregan y se editan acá, con su dirección, contacto, redes y
// el lugar donde aparecen en el mapa de "Quiénes somos". Son los mismos grupos de las inscripciones.

type Iam = {
  id: string;
  nombre: string;
  ciudad: string | null;
  activo: boolean;
  color: string | null;
  direccion: string | null;
  telefono: string | null;
  instagram: string | null;
  facebook: string | null;
  lat: number | null;
  lng: number | null;
  aproximado: Punto | null;
};

type Borrador = { id?: string; nombre: string; ciudad: string; activo: boolean; color: string; direccion: string; telefono: string; instagram: string; facebook: string; punto: Punto | null; aproximado: Punto | null };

const PARANA: Punto = [-31.73301, -60.52985];
const NUEVA: Borrador = { nombre: "", ciudad: "", activo: true, color: "", direccion: "", telefono: "", instagram: "", facebook: "", punto: null, aproximado: null };
const CARD = "rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6";
const AYUDA = "m-0 mt-1 max-w-none text-left text-xs text-stone-500";

const aBorrador = (iam: Iam): Borrador => ({
  id: iam.id,
  nombre: iam.nombre,
  ciudad: iam.ciudad ?? "",
  activo: iam.activo,
  color: iam.color ?? "",
  direccion: iam.direccion ?? "",
  telefono: iam.telefono ?? "",
  instagram: iam.instagram ?? "",
  facebook: iam.facebook ?? "",
  punto: iam.lat !== null && iam.lng !== null ? [iam.lat, iam.lng] : null,
  aproximado: iam.aproximado,
});

const aPedido = (borrador: Borrador) => ({
  id: borrador.id,
  nombre: borrador.nombre,
  ciudad: borrador.ciudad,
  activo: borrador.activo,
  color: borrador.color,
  direccion: borrador.direccion,
  telefono: borrador.telefono,
  instagram: borrador.instagram,
  facebook: borrador.facebook,
  lat: borrador.punto?.[0] ?? null,
  lng: borrador.punto?.[1] ?? null,
});

export function IamManager() {
  const [iams, setIams] = useState<Iam[] | null>(null);
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [avisoMapa, setAvisoMapa] = useState("");
  const formulario = useRef<HTMLFormElement>(null);

  const cargar = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/iam", { credentials: "include", cache: "no-store" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "No se pudieron cargar las IAM.");
      setIams(data);
    } catch (error) {
      setIams((prev) => prev ?? []);
      setMensaje({ ok: false, texto: error instanceof Error ? error.message : "No se pudieron cargar las IAM." });
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const ciudades = useMemo(() => [...new Set((iams ?? []).map((iam) => iam.ciudad).filter((ciudad): ciudad is string => Boolean(ciudad)))].sort((a, b) => a.localeCompare(b, "es")), [iams]);

  const abrir = (nuevo: Borrador) => {
    setBorrador(nuevo);
    setMensaje(null);
    setAvisoMapa("");
    // El formulario está arriba de la lista: se lo trae a la vista.
    requestAnimationFrame(() => formulario.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }));
  };

  const guardar = async (datos: Borrador, hecho: string) => {
    setGuardando(true);
    setMensaje(null);
    try {
      const response = await fetch("/api/admin/iam", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aPedido(datos)),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "No se pudo guardar la IAM.");
      setBorrador(null);
      setMensaje({ ok: true, texto: hecho });
      await cargar();
    } catch (error) {
      setMensaje({ ok: false, texto: error instanceof Error ? error.message : "No se pudo guardar la IAM." });
    } finally {
      setGuardando(false);
    }
  };

  const enviar = (event: FormEvent) => {
    event.preventDefault();
    if (borrador) guardar(borrador, borrador.id ? `Se guardaron los cambios de ${borrador.nombre}.` : `Se agregó ${borrador.nombre}.`);
  };

  const buscarDireccion = async () => {
    if (!borrador) return;
    const consulta = [borrador.direccion, borrador.ciudad, "Entre Ríos"].map((parte) => parte.trim()).filter(Boolean).join(", ");
    setBuscando(true);
    setAvisoMapa("");
    try {
      const response = await fetch(`/api/admin/iam/buscar?q=${encodeURIComponent(consulta)}`, { credentials: "include" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "No se pudo buscar la dirección.");
      setBorrador((prev) => (prev ? { ...prev, punto: [Math.round(data.lat * 100000) / 100000, Math.round(data.lng * 100000) / 100000] } : prev));
      setAvisoMapa(`Encontramos: ${data.nombre}. Si no es exacto, arrastrá el globito.`);
    } catch (error) {
      setAvisoMapa(error instanceof Error ? error.message : "No se pudo buscar la dirección.");
    } finally {
      setBuscando(false);
    }
  };

  const campo = (clave: "nombre" | "ciudad" | "direccion" | "telefono" | "instagram" | "facebook", valor: string) => setBorrador((prev) => (prev ? { ...prev, [clave]: valor } : prev));

  return (
    <>
      {!borrador && (
        <button type="button" onClick={() => abrir(NUEVA)} className="btn-primary mt-6">
          <Plus size={16} aria-hidden /> Agregar una IAM
        </button>
      )}

      {mensaje && <p role={mensaje.ok ? "status" : "alert"} className={`m-0 mt-5 max-w-none rounded-xl border px-4 py-3 text-left text-sm font-medium ${mensaje.ok ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-800"}`}>{mensaje.texto}</p>}

      {borrador && (
        <form ref={formulario} onSubmit={enviar} className={`${CARD} mt-6 scroll-mt-24`}>
          <h2 className="m-0 text-left font-display text-2xl font-extrabold text-brand-ink">{borrador.id ? `Editar ${borrador.nombre || "la IAM"}` : "Agregar una IAM"}</h2>
          <p className="m-0 mt-1 max-w-none text-left text-sm text-stone-600">Todo lo que cargues acá se muestra en «Quiénes somos», a la vista de cualquiera. Solo el nombre es obligatorio.</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="iam-nombre" className="modal-label-unified">Nombre</label>
              <input id="iam-nombre" className="modal-input-unified mt-1" value={borrador.nombre} onChange={(e) => campo("nombre", e.target.value)} maxLength={120} required placeholder="Ej.: San José Obrero" />
            </div>
            <div>
              <label htmlFor="iam-ciudad" className="modal-label-unified">Ciudad</label>
              <input id="iam-ciudad" list="iam-ciudades" className="modal-input-unified mt-1" value={borrador.ciudad} onChange={(e) => campo("ciudad", e.target.value)} maxLength={80} placeholder="Ej.: Paraná" />
              <datalist id="iam-ciudades">{ciudades.map((ciudad) => <option key={ciudad} value={ciudad} />)}</datalist>
            </div>
            <div>
              <label htmlFor="iam-direccion" className="modal-label-unified">Dirección</label>
              <input id="iam-direccion" className="modal-input-unified mt-1" value={borrador.direccion} onChange={(e) => campo("direccion", e.target.value)} maxLength={160} placeholder="Ej.: Av. Ramírez 1234" />
            </div>
            <div>
              <label htmlFor="iam-telefono" className="modal-label-unified">Número de contacto</label>
              <input id="iam-telefono" type="tel" inputMode="tel" className="modal-input-unified mt-1" value={borrador.telefono} onChange={(e) => campo("telefono", e.target.value)} maxLength={25} placeholder="Ej.: 343 4567890" aria-describedby="iam-telefono-ayuda" />
              <p id="iam-telefono-ayuda" className={AYUDA}>Con código de área, sin 0 ni 15: así también se ofrece escribir por WhatsApp. Pedile permiso a la persona antes de publicarlo.</p>
            </div>
            <div>
              <span className="modal-label-unified">Color en el mapa</span>
              <div className="mt-1 flex items-center gap-3">
                <input type="color" value={borrador.color || "#f6c445"} onChange={(e) => setBorrador({ ...borrador, color: e.target.value })} className="h-11 w-14 cursor-pointer rounded-lg border border-stone-300 bg-white p-1" aria-label="Color de la IAM en el mapa y en las planillas" />
                {borrador.color ? <button type="button" onClick={() => setBorrador({ ...borrador, color: "" })} className="text-sm font-bold text-stone-600 underline">Quitar el color</button> : <span className="text-sm text-stone-500">Sin color propio: se usa amarillo.</span>}
              </div>
            </div>
            <div>
              <label htmlFor="iam-instagram" className="modal-label-unified">Instagram</label>
              <input id="iam-instagram" className="modal-input-unified mt-1" value={borrador.instagram} onChange={(e) => campo("instagram", e.target.value)} maxLength={300} placeholder="@usuario o el enlace" autoCapitalize="none" spellCheck={false} />
            </div>
            <div>
              <label htmlFor="iam-facebook" className="modal-label-unified">Facebook</label>
              <input id="iam-facebook" className="modal-input-unified mt-1" value={borrador.facebook} onChange={(e) => campo("facebook", e.target.value)} maxLength={300} placeholder="Nombre de la página o el enlace" autoCapitalize="none" spellCheck={false} />
            </div>
          </div>

          <div className="mt-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="m-0 text-left font-display text-lg font-extrabold text-brand-ink">Dónde queda</h3>
                <p className="m-0 mt-0.5 max-w-none text-left text-sm text-stone-600">
                  {borrador.punto ? "Tocá el mapa o arrastrá el globito para corregir el lugar." : "Todavía no tiene un lugar marcado: en el sitio aparece en un punto aproximado de su ciudad. Tocá el mapa para marcarlo."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={buscarDireccion} disabled={buscando || (!borrador.direccion.trim() && !borrador.ciudad.trim())} className="btn-secondary px-4 py-2">
                  {buscando ? <Loader2 size={16} aria-hidden className="animate-spin motion-reduce:animate-none" /> : <Search size={16} aria-hidden />}
                  Buscar la dirección
                </button>
                {borrador.punto && (
                  <button type="button" onClick={() => { setBorrador({ ...borrador, punto: null }); setAvisoMapa(""); }} className="btn-secondary px-4 py-2">
                    <MapPinOff size={16} aria-hidden /> Quitar el punto
                  </button>
                )}
              </div>
            </div>
            {avisoMapa && <p role="status" className="m-0 mt-3 max-w-none rounded-xl bg-brand-cream px-4 py-2.5 text-left text-sm text-brand-ink">{avisoMapa}</p>}
            <div className="mt-3">
              <MapaPunto key={borrador.id ?? "nueva"} punto={borrador.punto} centro={borrador.aproximado ?? PARANA} color={borrador.color || "#f6c445"} onChange={(punto) => setBorrador((prev) => (prev ? { ...prev, punto } : prev))} />
            </div>
          </div>

          <label className="mt-5 flex items-start gap-3 text-left text-sm text-stone-700">
            <input type="checkbox" checked={borrador.activo} onChange={(e) => setBorrador({ ...borrador, activo: e.target.checked })} className="mt-0.5 h-5 w-5 shrink-0 accent-brand-brown" />
            <span><strong className="font-bold text-stone-800">Visible.</strong> Aparece en el mapa y las familias la pueden elegir al inscribirse. Si la destildás queda oculta, sin borrarse.</span>
          </label>

          <div className="modal-actions-unified mt-6">
            <button type="button" onClick={() => setBorrador(null)} disabled={guardando} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-primary">
              {guardando ? <Loader2 size={16} aria-hidden className="animate-spin motion-reduce:animate-none" /> : borrador.id ? <Pencil size={16} aria-hidden /> : <Plus size={16} aria-hidden />}
              {borrador.id ? "Guardar los cambios" : "Agregar la IAM"}
            </button>
          </div>
        </form>
      )}

      <section aria-labelledby="iam-lista" className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <h2 id="iam-lista" className="m-0 border-b border-stone-100 px-5 py-4 text-left font-display text-xl font-extrabold text-brand-ink">
          {iams ? `${iams.length} IAM cargadas` : "IAM cargadas"}
        </h2>
        {iams === null ? (
          <p className="m-0 max-w-none p-10 text-center text-stone-500"><Loader2 aria-hidden className="mx-auto mb-2 animate-spin motion-reduce:animate-none" />Cargando…</p>
        ) : iams.length === 0 ? (
          <p className="m-0 max-w-none p-10 text-center text-stone-600">Todavía no hay ninguna IAM cargada. Agregá la primera con el botón de arriba.</p>
        ) : (
          <ul className="m-0 list-none divide-y divide-stone-100 p-0">
            {iams.map((iam) => {
              const conPunto = iam.lat !== null && iam.lng !== null;
              const datos = [iam.telefono, iam.instagram && "Instagram", iam.facebook && "Facebook"].filter(Boolean).join(" · ");
              return (
                <li key={iam.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
                  <span aria-hidden className="h-10 w-3 shrink-0 rounded-full border border-stone-200" style={{ backgroundColor: iam.color ?? "transparent" }} />
                  <div className="min-w-0 flex-1 basis-56 text-left">
                    <p className={`m-0 max-w-none text-left text-base font-bold ${iam.activo ? "text-stone-800" : "text-stone-500 line-through"}`}>{iam.nombre}</p>
                    <p className="m-0 max-w-none text-left text-sm text-stone-600">
                      {[iam.direccion, iam.ciudad].filter(Boolean).join(", ") || "Sin ciudad"}
                      {!iam.activo && " · Oculta"}
                    </p>
                    <p className="m-0 mt-1 flex max-w-none flex-wrap items-center gap-x-3 gap-y-1 text-left text-sm text-stone-600">
                      <span className={`inline-flex items-center gap-1 font-semibold ${conPunto ? "text-emerald-800" : "text-amber-800"}`}>
                        <MapPin size={14} aria-hidden /> {conPunto ? "Lugar marcado" : "Lugar aproximado"}
                      </span>
                      {datos && <span>{datos}</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" disabled={guardando} onClick={() => abrir(aBorrador(iam))} className="btn-secondary px-4 py-2">Editar</button>
                    <button type="button" disabled={guardando} onClick={() => guardar({ ...aBorrador(iam), activo: !iam.activo }, iam.activo ? `${iam.nombre} quedó oculta.` : `${iam.nombre} vuelve a estar visible.`)} className="btn-secondary px-4 py-2">
                      {iam.activo ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
