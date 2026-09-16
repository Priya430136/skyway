
-- Restore public read access to OCC demo tables (mock data, no real auth)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['flights','aircraft','delay_events','flight_events','ops_notifications'] LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth read %s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated read %s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can read %s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "Public read %s" ON public.%I FOR SELECT TO anon, authenticated USING (true)', t, t);
  END LOOP;
END $$;
