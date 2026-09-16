import {
  pgTable,
  text,
  varchar,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";

// 1. Airports Table
export const airports = pgTable("airports", {
  code: varchar("code", { length: 10 }).primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  latitude: numeric("latitude", { precision: 9, scale: 6 }).notNull(),
  longitude: numeric("longitude", { precision: 9, scale: 6 }).notNull(),
  timezone: text("timezone").notNull(),
  activeRunways: jsonb("active_runways").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Flights Table
export const flights = pgTable("flights", {
  flightNumber: varchar("flight_number", { length: 20 }).primaryKey(),
  originCode: varchar("origin_code", { length: 10 })
    .notNull()
    .references(() => airports.code),
  destinationCode: varchar("destination_code", { length: 10 })
    .notNull()
    .references(() => airports.code),
  departureTime: text("departure_time").notNull(),
  arrivalTime: text("arrival_time").notNull(),
  duration: text("duration").notNull(),
  aircraft: text("aircraft").notNull(),
  status: varchar("status", { length: 50 }).default("Scheduled").notNull(),
  gate: varchar("gate", { length: 20 }).default("TBD"),
  terminal: varchar("terminal", { length: 20 }).default("T3"),
  priceEconomy: integer("price_economy").notNull(),
  pricePremium: integer("price_premium").notNull(),
  priceBusiness: integer("price_business").notNull(),
  priceFirst: integer("price_first").notNull(),
  seatsEconomyAvailable: integer("seats_economy_available").default(50).notNull(),
  seatsPremiumAvailable: integer("seats_premium_available").default(15).notNull(),
  seatsBusinessAvailable: integer("seats_business_available").default(8).notNull(),
  seatsFirstAvailable: integer("seats_first_available").default(4).notNull(),
  onTimePct: integer("on_time_pct").default(95).notNull(),
  baggageCarousel: varchar("baggage_carousel", { length: 50 }),
  delayMinutes: integer("delay_minutes").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Passengers Table
export const passengers = pgTable("passengers", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: varchar("phone", { length: 30 }),
  frequentFlyerTier: varchar("frequent_flyer_tier", { length: 30 }).default("Silver"),
  milesBalance: integer("miles_balance").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Bookings Table
export const bookings = pgTable("bookings", {
  pnr: varchar("pnr", { length: 12 }).primaryKey(),
  flightNumber: varchar("flight_number", { length: 20 })
    .notNull()
    .references(() => flights.flightNumber),
  passengerName: text("passenger_name").notNull(),
  passengerEmail: text("passenger_email").notNull(),
  passengerPhone: varchar("passenger_phone", { length: 30 }).default("+91 98765 43210"),
  cabinClass: varchar("cabin_class", { length: 30 }).default("Economy").notNull(),
  seatNumber: varchar("seat_number", { length: 10 }).notNull(),
  isCheckedIn: boolean("is_checked_in").default(false).notNull(),
  boardingPassId: text("boarding_pass_id"),
  baggageCount: integer("baggage_count").default(1).notNull(),
  specialAssistance: text("special_assistance"),
  mealPreference: text("meal_preference"),
  totalPaid: integer("total_paid").notNull(),
  currency: varchar("currency", { length: 10 }).default("INR").notNull(),
  bookingDate: text("booking_date").notNull(),
  status: varchar("status", { length: 30 }).default("CONFIRMED").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Support Tickets Table
export const supportTickets = pgTable("support_tickets", {
  id: varchar("id", { length: 30 }).primaryKey(),
  passengerEmail: text("passenger_email").notNull(),
  passengerName: text("passenger_name").notNull(),
  pnr: varchar("pnr", { length: 12 }),
  category: varchar("category", { length: 50 }).notNull(),
  subject: text("subject").notNull(),
  status: varchar("status", { length: 30 }).default("Open").notNull(),
  priority: varchar("priority", { length: 30 }).default("Medium").notNull(),
  messages: jsonb("messages")
    .$type<
      Array<{
        sender: "passenger" | "agent" | "ai";
        senderName: string;
        text: string;
        timestamp: string;
      }>
    >()
    .default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Operations & ATC Logs Table
export const opsLogs = pgTable("ops_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  flightNumber: varchar("flight_number", { length: 20 }),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  message: text("message").notNull(),
  severity: varchar("severity", { length: 20 }).default("INFO").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// 7. Feedback Table (Post-Flight Satisfaction Surveys)
export const feedback = pgTable("feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  pnr: varchar("pnr", { length: 12 }),
  flightNumber: varchar("flight_number", { length: 20 }),
  passengerName: text("passenger_name").notNull(),
  passengerEmail: text("passenger_email").notNull(),
  overallRating: integer("overall_rating").notNull(),
  flightCrewRating: integer("flight_crew_rating").default(5),
  cabinCleanlinessRating: integer("cabin_cleanliness_rating").default(5),
  foodBeverageRating: integer("food_beverage_rating").default(5),
  punctualityRating: integer("punctuality_rating").default(5),
  recommendAirline: boolean("recommend_airline").default(true).notNull(),
  comments: text("comments"),
  highlightTags: jsonb("highlight_tags").$type<string[]>().default([]),
  followUpRequested: boolean("follow_up_requested").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 8. Users Table (Admin, Dispatchers, Staff, and Registered Passengers)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  role: varchar("role", { length: 30 }).default("PASSENGER").notNull(), // ADMIN, OPERATIONS, AGENT, PASSENGER
  frequentFlyerTier: varchar("frequent_flyer_tier", { length: 30 }).default("SILVER"),
  milesBalance: integer("miles_balance").default(0),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 9. Transactional Notifications Dispatch Table
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipientEmail: text("recipient_email"),
  recipientPhone: varchar("recipient_phone", { length: 30 }),
  channel: varchar("channel", { length: 20 }).notNull(), // EMAIL, SMS, PUSH, SYSTEM
  type: varchar("type", { length: 50 }).notNull(), // BOOKING_CONFIRMATION, CHECKIN_PASS, FLIGHT_ALERT, SUPPORT_UPDATE
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  status: varchar("status", { length: 30 }).default("DELIVERED").notNull(), // DELIVERED, QUEUED, FAILED, SIMULATED
  deliveredAt: timestamp("delivered_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
