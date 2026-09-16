import express from "express";
import cors from "cors";
import path from "path";

import { flightRoutes } from "./routes/flightRoutes";
import { bookingsRouter } from "./routes/bookings";
import { checkinRouter } from "./routes/checkin";
import { aiRouter } from "./routes/ai";
import { opsRouter } from "./routes/ops";
import { supportRouter } from "./routes/support";
import { adminRouter } from "./routes/admin";
import { airportsRouter } from "./routes/airports";
import { dbRouter } from "./routes/db";
import { paymentsRouter } from "./routes/payments";
import { feedbackRouter } from "./routes/feedback";
import { alertsRouter } from "./routes/alerts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      server: "SkyWay Express Backend (Node.js)",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/flights", flightRoutes);
  app.use("/api/bookings", bookingsRouter);
  app.use("/api/check-in", checkinRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/ops", opsRouter);
  app.use("/api/support", supportRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/airports", airportsRouter);
  app.use("/api/db", dbRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/feedback", feedbackRouter);
  app.use("/api/alerts", alertsRouter);

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✈️ SkyWay Express Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
