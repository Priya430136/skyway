import { Router } from "express";
import { BookingService } from "../services/bookingService";
import { store } from "../store";

export const bookingsRouter = Router();

// GET /api/bookings - list bookings
bookingsRouter.get("/", async (req, res) => {
  try {
    const email = req.query.email as string;
    const result = await BookingService.getBookings(email);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve bookings",
      details: error.message,
    });
  }
});

// GET /api/bookings/check-seat - check seat availability and collision
bookingsRouter.get("/check-seat", async (req, res) => {
  try {
    const flightNumber = (req.query.flightNumber as string || "").toUpperCase();
    const cabin = (req.query.cabin as string || "ECONOMY").toUpperCase();
    const seat = req.query.seat as string | undefined;

    if (!flightNumber) {
      return res.status(400).json({
        success: false,
        message: "flightNumber query parameter is required",
      });
    }

    const availability = await BookingService.checkSeatAvailability(flightNumber, cabin, seat);
    return res.json({
      success: true,
      availability,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to check seat availability",
      details: error.message,
    });
  }
});

// GET /api/bookings/:pnr
bookingsRouter.get("/:pnr", async (req, res) => {
  try {
    const pnr = req.params.pnr;
    const result = await BookingService.getBookingByPnr(pnr);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: `Booking with PNR ${pnr} not found`,
      });
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
      details: error.message,
    });
  }
});

// POST /api/bookings - create a new booking with transaction logic
bookingsRouter.post("/", async (req, res) => {
  try {
    const {
      flightNumber = "SW128",
      passengerName,
      passengerEmail,
      passengerPhone = "+91 98765 43210",
      seat = "12A",
      cabinClass = "Economy",
      baggageCount = 1,
      specialAssistance,
      mealPreference,
      totalPaid,
      currency = "INR",
      passportNumber,
      nationality,
    } = req.body || {};

    if (!passengerName || !passengerEmail) {
      return res.status(400).json({
        success: false,
        message: "passengerName and passengerEmail are required",
      });
    }

    // Execute booking via BookingService transaction
    const bookingResult = await BookingService.createBooking({
      flightNumber,
      passengerName,
      passengerEmail,
      passengerPhone,
      seatNumber: seat,
      cabinClass,
      baggageCount: Number(baggageCount),
      specialAssistance,
      mealPreference,
      totalPaid: totalPaid ? Number(totalPaid) : undefined,
      currency,
      passportNumber,
      nationality,
    });

    return res.status(201).json({
      success: true,
      message: "Booking created and confirmed successfully.",
      ...bookingResult,
    });
  } catch (error: any) {
    const status = error.message.includes("Sold out") || error.message.includes("already reserved") ? 409 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to complete flight booking.",
    });
  }
});

// POST /api/bookings/:pnr/cancel - cancel booking and restore seat inventory
bookingsRouter.post("/:pnr/cancel", async (req, res) => {
  try {
    const pnr = req.params.pnr;
    const reason = req.body?.reason;
    const result = await BookingService.cancelBooking(pnr, reason);
    return res.json({
      success: true,
      message: `Booking ${pnr} has been cancelled and seat returned to inventory.`,
      ...result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to cancel booking",
    });
  }
});

// PATCH /api/bookings/:pnr - update seat, baggage, meal, etc.
bookingsRouter.patch("/:pnr", (req, res) => {
  const pnr = req.params.pnr;
  const updates = req.body || {};

  const updated = store.updateBooking(pnr, updates);
  if (!updated) {
    return res.status(404).json({
      success: false,
      message: `Booking with PNR ${pnr} not found`,
    });
  }

  return res.json({
    success: true,
    message: "Booking updated successfully",
    booking: updated,
  });
});
