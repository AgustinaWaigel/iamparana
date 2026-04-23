import Link from "next/link";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { ResourcePage, ResourceSection } from "../types";
import { toSlug } from "../utils";
import { TemplatePicker } from "./template-picker";

type EditPageForm = {
  title: string;
  description: string;
  textureUrl: string;
  template: string;
};

type SectionForm = {
  title: string;
  slug: string;
};

type ManagePagePanelProps = {
  busy: boolean;
  selectedPage: ResourcePage | null;
  selectedSection: ResourceSection | null;
  selectedSectionId: number | null;
  sections: ResourceSection[];
  editPageForm: EditPageForm;
  sectionForm: SectionForm;
  editSectionTitle: string;
  setSelectedSectionId: (id: number) => void;
  setEditPageForm: React.Dispatch<React.SetStateAction<EditPageForm>>;
  setSectionForm: React.Dispatch<React.SetStateAction<SectionForm>>;
  setEditSectionTitle: (value: string) => void;
  onUpdatePage: (e: React.FormEvent) => void;
  onRemovePage: () => void;
  onCreateSection: (e: React.FormEvent) => void;
  onMoveSection: (id: number, direction: "up" | "down") => void;
  onRemoveSection: (id: number) => void;
  onSaveSectionTitle: () => void;
};

export function ManagePagePanel({
  busy,
  selectedPage,
  selectedSection,
  selectedSectionId,
  sections,
  editPageForm,
  sectionForm,
  editSectionTitle,
  setSelectedSectionId,
  setEditPageForm,
  setSectionForm,
  setEditSectionTitle,
  onUpdatePage,
  onRemovePage,
  onCreateSection,
  onMoveSection,
  onRemoveSection,
  onSaveSectionTitle,
}: ManagePagePanelProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
      <h2 className="font-black text-brand-brown">2) Editar pagina y secciones</h2>

      {!selectedPage && <p className="text-sm text-stone-500">Selecciona una pagina.</p>}

      {selectedPage && (
        <>
          <Link
            href={`/formacion/recursos/${selectedPage.slug}`}
            target="_blank"
            className="inline-flex text-sm font-bold text-brand-brown underline"
          >
            Ver pagina publica /formacion/recursos/{selectedPage.slug}
          </Link>

          <form className="space-y-2" onSubmit={onUpdatePage}>
            <input
              value={editPageForm.title}
              onChange={(e) => setEditPageForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
              required
            />
            <TemplatePicker
              value={editPageForm.template}
              onChange={(next) => setEditPageForm((prev) => ({ ...prev, template: next }))}
            />
            <input
              value={editPageForm.textureUrl}
              onChange={(e) => setEditPageForm((prev) => ({ ...prev, textureUrl: e.target.value }))}
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
            />
            <textarea
              value={editPageForm.description}
              onChange={(e) => setEditPageForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
            />
            <div className="flex gap-2">
              <button
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                <Pencil size={14} /> Guardar
              </button>
              <button
                type="button"
                onClick={onRemovePage}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </form>

          <form className="space-y-2 border-t border-stone-200 pt-3" onSubmit={onCreateSection}>
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
            <button
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg bg-brand-brown px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              <Plus size={14} /> Agregar seccion
            </button>
          </form>

          <div className="space-y-2 border-t border-stone-200 pt-3">
            {sections.map((section) => (
              <div
                key={section.id}
                className={`rounded-lg border p-2 ${
                  selectedSectionId === section.id ? "border-brand-brown" : "border-stone-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedSectionId(section.id)}
                  className="w-full text-left text-sm font-semibold text-stone-800"
                >
                  {section.title}
                </button>
                <div className="mt-2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => onMoveSection(section.id, "up")}
                    className="rounded bg-stone-100 p-1"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveSection(section.id, "down")}
                    className="rounded bg-stone-100 p-1"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveSection(section.id)}
                    className="rounded bg-red-100 p-1 text-red-700"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {selectedSection && (
            <div className="space-y-2 border-t border-stone-200 pt-3">
              <input
                value={editSectionTitle}
                onChange={(e) => setEditSectionTitle(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
              <button
                type="button"
                onClick={onSaveSectionTitle}
                disabled={busy}
                className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Guardar titulo seccion
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
