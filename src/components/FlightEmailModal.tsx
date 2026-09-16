import React, { useState } from "react";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Plane,
  X,
  Copy,
  ExternalLink,
  Bell,
  ShieldCheck,
  QrCode,
  ArrowRight,
  Info,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { FlightAlert, useFlightAlerts } from "@/lib/flight-alert-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FlightEmailModalProps {
  alert: FlightAlert | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FlightEmailModal({ alert, isOpen, onClose }: FlightEmailModalProps) {
  const { settings, updateSettings, sendEmailNotification, dispatchedEmails } = useFlightAlerts();
  const [recipientEmail, setRecipientEmail] = useState(settings.recipientEmail || "sehrawatpriya430@gmail.com");
  const [activeTab, setActiveTab] = useState<"preview" | "settings" | "log">("preview");
  const [copied, setCopied] = useState(false);

  if (!isOpen || !alert) return null;

  const isGateChange = alert.type === "gate_change";
  const isDelay = alert.type === "delay";
  const isBoarding = alert.type === "boarding";

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !recipientEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    const success = sendEmailNotification(alert, recipientEmail);
    if (success) {
      updateSettings({ recipientEmail });
    }
  };

  const handleCopyEmailText = () => {
    const text = `
=========================================
SKYWAY AIRLINES - CRITICAL FLIGHT UPDATE
=========================================
Flight: ${alert.flightNumber} (${alert.originCode} → ${alert.destinationCode})
PNR: ${alert.pnr}
Subject: ${alert.title}
-----------------------------------------
${alert.message}

${alert.previousGate ? `PREVIOUS GATE: ${alert.previousGate} ➔ NEW GATE: ${alert.newGate} (${alert.terminal})` : ""}
${alert.originalTime ? `SCHEDULED DEPARTURE: ${alert.originalTime} ➔ REVISED TIME: ${alert.updatedTime} (+${alert.delayDurationMinutes}m Delay)` : ""}
${alert.reason ? `REASON: ${alert.reason}` : ""}

Please monitor airport screens and the SkyWay mobile app for gate closing times.
Support: +91 1800 209 8899 | skyway.example/help
=========================================
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Email text copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                Flight Alert Email Dispatcher
              </h3>
              <p className="text-xs text-slate-500">
                Automated email notification for {alert.flightNumber} ({alert.pnr})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-6 pt-2 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab("preview")}
            className={cn(
              "border-b-2 px-4 py-2.5 font-bold transition-all",
              activeTab === "preview"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            HTML Email Template
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              "border-b-2 px-4 py-2.5 font-bold transition-all",
              activeTab === "settings"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            Alert Delivery Settings
          </button>
          <button
            onClick={() => setActiveTab("log")}
            className={cn(
              "border-b-2 px-4 py-2.5 font-bold transition-all",
              activeTab === "log"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            Delivered Emails ({dispatchedEmails.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: EMAIL PREVIEW */}
          {activeTab === "preview" && (
            <div className="space-y-4">
              
              {/* Quick Send Bar */}
              <form onSubmit={handleSendEmail} className="flex flex-col sm:flex-row items-center gap-2 rounded-2xl bg-blue-50/70 p-3 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60">
                <div className="relative flex-1 w-full">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="Enter email to dispatch alert (e.g. user@example.com)"
                    className="pl-9 h-10 text-xs bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="flex w-full sm:w-auto gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    className="w-full sm:w-auto h-10 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" /> Send Test Email
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyEmailText}
                    className="h-10 rounded-xl text-xs font-semibold"
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </form>

              {/* Realistic Airlines HTML Email Template View */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
                {/* Email Header banner */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="font-display text-lg font-black tracking-tight text-blue-600 dark:text-blue-400">
                      SkyWay <span className="text-amber-500 font-sans text-xs font-bold uppercase tracking-wider">Airlines</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono text-[11px] font-bold border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    FLIGHT ADVISORY
                  </Badge>
                </div>

                {/* Main Alert Highlight Box */}
                <div className={cn(
                  "mt-5 rounded-2xl p-5 border",
                  isGateChange ? "border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/50 text-sky-950 dark:text-sky-100" :
                  isDelay ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50 text-amber-950 dark:text-amber-100" :
                  "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100"
                )}>
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold",
                      isGateChange ? "bg-sky-600 text-white" :
                      isDelay ? "bg-amber-500 text-white" :
                      "bg-emerald-600 text-white"
                    )}>
                      {isGateChange ? <MapPin className="h-5 w-5" /> : isDelay ? <Clock className="h-5 w-5" /> : <Plane className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-base tracking-tight">
                        {alert.title}
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed opacity-90">
                        {alert.message}
                      </p>

                      {/* Gate Comparison Pill */}
                      {alert.previousGate && alert.newGate && (
                        <div className="mt-3 inline-flex items-center gap-3 rounded-xl bg-white/80 dark:bg-slate-900/80 px-3.5 py-2 text-xs font-bold shadow-sm">
                          <span className="text-slate-400 line-through">{alert.previousGate}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          <span className="text-blue-600 dark:text-blue-400 text-sm font-black">{alert.newGate}</span>
                          <span className="text-slate-400 font-normal">({alert.terminal})</span>
                        </div>
                      )}

                      {/* Delay Time Pill */}
                      {alert.originalTime && alert.updatedTime && (
                        <div className="mt-3 inline-flex items-center gap-3 rounded-xl bg-white/80 dark:bg-slate-900/80 px-3.5 py-2 text-xs font-bold shadow-sm">
                          <span className="text-slate-400 line-through">Scheduled: {alert.originalTime}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          <span className="text-amber-600 dark:text-amber-400 text-sm font-black">Estimated: {alert.updatedTime}</span>
                          <Badge className="bg-amber-500 text-white text-[10px]">+{alert.delayDurationMinutes}m Delay</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Itinerary Details Table */}
                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                    <div>
                      <span className="text-slate-400 block font-semibold">Passenger</span>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100">Arjun Reddy</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Booking PNR</span>
                      <span className="font-mono font-extrabold text-slate-900 dark:text-slate-100">{alert.pnr}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Flight</span>
                      <span className="font-mono font-extrabold text-slate-900 dark:text-slate-100">{alert.flightNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Route</span>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100">{alert.originCode} &rarr; {alert.destinationCode}</span>
                    </div>
                  </div>
                </div>

                {/* Footer in Email */}
                <div className="mt-6 border-t border-slate-100 pt-4 text-[11px] text-slate-400 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <span>SkyWay Automated Passenger Notification System</span>
                  <span>Sent to {recipientEmail}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-5">
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                  Flight Alerts & Notification Channels
                </h4>
                <p className="text-xs text-slate-500">
                  Control when and how you receive alerts about gate changes, aircraft delays, and boarding calls.
                </p>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                {/* Email Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Email Flight Alerts</div>
                    <div className="text-[11px] text-slate-500">Send immediate email whenever a gate changes or delay exceeds threshold</div>
                  </div>
                  <Switch
                    checked={settings.emailEnabled}
                    onCheckedChange={(checked) => updateSettings({ emailEnabled: checked })}
                  />
                </div>

                {/* UI Banner Toggle */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">In-App UI Banner Alert</div>
                    <div className="text-[11px] text-slate-500">Show persistent, high-contrast banner at top of passenger screen</div>
                  </div>
                  <Switch
                    checked={settings.inAppBannerEnabled}
                    onCheckedChange={(checked) => updateSettings({ inAppBannerEnabled: checked })}
                  />
                </div>

                {/* Audio Chime */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Airport Chime Sound</div>
                    <div className="text-[11px] text-slate-500">Play authentic airport two-tone chime when an alert is broadcast</div>
                  </div>
                  <Switch
                    checked={settings.soundEnabled}
                    onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
                  />
                </div>

                {/* Gate Change Specific */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Gate Assignment & Relocation Alerts</div>
                    <div className="text-[11px] text-slate-500">Instant notification when departure or arrival gate changes</div>
                  </div>
                  <Switch
                    checked={settings.notifyOnGateChange}
                    onCheckedChange={(checked) => updateSettings({ notifyOnGateChange: checked })}
                  />
                </div>

                {/* Baggage Belt Alert */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Baggage Carousel Updates</div>
                    <div className="text-[11px] text-slate-500">Alert when arrival luggage carousel number is assigned</div>
                  </div>
                  <Switch
                    checked={settings.notifyOnBaggageCarousel}
                    onCheckedChange={(checked) => updateSettings({ notifyOnBaggageCarousel: checked })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DELIVERED EMAILS LOG */}
          {activeTab === "log" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                  Dispatched Email Audit Log
                </h4>
                <p className="text-xs text-slate-500">
                  Record of all simulated email flight alerts sent during this session
                </p>
              </div>

              {dispatchedEmails.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 dark:border-slate-800">
                  <Mail className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  No emails dispatched yet. Click &quot;Send Test Email&quot; in the preview tab to trigger one.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {dispatchedEmails.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200/80 bg-white p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="font-bold text-slate-900 dark:text-slate-100">{item.subject}</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">{item.sentAt}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                        <span>Recipient: <strong className="text-slate-700 dark:text-slate-300">{item.recipient}</strong></span>
                        <span>&bull;</span>
                        <span>PNR: <strong className="font-mono text-slate-700 dark:text-slate-300">{item.pnr}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-800/40 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs font-semibold">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
