import { Router } from "express";
import { getDb, isDbConnected, schema } from "../../db";
import { store } from "../store";

export const dbRouter = Router();

// GET /api/db/status
dbRouter.get("/status", async (req, res) => {
  const connected = await isDbConnected();
  res.json({
    success: true,
    engine: "PostgreSQL",
    connected,
    dialect: "drizzle-orm/pg",
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
    tables: [
      "airports",
      "flights",
      "passengers",
      "bookings",
      "support_tickets",
      "ops_logs",
      "feedback",
    ],
    timestamp: new Date().toISOString(),
  });
});

// POST /api/db/seed
dbRouter.post("/seed", async (req, res) => {
  try {
    const connected = await isDbConnected();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "PostgreSQL instance not reachable. Falling back to in-memory store.",
        fallbackCount: {
          airports: store.airports.length,
          flights: store.flights.length,
          bookings: store.bookings.length,
          tickets: store.tickets.length,
        },
      });
    }

    const db = getDb();
    
    // Seed airports
    for (const a of store.airports) {
      await db
        .insert(schema.airports)
        .values({
          code: a.code,
          name: a.name,
          city: a.city,
          country: a.country,
          latitude: a.lat.toString(),
          longitude: a.lng.toString(),
          timezone: a.timezone,
          activeRunways: a.activeRunways,
        })
        .onConflictDoNothing();
    }

    // Seed flights
    for (const f of store.flights) {
      await db
        .insert(schema.flights)
        .values({
          flightNumber: f.flightNumber,
          originCode: f.origin,
          destinationCode: f.destination,
          departureTime: f.departureTime,
          arrivalTime: f.arrivalTime,
          duration: f.duration,
          aircraft: f.aircraft,
          status: f.status,
          gate: f.gate,
          terminal: f.terminal,
          priceEconomy: f.priceEconomy,
          pricePremium: f.pricePremium,
          priceBusiness: f.priceBusiness,
          priceFirst: f.priceFirst,
          seatsEconomyAvailable: f.seatsAvailable.economy,
          seatsPremiumAvailable: f.seatsAvailable.premium,
          seatsBusinessAvailable: f.seatsAvailable.business,
          seatsFirstAvailable: f.seatsAvailable.first,
          onTimePct: f.onTimePct,
          baggageCarousel: f.baggageCarousel,
          delayMinutes: f.delayMinutes || 0,
        })
        .onConflictDoNothing();
    }

    // Seed bookings
    for (const b of store.bookings) {
      await db
        .insert(schema.bookings)
        .values({
          pnr: b.pnr,
          flightNumber: b.flightNumber,
          passengerName: b.passengerName,
          passengerEmail: b.passengerEmail,
          passengerPhone: b.passengerPhone,
          cabinClass: b.cabinClass,
          seatNumber: b.seat,
          isCheckedIn: b.isCheckedIn,
          boardingPassId: b.boardingPassId,
          baggageCount: b.baggageCount,
          specialAssistance: b.specialAssistance,
          mealPreference: b.mealPreference,
          totalPaid: b.totalPaid,
          currency: b.currency,
          bookingDate: b.bookingDate,
          status: b.status,
        })
        .onConflictDoNothing();
    }

    return res.json({
      success: true,
      message: "Database successfully populated with flight records and PNRs.",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to seed PostgreSQL",
    });
  }
});
