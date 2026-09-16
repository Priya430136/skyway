import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { OpsTopbar } from "@/components/ops/OpsTopbar";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { flightsQuery, airportsQuery } from "@/lib/ops/queries";
import { PortalPerformanceSection } from "@/components/PortalPerformanceSection";

type AnalyticsSearch = { route?: string; airport?: string; range?: string };

export const Route = createFileRoute("/ops/analytics")({
  validateSearch: (raw: Record<string, unknown>): AnalyticsSearch => ({
    route: typeof raw.route === "string" ? raw.route : undefined,
    airport: typeof raw.airport === "string" ? raw.airport : undefined,
    range: typeof raw.range === "string" ? raw.range : undefined,
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(flightsQuery);
    context.queryClient.ensureQueryData(airportsQuery);
  },
  component: Analytics,
});

function Analytics() {
  const { data: flights } = useSuspenseQuery(flightsQuery);
  const { data: airports } = useSuspenseQuery(airportsQuery);
  const search = Route.useSearch();

  const trendLength = search.range === "1h" ? 6 : search.range === "4h" ? 12 : search.range === "today" || search.range === "24h" ? 24 : 30;
  const delayTrend = Array.from({ length: trendLength }, (_, i) => ({
    d: i + 1, delay: Math.round(6 + Math.sin(i / 3) * 3 + Math.random() * 2),
  }));
  const airportPerf = airports.slice(0, 8).map((a) => ({
    code: a.code, otp: Math.round(100 - a.congestion / 2),
  }));
  const fleetUtil = Array.from({ length: 12 }, (_, i) => ({
    m: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i], util: Math.round(72 + Math.sin(i / 2) * 8),
  }));
  const fuel = Array.from({ length: 12 }, (_, i) => ({
    m: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i], burn: Math.round(320 + Math.sin(i) * 20),
  }));
  const costs = [
    { name: "Fuel", v: 82 }, { name: "Crew", v: 55 }, { name: "Handling", v: 40 },
    { name: "Nav", v: 32 }, { name: "Maint", v: 45 }, { name: "Distr.", v: 25 },
  ];

  return (
    <>
      <OpsTopbar crumbs={[{ label: "OCC", to: "/ops" }, { label: "Analytics" }]} />
      <main className="flex-1 space-y-6 p-6">
        <h1 className="font-display text-3xl tracking-tight">Operations analytics</h1>

        {(search.route || search.airport || search.range) && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-sky-accent/30 bg-sky-accent/5 px-3 py-2 text-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-accent">Copilot scope</span>
            {search.route && <FilterChip label={`Route ${search.route}`} clearTo={{ route: undefined, airport: search.airport, range: search.range }} />}
            {search.airport && <FilterChip label={`Airport ${search.airport}`} clearTo={{ route: search.route, airport: undefined, range: search.range }} />}
            {search.range && <FilterChip label={`Range ${search.range}`} clearTo={{ route: search.route, airport: search.airport, range: undefined }} />}
            <Link to="/ops/analytics" search={{}} className="ml-auto text-[11px] text-muted-foreground hover:text-foreground hover:underline">Clear all</Link>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Delay trend · 30 days">
            <AreaChart data={delayTrend}>
              <defs><linearGradient id="dl" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} /><stop offset="100%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="d" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} width={30} /><Tooltip contentStyle={{ fontSize: 12 }} />
              <Area dataKey="delay" stroke="#f59e0b" fill="url(#dl)" strokeWidth={2} />
            </AreaChart>
          </Card>

          <Card title="Airport OTP">
            <BarChart data={airportPerf}>
              <XAxis dataKey="code" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} width={30} domain={[0, 100]} /><Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="otp" fill="#3DA5F5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </Card>

          <Card title="Fleet utilization · 12 months">
            <LineChart data={fleetUtil}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="m" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} width={30} /><Tooltip contentStyle={{ fontSize: 12 }} />
              <Line dataKey="util" stroke="#0A1F44" strokeWidth={2} />
            </LineChart>
          </Card>

          <Card title="Fuel consumption (thousands kg)">
            <BarChart data={fuel}>
              <XAxis dataKey="m" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} width={30} /><Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="burn" fill="#C9A54C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </Card>

          <Card title="Cost structure (index)">
            <RadarChart data={costs}>
              <PolarGrid /><PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
              <Radar dataKey="v" stroke="#0A1F44" fill="#3DA5F5" fillOpacity={0.35} />
            </RadarChart>
          </Card>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display text-lg">Network summary</h3>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Stat k="Flights (today)" v={flights.length} />
              <Stat k="Airports" v={airports.length} />
              <Stat k="Avg fleet util." v="78.4%" />
              <Stat k="OTP MTD" v="87.1%" />
              <Stat k="Fuel efficiency" v="+3.2% YoY" />
              <Stat k="Cost per ASK" v="$0.081" />
            </dl>
          </div>
        </div>

        {/* APM Portal Performance Section */}
        <PortalPerformanceSection currentPortal="operations" />
      </main>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-display text-lg">{title}</h3>
      <div className="mt-4 h-56"><ResponsiveContainer>{children}</ResponsiveContainer></div>
    </div>
  );
}
function Stat({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="mt-1 font-display text-2xl">{v}</div>
    </div>
  );
}

function FilterChip({ label, clearTo }: { label: string; clearTo: AnalyticsSearch }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-sky-accent/40 bg-background px-2 py-0.5 text-[11px] font-medium">
      {label}
      <Link to="/ops/analytics" search={clearTo} className="text-muted-foreground hover:text-red-500" aria-label={`Remove ${label}`}>
        <X className="h-3 w-3" />
      </Link>
    </span>
  );
}
