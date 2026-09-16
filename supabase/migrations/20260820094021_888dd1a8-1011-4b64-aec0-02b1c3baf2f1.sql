-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  phone text,
  tier text NOT NULL DEFAULT 'Silver',
  miles integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'support') OR has_role(auth.uid(),'ops'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- new signups get a profile + passenger role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email,'traveler'),'@',1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'passenger')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated, anon;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ BOOKINGS ============
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reference text NOT NULL UNIQUE,
  flight_no text REFERENCES public.flights(flight_no),
  cabin text NOT NULL DEFAULT 'economy',
  status text NOT NULL DEFAULT 'draft',
  base_amount numeric NOT NULL DEFAULT 0,
  extras_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  checked_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or staff read bookings" ON public.bookings FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'support') OR has_role(auth.uid(),'ops'));
CREATE POLICY "Users create own bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own or staff update bookings" ON public.bookings FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'support'))
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'support'));
CREATE POLICY "Users delete own draft bookings" ON public.bookings FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status = 'draft');
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- helper used by child-table policies
CREATE OR REPLACE FUNCTION public.can_access_booking(_booking_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = _booking_id
      AND (b.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')
           OR public.has_role(auth.uid(),'support') OR public.has_role(auth.uid(),'ops'))
  );
$$;

-- ============ PASSENGERS / SEATS / MEALS / BAGGAGE ============
CREATE TABLE public.booking_passengers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text,
  document_no text,
  date_of_birth date,
  seat text,
  meal text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_passengers TO authenticated;
GRANT ALL ON public.booking_passengers TO service_role;
ALTER TABLE public.booking_passengers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Access booking passengers" ON public.booking_passengers FOR ALL TO authenticated
  USING (public.can_access_booking(booking_id)) WITH CHECK (public.can_access_booking(booking_id));
CREATE TRIGGER trg_bpax_updated BEFORE UPDATE ON public.booking_passengers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.seat_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_no text NOT NULL REFERENCES public.flights(flight_no),
  seat text NOT NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  passenger_id uuid REFERENCES public.booking_passengers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (flight_no, seat)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seat_assignments TO authenticated;
GRANT SELECT ON public.seat_assignments TO anon;
GRANT ALL ON public.seat_assignments TO service_role;
ALTER TABLE public.seat_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Seat map readable" ON public.seat_assignments FOR SELECT USING (true);
CREATE POLICY "Manage own seat holds" ON public.seat_assignments FOR INSERT TO authenticated
  WITH CHECK (public.can_access_booking(booking_id));
CREATE POLICY "Update own seat holds" ON public.seat_assignments FOR UPDATE TO authenticated
  USING (public.can_access_booking(booking_id)) WITH CHECK (public.can_access_booking(booking_id));
CREATE POLICY "Release own seat holds" ON public.seat_assignments FOR DELETE TO authenticated
  USING (public.can_access_booking(booking_id));

CREATE TABLE public.baggage_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  passenger_id uuid REFERENCES public.booking_passengers(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'checked',
  weight_kg integer NOT NULL DEFAULT 23,
  quantity integer NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.baggage_items TO authenticated;
GRANT ALL ON public.baggage_items TO service_role;
ALTER TABLE public.baggage_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Access baggage" ON public.baggage_items FOR ALL TO authenticated
  USING (public.can_access_booking(booking_id)) WITH CHECK (public.can_access_booking(booking_id));

-- ============ PAYMENTS / REFUNDS ============
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  method text NOT NULL DEFAULT 'card',
  status text NOT NULL DEFAULT 'succeeded',
  reference text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Access payments" ON public.payments FOR SELECT TO authenticated USING (public.can_access_booking(booking_id));
CREATE POLICY "Create payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (public.can_access_booking(booking_id));

CREATE TABLE public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  fee numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.refunds TO authenticated;
GRANT ALL ON public.refunds TO service_role;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Access refunds" ON public.refunds FOR SELECT TO authenticated USING (public.can_access_booking(booking_id));
CREATE POLICY "Create refunds" ON public.refunds FOR INSERT TO authenticated WITH CHECK (public.can_access_booking(booking_id));
CREATE POLICY "Staff update refunds" ON public.refunds FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'support') OR has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'support') OR has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_refunds_updated BEFORE UPDATE ON public.refunds
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'normal',
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Create notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(),'ops') OR has_role(auth.uid(),'support') OR has_role(auth.uid(),'admin'));
CREATE POLICY "Update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ SUPPORT ============
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  user_id uuid,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  flight_no text,
  subject text NOT NULL,
  body text,
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  sentiment text,
  assignee_id uuid,
  assignee_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read tickets" ON public.support_tickets FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'support') OR has_role(auth.uid(),'admin'));
CREATE POLICY "Create tickets" ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(),'support') OR has_role(auth.uid(),'admin'));
CREATE POLICY "Staff update tickets" ON public.support_tickets FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'support') OR has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'support') OR has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.can_access_ticket(_ticket_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = _ticket_id
      AND (t.user_id = auth.uid() OR public.has_role(auth.uid(),'support') OR public.has_role(auth.uid(),'admin'))
  );
$$;

CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id uuid,
  author_name text,
  kind text NOT NULL DEFAULT 'reply',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ticket_messages TO authenticated;
GRANT ALL ON public.ticket_messages TO service_role;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read ticket messages" ON public.ticket_messages FOR SELECT TO authenticated
  USING (public.can_access_ticket(ticket_id) AND (kind <> 'note' OR has_role(auth.uid(),'support') OR has_role(auth.uid(),'admin')));
CREATE POLICY "Write ticket messages" ON public.ticket_messages FOR INSERT TO authenticated
  WITH CHECK (public.can_access_ticket(ticket_id));

CREATE TABLE public.ticket_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  actor_id uuid,
  actor_name text,
  type text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ticket_events TO authenticated;
GRANT ALL ON public.ticket_events TO service_role;
ALTER TABLE public.ticket_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read ticket events" ON public.ticket_events FOR SELECT TO authenticated USING (public.can_access_ticket(ticket_id));
CREATE POLICY "Write ticket events" ON public.ticket_events FOR INSERT TO authenticated WITH CHECK (public.can_access_ticket(ticket_id));

-- ============ STAFF WRITE ACCESS TO OPERATIONAL TABLES ============
CREATE POLICY "Ops manage flights" ON public.flights FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'ops') OR has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'ops') OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admin insert flights" ON public.flights FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete flights" ON public.flights FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'));

CREATE POLICY "Ops manage aircraft" ON public.aircraft FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'ops') OR has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'ops') OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admin insert aircraft" ON public.aircraft FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete aircraft" ON public.aircraft FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE POLICY "Admin manage airports" ON public.airports FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'ops'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'ops'));

CREATE POLICY "Ops write flight events" ON public.flight_events FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'ops') OR has_role(auth.uid(),'admin'));
CREATE POLICY "Ops write delay events" ON public.delay_events FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'ops') OR has_role(auth.uid(),'admin'));
CREATE POLICY "Ops write ops notifications" ON public.ops_notifications FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'ops') OR has_role(auth.uid(),'admin'));
CREATE POLICY "Ops update ops notifications" ON public.ops_notifications FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'ops') OR has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'ops') OR has_role(auth.uid(),'admin'));

-- self-service role claim for the demo portals (one row per user/role)
CREATE POLICY "Users claim their own role" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());