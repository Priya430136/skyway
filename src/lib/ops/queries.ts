import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Flight = Database["public"]["Tables"]["flights"]["Row"];
export type Airport = Database["public"]["Tables"]["airports"]["Row"];
export type Aircraft = Database["public"]["Tables"]["aircraft"]["Row"];
export type OpsNotification = Database["public"]["Tables"]["ops_notifications"]["Row"];
export type DelayEvent = Database["public"]["Tables"]["delay_events"]["Row"];
export type FlightEvent = Database["public"]["Tables"]["flight_events"]["Row"];

export const FALLBACK_AIRPORTS: Airport[] = [
  { code: "DEL", name: "Indira Gandhi International", city: "Delhi", country: "India", gates: 92, runways: 3, status: "operating", lat: 28.5562, lon: 77.1000, congestion: 68, visibility_km: 10, weather: "Clear Sky", wind_kts: 8, created_at: new Date().toISOString() },
  { code: "BOM", name: "Chhatrapati Shivaji Maharaj Intl", city: "Mumbai", country: "India", gates: 84, runways: 2, status: "operating", lat: 19.0896, lon: 72.8656, congestion: 74, visibility_km: 9, weather: "Partly Cloudy", wind_kts: 12, created_at: new Date().toISOString() },
  { code: "LHR", name: "Heathrow Airport", city: "London", country: "United Kingdom", gates: 115, runways: 2, status: "operating", lat: 51.4700, lon: -0.4543, congestion: 82, visibility_km: 8, weather: "Light Rain", wind_kts: 14, created_at: new Date().toISOString() },
  { code: "JFK", name: "John F. Kennedy International", city: "New York", country: "United States", gates: 128, runways: 4, status: "operating", lat: 40.6413, lon: -73.7781, congestion: 65, visibility_km: 12, weather: "Sunny", wind_kts: 9, created_at: new Date().toISOString() },
  { code: "DXB", name: "Dubai International Airport", city: "Dubai", country: "UAE", gates: 184, runways: 2, status: "operating", lat: 25.2532, lon: 55.3657, congestion: 71, visibility_km: 15, weather: "Clear & Sunny", wind_kts: 6, created_at: new Date().toISOString() },
  { code: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "Singapore", gates: 140, runways: 3, status: "operating", lat: 1.3644, lon: 103.9915, congestion: 58, visibility_km: 10, weather: "Humid / Tropical", wind_kts: 7, created_at: new Date().toISOString() },
  { code: "CDG", name: "Charles de Gaulle Airport", city: "Paris", country: "France", gates: 138, runways: 4, status: "operating", lat: 49.0097, lon: 2.5479, congestion: 79, visibility_km: 10, weather: "Mild Breeze", wind_kts: 11, created_at: new Date().toISOString() },
  { code: "HND", name: "Tokyo Haneda Airport", city: "Tokyo", country: "Japan", gates: 96, runways: 4, status: "operating", lat: 35.5494, lon: 139.7798, congestion: 62, visibility_km: 14, weather: "Clear", wind_kts: 5, created_at: new Date().toISOString() },
];

export const FALLBACK_AIRCRAFT: Aircraft[] = [
  { tail: "N787SW", model: "Boeing 787-9 Dreamliner", status: "in-service", fuel_level: 88, hours_flown: 3420, base: "DEL", next_assignment: "SW128", created_at: new Date().toISOString() },
  { tail: "N350SW", model: "Airbus A350-1000", status: "in-service", fuel_level: 92, hours_flown: 2180, base: "BOM", next_assignment: "SW811", created_at: new Date().toISOString() },
  { tail: "N777SW", model: "Boeing 777-300ER", status: "in-service", fuel_level: 76, hours_flown: 5120, base: "BOM", next_assignment: "SW904", created_at: new Date().toISOString() },
  { tail: "N320SW", model: "Airbus A320neo", status: "available", fuel_level: 95, hours_flown: 1840, base: "BOM", next_assignment: "SW310", created_at: new Date().toISOString() },
  { tail: "N321SW", model: "Airbus A321neo", status: "available", fuel_level: 90, hours_flown: 1420, base: "DEL", next_assignment: "SW105", created_at: new Date().toISOString() },
  { tail: "N788SW", model: "Boeing 787-8", status: "maintenance", fuel_level: 40, hours_flown: 6200, base: "DEL", next_assignment: null, created_at: new Date().toISOString() },
  { tail: "N359SW", model: "Airbus A350-900", status: "available", fuel_level: 100, hours_flown: 980, base: "SIN", next_assignment: null, created_at: new Date().toISOString() },
];

export const FALLBACK_FLIGHTS: Flight[] = [
  {
    id: "f-128",
    flight_no: "SW128",
    origin: "DEL",
    destination: "CDG",
    scheduled_dep: new Date(Date.now() - 3600 * 1000).toISOString(),
    scheduled_arr: new Date(Date.now() + 7 * 3600 * 1000).toISOString(),
    actual_dep: new Date(Date.now() - 3500 * 1000).toISOString(),
    actual_arr: null,
    status: "in-flight",
    aircraft_tail: "N787SW",
    gate: "B12",
    terminal: "T3",
    delay_minutes: 0,
    occupancy: 284,
    captain: "Capt. Rajesh K.",
    cabin: "mixed",
    weather: "Clear 28°C",
    current_lat: 38.2,
    current_lon: 48.5,
    created_at: new Date().toISOString(),
  },
  {
    id: "f-204",
    flight_no: "SW204",
    origin: "DEL",
    destination: "BOM",
    scheduled_dep: new Date(Date.now() + 1800 * 1000).toISOString(),
    scheduled_arr: new Date(Date.now() + 9000 * 1000).toISOString(),
    actual_dep: null,
    actual_arr: null,
    status: "delayed",
    aircraft_tail: "N321SW",
    gate: "B14",
    terminal: "T3",
    delay_minutes: 20,
    occupancy: 172,
    captain: "Capt. Priya Mehta",
    cabin: "mixed",
    weather: "Sunny 28°C",
    current_lat: 28.55,
    current_lon: 77.10,
    created_at: new Date().toISOString(),
  },
  {
    id: "f-502",
    flight_no: "SW502",
    origin: "DEL",
    destination: "LHR",
    scheduled_dep: new Date(Date.now() + 2400 * 1000).toISOString(),
    scheduled_arr: new Date(Date.now() + 34000 * 1000).toISOString(),
    actual_dep: null,
    actual_arr: null,
    status: "boarding",
    aircraft_tail: "N350SW",
    gate: "A04",
    terminal: "T3",
    delay_minutes: 0,
    occupancy: 310,
    captain: "Capt. Alistair Ross",
    cabin: "mixed",
    weather: "Clear 28°C",
    current_lat: 28.55,
    current_lon: 77.10,
    created_at: new Date().toISOString(),
  },
  {
    id: "f-811",
    flight_no: "SW811",
    origin: "BOM",
    destination: "DXB",
    scheduled_dep: new Date(Date.now() + 5400 * 1000).toISOString(),
    scheduled_arr: new Date(Date.now() + 18000 * 1000).toISOString(),
    actual_dep: null,
    actual_arr: null,
    status: "scheduled",
    aircraft_tail: "N350SW",
    gate: "C19",
    terminal: "T2",
    delay_minutes: 0,
    occupancy: 280,
    captain: "Capt. Vikram Singh",
    cabin: "business",
    weather: "Partly Cloudy 29°C",
    current_lat: 19.08,
    current_lon: 72.86,
    created_at: new Date().toISOString(),
  },
  {
    id: "f-904",
    flight_no: "SW904",
    origin: "BOM",
    destination: "SIN",
    scheduled_dep: new Date(Date.now() + 12000 * 1000).toISOString(),
    scheduled_arr: new Date(Date.now() + 32000 * 1000).toISOString(),
    actual_dep: null,
    actual_arr: null,
    status: "delayed",
    aircraft_tail: "N777SW",
    gate: "D04",
    terminal: "T2",
    delay_minutes: 35,
    occupancy: 318,
    captain: "Capt. Ananya Sen",
    cabin: "mixed",
    weather: "Partly Cloudy 29°C",
    current_lat: 19.08,
    current_lon: 72.86,
    created_at: new Date().toISOString(),
  },
  {
    id: "f-310",
    flight_no: "SW310",
    origin: "BOM",
    destination: "DEL",
    scheduled_dep: new Date(Date.now() + 900 * 1000).toISOString(),
    scheduled_arr: new Date(Date.now() + 8100 * 1000).toISOString(),
    actual_dep: null,
    actual_arr: null,
    status: "boarding",
    aircraft_tail: "N320SW",
    gate: "A08",
    terminal: "T1",
    delay_minutes: 0,
    occupancy: 168,
    captain: "Capt. Sanjay Roy",
    cabin: "economy",
    weather: "Breezy 29°C",
    current_lat: 19.08,
    current_lon: 72.86,
    created_at: new Date().toISOString(),
  },
  {
    id: "f-340",
    flight_no: "SW340",
    origin: "DEL",
    destination: "DXB",
    scheduled_dep: new Date(Date.now() - 7200 * 1000).toISOString(),
    scheduled_arr: new Date(Date.now() + 3600 * 1000).toISOString(),
    actual_dep: new Date(Date.now() - 7100 * 1000).toISOString(),
    actual_arr: null,
    status: "in-flight",
    aircraft_tail: "N321SW",
    gate: "D08",
    terminal: "T3",
    delay_minutes: 0,
    occupancy: 180,
    captain: "Capt. Sarah Jenkins",
    cabin: "mixed",
    weather: "Clear 28°C",
    current_lat: 26.1,
    current_lon: 64.2,
    created_at: new Date().toISOString(),
  },
];

export const FALLBACK_NOTIFICATIONS: OpsNotification[] = [
  { id: "notif-1", flight_no: "SW204", airport_code: "DEL", title: "Gate change: SW204 moved to Gate B14", body: "Aircraft reassigned to B14 due to ground tug maintenance at A11.", severity: "warning", type: "gate", read: false, created_at: new Date(Date.now() - 900 * 1000).toISOString() },
  { id: "notif-2", flight_no: "SW904", airport_code: "BOM", title: "Weather delay alert: SW904 (+35m)", body: "En-route convective monsoon cell over Bay of Bengal requires alternate route plan.", severity: "warning", type: "delay", read: false, created_at: new Date(Date.now() - 1800 * 1000).toISOString() },
  { id: "notif-3", flight_no: "SW502", airport_code: "DEL", title: "Boarding commenced for SW502 (Gate A04)", body: "Priority boarding active for First and Business class passengers.", severity: "info", type: "ops", read: true, created_at: new Date(Date.now() - 600 * 1000).toISOString() },
  { id: "notif-4", flight_no: "SW128", airport_code: "CDG", title: "SW128 entering European airspace", body: "Cruising at FL380 on-time ETA 14:20 Paris Charles de Gaulle.", severity: "info", type: "flight", read: true, created_at: new Date(Date.now() - 2400 * 1000).toISOString() },
];

export const FALLBACK_DELAYS: DelayEvent[] = [
  { id: "del-1", flight_no: "SW204", minutes: 20, reason: "Inbound Turnaround & Baggage Transfer", affected_passengers: 172, revenue_impact: 1400, recovery_status: "in-progress", created_at: new Date(Date.now() - 1200 * 1000).toISOString() },
  { id: "del-2", flight_no: "SW904", minutes: 35, reason: "Air Traffic Flow Control & Monsoon Front", affected_passengers: 318, revenue_impact: 4200, recovery_status: "routed", created_at: new Date(Date.now() - 2400 * 1000).toISOString() },
];

export const FALLBACK_EVENTS: FlightEvent[] = [
  { id: "ev-1", flight_no: "SW128", stage: "Takeoff", note: "Departed runway 11R on schedule", at: new Date(Date.now() - 3500 * 1000).toISOString() },
  { id: "ev-2", flight_no: "SW128", stage: "Cruising", note: "FL380 over Central Asia waypoint", at: new Date(Date.now() - 1800 * 1000).toISOString() },
  { id: "ev-3", flight_no: "SW502", stage: "Boarding", note: "Gate A04 doors open", at: new Date(Date.now() - 600 * 1000).toISOString() },
];

export const flightsQuery = queryOptions({
  queryKey: ["ops", "flights"],
  queryFn: async () => {
    try {
      const { data, error } = await supabase
        .from("flights")
        .select("*")
        .order("scheduled_dep", { ascending: true });
      if (!error && data && data.length > 0) return data;
    } catch {
      // Fall back smoothly
    }
    return FALLBACK_FLIGHTS;
  },
  staleTime: 15_000,
});

export const airportsQuery = queryOptions({
  queryKey: ["ops", "airports"],
  queryFn: async () => {
    try {
      const { data, error } = await supabase.from("airports").select("*").order("code");
      if (!error && data && data.length > 0) return data;
    } catch {
      // Fall back smoothly
    }
    return FALLBACK_AIRPORTS;
  },
  staleTime: 60_000,
});

export const aircraftQuery = queryOptions({
  queryKey: ["ops", "aircraft"],
  queryFn: async () => {
    try {
      const { data, error } = await supabase.from("aircraft").select("*").order("tail");
      if (!error && data && data.length > 0) return data;
    } catch {
      // Fall back smoothly
    }
    return FALLBACK_AIRCRAFT;
  },
  staleTime: 60_000,
});

export const notificationsQuery = queryOptions({
  queryKey: ["ops", "notifications"],
  queryFn: async () => {
    try {
      const { data, error } = await supabase
        .from("ops_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && data && data.length > 0) return data;
    } catch {
      // Fall back smoothly
    }
    return FALLBACK_NOTIFICATIONS;
  },
  staleTime: 10_000,
});

export const delaysQuery = queryOptions({
  queryKey: ["ops", "delays"],
  queryFn: async () => {
    try {
      const { data, error } = await supabase
        .from("delay_events")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch {
      // Fall back smoothly
    }
    return FALLBACK_DELAYS;
  },
  staleTime: 30_000,
});

export const flightEventsQuery = queryOptions({
  queryKey: ["ops", "flight_events"],
  queryFn: async () => {
    try {
      const { data, error } = await supabase
        .from("flight_events")
        .select("*")
        .order("at", { ascending: true });
      if (!error && data && data.length > 0) return data;
    } catch {
      // Fall back smoothly
    }
    return FALLBACK_EVENTS;
  },
  staleTime: 30_000,
});

