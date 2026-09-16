export interface AmenityPoint {
  id: string;
  name: string;
  category: "security" | "gate" | "lounge" | "dining" | "shopping" | "service" | "restroom" | "water_power" | "medical";
  subcategory?: string;
  x: number;
  y: number;
  level: number; // 1 = Arrivals, 2 = Mezzanine/Lounge, 3 = Departures
  terminalId: string;
  gateNumber?: string;
  flightCode?: string;
  destination?: string;
  status?: "open" | "boarding" | "final_call" | "closed" | "delayed";
  waitTimeMin?: number; // for security / queue
  rating?: number;
  priceRange?: "$" | "$$" | "$$$" | "$$$$";
  openingHours?: string;
  description: string;
  tags: string[];
  icon: string;
  accessible: boolean;
  nearGate?: string;
}

export interface MapConcourse {
  id: string;
  name: string;
  level: number;
  polygon: [number, number][]; // coordinates for building boundary
  walkways?: [number, number][][]; // travelator / main corridors
}

export interface SecurityLane {
  id: string;
  name: string;
  type: "general" | "fast_track" | "digiyatra" | "crew_family";
  x: number;
  y: number;
  level: number;
  currentWaitMin: number;
  status: "smooth" | "moderate" | "busy";
  openLanes: number;
  totalLanes: number;
}

export interface NavigationNode {
  id: string;
  x: number;
  y: number;
  level: number;
  neighbors: string[]; // Connected node IDs
  isElevator?: boolean;
  isEscalator?: boolean;
}

export interface AirportTerminalConfig {
  id: string;
  airportCode: string;
  airportName: string;
  city: string;
  country: string;
  terminalName: string;
  levels: { level: number; name: string; description: string }[];
  defaultLevel: number;
  viewBox: { width: number; height: number };
  concourses: MapConcourse[];
  securityLanes: SecurityLane[];
  nodes: NavigationNode[];
  amenities: AmenityPoint[];
  myFlight?: {
    flightNumber: string;
    pnr: string;
    gate: string;
    terminal: string;
    depTime: string;
    boardingTime: string;
    route: string;
    status: string;
  };
}

// --------------------------------------------------------------------------------------
// 1. DEL T3 - Indira Gandhi International Airport Terminal 3
// --------------------------------------------------------------------------------------
export const DEL_T3_DATA: AirportTerminalConfig = {
  id: "DEL-T3",
  airportCode: "DEL",
  airportName: "Indira Gandhi International Airport",
  city: "New Delhi",
  country: "India",
  terminalName: "Terminal 3 (Domestic & International)",
  defaultLevel: 3,
  levels: [
    { level: 3, name: "Level 3 · Departures", description: "Security, Boarding Gates A1–C24, Duty Free & Food Court" },
    { level: 2, name: "Level 2 · Lounges & Wellness", description: "Encalm Privé, SkyLounge, Spa & Transit Hotel" },
    { level: 1, name: "Level 1 · Arrivals", description: "Baggage Belts 1–14, Customs, Forex & Cabs / Metro" },
  ],
  viewBox: { width: 1200, height: 800 },
  myFlight: {
    flightNumber: "SW-218",
    pnr: "SW8X4K",
    gate: "14A",
    terminal: "DEL T3",
    depTime: "08:30 IST",
    boardingTime: "08:00 IST",
    route: "DEL → BOM",
    status: "On Time",
  },
  concourses: [
    // Main Central Hall / Atrium
    {
      id: "central-hub",
      name: "Central Atrium & Duty Free Plaza",
      level: 3,
      polygon: [
        [350, 260],
        [850, 260],
        [850, 520],
        [350, 520],
      ],
    },
    // Pier A (Left Wing - Domestic Gates A1 - A12)
    {
      id: "pier-a",
      name: "Concourse A (Gates A1–A12)",
      level: 3,
      polygon: [
        [350, 320],
        [100, 320],
        [100, 460],
        [350, 460],
      ],
    },
    // Pier B (Center North Wing - Domestic/Intl Flex Gates B1 - B18)
    {
      id: "pier-b",
      name: "Concourse B (Gates B1–B18 & 14A)",
      level: 3,
      polygon: [
        [520, 260],
        [520, 80],
        [680, 80],
        [680, 260],
      ],
    },
    // Pier C (Right Wing - International Gates C1 - C16)
    {
      id: "pier-c",
      name: "Concourse C (Gates C1–C16)",
      level: 3,
      polygon: [
        [850, 320],
        [1100, 320],
        [1100, 460],
        [850, 460],
      ],
    },
    // Forecourt & Check-in zone
    {
      id: "checkin-zone",
      name: "Check-in Hall & Security Entrance",
      level: 3,
      polygon: [
        [350, 520],
        [850, 520],
        [850, 720],
        [350, 720],
      ],
    },
  ],
  securityLanes: [
    {
      id: "sec-digiyatra",
      name: "DigiYatra Smart Biometric E-Gate",
      type: "digiyatra",
      x: 480,
      y: 535,
      level: 3,
      currentWaitMin: 3,
      status: "smooth",
      openLanes: 6,
      totalLanes: 6,
    },
    {
      id: "sec-fasttrack",
      name: "Business & SkyWay Gold FastTrack",
      type: "fast_track",
      x: 550,
      y: 535,
      level: 3,
      currentWaitMin: 5,
      status: "smooth",
      openLanes: 4,
      totalLanes: 4,
    },
    {
      id: "sec-general-dom",
      name: "General Security Checkpoint (Lanes 1–12)",
      type: "general",
      x: 640,
      y: 535,
      level: 3,
      currentWaitMin: 14,
      status: "moderate",
      openLanes: 10,
      totalLanes: 12,
    },
    {
      id: "sec-crew-fam",
      name: "Family & Special Assistance Lane",
      type: "crew_family",
      x: 730,
      y: 535,
      level: 3,
      currentWaitMin: 6,
      status: "smooth",
      openLanes: 2,
      totalLanes: 2,
    },
  ],
  nodes: [
    // Entrance & Check-in
    { id: "n-entrance-1", x: 450, y: 680, level: 3, neighbors: ["n-checkin-c1", "n-checkin-c2"] },
    { id: "n-entrance-2", x: 600, y: 680, level: 3, neighbors: ["n-checkin-c2", "n-checkin-c3"] },
    { id: "n-entrance-3", x: 750, y: 680, level: 3, neighbors: ["n-checkin-c3", "n-checkin-c4"] },
    { id: "n-checkin-c1", x: 450, y: 610, level: 3, neighbors: ["n-entrance-1", "n-sec-digi"] },
    { id: "n-checkin-c2", x: 550, y: 610, level: 3, neighbors: ["n-entrance-2", "n-sec-fast", "n-sec-digi"] },
    { id: "n-checkin-c3", x: 650, y: 610, level: 3, neighbors: ["n-entrance-2", "n-sec-gen"] },
    { id: "n-checkin-c4", x: 750, y: 610, level: 3, neighbors: ["n-entrance-3", "n-sec-fam"] },

    // Security outputs into Central Atrium
    { id: "n-sec-digi", x: 480, y: 530, level: 3, neighbors: ["n-checkin-c1", "n-atrium-south"] },
    { id: "n-sec-fast", x: 550, y: 530, level: 3, neighbors: ["n-checkin-c2", "n-atrium-south"] },
    { id: "n-sec-gen", x: 640, y: 530, level: 3, neighbors: ["n-checkin-c3", "n-atrium-south"] },
    { id: "n-sec-fam", x: 730, y: 530, level: 3, neighbors: ["n-checkin-c4", "n-atrium-south"] },

    // Central Atrium Waypoints
    { id: "n-atrium-south", x: 600, y: 480, level: 3, neighbors: ["n-sec-digi", "n-sec-fast", "n-sec-gen", "n-sec-fam", "n-atrium-center"] },
    { id: "n-atrium-center", x: 600, y: 390, level: 3, neighbors: ["n-atrium-south", "n-atrium-north", "n-pier-a-root", "n-pier-c-root", "n-lounge-lift"] },
    { id: "n-atrium-north", x: 600, y: 280, level: 3, neighbors: ["n-atrium-center", "n-pier-b-root"] },
    { id: "n-lounge-lift", x: 690, y: 370, level: 3, isElevator: true, neighbors: ["n-atrium-center"] },

    // Pier A (Left Concourse)
    { id: "n-pier-a-root", x: 380, y: 390, level: 3, neighbors: ["n-atrium-center", "n-pier-a-mid"] },
    { id: "n-pier-a-mid", x: 260, y: 390, level: 3, neighbors: ["n-pier-a-root", "n-pier-a-end", "n-gate-a1", "n-gate-a2", "n-gate-a3", "n-gate-a4"] },
    { id: "n-pier-a-end", x: 140, y: 390, level: 3, neighbors: ["n-pier-a-mid", "n-gate-a5", "n-gate-a6", "n-gate-a7", "n-gate-a8"] },

    // Pier B (Center Concourse - includes Gate 14A)
    { id: "n-pier-b-root", x: 600, y: 240, level: 3, neighbors: ["n-atrium-north", "n-pier-b-mid"] },
    { id: "n-pier-b-mid", x: 600, y: 160, level: 3, neighbors: ["n-pier-b-root", "n-pier-b-end", "n-gate-b1", "n-gate-b2", "n-gate-14a", "n-gate-b4"] },
    { id: "n-pier-b-end", x: 600, y: 100, level: 3, neighbors: ["n-pier-b-mid", "n-gate-b5", "n-gate-b6", "n-gate-b7", "n-gate-b8"] },

    // Pier C (Right Concourse)
    { id: "n-pier-c-root", x: 820, y: 390, level: 3, neighbors: ["n-atrium-center", "n-pier-c-mid"] },
    { id: "n-pier-c-mid", x: 940, y: 390, level: 3, neighbors: ["n-pier-c-root", "n-pier-c-end", "n-gate-c1", "n-gate-c2", "n-gate-c3", "n-gate-c4"] },
    { id: "n-pier-c-end", x: 1060, y: 390, level: 3, neighbors: ["n-pier-c-mid", "n-gate-c5", "n-gate-c6", "n-gate-c7", "n-gate-c8"] },

    // Direct Gate Target Nodes
    { id: "n-gate-14a", x: 660, y: 160, level: 3, neighbors: ["n-pier-b-mid"] },
    { id: "n-gate-b1", x: 540, y: 200, level: 3, neighbors: ["n-pier-b-mid"] },
    { id: "n-gate-b2", x: 660, y: 200, level: 3, neighbors: ["n-pier-b-mid"] },
    { id: "n-gate-b4", x: 540, y: 160, level: 3, neighbors: ["n-pier-b-mid"] },
    { id: "n-gate-b5", x: 540, y: 100, level: 3, neighbors: ["n-pier-b-end"] },
    { id: "n-gate-b6", x: 660, y: 100, level: 3, neighbors: ["n-pier-b-end"] },
    { id: "n-gate-b7", x: 600, y: 70, level: 3, neighbors: ["n-pier-b-end"] },

    { id: "n-gate-a1", x: 300, y: 340, level: 3, neighbors: ["n-pier-a-mid"] },
    { id: "n-gate-a2", x: 300, y: 440, level: 3, neighbors: ["n-pier-a-mid"] },
    { id: "n-gate-a3", x: 220, y: 340, level: 3, neighbors: ["n-pier-a-mid"] },
    { id: "n-gate-a4", x: 220, y: 440, level: 3, neighbors: ["n-pier-a-mid"] },
    { id: "n-gate-a5", x: 140, y: 340, level: 3, neighbors: ["n-pier-a-end"] },
    { id: "n-gate-a6", x: 140, y: 440, level: 3, neighbors: ["n-pier-a-end"] },

    { id: "n-gate-c1", x: 900, y: 340, level: 3, neighbors: ["n-pier-c-mid"] },
    { id: "n-gate-c2", x: 900, y: 440, level: 3, neighbors: ["n-pier-c-mid"] },
    { id: "n-gate-c3", x: 980, y: 340, level: 3, neighbors: ["n-pier-c-mid"] },
    { id: "n-gate-c4", x: 980, y: 440, level: 3, neighbors: ["n-pier-c-mid"] },
    { id: "n-gate-c5", x: 1060, y: 340, level: 3, neighbors: ["n-pier-c-end"] },
    { id: "n-gate-c6", x: 1060, y: 440, level: 3, neighbors: ["n-pier-c-end"] },
  ],
  amenities: [
    // ASSIGNED FLIGHT GATE (14A)
    {
      id: "gate-14a",
      name: "Gate 14A · Flight SW-218 to Mumbai (BOM)",
      category: "gate",
      gateNumber: "14A",
      flightCode: "SW-218",
      destination: "Mumbai (BOM)",
      status: "boarding",
      x: 660,
      y: 160,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "14A",
      description: "Primary jet bridge gate for your scheduled SkyWay flight. Boarding priority: Groups 1 & 2.",
      tags: ["My Gate", "Boarding", "A321", "SkyWay SW-218", "Window Seat 14A"],
      icon: "✈️",
      accessible: true,
      openingHours: "Open now · Boarding starts 08:00 IST",
    },
    // Other Gates in Pier B
    {
      id: "gate-b1",
      name: "Gate B1",
      category: "gate",
      gateNumber: "B1",
      status: "open",
      x: 540,
      y: 200,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "B1",
      description: "Domestic departure gate for Airbus A320 fleet.",
      tags: ["Domestic", "Jet Bridge"],
      icon: "🚪",
      accessible: true,
    },
    {
      id: "gate-b2",
      name: "Gate B2",
      category: "gate",
      gateNumber: "B2",
      status: "open",
      x: 660,
      y: 200,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "B2",
      description: "Domestic departure gate with charging counters.",
      tags: ["Domestic"],
      icon: "🚪",
      accessible: true,
    },
    {
      id: "gate-b4",
      name: "Gate B4",
      category: "gate",
      gateNumber: "B4",
      status: "open",
      x: 540,
      y: 160,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "B4",
      description: "Domestic departures gate.",
      tags: ["Domestic"],
      icon: "🚪",
      accessible: true,
    },
    {
      id: "gate-b5",
      name: "Gate B5",
      category: "gate",
      gateNumber: "B5",
      status: "open",
      x: 540,
      y: 100,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "B5",
      description: "End of Pier B departure gate.",
      tags: ["Domestic"],
      icon: "🚪",
      accessible: true,
    },
    {
      id: "gate-b6",
      name: "Gate B6",
      category: "gate",
      gateNumber: "B6",
      status: "open",
      x: 660,
      y: 100,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "B6",
      description: "Wide-body capable departure gate.",
      tags: ["Flex Gate"],
      icon: "🚪",
      accessible: true,
    },

    // Pier A Gates
    {
      id: "gate-a1",
      name: "Gate A1",
      category: "gate",
      gateNumber: "A1",
      status: "open",
      x: 300,
      y: 340,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "A1",
      description: "West Wing domestic departure gate.",
      tags: ["Domestic"],
      icon: "🚪",
      accessible: true,
    },
    {
      id: "gate-a2",
      name: "Gate A2",
      category: "gate",
      gateNumber: "A2",
      status: "open",
      x: 300,
      y: 440,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "A2",
      description: "West Wing domestic departure gate.",
      tags: ["Domestic"],
      icon: "🚪",
      accessible: true,
    },
    {
      id: "gate-a3",
      name: "Gate A3",
      category: "gate",
      gateNumber: "A3",
      status: "open",
      x: 220,
      y: 340,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "A3",
      description: "West Wing domestic departure gate.",
      tags: ["Domestic"],
      icon: "🚪",
      accessible: true,
    },
    {
      id: "gate-a4",
      name: "Gate A4",
      category: "gate",
      gateNumber: "A4",
      status: "open",
      x: 220,
      y: 440,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "A4",
      description: "West Wing domestic departure gate.",
      tags: ["Domestic"],
      icon: "🚪",
      accessible: true,
    },
    {
      id: "gate-a5",
      name: "Gate A5",
      category: "gate",
      gateNumber: "A5",
      status: "open",
      x: 140,
      y: 340,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "A5",
      description: "Pier A bus gate access.",
      tags: ["Bus Gate"],
      icon: "🚪",
      accessible: true,
    },
    {
      id: "gate-a6",
      name: "Gate A6",
      category: "gate",
      gateNumber: "A6",
      status: "open",
      x: 140,
      y: 440,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "A6",
      description: "Pier A bus gate access.",
      tags: ["Bus Gate"],
      icon: "🚪",
      accessible: true,
    },

    // Pier C Gates (International)
    {
      id: "gate-c1",
      name: "Gate C1",
      category: "gate",
      gateNumber: "C1",
      status: "open",
      x: 900,
      y: 340,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "C1",
      description: "International departures wing gate.",
      tags: ["International"],
      icon: "🚪",
      accessible: true,
    },
    {
      id: "gate-c2",
      name: "Gate C2",
      category: "gate",
      gateNumber: "C2",
      status: "open",
      x: 900,
      y: 440,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "C2",
      description: "International departures wing gate.",
      tags: ["International"],
      icon: "🚪",
      accessible: true,
    },
    {
      id: "gate-c3",
      name: "Gate C3",
      category: "gate",
      gateNumber: "C3",
      status: "open",
      x: 980,
      y: 340,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "C3",
      description: "International widebody boarding gate.",
      tags: ["International"],
      icon: "🚪",
      accessible: true,
    },
    {
      id: "gate-c4",
      name: "Gate C4",
      category: "gate",
      gateNumber: "C4",
      status: "open",
      x: 980,
      y: 440,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "C4",
      description: "International widebody boarding gate.",
      tags: ["International"],
      icon: "🚪",
      accessible: true,
    },

    // SECURITY CHECKPOINTS
    {
      id: "amenity-sec-digi",
      name: "DigiYatra E-Gate Security (Fastest)",
      category: "security",
      x: 480,
      y: 535,
      level: 3,
      terminalId: "DEL-T3",
      waitTimeMin: 3,
      description: "Facial recognition contactless security lane. Valid for DigiYatra registered passengers.",
      tags: ["Fastest Lane", "Biometric", "Self-Service", "3 min wait"],
      icon: "⚡",
      accessible: true,
      openingHours: "Open 24/7",
    },
    {
      id: "amenity-sec-fasttrack",
      name: "SkyWay Gold & Business FastTrack",
      category: "security",
      x: 550,
      y: 535,
      level: 3,
      terminalId: "DEL-T3",
      waitTimeMin: 5,
      description: "Dedicated express security lane for SkyWay Gold, Platinum, and Business Class flyers.",
      tags: ["Priority", "SkyWay Gold", "Business Class", "5 min wait"],
      icon: "⭐",
      accessible: true,
      openingHours: "Open 24/7",
    },
    {
      id: "amenity-sec-gen",
      name: "Main Security Checkpoint A",
      category: "security",
      x: 640,
      y: 535,
      level: 3,
      terminalId: "DEL-T3",
      waitTimeMin: 14,
      description: "General passenger screening area with 12 automated tray return security lanes.",
      tags: ["General Security", "14 min wait"],
      icon: "🛡️",
      accessible: true,
      openingHours: "Open 24/7",
    },

    // LOUNGES
    {
      id: "lounge-skyway-club",
      name: "SkyWay Premium Lounge (Level 2/3)",
      category: "lounge",
      x: 710,
      y: 350,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "14A / Atrium",
      rating: 4.8,
      priceRange: "$$$",
      description: "Complimentary access for Gold & Platinum members. Features private sleeping pods, hot buffet, showers, bar, and high-speed Wi-Fi.",
      tags: ["Gold Access", "Showers", "Buffet", "Cocktails", "Quiet Zone"],
      icon: "👑",
      accessible: true,
      openingHours: "24 Hours Open",
    },
    {
      id: "lounge-encalm",
      name: "Encalm Privé Lounge",
      category: "lounge",
      x: 510,
      y: 350,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "Atrium / Pier A",
      rating: 4.7,
      priceRange: "$$$$",
      description: "Ultra-luxury international transit lounge with à la carte fine dining, cigar lounge, and spa.",
      tags: ["Priority Pass", "Fine Dining", "Spa", "Showers"],
      icon: "🍷",
      accessible: true,
      openingHours: "24 Hours Open",
    },

    // DINING & CAFES
    {
      id: "food-starbucks-central",
      name: "Starbucks Coffee",
      category: "dining",
      subcategory: "Cafe",
      x: 560,
      y: 420,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "Central Atrium",
      rating: 4.6,
      priceRange: "$$",
      description: "Freshly brewed espresso, cold brews, sandwiches, and travel mugs. Power outlets available at bar seats.",
      tags: ["Coffee", "Pastries", "Free Wi-Fi", "Charging Ports"],
      icon: "☕",
      accessible: true,
      openingHours: "24 Hours Open",
    },
    {
      id: "food-punjab-grill",
      name: "Punjab Grill & Chai Point",
      category: "dining",
      subcategory: "Indian / Fast Casual",
      x: 640,
      y: 420,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "Central Atrium",
      rating: 4.7,
      priceRange: "$$",
      description: "Authentic North Indian curries, kebabs, parathas, biryani, and artisanal masala chai.",
      tags: ["Vegetarian Friendly", "Hot Meals", "Biryani", "Chai"],
      icon: "🍛",
      accessible: true,
      openingHours: "05:00 – 01:00 IST",
    },
    {
      id: "food-subway-b",
      name: "Subway & Fresh Juice Express",
      category: "dining",
      subcategory: "Grab & Go",
      x: 560,
      y: 180,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "14A / B2",
      rating: 4.3,
      priceRange: "$",
      description: "Quick fresh subs, wraps, salads, and seasonal juices right opposite Gate 14A.",
      tags: ["Quick Bite", "Grab & Go", "Healthy", "Opposite Gate 14A"],
      icon: "🥪",
      accessible: true,
      openingHours: "24 Hours Open",
    },
    {
      id: "food-costa-pier-c",
      name: "Costa Coffee & Bakery",
      category: "dining",
      subcategory: "Cafe",
      x: 920,
      y: 400,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "C2",
      rating: 4.4,
      priceRange: "$$",
      description: "British roast coffees, croissants, and artisan tea.",
      tags: ["Coffee", "Bakery"],
      icon: "🥐",
      accessible: true,
      openingHours: "24 Hours Open",
    },

    // SHOPPING & DUTY FREE
    {
      id: "shop-duty-free",
      name: "Delhi Duty Free Grand Plaza",
      category: "shopping",
      x: 600,
      y: 330,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "Post-Security Central Atrium",
      rating: 4.8,
      priceRange: "$$$",
      description: "Perfumes, luxury cosmetics, single malts, chocolates, and electronics at duty-free prices.",
      tags: ["Duty Free", "Perfumes", "Liquor", "Chocolates", "Tax Free"],
      icon: "🛍️",
      accessible: true,
      openingHours: "24 Hours Open",
    },
    {
      id: "shop-croma-apple",
      name: "Croma Tech & Apple Authorized Reseller",
      category: "shopping",
      x: 460,
      y: 390,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "Pier A Entrance",
      rating: 4.5,
      priceRange: "$$$",
      description: "Noise-cancelling headphones (Bose, Sony, AirPods), power banks, international travel adapters, and cables.",
      tags: ["Electronics", "Headphones", "Adapters", "Powerbanks"],
      icon: "🎧",
      accessible: true,
      openingHours: "06:00 – 00:00 IST",
    },
    {
      id: "shop-relay-books",
      name: "Relay Books, Travel Essentials & Pharmacy",
      category: "shopping",
      x: 620,
      y: 190,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "14A",
      rating: 4.5,
      priceRange: "$",
      description: "Bestseller novels, travel pillows, magazines, snacks, and OTC medicines 30 seconds from Gate 14A.",
      tags: ["Books", "Travel Pillow", "Snacks", "Near Gate 14A"],
      icon: "📚",
      accessible: true,
      openingHours: "24 Hours Open",
    },

    // ESSENTIAL SERVICES & RESTROOMS
    {
      id: "svc-restroom-atrium",
      name: "Restroom Complex (Men, Women, Accessible & Baby Care)",
      category: "restroom",
      x: 440,
      y: 470,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "Post-Security Left",
      description: "Touchless sanitary facilities with infant feeding cubicle, wheelchair stall, and vanity mirrors.",
      tags: ["Wheelchair WC", "Baby Care", "Sanitizer", "Touchless"],
      icon: "🚻",
      accessible: true,
      openingHours: "24 Hours Open",
    },
    {
      id: "svc-restroom-pier-b",
      name: "Restroom & Mother Care (Pier B)",
      category: "restroom",
      x: 620,
      y: 140,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "14A / B4",
      description: "Clean restroom located 45 seconds from Gate 14A with wheelchair accessible stall.",
      tags: ["Near Gate 14A", "Accessible", "Baby Changing"],
      icon: "🚻",
      accessible: true,
      openingHours: "24 Hours Open",
    },
    {
      id: "svc-water-power-b",
      name: "Hydration RO Station & 65W Fast Charger Hub",
      category: "water_power",
      x: 580,
      y: 150,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "14A",
      description: "Free UV purified chilled/ambient drinking water refill point and multi-port USB-C fast charging bar.",
      tags: ["Free Water", "Bottle Refill", "USB-C Fast Charging", "Free Power"],
      icon: "💧",
      accessible: true,
      openingHours: "24 Hours Open",
    },
    {
      id: "svc-water-power-atrium",
      name: "Hydration Station & Device Charging Bar",
      category: "water_power",
      x: 670,
      y: 450,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "Central Atrium",
      description: "Purified water refill and 100W wireless phone charging pads.",
      tags: ["Free Water", "Wireless Charging"],
      icon: "🔋",
      accessible: true,
      openingHours: "24 Hours Open",
    },
    {
      id: "svc-medical-firstaid",
      name: "Medanta 24/7 Airport Medical Center & Pharmacy",
      category: "medical",
      x: 780,
      y: 470,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "Post-Security Right",
      description: "Fully staffed medical trauma room, emergency triage, doctor on call, and pharmacy.",
      tags: ["Doctor on Call", "First Aid", "Pharmacy", "Emergency"],
      icon: "🩺",
      accessible: true,
      openingHours: "24 Hours Open",
    },
    {
      id: "svc-prayer-room",
      name: "Multi-Faith Prayer Room & Meditation Hall",
      category: "service",
      x: 280,
      y: 440,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "Pier A (Gate A2)",
      description: "Quiet interfaith prayer and reflection room with ablution areas.",
      tags: ["Quiet Room", "Prayer", "Meditation"],
      icon: "🕊️",
      accessible: true,
      openingHours: "24 Hours Open",
    },
    {
      id: "svc-smoking-pier-b",
      name: "Enclosed Smoking Lounge with Air Filtration",
      category: "service",
      x: 540,
      y: 80,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "Gate B5",
      description: "Ventilated smoking room with negative pressure air filters.",
      tags: ["Smoking", "Ventilated"],
      icon: "🚬",
      accessible: true,
      openingHours: "24 Hours Open",
    },
    {
      id: "svc-atm-forex",
      name: "HDFC / SBI ATMs & Thomas Cook Forex",
      category: "service",
      x: 470,
      y: 640,
      level: 3,
      terminalId: "DEL-T3",
      nearGate: "Check-in Hall",
      description: "Multi-currency ATMs, cash withdrawal, currency exchange, and travel card loading.",
      tags: ["ATM", "Forex", "Currency Exchange"],
      icon: "🏧",
      accessible: true,
      openingHours: "24 Hours Open",
    },
  ],
};

// --------------------------------------------------------------------------------------
// 2. BOM T2 - Chhatrapati Shivaji Maharaj International Airport Terminal 2
// --------------------------------------------------------------------------------------
export const BOM_T2_DATA: AirportTerminalConfig = {
  id: "BOM-T2",
  airportCode: "BOM",
  airportName: "Chhatrapati Shivaji Maharaj International Airport",
  city: "Mumbai",
  country: "India",
  terminalName: "Terminal 2 (Jaya He Pavilion)",
  defaultLevel: 4,
  levels: [
    { level: 4, name: "Level 4 · Departures & Gates", description: "Security, Jaya He Art Wall, Gates 40–88, Duty Free" },
    { level: 3, name: "Level 3 · Lounges & Mezzanine", description: "Adani Lounge, Pranaam VIP, Spa & Fine Dining" },
    { level: 2, name: "Level 2 · Arrivals & Customs", description: "Baggage Claim Belts 1–12, Transfers & Forex" },
    { level: 1, name: "Level 1 · Ground Transport", description: "Pre-paid Taxis, Rideshare, Metro & Buses" },
  ],
  viewBox: { width: 1200, height: 800 },
  myFlight: {
    flightNumber: "SW-811",
    pnr: "SW9M2P",
    gate: "C12",
    terminal: "BOM T2",
    depTime: "22:15 IST",
    boardingTime: "21:45 IST",
    route: "BOM → DXB",
    status: "On Time",
  },
  concourses: [
    {
      id: "bom-central-hub",
      name: "Jaya He Art Wall & Central Concourse",
      level: 4,
      polygon: [
        [380, 260],
        [820, 260],
        [820, 520],
        [380, 520],
      ],
    },
    {
      id: "bom-concourse-c",
      name: "Concourse C (Gates C10–C24 & C12)",
      level: 4,
      polygon: [
        [530, 260],
        [530, 80],
        [670, 80],
        [670, 260],
      ],
    },
    {
      id: "bom-concourse-d",
      name: "Concourse D (Domestic West Gates 41–55)",
      level: 4,
      polygon: [
        [380, 320],
        [120, 320],
        [120, 460],
        [380, 460],
      ],
    },
    {
      id: "bom-concourse-e",
      name: "Concourse E (International East Gates 65–85)",
      level: 4,
      polygon: [
        [820, 320],
        [1080, 320],
        [1080, 460],
        [820, 460],
      ],
    },
    {
      id: "bom-checkin",
      name: "Departure Forecourt & Check-in Islands",
      level: 4,
      polygon: [
        [380, 520],
        [820, 520],
        [820, 720],
        [380, 720],
      ],
    },
  ],
  securityLanes: [
    {
      id: "bom-sec-digi",
      name: "DigiYatra Biometric Gate (Counters 1–4)",
      type: "digiyatra",
      x: 490,
      y: 535,
      level: 4,
      currentWaitMin: 4,
      status: "smooth",
      openLanes: 4,
      totalLanes: 4,
    },
    {
      id: "bom-sec-fast",
      name: "First / Business & Gold Priority Security",
      type: "fast_track",
      x: 560,
      y: 535,
      level: 4,
      currentWaitMin: 6,
      status: "smooth",
      openLanes: 3,
      totalLanes: 3,
    },
    {
      id: "bom-sec-gen",
      name: "Main Security Hall (Lanes 5–18)",
      type: "general",
      x: 650,
      y: 535,
      level: 4,
      currentWaitMin: 18,
      status: "busy",
      openLanes: 10,
      totalLanes: 14,
    },
  ],
  nodes: [
    { id: "bn-entrance", x: 600, y: 680, level: 4, neighbors: ["bn-checkin-mid"] },
    { id: "bn-checkin-mid", x: 600, y: 610, level: 4, neighbors: ["bn-entrance", "bn-sec-digi", "bn-sec-fast", "bn-sec-gen"] },
    { id: "bn-sec-digi", x: 490, y: 530, level: 4, neighbors: ["bn-checkin-mid", "bn-atrium-south"] },
    { id: "bn-sec-fast", x: 560, y: 530, level: 4, neighbors: ["bn-checkin-mid", "bn-atrium-south"] },
    { id: "bn-sec-gen", x: 650, y: 530, level: 4, neighbors: ["bn-checkin-mid", "bn-atrium-south"] },
    { id: "bn-atrium-south", x: 600, y: 480, level: 4, neighbors: ["bn-sec-digi", "bn-sec-fast", "bn-sec-gen", "bn-atrium-center"] },
    { id: "bn-atrium-center", x: 600, y: 390, level: 4, neighbors: ["bn-atrium-south", "bn-atrium-north", "bn-concourse-d", "bn-concourse-e"] },
    { id: "bn-atrium-north", x: 600, y: 280, level: 4, neighbors: ["bn-atrium-center", "bn-concourse-c"] },

    // Concourse C
    { id: "bn-concourse-c", x: 600, y: 240, level: 4, neighbors: ["bn-atrium-north", "bn-c-mid"] },
    { id: "bn-c-mid", x: 600, y: 160, level: 4, neighbors: ["bn-concourse-c", "bn-c-end", "bn-gate-c12", "bn-gate-c10", "bn-gate-c14"] },
    { id: "bn-c-end", x: 600, y: 90, level: 4, neighbors: ["bn-c-mid", "bn-gate-c16", "bn-gate-c18"] },
    { id: "bn-gate-c12", x: 650, y: 160, level: 4, neighbors: ["bn-c-mid"] },
    { id: "bn-gate-c10", x: 550, y: 160, level: 4, neighbors: ["bn-c-mid"] },
    { id: "bn-gate-c14", x: 650, y: 210, level: 4, neighbors: ["bn-c-mid"] },
    { id: "bn-gate-c16", x: 550, y: 90, level: 4, neighbors: ["bn-c-end"] },
    { id: "bn-gate-c18", x: 650, y: 90, level: 4, neighbors: ["bn-c-end"] },

    // Concourse D & E
    { id: "bn-concourse-d", x: 260, y: 390, level: 4, neighbors: ["bn-atrium-center", "bn-gate-d42"] },
    { id: "bn-gate-d42", x: 160, y: 390, level: 4, neighbors: ["bn-concourse-d"] },
    { id: "bn-concourse-e", x: 940, y: 390, level: 4, neighbors: ["bn-atrium-center", "bn-gate-e68"] },
    { id: "bn-gate-e68", x: 1040, y: 390, level: 4, neighbors: ["bn-concourse-e"] },
  ],
  amenities: [
    {
      id: "gate-c12",
      name: "Gate C12 · Flight SW-811 to Dubai (DXB)",
      category: "gate",
      gateNumber: "C12",
      flightCode: "SW-811",
      destination: "Dubai (DXB)",
      status: "boarding",
      x: 650,
      y: 160,
      level: 4,
      terminalId: "BOM-T2",
      nearGate: "C12",
      description: "Assigned gate for Mumbai to Dubai. Boarding starts at 21:45. Seat 22A.",
      tags: ["My Gate", "SW-811", "Boarding 21:45", "A330"],
      icon: "✈️",
      accessible: true,
      openingHours: "Open now · Gate closes 22:00 IST",
    },
    {
      id: "gate-c10",
      name: "Gate C10",
      category: "gate",
      gateNumber: "C10",
      status: "open",
      x: 550,
      y: 160,
      level: 4,
      terminalId: "BOM-T2",
      nearGate: "C10",
      description: "International departure gate.",
      tags: ["International"],
      icon: "🚪",
      accessible: true,
    },
    {
      id: "bom-lounge-adani",
      name: "Adani Lounge (International Level 3/4)",
      category: "lounge",
      x: 710,
      y: 350,
      level: 4,
      terminalId: "BOM-T2",
      rating: 4.8,
      priceRange: "$$$",
      description: "Gourmet coastal Indian buffet, premium cocktail bar, private nap suites, and panoramic runway views.",
      tags: ["Gold Access", "Cocktails", "Runway View", "Showers"],
      icon: "👑",
      accessible: true,
      openingHours: "24 Hours Open",
    },
    {
      id: "bom-food-bombay-sweet",
      name: "Bombay Sweet Shop & Chai Co.",
      category: "dining",
      x: 560,
      y: 420,
      level: 4,
      terminalId: "BOM-T2",
      rating: 4.7,
      priceRange: "$$",
      description: "Artisanal mithai gift boxes, fresh kathi rolls, and hot cutting chai.",
      tags: ["Sweets", "Chai", "Gifts"],
      icon: "🍬",
      accessible: true,
      openingHours: "24 Hours Open",
    },
    {
      id: "bom-art-wall",
      name: "Jaya He 3-km Art Wall Museum",
      category: "service",
      x: 600,
      y: 330,
      level: 4,
      terminalId: "BOM-T2",
      description: "India's largest public art programme with 7,000+ traditional and contemporary artefacts.",
      tags: ["Art Museum", "Sightseeing", "Cultural Heritage"],
      icon: "🎨",
      accessible: true,
      openingHours: "24 Hours Open",
    },
    {
      id: "bom-water-c12",
      name: "Hydration RO Water & Fast Charging",
      category: "water_power",
      x: 620,
      y: 140,
      level: 4,
      terminalId: "BOM-T2",
      nearGate: "C12",
      description: "Free chilled drinking water refill and multi-pin charging station next to Gate C12.",
      tags: ["Water Refill", "Free Power", "Opposite Gate C12"],
      icon: "💧",
      accessible: true,
      openingHours: "24 Hours Open",
    },
    {
      id: "bom-restroom-c",
      name: "Restroom Complex (Concourse C)",
      category: "restroom",
      x: 580,
      y: 150,
      level: 4,
      terminalId: "BOM-T2",
      nearGate: "C12",
      description: "Clean restroom with accessible stall and baby changing table.",
      tags: ["Restroom", "Accessible", "Baby Changing"],
      icon: "🚻",
      accessible: true,
      openingHours: "24 Hours Open",
    },
  ],
};

// --------------------------------------------------------------------------------------
// 3. DXB T3 - Dubai International Airport Terminal 3
// --------------------------------------------------------------------------------------
export const DXB_T3_DATA: AirportTerminalConfig = {
  id: "DXB-T3",
  airportCode: "DXB",
  airportName: "Dubai International Airport",
  city: "Dubai",
  country: "United Arab Emirates",
  terminalName: "Terminal 3 (Concourse B & C)",
  defaultLevel: 2,
  levels: [
    { level: 3, name: "Level 3 · Lounges & First Class", description: "SkyWay Partner Lounges, Fine Dining & Sleep 'n Fly" },
    { level: 2, name: "Level 2 · Departures & Boarding Gates", description: "Security, Duty Free Grand Galleria, Gates B1–B32" },
    { level: 1, name: "Level 1 · Train Shuttles & Arrivals", description: "Concourse A APM Train, Baggage Hall & Metro" },
  ],
  viewBox: { width: 1200, height: 800 },
  myFlight: {
    flightNumber: "SW-812",
    pnr: "SW9M2P",
    gate: "B18",
    terminal: "DXB T3",
    depTime: "03:15 GST",
    boardingTime: "02:40 GST",
    route: "DXB → BOM",
    status: "On Time",
  },
  concourses: [
    {
      id: "dxb-central",
      name: "Concourse B Central Duty Free Atrium",
      level: 2,
      polygon: [
        [380, 260],
        [820, 260],
        [820, 520],
        [380, 520],
      ],
    },
    {
      id: "dxb-pier-north",
      name: "Concourse B North Gates (B1–B15)",
      level: 2,
      polygon: [
        [380, 320],
        [120, 320],
        [120, 460],
        [380, 460],
      ],
    },
    {
      id: "dxb-pier-south",
      name: "Concourse B South Gates (B16–B32 & B18)",
      level: 2,
      polygon: [
        [820, 320],
        [1080, 320],
        [1080, 460],
        [820, 460],
      ],
    },
    {
      id: "dxb-security",
      name: "Smart Gate Security & Passport Control",
      level: 2,
      polygon: [
        [380, 520],
        [820, 520],
        [820, 720],
        [380, 720],
      ],
    },
  ],
  securityLanes: [
    {
      id: "dxb-smart-gates",
      name: "Dubai Smart Gates (Biometric Iris & Passport)",
      type: "fast_track",
      x: 500,
      y: 535,
      level: 2,
      currentWaitMin: 2,
      status: "smooth",
      openLanes: 8,
      totalLanes: 8,
    },
    {
      id: "dxb-general-sec",
      name: "Main Transit Security Checkpoint",
      type: "general",
      x: 650,
      y: 535,
      level: 2,
      currentWaitMin: 8,
      status: "smooth",
      openLanes: 12,
      totalLanes: 12,
    },
  ],
  nodes: [
    { id: "dn-entrance", x: 600, y: 680, level: 2, neighbors: ["dn-checkin"] },
    { id: "dn-checkin", x: 600, y: 610, level: 2, neighbors: ["dn-entrance", "dn-smart-gates", "dn-general-sec"] },
    { id: "dn-smart-gates", x: 500, y: 530, level: 2, neighbors: ["dn-checkin", "dn-atrium-south"] },
    { id: "dn-general-sec", x: 650, y: 530, level: 2, neighbors: ["dn-checkin", "dn-atrium-south"] },
    { id: "dn-atrium-south", x: 600, y: 480, level: 2, neighbors: ["dn-smart-gates", "dn-general-sec", "dn-atrium-center"] },
    { id: "dn-atrium-center", x: 600, y: 390, level: 2, neighbors: ["dn-atrium-south", "dn-north-wing", "dn-south-wing"] },
    { id: "dn-south-wing", x: 820, y: 390, level: 2, neighbors: ["dn-atrium-center", "dn-s-mid"] },
    { id: "dn-s-mid", x: 940, y: 390, level: 2, neighbors: ["dn-south-wing", "dn-s-end", "dn-gate-b18", "dn-gate-b20"] },
    { id: "dn-s-end", x: 1060, y: 390, level: 2, neighbors: ["dn-s-mid", "dn-gate-b24"] },
    { id: "dn-gate-b18", x: 940, y: 340, level: 2, neighbors: ["dn-s-mid"] },
    { id: "dn-gate-b20", x: 940, y: 440, level: 2, neighbors: ["dn-s-mid"] },
    { id: "dn-gate-b24", x: 1060, y: 340, level: 2, neighbors: ["dn-s-end"] },
    { id: "dn-north-wing", x: 380, y: 390, level: 2, neighbors: ["dn-atrium-center", "dn-gate-b4"] },
    { id: "dn-gate-b4", x: 200, y: 390, level: 2, neighbors: ["dn-north-wing"] },
  ],
  amenities: [
    {
      id: "dxb-gate-b18",
      name: "Gate B18 · Flight SW-812 to Mumbai (BOM)",
      category: "gate",
      gateNumber: "B18",
      flightCode: "SW-812",
      destination: "Mumbai (BOM)",
      status: "boarding",
      x: 940,
      y: 340,
      level: 2,
      terminalId: "DXB-T3",
      nearGate: "B18",
      description: "Airbus A350 boarding gate equipped with direct dual air bridges.",
      tags: ["My Gate", "Airbus A350", "Dual Air Bridge"],
      icon: "✈️",
      accessible: true,
      openingHours: "Open now",
    },
    {
      id: "dxb-dutyfree",
      name: "Dubai Duty Free Mega Store",
      category: "shopping",
      x: 600,
      y: 390,
      level: 2,
      terminalId: "DXB-T3",
      rating: 4.9,
      priceRange: "$$$",
      description: "Gold souvenirs, Rolex, Apple, Arabic fragrances, dates, and luxury spirits.",
      tags: ["World Famous", "Gold", "Fragrances", "Electronics"],
      icon: "🛍️",
      accessible: true,
      openingHours: "24 Hours Open",
    },
    {
      id: "dxb-sleep-fly",
      name: "Sleep 'n Fly Sleep Pods & Showers",
      category: "lounge",
      x: 880,
      y: 360,
      level: 2,
      terminalId: "DXB-T3",
      nearGate: "B16–B18",
      rating: 4.6,
      priceRange: "$$",
      description: "Soundproof YAWN cabins, double bunk pods, and hot showers for long transit layovers.",
      tags: ["Nap Pods", "Showers", "Quiet", "Layover"],
      icon: "🛏️",
      accessible: true,
      openingHours: "24 Hours Open",
    },
    {
      id: "dxb-shake-shack",
      name: "Shake Shack & Paul Bakery",
      category: "dining",
      x: 680,
      y: 430,
      level: 2,
      terminalId: "DXB-T3",
      rating: 4.7,
      priceRange: "$$",
      description: "Fresh burgers, crinkle-cut fries, milkshakes, and French croissants.",
      tags: ["Burgers", "Bakery", "24/7"],
      icon: "🍔",
      accessible: true,
      openingHours: "24 Hours Open",
    },
  ],
};

// All available airports catalog
export const ALL_AIRPORT_MAPS: AirportTerminalConfig[] = [
  DEL_T3_DATA,
  BOM_T2_DATA,
  DXB_T3_DATA,
];

export function getAirportMapConfig(idOrCode: string): AirportTerminalConfig {
  const norm = idOrCode.toUpperCase();
  const found = ALL_AIRPORT_MAPS.find(
    (m) =>
      m.id.toUpperCase() === norm ||
      m.airportCode.toUpperCase() === norm ||
      norm.includes(m.airportCode.toUpperCase())
  );
  return found ?? DEL_T3_DATA;
}

// --------------------------------------------------------------------------------------
// Dijkstra Pathfinding Utility on Navigation Graph
// --------------------------------------------------------------------------------------
export function findShortestPath(
  nodes: NavigationNode[],
  startNodeId: string,
  endNodeId: string,
  accessibleOnly: boolean = false
): { path: NavigationNode[]; distanceMeters: number; walkTimeMin: number } {
  const nodeMap = new Map<string, NavigationNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  if (!nodeMap.has(startNodeId) || !nodeMap.has(endNodeId)) {
    return { path: [], distanceMeters: 0, walkTimeMin: 0 };
  }

  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set<string>();

  nodes.forEach((n) => {
    distances.set(n.id, Infinity);
    previous.set(n.id, null);
    unvisited.add(n.id);
  });

  distances.set(startNodeId, 0);

  while (unvisited.size > 0) {
    let currentId: string | null = null;
    let shortestDist = Infinity;

    unvisited.forEach((id) => {
      const dist = distances.get(id)!;
      if (dist < shortestDist) {
        shortestDist = dist;
        currentId = id;
      }
    });

    if (currentId === null || shortestDist === Infinity) break;
    if (currentId === endNodeId) break;

    unvisited.delete(currentId);
    const currentNode = nodeMap.get(currentId)!;

    for (const neighborId of currentNode.neighbors) {
      if (!unvisited.has(neighborId)) continue;
      const neighborNode = nodeMap.get(neighborId);
      if (!neighborNode) continue;

      if (accessibleOnly && neighborNode.isEscalator) {
        continue; // Skip stairs/escalators for wheelchair routes
      }

      const dx = currentNode.x - neighborNode.x;
      const dy = currentNode.y - neighborNode.y;
      const stepDist = Math.sqrt(dx * dx + dy * dy);
      const totalDist = shortestDist + stepDist;

      if (totalDist < distances.get(neighborId)!) {
        distances.set(neighborId, totalDist);
        previous.set(neighborId, currentId);
      }
    }
  }

  // Reconstruct path
  const path: NavigationNode[] = [];
  let curr: string | null = endNodeId;
  while (curr !== null) {
    const n = nodeMap.get(curr);
    if (n) path.unshift(n);
    curr = previous.get(curr) || null;
  }

  // Calculate real distance (approx: 1 pixel ~ 0.75 meters)
  let rawDist = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i].x - path[i + 1].x;
    const dy = path[i].y - path[i + 1].y;
    rawDist += Math.sqrt(dx * dx + dy * dy);
  }

  const distanceMeters = Math.round(rawDist * 0.75);
  // Average airport walking speed = 80 meters / min (~4.8 km/h)
  const walkTimeMin = Math.max(1, Math.ceil(distanceMeters / 80));

  return { path, distanceMeters, walkTimeMin };
}
