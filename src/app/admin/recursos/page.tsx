"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useSessionUser } from "@/app/lib/use-session";
import { ContentUploadPanel } from "./components/content-upload-panel";
import { CreatePagePanel } from "./components/create-page-panel";
import { ManagePagePanel } from "./components/manage-page-panel";
import { ResourcePage, ResourceSection } from "./types";

export default function AdminRecursosPage() {
  // Esta pantalla administra las páginas de recursos, sus secciones y los elementos publicados en cada una.
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
    // Mensajes breves para confirmar operaciones o informar errores.
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
      <main className="min-h-screen pt-20 flex items-center justify-center">
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
    <main className="mx-auto max-w-7xl px-4 pt-20 pb-12 space-y-8">
      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h1 className="text-3xl font-black text-brand-brown">Paginas de recursos</h1>
        <p className="mt-1 text-sm text-stone-600">
          Crea, edita, ordena y publica paginas con secciones y contenido interno.
        </p>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <CreatePagePanel
          busy={busy}
          pages={pages}
          selectedPageId={selectedPageId}
          createPageForm={createPageForm}
          setSelectedPageId={setSelectedPageId}
          setCreatePageForm={setCreatePageForm}
          onCreatePage={createPage}
        />

        <ManagePagePanel
          busy={busy}
          selectedPage={selectedPage}
          selectedSection={selectedSection}
          selectedSectionId={selectedSectionId}
          sections={sections}
          editPageForm={editPageForm}
          sectionForm={sectionForm}
          editSectionTitle={editSectionTitle}
          setSelectedSectionId={setSelectedSectionId}
          setEditPageForm={setEditPageForm}
          setSectionForm={setSectionForm}
          setEditSectionTitle={setEditSectionTitle}
          onUpdatePage={updatePage}
          onRemovePage={removePage}
          onCreateSection={createSection}
          onMoveSection={moveSection}
          onRemoveSection={removeSection}
          onSaveSectionTitle={saveSectionTitle}
        />

        <ContentUploadPanel
          busy={busy}
          activeTab={activeTab}
          selectedSectionKey={selectedSectionKey}
          docForm={docForm}
          linkForm={linkForm}
          setActiveTab={setActiveTab}
          setDocForm={setDocForm}
          setLinkForm={setLinkForm}
          setDocFile={setDocFile}
          onUploadDocument={uploadDocument}
          onCreateLink={createLink}
          message={message}
        />
      </div>
    </main>
  );
}
