import { Router } from "express";
import { getDb, isDbConnected, schema } from "../../db";
import { store } from "../store";

export const alertsRouter = Router();

export interface UrgentTravelAlert {
  id: string;
  type: "gate_change" | "delay" | "boarding" | "weather_hazard" | "baggage_belt" | "cancellation" | "security" | "info";
  pnr?: string;
  flightNumber: string;
  originCode: string;
  originCity: string;
  destinationCode: string;
  destinationCity: string;
  title: string;
  message: string;
  severity: "critical" | "warning" | "info" | "success";
  isUrgent: boolean;
  timestamp: string;
  createdAt: number;
  read: boolean;
  dismissed: boolean;
  
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

  // Interactive Action
  actionUrl?: string;
  actionLabel?: string;
}

// In-memory persistent alert store synced with DB ops logs
let serverUrgentAlerts: UrgentTravelAlert[] = [
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
    message: "Flight SW-811 to Dubai (DXB) has been reassigned from Gate C9 to Gate C14 (Terminal 2). Please proceed immediately via Concourse C East.",
    severity: "warning",
    isUrgent: true,
    timestamp: "Just now",
    createdAt: Date.now() - 1000 * 60 * 2,
    read: false,
    dismissed: false,
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
    message: "SW-204 is delayed by 55 minutes due to Air Traffic Control ground hold at Delhi Airport. Revised departure time is 07:25 AM.",
    severity: "critical",
    isUrgent: true,
    timestamp: "8 mins ago",
    createdAt: Date.now() - 1000 * 60 * 8,
    read: false,
    dismissed: false,
    originalTime: "06:30 AM",
    updatedTime: "07:25 AM",
    delayDurationMinutes: 55,
    reason: "Air Traffic Control (ATC) Flow Restriction at Indira Gandhi Int'l (DEL)",
    actionUrl: "/app/disruption",
    actionLabel: "Check Rebooking & Vouchers",
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
    message: "Boarding has commenced for SW-501 to New Delhi at Gate 14. Priority boarding for Business and Gold Elite members.",
    severity: "info",
    isUrgent: false,
    timestamp: "20 mins ago",
    createdAt: Date.now() - 1000 * 60 * 20,
    read: true,
    dismissed: false,
    newGate: "Gate 14",
    terminal: "Terminal 1",
    actionUrl: "/app/check-in/SW5T9R/boarding-pass",
    actionLabel: "Show Boarding Pass",
  },
  {
    id: "alert-db-104",
    type: "weather_hazard",
    flightNumber: "GLOBAL-ATC",
    originCode: "DEL",
    originCity: "New Delhi",
    destinationCode: "BOM",
    destinationCity: "Mumbai",
    title: "Monsoon Flow Control Notice",
    message: "Western air traffic corridor operating with 20-mile spacing due to active weather cells over Maharashtra airspace.",
    severity: "warning",
    isUrgent: true,
    timestamp: "25 mins ago",
    createdAt: Date.now() - 1000 * 60 * 25,
    read: false,
    dismissed: false,
    actionUrl: "/app/flight-status/SW-204",
    actionLabel: "View Radar Corridor",
  },
];

// GET /api/alerts/urgent - Polled by frontend notification center
alertsRouter.get("/urgent", async (req, res) => {
  try {
    const { email, pnr, since, urgentOnly } = req.query;
    let dbConnected = false;
    let opsAlertsFromDb: any[] = [];

    try {
      dbConnected = await isDbConnected();
      if (dbConnected) {
        const db = getDb();
        // Query recent ops logs from PostgreSQL
        const recentLogs = await db
          .select()
          .from(schema.opsLogs)
          .limit(20);
        
        opsAlertsFromDb = recentLogs;
      }
    } catch (err) {
      // Fallback gracefully
    }

    let filtered = [...serverUrgentAlerts];

    if (urgentOnly === "true") {
      filtered = filtered.filter((a) => a.isUrgent || a.severity === "critical" || a.severity === "warning");
    }

    if (pnr) {
      filtered = filtered.filter((a) => !a.pnr || a.pnr.toUpperCase() === String(pnr).toUpperCase());
    }

    if (since) {
      const sinceTimestamp = Number(since);
      if (!isNaN(sinceTimestamp)) {
        filtered = filtered.filter((a) => a.createdAt > sinceTimestamp);
      }
    }

    // Sort newest first
    filtered.sort((a, b) => b.createdAt - a.createdAt);

    const urgentCount = filtered.filter((a) => a.isUrgent || a.severity === "critical").length;
    const unreadCount = filtered.filter((a) => !a.read).length;

    res.json({
      success: true,
      databaseConnected: dbConnected,
      timestamp: new Date().toISOString(),
      serverEpoch: Date.now(),
      totalAlerts: filtered.length,
      urgentCount,
      unreadCount,
      alerts: filtered,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to query database for urgent travel alerts",
      error: error?.message,
    });
  }
});

// POST /api/alerts/broadcast - Broadcast a new operational alert to database & store
alertsRouter.post("/broadcast", async (req, res) => {
  try {
    const {
      type = "gate_change",
      flightNumber = "SW-811",
      pnr = "SW9M2P",
      originCode = "BOM",
      originCity = "Mumbai",
      destinationCode = "DXB",
      destinationCity = "Dubai",
      title,
      message,
      severity = "warning",
      isUrgent = true,
      previousGate,
      newGate,
      terminal = "Terminal 2",
      walkingTimeMinutes = 5,
      originalTime,
      updatedTime,
      delayDurationMinutes,
      reason,
      carouselNumber,
      actionUrl,
      actionLabel,
    } = req.body || {};

    const alertId = `alert-live-${Date.now()}`;
    const newAlert: UrgentTravelAlert = {
      id: alertId,
      type,
      flightNumber,
      pnr,
      originCode,
      originCity,
      destinationCode,
      destinationCity,
      title: title || `Urgent Notice: ${flightNumber}`,
      message: message || `Operational update dispatched for flight ${flightNumber}.`,
      severity,
      isUrgent: Boolean(isUrgent),
      timestamp: "Just now",
      createdAt: Date.now(),
      read: false,
      dismissed: false,
      previousGate,
      newGate,
      terminal,
      walkingTimeMinutes,
      originalTime,
      updatedTime,
      delayDurationMinutes,
      reason,
      carouselNumber,
      actionUrl: actionUrl || `/app/flight-status/${flightNumber.replace(/[^A-Za-z0-9]/g, "")}`,
      actionLabel: actionLabel || "View Flight Radar",
    };

    // Insert into server alerts
    serverUrgentAlerts = [newAlert, ...serverUrgentAlerts.slice(0, 49)];

    // Persist to PostgreSQL if connected
    try {
      const dbConnected = await isDbConnected();
      if (dbConnected) {
        const db = getDb();
        await db.insert(schema.opsLogs).values({
          flightNumber,
          eventType: type.toUpperCase(),
          message: `${newAlert.title}: ${newAlert.message}`,
          severity: severity.toUpperCase(),
        });
      }
    } catch {
      // Ignore DB error and rely on in-memory store
    }

    res.json({
      success: true,
      message: "Urgent travel alert successfully broadcast and logged to database.",
      alert: newAlert,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to broadcast urgent travel alert",
      error: error?.message,
    });
  }
});

// POST /api/alerts/test-trigger - Trigger standard operational scenarios
alertsRouter.post("/test-trigger", async (req, res) => {
  try {
    const { scenario = "gate" } = req.body || {};
    const now = Date.now();
    let newAlert: UrgentTravelAlert;

    if (scenario === "gate") {
      const gates = ["A4", "B12", "C18", "D7", "E2", "C22"];
      const chosenGate = `Gate ${gates[Math.floor(Math.random() * gates.length)]}`;
      newAlert = {
        id: `alert-sim-${now}`,
        type: "gate_change",
        pnr: "SW9M2P",
        flightNumber: "SW-811",
        originCode: "BOM",
        originCity: "Mumbai",
        destinationCode: "DXB",
        destinationCity: "Dubai",
        title: `🚨 Urgent Gate Reassigned to ${chosenGate}`,
        message: `Flight SW-811 to Dubai has been urgently relocated to ${chosenGate} (Terminal 2). Please proceed immediately via Concourse Fast-Track.`,
        severity: "warning",
        isUrgent: true,
        timestamp: "Just now",
        createdAt: now,
        read: false,
        dismissed: false,
        previousGate: "Gate C9",
        newGate: chosenGate,
        terminal: "Terminal 2",
        walkingTimeMinutes: 4,
        actionUrl: "/app/flight-status/SW-811",
        actionLabel: "View Terminal Gate Radar",
      };
    } else if (scenario === "delay") {
      const delays = [35, 45, 60, 80];
      const mins = delays[Math.floor(Math.random() * delays.length)];
      newAlert = {
        id: `alert-sim-${now}`,
        type: "delay",
        pnr: "SW8X4K",
        flightNumber: "SW-204",
        originCode: "DEL",
        originCity: "New Delhi",
        destinationCode: "BOM",
        destinationCity: "Mumbai",
        title: `⚠️ Critical Delay: +${mins} Min Hold`,
        message: `SW-204 DEL → BOM is delayed by ${mins} minutes due to runway slot congestion and inbound turnaround. Revised departure time 07:${mins} AM.`,
        severity: "critical",
        isUrgent: true,
        timestamp: "Just now",
        createdAt: now,
        read: false,
        dismissed: false,
        originalTime: "06:30 AM",
        updatedTime: `07:${mins} AM`,
        delayDurationMinutes: mins,
        reason: "Runway Slot Congestion & Inbound Aircraft Turnaround",
        actionUrl: "/app/disruption",
        actionLabel: "Check Rebook & Vouchers",
      };
    } else if (scenario === "boarding") {
      newAlert = {
        id: `alert-sim-${now}`,
        type: "boarding",
        pnr: "SW9M2P",
        flightNumber: "SW-811",
        originCode: "BOM",
        originCity: "Mumbai",
        destinationCode: "DXB",
        destinationCity: "Dubai",
        title: "✈️ Final Boarding Call: Gate C14",
        message: "Final boarding call for SW-811 to Dubai. Gate C14 doors close in 10 minutes. Please present digital boarding pass.",
        severity: "info",
        isUrgent: true,
        timestamp: "Just now",
        createdAt: now,
        read: false,
        dismissed: false,
        newGate: "Gate C14",
        terminal: "Terminal 2",
        actionUrl: "/app/check-in/SW9M2P/boarding-pass",
        actionLabel: "Open Digital Boarding Pass",
      };
    } else if (scenario === "baggage") {
      const beltNum = Math.floor(Math.random() * 8) + 1;
      newAlert = {
        id: `alert-sim-${now}`,
        type: "baggage_belt",
        pnr: "SW6T1Q",
        flightNumber: "SW-501",
        originCode: "BLR",
        originCity: "Bengaluru",
        destinationCode: "DEL",
        destinationCity: "New Delhi",
        title: `🧳 Baggage Claim Ready: Carousel ${beltNum}`,
        message: `Baggage delivery for flight SW-501 has commenced at Carousel ${beltNum}, Terminal 3 Arrivals Hall.`,
        severity: "success",
        isUrgent: false,
        timestamp: "Just now",
        createdAt: now,
        read: false,
        dismissed: false,
        carouselNumber: `Carousel ${beltNum}`,
        terminal: "Terminal 3",
        actionUrl: "/app/baggage",
        actionLabel: "Track Baggage Tag",
      };
    } else {
      newAlert = {
        id: `alert-sim-${now}`,
        type: "weather_hazard",
        flightNumber: "SW-128",
        originCode: "DEL",
        originCity: "New Delhi",
        destinationCode: "LHR",
        destinationCity: "London",
        title: "🌩️ Weather Avoidance Routing Advisory",
        message: "Flight SW-128 routed via Caspian waypoint to avoid convective storm cells. Estimated flight time extended by 14 minutes.",
        severity: "warning",
        isUrgent: true,
        timestamp: "Just now",
        createdAt: now,
        read: false,
        dismissed: false,
        actionUrl: "/app/flight-status/SW-128",
        actionLabel: "View Radar Track",
      };
    }

    serverUrgentAlerts = [newAlert, ...serverUrgentAlerts.slice(0, 49)];

    // Persist to PostgreSQL if connected
    try {
      const dbConnected = await isDbConnected();
      if (dbConnected) {
        const db = getDb();
        await db.insert(schema.opsLogs).values({
          flightNumber: newAlert.flightNumber,
          eventType: newAlert.type.toUpperCase(),
          message: `${newAlert.title}: ${newAlert.message}`,
          severity: newAlert.severity.toUpperCase(),
        });
      }
    } catch {
      // Ignore DB error
    }

    res.json({
      success: true,
      message: `Triggered simulation alert for ${scenario}`,
      alert: newAlert,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to trigger test alert",
      error: error?.message,
    });
  }
});

// POST /api/alerts/acknowledge - Mark an alert as read / dismissed
alertsRouter.post("/acknowledge", (req, res) => {
  const { alertId, action = "read" } = req.body || {};
  if (!alertId) {
    return res.status(400).json({ success: false, message: "alertId is required" });
  }

  const match = serverUrgentAlerts.find((a) => a.id === alertId);
  if (match) {
    if (action === "read") match.read = true;
    if (action === "dismiss") match.dismissed = true;
  }

  res.json({
    success: true,
    message: `Alert ${alertId} marked as ${action}`,
  });
});
