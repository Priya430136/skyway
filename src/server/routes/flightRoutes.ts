import { Router } from "express";
import { FlightController } from "../controllers/flightController";
import {
  validateCreateFlight,
  validateFlightSearch,
  validateFlightParams,
} from "../middleware/validateFlight";

/**
 * Express Router for Flight Management
 * Exposes GET and POST endpoints powered by Prisma ORM and Zod input validation
 */
export const flightRoutes = Router();

/**
 * @route   GET /api/flights/realtime-status
 * @desc    Fetch real-time flight telemetry, current delay, gate changes, and weather
 * @access  Public
 */
flightRoutes.get("/realtime-status", FlightController.getRealtimeStatus);
flightRoutes.get("/realtime/batch", FlightController.getRealtimeStatus);

/**
 * @route   POST /api/flights/simulate-dispatch
 * @desc    Simulate airport dispatch actions (Gate reassignment, Delay alerts, Boarding calls)
 * @access  Public / Dispatch
 */
flightRoutes.post("/simulate-dispatch", FlightController.simulateDispatchEvent);

/**
 * @route   POST /api/flights/:flightNumber/status-update
 * @desc    Update gate, terminal, delay or operational status
 * @access  Public / Dispatch
 */
flightRoutes.post("/:flightNumber/status-update", FlightController.updateFlightStatus);
flightRoutes.patch("/:flightNumber/status", FlightController.updateFlightStatus);

/**
 * @route   GET /api/flights
 * @desc    Fetch all scheduled flights with optional filters (origin, destination, status, pagination)
 * @access  Public
 */
flightRoutes.get("/", FlightController.getAllFlights);

/**
 * @route   GET /api/flights/search
 * @desc    Search flights matching origin & destination with cabin classes and seat availability
 * @access  Public
 */
flightRoutes.get("/search", validateFlightSearch, FlightController.searchFlights);

/**
 * @route   GET /api/flights/status
 * @desc    Quick flight status lookup by flight number query parameter (?flightNumber=SW128)
 * @access  Public
 */
flightRoutes.get("/status", (req, res) => {
  const flightNumber = (req.query.flightNumber as string || "SW128");
  req.params.flightNumber = flightNumber;
  return FlightController.getFlightByNumber(req, res);
});

/**
 * @route   GET /api/flights/:flightNumber
 * @desc    Fetch detailed single flight information by flight number (including bookings roster)
 * @access  Public
 */
flightRoutes.get("/:flightNumber", validateFlightParams, FlightController.getFlightByNumber);

/**
 * @route   POST /api/flights
 * @desc    Create and schedule a new flight with Zod validation against Prisma schema
 * @access  Admin / Dispatch
 */
flightRoutes.post("/", validateCreateFlight, FlightController.createFlight);

export default flightRoutes;
