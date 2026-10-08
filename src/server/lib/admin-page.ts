import "server-only";

import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/lib/api-utils";

/**
 * Para páginas de /admin que leen datos personales: el layout ya redirige, pero la
 * página se arma en paralelo, así que cada una confirma por su cuenta que quien pide es admin.
 */
export async function requireAdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "admin") redirect("/");
  return user;
}
