import { FileUp, Link as LinkIcon } from "lucide-react";

type DocForm = {
  titulo: string;
  descripcion: string;
};

type LinkForm = {
  title: string;
  description: string;
  url: string;
  icon: string;
};

type ContentUploadPanelProps = {
  busy: boolean;
  activeTab: "document" | "link";
  selectedSectionKey: string;
  docForm: DocForm;
  linkForm: LinkForm;
  setActiveTab: (value: "document" | "link") => void;
  setDocForm: React.Dispatch<React.SetStateAction<DocForm>>;
  setLinkForm: React.Dispatch<React.SetStateAction<LinkForm>>;
  setDocFile: (file: File | null) => void;
  onUploadDocument: (e: React.FormEvent) => void;
  onCreateLink: (e: React.FormEvent) => void;
  message: string;
};

export function ContentUploadPanel({
  busy,
  activeTab,
  selectedSectionKey,
  docForm,
  linkForm,
  setActiveTab,
  setDocForm,
  setLinkForm,
  setDocFile,
  onUploadDocument,
  onCreateLink,
  message,
}: ContentUploadPanelProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
      <h2 className="font-black text-brand-brown">3) Cargar contenido en seccion</h2>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("document")}
          className={`rounded-lg px-3 py-2 text-sm font-bold ${
            activeTab === "document" ? "bg-green-500 text-white" : "bg-stone-100"
          }`}
        >
          <FileUp size={16} className="inline mr-1" /> Documento
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("link")}
          className={`rounded-lg px-3 py-2 text-sm font-bold ${
            activeTab === "link" ? "bg-blue-500 text-white" : "bg-stone-100"
          }`}
        >
          <LinkIcon size={16} className="inline mr-1" /> Enlace
        </button>
      </div>

      {!selectedSectionKey && <p className="text-sm text-stone-500">Selecciona una seccion.</p>}

      {activeTab === "document" ? (
        <form className="space-y-3" onSubmit={onUploadDocument}>
          <input
            value={docForm.titulo}
            onChange={(e) => setDocForm((prev) => ({ ...prev, titulo: e.target.value }))}
            placeholder="Titulo del documento"
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
            required
          />
          <textarea
            value={docForm.descripcion}
            onChange={(e) => setDocForm((prev) => ({ ...prev, descripcion: e.target.value }))}
            placeholder="Descripcion"
            rows={2}
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          />
          <input
            type="file"
            onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
            className="w-full"
            required
          />
          <button
            disabled={busy || !selectedSectionKey}
            className="rounded-lg bg-green-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            Subir documento
          </button>
        </form>
      ) : (
        <form className="space-y-3" onSubmit={onCreateLink}>
          <input
            value={linkForm.title}
            onChange={(e) => setLinkForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Titulo"
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
            required
          />
          <textarea
            value={linkForm.description}
            onChange={(e) => setLinkForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Descripcion"
            rows={2}
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          />
          <input
            value={linkForm.url}
            onChange={(e) => setLinkForm((prev) => ({ ...prev, url: e.target.value }))}
            placeholder="https://..."
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
            required
          />
          <input
            value={linkForm.icon}
            onChange={(e) => setLinkForm((prev) => ({ ...prev, icon: e.target.value }))}
            placeholder="🔗"
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          />
          <button
            disabled={busy || !selectedSectionKey}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            Agregar enlace
          </button>
        </form>
      )}

      {message && <p className="text-sm font-semibold text-stone-700">{message}</p>}
    </section>
  );
}
