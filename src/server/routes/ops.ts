import { Router } from "express";
import { store } from "../store";

export const opsRouter = Router();

// GET /api/ops/overview - operations dashboard overview
opsRouter.get("/overview", (req, res) => {
  const totalFlights = store.flights.length;
  const onTimeFlights = store.flights.filter((f) => f.status === "On Time" || f.status === "Scheduled").length;
  const delayedFlights = store.flights.filter((f) => f.status === "Delayed").length;
  const inAirFlights = store.flights.filter((f) => f.status === "In Air").length;
  const boardingFlights = store.flights.filter((f) => f.status === "Boarding").length;

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    metrics: {
      onTimePerformance: "92.8%",
      activeFlightsCount: totalFlights,
      inAir: inAirFlights,
      boarding: boardingFlights,
      delayed: delayedFlights,
      fuelEfficiencyScore: 94.2,
      fleetUtilization: "89.4%",
      averageTurnaroundMinutes: 38,
    },
    flights: store.flights,
    congestedAirports: [
      { code: "LHR", delayIndex: "Moderate", weather: "Light Rain", delayMinutes: 18 },
      { code: "JFK", delayIndex: "Low", weather: "Clear", delayMinutes: 4 },
      { code: "DEL", delayIndex: "Low", weather: "Clear", delayMinutes: 0 },
    ],
  });
});

// POST /api/ops/copilot - operations copilot assistant
opsRouter.post("/copilot", (req, res) => {
  const { query, prompt } = req.body || {};
  const input = (query || prompt || "").toLowerCase();

  let recommendation = {
    summary: "Operations flow is stable across all primary hubs with 92.8% on-time performance.",
    confidence: "96%",
    riskLevel: "Low",
    details: "DEL Hub departures running smoothly at T3. SW128 on schedule at Gate B12. SW204 experiencing a minor 25m turnaround delay due to inbound Maldives weather clearance.",
    actions: [
      "Keep Gate B12 assigned for SW128 boarding at 07:00",
      "Monitor LHR inbound slot delays for evening flight SW502",
      "Prioritize baggage transfer for connection passengers on SW720",
    ],
  };

  if (input.includes("delay") || input.includes("weather")) {
    recommendation = {
      summary: "Weather front over North Atlantic causing 15-20 min routing diversions.",
      confidence: "91%",
      riskLevel: "Medium",
      details: "Recommended flight level FL360 routing south of storm cell. Fuel burn increase estimated at +1.8%. No missed passenger connections expected.",
      actions: [
        "Advise flight dispatch to load +400kg contingency fuel on SW811",
        "Coordinate with JFK ATC for early descent clearance",
      ],
    };
  }

  res.json({
    success: true,
    recommendation,
  });
});
