import { NextResponse } from "next/server";
// Importamos los nombres correctos que tenés en el repositorio
import { createCarouselAdmin, listCarouselItems } from "@/server/db/admin-repository";
import { requirePermission, badRequest, serverError } from "@/app/api/admin/_shared/auth";
import { getOrCreateFolder, uploadFileToDrive } from "@/lib/google-drive-service";

export const dynamic = "force-dynamic";
const CAROUSEL_FOLDER_NAME = "IAM Paraná - Imágenes";

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

     let imageId = "";
    try {
       const folderId = await getOrCreateFolder(CAROUSEL_FOLDER_NAME);
       const uploadResult = await uploadFileToDrive(file, file.name, folderId, file.type || "image/jpeg");

       if (!uploadResult.success || !uploadResult.fileId) {
        return serverError(uploadResult.error || "No se pudo subir la imagen a Drive");
       }

       imageId = uploadResult.fileId;
    } catch (driveError) {
       console.error("Error Drive:", driveError);
       return serverError("No se pudo subir la imagen a Drive");
    }

    await createCarouselAdmin({
      imageDesktop: imageId,
      imageMobile: imageId,
      alt: alt.trim(),
      link: link && link.trim() !== "" ? link.trim() : null,
      buttonText: buttonText && buttonText.trim() !== "" ? buttonText.trim() : null,
      order: isNaN(order) ? 0 : order
    });

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (error) {
    console.error("DETALLE DEL ERROR:", error);
    return serverError("Error interno al procesar el carrusel");
  }
}