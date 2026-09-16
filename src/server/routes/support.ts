import { Router } from "express";
import { store, type SupportTicketRecord } from "../store";

export const supportRouter = Router();

// GET /api/support/tickets
supportRouter.get("/tickets", (req, res) => {
  const email = req.query.email as string;
  if (email) {
    const userTickets = store.tickets.filter(
      (t) => t.passengerEmail.toLowerCase() === email.toLowerCase()
    );
    return res.json({ success: true, tickets: userTickets });
  }

  res.json({ success: true, tickets: store.tickets });
});

// POST /api/support/tickets - create ticket
supportRouter.post("/tickets", (req, res) => {
  const {
    passengerEmail,
    passengerName,
    pnr,
    category = "General",
    subject,
    message,
    priority = "Medium",
  } = req.body || {};

  if (!passengerEmail || !subject) {
    return res.status(400).json({
      success: false,
      message: "passengerEmail and subject are required",
    });
  }

  const ticketId = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;

  const newTicket: SupportTicketRecord = {
    id: ticketId,
    passengerEmail,
    passengerName: passengerName || "SkyWay Guest",
    pnr,
    category,
    subject,
    status: "Open",
    priority,
    createdAt: new Date().toISOString(),
    messages: [
      {
        sender: "passenger",
        senderName: passengerName || "Passenger",
        text: message || subject,
        timestamp: new Date().toISOString(),
      },
      {
        sender: "ai",
        senderName: "SkyWay AI Agent",
        text: `Thank you for reaching out to SkyWay Customer Care. Your ticket #${ticketId} has been logged. Our priority support team is reviewing your request.`,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  store.addTicket(newTicket);

  res.status(201).json({
    success: true,
    message: "Support ticket submitted successfully",
    ticket: newTicket,
  });
});

// POST /api/support/compensation-calc - calculate delay compensation under EU261 / DGCA guidelines
supportRouter.post("/compensation-calc", (req, res) => {
  const { flightDistanceKm = 6500, delayHours = 3.5, reason = "Technical" } = req.body || {};

  const dist = Number(flightDistanceKm);
  const hours = Number(delayHours);

  let eligible = false;
  let estimatedAmount = 0;
  const currency = "INR";
  let explanation = "";

  if (hours >= 3 && reason !== "Severe Weather") {
    eligible = true;
    if (dist <= 1500) {
      estimatedAmount = 22000;
      explanation = "Eligible for short-haul flight delay compensation (Up to 1,500km).";
    } else if (dist <= 3500) {
      estimatedAmount = 35000;
      explanation = "Eligible for medium-haul flight delay compensation (1,500km - 3,500km).";
    } else {
      estimatedAmount = 52000;
      explanation = "Eligible for long-haul flight delay compensation (Over 3,500km, 3+ hours delay).";
    }
  } else {
    eligible = false;
    explanation = hours < 3
      ? "Delays under 3 hours are not eligible for statutory compensation, but meal vouchers apply."
      : "Delays caused by extraordinary weather conditions are exempt from monetary compensation.";
  }

  res.json({
    success: true,
    calculation: {
      eligible,
      estimatedAmount,
      currency,
      explanation,
      delayHours: hours,
      flightDistanceKm: dist,
      policyReference: "DGCA CAR Section 3 / EU261 Regulation",
    },
  });
});
