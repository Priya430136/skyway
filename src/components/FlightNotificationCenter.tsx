import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Mail,
  Volume2,
  VolumeX,
  MapPin,
  Clock,
  Plane,
  AlertTriangle,
  CheckCircle2,
  Send,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Luggage,
  Settings,
  Trash2,
  CheckCheck,
  RefreshCw,
  Sliders,
  ExternalLink,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useFlightAlerts, FlightAlert, FlightAlertType } from "@/lib/flight-alert-store";
import { FlightEmailModal } from "@/components/FlightEmailModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface FlightNotificationCenterProps {
  className?: string;
}

export function FlightNotificationCenter({ className }: FlightNotificationCenterProps) {
  const navigate = useNavigate();
  const {
    alerts,
    settings,
    updateSettings,
    markAsRead,
    markAllAsRead,
    dismissAlert,
    restoreAlert,
    triggerSimulatedAlert,
    sendEmailNotification,
    dispatchedEmails,
    playAlertSound,
  } = useFlightAlerts();

  const [activeFilter, setActiveFilter] = useState<"all" | "gate" | "delay" | "boarding" | "baggage">("all");
  const [selectedAlertForEmail, setSelectedAlertForEmail] = useState<FlightAlert | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [recipientEmailInput, setRecipientEmailInput] = useState(settings.recipientEmail || "sehrawatpriya430@gmail.com");
  const [isSimulating, setIsSimulating] = useState(false);

  const filteredAlerts = alerts.filter((a) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "gate") return a.type === "gate_change";
    if (activeFilter === "delay") return a.type === "delay";
    if (activeFilter === "boarding") return a.type === "boarding";
    if (activeFilter === "baggage") return a.type === "baggage_belt";
    return true;
  });

  const handleOpenEmail = (alert: FlightAlert) => {
    setSelectedAlertForEmail(alert);
    setEmailModalOpen(true);
  };

  const handleSimulate = (type: FlightAlertType) => {
    setIsSimulating(true);
    setTimeout(() => {
      triggerSimulatedAlert(type);
      setIsSimulating(false);
    }, 250);
  };

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmailInput || !recipientEmailInput.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    updateSettings({ recipientEmail: recipientEmailInput });
  };

  return (
    <div className={cn("w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300", className)}>
      
      {/* 1. Header & Live Simulator Hub Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-xl dark:border-slate-800 md:p-8">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-black tracking-wide text-blue-300 ring-1 ring-blue-400/30">
                <Bell className="h-3.5 w-3.5" />
                Flight Status & Gate Alert System
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                Live Monitoring Active
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Flight Notifications & Gate Broadcasts
            </h1>
            <p className="text-xs text-slate-300 sm:text-sm max-w-2xl">
              Instant alerts via email and top UI banners for gate relocations, aircraft delays, boarding calls, and baggage carousel assignments.
            </p>
          </div>

          {/* Quick Stats & Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs font-bold shadow-sm backdrop-blur-sm"
            >
              <CheckCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-300" />
              Mark All Read
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={playAlertSound}
              className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs font-bold shadow-sm backdrop-blur-sm"
            >
              <Volume2 className="mr-1.5 h-3.5 w-3.5 text-amber-300" />
              Airport Chime
            </Button>
          </div>
        </div>

        {/* Live Simulation Trigger Bar */}
        <div className="relative z-10 mt-6 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-300 animate-spin" />
              <span className="text-xs font-extrabold tracking-wide uppercase text-amber-200">
                Trigger Live Test Alerts:
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => handleSimulate("gate_change")}
                disabled={isSimulating}
                className="h-8 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-sm"
              >
                <MapPin className="mr-1 h-3.5 w-3.5" />
                Simulate Gate Change
              </Button>
              <Button
                size="sm"
                onClick={() => handleSimulate("delay")}
                disabled={isSimulating}
                className="h-8 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm"
              >
                <Clock className="mr-1 h-3.5 w-3.5" />
                Simulate ATC Delay (+45m)
              </Button>
              <Button
                size="sm"
                onClick={() => handleSimulate("boarding")}
                disabled={isSimulating}
                className="h-8 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs shadow-sm"
              >
                <Plane className="mr-1 h-3.5 w-3.5" />
                Simulate Boarding Call
              </Button>
              <Button
                size="sm"
                onClick={() => handleSimulate("baggage_belt")}
                disabled={isSimulating}
                className="h-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm"
              >
                <Luggage className="mr-1 h-3.5 w-3.5" />
                Simulate Baggage Belt
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Grid: Alerts List (8 cols) + Notification Preferences & Email Configuration (4 cols) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        
        {/* Left: Alerts Feed (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          
          {/* Filter Pills Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { id: "all", label: `All Alerts (${alerts.length})` },
                { id: "gate", label: "Gate Changes", icon: MapPin },
                { id: "delay", label: "Flight Delays", icon: Clock },
                { id: "boarding", label: "Boarding Calls", icon: Plane },
                { id: "baggage", label: "Baggage Claim", icon: Luggage },
              ].map((tab) => {
                const isSelected = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id as any)}
                    className={cn(
                      "rounded-xl px-3.5 py-2 font-bold transition-all shadow-sm",
                      isSelected
                        ? "bg-blue-600 text-white shadow-blue-600/20"
                        : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alert Cards */}
          <div className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-400 dark:border-slate-800">
                <Bell className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                <p className="font-semibold text-sm">No notifications matching this filter.</p>
                <p className="text-xs mt-1">Use the simulator bar above to generate a new live flight alert.</p>
              </div>
            ) : (
              filteredAlerts.map((item) => {
                const isGateChange = item.type === "gate_change";
                const isDelay = item.type === "delay";
                const isBoarding = item.type === "boarding";
                const isBaggage = item.type === "baggage_belt";

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "overflow-hidden rounded-3xl border bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-slate-900",
                      item.read
                        ? "border-slate-200/80 dark:border-slate-800 opacity-90"
                        : isGateChange
                        ? "border-sky-300 ring-1 ring-sky-300/40 dark:border-sky-800"
                        : isDelay
                        ? "border-amber-300 ring-1 ring-amber-300/40 dark:border-amber-800"
                        : "border-blue-300 ring-1 ring-blue-300/40 dark:border-blue-800"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      
                      {/* Left: Icon & Details */}
                      <div className="flex items-start gap-3.5">
                        <div
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-bold shadow-md",
                            isGateChange ? "bg-sky-500 text-white shadow-sky-500/20" :
                            isDelay ? "bg-amber-500 text-white shadow-amber-500/20" :
                            isBaggage ? "bg-emerald-500 text-white shadow-emerald-500/20" :
                            "bg-blue-600 text-white shadow-blue-600/20"
                          )}
                        >
                          {isGateChange ? <MapPin className="h-6 w-6" /> :
                           isDelay ? <Clock className="h-6 w-6" /> :
                           isBaggage ? <Luggage className="h-6 w-6" /> :
                           <Plane className="h-6 w-6" />}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              className={cn(
                                "font-mono text-xs font-black",
                                isGateChange ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" :
                                isDelay ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" :
                                "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              )}
                            >
                              {item.flightNumber}
                            </Badge>

                            <h3 className="font-black text-slate-900 dark:text-slate-100 text-base tracking-tight">
                              {item.title}
                            </h3>

                            {!item.read && (
                              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                            )}
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {item.message}
                          </p>

                          {/* Gate Comparison Highlight */}
                          {item.previousGate && item.newGate && (
                            <div className="mt-2 inline-flex flex-wrap items-center gap-3 rounded-xl border border-sky-200 bg-sky-50/70 px-3.5 py-2 text-xs dark:border-sky-900/60 dark:bg-sky-950/40">
                              <span className="font-semibold text-slate-400 line-through">Previous: {item.previousGate}</span>
                              <ArrowRight className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                              <span className="font-black text-sky-700 dark:text-sky-300 text-sm">Updated: {item.newGate}</span>
                              <span className="text-slate-500 font-medium">({item.terminal})</span>
                              {item.walkingTimeMinutes && (
                                <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-bold text-sky-800 dark:bg-slate-800 dark:text-sky-300 shadow-sm">
                                  ~{item.walkingTimeMinutes} min walk from security
                                </span>
                              )}
                            </div>
                          )}

                          {/* Delay Comparison Highlight */}
                          {item.originalTime && item.updatedTime && (
                            <div className="mt-2 inline-flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2 text-xs dark:border-amber-900/60 dark:bg-amber-950/40">
                              <span className="font-semibold text-slate-400 line-through">Scheduled: {item.originalTime}</span>
                              <ArrowRight className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                              <span className="font-black text-amber-700 dark:text-amber-300 text-sm">Revised: {item.updatedTime}</span>
                              <Badge className="bg-amber-500 text-white text-[10px]">+{item.delayDurationMinutes}m Delay</Badge>
                              {item.reason && (
                                <span className="text-[11px] text-slate-500 italic">({item.reason})</span>
                              )}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                            <span>PNR: <strong className="font-mono text-slate-600 dark:text-slate-400">{item.pnr}</strong></span>
                            <span>&bull;</span>
                            <span>{item.originCode} &rarr; {item.destinationCode}</span>
                            <span>&bull;</span>
                            <span>{item.timestamp}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex sm:flex-col items-end gap-2 shrink-0 self-end sm:self-start">
                        <Button
                          size="sm"
                          onClick={() => handleOpenEmail(item)}
                          className="h-8 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900 text-xs font-bold"
                        >
                          <Mail className="mr-1.5 h-3.5 w-3.5" />
                          Email Alert
                        </Button>

                        {item.actionUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate({ to: item.actionUrl as any })}
                            className="h-8 rounded-xl text-xs font-semibold"
                          >
                            <span>{item.actionLabel || "Details"}</span>
                            <ChevronRight className="ml-1 h-3 w-3" />
                          </Button>
                        )}

                        {!item.read && (
                          <button
                            type="button"
                            onClick={() => markAsRead(item.id)}
                            className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline pt-1"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Notification Preferences & Email Settings (4 cols) */}
        <div className="space-y-6 lg:col-span-4">
          
          {/* Email Recipient Setup Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                Email Alert Recipient
              </h3>
            </div>

            <p className="text-xs text-slate-500">
              Flight status and gate relocation advisories will be dispatched directly to this email:
            </p>

            <form onSubmit={handleSaveEmail} className="space-y-3">
              <Input
                type="email"
                value={recipientEmailInput}
                onChange={(e) => setRecipientEmailInput(e.target.value)}
                placeholder="e.g. user@example.com"
                className="text-xs h-10"
              />
              <Button
                type="submit"
                size="sm"
                className="w-full h-9 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
              >
                Save Recipient Email
              </Button>
            </form>
          </div>

          {/* Delivery Channels & Rules Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <Sliders className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                Notification Channels & Preferences
              </h3>
            </div>

            <div className="space-y-3.5">
              {/* Email Delivery */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Email Flight Alerts</div>
                  <div className="text-[11px] text-slate-500">Immediate HTML email notifications</div>
                </div>
                <Switch
                  checked={settings.emailEnabled}
                  onCheckedChange={(checked) => updateSettings({ emailEnabled: checked })}
                />
              </div>

              {/* UI Banner */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Top UI Banner Alert</div>
                  <div className="text-[11px] text-slate-500">Prominent in-app banner on all pages</div>
                </div>
                <Switch
                  checked={settings.inAppBannerEnabled}
                  onCheckedChange={(checked) => updateSettings({ inAppBannerEnabled: checked })}
                />
              </div>

              {/* Sound */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Airport Chime Sound</div>
                  <div className="text-[11px] text-slate-500">Play audio cue on new flight updates</div>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
                />
              </div>

              {/* Gate changes */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Gate Assignment & Move</div>
                  <div className="text-[11px] text-slate-500">Alert on terminal/gate reassignment</div>
                </div>
                <Switch
                  checked={settings.notifyOnGateChange}
                  onCheckedChange={(checked) => updateSettings({ notifyOnGateChange: checked })}
                />
              </div>

              {/* Baggage */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Baggage Carousel Belt</div>
                  <div className="text-[11px] text-slate-500">Delivery carousel assignment alert</div>
                </div>
                <Switch
                  checked={settings.notifyOnBaggageCarousel}
                  onCheckedChange={(checked) => updateSettings({ notifyOnBaggageCarousel: checked })}
                />
              </div>
            </div>
          </div>

          {/* Dispatched Emails History */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                Recent Dispatched Emails
              </h4>
              <Badge variant="outline" className="text-[10px]">
                {dispatchedEmails.length} sent
              </Badge>
            </div>

            {dispatchedEmails.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">
                No simulated email alerts sent yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {dispatchedEmails.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-xl bg-slate-50 p-2.5 text-[11px] dark:bg-slate-800/50">
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {item.subject}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>To: {item.recipient}</span>
                      <span>{item.sentAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <FlightEmailModal
        alert={selectedAlertForEmail}
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
      />
    </div>
  );
}
