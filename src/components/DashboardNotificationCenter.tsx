import React, { useState } from "react";
import {
  Bell,
  Radio,
  AlertTriangle,
  Clock,
  MapPin,
  Plane,
  Volume2,
  VolumeX,
  Mail,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Sliders,
  Send,
  Database,
  ArrowRight,
  ShieldAlert,
  ExternalLink,
  ChevronRight,
  Plus,
  Eye,
  Trash2,
  CheckCheck,
  Luggage,
  CloudRain,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useFlightAlerts, type FlightAlert, type FlightAlertType } from "@/lib/flight-alert-store";
import { FlightEmailModal } from "@/components/FlightEmailModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DashboardNotificationCenterProps {
  className?: string;
  onNavigateToFlight?: (flightNumber: string) => void;
  onNavigateToMap?: (flightNumber: string) => void;
}

export function DashboardNotificationCenter({
  className,
  onNavigateToFlight,
  onNavigateToMap,
}: DashboardNotificationCenterProps) {
  const {
    alerts,
    settings,
    updateSettings,
    markAsRead,
    markAllAsRead,
    dismissAlert,
    restoreAlert,
    triggerServerSimulation,
    broadcastAlert,
    sendEmailNotification,
    playAlertSound,
    pollDatabaseNow,
    isPolling,
    lastPolledAt,
    dbConnected,
    pollSecondsRemaining,
    showToastForAlert,
    unreadCount,
    urgentCount,
  } = useFlightAlerts();

  // State
  const [activeFilter, setActiveFilter] = useState<"all" | "urgent" | "gate" | "delay" | "boarding" | "baggage">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [selectedAlertForEmail, setSelectedAlertForEmail] = useState<FlightAlert | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [simulatingScenario, setSimulatingScenario] = useState<string | null>(null);

  // Custom Broadcast Form State
  const [customFlightNo, setCustomFlightNo] = useState("SW-811");
  const [customPnr, setCustomPnr] = useState("SW9M2P");
  const [customType, setCustomType] = useState<FlightAlertType>("gate_change");
  const [customTitle, setCustomTitle] = useState("Urgent Gate Change: Gate C18");
  const [customMessage, setCustomMessage] = useState("Flight SW-811 is relocated to Gate C18. Immediate boarding.");
  const [customSeverity, setCustomSeverity] = useState<"critical" | "warning" | "info" | "success">("warning");
  const [customGate, setCustomGate] = useState("Gate C18");
  const [customDelayMins, setCustomDelayMins] = useState(30);

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    if (activeFilter === "urgent") {
      if (!alert.isUrgent && alert.severity !== "critical") return false;
    } else if (activeFilter === "gate") {
      if (alert.type !== "gate_change") return false;
    } else if (activeFilter === "delay") {
      if (alert.type !== "delay") return false;
    } else if (activeFilter === "boarding") {
      if (alert.type !== "boarding") return false;
    } else if (activeFilter === "baggage") {
      if (alert.type !== "baggage_belt") return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchFlight = alert.flightNumber.toLowerCase().includes(q);
      const matchPnr = alert.pnr?.toLowerCase().includes(q);
      const matchTitle = alert.title.toLowerCase().includes(q);
      const matchCity = alert.originCity.toLowerCase().includes(q) || alert.destinationCity.toLowerCase().includes(q);
      if (!matchFlight && !matchPnr && !matchTitle && !matchCity) return false;
    }

    return true;
  });

  const handleSimulate = async (scenario: "gate" | "delay" | "boarding" | "baggage" | "weather") => {
    setSimulatingScenario(scenario);
    try {
      await triggerServerSimulation(scenario);
    } finally {
      setSimulatingScenario(null);
    }
  };

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await broadcastAlert({
      flightNumber: customFlightNo,
      pnr: customPnr,
      type: customType,
      title: customTitle,
      message: customMessage,
      severity: customSeverity,
      isUrgent: customSeverity === "critical" || customSeverity === "warning",
      newGate: customType === "gate_change" ? customGate : undefined,
      delayDurationMinutes: customType === "delay" ? Number(customDelayMins) : undefined,
      timestamp: "Just now",
      createdAt: Date.now(),
    });
    if (success) {
      setShowBroadcastModal(false);
    }
  };

  const getAlertIcon = (type: FlightAlertType, severity: string) => {
    switch (type) {
      case "gate_change":
        return <MapPin className="h-5 w-5 text-amber-500" />;
      case "delay":
        return <Clock className="h-5 w-5 text-rose-500" />;
      case "boarding":
        return <Plane className="h-5 w-5 text-blue-500" />;
      case "baggage_belt":
        return <Luggage className="h-5 w-5 text-emerald-500" />;
      case "weather_hazard":
        return <CloudRain className="h-5 w-5 text-purple-500" />;
      default:
        return severity === "critical" ? (
          <AlertTriangle className="h-5 w-5 text-rose-500" />
        ) : (
          <Bell className="h-5 w-5 text-blue-500" />
        );
    }
  };

  const getSeverityBadge = (severity: string, isUrgent?: boolean) => {
    if (severity === "critical" || isUrgent) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30 animate-pulse">
          <Flame className="h-3 w-3 text-rose-500" /> Urgent Action
        </span>
      );
    }
    if (severity === "warning") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30">
          <AlertTriangle className="h-3 w-3 text-amber-500" /> Advisory
        </span>
      );
    }
    if (severity === "success") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Ready
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
        <Bell className="h-3 w-3 text-blue-500" /> Notice
      </span>
    );
  };

  return (
    <div className={cn("w-full space-y-6 animate-in fade-in duration-300", className)}>
      
      {/* 1. Header & Live Database Polling Radar Bar */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-xl dark:border-slate-800 md:p-8">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/25 px-3 py-1 text-xs font-black tracking-wide text-blue-300 ring-1 ring-blue-400/30">
                <Radio className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
                Live Notification Center
              </span>
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                dbConnected ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30" : "bg-amber-500/20 text-amber-300"
              )}>
                <Database className="h-3 w-3" />
                {dbConnected ? "PostgreSQL Connected" : "Local Sync Mode"}
              </span>
              {urgentCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/30 px-2.5 py-0.5 text-[11px] font-black text-rose-200 ring-1 ring-rose-400/40 animate-bounce">
                  <Flame className="h-3 w-3 text-rose-400" />
                  {urgentCount} Urgent Alert{urgentCount > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Urgent Travel Alerts & Toast Dispatcher
            </h2>
            <p className="text-xs text-slate-300 sm:text-sm max-w-2xl">
              Continuously polls the database for time-sensitive travel updates, gate reassignments, and runway delays—instantly alerting passengers with interactive toast notices.
            </p>
          </div>

          {/* Polling Status & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2 backdrop-blur-md text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                  Auto-Polling Loop
                </span>
                <span className="font-mono font-black text-emerald-300 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Next in {pollSecondsRemaining}s
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={isPolling}
              onClick={pollDatabaseNow}
              className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs font-bold shadow-sm backdrop-blur-sm"
            >
              <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", isPolling && "animate-spin text-blue-300")} />
              {isPolling ? "Polling DB..." : "Poll Now"}
            </Button>

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
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs font-bold shadow-sm backdrop-blur-sm"
            >
              <Sliders className="mr-1.5 h-3.5 w-3.5 text-amber-300" />
              Preferences
            </Button>
          </div>
        </div>

        {/* 2. Toast Dispatcher & Quick Simulation Controls */}
        <div className="relative z-10 mt-6 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-300 animate-spin" />
              <span className="text-xs font-extrabold uppercase tracking-wide text-amber-200">
                Trigger Immediate Toast Alert:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={simulatingScenario !== null}
                onClick={() => handleSimulate("gate")}
                className="h-8 rounded-lg border-amber-400/40 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 text-[11px] font-bold"
              >
                <MapPin className="mr-1 h-3 w-3" />
                🚨 Gate Change Toast
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={simulatingScenario !== null}
                onClick={() => handleSimulate("delay")}
                className="h-8 rounded-lg border-rose-400/40 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 text-[11px] font-bold"
              >
                <Clock className="mr-1 h-3 w-3" />
                ⚠️ Critical Delay Toast
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={simulatingScenario !== null}
                onClick={() => handleSimulate("boarding")}
                className="h-8 rounded-lg border-blue-400/40 bg-blue-500/20 text-blue-200 hover:bg-blue-500/30 text-[11px] font-bold"
              >
                <Plane className="mr-1 h-3 w-3" />
                ✈️ Boarding Call Toast
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={simulatingScenario !== null}
                onClick={() => handleSimulate("baggage")}
                className="h-8 rounded-lg border-emerald-400/40 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 text-[11px] font-bold"
              >
                <Luggage className="mr-1 h-3 w-3" />
                🧳 Baggage Claim Toast
              </Button>

              <Button
                size="sm"
                onClick={() => setShowBroadcastModal(true)}
                className="h-8 rounded-lg bg-white text-slate-950 hover:bg-slate-100 text-[11px] font-extrabold shadow-sm"
              >
                <Plus className="mr-1 h-3 w-3" />
                Broadcast Custom Notice
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Notification Settings Drawer / Configuration Card */}
      {showSettingsDrawer && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-800 dark:bg-slate-900 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-blue-600" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Notification & Database Polling Preferences
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettingsDrawer(false)}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              Close
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            {/* Column 1: Toast & Audio Settings */}
            <div className="space-y-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Toast & Sound Interface
              </h4>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">Interactive Toast Popups</p>
                  <p className="text-[11px] text-slate-500">Show floating toast on urgent alerts</p>
                </div>
                <Switch
                  checked={settings.toastPopupsEnabled}
                  onCheckedChange={(val) => updateSettings({ toastPopupsEnabled: val })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">Airport Chime Sound</p>
                  <p className="text-[11px] text-slate-500">Synthesized airport broadcast tones</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={playAlertSound}
                    className="h-7 px-2 text-[10px] font-bold"
                  >
                    <Volume2 className="h-3 w-3" /> Test
                  </Button>
                  <Switch
                    checked={settings.soundEnabled}
                    onCheckedChange={(val) => updateSettings({ soundEnabled: val })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">Top Screen Banner</p>
                  <p className="text-[11px] text-slate-500">Persistent warning banner across app</p>
                </div>
                <Switch
                  checked={settings.inAppBannerEnabled}
                  onCheckedChange={(val) => updateSettings({ inAppBannerEnabled: val })}
                />
              </div>
            </div>

            {/* Column 2: Database Polling Controls */}
            <div className="space-y-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Database Polling Frequency
              </h4>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">Automatic Polling</p>
                  <p className="text-[11px] text-slate-500">Poll PostgreSQL in the background</p>
                </div>
                <Switch
                  checked={settings.autoPollingEnabled}
                  onCheckedChange={(val) => updateSettings({ autoPollingEnabled: val })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Polling Interval: {settings.pollingIntervalSeconds}s
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[10, 15, 30, 60].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => updateSettings({ pollingIntervalSeconds: sec })}
                      className={cn(
                        "rounded-lg py-1.5 text-xs font-extrabold border text-center transition-all",
                        settings.pollingIntervalSeconds === sec
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                      )}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-1 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Last Polled:</span>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                  {lastPolledAt ? lastPolledAt.toLocaleTimeString() : "Never"}
                </span>
              </div>
            </div>

            {/* Column 3: Dispatch & Email Delivery */}
            <div className="space-y-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Email Dispatch Delivery
              </h4>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">Email Forwarding</p>
                  <p className="text-[11px] text-slate-500">Send copies to personal inbox</p>
                </div>
                <Switch
                  checked={settings.emailEnabled}
                  onCheckedChange={(val) => updateSettings({ emailEnabled: val })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Email
                </label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={settings.recipientEmail}
                    onChange={(e) => updateSettings({ recipientEmail: e.target.value })}
                    className="h-8 text-xs bg-white dark:bg-slate-800"
                    placeholder="user@example.com"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (alerts[0]) sendEmailNotification(alerts[0]);
                    }}
                    className="h-8 text-xs font-bold whitespace-nowrap"
                  >
                    <Mail className="mr-1 h-3 w-3" /> Test
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Filter Toolbar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "all", label: "All Alerts", count: alerts.length },
            { key: "urgent", label: "🚨 Urgent & Critical", count: urgentCount },
            { key: "gate", label: "Gate Relocations", count: alerts.filter((a) => a.type === "gate_change").length },
            { key: "delay", label: "Delays & ATC", count: alerts.filter((a) => a.type === "delay").length },
            { key: "boarding", label: "Boarding Calls", count: alerts.filter((a) => a.type === "boarding").length },
            { key: "baggage", label: "Baggage Belts", count: alerts.filter((a) => a.type === "baggage_belt").length },
          ].map((tab) => {
            const isSelected = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key as any)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all",
                  isSelected
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                    : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                    isSelected
                      ? "bg-white/20 text-white"
                      : tab.key === "urgent" && tab.count > 0
                      ? "bg-rose-500 text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="w-full sm:w-64">
          <Input
            type="text"
            placeholder="Search flight, PNR, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>
      </div>

      {/* 5. Alerts Stream List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-slate-100">
              No Travel Alerts Matching Filters
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              All scheduled flights are running normally. Try triggering a simulation above to test real-time toast alerts.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveFilter("all");
                setSearchQuery("");
              }}
              className="mt-4 rounded-xl text-xs font-bold"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === "critical" || alert.isUrgent;
            const isUnread = !alert.read;

            return (
              <div
                key={alert.id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-5 transition-all",
                  isCritical
                    ? "border-rose-300 bg-rose-50/40 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/20"
                    : isUnread
                    ? "border-blue-200 bg-blue-50/30 shadow-sm dark:border-blue-900/40 dark:bg-blue-950/15"
                    : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                )}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Left Column: Icon & Details */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={cn(
                        "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        isCritical
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          : alert.type === "gate_change"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                      )}
                    >
                      {getAlertIcon(alert.type, alert.severity)}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-md">
                          {alert.flightNumber}
                        </span>
                        {alert.pnr && (
                          <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            PNR: {alert.pnr}
                          </span>
                        )}
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                          {alert.originCode} → {alert.destinationCode} ({alert.destinationCity})
                        </span>
                        {getSeverityBadge(alert.severity, alert.isUrgent)}
                        {isUnread && (
                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black text-white">
                            NEW
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        {alert.title}
                      </h4>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                        {alert.message}
                      </p>

                      {/* Contextual Metric Badges */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {alert.type === "gate_change" && alert.newGate && (
                          <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 border border-amber-500/20">
                            <MapPin className="h-3.5 w-3.5 text-amber-600" />
                            <span>
                              {alert.previousGate ? `${alert.previousGate} ➔ ` : ""}
                              <strong className="font-black">{alert.newGate}</strong>
                              {alert.terminal ? ` (${alert.terminal})` : ""}
                            </span>
                            {alert.walkingTimeMinutes && (
                              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                • ~{alert.walkingTimeMinutes} min walk
                              </span>
                            )}
                          </div>
                        )}

                        {alert.type === "delay" && alert.delayDurationMinutes && (
                          <div className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-300 border border-rose-500/20">
                            <Clock className="h-3.5 w-3.5 text-rose-600" />
                            <span>
                              Delay: <strong>+{alert.delayDurationMinutes}m</strong>
                              {alert.updatedTime ? ` • Revised: ${alert.updatedTime}` : ""}
                            </span>
                          </div>
                        )}

                        {alert.type === "baggage_belt" && alert.carouselNumber && (
                          <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            <Luggage className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Baggage Delivery: <strong>{alert.carouselNumber}</strong></span>
                          </div>
                        )}

                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {alert.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Interactive Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => showToastForAlert(alert)}
                      className="h-8 rounded-xl text-xs font-bold gap-1 text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50 dark:border-blue-900/60 dark:hover:bg-blue-950/40"
                    >
                      <Bell className="h-3 w-3" />
                      Test Toast
                    </Button>

                    {alert.actionUrl && (
                      <Button
                        size="sm"
                        onClick={() => {
                          if (alert.type === "gate_change" && onNavigateToMap) {
                            onNavigateToMap(alert.flightNumber);
                          } else if (onNavigateToFlight) {
                            onNavigateToFlight(alert.flightNumber);
                          } else {
                            window.location.href = alert.actionUrl!;
                          }
                        }}
                        className={cn(
                          "h-8 rounded-xl text-xs font-extrabold gap-1 text-white shadow-sm",
                          isCritical
                            ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                            : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
                        )}
                      >
                        <span>{alert.actionLabel || "View Action"}</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedAlertForEmail(alert);
                        setEmailModalOpen(true);
                      }}
                      className="h-8 w-8 p-0 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Send copy via email"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (isUnread) markAsRead(alert.id);
                        else dismissAlert(alert.id);
                      }}
                      className="h-8 w-8 p-0 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title={isUnread ? "Mark as read" : "Dismiss"}
                    >
                      {isUnread ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 6. Broadcast Custom Alert Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Broadcast Urgent Travel Notice
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBroadcastModal(false)}
                className="text-xs text-slate-500"
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Flight Number
                  </label>
                  <Input
                    value={customFlightNo}
                    onChange={(e) => setCustomFlightNo(e.target.value)}
                    className="h-8 text-xs font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    PNR Ref
                  </label>
                  <Input
                    value={customPnr}
                    onChange={(e) => setCustomPnr(e.target.value)}
                    className="h-8 text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alert Category
                  </label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as FlightAlertType)}
                    className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="gate_change">Gate Reassignment</option>
                    <option value="delay">Runway & ATC Delay</option>
                    <option value="boarding">Boarding Call</option>
                    <option value="baggage_belt">Baggage Carousel</option>
                    <option value="weather_hazard">Weather Advisory</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Urgency Severity
                  </label>
                  <select
                    value={customSeverity}
                    onChange={(e) => setCustomSeverity(e.target.value as any)}
                    className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="critical">🚨 Critical (Immediate Action)</option>
                    <option value="warning">⚠️ Warning (Gate / Advisory)</option>
                    <option value="info">ℹ️ Information</option>
                    <option value="success">✅ Success (Baggage Ready)</option>
                  </select>
                </div>
              </div>

              {customType === "gate_change" && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    New Gate Target
                  </label>
                  <Input
                    value={customGate}
                    onChange={(e) => setCustomGate(e.target.value)}
                    className="h-8 text-xs font-bold"
                    placeholder="e.g. Gate C18 (Terminal 2)"
                  />
                </div>
              )}

              {customType === "delay" && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Delay Duration (Minutes)
                  </label>
                  <Input
                    type="number"
                    value={customDelayMins}
                    onChange={(e) => setCustomDelayMins(Number(e.target.value))}
                    className="h-8 text-xs font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Headline Title
                </label>
                <Input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="h-8 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Passenger Instruction Message
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs font-normal text-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBroadcastModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" /> Broadcast to All Passengers
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Email Forwarding Modal */}
      {selectedAlertForEmail && (
        <FlightEmailModal
          isOpen={emailModalOpen}
          onClose={() => {
            setEmailModalOpen(false);
            setSelectedAlertForEmail(null);
          }}
          targetAlert={selectedAlertForEmail}
        />
      )}
    </div>
  );
}
