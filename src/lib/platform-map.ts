// Service catalogue — 13 domain microservices + Auth + Snowflake BI sink.
// `hex` drives the pill color used in the Platform map UI.
export const SERVICES = {
  booking:      { label: "Booking",       hex: "#60A5FA" }, // blue
  flight:       { label: "Flight mgmt",   hex: "#F59E0B" }, // orange
  fare:         { label: "Fare engine",   hex: "#34D399" }, // green
  passenger:    { label: "Passenger",     hex: "#A78BFA" }, // violet
  checkin:      { label: "Check-in",      hex: "#2DD4BF" }, // teal
  crew:         { label: "Crew",          hex: "#F472B6" }, // pink
  payment:      { label: "Payment",       hex: "#FB923C" }, // coral
  ancillary:    { label: "Ancillary",     hex: "#FBBF24" }, // amber
  disruption:   { label: "Disruption",    hex: "#F87171" }, // red
  notification: { label: "Notification",  hex: "#94A3B8" }, // slate
  search:       { label: "Search",        hex: "#38BDF8" }, // sky
  cargo:        { label: "Cargo",         hex: "#A8A29E" }, // stone
  aiml:         { label: "AI / ML",       hex: "#C4B5FD" }, // lavender
  auth:         { label: "Auth",          hex: "#EF4444" }, // crimson
  snowflake:    { label: "Snowflake BI",  hex: "#7DD3FC" }, // ice
} as const;

export type ServiceKey = keyof typeof SERVICES;

export interface PagePin {
  id: string;
  name: string;
  path: string;
  blurb: string;
  services: ServiceKey[];
  /** Service-heavy pages get the accent treatment */
  heavy?: boolean;
}

export interface AppSection {
  group: string;
  pages: PagePin[];
}

export interface ClientApp {
  slug: string;
  name: string;
  surface: string;
  audience: string;
  total: string;
  summary: string;
  sections: AppSection[];
}

export const APPS: ClientApp[] = [
  // ---------------------------------------------------------------- Passenger Web
  {
    slug: "passenger-web",
    name: "Passenger web",
    surface: "Responsive web · Next.js",
    audience: "Travellers, prospects",
    total: "18 pages",
    summary:
      "Full public funnel + authenticated self-service. The booking flow and the disruption self-service page touch the most services at once.",
    sections: [
      {
        group: "Discovery & search",
        pages: [
          { id: "home",     name: "Home / Landing",            path: "/",                 blurb: "Hero, search, next trip, deals", services: ["search", "flight", "aiml", "notification"] },
          { id: "results",  name: "Flight search results",     path: "/search",           blurb: "Itinerary list, filters, fare ladder", services: ["search", "fare", "flight", "aiml"] },
          { id: "detail",   name: "Flight detail & fare picker", path: "/flights/:id",    blurb: "NDC offer, brand bundles, fare rules", services: ["fare", "flight", "ancillary", "booking"] },
        ],
      },
      {
        group: "Booking flow",
        pages: [
          { id: "seats",    name: "Seat selection",            path: "/booking/seats",      blurb: "Seat map with Redis 15-min locks", services: ["booking", "flight", "fare"] },
          { id: "pax",      name: "Passenger details",         path: "/booking/passengers", blurb: "APIS, passport, SSRs, contact", services: ["booking", "passenger", "auth"] },
          { id: "extras",   name: "Add-ons / ancillaries",     path: "/booking/extras",     blurb: "Bags, meals, lounge, insurance", services: ["ancillary", "booking", "aiml"] },
          { id: "pay",      name: "Payment",                   path: "/booking/payment",    blurb: "Multi-gateway, BNPL, fraud check", services: ["payment", "booking", "passenger", "aiml"], heavy: true },
          { id: "confirm",  name: "Booking confirmation",      path: "/booking/confirm",    blurb: "PNR, e-tickets, receipts, email", services: ["booking", "notification", "payment", "passenger"] },
        ],
      },
      {
        group: "Manage trip",
        pages: [
          { id: "trips",     name: "My trips",                 path: "/my-trips",                  blurb: "Upcoming + past, status badges", services: ["booking", "flight", "checkin", "disruption"] },
          { id: "trip",      name: "Trip detail / PNR",        path: "/my-trips/:pnr",             blurb: "Itinerary, change, cancel, refund", services: ["booking", "flight", "ancillary", "checkin", "notification"] },
          { id: "checkin",   name: "Web check-in",             path: "/check-in/:pnr",             blurb: "T-24h, APIS, seat, bags", services: ["checkin", "booking", "flight", "ancillary", "notification"] },
          { id: "boarding",  name: "Boarding pass",            path: "/check-in/:pnr/boarding-pass", blurb: "PDF, Apple Wallet, Google Pay", services: ["checkin", "flight", "booking"] },
        ],
      },
      {
        group: "Account",
        pages: [
          { id: "loyalty",   name: "Loyalty & miles",          path: "/loyalty",            blurb: "Tier, miles, expiry, family pool", services: ["passenger", "booking", "aiml"] },
          { id: "wallet",    name: "Wallet & payment history", path: "/wallet",             blurb: "Cards, vouchers, refunds, invoices", services: ["payment", "passenger"] },
          { id: "analytics", name: "Travel analytics",         path: "/analytics",          blurb: "Miles flown, countries, CO₂, tier progress", services: ["passenger", "flight", "aiml"] },
          { id: "assistant", name: "AI travel assistant",      path: "/assistant",          blurb: "Ask about fares, baggage, refunds, itinerary", services: ["aiml", "booking", "passenger"] },
          { id: "profile",   name: "Profile & preferences",    path: "/profile",            blurb: "Profile, docs, payment methods, GDPR", services: ["passenger", "auth", "payment"] },
          { id: "notifs",    name: "Notifications",            path: "/notifications",      blurb: "Inbox, push, SMS, email prefs", services: ["notification", "disruption", "flight"] },
        ],
      },
      {
        group: "Disruption & status",
        pages: [
          { id: "disrupt",   name: "Disruption self-service",  path: "/disruption/:pnr",    blurb: "Accept rebook, claim refund, DoC voucher", services: ["disruption", "booking", "payment", "flight", "notification"], heavy: true },
          { id: "status",    name: "Flight status tracker",    path: "/flight-status/:id",  blurb: "Live status, gate, push subscribe", services: ["flight", "search", "notification"] },
          { id: "terminal-map", name: "Interactive Terminal Map", path: "/terminal-map",   blurb: "D3.js indoor map, gate wayfinding, security wait-times & amenities", services: ["flight", "passenger", "ancillary"] },
        ],
      },
      {
        group: "Auth",
        pages: [
          { id: "login",     name: "Login / Register",         path: "/login · /register",  blurb: "Email, OAuth, FFP signup, OTP", services: ["auth", "passenger", "notification"] },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- Passenger Mobile
  {
    slug: "passenger-mobile",
    name: "Mobile app",
    surface: "iOS · Android — React Native",
    audience: "Travellers on the go",
    total: "12 screens · 5 tabs",
    summary:
      "Tab bar = Home, Trips, Check-in, Loyalty, Account. Booking is a 3-screen stack (Seat → Pax → Pay) inside Home, not its own tab.",
    sections: [
      {
        group: "Home tab",
        pages: [
          { id: "m-home",     name: "Home",                    path: "tab://home",            blurb: "Hero search, next trip, offers", services: ["search", "fare", "booking"] },
          { id: "m-results",  name: "Results & offer",         path: "tab://home/results",    blurb: "Compact list + fare detail", services: ["search", "fare", "flight"] },
          { id: "m-seat",     name: "Booking · Seat",          path: "stack://book/seat",     blurb: "Stack step 1 — seat map", services: ["booking", "ancillary"] },
          { id: "m-pax",      name: "Booking · Pax details",   path: "stack://book/pax",      blurb: "Stack step 2 — APIS, SSRs", services: ["booking", "passenger", "auth"], heavy: true },
          { id: "m-pay",      name: "Booking · Payment",       path: "stack://book/pay",      blurb: "Stack step 3 — wallet, BNPL", services: ["payment", "fare", "booking"], heavy: true },
        ],
      },
      {
        group: "Trips tab",
        pages: [
          { id: "m-trips",    name: "Trips",                   path: "tab://trips",           blurb: "Upcoming + past, status", services: ["booking", "flight"] },
          { id: "m-trip",     name: "Trip detail",             path: "tab://trips/:pnr",      blurb: "Itinerary, disruption inbox", services: ["booking", "flight", "disruption"] },
        ],
      },
      {
        group: "Check-in tab",
        pages: [
          { id: "m-checkin",  name: "Mobile check-in",         path: "tab://checkin",         blurb: "Biometric face match, bag QR", services: ["checkin", "passenger"] },
          { id: "m-board",    name: "Boarding pass (wallet)",  path: "tab://checkin/pass",    blurb: "Live gate, push refresh", services: ["checkin", "notification"] },
        ],
      },
      {
        group: "Loyalty tab",
        pages: [
          { id: "m-ffp",      name: "Loyalty",                 path: "tab://loyalty",         blurb: "Miles, tier, redeem", services: ["passenger", "aiml"] },
        ],
      },
      {
        group: "Account tab",
        pages: [
          { id: "m-account",  name: "Account",                 path: "tab://account",         blurb: "Profile, docs, settings", services: ["passenger", "auth"] },
          { id: "m-help",     name: "Help & chatbot",          path: "tab://account/help",    blurb: "AI assistant + live agent", services: ["notification", "aiml"] },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- Airport Kiosk
  {
    slug: "kiosk",
    name: "Kiosk",
    surface: "Touch · 1080p portrait — Kotlin",
    audience: "Travellers at airport",
    total: "6 screens",
    summary:
      "Intentionally minimal. One task per screen. No marketing, no loyalty depth, no account management — that's the app.",
    sections: [
      {
        group: "Flow",
        pages: [
          { id: "k-attract", name: "Attract loop",            path: "kiosk://idle",         blurb: "Idle screen, language pick", services: ["notification"] },
          { id: "k-id",      name: "Identify",                path: "kiosk://identify",     blurb: "PNR / passport / FFP scan", services: ["booking", "passenger", "auth"] },
          { id: "k-conf",    name: "Confirm itinerary",       path: "kiosk://confirm",      blurb: "Flight, seat, bags summary", services: ["booking", "flight", "checkin"] },
          { id: "k-bags",    name: "Bag drop",                path: "kiosk://bags",         blurb: "Tag print, weight, fee capture", services: ["checkin", "ancillary", "payment"] },
          { id: "k-print",   name: "Boarding pass print",     path: "kiosk://print",        blurb: "Thermal print + email fallback", services: ["checkin", "notification"] },
          { id: "k-help",    name: "Help / call agent",       path: "kiosk://help",         blurb: "Escalate to staff terminal", services: ["notification"] },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- Crew App
  {
    slug: "crew",
    name: "Crew app",
    surface: "iPad · iOS — Swift",
    audience: "Pilots, cabin crew",
    total: "8 screens",
    summary:
      "Disruption Recovery is the most complex screen — accept or flag a re-pairing proposal from the Disruption service with full FTL context.",
    sections: [
      {
        group: "Roster & duty",
        pages: [
          { id: "c-roster",  name: "My roster",               path: "crew://roster",        blurb: "Calendar, swaps, bid lines", services: ["crew", "auth"] },
          { id: "c-duty",    name: "Duty time tracker",       path: "crew://duty",          blurb: "Live FTL countdown, rest required", services: ["crew"], heavy: true },
          { id: "c-quals",   name: "Qualifications",          path: "crew://qualifications", blurb: "Type ratings, recurrent, medical", services: ["crew"] },
        ],
      },
      {
        group: "Flight",
        pages: [
          { id: "c-brief",   name: "Flight briefing",         path: "crew://flight/:id/brief",    blurb: "W&B, pax manifest, cargo, weather", services: ["flight", "booking", "cargo", "crew"], heavy: true },
          { id: "c-manifest", name: "Passenger manifest",     path: "crew://flight/:id/manifest", blurb: "SSRs, UMs, VIPs, allergies", services: ["booking", "passenger"] },
          { id: "c-onboard", name: "Onboard duties",          path: "crew://flight/:id/onboard",  blurb: "Service checklist, care notes", services: ["passenger", "ancillary"] },
        ],
      },
      {
        group: "Disruption & logistics",
        pages: [
          { id: "c-disrupt", name: "Disruption recovery",     path: "crew://disruption",    blurb: "Receive re-pairing — accept or flag", services: ["disruption", "crew", "flight", "notification"], heavy: true },
          { id: "c-layover", name: "Layover & logistics",     path: "crew://layover",       blurb: "Hotel, transport, per-diem", services: ["crew", "payment"] },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- Admin Dashboard
  {
    slug: "admin",
    name: "Admin dashboard",
    surface: "Desktop web — Next.js + RBAC",
    audience: "Ops controllers, revenue, finance",
    total: "10 pages",
    summary:
      "Disruption Control Center is the platform's most service-heavy page. Revenue & Analytics queries Snowflake directly, not via a microservice.",
    sections: [
      {
        group: "Operations",
        pages: [
          { id: "a-overview", name: "Network overview",       path: "/admin",                blurb: "Live OTP, OOOI, holds, alerts", services: ["flight", "booking", "crew"] },
          { id: "a-board",    name: "Flight board",           path: "/admin/flights",        blurb: "All flights today, status, gates", services: ["flight"] },
          { id: "a-disrupt",  name: "Disruption control",     path: "/admin/disruption",     blurb: "Mass rebook, crew re-pair, DoC, comms", services: ["disruption", "booking", "flight", "crew", "notification"], heavy: true },
          { id: "a-crew",     name: "Crew control",           path: "/admin/crew",           blurb: "Roster, FTL alerts, pairings", services: ["crew"] },
          { id: "a-gates",    name: "Gates & slots",          path: "/admin/gates",          blurb: "Stand assignments, slot conflicts", services: ["flight"] },
        ],
      },
      {
        group: "Commercial",
        pages: [
          { id: "a-inv",      name: "Inventory & yield",      path: "/admin/inventory",      blurb: "Class controls, booking curves", services: ["fare", "booking", "aiml"] },
          { id: "a-fare",     name: "Fare manager",           path: "/admin/fares",          blurb: "Fare rules, promos, competitor", services: ["fare"] },
          { id: "a-rev",      name: "Revenue & analytics",    path: "/admin/revenue",        blurb: "Direct Snowflake BI — RASK, CASK, yield", services: ["snowflake"], heavy: true },
        ],
      },
      {
        group: "Trust & finance",
        pages: [
          { id: "a-fin",      name: "Finance & settlement",   path: "/admin/finance",        blurb: "BSP/ARC, interline, refunds", services: ["payment"] },
          { id: "a-fraud",    name: "Fraud & chargebacks",    path: "/admin/fraud",          blurb: "ML-flagged transactions queue", services: ["payment", "aiml"] },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- B2B Agent Portal
  {
    slug: "b2b",
    name: "B2B / Agent",
    surface: "Web — separate auth context",
    audience: "Travel agents, TMCs, corporates",
    total: "6 pages",
    summary:
      "Same Fare Engine and Booking service as passengers, with agent context, commission tracking and BSP settlement layered on top.",
    sections: [
      {
        group: "Workspace",
        pages: [
          { id: "b-dash",     name: "Agent dashboard",        path: "/agent",                blurb: "Bookings this period, commission YTD", services: ["booking", "payment", "auth"] },
          { id: "b-search",   name: "Agent search",           path: "/agent/search",         blurb: "Net fares, private fares, group quote", services: ["search", "fare"] },
          { id: "b-book",     name: "Agent booking",          path: "/agent/booking",        blurb: "Multi-pax, hold to ticketing deadline", services: ["booking", "fare", "passenger"], heavy: true },
        ],
      },
      {
        group: "Back office",
        pages: [
          { id: "b-queue",    name: "Queues & PNRs",          path: "/agent/queues",         blurb: "Schedule changes, action queues", services: ["booking", "flight"] },
          { id: "b-settle",   name: "Settlement & commission", path: "/agent/settlement",    blurb: "BSP, ARC, commission ledger", services: ["payment"] },
          { id: "b-reports",  name: "Reports",                path: "/agent/reports",        blurb: "Production reports, top routes", services: ["snowflake"] },
        ],
      },
    ],
  },
];
