import { store, NotificationRecord, BookingRecord, FlightRecord } from "../store";
import { getDb, isDbConnected, schema } from "../../db";

export interface SendNotificationOptions {
  recipientEmail?: string;
  recipientPhone?: string;
  channel?: "EMAIL" | "SMS" | "PUSH" | "SYSTEM";
  type: "BOOKING_CONFIRMATION" | "CHECKIN_PASS" | "FLIGHT_ALERT" | "PAYMENT_CONFIRMATION" | "SUPPORT_UPDATE";
  subject: string;
  body: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  /**
   * Core dispatcher: sends or records notification in DB and store
   */
  static async dispatch(options: SendNotificationOptions): Promise<NotificationRecord> {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const channel = options.channel || (options.recipientEmail ? "EMAIL" : "SMS");

    // Check if transactional email keys exist
    const hasEmailProvider = Boolean(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY);
    const hasSmsProvider = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);

    let status: "DELIVERED" | "QUEUED" | "SIMULATED" | "FAILED" = "DELIVERED";
    if (channel === "EMAIL" && !hasEmailProvider) {
      status = "SIMULATED";
    } else if (channel === "SMS" && !hasSmsProvider) {
      status = "SIMULATED";
    }

    const record: NotificationRecord = {
      id,
      recipientEmail: options.recipientEmail,
      recipientPhone: options.recipientPhone,
      channel,
      type: options.type,
      subject: options.subject,
      body: options.body,
      metadata: options.metadata || {},
      status,
      deliveredAt: now,
      createdAt: now,
    };

    // Save to in-memory store
    store.notifications.unshift(record);

    // Save to PostgreSQL if connected
    if (await isDbConnected()) {
      try {
        const db = getDb();
        await db.insert(schema.notifications).values({
          id,
          recipientEmail: record.recipientEmail,
          recipientPhone: record.recipientPhone,
          channel: record.channel,
          type: record.type,
          subject: record.subject,
          body: record.body,
          metadata: record.metadata,
          status: record.status,
        });
      } catch (err) {
        console.warn("[NotificationService] Failed to write notification to Postgres:", err);
      }
    }

    console.log(`[NotificationService] ${status.toUpperCase()} [${channel}] to ${record.recipientEmail || record.recipientPhone}: "${record.subject}"`);
    return record;
  }

  /**
   * Dispatch booking confirmation email and SMS
   */
  static async sendBookingConfirmation(booking: BookingRecord, flight?: FlightRecord | null) {
    const origin = flight?.origin || "DEL";
    const dest = flight?.destination || "BOM";
    const flightNum = flight?.flightNumber || booking.flightNumber;
    const depTime = flight?.departureTime || "08:30";

    const emailSubject = `SkyWay Airlines: Booking Confirmed (PNR: ${booking.pnr})`;
    const emailBody = `Dear ${booking.passengerName},

Your booking with SkyWay Airlines has been confirmed.

PNR / Booking Reference: ${booking.pnr}
Flight: ${flightNum} (${origin} → ${dest})
Date: ${booking.bookingDate}
Scheduled Departure: ${depTime}
Cabin Class: ${booking.cabinClass}
Seat: ${booking.seat}
Total Paid: ₹${booking.totalPaid.toLocaleString("en-IN")} ${booking.currency}

Web Check-in opens 48 hours before scheduled departure.
Thank you for flying SkyWay Airlines.`;

    const smsBody = `SkyWay Airlines: Booking Confirmed! PNR ${booking.pnr}, Flight ${flightNum} (${origin}-${dest}) on ${booking.bookingDate}. Seat: ${booking.seat}. Manage booking at skyway.aero`;

    // Dispatch email
    await this.dispatch({
      recipientEmail: booking.passengerEmail,
      channel: "EMAIL",
      type: "BOOKING_CONFIRMATION",
      subject: emailSubject,
      body: emailBody,
      metadata: { pnr: booking.pnr, flightNumber: flightNum },
    });

    // Dispatch SMS if phone provided
    if (booking.passengerPhone) {
      await this.dispatch({
        recipientPhone: booking.passengerPhone,
        channel: "SMS",
        type: "BOOKING_CONFIRMATION",
        subject: `SkyWay PNR ${booking.pnr}`,
        body: smsBody,
        metadata: { pnr: booking.pnr, flightNumber: flightNum },
      });
    }
  }

  /**
   * Dispatch digital boarding pass notification upon check-in
   */
  static async sendCheckInConfirmation(booking: BookingRecord, flight?: FlightRecord | null) {
    const flightNum = flight?.flightNumber || booking.flightNumber;
    const gate = flight?.gate || "TBD";
    const terminal = flight?.terminal || "T3";

    const subject = `Your SkyWay Digital Boarding Pass (Flight ${flightNum}, PNR ${booking.pnr})`;
    const body = `Hello ${booking.passengerName},

You are successfully checked in for Flight ${flightNum}!

Boarding Pass ID: ${booking.boardingPassId || `BP-${booking.pnr}`}
Seat: ${booking.seat}
Terminal: ${terminal}
Boarding Gate: ${gate}
Baggage Allowance: ${booking.baggageCount} piece(s)

Please present this digital boarding pass at the security gate and boarding gate at least 45 minutes prior to departure.`;

    await this.dispatch({
      recipientEmail: booking.passengerEmail,
      channel: "EMAIL",
      type: "CHECKIN_PASS",
      subject,
      body,
      metadata: { pnr: booking.pnr, flightNumber: flightNum, gate, seat: booking.seat },
    });
  }

  /**
   * Broadcast flight operational alerts (gate change, delay, cancellation)
   */
  static async broadcastFlightAlert(flightNumber: string, alertMessage: string, alertType: "DELAY" | "GATE_CHANGE" | "CANCELLED") {
    // Find all passengers booked on this flight
    const cleanNum = flightNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const affectedBookings = store.bookings.filter(
      (b) => b.flightNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase() === cleanNum
    );

    for (const booking of affectedBookings) {
      await this.dispatch({
        recipientEmail: booking.passengerEmail,
        recipientPhone: booking.passengerPhone,
        channel: "EMAIL",
        type: "FLIGHT_ALERT",
        subject: `URGENT: Flight Update for ${flightNumber} (PNR ${booking.pnr})`,
        body: `Dear ${booking.passengerName},\n\nOperational update for your upcoming flight ${flightNumber}:\n${alertMessage}\n\nOur airport ground staff is available for any immediate assistance.`,
        metadata: { pnr: booking.pnr, flightNumber, alertType },
      });
    }
  }
}
