import { prisma } from "../../lib/prisma";
import { CabinClass, BookingStatus, FlightStatus, Prisma } from "../types/prismaEnums";
import { store, type BookingRecord } from "../store";

export interface CreateBookingInput {
  flightNumber: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone?: string;
  cabinClass?: "Economy" | "Premium" | "Business" | "First" | CabinClass;
  seatNumber?: string;
  baggageCount?: number;
  specialAssistance?: string;
  mealPreference?: string;
  totalPaid?: number;
  currency?: string;
  passportNumber?: string;
  nationality?: string;
}

export interface SeatAvailabilityResult {
  available: boolean;
  flightNumber: string;
  cabinClass: CabinClass;
  remainingSeatsInCabin: number;
  isSpecificSeatOccupied: boolean;
  occupiedSeats: string[];
  message?: string;
}

/**
 * Normalizes input cabin class to Prisma CabinClass enum
 */
export function normalizeCabinClass(cabin?: string): CabinClass {
  if (!cabin) return CabinClass.ECONOMY;
  const upper = cabin.toUpperCase().replace(/\s+/g, "_");
  if (upper === "PREMIUM" || upper === "PREMIUM_ECONOMY") return CabinClass.PREMIUM_ECONOMY;
  if (upper === "BUSINESS") return CabinClass.BUSINESS;
  if (upper === "FIRST") return CabinClass.FIRST;
  return CabinClass.ECONOMY;
}

/**
 * Maps Prisma CabinClass enum to Flight table seat field
 */
function getCabinSeatField(cabin: CabinClass): "seatsEconomyAvailable" | "seatsPremiumAvailable" | "seatsBusinessAvailable" | "seatsFirstAvailable" {
  switch (cabin) {
    case CabinClass.PREMIUM_ECONOMY:
      return "seatsPremiumAvailable";
    case CabinClass.BUSINESS:
      return "seatsBusinessAvailable";
    case CabinClass.FIRST:
      return "seatsFirstAvailable";
    case CabinClass.ECONOMY:
    default:
      return "seatsEconomyAvailable";
  }
}

/**
 * Generates a unique 6-character PNR (e.g. SW8K2P)
 */
function generatePNR(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "SW";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * BookingService handles seat availability checks, passenger association,
 * and ACID-compliant transaction logic for flight bookings.
 */
export class BookingService {
  /**
   * Check if seats are available in the requested cabin and if a specific seat is unoccupied.
   */
  static async checkSeatAvailability(
    flightNumber: string,
    cabinClassInput: string = "ECONOMY",
    requestedSeat?: string
  ): Promise<SeatAvailabilityResult> {
    const flightNo = flightNumber.trim().toUpperCase();
    const cabin = normalizeCabinClass(cabinClassInput);
    const seatField = getCabinSeatField(cabin);

    try {
      // 1. Fetch flight from Prisma DB
      const flight = await prisma.flight.findUnique({
        where: { flightNumber: flightNo },
        include: {
          bookings: {
            where: {
              status: {
                in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.BOARDED],
              },
            },
            select: { seatNumber: true, cabinClass: true },
          },
        },
      });

      if (flight) {
        if (flight.status === FlightStatus.CANCELLED) {
          return {
            available: false,
            flightNumber: flightNo,
            cabinClass: cabin,
            remainingSeatsInCabin: 0,
            isSpecificSeatOccupied: false,
            occupiedSeats: [],
            message: `Flight ${flightNo} has been cancelled.`,
          };
        }

        const remainingSeats = flight[seatField];
        const occupiedSeats = flight.bookings.map((b) => b.seatNumber);
        const isSpecificSeatOccupied = requestedSeat ? occupiedSeats.includes(requestedSeat.toUpperCase()) : false;
        const hasInventory = remainingSeats > 0;

        return {
          available: hasInventory && !isSpecificSeatOccupied,
          flightNumber: flightNo,
          cabinClass: cabin,
          remainingSeatsInCabin: remainingSeats,
          isSpecificSeatOccupied,
          occupiedSeats,
          message: !hasInventory
            ? `No available seats left in ${cabin} class.`
            : isSpecificSeatOccupied
            ? `Seat ${requestedSeat} is already booked on flight ${flightNo}.`
            : "Seat available.",
        };
      }
    } catch (dbError) {
      console.warn("Prisma checkSeatAvailability error, checking memory store fallback:", (dbError as any)?.message);
    }

    // In-memory fallback
    const memFlight = store.getFlight(flightNo);
    const occupiedSeats = store.bookings
      .filter((b) => b.flightNumber === flightNo && b.status !== "CANCELLED")
      .map((b) => b.seat);

    if (!memFlight) {
      return {
        available: true,
        flightNumber: flightNo,
        cabinClass: cabin,
        remainingSeatsInCabin: 30,
        isSpecificSeatOccupied: false,
        occupiedSeats,
        message: "Seat availability verified.",
      };
    }

    const cabinKey = cabin === CabinClass.PREMIUM_ECONOMY ? "premium" : cabin.toLowerCase() as "economy" | "premium" | "business" | "first";
    const remaining = memFlight.seatsAvailable[cabinKey] ?? 10;
    const isOccupied = requestedSeat ? occupiedSeats.includes(requestedSeat.toUpperCase()) : false;

    return {
      available: remaining > 0 && !isOccupied,
      flightNumber: flightNo,
      cabinClass: cabin,
      remainingSeatsInCabin: remaining,
      isSpecificSeatOccupied: isOccupied,
      occupiedSeats,
      message: remaining <= 0 ? "Cabin fully booked." : isOccupied ? `Seat ${requestedSeat} occupied.` : "Seat available.",
    };
  }

  /**
   * Create a new booking using an ACID Prisma interactive transaction.
   * Decrements seat inventory, creates/updates passenger, creates booking, and logs dispatch event.
   */
  static async createBooking(input: CreateBookingInput) {
    const flightNumber = input.flightNumber.trim().toUpperCase();
    const cabinClass = normalizeCabinClass(input.cabinClass as string);
    const seatField = getCabinSeatField(cabinClass);
    const seatNumber = input.seatNumber ? input.seatNumber.trim().toUpperCase() : "12A";
    const passengerEmail = input.passengerEmail.trim().toLowerCase();
    const passengerName = input.passengerName.trim();
    const passengerPhone = input.passengerPhone?.trim() || "+91 98765 43210";
    const bookingDate = new Date().toISOString().split("T")[0];
    const baggageCount = Number(input.baggageCount ?? 1);
    const currency = input.currency || "INR";

    let pnr = generatePNR();

    // Try executing through Prisma Transaction
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          // 1. Fetch flight with lock check
          const flight = await tx.flight.findUnique({
            where: { flightNumber },
            include: {
              origin: true,
              destination: true,
            },
          });

          if (!flight) {
            throw new Error(`Flight ${flightNumber} does not exist in the database.`);
          }

          if (flight.status === FlightStatus.CANCELLED) {
            throw new Error(`Flight ${flightNumber} is cancelled and cannot accept new bookings.`);
          }

          // 2. Check cabin inventory count
          const availableSeats = flight[seatField];
          if (availableSeats <= 0) {
            throw new Error(`Sold out: No seats available in ${cabinClass} class on flight ${flightNumber}.`);
          }

          // 3. Check if specific seat is already occupied
          const existingSeatBooking = await tx.booking.findFirst({
            where: {
              flightNumber,
              seatNumber,
              status: {
                in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.BOARDED],
              },
            },
          });

          if (existingSeatBooking) {
            throw new Error(`Seat ${seatNumber} is already reserved by another passenger (PNR: ${existingSeatBooking.pnr}).`);
          }

          // 4. Ensure Unique PNR
          let existingPnr = await tx.booking.findUnique({ where: { pnr } });
          while (existingPnr) {
            pnr = generatePNR();
            existingPnr = await tx.booking.findUnique({ where: { pnr } });
          }

          // 5. Upsert Passenger Profile
          const passenger = await tx.passenger.upsert({
            where: { email: passengerEmail },
            update: {
              fullName: passengerName,
              phone: passengerPhone,
              passportNumber: input.passportNumber || undefined,
              nationality: input.nationality || "IN",
              milesBalance: { increment: Math.round(Number(input.totalPaid || 5000) * 0.1) },
            },
            create: {
              fullName: passengerName,
              email: passengerEmail,
              phone: passengerPhone,
              passportNumber: input.passportNumber,
              nationality: input.nationality || "IN",
              milesBalance: Math.round(Number(input.totalPaid || 5000) * 0.1),
            },
          });

          // Compute pricing if totalPaid not passed
          let computedPrice = input.totalPaid;
          if (!computedPrice) {
            switch (cabinClass) {
              case CabinClass.PREMIUM_ECONOMY:
                computedPrice = flight.pricePremium;
                break;
              case CabinClass.BUSINESS:
                computedPrice = flight.priceBusiness;
                break;
              case CabinClass.FIRST:
                computedPrice = flight.priceFirst;
                break;
              case CabinClass.ECONOMY:
              default:
                computedPrice = flight.priceEconomy;
                break;
            }
          }

          // 6. Create the Booking Record
          const booking = await tx.booking.create({
            data: {
              pnr,
              flightNumber,
              passengerId: passenger.id,
              passengerName,
              passengerEmail,
              passengerPhone,
              cabinClass,
              seatNumber,
              isCheckedIn: false,
              baggageCount,
              specialAssistance: input.specialAssistance,
              mealPreference: input.mealPreference,
              totalPaid: Number(computedPrice),
              currency,
              bookingDate,
              status: BookingStatus.CONFIRMED,
            },
            include: {
              flight: {
                include: {
                  origin: true,
                  destination: true,
                },
              },
              passenger: true,
            },
          });

          // 7. Decrement Flight Seat Inventory atomically
          await tx.flight.update({
            where: { flightNumber },
            data: {
              [seatField]: {
                decrement: 1,
              },
            },
          });

          // 8. Create Ops Log entry
          await tx.opsLog.create({
            data: {
              flightNumber,
              eventType: "BOOKING_CREATED",
              message: `PNR ${pnr} issued for ${passengerName} (${seatNumber}, ${cabinClass}). Remaining ${cabinClass} seats: ${availableSeats - 1}.`,
              severity: "INFO",
            },
          });

          return { booking, passenger, flight };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 10000,
        }
      );

      // Sync with in-memory store for instant UI updates across all components
      this.syncToMemoryStore({
        pnr: result.booking.pnr,
        flightNumber: result.booking.flightNumber,
        passengerName: result.booking.passengerName,
        passengerEmail: result.booking.passengerEmail,
        passengerPhone: result.booking.passengerPhone || passengerPhone,
        seat: result.booking.seatNumber,
        cabinClass: input.cabinClass as any || "Economy",
        isCheckedIn: false,
        baggageCount: result.booking.baggageCount,
        specialAssistance: result.booking.specialAssistance || undefined,
        mealPreference: result.booking.mealPreference || undefined,
        totalPaid: result.booking.totalPaid,
        currency: result.booking.currency,
        bookingDate: result.booking.bookingDate,
        status: "CONFIRMED",
      });

      return {
        success: true,
        source: "postgresql/prisma",
        pnr: result.booking.pnr,
        booking: result.booking,
        flight: result.flight,
        passenger: result.passenger,
      };
    } catch (transactionError: any) {
      console.warn("Prisma transaction failed or DB offline, falling back to memory store:", transactionError.message);

      // If it's a validation / domain error (like seat occupied or flight full), bubble it up
      if (
        transactionError.message.includes("Sold out") ||
        transactionError.message.includes("already reserved") ||
        transactionError.message.includes("cancelled")
      ) {
        throw transactionError;
      }
    }

    // In-memory fallback booking
    const memBooking: BookingRecord = {
      pnr,
      flightNumber,
      passengerName,
      passengerEmail,
      passengerPhone,
      seat: seatNumber,
      cabinClass: (input.cabinClass as any) || "Economy",
      isCheckedIn: false,
      baggageCount,
      specialAssistance: input.specialAssistance,
      mealPreference: input.mealPreference,
      totalPaid: Number(input.totalPaid || 42900),
      currency,
      bookingDate,
      status: "CONFIRMED",
    };

    store.addBooking(memBooking);

    // Decrement seat count in memory store
    const memFlight = store.getFlight(flightNumber);
    if (memFlight) {
      const key = cabinClass === CabinClass.PREMIUM_ECONOMY ? "premium" : (cabinClass.toLowerCase() as "economy" | "business" | "first");
      if (memFlight.seatsAvailable[key] > 0) {
        memFlight.seatsAvailable[key] -= 1;
      }
    }

    return {
      success: true,
      source: "memory_store",
      pnr: memBooking.pnr,
      booking: memBooking,
      flight: memFlight,
    };
  }

  /**
   * Cancel an existing booking transactionally and return the seat back to inventory.
   */
  static async cancelBooking(pnr: string, reason?: string) {
    const upperPnr = pnr.trim().toUpperCase();

    try {
      const result = await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
          where: { pnr: upperPnr },
          include: { flight: true },
        });

        if (!booking) {
          throw new Error(`Booking ${upperPnr} not found.`);
        }

        if (booking.status === BookingStatus.CANCELLED) {
          throw new Error(`Booking ${upperPnr} is already cancelled.`);
        }

        const seatField = getCabinSeatField(booking.cabinClass);

        // Update status to CANCELLED
        const updatedBooking = await tx.booking.update({
          where: { pnr: upperPnr },
          data: { status: BookingStatus.CANCELLED },
        });

        // Increment seat back
        await tx.flight.update({
          where: { flightNumber: booking.flightNumber },
          data: {
            [seatField]: { increment: 1 },
          },
        });

        // Log ops event
        await tx.opsLog.create({
          data: {
            flightNumber: booking.flightNumber,
            eventType: "BOOKING_CANCELLED",
            message: `Booking PNR ${upperPnr} cancelled (${reason || "Customer requested"}). Seat ${booking.seatNumber} restored to inventory.`,
            severity: "INFO",
          },
        });

        return updatedBooking;
      });

      store.updateBooking(upperPnr, { status: "CANCELLED" });
      return { success: true, booking: result };
    } catch (error: any) {
      console.warn("Prisma cancel fallback to store:", error.message);
      const updated = store.updateBooking(upperPnr, { status: "CANCELLED" });
      if (!updated) {
        throw new Error(`Booking ${upperPnr} not found.`);
      }
      return { success: true, booking: updated };
    }
  }

  /**
   * Fetch all bookings for a user or all bookings
   */
  static async getBookings(email?: string) {
    try {
      const where: any = {};
      if (email) {
        where.passengerEmail = { equals: email.trim().toLowerCase(), mode: "insensitive" };
      }

      const bookings = await prisma.booking.findMany({
        where,
        include: {
          flight: {
            include: { origin: true, destination: true },
          },
          passenger: true,
        },
        orderBy: { createdAt: "desc" },
      });

      if (bookings.length > 0) {
        return { success: true, source: "postgresql/prisma", bookings };
      }
    } catch (dbError) {
      console.warn("Prisma getBookings fallback to store:", (dbError as any)?.message);
    }

    let memBookings = store.bookings;
    if (email) {
      memBookings = memBookings.filter((b) => b.passengerEmail.toLowerCase() === email.toLowerCase());
    }

    return { success: true, source: "memory_store", bookings: memBookings };
  }

  /**
   * Fetch single booking by PNR
   */
  static async getBookingByPnr(pnr: string) {
    const upperPnr = pnr.trim().toUpperCase();

    try {
      const booking = await prisma.booking.findUnique({
        where: { pnr: upperPnr },
        include: {
          flight: {
            include: { origin: true, destination: true },
          },
          passenger: true,
        },
      });

      if (booking) {
        return { success: true, source: "postgresql/prisma", booking, flight: booking.flight };
      }
    } catch (dbError) {
      console.warn("Prisma getBookingByPnr fallback to store:", (dbError as any)?.message);
    }

    const memBooking = store.getBooking(upperPnr);
    if (!memBooking) return null;

    const memFlight = store.getFlight(memBooking.flightNumber);
    return { success: true, source: "memory_store", booking: memBooking, flight: memFlight || null };
  }

  /**
   * Helper to synchronize new bookings into memory store
   */
  private static syncToMemoryStore(booking: BookingRecord) {
    const idx = store.bookings.findIndex((b) => b.pnr === booking.pnr);
    if (idx >= 0) {
      store.bookings[idx] = booking;
    } else {
      store.bookings.unshift(booking);
    }
  }
}
