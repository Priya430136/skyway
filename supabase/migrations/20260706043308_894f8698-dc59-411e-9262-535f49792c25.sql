
-- AIRPORTS
CREATE TABLE public.airports (
  code text PRIMARY KEY,
  name text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  lat double precision NOT NULL,
  lon double precision NOT NULL,
  status text NOT NULL DEFAULT 'operating',
  congestion integer NOT NULL DEFAULT 0,
  weather text NOT NULL DEFAULT 'clear',
  visibility_km integer NOT NULL DEFAULT 10,
  wind_kts integer NOT NULL DEFAULT 5,
  runways integer NOT NULL DEFAULT 2,
  gates integer NOT NULL DEFAULT 20,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.airports TO anon, authenticated;
GRANT ALL ON public.airports TO service_role;
ALTER TABLE public.airports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "airports readable" ON public.airports FOR SELECT USING (true);

-- AIRCRAFT
CREATE TABLE public.aircraft (
  tail text PRIMARY KEY,
  model text NOT NULL,
  status text NOT NULL DEFAULT 'available',
  fuel_level integer NOT NULL DEFAULT 100,
  hours_flown integer NOT NULL DEFAULT 0,
  next_assignment text,
  base text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.aircraft TO anon, authenticated;
GRANT ALL ON public.aircraft TO service_role;
ALTER TABLE public.aircraft ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aircraft readable" ON public.aircraft FOR SELECT USING (true);

-- FLIGHTS
CREATE TABLE public.flights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_no text NOT NULL UNIQUE,
  origin text NOT NULL REFERENCES public.airports(code),
  destination text NOT NULL REFERENCES public.airports(code),
  aircraft_tail text REFERENCES public.aircraft(tail),
  gate text,
  terminal text,
  scheduled_dep timestamptz NOT NULL,
  scheduled_arr timestamptz NOT NULL,
  actual_dep timestamptz,
  actual_arr timestamptz,
  status text NOT NULL DEFAULT 'scheduled',
  delay_minutes integer NOT NULL DEFAULT 0,
  occupancy integer NOT NULL DEFAULT 0,
  captain text,
  weather text DEFAULT 'clear',
  current_lat double precision,
  current_lon double precision,
  cabin text DEFAULT 'economy',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.flights TO anon, authenticated;
GRANT ALL ON public.flights TO service_role;
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flights readable" ON public.flights FOR SELECT USING (true);
CREATE INDEX flights_status_idx ON public.flights(status);
CREATE INDEX flights_scheduled_dep_idx ON public.flights(scheduled_dep);

-- FLIGHT EVENTS (timeline)
CREATE TABLE public.flight_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_no text NOT NULL REFERENCES public.flights(flight_no) ON DELETE CASCADE,
  stage text NOT NULL,
  at timestamptz NOT NULL,
  note text
);
GRANT SELECT ON public.flight_events TO anon, authenticated;
GRANT ALL ON public.flight_events TO service_role;
ALTER TABLE public.flight_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flight_events readable" ON public.flight_events FOR SELECT USING (true);

-- DELAY EVENTS
CREATE TABLE public.delay_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_no text NOT NULL REFERENCES public.flights(flight_no) ON DELETE CASCADE,
  reason text NOT NULL,
  minutes integer NOT NULL,
  affected_passengers integer NOT NULL DEFAULT 0,
  revenue_impact numeric NOT NULL DEFAULT 0,
  recovery_status text DEFAULT 'in-progress',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.delay_events TO anon, authenticated;
GRANT ALL ON public.delay_events TO service_role;
ALTER TABLE public.delay_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "delay_events readable" ON public.delay_events FOR SELECT USING (true);

-- OPS NOTIFICATIONS
CREATE TABLE public.ops_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  flight_no text,
  airport_code text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ops_notifications TO anon, authenticated;
GRANT ALL ON public.ops_notifications TO service_role;
ALTER TABLE public.ops_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops_notifications readable" ON public.ops_notifications FOR SELECT USING (true);
CREATE INDEX ops_notifications_created_idx ON public.ops_notifications(created_at DESC);
