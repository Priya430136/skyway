import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import {
  Plane, AlertTriangle, CloudLightning, Layers, Search, Compass,
  Radio, X, Wind, Eye, Users, Gauge, Sparkles, Send, MapPin, Check,
} from "lucide-react";
import { toast } from "sonner";
import { OpsTopbar } from "@/components/ops/OpsTopbar";
import { flightsQuery, airportsQuery } from "@/lib/ops/queries";
import { StatusBadge } from "@/components/ops/StatusBadge";

export const Route = createFileRoute("/ops/map")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(flightsQuery);
    context.queryClient.ensureQueryData(airportsQuery);
  },
  component: FlightMap,
});

function FlightMap() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      <OpsTopbar crumbs={[{ label: "OCC", to: "/ops" }, { label: "Live Flight Radar" }]} />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        {mounted ? <ClientMap /> : <div className="grid h-[75vh] place-items-center text-sm text-muted-foreground rounded-xl border border-border bg-card">Loading live telemetry and radar feeds…</div>}
      </main>
    </>
  );
}

function ClientMap() {
  const navigate = useNavigate();
  const { data: flights } = useSuspenseQuery(flightsQuery);
  const { data: airports } = useSuspenseQuery(airportsQuery);
  const [Lib, setLib] = useState<null | typeof import("react-leaflet")>(null);
  const [L, setL] = useState<null | typeof import("leaflet")>(null);

  const [mapStyle, setMapStyle] = useState<"dark" | "osm" | "satellite">("dark");
  const [filterStatus, setFilterStatus] = useState<"all" | "in-flight" | "delayed" | "storms">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(flights.find(f => f.status === "in-flight")?.id ?? flights[0]?.id ?? null);
  const [selectedAirportCode, setSelectedAirportCode] = useState<string | null>(null);
  const [showAcarsModal, setShowAcarsModal] = useState(false);
  const [acarsText, setAcarsText] = useState("OCC Dispatch: Convective cell at destination FIR. Prepare alternate fuel contingency.");

  useEffect(() => {
    (async () => {
      const rl = await import("react-leaflet");
      const leaflet = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      setLib(rl);
      setL(leaflet);
    })();
  }, []);

  const airportByCode = useMemo(() => Object.fromEntries(airports.map((a) => [a.code, a])), [airports]);

  const activeInFlight = flights.filter(f => f.status === "in-flight").length;
  const delayedCount = flights.filter(f => f.status === "delayed").length;
  const stormAirports = airports.filter(a => a.weather === "storm");

  const filteredFlights = useMemo(() => {
    return flights.filter(f => {
      const matchQ = !searchQuery ||
        f.flight_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.destination.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchQ) return false;
      if (filterStatus === "in-flight") return f.status === "in-flight";
      if (filterStatus === "delayed") return f.status === "delayed";
      if (filterStatus === "storms") {
        const o = airportByCode[f.origin];
        const d = airportByCode[f.destination];
        return o?.weather === "storm" || d?.weather === "storm";
      }
      return true;
    });
  }, [flights, searchQuery, filterStatus, airportByCode]);

  const selectedFlight = flights.find(f => f.id === selectedFlightId);
  const selectedAirport = airports.find(a => a.code === selectedAirportCode);

  if (!Lib || !L) {
    return <div className="grid h-[75vh] place-items-center text-sm text-muted-foreground rounded-xl border border-border bg-card">Loading satellite tile layers…</div>;
  }

  const { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } = Lib;

  const airportIcon = (status: string, code: string) => L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="width:14px;height:14px;border-radius:9999px;background:${status === "delayed" ? "#f59e0b" : "#3DA5F5"};border:2px solid #ffffff;box-shadow:0 0 10px rgba(61,165,245,0.8);"></div>
        <span style="font-size:9px;font-weight:700;background:rgba(10,31,68,0.85);color:#ffffff;padding:1px 4px;border-radius:4px;margin-top:2px;border:1px solid rgba(255,255,255,0.2);">${code}</span>
      </div>`,
    iconSize: [28, 30],
    iconAnchor: [14, 7],
  });

  const planeIcon = (status: string, flightNo: string, isSelected: boolean) => L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;transform:${isSelected ? 'scale(1.2)' : 'scale(1)'};transition:all 0.2s ease;">
        <div style="position:relative;width:24px;height:24px;display:grid;place-items:center;background:${status === "delayed" ? "#f59e0b" : "#0A1F44"};border:2px solid #ffffff;border-radius:9999px;box-shadow:0 0 12px ${status === 'delayed' ? 'rgba(245,158,11,0.8)' : 'rgba(61,165,245,0.8)'};">
          <span style="font-size:13px;color:#ffffff;line-height:1;">✈</span>
        </div>
        <span style="font-size:9px;font-weight:bold;background:#0A1F44;color:#3DA5F5;padding:1px 4px;border-radius:3px;margin-top:2px;box-shadow:0 2px 4px rgba(0,0,0,0.4);border:1px solid rgba(61,165,245,0.4);">${flightNo}</span>
      </div>`,
    iconSize: [32, 36],
    iconAnchor: [16, 12],
  });

  const tileUrls = {
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  };

  const handleSendAcars = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`ACARS dispatch uplinking to ${selectedFlight?.flight_no} cockpit via SATCOM.`, {
      description: `Msg: "${acarsText}"`,
    });
    setShowAcarsModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Top telemetry & quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Airborne Fleet</span>
            <Plane className="h-3.5 w-3.5 text-sky-accent" />
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-sky-accent">{activeInFlight} aircraft</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Delayed Airborne</span>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-amber-500">{delayedCount} sectors</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Severe Storm Hubs</span>
            <CloudLightning className="h-3.5 w-3.5 text-red-500" />
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-red-500">{stormAirports.length} ({stormAirports.map(a => a.code).join(", ") || "None"})</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Active Network Nodes</span>
            <MapPin className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-emerald-500">{airports.length} Global Hubs</div>
        </div>
      </div>

      {/* Map Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter flight (e.g. SW102, LHR)..."
              className="h-8 w-52 rounded-lg border border-border bg-background pl-8 pr-3 text-xs focus:border-sky-accent focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-0.5 text-xs">
            {(["all", "in-flight", "delayed", "storms"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${
                  filterStatus === st ? "bg-sky-dark text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st === "in-flight" ? "Airborne" : st === "storms" ? "Weather Cells" : st}
              </button>
            ))}
          </div>
        </div>

        {/* Map Layer Mode */}
        <div className="flex items-center gap-1 text-xs">
          <span className="mr-1 text-muted-foreground flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" /> Layer:
          </span>
          {(["dark", "satellite", "osm"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMapStyle(m)}
              className={`rounded-md border px-2 py-1 text-[11px] font-medium uppercase transition-colors ${
                mapStyle === m ? "border-sky-accent bg-sky-accent/15 text-sky-accent" : "border-border bg-background hover:bg-muted text-muted-foreground"
              }`}
            >
              {m === "dark" ? "Night Radar" : m === "satellite" ? "Satellite" : "Light OSM"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map + Inspector Layout */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Map Container */}
        <div className="relative h-[68vh] overflow-hidden rounded-xl border border-border bg-card shadow-inner">
          <MapContainer center={[25, 20]} zoom={2.5} minZoom={2} style={{ height: "100%", width: "100%" }} worldCopyJump>
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a> | OpenStreetMap'
              url={tileUrls[mapStyle]}
            />

            {/* Airports */}
            {airports.map((a) => (
              <Marker
                key={a.code}
                position={[a.lat, a.lon]}
                icon={airportIcon(a.status, a.code)}
                eventHandlers={{
                  click: () => {
                    setSelectedAirportCode(a.code);
                  }
                }}
              >
                <Popup>
                  <div className="font-sans text-xs">
                    <div className="font-bold text-sm text-foreground">{a.code} · {a.name}</div>
                    <div className="text-muted-foreground">{a.city}, {a.country}</div>
                    <div className="mt-2 space-y-1 rounded bg-muted/60 p-2 font-mono">
                      <div>Weather: <span className="font-bold uppercase">{a.weather}</span> (Wind: {a.wind_kts} kts)</div>
                      <div>Congestion: <span className="font-bold">{a.congestion}%</span></div>
                      <div>Runways: {a.runways} · Gates: {a.gates}</div>
                    </div>
                    <button
                      onClick={() => navigate({ to: "/ops/airports" })}
                      className="mt-2 block w-full rounded bg-sky-dark py-1 text-center font-semibold text-white hover:opacity-90"
                    >
                      Open Hub Ops Brief →
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Flight Route Polylines */}
            {filteredFlights.map((f) => {
              const o = airportByCode[f.origin], d = airportByCode[f.destination];
              if (!o || !d) return null;
              const isSelected = f.id === selectedFlightId;
              return (
                <Polyline
                  key={f.id + "-route"}
                  positions={[[o.lat, o.lon], [d.lat, d.lon]]}
                  pathOptions={{
                    color: isSelected ? "#38bdf8" : f.status === "delayed" ? "#f59e0b" : f.status === "in-flight" ? "#3DA5F5" : "#64748b",
                    weight: isSelected ? 3 : 1.5,
                    opacity: isSelected ? 0.9 : 0.45,
                    dashArray: f.status === "in-flight" ? undefined : "4 6",
                  }}
                  eventHandlers={{
                    click: () => setSelectedFlightId(f.id),
                  }}
                />
              );
            })}

            {/* Live Aircraft Positions */}
            {filteredFlights.filter((f) => f.current_lat && f.current_lon).map((f) => {
              const isSelected = f.id === selectedFlightId;
              return (
                <Marker
                  key={f.id}
                  position={[f.current_lat!, f.current_lon!]}
                  icon={planeIcon(f.status, f.flight_no, isSelected)}
                  eventHandlers={{
                    click: () => {
                      setSelectedFlightId(f.id);
                    }
                  }}
                >
                  <Popup>
                    <div className="font-sans text-xs">
                      <div className="font-bold text-sm text-foreground">{f.flight_no} · {f.aircraft_tail || "787-9"}</div>
                      <div className="text-muted-foreground">{f.origin} ✈ {f.destination}</div>
                      <div className="mt-1 font-mono text-[11px]">
                        Status: <span className="font-bold capitalize">{f.status}</span> {f.delay_minutes > 0 ? `(+${f.delay_minutes}m)` : ""}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Weather Storm Warning Convective Rings */}
            {airports.filter((a) => a.weather === "storm").map((a) => (
              <CircleMarker
                key={a.code + "-storm"}
                center={[a.lat, a.lon]}
                radius={38}
                pathOptions={{
                  color: "#ef4444",
                  fillColor: "#ef4444",
                  fillOpacity: 0.18,
                  weight: 1.5,
                  dashArray: "3 3",
                }}
              />
            ))}
          </MapContainer>

          {/* Map Compass & Quick Actions Overlay */}
          <div className="absolute bottom-3 left-3 z-[400] flex items-center gap-2 rounded-lg bg-background/90 p-2 shadow-lg backdrop-blur-md border border-border text-xs">
            <span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
              <Compass className="h-3.5 w-3.5 text-sky-accent" /> OCC RADAR FEED · 1090MHz ADS-B
            </span>
          </div>
        </div>

        {/* Flight Telemetry & OCC Controller Action Panel */}
        <aside className="flex flex-col rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-sky-accent" />
              <h3 className="font-display text-base font-bold">Flight Inspector</h3>
            </div>
            {selectedFlight && <StatusBadge status={selectedFlight.status} />}
          </div>

          {selectedFlight ? (
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div>
                <div className="font-display text-2xl font-bold tracking-tight text-foreground">{selectedFlight.flight_no}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span>{selectedFlight.origin}</span>
                  <span>→</span>
                  <span>{selectedFlight.destination}</span>
                  <span>·</span>
                  <span className="font-mono text-sky-accent">{selectedFlight.aircraft_tail || "SW-A004 (B787-9)"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-muted/40 p-2.5">
                  <span className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                    <Gauge className="h-3 w-3" /> Ground Speed
                  </span>
                  <div className="font-mono text-sm font-bold mt-0.5">492 kts</div>
                </div>
                <div className="rounded-lg bg-muted/40 p-2.5">
                  <span className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                    <Plane className="h-3 w-3" /> Altitude
                  </span>
                  <div className="font-mono text-sm font-bold mt-0.5">FL370 (37,000 ft)</div>
                </div>
                <div className="rounded-lg bg-muted/40 p-2.5">
                  <span className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> Pax Onboard
                  </span>
                  <div className="font-mono text-sm font-bold mt-0.5">246 pax (89%)</div>
                </div>
                <div className="rounded-lg bg-muted/40 p-2.5">
                  <span className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Delay Status
                  </span>
                  <div className={`font-mono text-sm font-bold mt-0.5 ${selectedFlight.delay_minutes > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                    {selectedFlight.delay_minutes > 0 ? `+${selectedFlight.delay_minutes} min` : "On-Time"}
                  </div>
                </div>
              </div>

              {/* Pilot & Gate Info */}
              <div className="rounded-lg border border-border p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Captain</span>
                  <span className="font-medium">{selectedFlight.captain || "Capt. Sarah Jenkins"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned Gate</span>
                  <span className="font-mono font-medium">{selectedFlight.gate || "Gate B14"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fuel Contingency</span>
                  <span className="font-mono font-medium text-emerald-600">+45 min (8,400 kg)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAcarsModal(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-sky-dark py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send ACARS to Cockpit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.success(`Opening AI Disruption Manager for ${selectedFlight.flight_no}`);
                    navigate({ to: "/ops/ai" });
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs font-medium hover:bg-muted transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-sky-gold" />
                  Disruption & Recovery Plan
                </button>
              </div>
            </div>
          ) : (
            <div className="grid flex-1 place-items-center text-xs text-muted-foreground text-center p-4">
              Select any aircraft or airport marker on the map to inspect live telemetry.
            </div>
          )}
        </aside>
      </div>

      {/* ACARS Uplink Modal */}
      {showAcarsModal && selectedFlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setShowAcarsModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sky-accent">
              <Radio className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">ACARS Flight Deck Telemetry</span>
            </div>
            <h2 className="mt-1 font-display text-xl">Uplink Message to {selectedFlight.flight_no}</h2>
            <p className="text-xs text-muted-foreground">Direct satellite datalink to aircraft cockpit ({selectedFlight.aircraft_tail || "SW-A004"}).</p>

            <form onSubmit={handleSendAcars} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Message Content</label>
                <textarea
                  rows={3}
                  value={acarsText}
                  onChange={(e) => setAcarsText(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 font-mono text-xs focus:border-sky-accent focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setShowAcarsModal(false)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                >
                  <Send className="h-3 w-3" /> Transmit Uplink
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

