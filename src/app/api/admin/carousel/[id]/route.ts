import { NextResponse } from "next/server";
import { 
  updateCarouselAdmin, 
  deleteCarouselAdmin, 
  getCarouselAdmin 
} from "@/server/db/admin-repository";
import { getOrCreateFolder, uploadFileToDrive } from "@/lib/google-drive-service";
import { 
  badRequest, 
  requirePermission, 
  serverError, 
  parseId 
} from "@/app/api/admin/_shared/auth";

const CAROUSEL_FOLDER_NAME = "IAM Paraná - Imágenes";

// GET: Para obtener los datos de un solo item (útil para cargar el formulario de edición)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("content.read");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;
  const carouselId = parseId(id);
  if (!carouselId) return badRequest("ID inválido");

  try {
    const item = await getCarouselAdmin(carouselId);
    if (!item) return badRequest("Item no encontrado");
    return NextResponse.json(item);
  } catch (error) {
    return serverError();
  }
}

async function handleUpdate(req: Request, params: Promise<{ id: string }>) {
  const auth = await requirePermission("content.write");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;
  const carouselId = parseId(id);
  if (!carouselId) return badRequest("ID inválido");

  try {
    const current = await getCarouselAdmin(carouselId);
    if (!current) return badRequest("Item no encontrado");

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      const alt = String(formData.get("alt") ?? current.alt ?? "").trim();
      const linkRaw = String(formData.get("link") ?? current.link ?? "").trim();
      const buttonTextRaw = String(formData.get("buttonText") ?? current.buttonText ?? "").trim();
      const orderRaw = String(formData.get("order") ?? current.order ?? "0").trim();
      const maybeFile = formData.get("file");

      let imageDesktop = String(current.imageDesktop ?? "");
      let imageMobile = String(current.imageMobile ?? current.imageDesktop ?? "");

      if (maybeFile instanceof File && maybeFile.size > 0) {
        const folderId = await getOrCreateFolder(CAROUSEL_FOLDER_NAME);
        const uploadResult = await uploadFileToDrive(
          maybeFile,
          maybeFile.name,
          folderId,
          maybeFile.type || "image/jpeg"
        );

        if (!uploadResult.success || !uploadResult.fileId) {
          return serverError(uploadResult.error || "No se pudo subir la imagen a Drive");
        }

        imageDesktop = uploadResult.fileId;
        imageMobile = uploadResult.fileId;
      }

      await updateCarouselAdmin(carouselId, {
        slug: current.slug ? String(current.slug) : null,
        imageDesktop,
        imageMobile,
        alt,
        link: linkRaw !== "" ? linkRaw : null,
        buttonText: buttonTextRaw !== "" ? buttonTextRaw : null,
        order: Number.isNaN(Number(orderRaw)) ? 0 : Number(orderRaw),
      });

      return NextResponse.json({ success: true });
    }

    const body = await req.json();
    await updateCarouselAdmin(carouselId, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError("Error al actualizar");
  }
}

// PUT: Para actualizar
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleUpdate(req, params);
}

// PATCH: Para actualizar desde formularios multipart
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleUpdate(req, params);
}

// DELETE: Para eliminar
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("content.delete");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;
  const carouselId = parseId(id);
  if (!carouselId) return badRequest("ID inválido");

  try {
    await deleteCarouselAdmin(carouselId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError("Error al eliminar");
  }
}