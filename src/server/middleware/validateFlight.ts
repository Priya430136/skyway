import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { FlightStatus } from "../types/prismaEnums";

/**
 * Zod Schema for creating a new Flight matching Prisma model definitions
 */
export const createFlightSchema = z.object({
  flightNumber: z
    .string({
      required_error: "Flight number is required",
      invalid_type_error: "Flight number must be a string",
    })
    .trim()
    .min(2, "Flight number must be at least 2 characters")
    .max(20, "Flight number cannot exceed 20 characters")
    .regex(/^[A-Z0-9]{2,8}$/i, "Flight number must be alphanumeric (e.g. SW128, AI502)")
    .transform((val) => val.toUpperCase()),

  originCode: z
    .string({
      required_error: "Origin airport IATA code is required",
    })
    .trim()
    .min(3, "Origin airport code must be at least 3 characters")
    .max(10, "Origin airport code cannot exceed 10 characters")
    .transform((val) => val.toUpperCase()),

  destinationCode: z
    .string({
      required_error: "Destination airport IATA code is required",
    })
    .trim()
    .min(3, "Destination airport code must be at least 3 characters")
    .max(10, "Destination airport code cannot exceed 10 characters")
    .transform((val) => val.toUpperCase()),

  departureTime: z
    .string({
      required_error: "Departure time is required",
    })
    .trim()
    .min(1, "Departure time cannot be empty"),

  arrivalTime: z
    .string({
      required_error: "Arrival time is required",
    })
    .trim()
    .min(1, "Arrival time cannot be empty"),

  duration: z
    .string({
      required_error: "Flight duration is required",
    })
    .trim()
    .min(1, "Duration cannot be empty"),

  aircraft: z
    .string({
      required_error: "Aircraft type is required",
    })
    .trim()
    .min(2, "Aircraft model name must be at least 2 characters"),

  status: z
    .nativeEnum(FlightStatus, {
      errorMap: () => ({
        message: `Status must be one of: ${Object.values(FlightStatus).join(", ")}`,
      }),
    })
    .optional()
    .default(FlightStatus.SCHEDULED),

  gate: z
    .string()
    .trim()
    .max(20, "Gate cannot exceed 20 characters")
    .optional()
    .default("TBD"),

  terminal: z
    .string()
    .trim()
    .max(20, "Terminal cannot exceed 20 characters")
    .optional()
    .default("T3"),

  priceEconomy: z
    .coerce
    .number({
      required_error: "Economy class price is required",
      invalid_type_error: "Economy price must be a number",
    })
    .int("Price must be an integer")
    .positive("Economy price must be greater than 0"),

  pricePremium: z
    .coerce
    .number()
    .int("Price must be an integer")
    .positive("Premium economy price must be greater than 0")
    .optional(),

  priceBusiness: z
    .coerce
    .number({
      required_error: "Business class price is required",
      invalid_type_error: "Business price must be a number",
    })
    .int("Price must be an integer")
    .positive("Business price must be greater than 0"),

  priceFirst: z
    .coerce
    .number()
    .int("Price must be an integer")
    .positive("First class price must be greater than 0")
    .optional(),

  seatsEconomyAvailable: z
    .coerce
    .number()
    .int("Seats must be an integer")
    .min(0, "Seats cannot be negative")
    .optional()
    .default(50),

  seatsPremiumAvailable: z
    .coerce
    .number()
    .int("Seats must be an integer")
    .min(0, "Seats cannot be negative")
    .optional()
    .default(15),

  seatsBusinessAvailable: z
    .coerce
    .number()
    .int("Seats must be an integer")
    .min(0, "Seats cannot be negative")
    .optional()
    .default(8),

  seatsFirstAvailable: z
    .coerce
    .number()
    .int("Seats must be an integer")
    .min(0, "Seats cannot be negative")
    .optional()
    .default(4),

  onTimePct: z
    .coerce
    .number()
    .int("On-time percentage must be an integer")
    .min(0, "On-time percentage cannot be less than 0")
    .max(100, "On-time percentage cannot exceed 100")
    .optional()
    .default(95),

  baggageCarousel: z
    .string()
    .trim()
    .max(50, "Baggage carousel cannot exceed 50 characters")
    .optional(),

  delayMinutes: z
    .coerce
    .number()
    .int("Delay minutes must be an integer")
    .min(0, "Delay minutes cannot be negative")
    .optional()
    .default(0),
}).refine((data) => data.originCode !== data.destinationCode, {
  message: "Origin and Destination airports cannot be the same",
  path: ["destinationCode"],
});

export type CreateFlightInput = z.infer<typeof createFlightSchema>;

/**
 * Zod Schema for Flight Search Query parameters
 */
export const flightSearchQuerySchema = z.object({
  origin: z
    .string({
      required_error: "Origin query parameter is required",
    })
    .trim()
    .min(3, "Origin code must be at least 3 characters")
    .max(10)
    .transform((val) => val.toUpperCase()),

  destination: z
    .string({
      required_error: "Destination query parameter is required",
    })
    .trim()
    .min(3, "Destination code must be at least 3 characters")
    .max(10)
    .transform((val) => val.toUpperCase()),

  cabin: z
    .enum(["Economy", "Premium", "Business", "First"], {
      errorMap: () => ({ message: "Cabin must be Economy, Premium, Business, or First" }),
    })
    .optional()
    .default("Economy"),

  date: z.string().optional(),
  pax: z.coerce.number().int().positive().optional().default(1),
}).refine((data) => data.origin !== data.destination, {
  message: "Origin and Destination search airports cannot be identical",
  path: ["destination"],
});

/**
 * Zod Schema for Single Flight Parameter
 */
export const flightParamSchema = z.object({
  flightNumber: z
    .string({
      required_error: "Flight number is required in URL parameter",
    })
    .trim()
    .min(2, "Invalid flight number format")
    .max(20)
    .transform((val) => val.toUpperCase()),
});

/**
 * Generic Express Middleware Factory for Zod Schemas
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          errorType: "VALIDATION_ERROR",
          message: "Request body validation failed",
          errors: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        });
      }
      return res.status(500).json({
        success: false,
        message: "Internal schema validation failure",
      });
    }
  };
}

export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          errorType: "QUERY_VALIDATION_ERROR",
          message: "Invalid query parameters",
          errors: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        });
      }
      return res.status(500).json({
        success: false,
        message: "Internal query validation failure",
      });
    }
  };
}

export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          errorType: "PARAMS_VALIDATION_ERROR",
          message: "Invalid URL parameters",
          errors: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        });
      }
      return res.status(500).json({
        success: false,
        message: "Internal route param validation failure",
      });
    }
  };
}

// Pre-configured route middlewares
export const validateCreateFlight = validateBody(createFlightSchema);
export const validateFlightSearch = validateQuery(flightSearchQuerySchema);
export const validateFlightParams = validateParams(flightParamSchema);
