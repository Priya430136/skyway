import React, { useState, useMemo } from "react";
import {
  ALL_AIRPORT_MAPS,
  AirportTerminalConfig,
  AmenityPoint,
  getAirportMapConfig,
} from "./terminal-data";
import { TerminalMapD3 } from "./TerminalMapD3";
import { toast } from "sonner";

interface TerminalGuideViewProps {
  initialAirportCode?: string;
  initialGate?: string;
  initialPnr?: string;
}

export function TerminalGuideView({
  initialAirportCode = "DEL",
  initialGate,
  initialPnr,
}: TerminalGuideViewProps) {
  const [selectedAirportId, setSelectedAirportId] = useState<string>(
    initialAirportCode.toUpperCase().includes("BOM")
      ? "BOM-T2"
      : initialAirportCode.toUpperCase().includes("DXB")
      ? "DXB-T3"
      : "DEL-T3"
  );

  const config: AirportTerminalConfig = useMemo(() => {
    return getAirportMapConfig(selectedAirportId);
  }, [selectedAirportId]);

  const [activeLevel, setActiveLevel] = useState<number>(config.defaultLevel);

  // Set default level when airport changes
  React.useEffect(() => {
    setActiveLevel(config.defaultLevel);
  }, [config]);

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedAmenity, setSelectedAmenity] = useState<AmenityPoint | null>(null);

  // Routing state
  const [startNodeId, setStartNodeId] = useState<string>("n-sec-digi");
  const [destinationAmenityId, setDestinationAmenityId] = useState<string | null>(
    config.amenities.find((a) => a.gateNumber === (initialGate || config.myFlight?.gate))?.id ||
      config.amenities[0]?.id ||
      null
  );
  const [wheelchairAccessible, setWheelchairAccessible] = useState<boolean>(false);
  const [routeInfo, setRouteInfo] = useState<{
    distanceMeters: number;
    walkTimeMin: number;
    waypoints: string[];
  } | null>(null);

  const activeGate = initialGate || config.myFlight?.gate || "14A";

  // Categories config
  const categories = [
    { id: "all", label: "All POIs", icon: "📍" },
    { id: "gate", label: "Gates", icon: "🚪" },
    { id: "security", label: "Security & DigiYatra", icon: "🛡️" },
    { id: "lounge", label: "Lounges", icon: "👑" },
    { id: "dining", label: "Food & Drinks", icon: "☕" },
    { id: "shopping", label: "Duty Free & Shops", icon: "🛍️" },
    { id: "water_power", label: "Water & Power", icon: "💧" },
    { id: "services", label: "Restrooms & Care", icon: "🚻" },
  ];

  const handleSelectAmenityFromList = (amenity: AmenityPoint) => {
    setSelectedAmenity(amenity);
    setDestinationAmenityId(amenity.id);
    if (amenity.level !== activeLevel) {
      setActiveLevel(amenity.level);
    }
  };

  const handleRouteToAmenity = (amenity: AmenityPoint) => {
    setDestinationAmenityId(amenity.id);
    setSelectedAmenity(amenity);
    if (amenity.level !== activeLevel) {
      setActiveLevel(amenity.level);
    }
    toast.success(`Navigation path set to ${amenity.name}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Airport Switcher & Flight HUD */}
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent/10 px-3 py-1 font-mono text-xs font-semibold text-accent">
              Live Terminal Wayfinding
            </span>
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-time Queue Sensors Active
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            {config.airportName} · {config.terminalName}
          </h1>
          <p className="text-sm text-foreground/65">
            Interactive D3 indoor map, security wait-times, duty free locator, and step-by-step gate guidance.
          </p>
        </div>

        {/* Airport Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {ALL_AIRPORT_MAPS.map((map) => (
            <button
              key={map.id}
              onClick={() => {
                setSelectedAirportId(map.id);
                setSelectedAmenity(null);
                setDestinationAmenityId(null);
                toast.info(`Switched to ${map.airportCode} ${map.terminalName}`);
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                selectedAirportId === map.id
                  ? "bg-accent text-white shadow-md"
                  : "border border-border bg-background hover:bg-muted text-foreground/75"
              }`}
            >
              <span className="font-mono">{map.airportCode}</span>
              <span>{map.city}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Flight Gate Highlight Banner */}
      {config.myFlight && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-xl font-bold text-amber-600 dark:text-amber-300">
              ✈️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-bold">
                  Flight {config.myFlight.flightNumber} · {config.myFlight.route}
                </span>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  {config.myFlight.status}
                </span>
              </div>
              <div className="text-xs text-foreground/70">
                Departure {config.myFlight.depTime} · Boarding at <span className="font-bold text-foreground">{config.myFlight.boardingTime}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-border bg-background/80 px-4 py-2 text-center backdrop-blur-sm">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/55">
                Assigned Gate
              </div>
              <div className="font-mono text-xl font-bold text-accent">
                Gate {config.myFlight.gate}
              </div>
            </div>

            <button
              onClick={() => {
                const myGateAmenity = config.amenities.find((a) => a.gateNumber === config.myFlight?.gate || a.id === "gate-14a");
                if (myGateAmenity) {
                  handleRouteToAmenity(myGateAmenity);
                }
              }}
              className="flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-xs font-semibold text-white shadow-sm hover:opacity-95"
            >
              <span>🧭</span>
              Route to Gate {config.myFlight.gate}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Layout: Map Canvas + Interactive Sidecards */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_390px]">
        {/* Left / Center Map Section */}
        <div className="space-y-4">
          {/* Controls Bar: Levels, Category Filters & Search */}
          <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
            {/* Level Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground/60">Floor Level:</span>
                <div className="flex flex-wrap gap-1.5">
                  {config.levels.map((lvl) => (
                    <button
                      key={lvl.level}
                      onClick={() => {
                        setActiveLevel(lvl.level);
                        toast.info(`Switched to ${lvl.name}`);
                      }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        activeLevel === lvl.level
                          ? "bg-foreground text-background"
                          : "border border-border bg-muted/40 hover:bg-muted text-foreground/70"
                      }`}
                    >
                      {lvl.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accessible Route Toggle */}
              <button
                onClick={() => {
                  setWheelchairAccessible((prev) => !prev);
                  toast.info(
                    !wheelchairAccessible
                      ? "Wheelchair accessible & step-free routing activated"
                      : "Standard walking routes activated"
                  );
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  wheelchairAccessible
                    ? "bg-sky-500/15 text-sky-600 border border-sky-500/30 dark:text-sky-300"
                    : "border border-border text-foreground/65 hover:bg-muted"
                }`}
              >
                <span>♿</span>
                <span>Step-free / Elevator route</span>
                {wheelchairAccessible && <span className="font-bold">✓</span>}
              </button>
            </div>

            {/* Search Input & Category Filters */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-foreground/45">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search gates, Starbucks, lounges, restrooms, power..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-8 text-xs outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-foreground/50 hover:text-foreground"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategoryFilter(c.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                      categoryFilter === c.id
                        ? "bg-accent/15 text-accent border border-accent/30 font-semibold"
                        : "border border-border/80 text-foreground/70 hover:bg-muted"
                    }`}
                  >
                    <span>{c.icon}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* D3 Map Canvas Component */}
          <div className="h-[620px] w-full">
            <TerminalMapD3
              config={config}
              activeLevel={activeLevel}
              selectedAmenityId={selectedAmenity?.id || destinationAmenityId}
              highlightGate={activeGate}
              filterCategory={categoryFilter}
              searchQuery={searchQuery}
              startNodeId={startNodeId}
              destinationAmenityId={destinationAmenityId}
              wheelchairAccessible={wheelchairAccessible}
              onSelectAmenity={(amenity) => {
                setSelectedAmenity(amenity);
                setDestinationAmenityId(amenity.id);
              }}
              onRouteCalculated={(info) => setRouteInfo(info)}
            />
          </div>

          {/* Security Wait Times Live Radar */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🛡️</span>
                <h3 className="text-sm font-semibold">Live Security & Checkpoint Wait Times</h3>
              </div>
              <span className="font-mono text-[11px] text-foreground/50">Updated 30s ago</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {config.securityLanes.map((sec) => {
                const isSmooth = sec.status === "smooth";
                const isMod = sec.status === "moderate";
                return (
                  <div
                    key={sec.id}
                    onClick={() => {
                      setStartNodeId(`n-${sec.id.replace("amenity-", "")}`);
                      toast.info(`Starting navigation point set to ${sec.name}`);
                    }}
                    className="cursor-pointer rounded-xl border border-border bg-background p-3.5 transition-all hover:border-accent hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground/85 truncate">
                        {sec.name.split("(")[0]}
                      </span>
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          isSmooth ? "bg-emerald-500" : isMod ? "bg-amber-500" : "bg-rose-500"
                        }`}
                      />
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="font-display text-2xl font-bold">{sec.currentWaitMin}</span>
                      <span className="text-xs text-foreground/60">min wait</span>
                    </div>
                    <div className="mt-1 text-[10px] text-foreground/55">
                      {sec.openLanes} of {sec.totalLanes} lanes open
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Wayfinding Directions, Details Card & POI Explorer */}
        <div className="space-y-4">
          {/* Active Wayfinding Route Card */}
          {destinationAmenityId && routeInfo && (
            <div className="rounded-2xl border border-accent/40 bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    🧭
                  </span>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
                      Turn-by-Turn Route
                    </h3>
                    <div className="text-sm font-semibold truncate max-w-[200px]">
                      {config.amenities.find((a) => a.id === destinationAmenityId)?.name || "Destination"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setDestinationAmenityId(null)}
                  className="rounded-lg p-1 text-foreground/45 hover:bg-muted hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              {/* Walking Stats */}
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-border bg-background p-3.5 text-center">
                <div>
                  <div className="text-[10px] uppercase font-semibold text-foreground/55">
                    Est. Walk Time
                  </div>
                  <div className="mt-0.5 font-display text-2xl font-bold text-accent">
                    {routeInfo.walkTimeMin} min
                  </div>
                  <div className="text-[10px] text-foreground/50">at normal pace (4.8 km/h)</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-foreground/55">
                    Distance
                  </div>
                  <div className="mt-0.5 font-display text-2xl font-bold">
                    {routeInfo.distanceMeters} m
                  </div>
                  <div className="text-[10px] text-foreground/50">
                    {wheelchairAccessible ? "Elevators only" : "Flat corridors"}
                  </div>
                </div>
              </div>

              {/* Step-by-Step Directions */}
              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">
                    1
                  </span>
                  <div>
                    <div className="font-semibold">Start at Security Screening</div>
                    <div className="text-foreground/60">
                      Clear DigiYatra / FastTrack lanes onto Level {activeLevel}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                    2
                  </span>
                  <div>
                    <div className="font-semibold">Walk through Central Duty Free Plaza</div>
                    <div className="text-foreground/60">
                      Head straight towards Concourse {activeGate.startsWith("14") || activeGate.startsWith("B") ? "B" : "A/C"} corridors
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                    3
                  </span>
                  <div>
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Arrive at {config.amenities.find((a) => a.id === destinationAmenityId)?.name}
                    </div>
                    <div className="text-foreground/60">
                      Located near Gate {config.amenities.find((a) => a.id === destinationAmenityId)?.nearGate || activeGate}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      `Directions to ${config.amenities.find((a) => a.id === destinationAmenityId)?.name}: ${routeInfo.distanceMeters}m walk (${routeInfo.walkTimeMin} min)`
                    );
                    toast.success("Walking directions copied to clipboard");
                  }}
                  className="flex-1 rounded-xl border border-border bg-background py-2 text-xs font-semibold hover:bg-muted"
                >
                  📋 Copy Steps
                </button>
                <button
                  onClick={() => {
                    toast.success("Live navigation started on your mobile device");
                  }}
                  className="flex-1 rounded-xl bg-accent py-2 text-xs font-semibold text-white hover:opacity-90"
                >
                  🚀 Start Walking
                </button>
              </div>
            </div>
          )}

          {/* Selected Amenity / Gate Full Detail Drawer */}
          {selectedAmenity ? (
            <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-2xl shadow-inner">
                    {selectedAmenity.icon}
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold leading-snug">
                      {selectedAmenity.name}
                    </h3>
                    <div className="text-xs text-foreground/60 capitalize">
                      {selectedAmenity.category.replace("_", " & ")} · Level {selectedAmenity.level}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAmenity(null)}
                  className="rounded-lg p-1 text-foreground/45 hover:bg-muted hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs leading-relaxed text-foreground/75">
                {selectedAmenity.description}
              </p>

              {/* Key Attributes */}
              <div className="space-y-2 rounded-xl border border-border bg-background p-3 text-xs">
                {selectedAmenity.nearGate && (
                  <div className="flex justify-between">
                    <span className="text-foreground/60">Nearest Gate:</span>
                    <span className="font-medium text-foreground">{selectedAmenity.nearGate}</span>
                  </div>
                )}
                {selectedAmenity.openingHours && (
                  <div className="flex justify-between">
                    <span className="text-foreground/60">Hours:</span>
                    <span className="font-medium text-foreground">{selectedAmenity.openingHours}</span>
                  </div>
                )}
                {selectedAmenity.rating && (
                  <div className="flex justify-between">
                    <span className="text-foreground/60">Passenger Rating:</span>
                    <span className="font-semibold text-amber-500">★ {selectedAmenity.rating} / 5.0</span>
                  </div>
                )}
                {selectedAmenity.priceRange && (
                  <div className="flex justify-between">
                    <span className="text-foreground/60">Price Range:</span>
                    <span className="font-medium text-foreground">{selectedAmenity.priceRange}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-foreground/60">Wheelchair Accessible:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {selectedAmenity.accessible ? "✓ Yes (Full Ramp & E-Cart Access)" : "Stairs required"}
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {selectedAmenity.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-lg bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground/75"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleRouteToAmenity(selectedAmenity)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-accent py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-95"
                >
                  <span>🧭</span>
                  <span>Navigate Here</span>
                </button>
                <button
                  onClick={() => {
                    toast.success(`${selectedAmenity.name} saved to your trip checklist`);
                  }}
                  className="rounded-xl border border-border px-3 py-2.5 text-xs hover:bg-muted"
                >
                  ⭐ Save
                </button>
              </div>
            </div>
          ) : (
            /* Directory Explorer when nothing selected */
            <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  Terminal Directory ({config.amenities.filter((a) => a.level === activeLevel).length} Places)
                </h3>
                <span className="text-[11px] text-foreground/50">Level {activeLevel}</span>
              </div>

              <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
                {config.amenities
                  .filter((a) => a.level === activeLevel)
                  .map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectAmenityFromList(item)}
                      className="group flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background p-3 transition-all hover:border-accent/40 hover:bg-accent/[0.02]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm">
                          {item.icon}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold group-hover:text-accent">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-foreground/55 capitalize">
                            {item.category.replace("_", " & ")} {item.nearGate ? `· Near Gate ${item.nearGate}` : ""}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRouteToAmenity(item);
                        }}
                        className="rounded-lg bg-muted px-2 py-1 text-[10px] font-semibold text-foreground/75 group-hover:bg-accent group-hover:text-white"
                      >
                        Route →
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
