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
    
    const fileDesktop = formData.get("fileDesktop") as File | null;
    const fileMobile = formData.get("fileMobile") as File | null;
    const legacyFile = formData.get("file") as File | null;
    const alt = formData.get("alt") as string;
    const title = (formData.get("title") as string) || null;
    const description = (formData.get("description") as string) || null;
    const tag = (formData.get("tag") as string) || null;
    const link = formData.get("link") as string;
    const buttonText = formData.get("buttonText") as string;
    const orderStr = formData.get("order") as string;
    const order = orderStr ? parseInt(orderStr) : 0;

    if (!alt || alt.trim() === "") {
      return badRequest("El campo 'alt' es obligatorio");
    }

    const desktopToUpload = fileDesktop && fileDesktop.size > 0 ? fileDesktop : legacyFile;
    const mobileToUpload = fileMobile && fileMobile.size > 0 ? fileMobile : legacyFile;

    if (!desktopToUpload || desktopToUpload.size === 0) {
      return badRequest("Debes seleccionar una imagen Desktop para subir");
    }

    if (!mobileToUpload || mobileToUpload.size === 0) {
      return badRequest("Debes seleccionar una imagen Mobile para subir");
    }

     let imageDesktopId = "";
     let imageMobileId = "";
    try {
       const folderId = await getOrCreateFolder(CAROUSEL_FOLDER_NAME);
       const desktopUploadResult = await uploadFileToDrive(desktopToUpload, desktopToUpload.name, folderId, desktopToUpload.type || "image/jpeg");
       const mobileUploadResult = await uploadFileToDrive(mobileToUpload, mobileToUpload.name, folderId, mobileToUpload.type || "image/jpeg");

       if (!desktopUploadResult.success || !desktopUploadResult.fileId) {
        return serverError(desktopUploadResult.error || "No se pudo subir la imagen desktop a Drive");
       }

       if (!mobileUploadResult.success || !mobileUploadResult.fileId) {
        return serverError(mobileUploadResult.error || "No se pudo subir la imagen mobile a Drive");
       }

       imageDesktopId = desktopUploadResult.fileId;
       imageMobileId = mobileUploadResult.fileId;
    } catch (driveError) {
       console.error("Error Drive:", driveError);
       return serverError("No se pudo subir la imagen a Drive");
    }

    await createCarouselAdmin({
      imageDesktop: imageDesktopId,
      imageMobile: imageMobileId,
      alt: alt.trim(),
      title: title?.trim() || null,
      description: description?.trim() || null,
      tag: tag?.trim() || null,
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