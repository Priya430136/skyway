import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

export type FlightAlertType =
  | "gate_change"
  | "delay"
  | "boarding"
  | "cancellation"
  | "baggage_belt"
  | "weather_hazard"
  | "security"
  | "info";

export interface FlightAlert {
  id: string;
  type: FlightAlertType;
  pnr?: string;
  flightNumber: string;
  originCode: string;
  originCity: string;
  destinationCode: string;
  destinationCity: string;
  title: string;
  message: string;
  timestamp: string;
  createdAt: number;
  read: boolean;
  dismissed: boolean;
  severity: "critical" | "warning" | "info" | "success";
  isUrgent?: boolean;

  // Gate specific
  previousGate?: string;
  newGate?: string;
  terminal?: string;
  walkingTimeMinutes?: number;

  // Delay specific
  originalTime?: string;
  updatedTime?: string;
  delayDurationMinutes?: number;
  reason?: string;

  // Baggage specific
  carouselNumber?: string;

  // Actions
  actionUrl?: string;
  actionLabel?: string;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  recipientEmail: string;
  smsEnabled: boolean;
  recipientPhone: string;
  pushEnabled: boolean;
  inAppBannerEnabled: boolean;
  soundEnabled: boolean;
  toastPopupsEnabled: boolean;
  autoPollingEnabled: boolean;
  pollingIntervalSeconds: number; // 10, 15, 30, 60
  delayThresholdMinutes: number; // e.g. 15
  notifyOnGateChange: boolean;
  notifyOnBaggageCarousel: boolean;
  notifyOnBoardingCall: boolean;
}

export interface DispatchedEmail {
  id: string;
  alertId: string;
  recipient: string;
  subject: string;
  sentAt: string;
  flightNumber: string;
  pnr?: string;
  type: FlightAlertType;
  previewSnippet: string;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  emailEnabled: true,
  recipientEmail: "sehrawatpriya430@gmail.com",
  smsEnabled: true,
  recipientPhone: "+91 98765 43210",
  pushEnabled: true,
  inAppBannerEnabled: true,
  soundEnabled: true,
  toastPopupsEnabled: true,
  autoPollingEnabled: true,
  pollingIntervalSeconds: 15,
  delayThresholdMinutes: 15,
  notifyOnGateChange: true,
  notifyOnBaggageCarousel: true,
  notifyOnBoardingCall: true,
};

const INITIAL_ALERTS: FlightAlert[] = [
  {
    id: "alert-db-101",
    type: "gate_change",
    pnr: "SW9M2P",
    flightNumber: "SW-811",
    originCode: "BOM",
    originCity: "Mumbai",
    destinationCode: "DXB",
    destinationCity: "Dubai",
    title: "Urgent Gate Relocation: Gate C14",
    message:
      "Flight SW-811 to Dubai (DXB) has been reassigned from Gate C9 to Gate C14 (Terminal 2). Please proceed immediately via Concourse C East.",
    timestamp: "Just now",
    createdAt: Date.now() - 1000 * 60 * 2,
    read: false,
    dismissed: false,
    severity: "warning",
    isUrgent: true,
    previousGate: "Gate C9",
    newGate: "Gate C14",
    terminal: "Terminal 2",
    walkingTimeMinutes: 6,
    actionUrl: "/app/flight-status/SW-811",
    actionLabel: "View Live Gate Map",
  },
  {
    id: "alert-db-102",
    type: "delay",
    pnr: "SW8X4K",
    flightNumber: "SW-204",
    originCode: "DEL",
    originCity: "New Delhi",
    destinationCode: "BOM",
    destinationCity: "Mumbai",
    title: "Flight Delay Advisory (+55m)",
    message:
      "SW-204 is delayed by 55 minutes due to Air Traffic Control ground hold at Delhi Airport. Revised departure time is 07:25 AM.",
    timestamp: "8 mins ago",
    createdAt: Date.now() - 1000 * 60 * 8,
    read: false,
    dismissed: false,
    severity: "critical",
    isUrgent: true,
    originalTime: "06:30 AM",
    updatedTime: "07:25 AM",
    delayDurationMinutes: 55,
    reason: "Air Traffic Control (ATC) Flow Restriction at Indira Gandhi Int'l (DEL)",
    actionUrl: "/app/disruption",
    actionLabel: "Check Rebook & Vouchers",
  },
  {
    id: "alert-db-103",
    type: "boarding",
    pnr: "SW5T9R",
    flightNumber: "SW-501",
    originCode: "BLR",
    originCity: "Bengaluru",
    destinationCode: "DEL",
    destinationCity: "New Delhi",
    title: "Now Boarding: Gate 14 (Zones 1-2)",
    message:
      "Boarding has commenced for SW-501 to New Delhi at Gate 14. Priority boarding for Business and Gold Elite members.",
    timestamp: "20 mins ago",
    createdAt: Date.now() - 1000 * 60 * 20,
    read: true,
    dismissed: true,
    severity: "info",
    isUrgent: false,
    previousGate: "Gate 14",
    newGate: "Gate 14",
    terminal: "Terminal 1",
    actionUrl: "/app/check-in/SW5T9R/boarding-pass",
    actionLabel: "Show Boarding Pass",
  },
];

interface FlightAlertContextType {
  alerts: FlightAlert[];
  activeBannerAlert: FlightAlert | null;
  settings: NotificationSettings;
  dispatchedEmails: DispatchedEmail[];
  unreadCount: number;
  urgentCount: number;
  isPolling: boolean;
  lastPolledAt: Date | null;
  dbConnected: boolean;
  pollSecondsRemaining: number;
  updateSettings: (newSettings: Partial<NotificationSettings>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissAlert: (id: string) => void;
  restoreAlert: (id: string) => void;
  triggerSimulatedAlert: (type: FlightAlertType) => void;
  triggerServerSimulation: (scenario: "gate" | "delay" | "boarding" | "baggage" | "weather") => Promise<void>;
  broadcastAlert: (alertData: Partial<FlightAlert>) => Promise<boolean>;
  sendEmailNotification: (alert: FlightAlert, customRecipient?: string) => boolean;
  playAlertSound: () => void;
  pollDatabaseNow: () => Promise<void>;
  showToastForAlert: (alert: FlightAlert) => void;
}

const FlightAlertContext = createContext<FlightAlertContextType | undefined>(undefined);

// Web Audio API Chime Synthesizer
function playAirportChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Two-tone chime: F5 (698.46Hz) followed by A5 (880.00Hz)
    const now = ctx.currentTime;

    // Note 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(698.46, now);
    gain1.gain.setValueAtTime(0.16, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Note 2
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880.0, now + 0.22);
    gain2.gain.setValueAtTime(0.19, now + 0.22);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.22);
    osc2.stop(now + 0.8);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export function FlightAlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<FlightAlert[]>(() => {
    try {
      const saved = localStorage.getItem("skyway.flight_alerts");
      return saved ? JSON.parse(saved) : INITIAL_ALERTS;
    } catch {
      return INITIAL_ALERTS;
    }
  });

  const [settings, setSettings] = useState<NotificationSettings>(() => {
    try {
      const saved = localStorage.getItem("skyway.notification_settings");
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const [dispatchedEmails, setDispatchedEmails] = useState<DispatchedEmail[]>(() => {
    try {
      const saved = localStorage.getItem("skyway.dispatched_emails");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isPolling, setIsPolling] = useState(false);
  const [lastPolledAt, setLastPolledAt] = useState<Date | null>(new Date());
  const [dbConnected, setDbConnected] = useState(true);
  const [pollSecondsRemaining, setPollSecondsRemaining] = useState(settings.pollingIntervalSeconds);

  // Track known alert IDs to only toast newly polled alerts
  const seenAlertIdsRef = useRef<Set<string>>(new Set(alerts.map((a) => a.id)));
  const isFirstLoadRef = useRef(true);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("skyway.flight_alerts", JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem("skyway.notification_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem("skyway.dispatched_emails", JSON.stringify(dispatchedEmails));
  }, [dispatchedEmails]);

  const unreadCount = alerts.filter((a) => !a.read).length;
  const urgentCount = alerts.filter((a) => a.isUrgent || a.severity === "critical" || (a.severity === "warning" && !a.read)).length;

  // Active banner alert is the newest non-dismissed alert if inAppBannerEnabled
  const activeBannerAlert = settings.inAppBannerEnabled
    ? alerts.find((a) => !a.dismissed) || null
    : null;

  const playAlertSound = useCallback(() => {
    if (settings.soundEnabled) {
      playAirportChime();
    }
  }, [settings.soundEnabled]);

  // Rich Toast Interface Generator
  const showToastForAlert = useCallback(
    (alert: FlightAlert) => {
      if (!settings.toastPopupsEnabled) return;

      playAirportChime();

      const isCritical = alert.severity === "critical" || alert.type === "delay";
      const isGate = alert.type === "gate_change";

      const toastFn = isCritical ? toast.error : isGate ? toast.warning : toast.info;

      toastFn(`🔔 ${alert.title}`, {
        description: alert.message,
        duration: 8000,
        action: alert.actionUrl
          ? {
              label: alert.actionLabel || "View Status",
              onClick: () => {
                window.location.href = alert.actionUrl!;
              },
            }
          : undefined,
        cancel: {
          label: "Dismiss",
          onClick: () => {
            setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, dismissed: true, read: true } : a)));
          },
        },
      });
    },
    [settings.toastPopupsEnabled]
  );

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      toast.success("Notification preferences updated");
      return updated;
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    toast.success("All flight alerts marked as read");
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, dismissed: true } : a)));
  }, []);

  const restoreAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, dismissed: false } : a)));
    toast.success("Flight alert banner restored");
  }, []);

  const sendEmailNotification = useCallback(
    (alert: FlightAlert, customRecipient?: string): boolean => {
      const recipient = customRecipient || settingsRef.current.recipientEmail;
      if (!recipient) {
        toast.error("Please provide a valid email address to receive flight alerts.");
        return false;
      }

      const newEmail: DispatchedEmail = {
        id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        alertId: alert.id,
        recipient,
        subject: `[SkyWay Alert] ${alert.flightNumber} ${alert.title} (${alert.pnr || "TICKET"})`,
        sentAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        flightNumber: alert.flightNumber,
        pnr: alert.pnr,
        type: alert.type,
        previewSnippet: alert.message,
      };

      setDispatchedEmails((prev) => [newEmail, ...prev.slice(0, 25)]);
      toast.success(`Email alert dispatched to ${recipient}`, {
        description: `Subject: [SkyWay Alert] ${alert.flightNumber} ${alert.title}`,
      });
      return true;
    },
    []
  );

  // Poll Database for Urgent Travel Alerts
  const pollDatabaseNow = useCallback(async () => {
    setIsPolling(true);
    try {
      const res = await fetch("/api/alerts/urgent");
      if (!res.ok) throw new Error("Failed to poll alerts");
      const data = await res.json();

      setLastPolledAt(new Date());
      setDbConnected(Boolean(data.databaseConnected ?? true));

      if (data.alerts && Array.isArray(data.alerts)) {
        const fetchedAlerts: FlightAlert[] = data.alerts;

        // Check for new alerts that haven't been toasted yet
        const newAlerts: FlightAlert[] = [];
        fetchedAlerts.forEach((incoming) => {
          if (!seenAlertIdsRef.current.has(incoming.id)) {
            seenAlertIdsRef.current.add(incoming.id);
            if (!isFirstLoadRef.current) {
              newAlerts.push(incoming);
            }
          }
        });

        // Merge with existing local alerts (avoiding duplicates)
        setAlerts((prev) => {
          const map = new Map<string, FlightAlert>();
          // Existing overrides/read status
          prev.forEach((a) => map.set(a.id, a));
          // New from DB
          fetchedAlerts.forEach((a) => {
            if (map.has(a.id)) {
              // Keep user read/dismissed state
              const existing = map.get(a.id)!;
              map.set(a.id, { ...a, read: existing.read, dismissed: existing.dismissed });
            } else {
              map.set(a.id, a);
            }
          });
          return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
        });

        // Trigger immediate toasts for new alerts
        if (newAlerts.length > 0) {
          newAlerts.forEach((alert) => {
            showToastForAlert(alert);
            if (settingsRef.current.emailEnabled && settingsRef.current.recipientEmail) {
              sendEmailNotification(alert);
            }
          });
        }
      }
    } catch {
      setDbConnected(false);
    } finally {
      setIsPolling(false);
      setPollSecondsRemaining(settingsRef.current.pollingIntervalSeconds);
      isFirstLoadRef.current = false;
    }
  }, [showToastForAlert, sendEmailNotification]);

  // Keep a ref to pollDatabaseNow so setInterval doesn't recreate interval on every poll
  const pollDatabaseNowRef = useRef(pollDatabaseNow);
  useEffect(() => {
    pollDatabaseNowRef.current = pollDatabaseNow;
  }, [pollDatabaseNow]);

  // Automatic Polling Timer & Countdown Loop
  useEffect(() => {
    if (!settings.autoPollingEnabled) return;

    // Initial poll
    pollDatabaseNowRef.current();

    const interval = setInterval(() => {
      setPollSecondsRemaining((prev) => {
        if (prev <= 1) {
          pollDatabaseNowRef.current();
          return settingsRef.current.pollingIntervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.autoPollingEnabled]);

  // Server Simulation Helper (Triggers real DB/server alert and immediate toast)
  const triggerServerSimulation = useCallback(
    async (scenario: "gate" | "delay" | "boarding" | "baggage" | "weather") => {
      try {
        const res = await fetch("/api/alerts/test-trigger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenario }),
        });
        if (!res.ok) throw new Error("Simulation request failed");
        const data = await res.json();
        if (data.alert) {
          const newAlert: FlightAlert = data.alert;
          seenAlertIdsRef.current.add(newAlert.id);
          setAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)]);
          showToastForAlert(newAlert);
          if (settings.emailEnabled && settings.recipientEmail) {
            sendEmailNotification(newAlert);
          }
        }
      } catch (err: any) {
        toast.error("Simulation error: " + (err.message || "Failed to trigger"));
      }
    },
    [settings.emailEnabled, settings.recipientEmail, showToastForAlert, sendEmailNotification]
  );

  // Broadcast custom alert to backend
  const broadcastAlert = useCallback(
    async (alertData: Partial<FlightAlert>): Promise<boolean> => {
      try {
        const res = await fetch("/api/alerts/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(alertData),
        });
        if (!res.ok) throw new Error("Broadcast failed");
        const data = await res.json();
        if (data.alert) {
          const newAlert: FlightAlert = data.alert;
          seenAlertIdsRef.current.add(newAlert.id);
          setAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)]);
          showToastForAlert(newAlert);
          toast.success("Travel alert broadcast to all active dashboards");
          return true;
        }
        return false;
      } catch (err: any) {
        toast.error("Failed to broadcast alert: " + (err.message || ""));
        return false;
      }
    },
    [showToastForAlert]
  );

  // Client-side quick trigger simulation fallback
  const triggerSimulatedAlert = useCallback(
    (type: FlightAlertType) => {
      const scenarioMap: Record<string, "gate" | "delay" | "boarding" | "baggage" | "weather"> = {
        gate_change: "gate",
        delay: "delay",
        boarding: "boarding",
        baggage_belt: "baggage",
        weather_hazard: "weather",
      };
      const scenario = scenarioMap[type] || "gate";
      triggerServerSimulation(scenario);
    },
    [triggerServerSimulation]
  );

  return (
    <FlightAlertContext.Provider
      value={{
        alerts,
        activeBannerAlert,
        settings,
        dispatchedEmails,
        unreadCount,
        urgentCount,
        isPolling,
        lastPolledAt,
        dbConnected,
        pollSecondsRemaining,
        updateSettings,
        markAsRead,
        markAllAsRead,
        dismissAlert,
        restoreAlert,
        triggerSimulatedAlert,
        triggerServerSimulation,
        broadcastAlert,
        sendEmailNotification,
        playAlertSound,
        pollDatabaseNow,
        showToastForAlert,
      }}
    >
      {children}
    </FlightAlertContext.Provider>
  );
}

export function useFlightAlerts() {
  const context = useContext(FlightAlertContext);
  if (!context) {
    throw new Error("useFlightAlerts must be used within a FlightAlertProvider");
  }
  return context;
}
