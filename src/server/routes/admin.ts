import { Router } from "express";
import { store } from "../store";
import { requireAuth, requireRole } from "../middleware/auth";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(["ADMIN"]));

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
