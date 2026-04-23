import { TEMPLATE_OPTIONS, TEMPLATE_PREVIEW } from "../types";

type TemplatePickerProps = {
  value: string;
  onChange: (next: string) => void;
};

export function TemplatePicker({ value, onChange }: TemplatePickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-black uppercase tracking-wider text-stone-500">Template visual</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
              <div className="h-16 rounded-lg px-2 py-2" style={{ backgroundImage: preview.banner }}>
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
