// Mock data for the Admin portal — front-end only, no backend writes.

export type AdminRole = "passenger" | "ops" | "support" | "admin";
export type UserStatus = "active" | "suspended" | "pending";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: UserStatus;
  lastLogin: string;
  createdAt: string;
};

const NAMES = [
  "Amelia Carter", "Rohan Verma", "Sofia Ricci", "Kenji Tanaka", "Lena Novak",
  "Marcus Bell", "Priya Shah", "Diego Alvarez", "Hana Okafor", "Yui Nakamura",
  "Jonas Weber", "Chloe Dubois", "Aarav Patel", "Nora Lindqvist", "Miguel Santos",
  "Isla McKenzie", "Farid Hosseini", "Zara Ahmed", "Owen Reilly", "Tomas Kalinen",
];
const ROLES: AdminRole[] = ["passenger", "ops", "support", "admin"];
const STATUS: UserStatus[] = ["active", "active", "active", "suspended", "pending"];

export const users: AdminUser[] = NAMES.map((n, i) => {
  const email = n.toLowerCase().replace(/[^a-z]+/g, ".") + "@skyway.io";
  const role = ROLES[i % ROLES.length];
  const status = STATUS[i % STATUS.length];
  const last = new Date(Date.now() - i * 3600 * 1000 * (1 + (i % 4))).toISOString();
  const created = new Date(Date.now() - (30 + i * 7) * 86400 * 1000).toISOString();
  return { id: `u_${1000 + i}`, name: n, email, role, status, lastLogin: last, createdAt: created };
});

export type AdminFlight = {
  id: string;
  no: string;
  route: string;
  aircraft: string;
  gate: string;
  schedule: string;
  status: "on-time" | "delayed" | "boarding" | "cancelled" | "in-flight" | "completed";
  capacity: number;
  occupancy: number;
};

export const flights: AdminFlight[] = [
  { id: "f1", no: "SW101", route: "JFK → LHR", aircraft: "N737SW", gate: "B12", schedule: "08:20 → 20:15", status: "in-flight", capacity: 189, occupancy: 176 },
  { id: "f2", no: "SW214", route: "LHR → CDG", aircraft: "N320SW", gate: "A4",  schedule: "09:05 → 11:25", status: "boarding", capacity: 180, occupancy: 152 },
  { id: "f3", no: "SW508", route: "DXB → SIN", aircraft: "N77WSW", gate: "C21", schedule: "22:40 → 10:05", status: "on-time", capacity: 350, occupancy: 331 },
  { id: "f4", no: "SW612", route: "NRT → LAX", aircraft: "N78WSW", gate: "D3",  schedule: "17:30 → 10:45", status: "delayed", capacity: 340, occupancy: 298 },
  { id: "f5", no: "SW733", route: "SYD → AKL", aircraft: "N321SW", gate: "B7",  schedule: "07:00 → 12:15", status: "on-time", capacity: 200, occupancy: 190 },
  { id: "f6", no: "SW841", route: "FRA → JFK", aircraft: "N78BSW", gate: "A22", schedule: "10:15 → 12:55", status: "cancelled", capacity: 340, occupancy: 0 },
  { id: "f7", no: "SW902", route: "SFO → NRT", aircraft: "N78CSW", gate: "G14", schedule: "13:00 → 16:20", status: "completed", capacity: 340, occupancy: 335 },
  { id: "f8", no: "SW118", route: "MAD → LIS", aircraft: "N320XS", gate: "F5",  schedule: "18:45 → 19:50", status: "on-time", capacity: 180, occupancy: 128 },
];

export type AdminAircraft = {
  tail: string;
  model: string;
  capacity: number;
  airport: string;
  flight: string | null;
  maint: "ok" | "due" | "in-service";
  fuel: number;
  available: boolean;
};
export const fleet: AdminAircraft[] = [
  { tail: "N737SW", model: "Boeing 737-800",  capacity: 189, airport: "JFK", flight: "SW101", maint: "ok",         fuel: 92, available: false },
  { tail: "N320SW", model: "Airbus A320neo",  capacity: 180, airport: "LHR", flight: "SW214", maint: "ok",         fuel: 88, available: false },
  { tail: "N77WSW", model: "Boeing 777-300ER",capacity: 350, airport: "DXB", flight: "SW508", maint: "due",        fuel: 74, available: false },
  { tail: "N78WSW", model: "Boeing 787-9",    capacity: 340, airport: "NRT", flight: "SW612", maint: "ok",         fuel: 66, available: false },
  { tail: "N321SW", model: "Airbus A321XLR",  capacity: 200, airport: "SYD", flight: "SW733", maint: "ok",         fuel: 81, available: false },
  { tail: "N78BSW", model: "Boeing 787-8",    capacity: 296, airport: "FRA", flight: null,    maint: "in-service", fuel: 30, available: false },
  { tail: "N320XS", model: "Airbus A320",     capacity: 180, airport: "MAD", flight: "SW118", maint: "ok",         fuel: 95, available: false },
  { tail: "N359SW", model: "Airbus A350-900", capacity: 315, airport: "SIN", flight: null,    maint: "ok",         fuel: 100, available: true },
  { tail: "N78CSW", model: "Boeing 787-9",    capacity: 340, airport: "NRT", flight: null,    maint: "ok",         fuel: 98, available: true },
];

export type AdminAirport = {
  code: string; name: string; city: string; country: string; gates: number; runways: number;
  terminals: number; lounges: number; status: "operating" | "restricted" | "closed"; capacity: number;
};
export const airports: AdminAirport[] = [
  { code: "JFK", name: "John F. Kennedy Intl", city: "New York",  country: "USA", gates: 128, runways: 4, terminals: 6, lounges: 4, status: "operating",  capacity: 84 },
  { code: "LHR", name: "Heathrow",             city: "London",    country: "UK",  gates: 115, runways: 2, terminals: 5, lounges: 6, status: "restricted", capacity: 96 },
  { code: "DXB", name: "Dubai Intl",           city: "Dubai",     country: "UAE", gates: 184, runways: 2, terminals: 3, lounges: 8, status: "operating",  capacity: 78 },
  { code: "NRT", name: "Narita Intl",          city: "Tokyo",     country: "JP",  gates: 96,  runways: 2, terminals: 3, lounges: 4, status: "operating",  capacity: 65 },
  { code: "SYD", name: "Kingsford Smith",      city: "Sydney",    country: "AU",  gates: 65,  runways: 3, terminals: 3, lounges: 3, status: "operating",  capacity: 71 },
  { code: "FRA", name: "Frankfurt",            city: "Frankfurt", country: "DE",  gates: 142, runways: 4, terminals: 2, lounges: 5, status: "operating",  capacity: 82 },
  { code: "SIN", name: "Changi",               city: "Singapore", country: "SG",  gates: 140, runways: 3, terminals: 4, lounges: 7, status: "operating",  capacity: 69 },
  { code: "CDG", name: "Charles de Gaulle",    city: "Paris",     country: "FR",  gates: 138, runways: 4, terminals: 3, lounges: 6, status: "restricted", capacity: 91 },
];

export type AdminRoute = {
  id: string; pair: string; distance: number; pax: number; load: number; profit: number; trend: number;
};
export const routes: AdminRoute[] = [
  { id: "r1", pair: "JFK ↔ LHR", distance: 5540, pax: 148_200, load: 88, profit: 4.2, trend:  3.1 },
  { id: "r2", pair: "DXB ↔ SIN", distance: 5860, pax: 132_500, load: 92, profit: 5.1, trend:  6.4 },
  { id: "r3", pair: "NRT ↔ LAX", distance: 8815, pax:  98_400, load: 81, profit: 2.9, trend: -1.2 },
  { id: "r4", pair: "SYD ↔ AKL", distance: 2160, pax: 210_000, load: 94, profit: 3.6, trend:  2.7 },
  { id: "r5", pair: "FRA ↔ JFK", distance: 6215, pax: 118_900, load: 79, profit: 2.1, trend: -0.6 },
  { id: "r6", pair: "MAD ↔ LIS", distance:  510, pax: 258_400, load: 71, profit: 1.4, trend:  1.9 },
];

export type Employee = {
  id: string; name: string; dept: "Pilot" | "Cabin Crew" | "Ground" | "Ops" | "Support";
  shift: "Morning" | "Evening" | "Night" | "Rotating"; hours: number; status: "on-duty" | "off-duty" | "leave";
  cert: string; leave: number;
};
export const employees: Employee[] = NAMES.slice(0, 14).map((n, i) => ({
  id: `e_${200 + i}`, name: n,
  dept: (["Pilot", "Cabin Crew", "Ground", "Ops", "Support"] as const)[i % 5],
  shift: (["Morning", "Evening", "Night", "Rotating"] as const)[i % 4],
  hours: 80 + (i % 6) * 12,
  status: (["on-duty", "off-duty", "leave"] as const)[i % 3],
  cert: ["ATPL", "CCA-II", "IATA-GH", "OCC-L3", "CSA-2"][i % 5],
  leave: 12 + (i % 8),
}));

export type Announcement = {
  id: string; title: string; body: string; audience: "All" | "Passengers" | "Staff" | "Ops";
  type: "Advisory" | "System" | "Flight" | "Promotion" | "Internal"; scheduled: string; published: boolean;
};
export const announcements: Announcement[] = [
  { id: "a1", title: "Winter storm advisory — Eastern US", body: "Passengers on JFK, BOS, and PHL routes may experience delays 22-24 Dec.", audience: "Passengers", type: "Advisory", scheduled: "2026-07-08T09:00:00Z", published: true },
  { id: "a2", title: "Ops handover 20:00Z", body: "Shift change — refer to disruption log for pending items.", audience: "Ops", type: "Internal", scheduled: "2026-07-08T20:00:00Z", published: true },
  { id: "a3", title: "Summer Reward Miles 2× promo", body: "Members earn 2× miles on transatlantic routes through August.", audience: "Passengers", type: "Promotion", scheduled: "2026-07-15T00:00:00Z", published: false },
  { id: "a4", title: "System maintenance 02:00-02:30Z", body: "Booking API brief downtime for security patch.", audience: "All", type: "System", scheduled: "2026-07-10T02:00:00Z", published: false },
];

export type ActivityLog = {
  id: string; user: string; action: string; module: string; ts: string; ip: string; ok: boolean;
};
export const activity: ActivityLog[] = Array.from({ length: 18 }, (_, i) => ({
  id: `log_${9000 + i}`,
  user: ["amelia.admin", "rohan.ops", "sofia.support", "kenji.admin"][i % 4],
  action: ["Updated pricing rule", "Suspended user", "Assigned aircraft", "Published announcement", "Rotated API key", "Viewed audit log", "Enabled AI feature"][i % 7],
  module: ["Pricing", "Users", "Flights", "Announcements", "Security", "Audit", "AI"][i % 7],
  ts: new Date(Date.now() - i * 1000 * 60 * 17).toISOString(),
  ip: `192.168.${10 + (i % 20)}.${30 + i}`,
  ok: i % 6 !== 5,
}));

export type SessionRow = {
  id: string; user: string; device: string; location: string; ip: string; since: string; current: boolean;
};
export const sessions: SessionRow[] = [
  { id: "s1", user: "amelia.admin",  device: "MacBook Pro · Chrome", location: "New York, US", ip: "192.168.10.32",  since: new Date(Date.now() - 1000 * 60 * 42).toISOString(), current: true  },
  { id: "s2", user: "rohan.ops",     device: "iPad · Safari",        location: "London, UK",   ip: "10.44.28.19",    since: new Date(Date.now() - 1000 * 60 * 210).toISOString(), current: false },
  { id: "s3", user: "sofia.support", device: "Windows · Edge",       location: "Rome, IT",     ip: "172.16.9.55",    since: new Date(Date.now() - 1000 * 60 * 65).toISOString(),  current: false },
  { id: "s4", user: "kenji.admin",   device: "iPhone · Safari",      location: "Tokyo, JP",    ip: "203.104.22.7",   since: new Date(Date.now() - 1000 * 60 * 12).toISOString(),  current: false },
];

export type PricingRule = {
  id: string; name: string; scope: string; type: "Dynamic" | "Seasonal" | "Promo" | "Student" | "Coupon" | "Holiday";
  adjust: string; active: boolean;
};
export const pricing: PricingRule[] = [
  { id: "p1", name: "Peak Summer +18%", scope: "Europe → USA", type: "Seasonal", adjust: "+18%", active: true },
  { id: "p2", name: "Off-peak Tuesday -12%", scope: "All routes", type: "Dynamic", adjust: "-12%", active: true },
  { id: "p3", name: "Student ID discount", scope: "All routes",  type: "Student", adjust: "-15%", active: true },
  { id: "p4", name: "SW-SUMMER25 coupon", scope: "Global",       type: "Coupon",  adjust: "-25%", active: false },
  { id: "p5", name: "Holiday surcharge",  scope: "US Domestic",  type: "Holiday", adjust: "+9%",  active: true },
  { id: "p6", name: "Weekend Flash Sale", scope: "SE Asia",      type: "Promo",   adjust: "-30%", active: false },
];

export type AdminNotification = {
  id: string; title: string; body: string; kind: "flight" | "security" | "system" | "ai" | "airport" | "payment" | "server";
  severity: "low" | "medium" | "high" | "critical"; at: string;
};
export const notifications: AdminNotification[] = [
  { id: "n1", title: "Flight SW841 cancelled", body: "Weather diversion at FRA — 340 passengers to rebook.", kind: "flight",   severity: "high",     at: new Date(Date.now() - 12 * 60 * 1000).toISOString() },
  { id: "n2", title: "6 failed logins on 'root@skyway'", body: "Locked source IP 88.44.12.7 for 30 min.",       kind: "security", severity: "critical", at: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
  { id: "n3", title: "AI model latency spike",         body: "Gateway p95 3.2s — investigating.",              kind: "ai",       severity: "medium",   at: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
  { id: "n4", title: "LHR gate reallocation",         body: "Terminal 5 gates 12/14 reassigned by ATC.",       kind: "airport",  severity: "medium",   at: new Date(Date.now() - 72 * 60 * 1000).toISOString() },
  { id: "n5", title: "Payment gateway timeout",       body: "Stripe primary route degraded — failover active.", kind: "payment",  severity: "high",     at: new Date(Date.now() - 92 * 60 * 1000).toISOString() },
  { id: "n6", title: "API cluster CPU 82%",           body: "Auto-scaled from 6→9 nodes.",                     kind: "server",   severity: "low",      at: new Date(Date.now() - 130 * 60 * 1000).toISOString() },
];

export type AiLog = {
  id: string; model: string; latency: number; tokensIn: number; tokensOut: number; ok: boolean; at: string; feature: string;
};
export const aiLogs: AiLog[] = Array.from({ length: 12 }, (_, i) => ({
  id: `ai_${100 + i}`,
  model: ["gemini-2.5-flash", "gemini-2.5-pro", "gpt-5-mini"][i % 3],
  latency: 320 + Math.round(Math.random() * 900),
  tokensIn: 400 + Math.round(Math.random() * 4000),
  tokensOut: 200 + Math.round(Math.random() * 2200),
  ok: i % 8 !== 7,
  at: new Date(Date.now() - i * 1000 * 60 * 6).toISOString(),
  feature: ["Disruption plan", "Copilot chat", "Rebooking suggestion", "Weather summary"][i % 4],
}));
