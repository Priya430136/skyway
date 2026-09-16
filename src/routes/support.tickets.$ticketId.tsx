import { createFileRoute, Link, notFound, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, CheckCircle2, XCircle, ArrowUpRight, RotateCcw, UserCog, Send,
  Sparkles, MessageSquare, Clock, Tag, Plane, Ticket as TicketIcon, Mail,
  Paperclip, Upload, FileText, Image as ImageIcon, FileArchive, Download, Trash2, File as FileIcon,
  Loader2, AlertTriangle,
} from "lucide-react";
import { SupportTopbar } from "@/components/support/SupportTopbar";
import { tickets, type TicketStatus } from "@/lib/support/mock";
import {
  createAttachmentUploadUrl,
  confirmAttachmentUpload,
  listTicketAttachments,
  getAttachmentDownloadUrl,
  deleteTicketAttachment,
} from "@/lib/support/attachments.functions";
import { useAuth } from "@/lib/auth";

type Attachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
  storagePath: string;
};

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;


export const Route = createFileRoute("/support/tickets/$ticketId")({
  loader: ({ params }) => {
    const ticket = tickets.find((t) => t.id === params.ticketId);
    if (!ticket) throw notFound();
    return { ticket };
  },
  component: TicketDetailPage,
  notFoundComponent: TicketNotFound,
});

const AGENTS = ["Amelia Carter", "Rohan Verma", "Sofia Ricci", "Kenji Tanaka", "Lena Novak"];
const STATUSES: TicketStatus[] = ["open", "pending", "resolved", "closed", "escalated"];

const STATUS_TONE: Record<TicketStatus, string> = {
  open: "bg-sky-500/15 text-sky-500",
  pending: "bg-amber-500/15 text-amber-500",
  resolved: "bg-emerald-500/15 text-emerald-500",
  closed: "bg-muted text-muted-foreground",
  escalated: "bg-red-500/15 text-red-500",
};

type AuditEntry = {
  id: string;
  at: string;
  actor: string;
  kind: "created" | "status" | "assign" | "reply" | "note" | "ai" | "escalate" | "reopen" | "attachment";
  message: string;
  attachments?: Attachment[];
};

function seedAudit(ticketId: string, createdAt: string, agent: string): AuditEntry[] {
  return [
    { id: `${ticketId}-a1`, at: createdAt, actor: "System", kind: "created", message: "Ticket created from passenger channel." },
    { id: `${ticketId}-a2`, at: new Date(new Date(createdAt).getTime() + 60_000).toISOString(), actor: "AI Assistant", kind: "ai", message: "Auto-categorized and prioritized based on message content." },
    { id: `${ticketId}-a3`, at: new Date(new Date(createdAt).getTime() + 5 * 60_000).toISOString(), actor: "System", kind: "assign", message: `Assigned to ${agent}.` },
    { id: `${ticketId}-a4`, at: new Date(new Date(createdAt).getTime() + 12 * 60_000).toISOString(), actor: agent, kind: "reply", message: "Acknowledged passenger and requested booking reference." },
  ];
}

function TicketDetailPage() {
  const { ticket } = Route.useLoaderData();
  const { user } = useAuth();
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [agent, setAgent] = useState(ticket.agent);
  const [note, setNote] = useState("");
  const [audit, setAudit] = useState<AuditEntry[]>(() => seedAudit(ticket.id, ticket.createdAt, ticket.agent));
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [pending, setPending] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [loadingAttachments, setLoadingAttachments] = useState(true);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const listFn = useServerFn(listTicketAttachments);
  const createUrlFn = useServerFn(createAttachmentUploadUrl);
  const confirmFn = useServerFn(confirmAttachmentUpload);
  const downloadFn = useServerFn(getAttachmentDownloadUrl);
  const deleteFn = useServerFn(deleteTicketAttachment);

  const actorName = user?.name ?? user?.email ?? "You";

  const addEntry = (kind: AuditEntry["kind"], message: string, actor = actorName, extras?: Partial<AuditEntry>) =>
    setAudit((prev) => [
      { id: `${ticket.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString(), actor, kind, message, ...extras },
      ...prev,
    ]);

  // Load existing attachments (with fresh signed URLs) on mount / ticket change.
  useEffect(() => {
    let cancelled = false;
    setLoadingAttachments(true);
    setAttachmentError(null);
    listFn({ data: { ticketId: ticket.id } })
      .then((rows) => {
        if (cancelled) return;
        setAttachments(
          rows.map((r) => ({
            id: r.id,
            name: r.file_name,
            size: Number(r.size_bytes),
            type: r.mime_type,
            uploadedBy: r.uploader_name ?? "Support agent",
            uploadedAt: r.created_at,
            storagePath: r.storage_path,
          })),
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setAttachmentError(err?.message ?? "Failed to load attachments");
      })
      .finally(() => !cancelled && setLoadingAttachments(false));
    return () => { cancelled = true; };
  }, [ticket.id, listFn]);

  const changeStatus = (next: TicketStatus) => {
    if (next === status) return;
    setStatus(next);
    addEntry(next === "escalated" ? "escalate" : next === "open" && status === "closed" ? "reopen" : "status",
      `Status changed from ${status} to ${next}.`);
  };
  const reassign = (next: string) => {
    if (next === agent) return;
    setAgent(next);
    addEntry("assign", `Reassigned from ${agent} to ${next}.`);
  };

  const uploadOne = useCallback(async (file: File): Promise<Attachment> => {
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error(`${file.name} exceeds the 25 MB limit`);
    }
    const mimeType = file.type || "application/octet-stream";
    // 1. Ask server for a signed upload URL (permission check happens here).
    const { signedUrl, path } = await createUrlFn({
      data: { ticketId: ticket.id, fileName: file.name, mimeType, sizeBytes: file.size },
    });
    // 2. PUT the file bytes directly to storage using the signed URL.
    const putRes = await fetch(signedUrl, {
      method: "PUT",
      headers: { "content-type": mimeType, "x-upsert": "false" },
      body: file,
    });
    if (!putRes.ok) throw new Error(`Storage upload failed (${putRes.status})`);
    // 3. Persist metadata (RLS enforces the row can only be inserted by support/admin).
    const row = await confirmFn({
      data: {
        ticketId: ticket.id,
        storagePath: path,
        fileName: file.name,
        mimeType,
        sizeBytes: file.size,
        uploaderName: actorName,
      },
    });
    return {
      id: row.id,
      name: row.file_name,
      size: Number(row.size_bytes),
      type: row.mime_type,
      uploadedBy: row.uploader_name ?? actorName,
      uploadedAt: row.created_at,
      storagePath: row.storage_path,
    };
  }, [ticket.id, createUrlFn, confirmFn, actorName]);

  const uploadMany = useCallback(async (files: File[]): Promise<Attachment[]> => {
    const uploaded: Attachment[] = [];
    for (const file of files) {
      try {
        setUploading((n) => n + 1);
        uploaded.push(await uploadOne(file));
      } catch (err) {
        setAttachmentError((err as Error).message);
      } finally {
        setUploading((n) => Math.max(0, n - 1));
      }
    }
    return uploaded;
  }, [uploadOne]);

  const handleFiles = async (files: FileList | File[] | null) => {
    if (!files || (files as FileList).length === 0) return;
    setAttachmentError(null);
    const uploaded = await uploadMany(Array.from(files));
    if (uploaded.length === 0) return;
    setAttachments((prev) => [...uploaded, ...prev]);
    addEntry(
      "attachment",
      `Attached ${uploaded.length} file${uploaded.length > 1 ? "s" : ""}: ${uploaded.map((a) => a.name).join(", ")}.`,
      actorName,
      { attachments: uploaded },
    );
  };

  const removeAttachment = async (id: string) => {
    const removed = attachments.find((a) => a.id === id);
    if (!removed) return;
    setAttachmentError(null);
    try {
      await deleteFn({ data: { id } });
      setAttachments((prev) => prev.filter((a) => a.id !== id));
      addEntry("attachment", `Removed attachment ${removed.name}.`);
    } catch (err) {
      setAttachmentError((err as Error).message);
    }
  };

  const downloadAttachment = async (id: string) => {
    setAttachmentError(null);
    try {
      const { downloadUrl } = await downloadFn({ data: { id, expiresIn: 60 } });
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setAttachmentError((err as Error).message);
    }
  };

  const submitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim() && pending.length === 0) return;
    let uploaded: Attachment[] = [];
    if (pending.length > 0) {
      uploaded = await uploadMany(pending);
      if (uploaded.length > 0) setAttachments((prev) => [...uploaded, ...prev]);
    }
    addEntry(
      "note",
      note.trim() || `Attached ${uploaded.length} file${uploaded.length > 1 ? "s" : ""}.`,
      actorName,
      uploaded.length > 0 ? { attachments: uploaded } : undefined,
    );
    setNote("");
    setPending([]);
  };


  const lastUpdate = useMemo(() => audit[0]?.at ?? ticket.updatedAt, [audit, ticket.updatedAt]);

  return (
    <>
      <SupportTopbar
        crumbs={[
          { label: "Support", to: "/support" },
          { label: "Tickets", to: "/support/tickets" },
          { label: ticket.id },
        ]}
      />
      <main className="flex-1 space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link to="/support/tickets" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to tickets
            </Link>
            <div className="mt-2 flex items-center gap-3">
              <h1 className="font-display text-3xl tracking-tight">{ticket.subject}</h1>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${STATUS_TONE[status]}`}>{status}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-mono">{ticket.id}</span> · {ticket.category} · Priority {ticket.priority} · Updated {new Date(lastUpdate).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => changeStatus("resolved")} className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-500 hover:bg-emerald-500/20"><CheckCircle2 className="h-3.5 w-3.5" /> Resolve</button>
            <button onClick={() => changeStatus("closed")} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"><XCircle className="h-3.5 w-3.5" /> Close</button>
            <button onClick={() => changeStatus("open")} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"><RotateCcw className="h-3.5 w-3.5" /> Reopen</button>
            <button onClick={() => changeStatus("escalated")} className="inline-flex items-center gap-1.5 rounded-md bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/20"><ArrowUpRight className="h-3.5 w-3.5" /> Escalate</button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-lg">Overview</h2>
              <p className="mt-2 text-sm text-foreground/80">{ticket.preview}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <Field icon={TicketIcon} label="Booking" value={ticket.booking} mono />
                <Field icon={Plane} label="Flight" value={ticket.flight} mono />
                <Field icon={Tag} label="Category" value={ticket.category} />
                <Field icon={Clock} label="Created" value={new Date(ticket.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} />
              </dl>
            </section>

            <section className="rounded-xl border border-sky-accent/25 bg-sky-accent/5 p-5">
              <h2 className="flex items-center gap-2 font-display text-lg text-sky-accent"><Sparkles className="h-4 w-4" /> AI insights</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Insight label="Sentiment" value={ticket.sentiment} tone={ticket.sentiment === "negative" ? "danger" : ticket.sentiment === "positive" ? "positive" : "neutral"} />
                <Insight label="Confidence" value={`${ticket.aiConfidence}%`} />
                <Insight label="Suggested action" value={ticket.status === "escalated" ? "Escalate to supervisor" : "Draft empathetic reply"} />
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-lg"><Paperclip className="h-4 w-4 text-sky-accent" /> Attachments</h2>
                <span className="text-[11px] text-muted-foreground">{attachments.length} file{attachments.length === 1 ? "" : "s"}</span>
              </div>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                className={`mt-3 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${dragOver ? "border-sky-accent bg-sky-accent/5" : "border-border hover:bg-muted/40"}`}
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-medium">Drop files here or click to upload</p>
                <p className="text-[11px] text-muted-foreground">PDFs, images, boarding passes, receipts (max 25MB each)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
                />
              </div>
              {attachmentError && (
                <div className="mt-3 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-500">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <div>{attachmentError}</div>
                </div>
              )}
              {(uploading > 0 || loadingAttachments) && (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {uploading > 0 ? `Uploading ${uploading} file${uploading > 1 ? "s" : ""}…` : "Loading attachments…"}
                </div>
              )}
              {attachments.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {attachments.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 rounded-md border border-border bg-background/60 p-2.5">
                      <span className="grid h-9 w-9 place-items-center rounded-md bg-muted text-muted-foreground">{fileIcon(a.type)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{a.name}</div>
                        <div className="text-[11px] text-muted-foreground">{formatSize(a.size)} · Uploaded by {a.uploadedBy} · {new Date(a.uploadedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                      <button type="button" onClick={() => downloadAttachment(a.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Download">
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => removeAttachment(a.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500" title="Remove">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-lg">Add internal note</h2>
              <form onSubmit={submitNote} className="mt-3 space-y-2">
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Log an update, investigation finding, or handoff note…" className="w-full rounded-md border border-border bg-background p-3 text-sm" />
                {pending.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5">
                    {pending.map((f, idx) => (
                      <li key={`${f.name}-${idx}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-1 text-[11px]">
                        <Paperclip className="h-3 w-3" /> {f.name} <span className="text-muted-foreground">· {formatSize(f.size)}</span>
                        <button type="button" onClick={() => setPending((p) => p.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-foreground">×</button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-center justify-between">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted">
                    <Paperclip className="h-3.5 w-3.5" /> Attach files
                    <input type="file" multiple className="hidden" onChange={(e) => { if (e.target.files && e.target.files.length) setPending((p) => [...p, ...Array.from(e.target.files!)]); e.target.value = ""; }} />
                  </label>
                  <button type="submit" disabled={!note.trim() && pending.length === 0} className="inline-flex items-center gap-1.5 rounded-md bg-sky-dark px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40">
                    <Send className="h-3.5 w-3.5" /> Log note
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-lg">Audit trail</h2>
              <ol className="mt-4 space-y-4">
                {audit.map((e, i) => (
                  <li key={e.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`grid h-7 w-7 place-items-center rounded-full ${kindTone(e.kind)}`}>{kindIcon(e.kind)}</span>
                      {i < audit.length - 1 && <span className="mt-1 h-full w-px bg-border" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="text-sm">
                        <span className="font-semibold">{e.actor}</span>
                        <span className="text-muted-foreground"> · {new Date(e.at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-foreground/80">{e.message}</p>
                      {e.attachments && e.attachments.length > 0 && (
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {e.attachments.map((a) => (
                            <li key={a.id}>
                              <button type="button" onClick={() => downloadAttachment(a.id)} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-[11px] hover:bg-muted">
                                <span className="text-muted-foreground">{fileIcon(a.type)}</span>
                                <span className="max-w-[180px] truncate">{a.name}</span>
                                <span className="text-muted-foreground">· {formatSize(a.size)}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

          </div>

          <aside className="space-y-4">
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-lg">Status</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => changeStatus(s)}
                    className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                      status === s ? `${STATUS_TONE[s]} border-transparent` : "border-border hover:bg-muted"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 font-display text-lg"><UserCog className="h-4 w-4 text-sky-accent" /> Assigned agent</h2>
              <div className="mt-3 flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-sky-dark text-xs font-semibold text-sky-gold">{agent.slice(0,2).toUpperCase()}</div>
                <div className="text-sm">
                  <div className="font-medium">{agent}</div>
                  <div className="text-[11px] text-muted-foreground">Owner</div>
                </div>
              </div>
              <label className="mt-4 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Reassign</label>
              <select value={agent} onChange={(e) => reassign(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-2 text-sm">
                {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </section>

            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-lg">Passenger</h2>
              <div className="mt-3 space-y-1 text-sm">
                <div className="font-medium">{ticket.passenger}</div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3 w-3" /> {ticket.email}</div>
              </div>
              <Link to="/support/passengers" className="mt-3 inline-flex items-center gap-1 text-xs text-sky-accent hover:underline">
                Open passenger 360 →
              </Link>
            </section>

            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 font-display text-lg"><MessageSquare className="h-4 w-4 text-sky-accent" /> Quick actions</h2>
              <div className="mt-3 flex flex-col gap-2">
                <Link to="/support/chat" className="rounded-md border border-border px-3 py-2 text-center text-xs font-medium hover:bg-muted">Open live chat</Link>
                <Link to="/support/refunds" className="rounded-md border border-border px-3 py-2 text-center text-xs font-medium hover:bg-muted">Start refund</Link>
                <Link to="/support/compensation" className="rounded-md border border-border px-3 py-2 text-center text-xs font-medium hover:bg-muted">Offer compensation</Link>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}

function Field({ icon: Icon, label, value, mono }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted-foreground"><Icon className="h-3 w-3" /> {label}</dt>
      <dd className={`mt-0.5 font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

function Insight({ label, value, tone }: { label: string; value: string; tone?: "positive" | "danger" | "neutral" }) {
  const cls = tone === "danger" ? "text-red-500" : tone === "positive" ? "text-emerald-500" : "text-foreground";
  return (
    <div className="rounded-lg border border-sky-accent/20 bg-background/60 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-semibold capitalize ${cls}`}>{value}</p>
    </div>
  );
}

function kindTone(k: AuditEntry["kind"]) {
  switch (k) {
    case "created": return "bg-sky-500/15 text-sky-500";
    case "status": return "bg-amber-500/15 text-amber-500";
    case "assign": return "bg-indigo-500/15 text-indigo-400";
    case "reply": return "bg-emerald-500/15 text-emerald-500";
    case "note": return "bg-muted text-muted-foreground";
    case "ai": return "bg-sky-accent/15 text-sky-accent";
    case "escalate": return "bg-red-500/15 text-red-500";
    case "reopen": return "bg-sky-500/15 text-sky-500";
    case "attachment": return "bg-violet-500/15 text-violet-400";
  }
}
function kindIcon(k: AuditEntry["kind"]) {
  const cls = "h-3.5 w-3.5";
  switch (k) {
    case "created": return <TicketIcon className={cls} />;
    case "status": return <Tag className={cls} />;
    case "assign": return <UserCog className={cls} />;
    case "reply": return <Send className={cls} />;
    case "note": return <MessageSquare className={cls} />;
    case "ai": return <Sparkles className={cls} />;
    case "escalate": return <ArrowUpRight className={cls} />;
    case "reopen": return <RotateCcw className={cls} />;
    case "attachment": return <Paperclip className={cls} />;
  }
}

function fileIcon(type: string) {
  const cls = "h-4 w-4";
  if (type.startsWith("image/")) return <ImageIcon className={cls} />;
  if (type === "application/pdf" || type.includes("text")) return <FileText className={cls} />;
  if (type.includes("zip") || type.includes("compressed")) return <FileArchive className={cls} />;
  return <FileIcon className={cls} />;
}
function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function TicketNotFound() {
  const { ticketId } = useParams({ from: "/support/tickets/$ticketId" });
  return (
    <>
      <SupportTopbar crumbs={[{ label: "Support", to: "/support" }, { label: "Tickets", to: "/support/tickets" }, { label: "Not found" }]} />
      <main className="flex-1 p-12 text-center">
        <h1 className="font-display text-2xl">Ticket not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">No ticket matches <span className="font-mono">{ticketId}</span>.</p>
        <Link to="/support/tickets" className="mt-4 inline-block rounded-md bg-sky-dark px-3 py-2 text-xs font-semibold text-white">Back to tickets</Link>
      </main>
    </>
  );
}
