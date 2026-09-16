import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { SupportTopbar } from "@/components/support/SupportTopbar";
import { complaints } from "@/lib/support/mock";

export const Route = createFileRoute("/support/complaints")({ component: ComplaintsPage });

function ComplaintsPage() {
  const [active, setActive] = useState(complaints[0].id);
  const current = complaints.find((c) => c.id === active) ?? complaints[0];

  return (
    <>
      <SupportTopbar crumbs={[{ label: "Support", to: "/support" }, { label: "Complaints" }]} />
      <main className="flex-1 space-y-5 p-6">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Complaint management</h1>
          <p className="text-sm text-muted-foreground">Track every passenger complaint from filing to resolution.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="overflow-hidden rounded-xl border border-border bg-card lg:col-span-2">
            <div className="border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active complaints</div>
            <ul className="max-h-[560px] overflow-y-auto">
              {complaints.map((c) => (
                <li key={c.id}>
                  <button onClick={() => setActive(c.id)} className={`w-full border-b border-border/60 px-4 py-3 text-left hover:bg-muted/40 ${active === c.id ? "bg-muted/60" : ""}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs">{c.id}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                        c.severity === "high" ? "bg-red-500/15 text-red-500" :
                        c.severity === "medium" ? "bg-amber-500/15 text-amber-500" :
                        "bg-sky-500/15 text-sky-500"
                      }`}>{c.severity}</span>
                    </div>
                    <div className="mt-1 text-sm font-medium">{c.category}</div>
                    <div className="text-[11px] text-muted-foreground">{c.passenger} · Flight {c.flight}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{current.id}</div>
                <h2 className="font-display text-xl">{current.category}</h2>
                <p className="text-xs text-muted-foreground">Passenger: {current.passenger} · Flight {current.flight}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                current.status === "resolved" ? "bg-emerald-500/15 text-emerald-500" :
                current.status === "investigating" ? "bg-amber-500/15 text-amber-500" :
                "bg-sky-500/15 text-sky-500"
              }`}>{current.status}</span>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold">Timeline</h3>
              <ol className="mt-3 space-y-3">
                {current.timeline.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      {step.done
                        ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        : <Circle className="h-5 w-5 text-muted-foreground/40" />}
                      {i < current.timeline.length - 1 && <span className={`mt-1 h-8 w-px ${step.done ? "bg-emerald-500/40" : "bg-border"}`} />}
                    </div>
                    <div className="pt-0.5">
                      <div className={`text-sm ${step.done ? "font-medium" : "text-muted-foreground"}`}>{step.label}</div>
                      <div className="text-[11px] text-muted-foreground">{new Date(step.at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
