-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CabinClass" AS ENUM ('ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST');

-- CreateEnum
CREATE TYPE "FlightStatus" AS ENUM ('SCHEDULED', 'BOARDING', 'ACTIVE', 'ON_TIME', 'DELAYED', 'LANDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CHECKED_IN', 'BOARDED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "FrequentFlyerTier" AS ENUM ('SILVER', 'GOLD', 'PLATINUM', 'SOLITAIRE');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('SPECIAL_ASSISTANCE', 'BAGGAGE_CLAIM', 'REFUND_REQUEST', 'FLIGHT_CHANGE', 'MEAL_PREFERENCE', 'GENERAL_INQUIRY');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "airports" (
    "code" VARCHAR(10) NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "timezone" TEXT NOT NULL,
    "active_runways" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "airports_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "flights" (
    "flight_number" VARCHAR(20) NOT NULL,
    "origin_code" VARCHAR(10) NOT NULL,
    "destination_code" VARCHAR(10) NOT NULL,
    "departure_time" TEXT NOT NULL,
    "arrival_time" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "aircraft" TEXT NOT NULL,
    "status" "FlightStatus" NOT NULL DEFAULT 'SCHEDULED',
    "gate" VARCHAR(20) DEFAULT 'TBD',
    "terminal" VARCHAR(20) DEFAULT 'T3',
    "price_economy" INTEGER NOT NULL,
    "price_premium" INTEGER NOT NULL,
    "price_business" INTEGER NOT NULL,
    "price_first" INTEGER NOT NULL,
    "seats_economy_available" INTEGER NOT NULL DEFAULT 50,
    "seats_premium_available" INTEGER NOT NULL DEFAULT 15,
    "seats_business_available" INTEGER NOT NULL DEFAULT 8,
    "seats_first_available" INTEGER NOT NULL DEFAULT 4,
    "on_time_pct" INTEGER NOT NULL DEFAULT 95,
    "baggage_carousel" VARCHAR(50),
    "delay_minutes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flights_pkey" PRIMARY KEY ("flight_number")
);

-- CreateTable
CREATE TABLE "passengers" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" VARCHAR(30),
    "frequent_flyer_tier" "FrequentFlyerTier" NOT NULL DEFAULT 'SILVER',
    "miles_balance" INTEGER NOT NULL DEFAULT 0,
    "passport_number" VARCHAR(30),
    "nationality" VARCHAR(10) DEFAULT 'IN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passengers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "pnr" VARCHAR(12) NOT NULL,
    "flight_number" VARCHAR(20) NOT NULL,
    "passenger_id" UUID,
    "passenger_name" TEXT NOT NULL,
    "passenger_email" TEXT NOT NULL,
    "passenger_phone" VARCHAR(30) DEFAULT '+91 98765 43210',
    "cabin_class" "CabinClass" NOT NULL DEFAULT 'ECONOMY',
    "seat_number" VARCHAR(10) NOT NULL,
    "is_checked_in" BOOLEAN NOT NULL DEFAULT false,
    "boarding_pass_id" TEXT,
    "baggage_count" INTEGER NOT NULL DEFAULT 1,
    "special_assistance" TEXT,
    "meal_preference" TEXT,
    "total_paid" INTEGER NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "booking_date" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("pnr")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" VARCHAR(30) NOT NULL,
    "passenger_id" UUID,
    "passenger_email" TEXT NOT NULL,
    "passenger_name" TEXT NOT NULL,
    "pnr" VARCHAR(12),
    "category" "TicketCategory" NOT NULL DEFAULT 'GENERAL_INQUIRY',
    "subject" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "messages" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ops_logs" (
    "id" UUID NOT NULL,
    "flight_number" VARCHAR(20),
    "event_type" VARCHAR(50) NOT NULL,
    "message" TEXT NOT NULL,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'INFO',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ops_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flights_origin_code_destination_code_idx" ON "flights"("origin_code", "destination_code");

-- CreateIndex
CREATE INDEX "flights_status_idx" ON "flights"("status");

-- CreateIndex
CREATE UNIQUE INDEX "passengers_email_key" ON "passengers"("email");

-- CreateIndex
CREATE INDEX "passengers_email_idx" ON "passengers"("email");

-- CreateIndex
CREATE INDEX "bookings_flight_number_idx" ON "bookings"("flight_number");

-- CreateIndex
CREATE INDEX "bookings_passenger_email_idx" ON "bookings"("passenger_email");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "support_tickets_passenger_email_idx" ON "support_tickets"("passenger_email");

-- CreateIndex
CREATE INDEX "support_tickets_pnr_idx" ON "support_tickets"("pnr");

-- CreateIndex
CREATE INDEX "ops_logs_flight_number_idx" ON "ops_logs"("flight_number");

-- CreateIndex
CREATE INDEX "ops_logs_timestamp_idx" ON "ops_logs"("timestamp");

-- AddForeignKey
ALTER TABLE "flights" ADD CONSTRAINT "flights_origin_code_fkey" FOREIGN KEY ("origin_code") REFERENCES "airports"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flights" ADD CONSTRAINT "flights_destination_code_fkey" FOREIGN KEY ("destination_code") REFERENCES "airports"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_flight_number_fkey" FOREIGN KEY ("flight_number") REFERENCES "flights"("flight_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_passenger_id_fkey" FOREIGN KEY ("passenger_id") REFERENCES "passengers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_passenger_id_fkey" FOREIGN KEY ("passenger_id") REFERENCES "passengers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
