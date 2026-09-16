import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup,
  Sphere,
  Graticule,
} from "react-simple-maps";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plane,
  Navigation,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Clock,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  Sun,
  Moon,
  Info,
  Play,
  Pause,
  Compass,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Standard CDN URL for world TopoJSON
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export interface FlightRouteItem {
  id: string;
  pnr?: string;
  flightNumber: string;
  aircraft: string;
  originCode: string;
  originCity: string;
  originCountry?: string;
  destinationCode: string;
  destinationCity: string;
  destinationCountry?: string;
  departureDate: string;
  departureTime: string;
  arrivalDate?: string;
  arrivalTime: string;
  duration: string;
  seat?: string;
  cabinClass?: string;
  status: string;
  isUpcoming?: boolean;
  milesEarn?: number;
}

// Master coordinates for major hubs & regional destinations
export const AIRPORT_COORDINATES: Record<
  string,
  {
    name: string;
    city: string;
    country: string;
    coordinates: [number, number]; // [longitude, latitude] for D3 / react-simple-maps
    temp?: string;
    weather?: string;
    runway?: string;
    elevation?: string;
  }
> = {
  DEL: {
    name: "Indira Gandhi International",
    city: "New Delhi",
    country: "India",
    coordinates: [77.1000, 28.5562],
    temp: "29°C",
    weather: "Sunny / Clear",
    runway: "11/29 & 10/28",
    elevation: "777 ft",
  },
  BOM: {
    name: "Chhatrapati Shivaji Maharaj",
    city: "Mumbai",
    country: "India",
    coordinates: [72.8656, 19.0896],
    temp: "31°C",
    weather: "Partly Cloudy",
    runway: "09/27 & 14/32",
    elevation: "39 ft",
  },
  BLR: {
    name: "Kempegowda International",
    city: "Bengaluru",
    country: "India",
    coordinates: [77.7066, 13.1986],
    temp: "26°C",
    weather: "Pleasant Breeze",
    runway: "09L/27R",
    elevation: "3,000 ft",
  },
  DXB: {
    name: "Dubai International",
    city: "Dubai",
    country: "UAE",
    coordinates: [55.3657, 25.2532],
    temp: "36°C",
    weather: "Clear Skies",
    runway: "12L/30R",
    elevation: "62 ft",
  },
  SIN: {
    name: "Singapore Changi",
    city: "Singapore",
    country: "Singapore",
    coordinates: [103.9915, 1.3644],
    temp: "30°C",
    weather: "Humid / Tropical",
    runway: "02L/20R",
    elevation: "22 ft",
  },
  GOI: {
    name: "Dabolim International",
    city: "Goa",
    country: "India",
    coordinates: [73.8314, 15.3808],
    temp: "28°C",
    weather: "Sunny",
    runway: "08/26",
    elevation: "184 ft",
  },
  HYD: {
    name: "Rajiv Gandhi International",
    city: "Hyderabad",
    country: "India",
    coordinates: [78.4294, 17.2403],
    temp: "30°C",
    weather: "Scattered Clouds",
    runway: "09L/27R",
    elevation: "2,024 ft",
  },
  MAA: {
    name: "Chennai International",
    city: "Chennai",
    country: "India",
    coordinates: [80.1709, 12.9941],
    temp: "32°C",
    weather: "Coastal Haze",
    runway: "07/25",
    elevation: "52 ft",
  },
  CCU: {
    name: "Netaji Subhash Chandra Bose",
    city: "Kolkata",
    country: "India",
    coordinates: [88.4467, 22.6547],
    temp: "30°C",
    weather: "Partly Cloudy",
    runway: "01L/19R",
    elevation: "16 ft",
  },
  BKK: {
    name: "Suvarnabhumi Airport",
    city: "Bangkok",
    country: "Thailand",
    coordinates: [100.7501, 13.6900],
    temp: "33°C",
    weather: "Humid / Fair",
    runway: "01R/19L",
    elevation: "5 ft",
  },
  DOH: {
    name: "Hamad International",
    city: "Doha",
    country: "Qatar",
    coordinates: [51.6081, 25.2731],
    temp: "35°C",
    weather: "Sunny / Hot",
    runway: "16L/34R",
    elevation: "13 ft",
  },
  LHR: {
    name: "London Heathrow",
    city: "London",
    country: "United Kingdom",
    coordinates: [-0.4543, 51.4700],
    temp: "19°C",
    weather: "Overcast",
    runway: "09L/27R",
    elevation: "83 ft",
  },
  JFK: {
    name: "John F. Kennedy International",
    city: "New York",
    country: "USA",
    coordinates: [-73.7781, 40.6413],
    temp: "22°C",
    weather: "Fair",
    runway: "04L/22R",
    elevation: "13 ft",
  },
};

// Calculate Haversine distance in nautical miles & kilometers
function calculateDistance(
  coord1: [number, number],
  coord2: [number, number]
): { nm: number; km: number } {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = Math.round(R * c);
  const nm = Math.round(km * 0.539957);
  return { nm, km };
}

// Calculate intermediate point on sphere/linear for animated plane
function interpolateCoordinates(
  from: [number, number],
  to: [number, number],
  progress: number // 0 to 1
): [number, number] {
  const lng = from[0] + (to[0] - from[0]) * progress;
  const lat = from[1] + (to[1] - from[1]) * progress;
  return [lng, lat];
}

// Calculate compass heading angle (degrees)
function calculateHeading(
  from: [number, number],
  to: [number, number]
): number {
  const [lon1, lat1] = from;
  const [lon2, lat2] = to;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export interface FlightRouteMapProps {
  upcomingFlights?: FlightRouteItem[];
  pastFlights?: FlightRouteItem[];
  className?: string;
  defaultSelectedId?: string;
}

export function FlightRouteMap({
  upcomingFlights = [],
  pastFlights = [],
  className,
  defaultSelectedId,
}: FlightRouteMapProps) {
  // Combine all flights
  const allRoutes = useMemo(() => {
    return [
      ...upcomingFlights.map((f) => ({ ...f, isUpcoming: true })),
      ...pastFlights.map((f) => ({ ...f, isUpcoming: false })),
    ];
  }, [upcomingFlights, pastFlights]);

  // Selected Flight ID ("all-upcoming", "all-routes", or specific flight id)
  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    defaultSelectedId || (upcomingFlights[0]?.id || "all-upcoming")
  );

  // Map Controls State
  const [mapTheme, setMapTheme] = useState<"dark" | "light">("dark");
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [76, 21], // Centered around Indian subcontinent / Middle East
    zoom: 2.4,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAllWaypoints, setShowAllWaypoints] = useState(true);
  const [activeAirportModal, setActiveAirportModal] = useState<string | null>(null);

  // Flight Simulation Animation State
  const [simProgress, setSimProgress] = useState<number>(0.45);
  const [isPlayingSim, setIsPlayingSim] = useState<boolean>(true);
  const simRef = useRef<number | null>(null);

  // Active selected route object
  const activeRoute = useMemo(() => {
    if (selectedRouteId === "all-upcoming" || selectedRouteId === "all-routes") {
      return null;
    }
    return allRoutes.find((r) => r.id === selectedRouteId) || null;
  }, [selectedRouteId, allRoutes]);

  // Determine filtered flights to render
  const routesToRender = useMemo(() => {
    if (selectedRouteId === "all-upcoming") {
      return allRoutes.filter((r) => r.isUpcoming);
    }
    if (selectedRouteId === "all-routes") {
      return allRoutes;
    }
    if (activeRoute) {
      return [activeRoute];
    }
    return allRoutes.filter((r) => r.isUpcoming);
  }, [selectedRouteId, allRoutes, activeRoute]);

  // Auto-center map when active route changes
  useEffect(() => {
    if (activeRoute) {
      const orig = AIRPORT_COORDINATES[activeRoute.originCode]?.coordinates;
      const dest = AIRPORT_COORDINATES[activeRoute.destinationCode]?.coordinates;
      if (orig && dest) {
        const centerLng = (orig[0] + dest[0]) / 2;
        const centerLat = (orig[1] + dest[1]) / 2;
        const dist = calculateDistance(orig, dest);
        const autoZoom = dist.km > 3000 ? 1.8 : dist.km > 1500 ? 2.6 : 3.4;
        setPosition({
          coordinates: [centerLng, centerLat],
          zoom: autoZoom,
        });
      }
    } else {
      // Default subcontinent / global view
      setPosition({ coordinates: [76, 21], zoom: 2.4 });
    }
  }, [activeRoute]);

  // Play flight progress loop
  useEffect(() => {
    if (!isPlayingSim) return;
    const interval = setInterval(() => {
      setSimProgress((prev) => {
        if (prev >= 1) return 0;
        return prev + 0.006;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [isPlayingSim]);

  // Zoom helpers
  const handleZoomIn = () => {
    setPosition((pos) => ({
      ...pos,
      zoom: Math.min(pos.zoom * 1.4, 8),
    }));
  };

  const handleZoomOut = () => {
    setPosition((pos) => ({
      ...pos,
      zoom: Math.max(pos.zoom / 1.4, 1),
    }));
  };

  const handleReset = () => {
    setPosition({ coordinates: [76, 21], zoom: 2.4 });
  };

  // Collect unique airport codes present in rendered routes
  const activeAirportCodes = useMemo(() => {
    const set = new Set<string>();
    routesToRender.forEach((r) => {
      set.add(r.originCode);
      set.add(r.destinationCode);
    });
    return Array.from(set);
  }, [routesToRender]);

  // Stats calculation for the selected flight
  const flightStats = useMemo(() => {
    if (!activeRoute) return null;
    const orig = AIRPORT_COORDINATES[activeRoute.originCode]?.coordinates || [77, 28];
    const dest = AIRPORT_COORDINATES[activeRoute.destinationCode]?.coordinates || [72, 19];
    const dist = calculateDistance(orig, dest);
    const heading = Math.round(calculateHeading(orig, dest));
    const currentPlaneCoord = interpolateCoordinates(orig, dest, simProgress);

    return {
      distanceNm: dist.nm,
      distanceKm: dist.km,
      heading,
      currentPlaneCoord,
      cruiseAltitude: "36,000 FT",
      groundSpeed: "480 KTS (890 KM/H)",
      etaProgressPercent: Math.round(simProgress * 100),
    };
  }, [activeRoute, simProgress]);

  const isDark = mapTheme === "dark";

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-3xl border transition-all duration-300 shadow-xl",
        isDark
          ? "border-slate-800 bg-slate-950 text-slate-100"
          : "border-slate-200 bg-slate-50 text-slate-900",
        isFullscreen && "fixed inset-0 z-50 rounded-none border-none",
        className
      )}
    >
      {/* 1. Header Toolbar */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 border-b p-4 backdrop-blur-md",
          isDark
            ? "border-slate-800/80 bg-slate-900/90"
            : "border-slate-200 bg-white/90"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
            <Plane className="h-5 w-5 rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black tracking-tight">
                SkyWay Interactive Flight Corridor
              </h3>
              <Badge
                className={cn(
                  "text-[10px] font-mono font-bold uppercase",
                  isDark
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                )}
              >
                <Compass className="mr-1 h-3 w-3 animate-spin duration-1000" />
                Live Arc Projection
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive geodesic radar paths for upcoming and past airline journeys
            </p>
          </div>
        </div>

        {/* View Selection & Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Route Selector Dropdown Buttons */}
          <div
            className={cn(
              "flex items-center rounded-xl p-1 border",
              isDark
                ? "bg-slate-900 border-slate-800"
                : "bg-slate-100 border-slate-200"
            )}
          >
            <button
              onClick={() => setSelectedRouteId("all-upcoming")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-bold transition-all",
                selectedRouteId === "all-upcoming"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              All Upcoming ({upcomingFlights.length})
            </button>
            <button
              onClick={() => setSelectedRouteId("all-routes")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-bold transition-all",
                selectedRouteId === "all-routes"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              Full Network ({allRoutes.length})
            </button>
          </div>

          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMapTheme(isDark ? "light" : "dark")}
            className={cn(
              "h-8 w-8 rounded-xl p-0",
              isDark
                ? "border-slate-800 bg-slate-900 text-amber-400 hover:bg-slate-800"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            )}
            title="Toggle Map Style"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={cn(
              "h-8 w-8 rounded-xl p-0",
              isDark
                ? "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            )}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* 2. Interactive Route Carousel / Selector Pill Bar */}
      <div
        className={cn(
          "flex items-center gap-2 overflow-x-auto px-4 py-2 border-b no-scrollbar",
          isDark
            ? "border-slate-800/60 bg-slate-950/80"
            : "border-slate-200/80 bg-slate-100/70"
        )}
      >
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
          Select Route:
        </span>
        {allRoutes.map((route) => {
          const isSelected = selectedRouteId === route.id;
          return (
            <button
              key={route.id}
              onClick={() => setSelectedRouteId(route.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all border",
                isSelected
                  ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30"
                  : isDark
                  ? "bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              )}
            >
              <span className="font-mono text-[11px]">{route.flightNumber}</span>
              <span className="text-slate-400">&bull;</span>
              <span>
                {route.originCode} &rarr; {route.destinationCode}
              </span>
              {route.isUpcoming ? (
                <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] text-emerald-400 font-extrabold">
                  Upcoming
                </span>
              ) : (
                <span className="rounded-full bg-slate-500/20 px-1.5 py-0.2 text-[9px] text-slate-400">
                  Past
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Main Map Canvas Stage */}
      <div className="relative flex-1 min-h-[380px] sm:min-h-[460px] bg-gradient-to-b from-slate-950 to-slate-900 select-none overflow-hidden">
        {/* Floating Flight Telemetry HUD overlay if single route selected */}
        {activeRoute && flightStats && (
          <div
            className={cn(
              "absolute left-4 top-4 z-20 w-72 sm:w-80 rounded-2xl border p-4 backdrop-blur-xl shadow-2xl transition-all",
              isDark
                ? "border-slate-700/80 bg-slate-900/90 text-white"
                : "border-slate-200/90 bg-white/95 text-slate-900"
            )}
          >
            {/* Top row */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/40 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black tracking-tight text-blue-400">
                  {activeRoute.flightNumber}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold border-blue-400/40 text-blue-300"
                >
                  {activeRoute.cabinClass || "Business"}
                </Badge>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {activeRoute.departureDate}
              </span>
            </div>

            {/* City corridor */}
            <div className="mt-3 flex items-center justify-between">
              <div>
                <div className="font-mono text-xl font-black">{activeRoute.originCode}</div>
                <div className="text-[11px] text-slate-400">{activeRoute.originCity}</div>
                <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                  DEP {activeRoute.departureTime}
                </div>
              </div>

              <div className="flex flex-col items-center px-2">
                <span className="text-[10px] font-bold text-blue-400">
                  {activeRoute.duration}
                </span>
                <div className="relative my-1 flex items-center w-16">
                  <div className="h-[2px] w-full bg-blue-500/40" />
                  <Plane className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-400 rotate-90" />
                </div>
                <span className="font-mono text-[9px] text-slate-400">
                  {flightStats.distanceKm} KM ({flightStats.distanceNm} NM)
                </span>
              </div>

              <div className="text-right">
                <div className="font-mono text-xl font-black">
                  {activeRoute.destinationCode}
                </div>
                <div className="text-[11px] text-slate-400">
                  {activeRoute.destinationCity}
                </div>
                <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                  ARR {activeRoute.arrivalTime}
                </div>
              </div>
            </div>

            {/* Simulation Progress & Aircraft telemetry */}
            <div className="mt-3 rounded-xl bg-slate-800/50 p-2.5 dark:bg-slate-950/60 border border-slate-700/30">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                <span className="flex items-center gap-1">
                  <Plane className="h-3 w-3 text-amber-400" />
                  {activeRoute.aircraft}
                </span>
                <span className="font-mono text-blue-300">
                  HDG {flightStats.heading}° &bull; FL360
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => setIsPlayingSim(!isPlayingSim)}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-500"
                >
                  {isPlayingSim ? (
                    <Pause className="h-2.5 w-2.5" />
                  ) : (
                    <Play className="h-2.5 w-2.5 fill-white" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={simProgress}
                  onChange={(e) => setSimProgress(parseFloat(e.target.value))}
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-700 accent-blue-500"
                />
                <span className="font-mono text-[10px] font-bold text-amber-400">
                  {flightStats.etaProgressPercent}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Map Canvas with react-simple-maps */}
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 220,
            center: [76, 21],
          }}
          className="h-full w-full outline-none cursor-grab active:cursor-grabbing"
          style={{ width: "100%", height: "100%", maxHeight: "560px" }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={(pos) => setPosition(pos)}
          >
            {/* Graticule & Globe sphere */}
            <Graticule
              stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"}
              strokeWidth={0.5}
            />

            {/* World Geographies */}
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const isHighlighted =
                    geo.properties?.name === "India" ||
                    geo.properties?.name === "United Arab Emirates" ||
                    geo.properties?.name === "Singapore" ||
                    geo.properties?.name === "Thailand" ||
                    geo.properties?.name === "Qatar";

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      style={{
                        default: {
                          fill: isHighlighted
                            ? isDark
                              ? "#1e293b"
                              : "#e2e8f0"
                            : isDark
                            ? "#0f172a"
                            : "#f1f5f9",
                          stroke: isDark ? "#334155" : "#cbd5e1",
                          strokeWidth: 0.6,
                          outline: "none",
                        },
                        hover: {
                          fill: isDark ? "#334155" : "#cbd5e1",
                          stroke: isDark ? "#64748b" : "#94a3b8",
                          strokeWidth: 0.8,
                          outline: "none",
                        },
                        pressed: {
                          fill: "#1e3a8a",
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* Flight Route Arcs (Lines) */}
            {routesToRender.map((route) => {
              const orig = AIRPORT_COORDINATES[route.originCode]?.coordinates;
              const dest = AIRPORT_COORDINATES[route.destinationCode]?.coordinates;
              if (!orig || !dest) return null;

              const isSelected = activeRoute?.id === route.id;

              return (
                <g key={`route-${route.id}`}>
                  {/* Subtle outer glow on selected path */}
                  {isSelected && (
                    <Line
                      from={orig}
                      to={dest}
                      stroke="rgba(59, 130, 246, 0.35)"
                      strokeWidth={6}
                      strokeLinecap="round"
                    />
                  )}

                  {/* Main Route Arc */}
                  <Line
                    from={orig}
                    to={dest}
                    stroke={
                      isSelected
                        ? "#38bdf8"
                        : route.isUpcoming
                        ? "#3b82f6"
                        : "#94a3b8"
                    }
                    strokeWidth={isSelected ? 2.5 : 1.8}
                    strokeDasharray={isSelected ? undefined : "4 3"}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </g>
              );
            })}

            {/* Active Flight Animated Plane Marker */}
            {activeRoute && flightStats && (
              <Marker coordinates={flightStats.currentPlaneCoord}>
                <g transform={`rotate(${flightStats.heading})`}>
                  {/* Radar pulse ripple */}
                  <circle r={9} fill="rgba(251, 191, 36, 0.25)" className="animate-ping" />
                  <circle r={5} fill="#f59e0b" stroke="#ffffff" strokeWidth={1.5} />
                  {/* Mini Plane Icon */}
                  <path
                    d="M0,-8 L2,-2 L7,1 L7,3 L2,2 L1,6 L3,8 L3,9 L0,8.5 L-3,9 L-3,8 L-1,6 L-2,2 L-7,3 L-7,1 L-2,-2 Z"
                    fill="#0f172a"
                    stroke="#ffffff"
                    strokeWidth={0.6}
                  />
                </g>
              </Marker>
            )}

            {/* Airport Hub Markers */}
            {activeAirportCodes.map((code) => {
              const info = AIRPORT_COORDINATES[code];
              if (!info) return null;

              const isConnectedToActive =
                activeRoute?.originCode === code ||
                activeRoute?.destinationCode === code;

              return (
                <Marker
                  key={`airport-${code}`}
                  coordinates={info.coordinates}
                  onClick={() => setActiveAirportModal(code)}
                  className="cursor-pointer transition-transform hover:scale-125"
                >
                  {/* Ping Animation for Origin/Destination */}
                  {isConnectedToActive && (
                    <circle
                      r={7}
                      fill="rgba(59, 130, 246, 0.4)"
                      className="animate-ping"
                    />
                  )}

                  {/* Marker Dot */}
                  <circle
                    r={isConnectedToActive ? 4.5 : 3.5}
                    fill={isConnectedToActive ? "#38bdf8" : "#f8fafc"}
                    stroke={isConnectedToActive ? "#0284c7" : "#475569"}
                    strokeWidth={1.5}
                  />

                  {/* Airport IATA Code Badge Label */}
                  <text
                    textAnchor="middle"
                    y={-8}
                    style={{
                      fontFamily: "monospace",
                      fontSize: isConnectedToActive ? "9px" : "8px",
                      fontWeight: "900",
                      fill: isConnectedToActive
                        ? "#38bdf8"
                        : isDark
                        ? "#e2e8f0"
                        : "#0f172a",
                      textShadow: isDark
                        ? "0px 1px 3px rgba(0,0,0,0.9)"
                        : "0px 1px 2px rgba(255,255,255,0.9)",
                    }}
                  >
                    {code}
                  </text>
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* Zoom & Navigation Floating Controls (Bottom Right) */}
        <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5 rounded-2xl border border-slate-700/60 bg-slate-900/90 p-1.5 backdrop-blur-md shadow-xl">
          <button
            onClick={handleZoomIn}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <div className="h-[1px] bg-slate-800 my-0.5" />
          <button
            onClick={handleReset}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
            title="Reset Map Center"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Airport Quick Info Popover (Bottom Left) */}
        {activeAirportModal && AIRPORT_COORDINATES[activeAirportModal] && (
          <div
            className={cn(
              "absolute bottom-4 left-4 z-20 max-w-xs rounded-2xl border p-3.5 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200",
              isDark
                ? "border-slate-700 bg-slate-900/95 text-white"
                : "border-slate-200 bg-white/95 text-slate-900"
            )}
          >
            <div className="flex items-center justify-between pb-1 border-b border-slate-700/40">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black text-blue-400">
                  {activeAirportModal}
                </span>
                <span className="text-xs font-bold">
                  {AIRPORT_COORDINATES[activeAirportModal].city}
                </span>
              </div>
              <button
                onClick={() => setActiveAirportModal(null)}
                className="text-xs text-slate-400 hover:text-white px-1"
              >
                ✕
              </button>
            </div>
            <div className="mt-2 text-[11px] text-slate-300">
              <p className="font-medium text-slate-400">
                {AIRPORT_COORDINATES[activeAirportModal].name}
              </p>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-[10px]">
                <div className="rounded-lg bg-slate-800/60 p-1.5">
                  <span className="text-slate-500 block">Weather</span>
                  <span className="font-bold text-amber-300">
                    {AIRPORT_COORDINATES[activeAirportModal].temp} &bull; {AIRPORT_COORDINATES[activeAirportModal].weather}
                  </span>
                </div>
                <div className="rounded-lg bg-slate-800/60 p-1.5">
                  <span className="text-slate-500 block">Active Runway</span>
                  <span className="font-mono font-bold text-blue-300">
                    {AIRPORT_COORDINATES[activeAirportModal].runway}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Metric Strip */}
      <div
        className={cn(
          "grid grid-cols-2 sm:grid-cols-4 gap-2 border-t p-3 text-xs",
          isDark
            ? "border-slate-800/80 bg-slate-900/90 text-slate-300"
            : "border-slate-200 bg-white text-slate-700"
        )}
      >
        <div className="flex items-center gap-2 px-2">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span>
            Upcoming Routes: <strong>{upcomingFlights.length}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 px-2">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-400" />
          <span>
            Flown History: <strong>{pastFlights.length} Paths</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 px-2">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>
            Primary Hub: <strong>DEL / BOM</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 px-2">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>
            Arc Projection: <strong>Mercator Geodesic</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

export default FlightRouteMap;
