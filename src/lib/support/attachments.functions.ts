import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "ticket-attachments";
const MAX_SIZE = 25 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/png", "image/jpeg", "image/webp", "image/gif",
  "application/pdf", "text/plain", "text/csv",
  "application/zip", "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const TICKET_ID = z.string().min(1).max(64).regex(/^[A-Za-z0-9._-]+$/, "Invalid ticket id");
const SAFE_NAME = z.string().min(1).max(200);

function sanitizeName(name: string) {
  return name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 200);
}


async function assertSupportAccess(supabase: any, userId: string) {
  const [{ data: isSupport }, { data: isAdmin }] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "support" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
  ]);
  if (!isSupport && !isAdmin) {
    throw new Response("Forbidden: support role required", { status: 403 });
  }
}

// -------- Create a signed upload URL (client PUTs directly to storage) --------
export const createAttachmentUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({
      ticketId: TICKET_ID,
      fileName: SAFE_NAME,
      mimeType: z.string().min(1).max(200),
      sizeBytes: z.number().int().positive().max(MAX_SIZE),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertSupportAccess(supabase, userId);

    if (!ALLOWED_MIME.has(data.mimeType)) {
      throw new Response(`Unsupported mime type: ${data.mimeType}`, { status: 400 });
    }

    const safe = sanitizeName(data.fileName);
    const path = `${data.ticketId}/${userId}/${crypto.randomUUID()}-${safe}`;

    const { data: signed, error } = await supabase
      .storage.from(BUCKET)
      .createSignedUploadUrl(path);
    if (error || !signed) {
      throw new Response(`Failed to create upload URL: ${error?.message ?? "unknown"}`, { status: 500 });
    }

    return {
      path: signed.path,
      token: signed.token,
      signedUrl: signed.signedUrl,
      expiresInSeconds: 60 * 5,
    };
  });

// -------- Confirm upload by inserting the metadata row (RLS enforced) --------
export const confirmAttachmentUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({
      ticketId: TICKET_ID,
      storagePath: z.string().min(1).max(500),
      fileName: SAFE_NAME,
      mimeType: z.string().min(1).max(200),
      sizeBytes: z.number().int().positive().max(MAX_SIZE),
      uploaderName: z.string().max(120).optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertSupportAccess(supabase, userId);

    if (!ALLOWED_MIME.has(data.mimeType)) {
      throw new Response(`Unsupported mime type: ${data.mimeType}`, { status: 400 });
    }
    // Path must belong to this ticket & uploader — prevents cross-ticket claim.
    const expectedPrefix = `${data.ticketId}/${userId}/`;
    if (!data.storagePath.startsWith(expectedPrefix)) {
      throw new Response("Path does not belong to this ticket/uploader", { status: 400 });
    }

    const { data: row, error } = await supabase
      .from("ticket_attachments")
      .insert({
        ticket_id: data.ticketId,
        storage_path: data.storagePath,
        file_name: sanitizeName(data.fileName),
        mime_type: data.mimeType,
        size_bytes: data.sizeBytes,
        uploader_id: userId,
        uploader_name: data.uploaderName ?? null,
      })
      .select("id, ticket_id, storage_path, file_name, mime_type, size_bytes, uploader_id, uploader_name, created_at")
      .single();

    if (error || !row) {
      // Cleanup the orphaned object so it never becomes unreachable.
      await supabase.storage.from(BUCKET).remove([data.storagePath]).catch(() => {});
      throw new Response(`Failed to save attachment: ${error?.message ?? "unknown"}`, { status: 500 });
    }
    return row;
  });

// -------- List attachments for a ticket with signed download URLs --------
export const listTicketAttachments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ ticketId: TICKET_ID }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: rows, error } = await supabase
      .from("ticket_attachments")
      .select("id, ticket_id, storage_path, file_name, mime_type, size_bytes, uploader_id, uploader_name, created_at")
      .eq("ticket_id", data.ticketId)
      .order("created_at", { ascending: false });

    if (error) throw new Response(`Failed to list attachments: ${error.message}`, { status: 500 });

    const paths = (rows ?? []).map((r) => r.storage_path);
    let signed: Record<string, string> = {};
    if (paths.length > 0) {
      const { data: signedList, error: signErr } = await supabase
        .storage.from(BUCKET)
        .createSignedUrls(paths, 60);
      if (signErr) throw new Response(`Failed to sign URLs: ${signErr.message}`, { status: 500 });
      signed = Object.fromEntries(
        (signedList ?? [])
          .filter((s) => s.path && s.signedUrl)
          .map((s) => [s.path as string, s.signedUrl as string]),
      );
    }

    return (rows ?? []).map((r) => ({ ...r, downloadUrl: signed[r.storage_path] ?? null }));
  });

// -------- Get a fresh signed download URL for one attachment --------
export const getAttachmentDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ id: z.string().uuid(), expiresIn: z.number().int().min(10).max(3600).default(60) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // RLS on ticket_attachments enforces that the caller may see this row.
    const { data: row, error } = await supabase
      .from("ticket_attachments")
      .select("storage_path, file_name")
      .eq("id", data.id)
      .maybeSingle();

    if (error) throw new Response(`Lookup failed: ${error.message}`, { status: 500 });
    if (!row) throw new Response("Not found", { status: 404 });

    const { data: signed, error: signErr } = await supabase
      .storage.from(BUCKET)
      .createSignedUrl(row.storage_path, data.expiresIn, { download: row.file_name });

    if (signErr || !signed) {
      throw new Response(`Failed to sign URL: ${signErr?.message ?? "unknown"}`, { status: 500 });
    }
    return { downloadUrl: signed.signedUrl, expiresInSeconds: data.expiresIn, fileName: row.file_name };
  });

// -------- Delete an attachment (RLS enforced) --------
export const deleteTicketAttachment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: row, error: fetchErr } = await supabase
      .from("ticket_attachments")
      .select("id, storage_path")
      .eq("id", data.id)
      .maybeSingle();
    if (fetchErr) throw new Response(`Lookup failed: ${fetchErr.message}`, { status: 500 });
    if (!row) throw new Response("Not found", { status: 404 });

    const { error: delErr } = await supabase
      .from("ticket_attachments")
      .delete()
      .eq("id", row.id);
    if (delErr) throw new Response(`Delete failed: ${delErr.message}`, { status: 500 });

    await supabase.storage.from(BUCKET).remove([row.storage_path]).catch(() => {});
    return { ok: true };
  });
