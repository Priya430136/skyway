
DROP POLICY IF EXISTS "aircraft readable" ON public.aircraft;
REVOKE SELECT ON public.aircraft FROM anon;
CREATE POLICY "aircraft readable by authenticated" ON public.aircraft FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "flights readable" ON public.flights;
REVOKE SELECT ON public.flights FROM anon;
CREATE POLICY "flights readable by authenticated" ON public.flights FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "flight_events readable" ON public.flight_events;
REVOKE SELECT ON public.flight_events FROM anon;
CREATE POLICY "flight_events readable by authenticated" ON public.flight_events FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "delay_events readable" ON public.delay_events;
REVOKE SELECT ON public.delay_events FROM anon;
CREATE POLICY "delay_events readable by authenticated" ON public.delay_events FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ops_notifications readable" ON public.ops_notifications;
REVOKE SELECT ON public.ops_notifications FROM anon;
CREATE POLICY "ops_notifications readable by authenticated" ON public.ops_notifications FOR SELECT TO authenticated USING (true);
