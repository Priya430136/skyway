import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  MapPin,
  Clock,
  Plane,
  X,
  Mail,
  Volume2,
  VolumeX,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Compass,
  Luggage,
  RefreshCw,
  Bell,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFlightAlerts, FlightAlert, FlightAlertType } from "@/lib/flight-alert-store";
import { FlightEmailModal } from "@/components/FlightEmailModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface FlightNotificationBannerProps {
  className?: string;
  showSimulationControls?: boolean;
}

export function FlightNotificationBanner({
  className,
  showSimulationControls = true,
}: FlightNotificationBannerProps) {
  const navigate = useNavigate();
  const {
    activeBannerAlert,
    dismissAlert,
    settings,
    updateSettings,
    playAlertSound,
    triggerSimulatedAlert,
  } = useFlightAlerts();

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedAlertForEmail, setSelectedAlertForEmail] = useState<FlightAlert | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  if (!activeBannerAlert) return null;

  const alert = activeBannerAlert;
  const isGateChange = alert.type === "gate_change";
  const isDelay = alert.type === "delay";
  const isBoarding = alert.type === "boarding";
  const isBaggage = alert.type === "baggage_belt";

  const handleOpenEmail = () => {
    setSelectedAlertForEmail(alert);
    setEmailModalOpen(true);
  };

  const handleSimulate = (type: FlightAlertType) => {
    setIsSimulating(true);
    setTimeout(() => {
      triggerSimulatedAlert(type);
      setIsSimulating(false);
    }, 300);
  };

  return (
    <>
      <div
        id="flight-status-notification-banner"
        className={cn(
          "relative z-40 w-full overflow-hidden border-b transition-all duration-300",
          isGateChange
            ? "border-sky-300/80 bg-gradient-to-r from-sky-950 via-slate-900 to-sky-900 text-white shadow-lg shadow-sky-950/20"
            : isDelay
            ? "border-amber-400/80 bg-gradient-to-r from-amber-950 via-slate-900 to-orange-950 text-white shadow-lg shadow-amber-950/20"
            : isBaggage
            ? "border-emerald-400/80 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white shadow-lg shadow-emerald-950/20"
            : "border-blue-400/80 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white shadow-lg",
          className
        )}
      >
        {/* Glow & ambient accent lines */}
        <div className="absolute inset-y-0 left-0 w-1.5 bg-current opacity-80" />

        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-3.5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            
            {/* Left: Icon, Flight badge & Message */}
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              {/* Alert Pulsing Icon */}
              <div
                className={cn(
                  "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold shadow-md",
                  isGateChange ? "bg-sky-500 text-white ring-4 ring-sky-400/20" :
                  isDelay ? "bg-amber-500 text-white ring-4 ring-amber-400/20 animate-pulse" :
                  isBaggage ? "bg-emerald-500 text-white ring-4 ring-emerald-400/20" :
                  "bg-blue-500 text-white ring-4 ring-blue-400/20"
                )}
              >
                {isGateChange ? <MapPin className="h-5 w-5" /> :
                 isDelay ? <Clock className="h-5 w-5" /> :
                 isBaggage ? <Luggage className="h-5 w-5" /> :
                 <Plane className="h-5 w-5" />}
              </div>

              {/* Text info & dynamic pills */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={cn(
                      "font-mono text-xs font-black px-2.5 py-0.5 uppercase tracking-wide",
                      isGateChange ? "bg-sky-400 text-slate-950" :
                      isDelay ? "bg-amber-400 text-slate-950" :
                      isBaggage ? "bg-emerald-400 text-slate-950" :
                      "bg-blue-400 text-slate-950"
                    )}
                  >
                    {alert.flightNumber}
                  </Badge>

                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                    {alert.title}
                  </span>

                  <span className="text-xs text-slate-300 font-medium">
                    &bull; {alert.originCode} &rarr; {alert.destinationCode} ({alert.pnr})
                  </span>

                  <span className="text-[11px] text-slate-400">
                    &bull; {alert.timestamp}
                  </span>
                </div>

                {/* Main description + Gate / Delay Comparison Highlights */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-200">
                  <span>{alert.message}</span>

                  {/* Gate comparison pill */}
                  {alert.previousGate && alert.newGate && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-0.5 font-bold backdrop-blur-sm">
                      <span className="text-slate-300 line-through">{alert.previousGate}</span>
                      <ArrowRight className="h-3 w-3 text-sky-300" />
                      <span className="text-sky-300 font-black">{alert.newGate}</span>
                      {alert.walkingTimeMinutes && (
                        <span className="text-[10px] text-slate-300 font-normal">
                          (~{alert.walkingTimeMinutes}m walk)
                        </span>
                      )}
                    </span>
                  )}

                  {/* Delay time comparison pill */}
                  {alert.originalTime && alert.updatedTime && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-0.5 font-bold backdrop-blur-sm">
                      <span className="text-slate-300 line-through">{alert.originalTime}</span>
                      <ArrowRight className="h-3 w-3 text-amber-300" />
                      <span className="text-amber-300 font-black">{alert.updatedTime}</span>
                      <span className="text-amber-200 font-extrabold">(+{alert.delayDurationMinutes}m)</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Quick Action Controls */}
            <div className="flex flex-wrap items-center gap-2 self-end lg:self-center shrink-0">
              
              {/* Send / View Email Alert Button */}
              <Button
                size="sm"
                onClick={handleOpenEmail}
                className="h-8 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold shadow-sm backdrop-blur-sm"
              >
                <Mail className="mr-1.5 h-3.5 w-3.5 text-sky-300" />
                <span>Email Alert</span>
              </Button>

              {/* Primary Context Action (Status / Rebook / Boarding Pass) */}
              {alert.actionUrl && (
                <Button
                  size="sm"
                  onClick={() => navigate({ to: alert.actionUrl as any })}
                  className={cn(
                    "h-8 rounded-xl text-xs font-black shadow-md",
                    isGateChange ? "bg-sky-400 text-slate-950 hover:bg-sky-300" :
                    isDelay ? "bg-amber-400 text-slate-950 hover:bg-amber-300" :
                    "bg-white text-slate-950 hover:bg-slate-100"
                  )}
                >
                  <span>{alert.actionLabel || "View Details"}</span>
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              )}

              {/* Audio Chime test */}
              <button
                type="button"
                onClick={playAlertSound}
                title="Play airport chime alert"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                aria-label="Play sound"
              >
                <Volume2 className="h-4 w-4" />
              </button>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={() => dismissAlert(alert.id)}
                title="Dismiss banner"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Simulation Trigger Bar for testing and demonstration */}
          {showSimulationControls && (
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Test Live Flight Alert Triggers:</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSimulate("gate_change")}
                  disabled={isSimulating}
                  className="rounded-lg bg-sky-500/20 hover:bg-sky-500/30 px-2.5 py-1 text-sky-200 border border-sky-400/30 font-medium transition-colors"
                >
                  ⚡ Gate Change (Gate C9 ➔ C18)
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulate("delay")}
                  disabled={isSimulating}
                  className="rounded-lg bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1 text-amber-200 border border-amber-400/30 font-medium transition-colors"
                >
                  ⏱ ATC Delay (+45m)
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulate("boarding")}
                  disabled={isSimulating}
                  className="rounded-lg bg-blue-500/20 hover:bg-blue-500/30 px-2.5 py-1 text-blue-200 border border-blue-400/30 font-medium transition-colors"
                >
                  🚀 Boarding Call
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulate("baggage_belt")}
                  disabled={isSimulating}
                  className="rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 px-2.5 py-1 text-emerald-200 border border-emerald-400/30 font-medium transition-colors"
                >
                  🧳 Baggage Carousel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Alert Preview & Dispatch Modal */}
      <FlightEmailModal
        alert={selectedAlertForEmail}
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
      />
    </>
  );
}
