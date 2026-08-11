import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requirePermission, badRequest, serverError } from "@/app/api/admin/_shared/auth";
import {
  saveDocument,
  getDocumentsBySection,
  getDocument,
  updateDocument,
  deleteDocument,
  getGoogleDriveConfig,
  updateGoogleDriveConfig,
} from "@/server/db/admin-repository";
import { uploadFileToDrive, getOrCreateFolder, deleteFileFromDrive } from "@/lib/google-drive-service";

// Forzamos que la API no cachee los resultados y siempre consulte a la DB
export const dynamic = 'force-dynamic';

function revalidateContentSection(sectionValue: unknown) {
  const section = String(sectionValue || '').trim().toLowerCase();
  if (!section) return;

  const routesBySection: Record<string, string[]> = {
    formacion: ['/formacion', '/formacion/recursos'],
    animacion: ['/animacion', '/animacion/recursos', '/animacion/juegos', '/animacion/canciones'],
    juegos: ['/animacion', '/animacion/juegos'],
    canciones: ['/animacion', '/animacion/canciones'],
    recursos: ['/animacion', '/animacion/recursos'],
    espiritualidad: ['/espiritualidad'],
    oraciones: ['/espiritualidad'],
    guiones: ['/espiritualidad'],
    presupuestos: ['/logistica'],
    rendiciones: ['/logistica'],
    inventario: ['/logistica'],
  };

  const routes = routesBySection[section] || [`/${section}`];
  routes.forEach((route) => revalidatePath(route));
}

// GET /api/admin/documentos
export async function GET(req: NextRequest) {
  const auth = await requirePermission("content.read");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const section = searchParams.get("section");

    if (!section) {
      return badRequest("Section parameter required");
    }

    const documents = await getDocumentsBySection(section);
    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error en GET documentos:", error);
    return serverError();
  }
}

// POST /api/admin/documentos
export async function POST(req: NextRequest) {
  const auth = await requirePermission("content.write");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    let touchedSection: string | null = null;
    const contentType = req.headers.get("content-type") || "";
    const isFormData = contentType.includes("multipart/form-data");

    if (isFormData) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const section = formData.get("section") as string;
      const title = formData.get("title") as string;
      const description = formData.get("description") as string | null;
      const thumbnailUrl = formData.get("thumbnailUrl") as string | null;

      if (!file || !section || !title) {
        return badRequest("Missing required fields (file, section, or title)");
      }
      touchedSection = section;

      if (file.size > 100 * 1024 * 1024) {
        return badRequest("File size exceeds 100MB limit");
      }

      const driveConfig = await getGoogleDriveConfig(section);
      let folderId = driveConfig?.folder_id ? String(driveConfig.folder_id).trim() : null;

      if (!folderId) {
        const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
        if (!rootFolderId) return serverError("Root folder ID not configured");
        folderId = await getOrCreateFolder(section, rootFolderId);
        await updateGoogleDriveConfig(section, folderId, section);
      }

      const uploadResult = await uploadFileToDrive(file, file.name, folderId, file.type);
      if (!uploadResult.success) return serverError(uploadResult.error || "Upload failed");

      const userId = auth.user?.id;
      await saveDocument({
        section,
        title,
        description: description || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        googleDriveId: uploadResult.fileId!,
        googleDriveUrl: uploadResult.url,
        fileSize: uploadResult.size,
        fileType: uploadResult.mimeType,
        uploadedByUserId: Number(userId),
      });

    } else {
      const body = await req.json();
      const { titulo, descripcion, tipo, url, fileId, thumbnailUrl } = body;

      if (!titulo || !url || !fileId) return badRequest("Missing metadata");

      touchedSection = tipo || 'formacion';

      await saveDocument({
        section: tipo || "formacion",
        title: titulo,
        description: descripcion || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        googleDriveId: fileId,
        googleDriveUrl: url,
        fileSize: 0,
        fileType: "application/pdf",
        uploadedByUserId: Number(auth.user?.id),
      });
    }

    // Limpieza de cache para reflejar cambios en la sección correspondiente.
    revalidateContentSection(touchedSection);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error en POST documentos:", error);
    return serverError("Failed to process document");
  }
}

// PUT /api/admin/documentos
// Reemplaza tu función PUT actual por esta versión más limpia:
export async function PUT(req: NextRequest) {
  const auth = await requirePermission("content.write");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const { id, title, description, googleDriveUrl, thumbnailUrl } = body;

    if (!id) return badRequest("Document ID is required");

    const document = await getDocument(id);
    if (!document) return badRequest("Document not found");

    const finalThumbnail = thumbnailUrl === undefined
      ? (typeof document.thumbnail_url === 'string' ? document.thumbnail_url : null)
      : String(thumbnailUrl).trim() || null;

    await updateDocument(id, {
      title: title || String(document.title),
      description: description ?? (typeof document.description === 'string' ? document.description : undefined),
      googleDriveUrl: googleDriveUrl || String(document.google_drive_url),
      thumbnailUrl: finalThumbnail,
    });

    revalidateContentSection(document.section);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en PUT documentos:", error);
    return serverError();
  }
}

// DELETE /api/admin/documentos
export async function DELETE(req: NextRequest) {
  const auth = await requirePermission("content.write");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return badRequest("Document ID is required");

    const document = await getDocument(parseInt(id));
    if (!document) return badRequest("Document not found");

    const googleDriveId = String(document.google_drive_id || '').trim();
    if (googleDriveId) {
      await deleteFileFromDrive(googleDriveId).catch(console.error);
    }

    await deleteDocument(parseInt(id));

    revalidateContentSection((document as { section?: unknown }).section);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE documentos:", error);
    return serverError();
  }
}
