export interface Airport {
  iata: string;
  city: string;
  country: string;
}

export interface Itinerary {
  id: string;
  flightNumber: string;
  origin: Airport;
  destination: Airport;
  departure: string; // ISO time-of-day "HH:mm"
  arrival: string;
  durationMinutes: number;
  stops: number;
  aircraft: string;
  cabin: "Economy" | "Premium" | "Business" | "First";
  priceUSD: number;
  onTimePct: number;
}

export const AIRPORTS: Airport[] = [
  { iata: "LHR", city: "London", country: "United Kingdom" },
  { iata: "JFK", city: "New York", country: "United States" },
  { iata: "HND", city: "Tokyo", country: "Japan" },
  { iata: "SIN", city: "Singapore", country: "Singapore" },
  { iata: "DXB", city: "Dubai", country: "UAE" },
  { iata: "CDG", city: "Paris", country: "France" },
  { iata: "FRA", city: "Frankfurt", country: "Germany" },
  { iata: "SFO", city: "San Francisco", country: "United States" },
  { iata: "ZRH", city: "Zürich", country: "Switzerland" },
  { iata: "SYD", city: "Sydney", country: "Australia" },
];

const AIRCRAFT = ["Boeing 787-9", "Airbus A350-1000", "Boeing 777-300ER", "Airbus A380-800"];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Deterministic sample itinerary search — given the same origin/destination
 * pair, returns the same 4 itineraries. Pure client-side.
 */
export function searchItineraries(
  originIata: string,
  destinationIata: string,
  cabin: Itinerary["cabin"] = "Economy",
): Itinerary[] {
  const origin = AIRPORTS.find((a) => a.iata === originIata);
  const destination = AIRPORTS.find((a) => a.iata === destinationIata);
  if (!origin || !destination || origin.iata === destination.iata) return [];

  const seed = hash(`${origin.iata}-${destination.iata}`);
  const baseDuration = 240 + (seed % 600); // 4h–14h
  const basePrice = 320 + (seed % 1800);

  const cabinMultiplier: Record<Itinerary["cabin"], number> = {
    Economy: 1,
    Premium: 1.7,
    Business: 3.4,
    First: 6.2,
  };

  return Array.from({ length: 4 }).map((_, i) => {
    const depHour = (6 + i * 4 + (seed % 3)) % 24;
    const depMin = (i * 17) % 60;
    const duration = baseDuration + i * 35 - (i === 0 ? 20 : 0);
    const arrTotal = depHour * 60 + depMin + duration;
    const arrHour = Math.floor((arrTotal / 60) % 24);
    const arrMin = arrTotal % 60;
    const stops = i === 1 ? 1 : 0;
    const priceVariance = [0, -40, 110, 260][i];
    return {
      id: `${origin.iata}${destination.iata}-${i}`,
      flightNumber: `SK${100 + ((seed + i * 7) % 899)}`,
      origin,
      destination,
      departure: `${pad(depHour)}:${pad(depMin)}`,
      arrival: `${pad(arrHour)}:${pad(arrMin)}`,
      durationMinutes: duration,
      stops,
      aircraft: AIRCRAFT[(seed + i) % AIRCRAFT.length],
      cabin,
      priceUSD: Math.round(
        (basePrice + priceVariance + i * 60) * cabinMultiplier[cabin],
      ),
      onTimePct: 84 + ((seed + i) % 14),
    };
  });
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}
