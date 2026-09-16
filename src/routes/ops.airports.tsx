import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Wind, Eye, Activity, AlertCircle, Building2, Plane, Clock,
  FileText, Download, X, Copy, CheckCircle2, ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { OpsTopbar } from "@/components/ops/OpsTopbar";
import { StatusBadge } from "@/components/ops/StatusBadge";
import { airportsQuery, flightsQuery } from "@/lib/ops/queries";
import type { Airport } from "@/lib/ops/mock-data";

export const Route = createFileRoute("/ops/airports")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(airportsQuery);
    context.queryClient.ensureQueryData(flightsQuery);
  },
  component: Airports,
});

function Airports() {
  const { data: airports } = useSuspenseQuery(airportsQuery);
  const { data: flights } = useSuspenseQuery(flightsQuery);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);

  const handleDownloadAirportBrief = (airport: Airport) => {
    const brief = `SKYWAY AIRLINES — AIRPORT OPERATIONS BRIEFING
Station: ${airport.code} (${airport.name} · ${airport.city}, ${airport.country})
Generated: ${new Date().toUTCString()}
----------------------------------------------------------------------
STATION METEOROLOGY (METAR / TAF)
Weather Condition: ${airport.weather.toUpperCase()}
Wind: ${airport.wind_kts} kts
Visibility: ${airport.visibility_km} km
Barometric Pressure: QNH 1014 hPa
----------------------------------------------------------------------
AIRFIELD INFRASTRUCTURE & CAPACITY
Runways in Service: ${airport.runways} (ILS Cat III operational)
Active Gates: ${airport.gates}
Current Station Congestion: ${airport.congestion}%
Operational Status: ${airport.status.toUpperCase()}
----------------------------------------------------------------------
CONNECTING SKYWAY FLIGHTS:
${flights.filter(f => f.origin === airport.code || f.destination === airport.code).map(f => `- Flight ${f.flight_no} (${f.origin} → ${f.destination}) · Status: ${f.status}`).join("\n")}
----------------------------------------------------------------------
Station Dispatch Lead: SkyWay Station Control Desk`;

    const blob = new Blob([brief], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SkyWay_OpsBrief_${airport.code}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Station Brief for ${airport.code} downloaded!`);
  };

  return (
    <>
      <OpsTopbar crumbs={[{ label: "OCC", to: "/ops" }, { label: "Airports" }]} />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Airport operations</h1>
          <p className="text-sm text-muted-foreground">Runway status, gates, congestion, weather and alerts per hub.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {airports.map((a) => (
            <article key={a.code} className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-2xl font-bold text-foreground">{a.code}</div>
                  <div className="text-sm font-semibold">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.city}, {a.country}</div>
                </div>
                <StatusBadge status={a.status} />
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Congestion</span><span className="font-mono font-semibold">{a.congestion}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full ${a.congestion > 80 ? "bg-red-500" : a.congestion > 60 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${a.congestion}%` }} />
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <Cell icon={Wind} label="Wind" value={`${a.wind_kts} kts`} />
                <Cell icon={Eye} label="Visibility" value={`${a.visibility_km} km`} />
                <Cell icon={Activity} label="Runways" value={String(a.runways)} />
                <Cell icon={AlertCircle} label="Gates" value={String(a.gates)} />
              </dl>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
                <span className="capitalize text-muted-foreground">Weather · <strong className="text-foreground">{a.weather}</strong></span>
                <button
                  type="button"
                  onClick={() => setSelectedAirport(a)}
                  className="font-semibold text-sky-accent hover:underline inline-flex items-center gap-1"
                >
                  Open ops brief →
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Airport Ops Brief Modal */}
      {selectedAirport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setSelectedAirport(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-sky-accent">
              <Building2 className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">OCC Station Intelligence</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl">{selectedAirport.code} · {selectedAirport.name}</h2>
                <p className="text-xs text-muted-foreground">{selectedAirport.city}, {selectedAirport.country} · ICAO Station Ops</p>
              </div>
              <StatusBadge status={selectedAirport.status} />
            </div>

            {/* Quick Metrics */}
            <div className="mt-4 grid grid-cols-4 gap-2 rounded-xl bg-muted/40 p-3 text-center text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase">Congestion</span>
                <div className="font-mono text-sm font-bold">{selectedAirport.congestion}%</div>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase">Runways</span>
                <div className="font-mono text-sm font-bold">{selectedAirport.runways} Active</div>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase">Gates</span>
                <div className="font-mono text-sm font-bold">{selectedAirport.gates} Total</div>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase">METAR Wind</span>
                <div className="font-mono text-sm font-bold">{selectedAirport.wind_kts} kts</div>
              </div>
            </div>

            {/* METAR & Weather Decoder */}
            <div className="mt-4 space-y-2 rounded-xl border border-border bg-background p-4 text-xs font-mono">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-bold text-foreground">METAR / TAF Decoder</span>
                <span>Live Feed</span>
              </div>
              <p className="text-sky-accent">
                {selectedAirport.code} {new Date().toISOString().slice(8, 10)}{new Date().getHours()}00Z {selectedAirport.wind_kts > 9 ? `270${selectedAirport.wind_kts}KT` : `0900${selectedAirport.wind_kts}KT`} {selectedAirport.visibility_km * 1000} {selectedAirport.weather === 'clear' ? 'SKC' : selectedAirport.weather === 'rain' ? 'RA BKN025' : selectedAirport.weather === 'storm' ? '+TSRA SCT018CB' : 'FEW030'} 18/14 Q1014 NOSIG
              </p>
              <div className="text-[11px] text-muted-foreground font-sans">
                Wind {selectedAirport.wind_kts} kts, visibility {selectedAirport.visibility_km} km. Sky condition: {selectedAirport.weather.toUpperCase()}.
              </div>
            </div>

            {/* Station Scheduled Flights */}
            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Connecting SkyWay Flights</h4>
              <div className="mt-2 space-y-1.5">
                {flights.filter(f => f.origin === selectedAirport.code || f.destination === selectedAirport.code).map(f => (
                  <div key={f.id} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-xs">
                    <div className="flex items-center gap-2 font-mono">
                      <Plane className="h-3.5 w-3.5 text-sky-accent" />
                      <span className="font-bold">{f.flight_no}</span>
                      <span className="text-muted-foreground">({f.origin} → {f.destination})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={f.status} />
                      {f.delay_minutes > 0 && <span className="font-mono text-amber-500 font-semibold">+{f.delay_minutes}m</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`METAR ${selectedAirport.code}: Wind ${selectedAirport.wind_kts} kts, Vis ${selectedAirport.visibility_km} km, Weather ${selectedAirport.weather}`);
                  toast.success(`METAR for ${selectedAirport.code} copied to clipboard!`);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy METAR
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.warning(`Ground stop alert broadcasted to ${selectedAirport.code} station operations.`);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-500 hover:bg-amber-500/20"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Trigger Ground Alert
              </button>
              <button
                type="button"
                onClick={() => handleDownloadAirportBrief(selectedAirport)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
              >
                <Download className="h-3.5 w-3.5" />
                Download Brief (.TXT)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Cell({ icon: Icon, label, value }: { icon: typeof Wind; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground"><Icon className="h-3 w-3" /> {label}</div>
      <div className="mt-0.5 font-mono text-sm font-semibold">{value}</div>
    </div>
  );
}

