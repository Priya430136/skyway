// SkyWay Unified Global Search Engine
// Powers instant cross-platform lookup for Flights, Passengers, Bookings, Support Tickets, Fleet, and Hubs.

import { FALLBACK_FLIGHTS } from "@/lib/ops/queries";
import { tickets as mockTickets } from "@/lib/support/mock";
import { flights as adminFlights, fleet as adminFleet, airports as adminAirports } from "@/lib/admin/mock";

export type SearchCategory = "all" | "flights" | "passengers" | "tickets" | "fleet" | "airports";

export interface SearchResultItem {
  id: string;
  category: "flight" | "passenger" | "ticket" | "fleet" | "airport";
  title: string;
  subtitle: string;
  description?: string;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "destructive" | "info" | "secondary";
  routeUrl: string;
  metadata: {
    flightNo?: string;
    pnr?: string;
    seat?: string;
    ticketId?: string;
    status?: string;
    airportCode?: string;
    tailNumber?: string;
    passengerName?: string;
    agent?: string;
    gate?: string;
    route?: string;
  };
}

// Static passenger list with booking references (PNR), frequent flyer tier, and assigned seats
export interface PassengerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  pnr: string;
  flightNo: string;
  route: string;
  seat: string;
  cabin: "Economy" | "Premium" | "Business" | "First";
  tier: "Standard" | "Silver" | "Gold" | "Platinum" | "SkyClub VIP";
  ticketNumber: string;
  status: "Checked In" | "Boarded" | "Confirmed" | "Standby" | "Delayed";
}

export const PASSENGER_DIRECTORY: PassengerRecord[] = [
  { id: "pax-1", name: "Elena Rossi", email: "elena.rossi@mail.com", phone: "+1 (555) 234-8910", pnr: "SW047514", flightNo: "SW128", route: "DEL → CDG", seat: "12A", cabin: "Business", tier: "Platinum", ticketNumber: "217-98214501", status: "Checked In" },
  { id: "pax-2", name: "Michael O'Brien", email: "m.obrien@mail.com", phone: "+1 (555) 892-1204", pnr: "SW007919", flightNo: "SW101", route: "JFK → LHR", seat: "2A", cabin: "First", tier: "SkyClub VIP", ticketNumber: "217-98214502", status: "Boarded" },
  { id: "pax-3", name: "Priya Nair", email: "priya.nair@mail.com", phone: "+91 98201 44552", pnr: "SW015838", flightNo: "SW204", route: "DEL → BOM", seat: "14F", cabin: "Economy", tier: "Gold", ticketNumber: "217-98214503", status: "Confirmed" },
  { id: "pax-4", name: "Aiko Sato", email: "aiko.sato@mail.com", phone: "+81 90-1234-5678", pnr: "SW023757", flightNo: "SW502", route: "DEL → LHR", seat: "04B", cabin: "Business", tier: "Platinum", ticketNumber: "217-98214504", status: "Checked In" },
  { id: "pax-5", name: "Rafael Costa", email: "rafael.costa@mail.com", phone: "+55 11 9876-5432", pnr: "SW031676", flightNo: "SW508", route: "DXB → SIN", seat: "28C", cabin: "Economy", tier: "Silver", ticketNumber: "217-98214505", status: "Confirmed" },
  { id: "pax-6", name: "Chloé Dubois", email: "chloe.dubois@mail.com", phone: "+33 6 12 34 56 78", pnr: "SW039595", flightNo: "SW214", route: "LHR → CDG", seat: "01K", cabin: "First", tier: "SkyClub VIP", ticketNumber: "217-98214506", status: "Boarded" },
  { id: "pax-7", name: "Aarav Patel", email: "aarav.patel@mail.com", phone: "+91 98110 33219", pnr: "SW047514", flightNo: "SW128", route: "DEL → CDG", seat: "16D", cabin: "Premium", tier: "Gold", ticketNumber: "217-98214507", status: "Checked In" },
  { id: "pax-8", name: "Jonas Weber", email: "jonas.weber@mail.com", phone: "+49 170 1234567", pnr: "SW055433", flightNo: "SW612", route: "NRT → LAX", seat: "07A", cabin: "Business", tier: "Platinum", ticketNumber: "217-98214508", status: "Confirmed" },
  { id: "pax-9", name: "Nora Lindqvist", email: "nora.lindqvist@mail.com", phone: "+46 70 123 4567", pnr: "SW063352", flightNo: "SW733", route: "SYD → AKL", seat: "22A", cabin: "Economy", tier: "Silver", ticketNumber: "217-98214509", status: "Confirmed" },
  { id: "pax-10", name: "Miguel Santos", email: "miguel.santos@mail.com", phone: "+34 600 123 456", pnr: "SW071271", flightNo: "SW841", route: "FRA → JFK", seat: "19C", cabin: "Economy", tier: "Standard", ticketNumber: "217-98214510", status: "Delayed" },
  { id: "pax-11", name: "Isla McKenzie", email: "isla.mckenzie@mail.com", phone: "+44 7700 900077", pnr: "SW079190", flightNo: "SW902", route: "SFO → NRT", seat: "03F", cabin: "First", tier: "Platinum", ticketNumber: "217-98214511", status: "Confirmed" },
  { id: "pax-12", name: "Zara Ahmed", email: "zara.ahmed@mail.com", phone: "+971 50 123 4567", pnr: "SW087109", flightNo: "SW118", route: "MAD → LIS", seat: "08B", cabin: "Business", tier: "Gold", ticketNumber: "217-98214512", status: "Checked In" },
  { id: "pax-13", name: "Sofia Ricci", email: "sofia.ricci@mail.com", phone: "+39 02 1234567", pnr: "SW095028", flightNo: "SW101", route: "JFK → LHR", seat: "11A", cabin: "Business", tier: "Platinum", ticketNumber: "217-98214513", status: "Boarded" },
  { id: "pax-14", name: "Kenji Tanaka", email: "kenji.tanaka@mail.com", phone: "+81 80-9876-5432", pnr: "SW002947", flightNo: "SW508", route: "DXB → SIN", seat: "15C", cabin: "Premium", tier: "Gold", ticketNumber: "217-98214514", status: "Checked In" },
  { id: "pax-15", name: "Marcus Bell", email: "marcus.bell@mail.com", phone: "+1 (555) 345-6789", pnr: "SW010866", flightNo: "SW204", route: "DEL → BOM", seat: "02F", cabin: "First", tier: "SkyClub VIP", ticketNumber: "217-98214515", status: "Confirmed" },
];

/**
 * Searches across all platform entities using fuzzy/substring matching.
 */
export function searchGlobal(query: string, category: SearchCategory = "all", maxResults = 16): SearchResultItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResultItem[] = [];

  // 1. Search Flights
  if (category === "all" || category === "flights") {
    // Combine operations flights and admin flights
    const seenFlightNos = new Set<string>();

    FALLBACK_FLIGHTS.forEach((f) => {
      seenFlightNos.add(f.flight_no.toLowerCase());
      const match =
        f.flight_no.toLowerCase().includes(q) ||
        f.origin.toLowerCase().includes(q) ||
        f.destination.toLowerCase().includes(q) ||
        `${f.origin} ${f.destination}`.toLowerCase().includes(q) ||
        (f.gate && f.gate.toLowerCase().includes(q)) ||
        (f.aircraft_tail && f.aircraft_tail.toLowerCase().includes(q)) ||
        (f.captain && f.captain.toLowerCase().includes(q)) ||
        f.status.toLowerCase().includes(q);

      if (match) {
        let badgeVariant: SearchResultItem["badgeVariant"] = "info";
        if (f.status === "in-flight") badgeVariant = "success";
        else if (f.status === "delayed") badgeVariant = "warning";
        else if (f.status === "cancelled") badgeVariant = "destructive";

        results.push({
          id: `flight-ops-${f.id}`,
          category: "flight",
          title: `${f.flight_no} · ${f.origin} → ${f.destination}`,
          subtitle: `Gate ${f.gate || "TBD"} · Terminal ${f.terminal || "T3"} · ${f.aircraft_tail || "787"} · ${f.captain || "Flight Crew"}`,
          description: `Scheduled: ${new Date(f.scheduled_dep).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · Status: ${f.status.toUpperCase()}${f.delay_minutes > 0 ? ` (+${f.delay_minutes}m)` : ""}`,
          badge: f.status.toUpperCase(),
          badgeVariant,
          routeUrl: `/ops/flights?id=${f.id}`,
          metadata: {
            flightNo: f.flight_no,
            route: `${f.origin} → ${f.destination}`,
            gate: f.gate,
            status: f.status,
            tailNumber: f.aircraft_tail,
          },
        });
      }
    });

    adminFlights.forEach((f) => {
      if (seenFlightNos.has(f.no.toLowerCase())) return;
      seenFlightNos.add(f.no.toLowerCase());

      const match =
        f.no.toLowerCase().includes(q) ||
        f.route.toLowerCase().includes(q) ||
        f.aircraft.toLowerCase().includes(q) ||
        f.gate.toLowerCase().includes(q) ||
        f.status.toLowerCase().includes(q);

      if (match) {
        let badgeVariant: SearchResultItem["badgeVariant"] = "default";
        if (f.status === "in-flight" || f.status === "on-time") badgeVariant = "success";
        else if (f.status === "delayed") badgeVariant = "warning";
        else if (f.status === "cancelled") badgeVariant = "destructive";

        results.push({
          id: `flight-adm-${f.id}`,
          category: "flight",
          title: `${f.no} · ${f.route}`,
          subtitle: `Gate ${f.gate} · ${f.aircraft} · Schedule ${f.schedule} · Occupancy ${f.occupancy}/${f.capacity}`,
          badge: f.status.toUpperCase(),
          badgeVariant,
          routeUrl: `/admin/routes?flight=${f.no}`,
          metadata: {
            flightNo: f.no,
            route: f.route,
            gate: f.gate,
            status: f.status,
            tailNumber: f.aircraft,
          },
        });
      }
    });
  }

  // 2. Search Passengers & Bookings
  if (category === "all" || category === "passengers") {
    PASSENGER_DIRECTORY.forEach((p) => {
      const match =
        p.name.toLowerCase().includes(q) ||
        p.pnr.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        p.flightNo.toLowerCase().includes(q) ||
        p.seat.toLowerCase().includes(q) ||
        p.ticketNumber.toLowerCase().includes(q) ||
        p.tier.toLowerCase().includes(q) ||
        p.route.toLowerCase().includes(q);

      if (match) {
        let badgeVariant: SearchResultItem["badgeVariant"] = "default";
        if (p.tier === "SkyClub VIP" || p.tier === "Platinum") badgeVariant = "info";
        else if (p.tier === "Gold") badgeVariant = "warning";

        results.push({
          id: `pax-${p.id}`,
          category: "passenger",
          title: `${p.name} (PNR: ${p.pnr})`,
          subtitle: `Flight ${p.flightNo} (${p.route}) · Seat ${p.seat} (${p.cabin}) · Tier: ${p.tier}`,
          description: `${p.email} · ${p.phone} · Ticket: ${p.ticketNumber} · Status: ${p.status}`,
          badge: `${p.cabin} · ${p.tier}`,
          badgeVariant,
          routeUrl: `/app/boarding-pass?pnr=${p.pnr}`,
          metadata: {
            passengerName: p.name,
            pnr: p.pnr,
            seat: p.seat,
            flightNo: p.flightNo,
            route: p.route,
          },
        });
      }
    });
  }

  // 3. Search Support Tickets
  if (category === "all" || category === "tickets") {
    mockTickets.forEach((t) => {
      const match =
        t.id.toLowerCase().includes(q) ||
        t.passenger.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.booking.toLowerCase().includes(q) ||
        t.flight.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q) ||
        t.priority.toLowerCase().includes(q) ||
        t.agent.toLowerCase().includes(q);

      if (match) {
        let badgeVariant: SearchResultItem["badgeVariant"] = "default";
        if (t.priority === "urgent" || t.priority === "high") badgeVariant = "destructive";
        else if (t.status === "open") badgeVariant = "warning";
        else if (t.status === "resolved") badgeVariant = "success";

        results.push({
          id: `ticket-${t.id}`,
          category: "ticket",
          title: `${t.id}: ${t.subject}`,
          subtitle: `Passenger: ${t.passenger} (PNR: ${t.booking}) · Flight: ${t.flight} · Agent: ${t.agent}`,
          description: `${t.category} · Priority: ${t.priority.toUpperCase()} · Status: ${t.status.toUpperCase()} · ${t.preview}`,
          badge: `${t.priority.toUpperCase()} · ${t.status.toUpperCase()}`,
          badgeVariant,
          routeUrl: `/support/tickets?id=${t.id}`,
          metadata: {
            ticketId: t.id,
            passengerName: t.passenger,
            pnr: t.booking,
            flightNo: t.flight,
            agent: t.agent,
            status: t.status,
          },
        });
      }
    });
  }

  // 4. Search Fleet Aircraft
  if (category === "all" || category === "fleet") {
    adminFleet.forEach((a) => {
      const match =
        a.tail.toLowerCase().includes(q) ||
        a.model.toLowerCase().includes(q) ||
        a.airport.toLowerCase().includes(q) ||
        (a.flight && a.flight.toLowerCase().includes(q)) ||
        a.maint.toLowerCase().includes(q);

      if (match) {
        results.push({
          id: `fleet-${a.tail}`,
          category: "fleet",
          title: `Aircraft ${a.tail} (${a.model})`,
          subtitle: `Base/Station: ${a.airport} · Capacity: ${a.capacity} pax · Fuel: ${a.fuel}% · Maintenance: ${a.maint.toUpperCase()}`,
          description: a.flight ? `Currently assigned to flight ${a.flight}` : "Available for scheduled assignment",
          badge: a.available ? "AVAILABLE" : "ASSIGNED",
          badgeVariant: a.available ? "success" : "info",
          routeUrl: `/admin/aircraft?tail=${a.tail}`,
          metadata: {
            tailNumber: a.tail,
            airportCode: a.airport,
            flightNo: a.flight || undefined,
            status: a.maint,
          },
        });
      }
    });
  }

  // 5. Search Airports & Hubs
  if (category === "all" || category === "airports") {
    adminAirports.forEach((ap) => {
      const match =
        ap.code.toLowerCase().includes(q) ||
        ap.name.toLowerCase().includes(q) ||
        ap.city.toLowerCase().includes(q) ||
        ap.country.toLowerCase().includes(q);

      if (match) {
        results.push({
          id: `airport-${ap.code}`,
          category: "airport",
          title: `${ap.code} - ${ap.name} (${ap.city}, ${ap.country})`,
          subtitle: `${ap.gates} Gates · ${ap.runways} Runways · ${ap.terminals} Terminals · ${ap.lounges} SkyClubs · Capacity ${ap.capacity}%`,
          badge: ap.status.toUpperCase(),
          badgeVariant: ap.status === "operating" ? "success" : "warning",
          routeUrl: `/ops/gates?airport=${ap.code}`,
          metadata: {
            airportCode: ap.code,
            status: ap.status,
          },
        });
      }
    });
  }

  return results.slice(0, maxResults);
}

const RECENT_SEARCHES_KEY = "skyway:global-search:recents:v1";

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return ["SW128", "Elena Rossi", "TCK-8420", "DEL → CDG"];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn("Unable to load recent searches", err);
  }
  return ["SW128", "Elena Rossi", "TCK-8420", "DEL → CDG"];
}

export function saveRecentSearch(term: string) {
  if (typeof window === "undefined" || !term.trim()) return;
  try {
    const recents = getRecentSearches().filter((t) => t.toLowerCase() !== term.toLowerCase().trim());
    const updated = [term.trim(), ...recents].slice(0, 8);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Unable to save recent search", err);
  }
}
