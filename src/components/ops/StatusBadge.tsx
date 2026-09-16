const MAP: Record<string, string> = {
  "in-flight": "bg-sky-accent/15 text-sky-accent border-sky-accent/30",
  scheduled: "bg-muted text-muted-foreground border-border",
  boarding: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  delayed: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  cancelled: "bg-red-500/15 text-red-500 border-red-500/30",
  completed: "bg-emerald-600/15 text-emerald-600 border-emerald-600/30",
  diverted: "bg-purple-500/15 text-purple-500 border-purple-500/30",
  available: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  maintenance: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  operating: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = MAP[status] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
