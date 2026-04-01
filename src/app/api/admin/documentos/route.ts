import { NextResponse } from "next/server";
import { requirePermission, badRequest, serverError } from "@/app/api/admin/_shared/auth";
import {
  saveDocument,
  getDocumentsBySection,
  getDocument,
  updateDocument,
  deleteDocument,
  getGoogleDriveConfig,
  updateGoogleDriveConfig,
} from "@/app/db/admin-repository";
import { uploadFileToDrive, getOrCreateFolder, deleteFileFromDrive } from "@/lib/google-drive-service";

// GET /api/admin/documentos?section=noticias
export async function GET(req: Request) {
  const auth = await requirePermission("content.read");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const url = new URL(req.url);
    const section = url.searchParams.get("section");

    if (!section) {
      return badRequest("Section parameter required");
    }

    const documents = await getDocumentsBySection(section);
    return NextResponse.json(documents);
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

// POST /api/admin/documentos - Upload file to Google Drive or save metadata
export async function POST(req: Request) {
  const auth = await requirePermission("content.write");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    // Determinar si es FormData o JSON
    const contentType = req.headers.get("content-type") || "";
    const isFormData = contentType.includes("multipart/form-data");

    if (isFormData) {
      // Flujo original: Subir archivo desde FormData
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const section = formData.get("section") as string;
      const title = formData.get("title") as string;
      const description = formData.get("description") as string | null;

      // Validaciones
      if (!file) {
        return badRequest("File is required");
      }

      if (!section) {
        return badRequest("Section is required");
      }

      if (!title) {
        return badRequest("Title is required");
      }

      if (file.size > 100 * 1024 * 1024) {
        return badRequest("File size exceeds 100MB limit");
      }

      // Obtener o crear carpeta en Google Drive para esta sección
      const driveConfig = await getGoogleDriveConfig(section);
      let folderId: string | null = null;
      
      if (driveConfig && driveConfig.folder_id) {
        folderId = String(driveConfig.folder_id).trim();
      }

      if (!folderId) {
        // Crear carpeta raíz si no existe
        const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
        if (!rootFolderId) {
          return serverError("Google Drive root folder not configured");
        }

        folderId = await getOrCreateFolder(section, rootFolderId);

        // Guardar la configuración
        await updateGoogleDriveConfig(section, folderId, section);
      }

      // Subir archivo a Google Drive
      const uploadResult = await uploadFileToDrive(file, file.name, folderId, file.type);

      if (!uploadResult.success) {
        return serverError(uploadResult.error || "Failed to upload file");
      }

      // Guardar referencia en BD
      const userId = auth.user?.id;
      if (!userId) {
        return serverError("User ID not found");
      }

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

      return NextResponse.json(
        {
          success: true,
          fileId: uploadResult.fileId,
          fileName: uploadResult.fileName,
          url: uploadResult.url,
        },
        { status: 201 }
      );
    } else {
      // Nuevo flujo: Solo guardar metadata (archivo ya fue subido por /api/admin/upload)
      const body = await req.json();
      const { titulo, descripcion, tipo, url, fileId, fecha } = body;

      // Validaciones
      if (!titulo) {
        return badRequest("Título is required");
      }

      if (!url || !fileId) {
        return badRequest("URL and fileId are required");
      }

      // Obtener userId
      const userId = auth.user?.id;
      if (!userId) {
        return serverError("User ID not found");
      }

      // Guardar documento en BD
      // Usar "formacion" como sección por defecto (puedes parametrizarlo si es necesario)
      await saveDocument({
        section: tipo || "formacion",
        title: titulo,
        description: descripcion || undefined,
        googleDriveId: fileId,
        googleDriveUrl: url,
        fileSize: 0, // No tenemos este dato desde el cliente
        fileType: "application/pdf", // Por defecto, puede ser mejorado
        uploadedByUserId: Number(userId),
      });

      return NextResponse.json(
        {
          success: true,
          message: "Documento guardado correctamente",
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error(error);
    return serverError(error instanceof Error ? error.message : "Failed to upload document");
  }
}

// PUT /api/admin/documentos/[id] - Update document metadata
export async function PUT(req: Request) {
  const auth = await requirePermission("content.write");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const { id, title, description, googleDriveUrl } = body;

    if (!id) {
      return badRequest("Document ID is required");
    }

    const document = await getDocument(id);
    if (!document) {
      return badRequest("Document not found");
    }

    await updateDocument(id, {
      title: title || String(document.title || '').trim(),
      description: description || String(document.description || '').trim(),
      googleDriveUrl: googleDriveUrl || String(document.google_drive_url || '').trim(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

// DELETE /api/admin/documentos/[id]
export async function DELETE(req: Request) {
  const auth = await requirePermission("content.write");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return badRequest("Document ID is required");
    }

    const document = await getDocument(parseInt(id));
    if (!document) {
      return badRequest("Document not found");
    }

    // Eliminar de Google Drive
    const googleDriveId = String(document.google_drive_id || '').trim();
    if (googleDriveId) {
      await deleteFileFromDrive(googleDriveId);
    }

    // Eliminar de BD
    await deleteDocument(parseInt(id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return serverError();
  }
}
