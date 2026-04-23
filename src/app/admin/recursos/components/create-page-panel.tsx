import { Plus } from "lucide-react";
import { ResourcePage } from "../types";
import { toSlug } from "../utils";
import { TemplatePicker } from "./template-picker";

type CreatePageForm = {
  title: string;
  slug: string;
  description: string;
  textureUrl: string;
  template: string;
};

type CreatePagePanelProps = {
  busy: boolean;
  pages: ResourcePage[];
  selectedPageId: number | null;
  createPageForm: CreatePageForm;
  setSelectedPageId: (id: number) => void;
  setCreatePageForm: React.Dispatch<React.SetStateAction<CreatePageForm>>;
  onCreatePage: (e: React.FormEvent) => void;
};

export function CreatePagePanel({
  busy,
  pages,
  selectedPageId,
  createPageForm,
  setSelectedPageId,
  setCreatePageForm,
  onCreatePage,
}: CreatePagePanelProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
      <h2 className="font-black text-brand-brown">1) Crear pagina</h2>
      <form className="space-y-3" onSubmit={onCreatePage}>
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
        <TemplatePicker
          value={createPageForm.template}
          onChange={(next) => setCreatePageForm((prev) => ({ ...prev, template: next }))}
        />
        <input
          value={createPageForm.textureUrl}
          onChange={(e) => setCreatePageForm((prev) => ({ ...prev, textureUrl: e.target.value }))}
          placeholder="/assets/textures/formacion.webp"
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
        <textarea
          value={createPageForm.description}
          onChange={(e) => setCreatePageForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Descripcion"
          rows={3}
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
        <button
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-brown px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          <Plus size={16} /> Crear pagina
        </button>
      </form>

      <div className="pt-3 border-t border-stone-200 space-y-2">
        <h3 className="text-sm font-black uppercase text-stone-500">Paginas</h3>
        {pages.map((page) => (
          <button
            key={page.id}
            type="button"
            onClick={() => setSelectedPageId(page.id)}
            className={`w-full text-left rounded-lg px-3 py-2 text-sm font-semibold ${
              selectedPageId === page.id ? "bg-brand-brown text-white" : "bg-stone-50 text-stone-700"
            }`}
          >
            {page.title} ({page.slug})
          </button>
        ))}
      </div>
    </section>
  );
}
