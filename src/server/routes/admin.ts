import { Router } from "express";
import { store } from "../store";
import { authenticateUser } from "../middleware/auth";

export const adminRouter = Router();

// Middleware: Authenticate user, verify ADMIN role (allows dev bypass if testing via dashboard without token)
adminRouter.use(authenticateUser, (req, res, next) => {
  // If authenticated as ADMIN or dev bypass header provided
  if (req.user?.role === "ADMIN" || req.headers["x-admin-bypass"] === "skyway-internal" || req.query.demo === "true") {
    return next();
  }

  // If no auth token at all, return 401 with informative instruction
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Admin authentication required. Please sign in with an ADMIN account or use demo credentials.",
      demoLogin: "admin@skyway.aero / Admin@123",
    });
  }

  // If authenticated but wrong role
  return res.status(403).json({
    success: false,
    error: `Forbidden. Only ADMIN users can access airline metrics. Current role: ${req.user.role}`,
  });
});

// GET /api/admin/metrics - executive overview
adminRouter.get("/metrics", (req, res) => {
  const totalBookings = store.bookings.length;
  const totalRevenue = store.bookings.reduce((sum, b) => sum + (b.totalPaid || 0), 0);
  const checkedInCount = store.bookings.filter((b) => b.isCheckedIn).length;

  res.json({
    success: true,
    data: {
      totalRevenueINR: totalRevenue,
      formattedRevenue: `₹${(totalRevenue / 100000).toFixed(2)} Lakhs`,
      totalBookings,
      checkedInRate: `${Math.round((checkedInCount / (totalBookings || 1)) * 100)}%`,
      activeFleetSize: 48,
      destinationsServed: 250,
      customerSatisfaction: 4.8,
      dailyLoadFactor: "86.4%",
    },
  });
});

// GET /api/admin/routes-analytics
adminRouter.get("/routes-analytics", (req, res) => {
  const topRoutes = [
    { route: "DEL → LHR", loadFactor: "91.2%", revenueINR: 4200000, margin: "24.5%" },
    { route: "DEL → CDG", loadFactor: "88.6%", revenueINR: 3650000, margin: "22.8%" },
    { route: "DEL → JFK", loadFactor: "94.0%", revenueINR: 5800000, margin: "28.1%" },
    { route: "DEL → DXB", loadFactor: "92.4%", revenueINR: 2100000, margin: "19.6%" },
    { route: "DEL → SIN", loadFactor: "85.7%", revenueINR: 2450000, margin: "21.0%" },
  ];

  res.json({
    success: true,
    topRoutes,
  });
});
