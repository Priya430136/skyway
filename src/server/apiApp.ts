import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

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
import { authRouter } from "./routes/auth";
import { notificationsRouter } from "./routes/notifications";

export function createApiApp() {
  const app = express();

  // Trust reverse proxy (nginx / Cloud Run ingress)
  app.set("trust proxy", 1);

  // Security Headers (configured to work seamlessly within iframe previews and API consumers)
  app.use(
    helmet({
      contentSecurityPolicy: false, // Prevents blocking client-side scripts in preview iframe
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // Helper key generator for reverse-proxy environments
  const getClientIp = (req: express.Request) => {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      return forwarded.split(",")[0].trim();
    }
    return req.ip || "127.0.0.1";
  };

  // General API Rate Limiting (1000 requests per 15 minutes)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: getClientIp,
    validate: false,
    message: {
      success: false,
      error: "Too many requests from this client. Please try again after 15 minutes.",
    },
  });

  // Stricter Auth Rate Limiting (60 requests per 15 minutes to protect against brute-force attacks)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: getClientIp,
    validate: false,
    message: {
      success: false,
      error: "Too many login/registration attempts. Please wait 15 minutes before retrying.",
    },
  });

  // Middlewares
  app.use(cors());
  app.use(apiLimiter);
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // API Health route
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      stack: "PERN (PostgreSQL, Express, React, Node.js)",
      server: "SkyWay Airlines API Server",
      security: {
        helmetEnabled: true,
        rateLimiterEnabled: true,
      },
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  // Stack info route
  app.get("/api/stack-info", (req, res) => {
    res.json({
      stack: "PERN",
      components: {
        database: "PostgreSQL (configured via Drizzle ORM and Prisma)",
        backend: "Express 5 on Node.js (v22)",
        frontend: "React 19 with TanStack Start & Tailwind CSS",
        security: "Helmet + express-rate-limit + JWT + bcrypt",
        runtime: "Node.js",
      },
      readyForDatabaseMigration: true,
    });
  });

  // Mount API route modules
  app.use("/api/auth", authLimiter, authRouter);
  app.use("/api/notifications", notificationsRouter);
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

  // Global 404 for unhandled API routes
  app.use("/api", (req, res) => {
    res.status(404).json({
      success: false,
      error: "API endpoint not found",
      path: req.originalUrl,
    });
  });

  return app;
}

let apiPortPromise: Promise<number> | null = null;
const apiApp = createApiApp();

export function getExpressApiApp() {
  return apiApp;
}

export async function getApiServerPort(): Promise<number> {
  if (!apiPortPromise) {
    apiPortPromise = new Promise((resolve, reject) => {
      const server = apiApp.listen(0, "127.0.0.1", () => {
        const addr = server.address();
        if (typeof addr === "object" && addr !== null) {
          resolve(addr.port);
        } else {
          reject(new Error("Failed to resolve API listener port"));
        }
      });
      server.on("error", reject);
    });
  }
  return apiPortPromise;
}

export async function handleApiRequest(request: Request): Promise<Response> {
  const port = await getApiServerPort();
  const incomingUrl = new URL(request.url);
  const targetUrl = `http://127.0.0.1:${port}${incomingUrl.pathname}${incomingUrl.search}`;

  const headers = new Headers(request.headers);
  headers.set("host", `127.0.0.1:${port}`);

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const bodyBuffer = await request.arrayBuffer();
    if (bodyBuffer.byteLength > 0) {
      init.body = bodyBuffer;
    }
  }

  return fetch(targetUrl, init);
}
