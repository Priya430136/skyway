export interface AirportOption {
  code: string;
  city: string;
  name: string;
  country: string;
}

export const POPULAR_AIRPORTS: AirportOption[] = [
  { code: "DEL", city: "New Delhi", name: "Indira Gandhi International", country: "India" },
  { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj", country: "India" },
  { code: "BLR", city: "Bengaluru", name: "Kempegowda International", country: "India" },
  { code: "DXB", city: "Dubai", name: "Dubai International", country: "UAE" },
  { code: "LHR", city: "London", name: "Heathrow Airport", country: "United Kingdom" },
  { code: "SIN", city: "Singapore", name: "Changi Airport", country: "Singapore" },
  { code: "JFK", city: "New York", name: "John F. Kennedy Intl", country: "United States" },
  { code: "NRT", city: "Tokyo", name: "Narita International", country: "Japan" },
  { code: "CDG", city: "Paris", name: "Charles de Gaulle", country: "France" },
  { code: "FRA", city: "Frankfurt", name: "Frankfurt Airport", country: "Germany" },
];
