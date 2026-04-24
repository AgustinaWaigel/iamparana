import { NextResponse } from "next/server";
// Importamos los nombres correctos que tenés en el repositorio
import { createCarouselAdmin, listCarouselItems } from "@/server/db/admin-repository";
import { requirePermission, badRequest, serverError } from "@/app/api/admin/_shared/auth";

export const dynamic = "force-dynamic";

// GET para listar los items en el panel de admin
export async function GET() {
  const auth = await requirePermission("content.read");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const items = await listCarouselItems();
    return NextResponse.json(items);
  } catch (error) {
    return serverError();
  }
}

// POST para crear uno nuevo con subida de archivo
export async function POST(req: Request) {
  const auth = await requirePermission("content.write");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const formData = await req.formData();
    
    const file = formData.get("file") as File | null;
    const alt = formData.get("alt") as string;
    const link = formData.get("link") as string;
    const buttonText = formData.get("buttonText") as string;
    const orderStr = formData.get("order") as string;
    const order = orderStr ? parseInt(orderStr) : 0;

    if (!alt || alt.trim() === "") {
      return badRequest("El campo 'alt' es obligatorio");
    }

    if (!file || file.size === 0) {
      return badRequest("Debes seleccionar una imagen para subir");
    }

    // --- PROCESAMIENTO PARA DRIVE ---
    const buffer = Buffer.from(await file.arrayBuffer());
    
    let imageId = "";
    try {
       // Aquí llamarías a tu función de Drive:
       // const driveResponse = await uploadToDrive(buffer, file.name, file.type);
       // imageId = driveResponse.id;
       
       // Simulacro temporal para que puedas probar la DB:
       imageId = "1_temp_id_simulando_drive"; 
       console.log("Simulando subida de archivo:", file.name);
    } catch (driveError) {
       console.error("Error Drive:", driveError);
       return serverError("No se pudo subir la imagen a Drive");
    }

    await createCarouselAdmin({
      imageDesktop: imageId,
      imageMobile: imageId,
      alt: alt.trim(),
      link: link && link.trim() !== "" ? link.trim() : null,
      buttonText: buttonText && buttonText.trim() !== "" ? buttonText.trim() : "Ver más",
      order: isNaN(order) ? 0 : order
    });

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (error) {
    console.error("DETALLE DEL ERROR:", error);
    return serverError("Error interno al procesar el carrusel");
  }
}