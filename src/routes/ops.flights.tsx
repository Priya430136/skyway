import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Download, Filter, ArrowUpDown, X, Plane, MapPin, Users, Fuel } from "lucide-react";
import { OpsTopbar } from "@/components/ops/OpsTopbar";
import { StatusBadge } from "@/components/ops/StatusBadge";
import { flightsQuery, type Flight } from "@/lib/ops/queries";

type FlightsSearch = { route?: string; airport?: string; range?: string };

const RANGE_HOURS: Record<string, number> = { "1h": 1, "4h": 4, "today": 24, "24h": 24, "7d": 24 * 7 };

export const Route = createFileRoute("/ops/flights")({
  validateSearch: (raw: Record<string, unknown>): FlightsSearch => ({
    route: typeof raw.route === "string" ? raw.route : undefined,
    airport: typeof raw.airport === "string" ? raw.airport : undefined,
    range: typeof raw.range === "string" ? raw.range : undefined,
  }),
  loader: ({ context }) => { context.queryClient.ensureQueryData(flightsQuery); },
  component: LiveFlights,
});

function LiveFlights() {
  const { data: flights } = useSuspenseQuery(flightsQuery);
  const search = Route.useSearch();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [selected, setSelected] = useState<Flight | null>(null);

  const routePair = useMemo(() => {
    if (!search.route) return null;
    const m = search.route.toUpperCase().match(/([A-Z]{3}).*?([A-Z]{3})/);
    return m ? { o: m[1], d: m[2] } : null;
  }, [search.route]);

  const rangeCutoff = useMemo(() => {
    if (!search.range) return null;
    const hours = RANGE_HOURS[search.range];
    if (!hours) return null;
    const isPast = search.range === "24h" || search.range === "7d";
    return { hours, isPast };
  }, [search.range]);

  const rows = useMemo(() => {
    const now = Date.now();
    return flights.filter((f) => {
      const matchesQ = !q || f.flight_no.toLowerCase().includes(q.toLowerCase()) || f.origin.includes(q.toUpperCase()) || f.destination.includes(q.toUpperCase());
      const matchesS = status === "all" || f.status === status;
      const matchesRoute = !routePair || (f.origin === routePair.o && f.destination === routePair.d);
      const airport = search.airport?.toUpperCase();
      const matchesAirport = !airport || f.origin === airport || f.destination === airport;
      let matchesRange = true;
      if (rangeCutoff) {
        const dep = new Date(f.scheduled_dep).getTime();
        const diffH = (dep - now) / 3_600_000;
        matchesRange = rangeCutoff.isPast ? diffH >= -rangeCutoff.hours && diffH <= 0 : diffH >= 0 && diffH <= rangeCutoff.hours;
      }
      return matchesQ && matchesS && matchesRoute && matchesAirport && matchesRange;
    });
  }, [flights, q, status, routePair, search.airport, rangeCutoff]);


  const exportCsv = () => {
    const header = "Flight,Route,Aircraft,Gate,Departure,Arrival,Status,Delay,Occupancy,Captain\n";
    const csv = rows.map((f) => [
      f.flight_no, `${f.origin}-${f.destination}`, f.aircraft_tail ?? "", f.gate ?? "",
      f.scheduled_dep, f.scheduled_arr, f.status, f.delay_minutes, f.occupancy, f.captain ?? "",
    ].join(",")).join("\n");
    const blob = new Blob([header + csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "skyway-flights.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <OpsTopbar crumbs={[{ label: "OCC", to: "/ops" }, { label: "Live Flights" }]} />
      <main className="flex-1 space-y-4 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Live flight monitor</h1>
            <p className="text-sm text-muted-foreground">{rows.length} of {flights.length} flights · click any row for controller drawer</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Flight, origin, dest" className="w-56 rounded-md border border-border bg-card py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-accent/30" />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-sm">
              <option value="all">All statuses</option>
              <option value="in-flight">In-flight</option>
              <option value="boarding">Boarding</option>
              <option value="scheduled">Scheduled</option>
              <option value="delayed">Delayed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted"><Filter className="h-3.5 w-3.5" />More</button>
            <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-md bg-sky-dark px-3 py-2 text-sm font-semibold text-white hover:opacity-90"><Download className="h-3.5 w-3.5" />Export</button>
          </div>
        </div>

        {(search.route || search.airport || search.range) && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-sky-accent/30 bg-sky-accent/5 px-3 py-2 text-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-accent">Copilot scope</span>
            {search.route && <FilterChip label={`Route ${search.route}`} clearTo={{ route: undefined, airport: search.airport, range: search.range }} />}
            {search.airport && <FilterChip label={`Airport ${search.airport}`} clearTo={{ route: search.route, airport: undefined, range: search.range }} />}
            {search.range && <FilterChip label={`Range ${search.range}`} clearTo={{ route: search.route, airport: search.airport, range: undefined }} />}
            <Link to="/ops/flights" search={{}} className="ml-auto text-[11px] text-muted-foreground hover:text-foreground hover:underline">Clear all</Link>
          </div>
        )}



        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                {["Flight", "Route", "Aircraft", "Gate", "Dep · Arr", "Status", "Delay", "Occ", "Captain", "Wx"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">
                    <span className="inline-flex items-center gap-1">{h} <ArrowUpDown className="h-3 w-3 opacity-30" /></span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((f) => (
                <tr key={f.id} onClick={() => setSelected(f)} className="cursor-pointer hover:bg-muted/40">
                  <td className="px-4 py-3 font-mono font-semibold text-foreground">{f.flight_no}</td>
                  <td className="px-4 py-3 text-muted-foreground"><span className="font-medium text-foreground">{f.origin}</span> → <span className="font-medium text-foreground">{f.destination}</span></td>
                  <td className="px-4 py-3 font-mono text-xs">{f.aircraft_tail ?? "—"}</td>
                  <td className="px-4 py-3">{f.gate ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    <div>{new Date(f.scheduled_dep).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    <div className="text-muted-foreground">{new Date(f.scheduled_arr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                  <td className={`px-4 py-3 text-xs font-semibold ${f.delay_minutes > 30 ? "text-red-500" : f.delay_minutes > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                    {f.delay_minutes > 0 ? `+${f.delay_minutes}m` : "on time"}
                  </td>
                  <td className="px-4 py-3 text-xs">{f.occupancy || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{f.captain ?? "—"}</td>
                  <td className="px-4 py-3 text-xs capitalize">{f.weather}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={10} className="p-8 text-center text-sm text-muted-foreground">No flights match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {selected && <FlightDrawer flight={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function FlightDrawer({ flight, onClose }: { flight: Flight; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-background p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-accent">Flight controller</p>
            <h2 className="mt-1 font-display text-3xl">{flight.flight_no}</h2>
            <p className="text-sm text-muted-foreground">{flight.origin} → {flight.destination}</p>
          </div>
          <button onClick={onClose} className="rounded-md border border-border p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-6"><StatusBadge status={flight.status} /></div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <Meta icon={Plane} label="Aircraft" value={flight.aircraft_tail ?? "—"} />
          <Meta icon={MapPin} label="Gate" value={flight.gate ?? "—"} />
          <Meta icon={Users} label="Occupancy" value={String(flight.occupancy || 0)} />
          <Meta icon={Fuel} label="Cabin" value={flight.cabin ?? "—"} />
        </dl>

        <div className="mt-6 space-y-3">
          <TimeRow label="Scheduled dep" value={flight.scheduled_dep} />
          <TimeRow label="Scheduled arr" value={flight.scheduled_arr} />
          {flight.actual_dep && <TimeRow label="Actual dep" value={flight.actual_dep} />}
        </div>

        <div className="mt-6 flex gap-2">
          <button className="flex-1 rounded-md bg-sky-dark px-3 py-2 text-sm font-semibold text-white hover:opacity-90">Open recovery plan</button>
          <button className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">Reassign</button>
        </div>
      </div>
    </div>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof Plane; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground"><Icon className="h-3 w-3" /> {label}</div>
      <div className="mt-1 font-mono text-sm font-semibold">{value}</div>
    </div>
  );
}
function TimeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{new Date(value).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
    </div>
  );
}

function FilterChip({ label, clearTo }: { label: string; clearTo: FlightsSearch }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-sky-accent/40 bg-background px-2 py-0.5 text-[11px] font-medium">
      {label}
      <Link to="/ops/flights" search={clearTo} className="text-muted-foreground hover:text-red-500" aria-label={`Remove ${label}`}>
        <X className="h-3 w-3" />
      </Link>
    </span>
  );
}
