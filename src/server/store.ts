// In-memory data store for SkyWay Airlines Express backend

export interface AirportData {
  code: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
  temperature: string;
  weather: string;
  activeRunways: string[];
}

export interface FlightRecord {
  flightNumber: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  departureTime: string;
  arrivalTime: string;
  estimatedDepartureTime?: string;
  estimatedArrivalTime?: string;
  duration: string;
  aircraft: string;
  status: "Scheduled" | "On Time" | "Boarding" | "In Air" | "Delayed" | "Landed" | "Cancelled";
  gate: string;
  originalGate?: string;
  gateChanged?: boolean;
  gateChangedAt?: string;
  terminal: string;
  priceEconomy: number;
  pricePremium: number;
  priceBusiness: number;
  priceFirst: number;
  seatsAvailable: {
    economy: number;
    premium: number;
    business: number;
    first: number;
  };
  onTimePct: number;
  baggageCarousel?: string;
  delayMinutes?: number;
  delayReason?: string;
  weatherOrigin?: { temp: string; condition: string };
  weatherDest?: { temp: string; condition: string };
  updatedAt?: string;
}

export interface BookingRecord {
  pnr: string;
  flightNumber: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  seat: string;
  cabinClass: "Economy" | "Premium" | "Business" | "First";
  isCheckedIn: boolean;
  boardingPassId?: string;
  baggageCount: number;
  specialAssistance?: string;
  mealPreference?: string;
  totalPaid: number;
  currency: string;
  bookingDate: string;
  status: "CONFIRMED" | "CHECKED_IN" | "CANCELLED" | "COMPLETED";
}

export interface SupportTicketRecord {
  id: string;
  passengerEmail: string;
  passengerName: string;
  pnr?: string;
  category: "Baggage" | "Refund" | "Flight Delay" | "Special Assistance" | "General";
  subject: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  priority: "Low" | "Medium" | "High" | "Urgent";
  createdAt: string;
  messages: Array<{
    sender: "passenger" | "agent" | "ai";
    senderName: string;
    text: string;
    timestamp: string;
  }>;
}

export interface FeedbackRecord {
  id: string;
  pnr?: string;
  flightNumber?: string;
  passengerName: string;
  passengerEmail: string;
  overallRating: number;
  flightCrewRating?: number;
  cabinCleanlinessRating?: number;
  foodBeverageRating?: number;
  punctualityRating?: number;
  recommendAirline: boolean;
  comments?: string;
  highlightTags: string[];
  followUpRequested: boolean;
  createdAt: string;
}

export const AIRPORTS: AirportData[] = [
  { code: "DEL", name: "Indira Gandhi International", city: "Delhi", country: "India", lat: 28.5562, lng: 77.1000, timezone: "Asia/Kolkata", temperature: "28°C", weather: "Clear Sky", activeRunways: ["11/29", "10/28"] },
  { code: "BOM", name: "Chhatrapati Shivaji Maharaj", city: "Mumbai", country: "India", lat: 19.0896, lng: 72.8656, timezone: "Asia/Kolkata", temperature: "29°C", weather: "Partly Cloudy", activeRunways: ["09/27", "14/32"] },
  { code: "DXB", name: "Dubai International Airport", city: "Dubai", country: "UAE", lat: 25.2532, lng: 55.3657, timezone: "Asia/Dubai", temperature: "36°C", weather: "Sunny", activeRunways: ["12L/30R", "12R/30L"] },
  { code: "LHR", name: "London Heathrow", city: "London", country: "United Kingdom", lat: 51.4700, lng: -0.4543, timezone: "Europe/London", temperature: "19°C", weather: "Light Rain", activeRunways: ["09L/27R", "09R/27L"] },
  { code: "JFK", name: "John F. Kennedy International", city: "New York", country: "United States", lat: 40.6413, lng: -73.7781, timezone: "America/New_York", temperature: "22°C", weather: "Sunny", activeRunways: ["04L/22R", "13R/31L"] },
  { code: "CDG", name: "Charles de Gaulle Airport", city: "Paris", country: "France", lat: 49.0097, lng: 2.5479, timezone: "Europe/Paris", temperature: "21°C", weather: "Mild", activeRunways: ["08L/26R", "09L/27R"] },
  { code: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "Singapore", lat: 1.3644, lng: 103.9915, timezone: "Asia/Singapore", temperature: "31°C", weather: "Humid / Tropical", activeRunways: ["02L/20R", "02C/20C"] },
  { code: "HND", name: "Tokyo Haneda Airport", city: "Tokyo", country: "Japan", lat: 35.5494, lng: 139.7798, timezone: "Asia/Tokyo", temperature: "24°C", weather: "Clear", activeRunways: ["16R/34L", "05/23"] },
  { code: "MLE", name: "Velana International Airport", city: "Maldives", country: "Maldives", lat: 4.1918, lng: 73.5291, timezone: "Indian/Maldives", temperature: "30°C", weather: "Tropical Breeze", activeRunways: ["18/36"] },
];

export const INITIAL_FLIGHTS: FlightRecord[] = [
  {
    flightNumber: "SW204",
    origin: "DEL",
    originCity: "Delhi",
    destination: "BOM",
    destinationCity: "Mumbai",
    departureTime: "06:15",
    arrivalTime: "08:30",
    estimatedDepartureTime: "06:35",
    estimatedArrivalTime: "08:50",
    duration: "2h 15m",
    aircraft: "Boeing 787-9 Dreamliner",
    status: "Delayed",
    gate: "B14",
    originalGate: "A11",
    gateChanged: true,
    gateChangedAt: "2026-08-23T08:15:00Z",
    terminal: "T3",
    delayMinutes: 20,
    delayReason: "Late Inbound Turnaround & Baggage Transfer",
    priceEconomy: 5400,
    pricePremium: 8900,
    priceBusiness: 18500,
    priceFirst: 34000,
    seatsAvailable: { economy: 30, premium: 8, business: 4, first: 1 },
    onTimePct: 91,
    baggageCarousel: "Carousel 4",
    weatherOrigin: { temp: "28°C", condition: "Clear Sky" },
    weatherDest: { temp: "29°C", condition: "Partly Cloudy" },
    updatedAt: new Date().toISOString(),
  },
  {
    flightNumber: "SW811",
    origin: "BOM",
    originCity: "Mumbai",
    destination: "DXB",
    destinationCity: "Dubai",
    departureTime: "11:20",
    arrivalTime: "13:45",
    duration: "3h 25m",
    aircraft: "Airbus A350-1000",
    status: "On Time",
    gate: "C19",
    originalGate: "C19",
    gateChanged: false,
    terminal: "T2",
    delayMinutes: 0,
    priceEconomy: 14500,
    pricePremium: 26000,
    priceBusiness: 62000,
    priceFirst: 110000,
    seatsAvailable: { economy: 85, premium: 22, business: 12, first: 4 },
    onTimePct: 96,
    baggageCarousel: "Carousel 11",
    weatherOrigin: { temp: "29°C", condition: "Partly Cloudy" },
    weatherDest: { temp: "36°C", condition: "Sunny & Warm" },
    updatedAt: new Date().toISOString(),
  },
  {
    flightNumber: "SW904",
    origin: "BOM",
    originCity: "Mumbai",
    destination: "SIN",
    destinationCity: "Singapore",
    departureTime: "18:40",
    arrivalTime: "02:15",
    estimatedDepartureTime: "19:15",
    estimatedArrivalTime: "02:50",
    duration: "5h 35m",
    aircraft: "Boeing 777-300ER",
    status: "Delayed",
    gate: "D04",
    originalGate: "D12",
    gateChanged: true,
    gateChangedAt: "2026-08-23T07:45:00Z",
    terminal: "T2",
    delayMinutes: 35,
    delayReason: "Air Traffic Flow Control & En-route Monsoon Front",
    priceEconomy: 21500,
    pricePremium: 38000,
    priceBusiness: 84000,
    priceFirst: 160000,
    seatsAvailable: { economy: 42, premium: 14, business: 8, first: 2 },
    onTimePct: 88,
    baggageCarousel: "Carousel 7",
    weatherOrigin: { temp: "29°C", condition: "Partly Cloudy" },
    weatherDest: { temp: "31°C", condition: "Tropical Humid" },
    updatedAt: new Date().toISOString(),
  },
  {
    flightNumber: "SW310",
    origin: "BOM",
    originCity: "Mumbai",
    destination: "GOI",
    destinationCity: "Goa",
    departureTime: "09:30",
    arrivalTime: "10:45",
    duration: "1h 15m",
    aircraft: "Airbus A320neo",
    status: "Boarding",
    gate: "A08",
    originalGate: "A08",
    gateChanged: false,
    terminal: "T1",
    delayMinutes: 0,
    priceEconomy: 3800,
    pricePremium: 6200,
    priceBusiness: 12000,
    priceFirst: 22000,
    seatsAvailable: { economy: 18, premium: 6, business: 3, first: 1 },
    onTimePct: 94,
    baggageCarousel: "Carousel 2",
    weatherOrigin: { temp: "29°C", condition: "Partly Cloudy" },
    weatherDest: { temp: "30°C", condition: "Breezy Sun" },
    updatedAt: new Date().toISOString(),
  },
  {
    flightNumber: "SW105",
    origin: "DEL",
    originCity: "Delhi",
    destination: "BLR",
    destinationCity: "Bengaluru",
    departureTime: "14:15",
    arrivalTime: "17:05",
    duration: "2h 50m",
    aircraft: "Airbus A321neo",
    status: "On Time",
    gate: "B03",
    originalGate: "B03",
    gateChanged: false,
    terminal: "T3",
    delayMinutes: 0,
    priceEconomy: 6200,
    pricePremium: 9800,
    priceBusiness: 21000,
    priceFirst: 39000,
    seatsAvailable: { economy: 54, premium: 12, business: 6, first: 2 },
    onTimePct: 95,
    baggageCarousel: "Carousel 5",
    weatherOrigin: { temp: "28°C", condition: "Clear Sky" },
    weatherDest: { temp: "26°C", condition: "Pleasant & Clear" },
    updatedAt: new Date().toISOString(),
  },
  {
    flightNumber: "SW128",
    origin: "DEL",
    originCity: "Delhi",
    destination: "CDG",
    destinationCity: "Paris",
    departureTime: "07:40",
    arrivalTime: "14:20",
    duration: "8h 40m",
    aircraft: "Boeing 787-9 Dreamliner",
    status: "On Time",
    gate: "B12",
    originalGate: "B12",
    gateChanged: false,
    terminal: "T3",
    priceEconomy: 42900,
    pricePremium: 68500,
    priceBusiness: 145000,
    priceFirst: 290000,
    seatsAvailable: { economy: 42, premium: 14, business: 8, first: 2 },
    onTimePct: 94,
    baggageCarousel: "Carousel 4",
    weatherOrigin: { temp: "28°C", condition: "Clear Sky" },
    weatherDest: { temp: "21°C", condition: "Mild" },
    updatedAt: new Date().toISOString(),
  },
  {
    flightNumber: "SW502",
    origin: "DEL",
    originCity: "Delhi",
    destination: "LHR",
    destinationCity: "London",
    departureTime: "10:15",
    arrivalTime: "15:35",
    duration: "9h 20m",
    aircraft: "Airbus A350-1000",
    status: "Boarding",
    gate: "A4",
    originalGate: "A4",
    gateChanged: false,
    terminal: "T3",
    priceEconomy: 48900,
    pricePremium: 79200,
    priceBusiness: 168000,
    priceFirst: 320000,
    seatsAvailable: { economy: 18, premium: 6, business: 3, first: 1 },
    onTimePct: 91,
    baggageCarousel: "Carousel 7",
    weatherOrigin: { temp: "28°C", condition: "Clear Sky" },
    weatherDest: { temp: "19°C", condition: "Light Rain" },
    updatedAt: new Date().toISOString(),
  },
  {
    flightNumber: "SW340",
    origin: "DEL",
    originCity: "Delhi",
    destination: "DXB",
    destinationCity: "Dubai",
    departureTime: "14:00",
    arrivalTime: "16:30",
    duration: "3h 30m",
    aircraft: "Airbus A321neo",
    status: "In Air",
    gate: "D8",
    originalGate: "D8",
    gateChanged: false,
    terminal: "T3",
    priceEconomy: 12400,
    pricePremium: 22000,
    priceBusiness: 48000,
    priceFirst: 95000,
    seatsAvailable: { economy: 12, premium: 4, business: 2, first: 0 },
    onTimePct: 96,
    baggageCarousel: "Carousel 2",
    weatherOrigin: { temp: "28°C", condition: "Clear Sky" },
    weatherDest: { temp: "36°C", condition: "Sunny & Warm" },
    updatedAt: new Date().toISOString(),
  },
  {
    flightNumber: "SW720",
    origin: "DEL",
    originCity: "Delhi",
    destination: "SIN",
    destinationCity: "Singapore",
    departureTime: "22:50",
    arrivalTime: "06:45",
    duration: "5h 25m",
    aircraft: "Boeing 787-9 Dreamliner",
    status: "Scheduled",
    gate: "B06",
    originalGate: "B06",
    gateChanged: false,
    terminal: "T3",
    priceEconomy: 28500,
    pricePremium: 46000,
    priceBusiness: 89000,
    priceFirst: 175000,
    seatsAvailable: { economy: 56, premium: 18, business: 7, first: 3 },
    onTimePct: 92,
    baggageCarousel: "Carousel 5",
    weatherOrigin: { temp: "28°C", condition: "Clear Sky" },
    weatherDest: { temp: "31°C", condition: "Tropical Humid" },
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_BOOKINGS: BookingRecord[] = [
  {
    pnr: "SW9M2P",
    flightNumber: "SW128",
    passengerName: "Priya Sehrawat",
    passengerEmail: "sehrawatpriya430@gmail.com",
    passengerPhone: "+91 98765 43210",
    seat: "3A",
    cabinClass: "Business",
    isCheckedIn: true,
    boardingPassId: "BP-SW128-3A-9M2P",
    baggageCount: 2,
    specialAssistance: "None",
    mealPreference: "Asian Vegetarian",
    totalPaid: 145000,
    currency: "INR",
    bookingDate: "2026-08-15",
    status: "CHECKED_IN",
  },
  {
    pnr: "SW4K8L",
    flightNumber: "SW502",
    passengerName: "Rahul Sharma",
    passengerEmail: "rahul.sharma@example.com",
    passengerPhone: "+91 98111 22334",
    seat: "14C",
    cabinClass: "Economy",
    isCheckedIn: false,
    baggageCount: 1,
    mealPreference: "Standard Non-Veg",
    totalPaid: 48900,
    currency: "INR",
    bookingDate: "2026-08-18",
    status: "CONFIRMED",
  },
];

export const INITIAL_TICKETS: SupportTicketRecord[] = [
  {
    id: "TCK-8921",
    passengerEmail: "sehrawatpriya430@gmail.com",
    passengerName: "Priya Sehrawat",
    pnr: "SW9M2P",
    category: "Special Assistance",
    subject: "Lounge access confirmation & boarding gate assistance",
    status: "Resolved",
    priority: "Medium",
    createdAt: "2026-08-20T10:30:00Z",
    messages: [
      {
        sender: "passenger",
        senderName: "Priya Sehrawat",
        text: "Hi, I have booked Business class on SW128. Is lounge access available at Terminal 3 Delhi?",
        timestamp: "2026-08-20T10:30:00Z",
      },
      {
        sender: "agent",
        senderName: "SkyWay Concierge Team",
        text: "Hello Priya, yes! You have complimentary access to the SkyWay Silver Lining Lounge at T3 (Mezzanine Level near Gate B10).",
        timestamp: "2026-08-20T10:35:00Z",
      },
    ],
  },
];

export const INITIAL_FEEDBACK: FeedbackRecord[] = [
  {
    id: "fb-101",
    pnr: "SW6T1Q",
    flightNumber: "SW-501",
    passengerName: "Priya Sehrawat",
    passengerEmail: "sehrawatpriya430@gmail.com",
    overallRating: 5,
    flightCrewRating: 5,
    cabinCleanlinessRating: 5,
    foodBeverageRating: 4,
    punctualityRating: 5,
    recommendAirline: true,
    comments: "Superb Boeing 787 flight from Bengaluru to Delhi. Cabin crew was remarkably attentive, and takeoff was right on schedule!",
    highlightTags: ["Smooth Landing", "Attentive Crew", "Quiet Cabin", "On-Time Arrival"],
    followUpRequested: false,
    createdAt: "2026-05-12T14:30:00Z",
  },
  {
    id: "fb-102",
    pnr: "SW3H7L",
    flightNumber: "SW-118",
    passengerName: "Priya Sehrawat",
    passengerEmail: "sehrawatpriya430@gmail.com",
    overallRating: 4,
    flightCrewRating: 5,
    cabinCleanlinessRating: 4,
    foodBeverageRating: 4,
    punctualityRating: 4,
    recommendAirline: true,
    comments: "Great morning flight to Goa. Smooth boarding process and friendly staff at Delhi Terminal 3.",
    highlightTags: ["Friendly Staff", "Clean Cabin", "Comfortable Seats"],
    followUpRequested: false,
    createdAt: "2026-04-02T11:45:00Z",
  },
];

// Runtime store instance
class BackendStore {
  airports = [...AIRPORTS];
  flights = [...INITIAL_FLIGHTS];
  bookings = [...INITIAL_BOOKINGS];
  tickets = [...INITIAL_TICKETS];
  feedback = [...INITIAL_FEEDBACK];

  getFlight(flightNumber: string) {
    const clean = flightNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    return this.flights.find((f) => f.flightNumber.toUpperCase() === clean);
  }

  getBooking(pnr: string) {
    const clean = pnr.trim().toUpperCase();
    return this.bookings.find((b) => b.pnr === clean);
  }

  addBooking(booking: BookingRecord) {
    this.bookings.unshift(booking);
    return booking;
  }

  updateBooking(pnr: string, updates: Partial<BookingRecord>) {
    const idx = this.bookings.findIndex((b) => b.pnr === pnr.toUpperCase());
    if (idx === -1) return null;
    this.bookings[idx] = { ...this.bookings[idx], ...updates };
    return this.bookings[idx];
  }

  addTicket(ticket: SupportTicketRecord) {
    this.tickets.unshift(ticket);
    return ticket;
  }

  addFeedback(item: FeedbackRecord) {
    this.feedback.unshift(item);
    return item;
  }

  getFeedbackByEmail(email: string) {
    return this.feedback.filter(
      (f) => f.passengerEmail.toLowerCase() === email.toLowerCase()
    );
  }

  getFeedbackByPnr(pnr: string) {
    return this.feedback.find(
      (f) => f.pnr?.toUpperCase() === pnr.trim().toUpperCase()
    );
  }

  updateFlight(flightNumber: string, updates: Partial<FlightRecord>) {
    const clean = flightNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const idx = this.flights.findIndex(
      (f) => f.flightNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase() === clean
    );
    if (idx === -1) return null;
    
    // If gate is updated, record original gate and gate changed flag
    if (updates.gate && updates.gate !== this.flights[idx].gate) {
      if (!this.flights[idx].originalGate) {
        updates.originalGate = this.flights[idx].gate;
      }
      updates.gateChanged = true;
      updates.gateChangedAt = new Date().toISOString();
    }

    this.flights[idx] = {
      ...this.flights[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.flights[idx];
  }

  getRealtimeFlights(flightNumbers?: string[]) {
    if (!flightNumbers || flightNumbers.length === 0) {
      return this.flights;
    }
    const cleanList = flightNumbers.map((fn) => fn.replace(/[^A-Za-z0-9]/g, "").toUpperCase());
    return this.flights.filter((f) => {
      const cleanFn = f.flightNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      return cleanList.includes(cleanFn);
    });
  }
}

export const store = new BackendStore();
