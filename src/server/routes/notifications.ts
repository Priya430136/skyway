import { Router } from "express";
import { store } from "../store";
import { NotificationService } from "../services/notificationService";

export const notificationsRouter = Router();

// GET /api/notifications - List dispatched notifications
notificationsRouter.get("/", (req, res) => {
  const email = req.query.email as string | undefined;
  const pnr = req.query.pnr as string | undefined;

  let results = store.notifications;

  if (email) {
    results = results.filter((n) => n.recipientEmail?.toLowerCase() === email.toLowerCase());
  }

  if (pnr) {
    results = results.filter((n) => n.metadata?.pnr?.toUpperCase() === pnr.toUpperCase());
  }

  res.json({
    success: true,
    total: results.length,
    notifications: results,
  });
});

// POST /api/notifications/test-dispatch - Send a test email or SMS
notificationsRouter.post("/test-dispatch", async (req, res) => {
  try {
    const { recipientEmail, recipientPhone, channel, type, subject, body } = req.body;

    if (!subject || !body) {
      return res.status(400).json({
        success: false,
        error: "Subject and body are required.",
      });
    }

    const record = await NotificationService.dispatch({
      recipientEmail: recipientEmail || "passenger@skyway.aero",
      recipientPhone,
      channel: channel || "EMAIL",
      type: type || "FLIGHT_ALERT",
      subject,
      body,
      metadata: { isManualTest: true },
    });

    return res.json({
      success: true,
      message: `Notification successfully dispatched via ${record.channel} (${record.status}).`,
      notification: record,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to dispatch notification",
    });
  }
});
