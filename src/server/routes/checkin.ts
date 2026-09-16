import { Router } from "express";
import { store } from "../store";
import { NotificationService } from "../services/notificationService";

export const checkinRouter = Router();

// POST /api/check-in/lookup
checkinRouter.post("/lookup", (req, res) => {
  const { pnr, lastName } = req.body || {};
  if (!pnr) {
    return res.status(400).json({ success: false, message: "PNR is required" });
  }

  const booking = store.getBooking(pnr);
  if (!booking) {
    return res.status(404).json({ success: false, message: `No booking found for PNR ${pnr}` });
  }

  if (lastName && !booking.passengerName.toLowerCase().includes(lastName.toLowerCase())) {
    return res.status(400).json({ success: false, message: "Last name does not match passenger record" });
  }

  const flight = store.getFlight(booking.flightNumber);

  res.json({
    success: true,
    booking,
    flight: flight || null,
  });
});

// POST /api/check-in/complete
checkinRouter.post("/complete", (req, res) => {
  const { pnr, seat, baggageCount, emergencyContact } = req.body || {};
  if (!pnr) {
    return res.status(400).json({ success: false, message: "PNR is required" });
  }

  const booking = store.getBooking(pnr);
  if (!booking) {
    return res.status(404).json({ success: false, message: `No booking found for PNR ${pnr}` });
  }

  const bpId = `BP-${booking.flightNumber}-${seat || booking.seat}-${pnr}`;

  const updated = store.updateBooking(pnr, {
    isCheckedIn: true,
    status: "CHECKED_IN",
    seat: seat || booking.seat,
    baggageCount: baggageCount !== undefined ? Number(baggageCount) : booking.baggageCount,
    boardingPassId: bpId,
  });

  const flight = store.getFlight(booking.flightNumber);

  // Asynchronously dispatch digital boarding pass via email/SMS
  if (updated) {
    NotificationService.sendCheckInConfirmation(updated, flight).catch((err) =>
      console.warn("[CheckIn] Notification dispatch error:", err)
    );
  }

  res.json({
    success: true,
    message: "Check-in completed successfully. Boarding pass issued.",
    boardingPass: {
      boardingPassId: bpId,
      pnr: booking.pnr,
      passengerName: booking.passengerName,
      flightNumber: booking.flightNumber,
      seat: updated?.seat || booking.seat,
      cabinClass: booking.cabinClass,
      gate: flight?.gate || "B12",
      terminal: flight?.terminal || "T3",
      boardingTime: "07:00",
      departureTime: flight?.departureTime || "07:40",
      origin: flight?.origin || "DEL",
      destination: flight?.destination || "CDG",
      qrCodeData: `SKYWAY::${pnr}::${booking.flightNumber}::${updated?.seat}::${bpId}`,
    },
  });
});
