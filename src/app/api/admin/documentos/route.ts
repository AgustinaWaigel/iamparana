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
    const contentType = req.headers.get("content-type") || "";
    const isFormData = contentType.includes("multipart/form-data");

    if (isFormData) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const section = formData.get("section") as string;
      const title = formData.get("title") as string;
      const description = formData.get("description") as string | null;

      if (!file || !section || !title) {
        return badRequest("Missing required fields (file, section, or title)");
      }

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
        googleDriveId: uploadResult.fileId!,
        googleDriveUrl: uploadResult.url,
        fileSize: uploadResult.size,
        fileType: uploadResult.mimeType,
        uploadedByUserId: Number(userId),
      });

    } else {
      const body = await req.json();
      const { titulo, descripcion, tipo, url, fileId } = body;

      if (!titulo || !url || !fileId) return badRequest("Missing metadata");

      await saveDocument({
        section: tipo || "formacion",
        title: titulo,
        description: descripcion || undefined,
        googleDriveId: fileId,
        googleDriveUrl: url,
        fileSize: 0,
        fileType: "application/pdf",
        uploadedByUserId: Number(auth.user?.id),
      });
    }

    // LIMPIEZA DE CACHÉ: Esto hace que los cambios se vean en Netlify
    revalidatePath('/formacion');
    revalidatePath('/formacion/recursos');

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error en POST documentos:", error);
    return serverError("Failed to process document");
  }
}

// PUT /api/admin/documentos
export async function PUT(req: NextRequest) {
  const auth = await requirePermission("content.write");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const { id, title, description, googleDriveUrl } = body;

    if (!id) return badRequest("Document ID is required");

    const document = await getDocument(id);
    if (!document) return badRequest("Document not found");

    await updateDocument(id, {
      title: title || String(document.title || '').trim(),
      description: description || String(document.description || '').trim(),
      googleDriveUrl: googleDriveUrl || String(document.google_drive_url || '').trim(),
    });

    // Revalidamos para que el cambio de nombre se vea
    revalidatePath('/formacion');
    
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

    // Revalidamos para que desaparezca de la lista
    revalidatePath('/formacion');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE documentos:", error);
    return serverError();
  }
}