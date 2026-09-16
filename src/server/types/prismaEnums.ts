// Standard typed enums matching prisma/schema.prisma for clean ESM/CJS interop
export enum FlightStatus {
  SCHEDULED = "SCHEDULED",
  BOARDING = "BOARDING",
  ACTIVE = "ACTIVE",
  ON_TIME = "ON_TIME",
  DELAYED = "DELAYED",
  LANDED = "LANDED",
  CANCELLED = "CANCELLED",
}

export enum CabinClass {
  ECONOMY = "ECONOMY",
  PREMIUM_ECONOMY = "PREMIUM_ECONOMY",
  BUSINESS = "BUSINESS",
  FIRST = "FIRST",
}

export enum BookingStatus {
  CONFIRMED = "CONFIRMED",
  CHECKED_IN = "CHECKED_IN",
  BOARDED = "BOARDED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export enum FrequentFlyerTier {
  SILVER = "SILVER",
  GOLD = "GOLD",
  PLATINUM = "PLATINUM",
  SOLITAIRE = "SOLITAIRE",
}

export enum TicketCategory {
  SPECIAL_ASSISTANCE = "SPECIAL_ASSISTANCE",
  BAGGAGE_CLAIM = "BAGGAGE_CLAIM",
  REFUND_REQUEST = "REFUND_REQUEST",
  FLIGHT_CHANGE = "FLIGHT_CHANGE",
  MEAL_PREFERENCE = "MEAL_PREFERENCE",
  GENERAL_INQUIRY = "GENERAL_INQUIRY",
}

export enum TicketPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum TicketStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export const Prisma = {
  TransactionIsolationLevel: {
    ReadUncommitted: "ReadUncommitted",
    ReadCommitted: "ReadCommitted",
    RepeatableRead: "RepeatableRead",
    Serializable: "Serializable",
  },
} as const;

export type Prisma = any;
export type PrismaAny = any;
