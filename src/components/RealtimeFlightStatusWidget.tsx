import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Plane,
  Clock,
  MapPin,
  RefreshCw,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Bell,
  Navigation,
  CloudSun,
  Luggage,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Zap,
  Volume2,
  VolumeX,
  Layers,
  Info,
  Calendar,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface RealtimeFlightData {
  flightNumber: string;
  pnr?: string;
  originCode: string;
  originCity: string;
  destinationCode: string;
  destinationCity: string;
  departureTime: string;
  arrivalTime: string;
  estimatedDepartureTime?: string;
  estimatedArrivalTime?: string;
  duration: string;
  aircraft: string;
  status: "Scheduled" | "On Time" | "Boarding" | "Final Call" | "In Air" | "Delayed" | "Landed" | "Cancelled" | string;
  gate: string;
  originalGate?: string;
  gateChanged?: boolean;
  gateChangedAt?: string;
  terminal: string;
  delayMinutes?: number;
  delayReason?: string;
  baggageCarousel?: string;
  onTimePct?: number;
  weatherOrigin?: { temp: string; condition: string };
  weatherDest?: { temp: string; condition: string };
  updatedAt?: string;
}

export interface RealtimeFlightStatusWidgetProps {
  initialFlightNumbers?: string[];
  userUpcomingTrips?: Array<{
    pnr: string;
    flightNumber: string;
    originCode: string;
    originCity: string;
    destinationCode: string;
    destinationCity: string;
    departureTime: string;
    arrivalTime: string;
    departureDate?: string;
    seat?: string;
    terminal?: string;
    gate?: string;
  }>;
  onNavigateToMap?: (flightNumber: string) => void;
  className?: string;
}

// Airport chime sound using Web Audio API
function playAirportChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.25); // A5
    gain2.gain.setValueAtTime(0.18, now + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.25);
    osc2.stop(now + 0.85);
  } catch {
    // Ignore audio permission errors
  }
}

export function RealtimeFlightStatusWidget({
  initialFlightNumbers = ["SW204", "SW811", "SW904", "SW310", "SW105"],
  userUpcomingTrips = [],
  onNavigateToMap,
  className,
}: RealtimeFlightStatusWidgetProps) {
  // Extract unique flight numbers to query
  const targetFlightNumbersKey = useMemo(() => {
    if (userUpcomingTrips && userUpcomingTrips.length > 0) {
      const list = userUpcomingTrips.map((t) => t.flightNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase());
      return Array.from(new Set(list)).sort().join(",");
    }
    return initialFlightNumbers.map((fn) => fn.replace(/[^A-Za-z0-9]/g, "").toUpperCase()).sort().join(",");
  }, [userUpcomingTrips, initialFlightNumbers]);

  const [flights, setFlights] = useState<RealtimeFlightData[]>([]);
  const [selectedFlightNumber, setSelectedFlightNumber] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefreshSecs, setAutoRefreshSecs] = useState<number>(15);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showSimulator, setShowSimulator] = useState<boolean>(false);
  const [simulationLoading, setSimulationLoading] = useState<boolean>(false);
  const [recentNotification, setRecentNotification] = useState<string | null>(null);

  // Store previous flight state snapshot to detect new gate changes or delays
  const previousFlightsRef = useRef<Map<string, { gate: string; delay: number; status: string }>>(new Map());
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Fetch real-time status from backend
  const fetchRealtimeStatus = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      try {
        const queryParams = targetFlightNumbersKey;
        const response = await fetch(`/api/flights/realtime-status?flightNumbers=${encodeURIComponent(queryParams)}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.flights)) {
            const incomingFlights: RealtimeFlightData[] = data.flights;
            
            // Check for status changes to trigger audio/visual alert
            let detectedAlert = false;
            let alertMsg = "";

            incomingFlights.forEach((fl) => {
              const cleanNo = fl.flightNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
              const prev = previousFlightsRef.current.get(cleanNo);

              if (prev) {
                if (fl.gate && prev.gate && fl.gate !== prev.gate) {
                  detectedAlert = true;
                  alertMsg = `Gate Change: Flight ${fl.flightNumber} moved from Gate ${prev.gate} → Gate ${fl.gate} (Terminal ${fl.terminal})`;
                } else if ((fl.delayMinutes || 0) > (prev.delay || 0)) {
                  detectedAlert = true;
                  alertMsg = `Delay Alert: Flight ${fl.flightNumber} delayed by +${fl.delayMinutes} min (${fl.delayReason || "Schedule adjustment"})`;
                } else if (fl.status === "Boarding" && prev.status !== "Boarding") {
                  detectedAlert = true;
                  alertMsg = `Boarding Call: Flight ${fl.flightNumber} is now boarding at Gate ${fl.gate}!`;
                }
              }

              // Update snapshot
              previousFlightsRef.current.set(cleanNo, {
                gate: fl.gate,
                delay: fl.delayMinutes || 0,
                status: fl.status,
              });
            });

            if (detectedAlert && alertMsg) {
              setRecentNotification(alertMsg);
              if (soundEnabledRef.current) {
                playAirportChime();
              }
            }

            setFlights(incomingFlights);
            setLastUpdated(new Date());

            // Set default selected flight if not chosen
            setSelectedFlightNumber((prevSelected) => {
              if (!prevSelected && incomingFlights.length > 0) {
                return incomingFlights[0].flightNumber;
              }
              return prevSelected;
            });
          }
        }
      } catch (err) {
        console.warn("Real-time flight status query fallback:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setAutoRefreshSecs(15);
      }
    },
    [targetFlightNumbersKey]
  );

  const fetchRealtimeStatusRef = useRef(fetchRealtimeStatus);
  useEffect(() => {
    fetchRealtimeStatusRef.current = fetchRealtimeStatus;
  }, [fetchRealtimeStatus]);

  // Initial load
  useEffect(() => {
    fetchRealtimeStatusRef.current(false);
  }, [targetFlightNumbersKey]);

  // Auto-polling timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setAutoRefreshSecs((prev) => {
        if (prev <= 1) {
          fetchRealtimeStatusRef.current(false);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Currently focused flight
  const currentFlight = useMemo(() => {
    if (!selectedFlightNumber && flights.length > 0) return flights[0];
    return (
      flights.find(
        (f) =>
          f.flightNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase() ===
          selectedFlightNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
      ) || flights[0]
    );
  }, [flights, selectedFlightNumber]);

  // Dispatch event simulator handler
  const handleSimulateEvent = async (eventType: string, customGate?: string, customDelay?: number) => {
    if (!currentFlight) return;
    setSimulationLoading(true);
    try {
      const response = await fetch("/api/flights/simulate-dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flightNumber: currentFlight.flightNumber,
          eventType,
          customGate,
          customDelay,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.alertMessage) {
          setRecentNotification(data.alertMessage);
          if (soundEnabled) {
            playAirportChime();
          }
        }
        // Immediately fetch updated records
        await fetchRealtimeStatus(true);
      }
    } catch (e) {
      console.error("Simulation error:", e);
    } finally {
      setSimulationLoading(false);
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: string, delayMinutes = 0, gateChanged = false) => {
    if (gateChanged) {
      return (
        <Badge className="border-purple-300 bg-purple-100 text-purple-800 dark:border-purple-800 dark:bg-purple-950/80 dark:text-purple-300 font-bold px-2.5 py-0.5 animate-pulse">
          <AlertTriangle className="mr-1 h-3 w-3 text-purple-600" />
          GATE CHANGED
        </Badge>
      );
    }

    if (delayMinutes > 0 || status === "Delayed") {
      return (
        <Badge className="border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-bold px-2.5 py-0.5">
          <Clock className="mr-1 h-3 w-3 text-amber-600" />
          DELAYED +{delayMinutes}m
        </Badge>
      );
    }

    if (status === "Boarding" || status === "Final Call") {
      return (
        <Badge className="border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold px-2.5 py-0.5 animate-pulse">
          <Radio className="mr-1 h-3 w-3 text-emerald-600 animate-spin" />
          {status.toUpperCase()}
        </Badge>
      );
    }

    if (status === "In Air") {
      return (
        <Badge className="border-blue-300 bg-blue-100 text-blue-900 dark:border-blue-800 dark:bg-blue-950/80 dark:text-blue-300 font-bold px-2.5 py-0.5">
          <Plane className="mr-1 h-3 w-3 text-blue-600" />
          AIRBORNE
        </Badge>
      );
    }

    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold px-2.5 py-0.5">
        <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-600" />
        ON TIME
      </Badge>
    );
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-sm backdrop-blur-md transition-all dark:border-slate-800/90 dark:bg-slate-900/95",
        className
      )}
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <Radio className="h-5 w-5 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-slate-100">
                Live Flight Status & Gate Radar
              </h3>
              <Badge
                variant="outline"
                className="hidden sm:inline-flex border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400"
              >
                PostgreSQL DB Synced
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Continuous airport telemetry, live gate modifications & delay advisories
            </p>
          </div>
        </div>

        {/* Right Controls: Auto-refresh countdown, sound toggle & manual refresh */}
        <div className="flex items-center gap-2">
          {/* Audio Chime Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playAirportChime();
            }}
            title={soundEnabled ? "Mute airport broadcast chimes" : "Enable airport broadcast chimes"}
            className="h-8 w-8 rounded-lg p-0 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <VolumeX className="h-4 w-4 text-slate-400" />
            )}
          </Button>

          {/* Test Dispatch Simulator Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSimulator((prev) => !prev)}
            className="h-8 rounded-lg border-dashed border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Simulate Dispatch</span>
          </Button>

          {/* Manual Refresh Button & Countdown */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRealtimeStatus(true)}
            disabled={refreshing}
            className="h-8 gap-1.5 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-blue-600 dark:text-blue-400", refreshing && "animate-spin")} />
            <span className="tabular-nums">{autoRefreshSecs}s</span>
          </Button>
        </div>
      </div>

      {/* Real-time Toast/Notification Banner if any flight updated */}
      {recentNotification && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-blue-200/80 bg-blue-50/90 px-3.5 py-2 text-xs font-semibold text-blue-900 shadow-sm dark:border-blue-800/80 dark:bg-blue-950/60 dark:text-blue-200 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-bounce" />
            <span>{recentNotification}</span>
          </div>
          <button
            onClick={() => setRecentNotification(null)}
            className="text-[11px] font-bold text-blue-700 hover:text-blue-950 dark:text-blue-300 ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Simulator Quick Action Drawer (if opened) */}
      {showSimulator && currentFlight && (
        <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs dark:border-amber-900/60 dark:bg-amber-950/30">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200/50 dark:border-amber-900/40">
            <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-600" />
              Live Dispatch Operations Simulator (Testing & QA)
            </span>
            <span className="text-[11px] text-amber-700 dark:text-amber-400">
              Target: <strong className="font-bold">{currentFlight.flightNumber}</strong>
            </span>
          </div>
          <p className="mt-1.5 text-slate-600 dark:text-slate-400 text-[11px]">
            Trigger real-time airport gate reassignments, air-traffic delays, or boarding calls. Changes are committed to the backend store and immediately update this widget.
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={simulationLoading}
              onClick={() => handleSimulateEvent("gate_change", "B18")}
              className="h-7 rounded-lg border-purple-300 bg-purple-50 text-[11px] font-bold text-purple-900 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-200"
            >
              Move to Gate B18
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={simulationLoading}
              onClick={() => handleSimulateEvent("gate_change", "C12")}
              className="h-7 rounded-lg border-purple-300 bg-purple-50 text-[11px] font-bold text-purple-900 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-200"
            >
              Move to Gate C12
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={simulationLoading}
              onClick={() => handleSimulateEvent("delay", undefined, 25)}
              className="h-7 rounded-lg border-amber-300 bg-amber-50 text-[11px] font-bold text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
            >
              Trigger +25m Turnaround Delay
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={simulationLoading}
              onClick={() => handleSimulateEvent("boarding_call")}
              className="h-7 rounded-lg border-emerald-300 bg-emerald-50 text-[11px] font-bold text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
            >
              Call Boarding (Gate Open)
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={simulationLoading}
              onClick={() => handleSimulateEvent("clear_delay")}
              className="h-7 rounded-lg text-[11px] font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              Reset to On-Time
            </Button>
          </div>
        </div>
      )}

      {/* Flight Selection Pills / Carousel for all upcoming trips */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 whitespace-nowrap pl-0.5">
          Upcoming Trips:
        </span>
        {flights.map((f) => {
          const isSelected =
            currentFlight?.flightNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase() ===
            f.flightNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

          const hasAlert = f.gateChanged || (f.delayMinutes || 0) > 0;

          return (
            <button
              key={f.flightNumber}
              onClick={() => setSelectedFlightNumber(f.flightNumber)}
              className={cn(
                "group relative flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap",
                isSelected
                  ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/30 dark:border-blue-500 dark:bg-blue-600"
                  : "border-slate-200 bg-slate-50/80 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:border-slate-700"
              )}
            >
              <span>{f.flightNumber}</span>
              <span className={cn("text-[11px] font-normal", isSelected ? "text-blue-100" : "text-slate-400")}>
                {f.originCode} &rarr; {f.destinationCode}
              </span>

              {/* Mini Alert Dot on pill if delayed or gate changed */}
              {hasAlert && (
                <span className="relative flex h-2 w-2">
                  <span
                    className={cn(
                      "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                      f.gateChanged ? "bg-purple-400" : "bg-amber-400"
                    )}
                  ></span>
                  <span
                    className={cn(
                      "relative inline-flex h-2 w-2 rounded-full",
                      f.gateChanged ? "bg-purple-500" : "bg-amber-500"
                    )}
                  ></span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Selected Flight Telemetry Card */}
      {currentFlight ? (
        <div className="mt-4 space-y-4">
          {/* CRITICAL ALERT 1: Gate Change Highlight Banner */}
          {currentFlight.gateChanged && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/90 p-3.5 shadow-sm dark:border-purple-800/70 dark:bg-purple-950/50 animate-in fade-in duration-300">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-white shadow-sm">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-purple-900 dark:text-purple-200">
                        Gate Reassignment Notice
                      </span>
                      <Badge className="bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-100 text-[10px] font-bold">
                        Terminal {currentFlight.terminal}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm font-semibold text-purple-950 dark:text-purple-100">
                      Flight departed gate reassigned from{" "}
                      <span className="line-through text-purple-700/70 dark:text-purple-400 font-bold">
                        Gate {currentFlight.originalGate || "A11"}
                      </span>{" "}
                      &rarr;{" "}
                      <span className="text-purple-900 dark:text-purple-50 font-black underline decoration-purple-500 decoration-2">
                        Gate {currentFlight.gate}
                      </span>
                    </p>
                    <p className="text-xs text-purple-800/90 dark:text-purple-300 mt-0.5">
                      Please follow overhead Concourse signage towards Pier {currentFlight.gate[0]}. Est. 3–5 min walking time from security checkpoint.
                    </p>
                  </div>
                </div>

                {onNavigateToMap && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigateToMap(currentFlight.flightNumber)}
                    className="shrink-0 rounded-lg border-purple-300 bg-white text-xs font-bold text-purple-900 hover:bg-purple-50 dark:border-purple-700 dark:bg-purple-900/60 dark:text-purple-100"
                  >
                    <Navigation className="mr-1.5 h-3.5 w-3.5" />
                    Locate Gate
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* CRITICAL ALERT 2: Delay Notice Banner */}
          {(currentFlight.delayMinutes || 0) > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 shadow-sm dark:border-amber-800/70 dark:bg-amber-950/50 animate-in fade-in duration-300">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white shadow-sm">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
                        Operational Delay Advisory (+{currentFlight.delayMinutes} Mins)
                      </span>
                      <Badge className="bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100 text-[10px] font-bold">
                        Revised Departure: {currentFlight.estimatedDepartureTime || currentFlight.departureTime}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-amber-900 dark:text-amber-200">
                      <strong>Operational Cause:</strong>{" "}
                      {currentFlight.delayReason || "Late incoming aircraft turnaround and airspace traffic slot adjustments."}
                    </p>
                    <p className="text-[11px] text-amber-800/90 dark:text-amber-300 mt-0.5">
                      Ground handling teams are expediting turnaround. Boarding pass remains valid with original QR code.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Flight Primary Metrics Card */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800/70 dark:bg-slate-800/30">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Origin / Departure */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Origin Departure
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {currentFlight.originCode}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {currentFlight.originCity}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span className={(currentFlight.delayMinutes || 0) > 0 ? "line-through text-slate-400 mr-1" : ""}>
                    {currentFlight.departureTime}
                  </span>
                  {(currentFlight.delayMinutes || 0) > 0 && (
                    <span className="text-amber-600 font-extrabold dark:text-amber-400">
                      {currentFlight.estimatedDepartureTime || currentFlight.departureTime} (Est)
                    </span>
                  )}
                </div>
                {currentFlight.weatherOrigin && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <CloudSun className="h-3 w-3 text-amber-500" />
                    <span>{currentFlight.weatherOrigin.temp} · {currentFlight.weatherOrigin.condition}</span>
                  </div>
                )}
              </div>

              {/* Center Corridor & Aircraft Details */}
              <div className="flex flex-col items-center justify-center border-y border-slate-200/60 py-2 md:border-y-0 md:border-x md:px-4 dark:border-slate-700/60">
                <div className="flex items-center gap-2">
                  <div className="h-px w-8 bg-slate-300 dark:bg-slate-700"></div>
                  <Plane className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <div className="h-px w-8 bg-slate-300 dark:bg-slate-700"></div>
                </div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">
                  {currentFlight.duration} Non-stop
                </span>
                <span className="text-[11px] text-slate-500">{currentFlight.aircraft}</span>
                <div className="mt-2">
                  {getStatusBadge(
                    currentFlight.status,
                    currentFlight.delayMinutes,
                    currentFlight.gateChanged
                  )}
                </div>
              </div>

              {/* Destination / Arrival */}
              <div className="space-y-1 text-left md:text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Destination Arrival
                </span>
                <div className="flex items-baseline gap-2 md:justify-end">
                  <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {currentFlight.destinationCode}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {currentFlight.destinationCity}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 md:justify-end">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span className={(currentFlight.delayMinutes || 0) > 0 ? "line-through text-slate-400 mr-1" : ""}>
                    {currentFlight.arrivalTime}
                  </span>
                  {(currentFlight.delayMinutes || 0) > 0 && (
                    <span className="text-amber-600 font-extrabold dark:text-amber-400">
                      {currentFlight.estimatedArrivalTime || currentFlight.arrivalTime} (Est)
                    </span>
                  )}
                </div>
                {currentFlight.weatherDest && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 md:justify-end">
                    <CloudSun className="h-3 w-3 text-blue-500" />
                    <span>{currentFlight.weatherDest.temp} · {currentFlight.weatherDest.condition}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Airport Gate, Terminal, Baggage Carousel Grid */}
            <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 sm:grid-cols-4 dark:border-slate-700/60">
              {/* Terminal */}
              <div className="rounded-lg bg-white p-2.5 shadow-xs dark:bg-slate-900">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Terminal
                </span>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {currentFlight.terminal || "Terminal 3"}
                </p>
              </div>

              {/* Gate with highlight if changed */}
              <div
                className={cn(
                  "rounded-lg p-2.5 shadow-xs transition-colors",
                  currentFlight.gateChanged
                    ? "bg-purple-100/80 border border-purple-300 dark:bg-purple-950/70 dark:border-purple-800"
                    : "bg-white dark:bg-slate-900"
                )}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Gate</span>
                  {currentFlight.gateChanged && (
                    <span className="text-[9px] font-black text-purple-700 dark:text-purple-300">
                      MODIFIED
                    </span>
                  )}
                </span>
                <p
                  className={cn(
                    "text-sm font-black",
                    currentFlight.gateChanged
                      ? "text-purple-900 dark:text-purple-100"
                      : "text-slate-900 dark:text-slate-100"
                  )}
                >
                  Gate {currentFlight.gate || "TBD"}
                </p>
              </div>

              {/* Baggage Carousel */}
              <div className="rounded-lg bg-white p-2.5 shadow-xs dark:bg-slate-900">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Luggage className="h-3 w-3 text-slate-400" />
                  Baggage Belt
                </span>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {currentFlight.baggageCarousel || "Carousel 4"}
                </p>
              </div>

              {/* Historical On-Time */}
              <div className="rounded-lg bg-white p-2.5 shadow-xs dark:bg-slate-900">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  Reliability
                </span>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {currentFlight.onTimePct || 94}% On-Time
                </p>
              </div>
            </div>

            {/* Flight Departure Progression Stepper */}
            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Real-Time Journey Stage
              </span>
              <div className="grid grid-cols-5 gap-1 text-center">
                {[
                  { label: "Check-in Open", active: true, done: true },
                  { label: "Security Clear", active: true, done: true },
                  {
                    label: `Gate ${currentFlight.gate}`,
                    active: true,
                    done: currentFlight.status === "Boarding" || currentFlight.status === "Final Call" || currentFlight.status === "In Air",
                    highlight: currentFlight.gateChanged,
                  },
                  {
                    label: "Boarding",
                    active: currentFlight.status === "Boarding" || currentFlight.status === "Final Call",
                    done: currentFlight.status === "In Air" || currentFlight.status === "Landed",
                  },
                  {
                    label: "Airborne",
                    active: currentFlight.status === "In Air",
                    done: currentFlight.status === "Landed",
                  },
                ].map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black transition-all",
                        step.done
                          ? "bg-emerald-500 text-white"
                          : step.active
                          ? step.highlight
                            ? "bg-purple-600 text-white animate-pulse"
                            : "bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-800"
                          : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      )}
                    >
                      {step.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                    </div>
                    <span
                      className={cn(
                        "mt-1 text-[10px] font-bold tracking-tight truncate max-w-full",
                        step.active ? "text-slate-900 dark:text-slate-100" : "text-slate-400"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center text-xs text-slate-400">
          Loading live flight status from database...
        </div>
      )}

      {/* Bottom Footer Info */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-1">
          <Info className="h-3 w-3" />
          Data fetched directly from SkyWay live airport operations & PostgreSQL database
        </span>
        <span>Last synced: {lastUpdated.toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
