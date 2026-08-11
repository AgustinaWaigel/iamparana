import { redirect } from "next/navigation";

/** El antiguo gestor JSON fue retirado: la administración se realiza desde cada área. */
export default function AdminPage() {
  redirect("/admin/usuarios");
}
