export type ResourcePage = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  texture_url: string | null;
  template: string;
};

export type ResourceSection = {
  id: number;
  page_id: number;
  slug: string;
  title: string;
  section_key: string;
  position: number;
};

export const TEMPLATE_OPTIONS = [
  { value: "gold", label: "Dorado (Formacion)" },
  { value: "ocean", label: "Azul (Comunicacion)" },
  { value: "earth", label: "Tierra (Institucional)" },
] as const;

export type TemplateValue = (typeof TEMPLATE_OPTIONS)[number]["value"];

export const TEMPLATE_PREVIEW: Record<
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
