import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Calendar, Megaphone, Check, X, Eye, Edit3, Send } from "lucide-react";
import { toast } from "sonner";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { announcements as initialAnnouncements, type Announcement } from "@/lib/admin/mock";

export const Route = createFileRoute("/admin/announcements")({ component: AnnouncementsPage });

function AnnouncementsPage() {
  const [announcementList, setAnnouncementList] = useState<Announcement[]>(initialAnnouncements);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [previewItem, setPreviewItem] = useState<Announcement | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"passengers" | "staff" | "all">("all");
  const [type, setType] = useState<"advisory" | "promo" | "operational">("advisory");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Please fill in both title and announcement body.");
      return;
    }

    const newA: Announcement = {
      id: `anc_${Date.now()}`,
      title: title.trim(),
      body: body.trim(),
      audience,
      type,
      published: true,
      scheduled: new Date().toISOString(),
    };

    setAnnouncementList((prev) => [newA, ...prev]);
    setIsAddOpen(false);
    setTitle("");
    setBody("");
    toast.success(`Announcement broadcasted to ${audience}!`, {
      description: title.trim(),
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setAnnouncementList((prev) =>
      prev.map((a) => (a.id === editingItem.id ? { ...editingItem } : a))
    );
    toast.success(`Updated announcement "${editingItem.title}".`);
    setEditingItem(null);
  };

  const handlePublish = (id: string) => {
    setAnnouncementList((prev) =>
      prev.map((a) => (a.id === id ? { ...a, published: true } : a))
    );
    toast.success("Announcement published across web & mobile push.");
  };

  return (
    <>
      <AdminTopbar
        crumbs={[{ label: "Admin", to: "/admin" }, { label: "Announcements" }]}
        action={{
          label: "New Announcement",
          onClick: () => setIsAddOpen(true),
        }}
      />
      <main className="flex-1 space-y-5 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Announcements</h1>
            <p className="text-sm text-muted-foreground">Publish travel advisories, promotions, and staff notices.</p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-sky-dark px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 shadow-xs transition"
          >
            <Plus className="h-3.5 w-3.5" /> New announcement
          </button>
        </div>

        <div className="grid gap-3.5">
          {announcementList.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-card p-5 shadow-xs transition hover:border-sky-accent/40">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-sky-accent/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-accent border border-sky-accent/20">{a.type}</span>
                    <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{a.audience}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${a.published ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" : "bg-amber-500/15 text-amber-500 border-amber-500/30"}`}>
                      {a.published ? "Published" : "Scheduled"}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-lg tracking-tight font-semibold text-foreground">{a.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{a.body}</p>
                  <p className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Calendar className="h-3 w-3" /> {new Date(a.scheduled).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5 text-[11px]">
                  <button
                    onClick={() => setEditingItem({ ...a })}
                    className="rounded border border-border px-2.5 py-1.5 font-medium hover:bg-muted transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setPreviewItem(a)}
                    className="rounded border border-border px-2.5 py-1.5 font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 transition"
                  >
                    Preview
                  </button>
                  {!a.published && (
                    <button
                      onClick={() => handlePublish(a.id)}
                      className="rounded bg-sky-dark px-3 py-1.5 font-semibold text-white hover:opacity-90 shadow-xs transition"
                    >
                      Publish
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* New Announcement Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-dark text-sky-gold">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Broadcast Announcement</h2>
                  <p className="text-xs text-muted-foreground">Publish bulletin to passengers or crew</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Headline Title *</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Severe Winter Storm Alert at ORD"
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Audience Segment</label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as any)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  >
                    <option value="all">All (Passengers & Staff)</option>
                    <option value="passengers">Passengers Only</option>
                    <option value="staff">Flight Crew & Ground Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Announcement Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent capitalize"
                  >
                    <option value="advisory">Advisory</option>
                    <option value="promo">Promotion / Campaign</option>
                    <option value="operational">Operational Notice</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Body Message *</label>
                <textarea
                  required
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Details of the announcement, impacted routes, and recommendations..."
                  className="w-full rounded-lg border border-border bg-background p-3 text-xs outline-none focus:border-sky-accent resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-5 py-2 text-xs font-semibold text-white hover:opacity-90 transition shadow-sm"
                >
                  <Send className="h-4 w-4" /> Broadcast Bulletin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Announcement Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-dark text-sky-gold">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Edit Announcement</h2>
                  <p className="text-xs text-muted-foreground">{editingItem.title}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Headline Title</label>
                <input
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Audience</label>
                  <select
                    value={editingItem.audience}
                    onChange={(e) => setEditingItem({ ...editingItem, audience: e.target.value as any })}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  >
                    <option value="all">All</option>
                    <option value="passengers">Passengers</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Type</label>
                  <select
                    value={editingItem.type}
                    onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value as any })}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent capitalize"
                  >
                    <option value="advisory">Advisory</option>
                    <option value="promo">Promo</option>
                    <option value="operational">Operational</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Body Message</label>
                <textarea
                  rows={4}
                  value={editingItem.body}
                  onChange={(e) => setEditingItem({ ...editingItem, body: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background p-3 text-xs outline-none focus:border-sky-accent resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-5 py-2 text-xs font-semibold text-white hover:opacity-90 transition shadow-sm"
                >
                  <Check className="h-4 w-4" /> Save Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-sky-accent" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Passenger App Preview</span>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <div className="rounded-xl border border-sky-accent/30 bg-sky-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2 w-2 rounded-full bg-sky-accent animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-dark dark:text-sky-300">SkyWay Live Alert</span>
                </div>
                <h4 className="font-bold text-sm text-foreground">{previewItem.title}</h4>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{previewItem.body}</p>
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                This push notification will display on {previewItem.audience} home screens and gate displays.
              </p>
            </div>

            <div className="flex items-center justify-end px-6 py-3 border-t border-border bg-muted/20">
              <button
                onClick={() => setPreviewItem(null)}
                className="rounded-lg bg-sky-dark px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

