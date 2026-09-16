CREATE TABLE "airports" (
	"code" varchar(10) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"country" text NOT NULL,
	"latitude" numeric(9, 6) NOT NULL,
	"longitude" numeric(9, 6) NOT NULL,
	"timezone" text NOT NULL,
	"active_runways" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"pnr" varchar(12) PRIMARY KEY NOT NULL,
	"flight_number" varchar(20) NOT NULL,
	"passenger_name" text NOT NULL,
	"passenger_email" text NOT NULL,
	"passenger_phone" varchar(30) DEFAULT '+91 98765 43210',
	"cabin_class" varchar(30) DEFAULT 'Economy' NOT NULL,
	"seat_number" varchar(10) NOT NULL,
	"is_checked_in" boolean DEFAULT false NOT NULL,
	"boarding_pass_id" text,
	"baggage_count" integer DEFAULT 1 NOT NULL,
	"special_assistance" text,
	"meal_preference" text,
	"total_paid" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"booking_date" text NOT NULL,
	"status" varchar(30) DEFAULT 'CONFIRMED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flights" (
	"flight_number" varchar(20) PRIMARY KEY NOT NULL,
	"origin_code" varchar(10) NOT NULL,
	"destination_code" varchar(10) NOT NULL,
	"departure_time" text NOT NULL,
	"arrival_time" text NOT NULL,
	"duration" text NOT NULL,
	"aircraft" text NOT NULL,
	"status" varchar(50) DEFAULT 'Scheduled' NOT NULL,
	"gate" varchar(20) DEFAULT 'TBD',
	"terminal" varchar(20) DEFAULT 'T3',
	"price_economy" integer NOT NULL,
	"price_premium" integer NOT NULL,
	"price_business" integer NOT NULL,
	"price_first" integer NOT NULL,
	"seats_economy_available" integer DEFAULT 50 NOT NULL,
	"seats_premium_available" integer DEFAULT 15 NOT NULL,
	"seats_business_available" integer DEFAULT 8 NOT NULL,
	"seats_first_available" integer DEFAULT 4 NOT NULL,
	"on_time_pct" integer DEFAULT 95 NOT NULL,
	"baggage_carousel" varchar(50),
	"delay_minutes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flight_number" varchar(20),
	"event_type" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"severity" varchar(20) DEFAULT 'INFO' NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passengers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" varchar(30),
	"frequent_flyer_tier" varchar(30) DEFAULT 'Silver',
	"miles_balance" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "passengers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"passenger_email" text NOT NULL,
	"passenger_name" text NOT NULL,
	"pnr" varchar(12),
	"category" varchar(50) NOT NULL,
	"subject" text NOT NULL,
	"status" varchar(30) DEFAULT 'Open' NOT NULL,
	"priority" varchar(30) DEFAULT 'Medium' NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_flight_number_flights_flight_number_fk" FOREIGN KEY ("flight_number") REFERENCES "public"."flights"("flight_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flights" ADD CONSTRAINT "flights_origin_code_airports_code_fk" FOREIGN KEY ("origin_code") REFERENCES "public"."airports"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flights" ADD CONSTRAINT "flights_destination_code_airports_code_fk" FOREIGN KEY ("destination_code") REFERENCES "public"."airports"("code") ON DELETE no action ON UPDATE no action;