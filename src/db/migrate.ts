import { getPool, isDbConnected } from "./index";

export const MIGRATION_SQL = `
-- 1. Airports
CREATE TABLE IF NOT EXISTS airports (
  code VARCHAR(10) PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  timezone TEXT NOT NULL,
  active_runways JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Flights
CREATE TABLE IF NOT EXISTS flights (
  flight_number VARCHAR(20) PRIMARY KEY,
  origin_code VARCHAR(10) NOT NULL REFERENCES airports(code) ON DELETE CASCADE,
  destination_code VARCHAR(10) NOT NULL REFERENCES airports(code) ON DELETE CASCADE,
  departure_time TEXT NOT NULL,
  arrival_time TEXT NOT NULL,
  duration TEXT NOT NULL,
  aircraft TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'Scheduled' NOT NULL,
  gate VARCHAR(20) DEFAULT 'TBD',
  terminal VARCHAR(20) DEFAULT 'T3',
  price_economy INTEGER NOT NULL,
  price_premium INTEGER NOT NULL,
  price_business INTEGER NOT NULL,
  price_first INTEGER NOT NULL,
  seats_economy_available INTEGER DEFAULT 50 NOT NULL,
  seats_premium_available INTEGER DEFAULT 15 NOT NULL,
  seats_business_available INTEGER DEFAULT 8 NOT NULL,
  seats_first_available INTEGER DEFAULT 4 NOT NULL,
  on_time_pct INTEGER DEFAULT 95 NOT NULL,
  baggage_carousel VARCHAR(50),
  delay_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Passengers
CREATE TABLE IF NOT EXISTS passengers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone VARCHAR(30),
  frequent_flyer_tier VARCHAR(30) DEFAULT 'Silver',
  miles_balance INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Bookings
CREATE TABLE IF NOT EXISTS bookings (
  pnr VARCHAR(12) PRIMARY KEY,
  flight_number VARCHAR(20) NOT NULL REFERENCES flights(flight_number) ON DELETE RESTRICT,
  passenger_name TEXT NOT NULL,
  passenger_email TEXT NOT NULL,
  passenger_phone VARCHAR(30) DEFAULT '+91 98765 43210',
  cabin_class VARCHAR(30) DEFAULT 'Economy' NOT NULL,
  seat_number VARCHAR(10) NOT NULL,
  is_checked_in BOOLEAN DEFAULT FALSE NOT NULL,
  boarding_pass_id TEXT,
  baggage_count INTEGER DEFAULT 1 NOT NULL,
  special_assistance TEXT,
  meal_preference TEXT,
  total_paid INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
  booking_date TEXT NOT NULL,
  status VARCHAR(30) DEFAULT 'CONFIRMED' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id VARCHAR(30) PRIMARY KEY,
  passenger_email TEXT NOT NULL,
  passenger_name TEXT NOT NULL,
  pnr VARCHAR(12),
  category VARCHAR(50) NOT NULL,
  subject TEXT NOT NULL,
  status VARCHAR(30) DEFAULT 'Open' NOT NULL,
  priority VARCHAR(30) DEFAULT 'Medium' NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. Operations & ATC Logs
CREATE TABLE IF NOT EXISTS ops_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flight_number VARCHAR(20),
  event_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'INFO' NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. Feedback
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pnr VARCHAR(12),
  flight_number VARCHAR(20),
  passenger_name TEXT NOT NULL,
  passenger_email TEXT NOT NULL,
  overall_rating INTEGER NOT NULL,
  flight_crew_rating INTEGER DEFAULT 5,
  cabin_cleanliness_rating INTEGER DEFAULT 5,
  food_beverage_rating INTEGER DEFAULT 5,
  punctuality_rating INTEGER DEFAULT 5,
  recommend_airline BOOLEAN DEFAULT TRUE NOT NULL,
  comments TEXT,
  highlight_tags JSONB DEFAULT '[]'::jsonb,
  follow_up_requested BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 8. Users
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role VARCHAR(30) DEFAULT 'PASSENGER' NOT NULL,
  frequent_flyer_tier VARCHAR(30) DEFAULT 'SILVER',
  miles_balance INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 9. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email TEXT,
  recipient_phone VARCHAR(30),
  channel VARCHAR(20) NOT NULL,
  type VARCHAR(50) NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(30) DEFAULT 'DELIVERED' NOT NULL,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create Indexes for High Performance Querying
CREATE INDEX IF NOT EXISTS idx_flights_origin_dest ON flights(origin_code, destination_code);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(passenger_email);
CREATE INDEX IF NOT EXISTS idx_bookings_flight ON bookings(flight_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_ops_logs_flight ON ops_logs(flight_number);
CREATE INDEX IF NOT EXISTS idx_notifications_email ON notifications(recipient_email);
`;

export async function runMigrations(): Promise<{ success: boolean; message: string; tables?: string[] }> {
  const connected = await isDbConnected();
  if (!connected) {
    return {
      success: false,
      message: "PostgreSQL is not connected. Ensure DATABASE_URL is properly configured.",
    };
  }

  const pool = getPool();
  if (!pool) {
    return {
      success: false,
      message: "Database pool not available.",
    };
  }

  try {
    await pool.query(MIGRATION_SQL);
    const tableRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tables = tableRes.rows.map((r: any) => r.table_name);
    return {
      success: true,
      message: "Successfully applied all PostgreSQL migrations and index structures.",
      tables,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Migration failed: ${err.message || String(err)}`,
    };
  }
}
