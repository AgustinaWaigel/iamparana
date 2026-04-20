"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, FileUp, Link as LinkIcon, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useSessionUser } from "@/app/lib/use-session";

type ResourcePage = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  texture_url: string | null;
  template: string;
};

type ResourceSection = {
  id: number;
  page_id: number;
  slug: string;
  title: string;
  section_key: string;
  position: number;
};

const TEMPLATE_OPTIONS = [
  { value: "gold", label: "Dorado (Formacion)" },
  { value: "ocean", label: "Azul (Comunicacion)" },
  { value: "earth", label: "Tierra (Institucional)" },
] as const;

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

type TemplateValue = (typeof TEMPLATE_OPTIONS)[number]["value"];

const TEMPLATE_PREVIEW: Record<
  TemplateValue,
  { banner: string; title: string; card: string; dot: string }
> = {
  gold: {
    banner: "linear-gradient(90deg, rgba(253, 224, 71, 0.95), rgba(250, 204, 21, 0.95))",
    title: "text-brand-brown",
    card: "border-yellow-200 bg-yellow-50/40",
    dot: "bg-yellow-500",
  },
  ocean: {
    banner: "linear-gradient(90deg, rgba(59, 130, 246, 0.95), rgba(14, 165, 233, 0.95))",
    title: "text-white",
    card: "border-blue-200 bg-blue-50/40",
    dot: "bg-blue-500",
  },
  earth: {
    banner: "linear-gradient(90deg, rgba(120, 53, 15, 0.95), rgba(146, 64, 14, 0.95))",
    title: "text-amber-100",
    card: "border-amber-300 bg-amber-50/40",
    dot: "bg-amber-600",
  },
};

function TemplatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-black uppercase tracking-wider text-stone-500">Template visual</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {TEMPLATE_OPTIONS.map((item) => {
          const selected = value === item.value;
          const preview = TEMPLATE_PREVIEW[item.value];

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              className={`rounded-xl border p-2 text-left transition ${
                selected
                  ? "border-brand-brown bg-brand-brown/5 ring-2 ring-brand-brown/20"
                  : "border-stone-200 bg-white hover:border-stone-300"
              }`}
            >
              <div
                className="h-16 rounded-lg px-2 py-2"
                style={{ backgroundImage: preview.banner }}
              >
                <p className={`text-xs font-black uppercase tracking-tight ${preview.title}`}>Banner</p>
              </div>
              <div className={`mt-2 rounded-lg border p-2 ${preview.card}`}>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${preview.dot}`} />
                  <span className="text-[10px] font-bold text-stone-700">Card de seccion</span>
                </div>
              </div>
              <p className="mt-2 text-xs font-bold text-stone-700">{item.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminRecursosPage() {
  const { user, loading } = useSessionUser();

  const [pages, setPages] = useState<ResourcePage[]>([]);
  const [sections, setSections] = useState<ResourceSection[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [selectedSectionKey, setSelectedSectionKey] = useState("");
  const [activeTab, setActiveTab] = useState<"document" | "link">("document");

  const [createPageForm, setCreatePageForm] = useState({
    title: "",
    slug: "",
    description: "",
    textureUrl: "/assets/textures/formacion.webp",
    template: "gold",
  });

  const [editPageForm, setEditPageForm] = useState({
    title: "",
    description: "",
    textureUrl: "",
    template: "gold",
  });

  const [sectionForm, setSectionForm] = useState({
    title: "",
    slug: "",
  });

  const [editSectionTitle, setEditSectionTitle] = useState("");

  const [docForm, setDocForm] = useState({
    titulo: "",
    descripcion: "",
  });
  const [docFile, setDocFile] = useState<File | null>(null);

  const [linkForm, setLinkForm] = useState({
    title: "",
    description: "",
    url: "",
    icon: "🔗",
  });

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const selectedPage = useMemo(
    () => pages.find((page) => page.id === selectedPageId) || null,
    [pages, selectedPageId]
  );

  const selectedSection = useMemo(
    () => sections.find((section) => section.id === selectedSectionId) || null,
    [sections, selectedSectionId]
  );

  const showMessage = (value: string) => {
    setMessage(value);
    setTimeout(() => setMessage(""), 3000);
  };

  const loadPages = async () => {
    const response = await fetch("/api/admin/resource-pages", { credentials: "include" });
    if (!response.ok) throw new Error("No se pudieron cargar las paginas");

    const data = await response.json();
    const nextPages = Array.isArray(data) ? data : [];
    setPages(nextPages);

    if (!selectedPageId && nextPages[0]?.id) {
      setSelectedPageId(Number(nextPages[0].id));
    }
  };

  const loadSections = async (pageId: number) => {
    const response = await fetch(`/api/admin/resource-sections?pageId=${pageId}`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("No se pudieron cargar las secciones");

    const data = await response.json();
    const nextSections = Array.isArray(data) ? data : [];
    setSections(nextSections);

    if (nextSections[0]?.id) {
      setSelectedSectionId(Number(nextSections[0].id));
      setSelectedSectionKey(String(nextSections[0].section_key));
      setEditSectionTitle(String(nextSections[0].title));
    } else {
      setSelectedSectionId(null);
      setSelectedSectionKey("");
      setEditSectionTitle("");
    }
  };

  useEffect(() => {
    if (!loading && user?.role === "admin") {
      loadPages().catch((error) => showMessage(String(error instanceof Error ? error.message : error)));
    }
  }, [loading, user]);

  useEffect(() => {
    if (selectedPageId) {
      loadSections(selectedPageId).catch((error) =>
        showMessage(String(error instanceof Error ? error.message : error))
      );
    } else {
      setSections([]);
      setSelectedSectionId(null);
      setSelectedSectionKey("");
    }
  }, [selectedPageId]);

  useEffect(() => {
    if (selectedPage) {
      setEditPageForm({
        title: selectedPage.title,
        description: selectedPage.description || "",
        textureUrl: selectedPage.texture_url || "",
        template: selectedPage.template || "gold",
      });
    }
  }, [selectedPage]);

  useEffect(() => {
    if (selectedSection) {
      setEditSectionTitle(selectedSection.title);
      setSelectedSectionKey(selectedSection.section_key);
    }
  }, [selectedSection]);

  if (loading) {
    return (
      <main className="min-h-screen pt-28 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-brown" size={32} />
      </main>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const createPage = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/admin/resource-pages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPageForm),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo crear la pagina");
      }

      setCreatePageForm({
        title: "",
        slug: "",
        description: "",
        textureUrl: "/assets/textures/formacion.webp",
        template: "gold",
      });

      await loadPages();
      showMessage("Pagina creada");
    } catch (error) {
      showMessage(String(error instanceof Error ? error.message : error));
    } finally {
      setBusy(false);
    }
  };

  const updatePage = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPageId) return;

    setBusy(true);
    try {
      const response = await fetch("/api/admin/resource-pages", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedPageId, ...editPageForm }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo actualizar la pagina");
      }

      await loadPages();
      showMessage("Pagina actualizada");
    } catch (error) {
      showMessage(String(error instanceof Error ? error.message : error));
    } finally {
      setBusy(false);
    }
  };

  const removePage = async () => {
    if (!selectedPageId) return;
    if (!confirm("Eliminar pagina, secciones y su contenido?")) return;

    setBusy(true);
    try {
      const response = await fetch(`/api/admin/resource-pages?id=${selectedPageId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo eliminar la pagina");
      }

      setSelectedPageId(null);
      await loadPages();
      showMessage("Pagina eliminada");
    } catch (error) {
      showMessage(String(error instanceof Error ? error.message : error));
    } finally {
      setBusy(false);
    }
  };

  const createSection = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPageId) return;

    setBusy(true);
    try {
      const response = await fetch("/api/admin/resource-sections", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: selectedPageId, ...sectionForm }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo crear la seccion");
      }

      setSectionForm({ title: "", slug: "" });
      await loadSections(selectedPageId);
      showMessage("Seccion creada");
    } catch (error) {
      showMessage(String(error instanceof Error ? error.message : error));
    } finally {
      setBusy(false);
    }
  };

  const saveSectionTitle = async () => {
    if (!selectedSectionId) return;

    setBusy(true);
    try {
      const response = await fetch("/api/admin/resource-sections", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedSectionId, title: editSectionTitle }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo actualizar la seccion");
      }

      if (selectedPageId) await loadSections(selectedPageId);
      showMessage("Seccion actualizada");
    } catch (error) {
      showMessage(String(error instanceof Error ? error.message : error));
    } finally {
      setBusy(false);
    }
  };

  const moveSection = async (id: number, direction: "up" | "down") => {
    if (!selectedPageId) return;

    setBusy(true);
    try {
      const response = await fetch("/api/admin/resource-sections", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "move", direction }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo mover la seccion");
      }

      await loadSections(selectedPageId);
    } catch (error) {
      showMessage(String(error instanceof Error ? error.message : error));
    } finally {
      setBusy(false);
    }
  };

  const removeSection = async (id: number) => {
    if (!selectedPageId) return;
    if (!confirm("Eliminar seccion y su contenido?")) return;

    setBusy(true);
    try {
      const response = await fetch(`/api/admin/resource-sections?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo eliminar la seccion");
      }

      await loadSections(selectedPageId);
      showMessage("Seccion eliminada");
    } catch (error) {
      showMessage(String(error instanceof Error ? error.message : error));
    } finally {
      setBusy(false);
    }
  };

  const uploadDocument = async (e: FormEvent) => {
    e.preventDefault();
    if (!docFile || !selectedSectionKey) return;

    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", docFile);
      formData.append("type", "documento");

      const uploadRes = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo subir el archivo");
      }

      const uploadData = await uploadRes.json();

      const saveRes = await fetch("/api/admin/documentos", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: docForm.titulo,
          descripcion: docForm.descripcion,
          tipo: selectedSectionKey,
          url: uploadData.url,
          fileId: uploadData.fileId,
        }),
      });

      if (!saveRes.ok) {
        const data = await saveRes.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo guardar el documento");
      }

      setDocForm({ titulo: "", descripcion: "" });
      setDocFile(null);
      showMessage("Documento agregado a la seccion");
    } catch (error) {
      showMessage(String(error instanceof Error ? error.message : error));
    } finally {
      setBusy(false);
    }
  };

  const createLink = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSectionKey) return;

    setBusy(true);
    try {
      const response = await fetch("/api/admin/links", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: selectedSectionKey,
          title: linkForm.title,
          description: linkForm.description,
          url: linkForm.url,
          icon: linkForm.icon,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo crear el enlace");
      }

      setLinkForm({ title: "", description: "", url: "", icon: "🔗" });
      showMessage("Enlace agregado a la seccion");
    } catch (error) {
      showMessage(String(error instanceof Error ? error.message : error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 pt-28 pb-12 space-y-8">
      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h1 className="text-3xl font-black text-brand-brown">Paginas de recursos</h1>
        <p className="mt-1 text-sm text-stone-600">
          Crea, edita, ordena y publica paginas con secciones y contenido interno.
        </p>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
          <h2 className="font-black text-brand-brown">1) Crear pagina</h2>
          <form className="space-y-3" onSubmit={createPage}>
            <input
              value={createPageForm.title}
              onChange={(e) =>
                setCreatePageForm((prev) => {
                  const title = e.target.value;
                  return { ...prev, title, slug: toSlug(title) };
                })
              }
              placeholder="Titulo"
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
              required
            />
            <input
              value={createPageForm.slug}
              readOnly
              placeholder="slug automatico"
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-stone-600"
            />
            <TemplatePicker value={createPageForm.template} onChange={(next) => setCreatePageForm((prev) => ({ ...prev, template: next }))} />
            <input value={createPageForm.textureUrl} onChange={(e) => setCreatePageForm((prev) => ({ ...prev, textureUrl: e.target.value }))} placeholder="/assets/textures/formacion.webp" className="w-full rounded-lg border border-stone-300 px-3 py-2" />
            <textarea value={createPageForm.description} onChange={(e) => setCreatePageForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Descripcion" rows={3} className="w-full rounded-lg border border-stone-300 px-3 py-2" />
            <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-brand-brown px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Plus size={16} /> Crear pagina</button>
          </form>

          <div className="pt-3 border-t border-stone-200 space-y-2">
            <h3 className="text-sm font-black uppercase text-stone-500">Paginas</h3>
            {pages.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => setSelectedPageId(page.id)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm font-semibold ${selectedPageId === page.id ? "bg-brand-brown text-white" : "bg-stone-50 text-stone-700"}`}
              >
                {page.title} ({page.slug})
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
          <h2 className="font-black text-brand-brown">2) Editar pagina y secciones</h2>

          {!selectedPage && <p className="text-sm text-stone-500">Selecciona una pagina.</p>}

          {selectedPage && (
            <>
              <Link href={`/recursos/${selectedPage.slug}`} target="_blank" className="inline-flex text-sm font-bold text-brand-brown underline">
                Ver pagina publica /recursos/{selectedPage.slug}
              </Link>

              <form className="space-y-2" onSubmit={updatePage}>
                <input value={editPageForm.title} onChange={(e) => setEditPageForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded-lg border border-stone-300 px-3 py-2" required />
                <TemplatePicker value={editPageForm.template} onChange={(next) => setEditPageForm((prev) => ({ ...prev, template: next }))} />
                <input value={editPageForm.textureUrl} onChange={(e) => setEditPageForm((prev) => ({ ...prev, textureUrl: e.target.value }))} className="w-full rounded-lg border border-stone-300 px-3 py-2" />
                <textarea value={editPageForm.description} onChange={(e) => setEditPageForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} className="w-full rounded-lg border border-stone-300 px-3 py-2" />
                <div className="flex gap-2">
                  <button disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"><Pencil size={14} /> Guardar</button>
                  <button type="button" onClick={removePage} disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"><Trash2 size={14} /> Eliminar</button>
                </div>
              </form>

              <form className="space-y-2 border-t border-stone-200 pt-3" onSubmit={createSection}>
                <input
                  value={sectionForm.title}
                  onChange={(e) =>
                    setSectionForm((prev) => {
                      const title = e.target.value;
                      return { ...prev, title, slug: toSlug(title) };
                    })
                  }
                  placeholder="Titulo de seccion"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2"
                  required
                />
                <input
                  value={sectionForm.slug}
                  readOnly
                  placeholder="slug automatico"
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-stone-600"
                />
                <button disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-brand-brown px-3 py-2 text-sm font-bold text-white disabled:opacity-50"><Plus size={14} /> Agregar seccion</button>
              </form>

              <div className="space-y-2 border-t border-stone-200 pt-3">
                {sections.map((section) => (
                  <div key={section.id} className={`rounded-lg border p-2 ${selectedSectionId === section.id ? "border-brand-brown" : "border-stone-200"}`}>
                    <button type="button" onClick={() => setSelectedSectionId(section.id)} className="w-full text-left text-sm font-semibold text-stone-800">
                      {section.title}
                    </button>
                    <div className="mt-2 flex gap-1">
                      <button type="button" onClick={() => moveSection(section.id, "up")} className="rounded bg-stone-100 p-1"><ArrowUp size={14} /></button>
                      <button type="button" onClick={() => moveSection(section.id, "down")} className="rounded bg-stone-100 p-1"><ArrowDown size={14} /></button>
                      <button type="button" onClick={() => removeSection(section.id)} className="rounded bg-red-100 p-1 text-red-700"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>

              {selectedSection && (
                <div className="space-y-2 border-t border-stone-200 pt-3">
                  <input value={editSectionTitle} onChange={(e) => setEditSectionTitle(e.target.value)} className="w-full rounded-lg border border-stone-300 px-3 py-2" />
                  <button type="button" onClick={saveSectionTitle} disabled={busy} className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">Guardar titulo seccion</button>
                </div>
              )}
            </>
          )}
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
          <h2 className="font-black text-brand-brown">3) Cargar contenido en seccion</h2>

          <div className="flex gap-2">
            <button type="button" onClick={() => setActiveTab("document")} className={`rounded-lg px-3 py-2 text-sm font-bold ${activeTab === "document" ? "bg-green-500 text-white" : "bg-stone-100"}`}>
              <FileUp size={16} className="inline mr-1" /> Documento
            </button>
            <button type="button" onClick={() => setActiveTab("link")} className={`rounded-lg px-3 py-2 text-sm font-bold ${activeTab === "link" ? "bg-blue-500 text-white" : "bg-stone-100"}`}>
              <LinkIcon size={16} className="inline mr-1" /> Enlace
            </button>
          </div>

          {!selectedSectionKey && <p className="text-sm text-stone-500">Selecciona una seccion.</p>}

          {activeTab === "document" ? (
            <form className="space-y-3" onSubmit={uploadDocument}>
              <input value={docForm.titulo} onChange={(e) => setDocForm((prev) => ({ ...prev, titulo: e.target.value }))} placeholder="Titulo del documento" className="w-full rounded-lg border border-stone-300 px-3 py-2" required />
              <textarea value={docForm.descripcion} onChange={(e) => setDocForm((prev) => ({ ...prev, descripcion: e.target.value }))} placeholder="Descripcion" rows={2} className="w-full rounded-lg border border-stone-300 px-3 py-2" />
              <input type="file" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} className="w-full" required />
              <button disabled={busy || !selectedSectionKey} className="rounded-lg bg-green-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Subir documento</button>
            </form>
          ) : (
            <form className="space-y-3" onSubmit={createLink}>
              <input value={linkForm.title} onChange={(e) => setLinkForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Titulo" className="w-full rounded-lg border border-stone-300 px-3 py-2" required />
              <textarea value={linkForm.description} onChange={(e) => setLinkForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Descripcion" rows={2} className="w-full rounded-lg border border-stone-300 px-3 py-2" />
              <input value={linkForm.url} onChange={(e) => setLinkForm((prev) => ({ ...prev, url: e.target.value }))} placeholder="https://..." className="w-full rounded-lg border border-stone-300 px-3 py-2" required />
              <input value={linkForm.icon} onChange={(e) => setLinkForm((prev) => ({ ...prev, icon: e.target.value }))} placeholder="🔗" className="w-full rounded-lg border border-stone-300 px-3 py-2" />
              <button disabled={busy || !selectedSectionKey} className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Agregar enlace</button>
            </form>
          )}

          {message && <p className="text-sm font-semibold text-stone-700">{message}</p>}
        </section>
      </div>
    </main>
  );
}
