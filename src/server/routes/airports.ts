import { Router } from "express";
import { store } from "../store";

export const airportsRouter = Router();

// GET /api/airports - list all served airports with live local weather
airportsRouter.get("/", (req, res) => {
  res.json({
    success: true,
    total: store.airports.length,
    airports: store.airports,
  });
});

// GET /api/airports/:code - single airport
airportsRouter.get("/:code", (req, res) => {
  const code = req.params.code.toUpperCase();
  const airport = store.airports.find((a) => a.code === code);

  if (!airport) {
    return res.status(404).json({ success: false, message: `Airport ${code} not found` });
  }

  // Find incoming and outgoing flights
  const departures = store.flights.filter((f) => f.origin === code);
  const arrivals = store.flights.filter((f) => f.destination === code);

  res.json({
    success: true,
    airport,
    departures,
    arrivals,
  });
});
