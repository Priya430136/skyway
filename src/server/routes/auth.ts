import { Router } from "express";
import { AuthService } from "../services/authService";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

// POST /api/auth/login
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required.",
      });
    }

    const result = await AuthService.login(email, password);
    return res.json({
      success: true,
      message: "Authentication successful.",
      data: result,
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      error: error.message || "Authentication failed.",
    });
  }
});

// POST /api/auth/register
authRouter.post("/register", async (req, res) => {
  try {
    const { email, password, fullName, phone, role } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        error: "Full name, email, and password are required for registration.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters.",
      });
    }

    const result = await AuthService.register({
      email,
      password,
      fullName,
      phone,
      role: role || "PASSENGER",
    });

    return res.status(201).json({
      success: true,
      message: "Account registered successfully.",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message || "Registration failed.",
    });
  }
});

// GET /api/auth/me - Current authenticated user
authRouter.get("/me", requireAuth, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Not authenticated" });
  }

  const userRecord = await AuthService.findUserByEmail(req.user.email);
  if (!userRecord) {
    return res.status(404).json({ success: false, error: "User record not found" });
  }

  const { passwordHash: _, ...safeUser } = userRecord;
  return res.json({
    success: true,
    user: safeUser,
  });
});

// GET /api/auth/demo-credentials - Test credentials for quick login in development / demonstration
authRouter.get("/demo-credentials", (req, res) => {
  res.json({
    success: true,
    accounts: [
      {
        role: "ADMIN",
        label: "Airline Executive / Admin",
        email: "admin@skyway.aero",
        password: "Admin@123",
        description: "Full access to revenue analytics, route management, and system logs.",
      },
      {
        role: "OPERATIONS",
        label: "Flight Dispatcher & Operations ATC",
        email: "ops@skyway.aero",
        password: "Ops@123",
        description: "Controls flight delays, gate changes, and live ATC telemetry.",
      },
      {
        role: "PASSENGER",
        label: "Verified Frequent Flyer (Platinum)",
        email: "passenger@skyway.aero",
        password: "Skyway@123",
        description: "Access to Platinum tier perks, PNR management, and instant boarding passes.",
      },
    ],
  });
});
