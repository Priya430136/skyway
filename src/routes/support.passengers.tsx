import { createFileRoute } from "@tanstack/react-router";
import { Crown, Plane, Wallet, Ticket, Heart } from "lucide-react";
import { SupportTopbar } from "@/components/support/SupportTopbar";
import { passengerSample, tickets } from "@/lib/support/mock";

export const Route = createFileRoute("/support/passengers")({ component: PassengerProfilePage });

function PassengerProfilePage() {
  const p = passengerSample;
  const history = tickets.slice(0, 6);

  return (
    <>
      <SupportTopbar crumbs={[{ label: "Support", to: "/support" }, { label: "Passenger 360" }]} />
      <main className="flex-1 space-y-5 p-6">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Passenger 360</h1>
          <p className="text-sm text-muted-foreground">Every relevant passenger detail on one screen.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-sky-dark text-lg font-semibold text-sky-gold">{p.name.slice(0,2).toUpperCase()}</div>
              <div>
                <div className="font-display text-xl">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.email}</div>
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-500"><Crown className="h-3 w-3" /> {p.tier}</div>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <Field label="Passenger ID" value={p.id} />
              <Field label="Member since" value={new Date(p.since).toLocaleDateString()} />
              <Field label="Lifetime trips" value={p.trips} />
              <Field label="Refunds" value={p.refunds} />
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
            <h3 className="font-display text-lg flex items-center gap-2"><Plane className="h-4 w-4 text-sky-accent" /> Upcoming trips</h3>
            <ul className="mt-3 divide-y divide-border/60">
              {p.upcoming.map((u) => (
                <li key={u.flight} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <div className="font-medium">{u.route}</div>
                    <div className="text-xs text-muted-foreground">Flight {u.flight}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(u.date).toLocaleDateString()}</div>
                </li>
              ))}
            </ul>

            <h3 className="mt-6 font-display text-lg flex items-center gap-2"><Heart className="h-4 w-4 text-sky-accent" /> Special assistance</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {p.assistance.map((a) => <span key={a} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-[11px]">{a}</span>)}
              {p.assistance.length === 0 && <span className="text-xs text-muted-foreground">None on file.</span>}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display text-lg flex items-center gap-2"><Ticket className="h-4 w-4 text-sky-accent" /> Previous tickets</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr><th className="pb-2 pr-4">ID</th><th className="pb-2 pr-4">Subject</th><th className="pb-2 pr-4">Category</th><th className="pb-2 pr-4">Status</th><th className="pb-2">Updated</th></tr>
              </thead>
              <tbody>
                {history.map((t) => (
                  <tr key={t.id} className="border-t border-border/60">
                    <td className="py-2.5 pr-4 font-mono text-xs">{t.id}</td>
                    <td className="py-2.5 pr-4">{t.subject}</td>
                    <td className="py-2.5 pr-4">{t.category}</td>
                    <td className="py-2.5 pr-4 capitalize">{t.status}</td>
                    <td className="py-2.5 text-muted-foreground">{new Date(t.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display text-lg flex items-center gap-2"><Wallet className="h-4 w-4 text-sky-accent" /> Refund history</h3>
          <p className="mt-1 text-xs text-muted-foreground">{p.refunds} refunds processed to date · totalling $1,240.</p>
        </div>
      </main>
    </>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
