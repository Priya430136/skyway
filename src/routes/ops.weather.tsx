import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  CloudRain, CloudLightning, Wind, Eye, Sparkles, X, CheckCircle2,
  Plane, AlertTriangle, ShieldCheck, ArrowRight, Radio, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { OpsTopbar } from "@/components/ops/OpsTopbar";
import { airportsQuery, flightsQuery } from "@/lib/ops/queries";

export const Route = createFileRoute("/ops/weather")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(airportsQuery);
    context.queryClient.ensureQueryData(flightsQuery);
  },
  component: Weather,
});

const RISK = (a: { weather: string; visibility_km: number; wind_kts: number }) => {
  let r = 10;
  if (a.weather === "storm") r += 60;
  if (a.weather === "rain") r += 25;
  if (a.weather === "cloudy") r += 10;
  if (a.visibility_km < 5) r += 20;
  if (a.wind_kts > 20) r += 15;
  return Math.min(100, r);
};

function Weather() {
  const navigate = useNavigate();
  const { data: airports } = useSuspenseQuery(airportsQuery);
  const { data: flights } = useSuspenseQuery(flightsQuery);
  const [recoveryPlanOpen, setRecoveryPlanOpen] = useState(false);

  const ranked = [...airports].map((a) => ({ ...a, risk: RISK(a) })).sort((a, b) => b.risk - a.risk);
  const worst = ranked[0];

  const affectedFlights = flights.filter(f => f.origin === worst.code || f.destination === worst.code);

  const handleExecuteRecovery = () => {
    toast.success(`Weather Recovery Plan executed for ${worst.code} hub!`, {
      description: `Inbound diversions staged. 45-min ground hold dispatched to ${affectedFlights.length} flights.`,
      action: {
        label: "View in AI Disruption",
        onClick: () => navigate({ to: "/ops/ai" }),
      },
    });
    setRecoveryPlanOpen(false);
  };

  return (
    <>
      <OpsTopbar crumbs={[{ label: "OCC", to: "/ops" }, { label: "Weather" }]} />
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Weather dashboard</h1>
          <p className="text-sm text-muted-foreground">Severe meteorological risk monitoring, convective radar cells, and automated recovery planning.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border p-5">
              <h3 className="font-display text-lg">Network weather risk</h3>
            </div>
            <ul className="divide-y divide-border">
              {ranked.map((a) => (
                <li key={a.code} className="grid grid-cols-[80px_1fr_120px_60px] items-center gap-3 px-5 py-3">
                  <div className="font-mono font-bold">{a.code}</div>
                  <div>
                    <div className="text-sm capitalize font-medium">{a.weather}</div>
                    <div className="text-[11px] text-muted-foreground">wind {a.wind_kts} kts · vis {a.visibility_km} km</div>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full ${a.risk > 70 ? "bg-red-500" : a.risk > 40 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${a.risk}%` }} />
                  </div>
                  <div className="text-right font-mono text-sm font-semibold">{a.risk}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
              <div className="flex items-center gap-2 text-red-500"><CloudLightning className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-wider">Highest risk hub</span></div>
              <div className="mt-3 font-display text-4xl">{worst.code}</div>
              <div className="text-sm text-muted-foreground">{worst.name}</div>
              <div className="mt-3 space-y-1.5 text-xs">
                <Row icon={CloudRain} label="Conditions" value={worst.weather} />
                <Row icon={Wind} label="Wind" value={`${worst.wind_kts} kts`} />
                <Row icon={Eye} label="Visibility" value={`${worst.visibility_km} km`} />
              </div>
            </div>

            <div className="rounded-xl border border-sky-accent/30 bg-sky-accent/5 p-5">
              <div className="flex items-center gap-2 text-sky-accent"><Sparkles className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-wider">AI recommendation</span></div>
              <p className="mt-2 text-sm">Divert inbound {worst.code} arrivals to nearest alternate; delay outbound waves 45 minutes. Estimated confidence <span className="font-semibold">92%</span>.</p>
              <button
                type="button"
                onClick={() => setRecoveryPlanOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-sky-dark px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
              >
                <Sparkles className="h-3.5 w-3.5 text-sky-gold" />
                Open recovery plan
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Severe Weather Recovery Plan Modal */}
      {recoveryPlanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setRecoveryPlanOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-sky-accent">
              <Sparkles className="h-5 w-5 text-sky-gold" />
              <span className="text-xs font-bold uppercase tracking-wider">SkyWay AI Weather Recovery</span>
            </div>
            <h2 className="mt-1 font-display text-2xl">Severe Weather Action Plan · {worst.code}</h2>
            <p className="text-xs text-muted-foreground">
              Mitigation strategy for convective thunderstorms and low visibility at {worst.name}.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-3 text-xs">
              <div>
                <span className="text-muted-foreground">Affected Sectors</span>
                <div className="font-mono text-base font-bold text-foreground">{affectedFlights.length} Flights</div>
              </div>
              <div>
                <span className="text-muted-foreground">AI Strategy</span>
                <div className="font-mono text-base font-bold text-sky-accent">Wave Hold + Alternate</div>
              </div>
              <div>
                <span className="text-muted-foreground">Confidence Score</span>
                <div className="font-mono text-base font-bold text-emerald-500">92.4%</div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-border p-3.5 text-xs space-y-2">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-sky-accent" />
                  Staged Operational Directives:
                </div>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-sky-accent font-bold">1.</span>
                    <span><strong>Ground Hold Advisory:</strong> Impose a 45-minute departure slot delay on all outbound flights from {worst.code} to allow convective cell passage.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sky-accent font-bold">2.</span>
                    <span><strong>Inbound Alternates:</strong> Assign pre-approved alternate diversion fuel reserves (+4,500 kg) for all arrivals.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sky-accent font-bold">3.</span>
                    <span><strong>Passenger Care:</strong> Dispatch automated SMS notifications and digital refreshments vouchers for passengers on delayed connections.</span>
                  </li>
                </ul>
              </div>

              {/* Affected flights list */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Impacted Network Flights</span>
                <div className="mt-1.5 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                  {affectedFlights.map(f => (
                    <div key={f.id} className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-none">
                      <span className="font-mono font-bold text-foreground">{f.flight_no} ({f.origin} → {f.destination})</span>
                      <span className="text-amber-500 font-medium">Proposed: +45m Hold</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setRecoveryPlanOpen(false)}
                className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.success(`METAR Weather Advisory broadcasted to all ${affectedFlights.length} flight crews.`);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-accent/40 bg-sky-accent/10 px-3 py-2 text-xs font-medium text-sky-accent hover:bg-sky-accent/20"
              >
                <Radio className="h-3.5 w-3.5" />
                Broadcast METAR to Crews
              </button>
              <button
                type="button"
                onClick={handleExecuteRecovery}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-sky-gold" />
                Execute Weather Recovery Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof CloudRain; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-muted-foreground"><Icon className="h-3 w-3" />{label}</span>
      <span className="capitalize font-mono">{value}</span>
    </div>
  );
}

