import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { SERVICES, type ServiceKey, APPS } from "@/lib/platform-map";
import { BaggageTracker } from "@/components/BaggageTracker";
import { UserDashboard } from "@/components/UserDashboard";
import { FlightNotificationCenter } from "@/components/FlightNotificationCenter";
import { StripeCheckoutForm } from "@/components/StripeCheckoutForm";
import { StripeReceiptModal } from "@/components/StripeReceiptModal";
import { TerminalGuideView } from "@/components/terminal-map/TerminalGuideView";
import { InFlightDiningPreview } from "@/components/InFlightDiningPreview";
import { downloadIcsFile } from "@/lib/calendar-utils";

// ---- Selected-seat store (persists per PNR across pages) -----------------
const SEAT_KEY = "sw.selectedSeats";
type SeatMap = Record<string, string>;
function readSeats(): SeatMap {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(SEAT_KEY) || "{}") as SeatMap; } catch { return {}; }
}
let seatCache: SeatMap = readSeats();
const seatListeners = new Set<() => void>();
function subscribeSeats(cb: () => void) { seatListeners.add(cb); return () => { seatListeners.delete(cb); }; }
function getSeat(pnr: string): string | undefined { return seatCache[pnr.toUpperCase()]; }
export function setSelectedSeat(pnr: string, seat: string) {
  seatCache = { ...seatCache, [pnr.toUpperCase()]: seat };
  if (typeof window !== "undefined") window.localStorage.setItem(SEAT_KEY, JSON.stringify(seatCache));
  seatListeners.forEach((cb) => cb());
}
export function useSelectedSeat(pnr: string, fallback?: string) {
  const seat = useSyncExternalStore(
    subscribeSeats,
    () => getSeat(pnr),
    () => undefined,
  );
  return seat ?? fallback;
}
// -------------------------------------------------------------------------


const PASSENGER = APPS.find((a) => a.slug === "passenger-web")!;

/** Look up a page from platform-map by route path pattern. */
function findPage(matchPath: string) {
  for (const section of PASSENGER.sections) {
    for (const p of section.pages) {
      // platform-map uses paths like "/booking/seats", "/flights/:id"
      if (p.path === matchPath) return p;
    }
  }
  return null;
}

export const PASSENGER_NAV = PASSENGER.sections.flatMap((s) =>
  s.pages.map((p) => ({ group: s.group, ...p }))
);

export function ServicePill({ k }: { k: ServiceKey }) {
  const s = SERVICES[k];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{
        backgroundColor: `${s.hex}1f`,
        color: s.hex,
        border: `1px solid ${s.hex}55`,
      }}
    >
      {s.label}
    </span>
  );
}

export function PageHeader({
  title,
  blurb,
  crumbs,
}: {
  title: string;
  blurb: string;
  services?: ServiceKey[]; // accepted but ignored — no service pills in user-facing UI
  crumbs?: string[];
}) {
  return (
    <header className="border-b border-border px-8 py-6">
      {crumbs && (
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-foreground/50">
          {crumbs.join(" / ")}
        </div>
      )}
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-1 text-sm text-foreground/65">{blurb}</p>
    </header>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
        {label}
      </div>
      <div className={`mt-0.5 text-sm text-foreground ${mono ? "font-mono" : "font-medium"}`}>
        {value}
      </div>
    </div>
  );
}

/** Sample flights */
const FLIGHTS = [
  { id: "SW128", route: "LHR → JFK", dep: "08:30", arr: "11:45", price: "$612", dur: "7h 15m", stops: "Direct" },
  { id: "SW412", route: "LHR → JFK", dep: "11:00", arr: "14:20", price: "$548", dur: "7h 20m", stops: "Direct" },
  { id: "SW902", route: "LHR → JFK", dep: "18:45", arr: "22:10", price: "$489", dur: "7h 25m", stops: "Direct" },
  { id: "SW221", route: "LHR → JFK", dep: "21:30", arr: "01:05", price: "$425", dur: "7h 35m", stops: "1 stop · DUB" },
];

// ===================================================================
// Page renderers
// ===================================================================

export function HomePage() {
  return (
    <div>
      <section className="bg-accent px-6 pb-10 pt-10 text-white md:px-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Where do you want to fly next?
            </h1>
            <p className="mt-2 text-sm text-white/70">
              250+ destinations · best fares · instant booking
            </p>
          </div>
          <div className="flex gap-8 text-right">
            <div><div className="font-display text-2xl font-semibold">250+</div><div className="text-[11px] text-white/65">Destinations</div></div>
            <div><div className="font-display text-2xl font-semibold">98%</div><div className="text-[11px] text-white/65">On-time rate</div></div>
            <div><div className="font-display text-2xl font-semibold">4.8</div><div className="text-[11px] text-white/65">App rating</div></div>
          </div>
        </div>

        <HomeSearchCard />

      </section>

      <div className="space-y-8 px-6 py-8 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300">⏱</span>
            <div>
              <div className="text-sm font-semibold">Check-in open for SW-811 BOM → DXB</div>
              <div className="text-xs text-foreground/65">Your Jun 28 flight departs in 25 days — Web check-in closes 45 min before departure.</div>
            </div>
          </div>
          <Link to="/app/$" params={{ _splat: "check-in/SW9M2P" }} className="whitespace-nowrap text-sm font-medium text-accent">
            Check in now →
          </Link>
        </div>

        <section>
          <h2 className="mb-3 font-display text-xl font-semibold">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { icon: "✓", label: "Check-in", sub: "Open for SW-811", to: "check-in/SW9M2P" },
              { icon: "🎫", label: "Boarding pass", sub: "Download or save", to: "check-in/QX7A2K/boarding-pass" },
              { icon: "📡", label: "Track flight", sub: "Live status", to: "flight-status/SW128" },
              { icon: "✎", label: "Manage booking", sub: "Change, cancel, add bags", to: "my-trips/QX7A2K" },
              { icon: "★", label: "Miles & loyalty", sub: "42,580 miles · Gold", to: "loyalty" },
            ].map((a) => (
              <Link key={a.label} to="/app/$" params={{ _splat: a.to }} className="rounded-xl border border-border bg-card p-4 text-center transition-shadow hover:shadow-md">
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent">{a.icon}</div>
                <div className="text-sm font-semibold">{a.label}</div>
                <div className="mt-0.5 text-[11px] text-foreground/55">{a.sub}</div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Upcoming trip</h2>
            <Link to="/app/$" params={{ _splat: "my-trips" }} className="text-xs font-medium text-accent">All trips →</Link>
          </div>
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-display text-2xl font-semibold">BOM → DXB</div>
                <div className="text-xs text-foreground/55">Jun 28, 2026 · PNR: SW9M2P · SW-811</div>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-300">Check-in open</span>
            </div>
            <div className="mt-5 flex items-end gap-4">
              <div>
                <div className="font-display text-3xl font-bold">22:15</div>
                <div className="text-xs text-foreground/55">BOM T2</div>
              </div>
              <div className="flex flex-1 items-center gap-2 px-2">
                <div className="h-px flex-1 bg-border" />
                <span className="whitespace-nowrap text-xs text-foreground/55">3h 25m · Non-stop ✈</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="text-right">
                <div className="font-display text-3xl font-bold">00:40</div>
                <div className="text-xs text-foreground/55">DXB T3</div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { l: "Check-in", to: "check-in/SW9M2P" },
                { l: "Change seat", to: "booking/seats" },
                { l: "Add bags", to: "booking/extras" },
                { l: "Track", to: "flight-status/SW811" },
                { l: "Boarding pass", to: "check-in/SW9M2P/boarding-pass" },
              ].map((b) => (
                <Link key={b.l} to="/app/$" params={{ _splat: b.to }} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground/75 hover:bg-muted">
                  {b.l}
                </Link>
              ))}
            </div>
          </Card>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Popular routes from Delhi</h2>
            <Link to="/app/$" params={{ _splat: "search" }} className="text-xs font-medium text-accent">See all routes →</Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { code: "DEL → BOM", city: "Delhi · Mumbai",           freq: "14 flights/day", price: "₹3,199",  stop: "Non-stop" },
              { code: "DEL → DXB", city: "Delhi · Dubai",            freq: "6 flights/day",  price: "₹12,400", stop: "Non-stop" },
              { code: "DEL → LHR", city: "Delhi · London Heathrow",  freq: "3 flights/day",  price: "₹38,900", stop: "Non-stop" },
              { code: "DEL → BLR", city: "Delhi · Bengaluru",        freq: "10 flights/day", price: "₹2,850",  stop: "Non-stop" },
              { code: "DEL → SIN", city: "Delhi · Singapore Changi", freq: "5 flights/day",  price: "₹18,750", stop: "1 stop" },
              { code: "DEL → JFK", city: "Delhi · New York JFK",     freq: "2 flights/day",  price: "₹52,300", stop: "1 stop" },
            ].map((r) => {
              const key = r.code.replace(/\s|→/g, "").replace(/(.{3})(.{3})/, "$1-$2");
              return (
              <Link key={r.code} to="/app/$" params={{ _splat: `search/${key}` }} className="block">
              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display text-lg font-semibold">{r.code}</div>
                    <div className="text-xs text-foreground/55">{r.city}</div>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-foreground/65">{r.freq}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div><span className="text-xs text-foreground/55">from </span><span className="font-display text-lg font-semibold text-accent">{r.price}</span></div>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-foreground/65">{r.stop}</span>
                </div>
              </Card>
              </Link>
            );})}

          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Offers & upgrades for you</h2>
            <a href="#" className="text-xs font-medium text-accent">All offers →</a>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { tag: "💼", title: "Bid for business class · SW-811", body: "2 business seats remaining on your Jun 28 BOM → DXB flight. Bid from ₹8,500.", cta: "Bid from ₹8,500" },
              { tag: "★", title: "Redeem miles for a free flight", body: "You have 42,580 miles — enough for a free domestic flight. Expires Dec 2026.", cta: "42,580 miles available" },
              { tag: "☂", title: "Monsoon sale — up to 30% off", body: "Book by Jun 20 for travel Jul–Sep. Selected international routes.", cta: "Ends Jun 20" },
              { tag: "✦", title: "Gold lounge access — DEL T3", body: "As a Gold member, enjoy complimentary lounge access on international departures.", cta: "Gold benefit" },
            ].map((o) => (
              <Card key={o.title}>
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">{o.tag}</span>
                  <div className="flex-1">
                    <div className="font-semibold">{o.title}</div>
                    <div className="mt-0.5 text-xs text-foreground/65">{o.body}</div>
                    <span className="mt-3 inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-medium text-accent">{o.cta}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-xl font-semibold">Why fly SkyWay</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { icon: "⏱", title: "98% on-time",      sub: "Industry-leading punctuality across all routes" },
              { icon: "↻", title: "Fully flexible fares", sub: "Change or cancel up to 2h before departure" },
              { icon: "★", title: "Earn miles on every flight", sub: "Gold, Platinum and Elite tiers with lounge access" },
              { icon: "☎", title: "24/7 support",     sub: "Chat, call, or WhatsApp anytime" },
            ].map((w) => (
              <Card key={w.title} className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">{w.icon}</div>
                <div className="font-semibold">{w.title}</div>
                <div className="mt-1 text-xs text-foreground/65">{w.sub}</div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SearchField({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">{label}</div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
      <div className="text-[11px] text-foreground/55">{sub}</div>
    </div>
  );
}

// ===================================================================
// Flight data model (shared by search + detail)
// ===================================================================
type Airline = "SkyWay";

export type Flight = {
  id: string;
  airline: Airline;
  code: string;
  from: string;
  to: string;
  fromCity: string;
  toCity: string;
  depTerm: string;
  arrTerm: string;
  depMin: number;
  durMin: number;
  stops: 0 | 1 | 2;
  stopCity?: string;
  basePrice: number;
  aircraft: string;
  amenities: { wifi: boolean; meal: boolean; legroom: boolean; usb: boolean };
};

const ALL_FLIGHTS: Flight[] = [
  // DEL → BOM
  { id: "SW-204", airline: "SkyWay", code: "SkyWay SW-204", from: "DEL", to: "BOM", fromCity: "Delhi", toCity: "Mumbai", depTerm: "DEL T3", arrTerm: "BOM T2", depMin: 6*60, durMin: 130, stops: 0, basePrice: 3199, aircraft: "A320", amenities: { wifi: false, meal: false, legroom: true, usb: true } },
  { id: "SW-218", airline: "SkyWay", code: "SkyWay SW-218", from: "DEL", to: "BOM", fromCity: "Delhi", toCity: "Mumbai", depTerm: "DEL T2", arrTerm: "BOM T1", depMin: 8*60+30, durMin: 125, stops: 0, basePrice: 4850, aircraft: "A321", amenities: { wifi: true, meal: true, legroom: true, usb: true } },
  { id: "SW-412", airline: "SkyWay", code: "SkyWay SW-412", from: "DEL", to: "BOM", fromCity: "Delhi", toCity: "Mumbai", depTerm: "DEL T2", arrTerm: "BOM T1", depMin: 9*60+45, durMin: 235, stops: 1, stopCity: "LKO", basePrice: 2650, aircraft: "A320", amenities: { wifi: false, meal: false, legroom: false, usb: true } },
  { id: "SW-608", airline: "SkyWay", code: "SkyWay SW-608", from: "DEL", to: "BOM", fromCity: "Delhi", toCity: "Mumbai", depTerm: "DEL T3", arrTerm: "BOM T2", depMin: 11*60+50, durMin: 130, stops: 0, basePrice: 3550, aircraft: "A320", amenities: { wifi: false, meal: true, legroom: true, usb: true } },
  { id: "SW-306", airline: "SkyWay", code: "SkyWay SW-306", from: "DEL", to: "BOM", fromCity: "Delhi", toCity: "Mumbai", depTerm: "DEL T3", arrTerm: "BOM T2", depMin: 14*60+20, durMin: 135, stops: 0, basePrice: 5100, aircraft: "B737", amenities: { wifi: true, meal: true, legroom: true, usb: true } },
  { id: "SW-762", airline: "SkyWay", code: "SkyWay SW-762", from: "DEL", to: "BOM", fromCity: "Delhi", toCity: "Mumbai", depTerm: "DEL T3", arrTerm: "BOM T2", depMin: 16*60+35, durMin: 130, stops: 0, basePrice: 3890, aircraft: "A320neo", amenities: { wifi: true, meal: false, legroom: true, usb: true } },
  { id: "SW-844", airline: "SkyWay", code: "SkyWay SW-844", from: "DEL", to: "BOM", fromCity: "Delhi", toCity: "Mumbai", depTerm: "DEL T3", arrTerm: "BOM T2", depMin: 19*60+10, durMin: 135, stops: 0, basePrice: 4120, aircraft: "A321", amenities: { wifi: true, meal: true, legroom: true, usb: true } },
  { id: "SW-902", airline: "SkyWay", code: "SkyWay SW-902", from: "DEL", to: "BOM", fromCity: "Delhi", toCity: "Mumbai", depTerm: "DEL T2", arrTerm: "BOM T1", depMin: 21*60, durMin: 130, stops: 0, basePrice: 3690, aircraft: "A320", amenities: { wifi: false, meal: true, legroom: false, usb: true } },
  // DEL → DXB
  { id: "SW-811", airline: "SkyWay", code: "SkyWay SW-811", from: "DEL", to: "DXB", fromCity: "Delhi", toCity: "Dubai", depTerm: "DEL T3", arrTerm: "DXB T3", depMin: 4*60+30, durMin: 220, stops: 0, basePrice: 12400, aircraft: "B787", amenities: { wifi: true, meal: true, legroom: true, usb: true } },
  { id: "SW-833", airline: "SkyWay", code: "SkyWay SW-833", from: "DEL", to: "DXB", fromCity: "Delhi", toCity: "Dubai", depTerm: "DEL T3", arrTerm: "DXB T3", depMin: 22*60+15, durMin: 210, stops: 0, basePrice: 13800, aircraft: "B787", amenities: { wifi: true, meal: true, legroom: true, usb: true } },
  // DEL → BLR
  { id: "SW-501", airline: "SkyWay", code: "SkyWay SW-501", from: "DEL", to: "BLR", fromCity: "Delhi", toCity: "Bengaluru", depTerm: "DEL T3", arrTerm: "BLR T2", depMin: 7*60, durMin: 165, stops: 0, basePrice: 2850, aircraft: "A320", amenities: { wifi: false, meal: true, legroom: true, usb: true } },
  { id: "SW-521", airline: "SkyWay", code: "SkyWay SW-521", from: "DEL", to: "BLR", fromCity: "Delhi", toCity: "Bengaluru", depTerm: "DEL T3", arrTerm: "BLR T2", depMin: 12*60, durMin: 170, stops: 0, basePrice: 2950, aircraft: "A320neo", amenities: { wifi: true, meal: false, legroom: true, usb: true } },
  { id: "SW-547", airline: "SkyWay", code: "SkyWay SW-547", from: "DEL", to: "BLR", fromCity: "Delhi", toCity: "Bengaluru", depTerm: "DEL T3", arrTerm: "BLR T2", depMin: 18*60+40, durMin: 165, stops: 0, basePrice: 3100, aircraft: "A320", amenities: { wifi: true, meal: true, legroom: true, usb: true } },
  // DEL → LHR / SIN / JFK
  { id: "SW-701", airline: "SkyWay", code: "SkyWay SW-701", from: "DEL", to: "LHR", fromCity: "Delhi", toCity: "London", depTerm: "DEL T3", arrTerm: "LHR T2", depMin: 13*60+40, durMin: 555, stops: 0, basePrice: 38900, aircraft: "B787", amenities: { wifi: true, meal: true, legroom: true, usb: true } },
  { id: "SW-919", airline: "SkyWay", code: "SkyWay SW-919", from: "DEL", to: "SIN", fromCity: "Delhi", toCity: "Singapore", depTerm: "DEL T3", arrTerm: "SIN T1", depMin: 23*60+15, durMin: 340, stops: 0, basePrice: 18750, aircraft: "A350", amenities: { wifi: true, meal: true, legroom: true, usb: true } },
  { id: "SW-102", airline: "SkyWay", code: "SkyWay SW-102", from: "DEL", to: "JFK", fromCity: "Delhi", toCity: "New York", depTerm: "DEL T3", arrTerm: "JFK T4", depMin: 2*60+10, durMin: 900, stops: 1, stopCity: "FRA", basePrice: 52300, aircraft: "B777", amenities: { wifi: true, meal: true, legroom: true, usb: true } },
];

function minToHHMM(m: number) {
  const t = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
function durLabel(m: number) {
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}
function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

const DATE_STRIP_BASE = [
  { d: "Jun 12", key: "12", mult: 0.90 },
  { d: "Jun 13", key: "13", mult: 0.83 },
  { d: "Jun 14", key: "14", mult: 0.97 },
  { d: "Jun 15", key: "15", mult: 1.00 },
  { d: "Jun 16", key: "16", mult: 1.08 },
  { d: "Jun 17", key: "17", mult: 1.31 },
  { d: "Jun 18", key: "18", mult: 1.22 },
];

const SORT_TABS = ["Best", "Cheapest", "Fastest", "Departure", "Arrival"] as const;
type SortKey = typeof SORT_TABS[number];

const TIME_BUCKETS = [
  { l: "Early morning", s: "00–06", from: 0,     to: 6*60  },
  { l: "Morning",       s: "06–12", from: 6*60,  to: 12*60 },
  { l: "Afternoon",     s: "12–18", from: 12*60, to: 18*60 },
  { l: "Evening",       s: "18–24", from: 18*60, to: 24*60 },
];

function priceForFlight(f: Flight, dateMult: number) {
  return Math.round(f.basePrice * dateMult);
}

// Exposed for FlightDetailPage
export function getFlightById(id: string): Flight | undefined {
  return ALL_FLIGHTS.find((f) => f.id === id);
}

// ===================================================================
// Home search card (One-way / Round-trip / Multi-city)
// ===================================================================
function HomeSearchCard() {
  const [trip, setTrip] = useState<"one" | "round" | "multi">("one");
  const [legs, setLegs] = useState([
    { from: "Delhi (DEL)", to: "Mumbai (BOM)", date: "Jun 15, 2026" },
    { from: "Mumbai (BOM)", to: "Bengaluru (BLR)", date: "Jun 20, 2026" },
  ]);
  const addLeg = () => setLegs((p) => [...p, { from: "Bengaluru (BLR)", to: "Delhi (DEL)", date: "Jun 25, 2026" }]);
  const removeLeg = (i: number) => setLegs((p) => p.filter((_, idx) => idx !== i));

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-foreground shadow-xl">
      <div className="mb-4 flex gap-2 text-sm">
        {([["one", "One-way"], ["round", "Round-trip"], ["multi", "Multi-city"]] as const).map(([k, l]) => (
          <button
            key={k}
            data-quiet
            onClick={() => setTrip(k)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium ${trip === k ? "bg-accent text-white" : "text-foreground/65 hover:bg-muted"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {trip !== "multi" ? (
        <div className={`grid gap-3 ${trip === "round" ? "md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]" : "md:grid-cols-[1fr_1fr_1fr_1fr_auto]"}`}>
          <SearchField label="From" value="Delhi (DEL)" sub="Indira Gandhi Intl" />
          <SearchField label="To" value="Mumbai (BOM)" sub="Chhatrapati Shivaji" />
          <SearchField label="Depart" value="Jun 15, 2026" sub="Sunday · 3 days away" />
          {trip === "round" && <SearchField label="Return" value="Jun 22, 2026" sub="Sunday · 10 days away" />}
          <SearchField label="Passengers & cabin" value="1 adult" sub="Economy · Flexible fare" />
          <Link to="/app/$" params={{ _splat: "search" }} className="flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-medium text-white hover:opacity-90">
            ✈ Search flights
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {legs.map((leg, i) => (
            <div key={i} className="grid gap-3 md:grid-cols-[80px_1fr_1fr_1fr_auto]">
              <div className="flex items-center text-xs font-semibold text-foreground/60">Flight {i + 1}</div>
              <SearchField label="From" value={leg.from} sub="Airport" />
              <SearchField label="To" value={leg.to} sub="Airport" />
              <SearchField label="Depart" value={leg.date} sub="Date" />
              {legs.length > 2 && (
                <button data-quiet onClick={() => removeLeg(i)} className="text-xs text-foreground/50 hover:text-destructive">Remove</button>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between">
            <button data-quiet onClick={addLeg} className="text-xs font-medium text-accent hover:underline">+ Add another flight</button>
            <Link to="/app/$" params={{ _splat: "search" }} className="rounded-xl bg-accent px-5 py-3 text-sm font-medium text-white hover:opacity-90">
              ✈ Search flights
            </Link>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-5 text-xs text-foreground/65">
        <label className="flex items-center gap-2"><input type="checkbox" /> Flexible dates</label>
        <label className="flex items-center gap-2"><input type="checkbox" /> Flexible destination</label>
        <label className="flex items-center gap-2"><input type="checkbox" /> Include nearby airports</label>
        <label className="flex items-center gap-2"><input type="checkbox" /> Student / senior fare</label>
      </div>
    </div>
  );
}

// ===================================================================
// Search results — filters, dates, sort, load more all functional
// ===================================================================
export function SearchResultsPage({ routeKey }: { routeKey?: string }) {
  // parse "DEL-BOM" → { from, to }; default DEL-BOM
  const parsed = (() => {
    if (routeKey && /^[A-Z]{3}-[A-Z]{3}$/.test(routeKey)) {
      const [f, t] = routeKey.split("-");
      return { from: f, to: t };
    }
    return { from: "DEL", to: "BOM" };
  })();

  const [dateKey, setDateKey] = useState("15");
  const [stops, setStops] = useState<Set<0 | 1 | 2>>(new Set([0, 1, 2]));
  const [priceMax, setPriceMax] = useState<number>(80000);
  const [times, setTimes] = useState<Set<string>>(new Set(TIME_BUCKETS.map((t) => t.l)));
  
  const [durMaxHrs, setDurMaxHrs] = useState<number>(20);
  const [cabin, setCabin] = useState<"Economy" | "Business" | "First">("Economy");
  const [amenities, setAmenities] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortKey>("Best");
  const [visible, setVisible] = useState(4);

  const dateMult = DATE_STRIP_BASE.find((d) => d.key === dateKey)?.mult ?? 1;
  const cabinMult = cabin === "Business" ? 3.3 : cabin === "First" ? 5.5 : 1;

  const routeFlights = ALL_FLIGHTS.filter((f) => f.from === parsed.from && f.to === parsed.to);

  const filtered = routeFlights
    .map((f) => ({ f, price: Math.round(priceForFlight(f, dateMult) * cabinMult) }))
    .filter(({ f, price }) => {
      if (!stops.has(f.stops)) return false;
      if (price > priceMax) return false;
      const bucket = TIME_BUCKETS.find((b) => f.depMin >= b.from && f.depMin < b.to);
      if (bucket && !times.has(bucket.l)) return false;
      
      if (f.durMin > durMaxHrs * 60) return false;
      if (amenities.has("Wi-Fi on board") && !f.amenities.wifi) return false;
      if (amenities.has("Meal included") && !f.amenities.meal) return false;
      if (amenities.has("Extra legroom") && !f.amenities.legroom) return false;
      if (amenities.has("USB charging") && !f.amenities.usb) return false;
      return true;
    });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "Cheapest":  return a.price - b.price;
      case "Fastest":   return a.f.durMin - b.f.durMin;
      case "Departure": return a.f.depMin - b.f.depMin;
      case "Arrival":   return (a.f.depMin + a.f.durMin) - (b.f.depMin + b.f.durMin);
      case "Best":
      default:          return (a.price * 0.7 + a.f.durMin * 10) - (b.price * 0.7 + b.f.durMin * 10);
    }
  });

  const toShow = sorted.slice(0, visible);
  const remaining = Math.max(0, sorted.length - visible);

  // cheapest date in strip for highlighting
  const cheapestKey = [...DATE_STRIP_BASE].sort((a, b) => a.mult - b.mult)[0].key;


  const stopCounts = { 0: 0, 1: 0, 2: 0 } as Record<0 | 1 | 2, number>;
  routeFlights.forEach((f) => stopCounts[f.stops]++);

  const resetAll = () => {
    setStops(new Set([0, 1, 2]));
    setPriceMax(80000);
    setTimes(new Set(TIME_BUCKETS.map((t) => t.l)));
    
    setDurMaxHrs(20);
    setCabin("Economy");
    setAmenities(new Set());
    setSortBy("Best");
    setVisible(4);
  };

  const toggle = <T,>(set: Set<T>, v: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(v)) {
      next.delete(v);
    } else {
      next.add(v);
    }
    setter(next);
    setVisible(4);
  };

  return (
    <div className="bg-background text-foreground">
      <div className="border-b border-border bg-muted/30">
        <div className="flex flex-wrap items-center gap-3 px-6 py-4">
          <div className="flex items-baseline gap-3 rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm">
            <span className="font-display text-lg font-semibold tracking-tight">{parsed.from} → {parsed.to}</span>
            <span className="text-sm text-foreground/55">|</span>
            <span className="text-sm text-foreground/70">{DATE_STRIP_BASE.find((d) => d.key === dateKey)?.d} · 1 adult · {cabin}</span>
          </div>
          <div className="ml-auto text-xs text-foreground/55">{sorted.length} results · prices include taxes</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[280px_1fr]">
        {/* Filters */}
        <aside className="space-y-5 rounded-2xl border border-border bg-card p-5 h-fit lg:sticky lg:top-20">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Filters</h2>
            <button data-quiet onClick={resetAll} className="text-xs font-medium text-accent hover:underline">Reset all</button>
          </div>

          <FilterGroup label="Stops">
            {[0, 1, 2].map((n) => (
              <CheckRow
                key={n}
                label={n === 0 ? "Non-stop only" : n === 1 ? "1 stop" : "2+ stops"}
                count={stopCounts[n as 0 | 1 | 2]}
                checked={stops.has(n as 0 | 1 | 2)}
                onChange={() => toggle(stops, n as 0 | 1 | 2, setStops)}
              />
            ))}
          </FilterGroup>

          <FilterGroup label={`Price up to ${inr(priceMax)}`}>
            <input
              type="range"
              min={1000}
              max={80000}
              step={500}
              value={priceMax}
              onChange={(e) => { setPriceMax(Number(e.target.value)); setVisible(4); }}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-[11px] text-foreground/55">
              <span>₹1,000</span><span>Up to {inr(priceMax)}</span>
            </div>
          </FilterGroup>

          <FilterGroup label="Departure time">
            <div className="flex flex-wrap gap-2">
              {TIME_BUCKETS.map((b) => {
                const on = times.has(b.l);
                return (
                  <button
                    key={b.l}
                    data-quiet
                    onClick={() => toggle(times, b.l, setTimes)}
                    className={`rounded-full border px-3 py-1.5 text-left text-[11px] leading-tight ${on ? "border-accent bg-accent/10 text-accent" : "border-border text-foreground/70 hover:bg-muted"}`}
                  >
                    <div className="font-medium">{b.l}</div>
                    <div className="text-[10px] opacity-70">{b.s}</div>
                  </button>
                );
              })}
            </div>
          </FilterGroup>


          <FilterGroup label={`Duration up to ${durMaxHrs}h`}>
            <input
              type="range"
              min={2}
              max={20}
              step={1}
              value={durMaxHrs}
              onChange={(e) => { setDurMaxHrs(Number(e.target.value)); setVisible(4); }}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-[11px] text-foreground/55">
              <span>2h</span><span>Up to {durMaxHrs}h</span>
            </div>
          </FilterGroup>

          <FilterGroup label="Cabin class">
            <div className="flex flex-wrap gap-2">
              {(["Economy", "Business", "First"] as const).map((c) => (
                <button
                  key={c}
                  data-quiet
                  onClick={() => { setCabin(c); setVisible(4); }}
                  className={`rounded-full px-3 py-1 text-xs ${cabin === c ? "bg-accent/15 text-accent ring-1 ring-accent/30" : "border border-border text-foreground/70 hover:bg-muted"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="Amenities">
            {["Wi-Fi on board", "Meal included", "Extra legroom", "USB charging"].map((a) => (
              <CheckRow
                key={a}
                label={a}
                checked={amenities.has(a)}
                onChange={() => toggle(amenities, a, setAmenities)}
              />
            ))}
          </FilterGroup>
        </aside>

        {/* Results */}
        <div className="space-y-4">
          {/* Date strip */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {DATE_STRIP_BASE.map((d) => {
              const active = d.key === dateKey;
              const cheapest = d.key === cheapestKey;
              const min = routeFlights.length
                ? Math.min(...routeFlights.map((f) => Math.round(priceForFlight(f, d.mult) * cabinMult)))
                : 0;
              return (
                <button
                  key={d.d}
                  data-quiet
                  onClick={() => { setDateKey(d.key); setVisible(4); }}
                  className={`flex min-w-[110px] flex-col items-start rounded-xl border px-4 py-2.5 text-left transition-colors ${
                    active ? "border-accent bg-accent/10"
                      : cheapest ? "border-emerald-500/40 hover:bg-muted"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <span className="text-xs text-foreground/65">{d.d}</span>
                  <span className={`font-display text-base font-semibold ${cheapest && !active ? "text-emerald-500" : active ? "text-accent" : ""}`}>
                    {inr(min)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sort bar */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-2">
            <span className="mr-1 text-xs font-medium text-foreground/60">Sort by</span>
            {SORT_TABS.map((s) => (
              <button
                key={s}
                data-quiet
                onClick={() => setSortBy(s)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  sortBy === s ? "border border-border bg-muted text-foreground" : "text-foreground/65 hover:bg-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {toShow.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-foreground/60">
              No flights match your filters. Try widening the price range or clearing airline filters.
            </div>
          )}

          {toShow.map(({ f, price }) => (
            <FlightResultCard key={f.id} f={f} price={price} cabin={cabin} />
          ))}

          {remaining > 0 && (
            <button
              data-quiet
              onClick={() => setVisible((v) => v + 4)}
              className="mx-auto block rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-medium text-foreground/75 hover:bg-muted"
            >
              Load more results ({remaining} left)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 border-t border-border pt-4 first-of-type:border-0 first-of-type:pt-0">
      <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">{label}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function CheckRow({ label, count, checked, onChange }: { label: string; count?: number; checked?: boolean; onChange?: () => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between text-sm">
      <span className="flex items-center gap-2">
        <input type="checkbox" checked={!!checked} onChange={onChange} className="h-3.5 w-3.5 accent-accent" />
        <span className="text-foreground/85">{label}</span>
      </span>
      {count !== undefined && <span className="text-xs text-foreground/50">{count}</span>}
    </label>
  );
}

function FlightResultCard({ f, price, cabin }: { f: Flight; price: number; cabin: string }) {
  const arrMin = f.depMin + f.durMin;
  const nextDay = arrMin >= 1440;
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-1 items-center gap-4 p-5 md:grid-cols-[1fr_auto]">
        <div>
          <div className="flex items-center gap-5">
            <div>
              <div className="font-display text-3xl font-semibold leading-none">{minToHHMM(f.depMin)}</div>
              <div className="mt-1 text-xs text-foreground/55">{f.depTerm}</div>
            </div>
            <div className="flex flex-1 flex-col items-center px-2">
              <div className="text-xs text-foreground/55">{durLabel(f.durMin)}</div>
              <div className="my-2 flex w-full items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
                <span className="h-px flex-1 bg-foreground/15" />
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
              </div>
              <div className="text-xs text-foreground/55">
                {f.stops === 0 ? "Non-stop" : `${f.stops} stop`}{f.stopCity && ` · ${f.stopCity}`}
              </div>
            </div>
            <div>
              <div className="font-display text-3xl font-semibold leading-none">
                {minToHHMM(arrMin)}{nextDay && <span className="ml-1 text-xs align-super text-foreground/50">+1</span>}
              </div>
              <div className="mt-1 text-xs text-foreground/55">{f.arrTerm}</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground/85">{f.code}</span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-foreground/70 ring-1 ring-border">{f.aircraft}</span>
            {f.amenities.wifi &&    <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-medium text-sky-500 ring-1 ring-sky-500/25">Wi-Fi</span>}
            {f.amenities.meal &&    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-500 ring-1 ring-emerald-500/25">Meal</span>}
            {f.amenities.legroom && <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent ring-1 ring-accent/25">Legroom</span>}
          </div>
        </div>

        <div className="flex flex-row items-end justify-between gap-4 md:flex-col md:items-end">
          <div className="text-right">
            <div className="font-display text-2xl font-semibold text-accent">{inr(price)}</div>
            <div className="text-[11px] text-foreground/55">per adult · {cabin.toLowerCase()}</div>
          </div>
          <Link
            to="/app/$"
            params={{ _splat: `flights/${f.id}` }}
            className="rounded-lg border border-border bg-background px-5 py-2 text-sm font-medium hover:bg-muted"
          >
            Select
          </Link>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// Fare tiers + add-ons (used by FlightDetailPage)
// ===================================================================
type FareTier = {
  key: "saver" | "flex" | "business";
  name: string;
  mult: number;
  badge?: string;
  included: string[];
  excluded: string[];
};

const FARE_TIERS: FareTier[] = [
  { key: "saver",    name: "Saver",    mult: 0.79, included: ["7kg cabin bag", "Seat for ₹299+"], excluded: ["Date changes", "Cancellation", "Check-in bag", "Meal"] },
  { key: "flex",     name: "Flex",     mult: 1.00, badge: "Most popular", included: ["Free date change (once)", "50% refund if cancelled", "7kg cabin bag", "23kg check-in bag", "Meal included", "Free standard seat"], excluded: [] },
  { key: "business", name: "Business", mult: 3.28, included: ["Free date change (any)", "Full refund anytime", "7kg cabin + priority", "32kg check-in bag", "Premium multi-course meal", "Lounge access"], excluded: [] },
];

type AddOn = { id: string; name: string; note: string; price: number; cta: string };
const ADDONS: AddOn[] = [
  { id: "bag",  name: "Extra check-in bag (23kg)",     note: "Add a second checked bag",              price: 1200, cta: "Add" },
  { id: "leg",  name: "Extra legroom seat",            note: 'Rows 1–3 · 34" pitch · bulkhead',       price: 799,  cta: "Add" },
  { id: "wifi", name: "In-flight Wi-Fi",               note: "Unlimited · full flight",                price: 699,  cta: "Add" },
  { id: "up",   name: "Bid for upgrade to Business",   note: "2 seats remaining · min bid ₹8,500",     price: 8500, cta: "Bid" },
  { id: "ins",  name: "Travel insurance",              note: "Medical, cancellation & delay cover",    price: 349,  cta: "Add" },
];

function AddOnRow({ a, added, onToggle }: { a: AddOn; added: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <input type="checkbox" checked={added} onChange={onToggle} className="h-4 w-4 accent-accent" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{a.name}</div>
        <div className="truncate text-xs text-foreground/55">{a.note}</div>
      </div>
      <div className="whitespace-nowrap text-sm font-semibold text-accent">{inr(a.price)}</div>
      <button
        data-quiet
        onClick={onToggle}
        className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ${added ? "bg-emerald-500/15 text-emerald-600" : "border border-border hover:bg-muted"}`}
      >
        {added ? "✓ Added" : a.cta}
      </button>
    </div>
  );
}

// ===================================================================
// Flight detail — fare + add-ons flow into price summary
// ===================================================================
export function FlightDetailPage({ id }: { id: string }) {
  const flight = getFlightById(id) ?? ALL_FLIGHTS[1];
  const [selected, setSelected] = useState<FareTier["key"]>("flex");
  const [tab, setTab] = useState<"add-ons" | "fare-policy" | "aircraft">("add-ons");
  const [addOns, setAddOns] = useState<Set<string>>(new Set());

  const fares: (FareTier & { priceNum: number })[] = FARE_TIERS.map((t) => ({
    ...t,
    priceNum: Math.round(flight.basePrice * t.mult),
  }));
  const sel = fares.find((f) => f.key === selected)!;

  const depHH = minToHHMM(flight.depMin);
  const arrHH = minToHHMM(flight.depMin + flight.durMin);
  const addOnTotal = ADDONS.filter((a) => addOns.has(a.id)).reduce((s, a) => s + a.price, 0);
  const taxes = Math.round(sel.priceNum * 0.10);
  const total = sel.priceNum + addOnTotal + taxes;

  return (
    <div className="px-6 py-6">
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <Link to="/app/$" params={{ _splat: `search/${flight.from}-${flight.to}` }} className="text-foreground/70 hover:text-foreground">
          ← Back to results
        </Link>
        <span className="hidden text-foreground/40 md:inline">·</span>
        <span className="font-medium">{flight.from} → {flight.to} · 15 Jun · 1 adult</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Flight hero */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 to-sky-700 p-6 text-white shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="text-sm font-medium opacity-90">{flight.code} · Wed 15 Jun 2026</div>
              <div className="flex flex-wrap justify-end gap-2 text-[11px] font-medium">
                <span className="rounded-md bg-white/15 px-2.5 py-1 backdrop-blur-sm">Economy</span>
                <span className="rounded-md bg-white/15 px-2.5 py-1 backdrop-blur-sm">{flight.aircraft}</span>
                <span className="rounded-md bg-white/15 px-2.5 py-1 backdrop-blur-sm">{flight.stops === 0 ? "Non-stop" : `${flight.stops} stop`}</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-[auto_1fr_auto] items-center gap-4">
              <div>
                <div className="font-display text-5xl font-light tracking-tight">{depHH}</div>
                <div className="mt-1 text-xs font-semibold tracking-wider opacity-85">{flight.from}</div>
                <div className="text-xs opacity-70">{flight.depTerm}</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-[11px] font-medium opacity-85">{durLabel(flight.durMin)}</div>
                <div className="my-2 flex w-full items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                  <span className="h-px flex-1 bg-white/30" />
                  <span className="opacity-85">✈</span>
                  <span className="h-px flex-1 bg-white/30" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                </div>
                <div className="text-[11px] opacity-75">{flight.stops === 0 ? "Non-stop · on time" : `${flight.stops} stop · via ${flight.stopCity}`}</div>
              </div>
              <div className="text-right">
                <div className="font-display text-5xl font-light tracking-tight">{arrHH}</div>
                <div className="mt-1 text-xs font-semibold tracking-wider opacity-85">{flight.to}</div>
                <div className="text-xs opacity-70">{flight.arrTerm}</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-white/15 pt-4 text-xs sm:grid-cols-4">
              {[
                ["Check-in:", `${flight.depTerm} or online`],
                ["Boarding:", minToHHMM(flight.depMin - 35)],
                ["Gate:", "A07 (subject to change)"],
                ["Wi-Fi", flight.amenities.wifi ? "available" : "not available"],
              ].map(([l, v]) => (
                <div key={l}>
                  <div className="opacity-70">{l}</div>
                  <div className="mt-0.5 font-medium">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Fare picker */}
          <div>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-foreground/55">Choose your fare</div>
            <div className="grid gap-3 sm:grid-cols-3">
              {fares.map((f) => {
                const isSelected = selected === f.key;
                return (
                  <div
                    key={f.key}
                    className={`relative rounded-xl border p-4 transition-all ${
                      isSelected ? "border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/30" : "border-border bg-card hover:border-foreground/20"
                    }`}
                  >
                    {f.badge && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                        {f.badge}
                      </div>
                    )}
                    <div className="text-base font-semibold">{f.name}</div>
                    <div className="mt-1 font-display text-2xl font-semibold text-accent">{inr(f.priceNum)}</div>
                    <ul className="mt-4 space-y-1.5 text-xs text-foreground/80">
                      {f.included.map((i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="mt-0.5 inline-flex h-3.5 w-3.5 flex-none items-center justify-center rounded-sm bg-emerald-500/20 text-[10px] text-emerald-600">✓</span>
                          {i}
                        </li>
                      ))}
                      {f.excluded.map((i) => (
                        <li key={i} className="flex items-start gap-1.5 text-foreground/40 line-through">
                          <span className="mt-0.5 inline-flex h-3.5 w-3.5 flex-none items-center justify-center rounded-sm bg-muted text-[10px] no-underline">✕</span>
                          {i}
                        </li>
                      ))}
                    </ul>
                    <button
                      data-quiet
                      onClick={() => setSelected(f.key)}
                      className={`mt-5 w-full rounded-md py-2 text-xs font-semibold transition-colors ${
                        isSelected ? "bg-emerald-500/15 text-emerald-600" : "border border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {isSelected ? "Selected" : `Select ${f.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {([
              ["add-ons", "Add-ons"],
              ["fare-policy", "Fare policy"],
              ["aircraft", "Aircraft & seats"],
            ] as const).map(([k, label]) => (
              <button
                key={k}
                data-quiet onClick={() => setTab(k)}
                className={`rounded-md border px-3.5 py-1.5 text-xs font-medium ${
                  tab === k ? "border-accent bg-accent/10 text-accent" : "border-border text-foreground/70 hover:bg-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "add-ons" && (
            <div className="divide-y divide-border rounded-xl border border-border bg-card">
              {ADDONS.map((a) => (
                <AddOnRow
                  key={a.id}
                  a={a}
                  added={addOns.has(a.id)}
                  onToggle={() => {
                    const next = new Set(addOns);
                    if (next.has(a.id)) {
                      next.delete(a.id);
                    } else {
                      next.add(a.id);
                    }
                    setAddOns(next);
                  }}
                />
              ))}
            </div>
          )}
          {tab === "fare-policy" && (
            <Card>
              <div className="text-sm text-foreground/75">
                {sel.name} fares: {sel.included.join(" · ")}.
              </div>
            </Card>
          )}
          {tab === "aircraft" && (
            <Card>
              <div className="text-sm text-foreground/75">
                {flight.aircraft} · 3-3 layout. Recline 3", pitch 30" standard / 34" extra-legroom rows 1–3 and exit row 14. USB-A at every seat. Wi-Fi {flight.amenities.wifi ? "available" : "not available"}.
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
            <span className="font-semibold">Only 6 {sel.name} seats left</span> at this price. Fare may increase.
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="text-sm font-semibold">Price summary</div>
            <div className="mt-3 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2.5">
              <div className="text-sm font-semibold text-accent">{flight.from} → {flight.to}</div>
              <div className="mt-0.5 text-[11px] text-foreground/65">{flight.code} · 15 Jun · {depHH} → {arrHH}</div>
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2 py-1 text-[11px] font-medium text-emerald-600">
              ✓ {sel.name} fare selected
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-foreground/70">{sel.name} fare (1 adult)</span><span className="font-medium">{inr(sel.priceNum)}</span></div>
              {ADDONS.filter((a) => addOns.has(a.id)).map((a) => (
                <div key={a.id} className="flex justify-between">
                  <span className="text-foreground/70">{a.name}</span>
                  <span className="font-medium">+{inr(a.price)}</span>
                </div>
              ))}
              <div className="flex justify-between"><span className="text-foreground/70">Taxes & fees</span><span className="font-medium">{inr(taxes)}</span></div>
              <div className="my-2 border-t border-border" />
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold">Total</span>
                <span className="font-display text-2xl font-semibold text-accent">{inr(total)}</span>
              </div>
            </div>
          </div>

          <Link to="/app/$" params={{ _splat: "booking/seats" }} className="block rounded-xl bg-accent py-3 text-center text-sm font-semibold text-white hover:opacity-90 transition-opacity">
            Continue to passenger details ↗
          </Link>
          <button
            type="button"
            onClick={() => toast.success("Flight SW-128 saved to your saved trips & wishlist!")}
            className="block w-full rounded-xl border border-border py-3 text-center text-sm font-medium hover:bg-muted transition-colors"
          >
            Save for later
          </button>
          <div className="px-1 text-[11px] text-foreground/55">
            🔒 Secure checkout · PCI-DSS · price locked for 15 min
          </div>
        </aside>
      </div>
    </div>
  );
}


// ===================================================================
// Shared booking step header
// ===================================================================
function BookingSteps({ current }: { current: number }) {
  const steps = ["Flight", "Fare", "Seats", "Passengers", "Extras", "Pay"];
  return (
    <div className="border-b border-border bg-card/40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/app" className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground">
          <span aria-hidden>←</span> Back
        </Link>
        <ol className="hidden items-center gap-2 text-xs font-medium md:flex">
          {steps.map((label, i) => {
            const n = i + 1;
            const state = n < current ? "done" : n === current ? "active" : "todo";
            return (
              <li key={label} className="flex items-center gap-2">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    state === "done"
                      ? "bg-emerald-500/15 text-emerald-500"
                      : state === "active"
                      ? "bg-accent text-white"
                      : "bg-muted text-foreground/50"
                  }`}
                >
                  {state === "done" ? "✓" : n}
                </span>
                <span className={state === "todo" ? "text-foreground/50" : state === "active" ? "text-accent" : "text-foreground/75"}>
                  {label}
                </span>
                {n < steps.length && <span className="text-foreground/20">·</span>}
              </li>
            );
          })}
        </ol>
        <span className="text-xs text-foreground/50">⋯</span>
      </div>
    </div>
  );
}

// ===================================================================
// Seat selection
// ===================================================================
type SeatKind = "business" | "legroom" | "available" | "taken" | "selected";

function seatStyle(kind: SeatKind) {
  switch (kind) {
    case "business":
      return "bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30";
    case "legroom":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30";
    case "available":
      return "bg-muted/60 text-foreground/70 border border-border hover:border-accent/60";
    case "taken":
      return "bg-transparent text-foreground/25 border border-dashed border-border cursor-not-allowed";
    case "selected":
      return "bg-accent text-white border border-accent shadow";
  }
}

function ZoneBadge({ label, tone }: { label: string; tone: "business" | "legroom" | "economy" }) {
  const cls =
    tone === "business"
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30"
      : tone === "legroom"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30"
      : "bg-accent/15 text-accent border-accent/30";
  return (
    <div className="flex justify-center">
      <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${cls}`}>{label}</span>
    </div>
  );
}

function SeatRow({
  row,
  kindFor,
  selected,
  onPick,
}: {
  row: number;
  kindFor: (row: number, col: string) => SeatKind;
  selected: string;
  onPick: (id: string) => void;
}) {
  const cols = ["A", "B", "C", "D", "E", "F"];
  return (
    <div className="flex items-center justify-center gap-1.5">
      <span className="w-5 text-right font-mono text-[10px] text-foreground/45">{row}</span>
      {cols.map((c, idx) => {
        const id = `${row}${c}`;
        const baseKind = kindFor(row, c);
        const kind: SeatKind = id === selected ? "selected" : baseKind;
        const isTaken = kind === "taken";
        return (
          <span key={c} className="flex items-center">
            {idx === 3 && <span className="mx-1.5 w-2" />}
            <button
              type="button"
              disabled={isTaken}
              onClick={() => onPick(id)}
              className={`flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-semibold transition ${seatStyle(kind)}`}
            >
              {c}
            </button>
          </span>
        );
      })}
    </div>
  );
}

export function SeatMapPage({ pnr, returnTo }: { pnr?: string; returnTo?: string } = {}) {
  const persisted = pnr ? getSeat(pnr) : undefined;
  const [selected, setSelected] = useState(persisted ?? "14A");

  const businessRows = [1, 2, 3, 4, 5, 6];
  const legroomRows = [7, 8, 9, 10, 11, 12, 13];
  const economyRows = Array.from({ length: 13 }, (_, i) => i + 14);
  const taken = new Set(["1B", "1E", "2C", "3D", "4A", "4D", "6E", "8D", "10A", "11D", "12F", "16A", "19D", "22C"]);

  const filters = ["All seats", "Window", "Aisle", "Extra legroom", "Front of cabin", "Near exit"];
  const [activeFilter, setActiveFilter] = useState("All seats");

  const matchesFilter = (row: number, col: string) => {
    const isWindow = col === "A" || col === "F";
    const isAisle = col === "C" || col === "D";
    if (activeFilter === "All seats") return true;
    if (activeFilter === "Window") return isWindow;
    if (activeFilter === "Aisle") return isAisle;
    if (activeFilter === "Extra legroom") return legroomRows.includes(row);
    if (activeFilter === "Front of cabin") return row <= 6;
    if (activeFilter === "Near exit") return row === 14 || row === 15;
    return true;
  };

  const kindFor = (row: number, col: string): SeatKind => {
    if (taken.has(`${row}${col}`)) return "taken";
    if (!matchesFilter(row, col)) return "taken";
    if (businessRows.includes(row)) return "business";
    if (legroomRows.includes(row)) return "legroom";
    return "available";
  };


  const seatMeta = (id: string) => {
    const row = parseInt(id);
    const col = id.slice(-1);
    const zone = businessRows.includes(row) ? "Business" : legroomRows.includes(row) ? "Extra legroom" : "Economy";
    const features = [col === "A" || col === "F" ? "Window" : col === "C" || col === "D" ? "Aisle" : "Middle"];
    if (legroomRows.includes(row)) features.push("Extra legroom");
    if (row <= 6) features.push("Lie-flat");
    const charge = zone === "Business" ? "₹18,500" : zone === "Extra legroom" ? "₹799" : "₹0";
    return { zone, features, charge };
  };
  const meta = seatMeta(selected);

  return (
    <div>
      <BookingSteps current={3} />
      <div className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-[1fr_320px]">
        {/* LEFT */}
        <div className="space-y-5">
          {/* Flight summary */}
          <Card className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-display text-base font-semibold text-accent">DEL → BOM · SW-218</div>
                <div className="mt-0.5 text-xs text-foreground/55">Wed 15 Jun · 08:30 → 10:35 · Airbus A321</div>
              </div>
              <div className="text-right text-xs text-foreground/65">Flex fare · 1 passenger</div>
            </div>
          </Card>

          {/* Filter chips */}
          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">Filter seats</div>
            <div className="flex flex-wrap gap-2">
              {filters.map((f) => (
                <button
                  key={f}
                  data-quiet onClick={() => setActiveFilter(f)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                    activeFilter === f
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-foreground/70 hover:border-accent/40 hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-700 dark:text-emerald-300">
            <span className="mr-1.5">✦</span>
            <span className="font-semibold">Recommended for you:</span> Seat 14A — window, front third, your preferred side based on past bookings.
          </div>

          {/* Seat map */}
          <Card className="p-6">
            <div className="mb-3 text-center text-[11px] text-foreground/55">✈ Front of aircraft · nose</div>
            <div className="mb-2 flex justify-center gap-1.5 font-mono text-[10px] text-foreground/45">
              {["A", "B", "C", "", "D", "E", "F"].map((c, i) =>
                c ? (
                  <span key={i} className="w-7 text-center">{c}</span>
                ) : (
                  <span key={i} className="w-2" />
                ),
              )}
            </div>

            <ZoneBadge label="Business class" tone="business" />
            <div className="mt-3 space-y-1.5">
              {businessRows.map((r) => (
                <SeatRow key={r} row={r} kindFor={kindFor} selected={selected} onPick={setSelected} />
              ))}
            </div>

            <div className="my-5">
              <ZoneBadge label="Extra legroom" tone="legroom" />
            </div>
            <div className="space-y-1.5">
              {legroomRows.map((r) => (
                <SeatRow key={r} row={r} kindFor={kindFor} selected={selected} onPick={setSelected} />
              ))}
            </div>

            <div className="my-5">
              <ZoneBadge label="Economy" tone="economy" />
            </div>
            <div className="space-y-1.5">
              {economyRows.map((r) => (
                <SeatRow key={r} row={r} kindFor={kindFor} selected={selected} onPick={setSelected} />
              ))}
            </div>

            <div className="mt-5 text-center text-[11px] text-foreground/55">✈ Rear of aircraft · tail</div>

            {/* Legend */}
            <div className="mt-5 flex flex-wrap justify-center gap-4 text-[11px] text-foreground/60">
              {[
                ["bg-amber-500/20 border-amber-500/30", "Business"],
                ["bg-emerald-500/15 border-emerald-500/30", "Extra legroom"],
                ["bg-muted/60 border-border", "Available"],
                ["bg-accent border-accent", "Your seat"],
                ["bg-transparent border-dashed border-border", "Taken"],
              ].map(([cls, label]) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <span className={`h-3.5 w-3.5 rounded border ${cls}`} />
                  {label}
                </span>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">Passengers</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">AR</div>
              <div>
                <div className="text-sm font-semibold">Arjun Reddy</div>
                <div className="text-[11px] text-foreground/55">Tap a seat to assign</div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">Seat summary</div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-foreground/65">Selected seat</span><span className="font-semibold text-accent">{selected}</span></div>
              <div className="flex justify-between"><span className="text-foreground/65">Zone</span><span className="font-medium">{meta.zone}</span></div>
              <div className="flex justify-between"><span className="text-foreground/65">Features</span><span className="text-right text-xs font-medium">{meta.features.join(" · ")}</span></div>
              <div className="flex justify-between"><span className="text-foreground/65">Seat charge</span><span className="font-medium">{meta.charge}</span></div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
              <span className="font-semibold">Seat fee</span>
              <span className="font-display text-base font-semibold text-accent">{meta.charge}</span>
            </div>
          </Card>

          <SeatMapCTAs pnr={pnr} returnTo={returnTo} selected={selected} charge={meta.charge} />

          <div className="text-center text-[11px] text-foreground/50">🔒 Seat held for 15 min</div>
        </aside>
      </div>
    </div>
  );
}

function SeatMapCTAs({ pnr, returnTo, selected, charge }: { pnr?: string; returnTo?: string; selected: string; charge: string }) {
  const navigate = useNavigate();
  if (pnr) {
    const backSplat = returnTo || `check-in/${pnr}/boarding-pass`;
    return (
      <>
        <button
          onClick={() => {
            setSelectedSeat(pnr, selected);
            toast.success(`Seat ${selected} saved to PNR ${pnr.toUpperCase()}${charge !== "₹0" ? ` (${charge})` : ""}`);
            navigate({ to: "/app/$", params: { _splat: backSplat } });
          }}
          className="block w-full rounded-xl bg-accent py-3 text-center text-sm font-semibold text-white hover:opacity-90"
        >
          ✓ Save seat {selected} to booking
        </button>
        <Link
          to="/app/$"
          params={{ _splat: backSplat }}
          className="block w-full rounded-xl border border-border bg-card py-3 text-center text-sm font-medium text-foreground/75 hover:bg-muted"
        >
          Cancel
        </Link>
      </>
    );
  }
  return (
    <>
      <Link
        to="/app/$"
        params={{ _splat: "booking/passengers" }}
        className="block rounded-xl bg-accent py-3 text-center text-sm font-semibold text-white hover:opacity-90"
      >
        → Continue with this seat ↗
      </Link>
      <Link
        to="/app/$"
        params={{ _splat: "booking/passengers" }}
        data-toast="Seat auto-assign at check-in"
        data-toast-kind="info"
        className="block w-full rounded-xl border border-border bg-card py-3 text-center text-sm font-medium text-foreground/75 hover:bg-muted"
      >
        ↻ Skip — auto-assign at check-in
      </Link>
    </>
  );
}

// ===================================================================
// Passenger details
// ===================================================================
function FormField({
  label,
  value,
  required,
  hint,
  type = "text",
}: {
  label: string;
  value?: string;
  required?: boolean;
  hint?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-foreground/65">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="relative mt-1">
        <input
          type={type}
          defaultValue={value}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        {value && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-500">✓</span>
        )}
      </div>
      {hint && <div className="mt-1 text-[11px] text-foreground/50">{hint}</div>}
    </div>
  );
}

function SelectField({ label, value, required }: { label: string; value: string; required?: boolean }) {
  return (
    <div>
      <label className="text-xs font-medium text-foreground/65">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="mt-1 flex h-10 items-center justify-between rounded-lg border border-border bg-background px-3 text-sm">
        <span>{value}</span>
        <span className="text-foreground/40">▾</span>
      </div>
    </div>
  );
}

function SectionCard({ icon, title, action, children }: { icon: string; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-accent">{icon}</span>
          {title}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function PassengersPage() {
  const ssrOptions = [
    { code: "VGML", label: "Vegetarian meal",       note: "VGML · Included with Flex",     icon: "🥗", price: 0 },
    { code: "WCHR", label: "Wheelchair",            note: "WCHR · gate assistance · free", icon: "♿", price: 0 },
    { code: "INFT", label: "Travelling with infant",note: "INFT · lap infant · ₹1,500",    icon: "👶", price: 1500 },
    { code: "MEDA", label: "Medical equipment",     note: "MEDA · oxygen etc. · ₹750",     icon: "⚕", price: 750 },
  ];
  const [ssrSet, setSsrSet] = useState<Set<string>>(new Set(["VGML"]));
  const toggleSsr = (code: string) => {
    const next = new Set(ssrSet);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setSsrSet(next);
  };
  const ssrTotal = ssrOptions.filter((s) => ssrSet.has(s.code)).reduce((sum, s) => sum + s.price, 0);


  return (
    <div>
      <BookingSteps current={4} />
      <div className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-[1fr_320px]">
        {/* LEFT */}
        <div className="space-y-5">
          {/* Passenger 1 */}
          <SectionCard
            icon="👤"
            title="Passenger 1 — Arjun Reddy"
            action={<span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">✓ Pre-filled from profile</span>}
          >
            <div className="mb-4 rounded-lg border border-accent/25 bg-accent/10 px-3.5 py-3 text-xs text-accent">
              <div className="flex items-start justify-between gap-3">
                <p>
                  <span className="font-semibold">✦ </span>
                  Details filled from your saved profile. Review and confirm — changes here won't affect your saved profile unless you update it.
                </p>
                <a href="#" className="shrink-0 font-semibold underline-offset-2 hover:underline">Update profile</a>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="First name" value="Arjun" required />
              <FormField label="Last name" value="Reddy" required />
              <FormField label="Date of birth" value="12 Mar 1990" required />
              <SelectField label="Gender" value="Male" required />
              <SelectField label="Nationality" value="Indian" required />
            </div>

            <div className="mt-6 mb-2 text-sm font-semibold">Travel document (APIS)</div>
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField label="Document type" value="Passport" required />
              <FormField label="Document number" value="J8924031" required />
              <SelectField label="Issuing country" value="India" required />
              <FormField label="Issue date" value="14 Jan 2020" required />
              <FormField label="Expiry date" value="13 Jan 2030" required />
            </div>
            <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
              ✓ Passport valid for this journey · expires 3.6 years after departure
            </div>

            <div className="mt-6 mb-2 text-sm font-semibold">
              ✨ Special service requests <span className="font-normal text-foreground/50">(optional)</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {ssrOptions.map((s) => {
                const on = ssrSet.has(s.code);
                return (
                  <button
                    key={s.code}
                    data-quiet
                    onClick={() => toggleSsr(s.code)}
                    className={`flex items-start gap-3 rounded-lg border px-3.5 py-3 text-left text-xs transition ${
                      on ? "border-accent bg-accent/10" : "border-border hover:border-accent/40"
                    }`}
                  >
                    <span className="text-base">{s.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{s.label}</div>
                      <div className="text-[11px] text-foreground/55">{s.note}</div>
                    </div>
                    {on && <span className="text-accent">✓</span>}
                  </button>
                );
              })}
            </div>

          </SectionCard>

          {/* Contact details */}
          <SectionCard icon="📞" title="Contact details" action={<a href="#" className="text-xs text-accent hover:underline">ⓘ Why we need this</a>}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Email address" value="arjun.reddy@email.co" required hint="ⓘ Booking confirmation and boarding pass sent here" />
              <FormField label="Mobile number" value="+91 98765 43210" required hint="ⓘ Flight alerts and OTP verification" />
              <FormField label="Emergency contact name" hint="" />
              <FormField label="Emergency contact phone" hint="" />
            </div>
          </SectionCard>

          {/* Loyalty */}
          <SectionCard icon="★" title="Loyalty & travel preferences">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="SkyWay loyalty number" value="SW-4829-1047-3821" hint="✓ Gold member · ~3,200 miles will be credited post-flight" />
              <FormField label="Known traveller / TSA PreCheck" value="KTN-491827" hint="ⓘ Added to boarding pass for expedited security" />
            </div>

            <div className="mt-5 mb-2 text-sm font-semibold">Travel companions</div>
            <div className="mb-3 text-xs text-foreground/55">Use a saved companion's details to fill this form instantly.</div>
            <div className="space-y-2">
              {[
                { ini: "PS", name: "Priya Reddy", note: "Spouse · Indian · Passport valid" },
                { ini: "VR", name: "Vikram Reddy", note: "Parent · Indian · Passport valid" },
              ].map((c) => (
                <div key={c.ini} className="flex items-center justify-between rounded-lg border border-border px-3.5 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground/70">{c.ini}</span>
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-[11px] text-foreground/55">{c.note}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.success(`Applied ${c.name}'s saved APIS & travel document details!`)}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    Use details
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Agreements */}
          <SectionCard icon="📋" title="Agreements">
            <div className="space-y-3 text-xs text-foreground/75">
              {[
                { d: true, t: <>I confirm that the passenger details above match the travel document exactly. Name corrections after ticketing may incur a fee. <a href="#" className="text-accent hover:underline">Learn more</a></> },
                { d: true, t: <>I agree to the <a href="#" className="text-accent hover:underline">conditions of carriage</a> and <a href="#" className="text-accent hover:underline">privacy policy</a>. My passport data will be shared with border authorities as required by law (APIS).</> },
                { d: false, t: <>Send me flight deals, news and offers from SkyWay. <span className="text-foreground/50">(optional)</span></> },
              ].map((a, i) => (
                <label key={i} className="flex items-start gap-3 cursor-pointer">
                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${a.d ? "border-accent bg-accent text-white" : "border-border"}`}>
                    {a.d && <span className="text-[10px] leading-none">✓</span>}
                  </span>
                  <span className="leading-relaxed">{a.t}</span>
                </label>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* RIGHT sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">Booking summary</div>
            <div className="mt-3 font-display text-base font-semibold text-accent">DEL → BOM</div>
            <div className="text-[11px] text-foreground/55">SW-218 · 15 Jun · 08:30 → 10:35</div>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-foreground/65">Fare</dt><dd className="font-medium">Flex</dd></div>
              <div className="flex justify-between"><dt className="text-foreground/65">Seat</dt><dd className="font-medium text-accent">14A · Window</dd></div>
              <div className="flex justify-between"><dt className="text-foreground/65">Cabin bag</dt><dd className="font-medium">7kg included</dd></div>
              <div className="flex justify-between"><dt className="text-foreground/65">Check-in bag</dt><dd className="font-medium">23kg included</dd></div>
              <div className="flex justify-between"><dt className="text-foreground/65">Meal</dt><dd className="font-medium">Vegetarian (VGML)</dd></div>
              <div className="flex justify-between"><dt className="text-foreground/65">Passenger</dt><dd className="font-medium">1 adult</dd></div>
            </dl>

            <div className="my-3 border-t border-border" />
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-foreground/65">Base fare</dt><dd>₹4,850</dd></div>
              {ssrSet.size > 0 && (
                <div className="flex justify-between"><dt className="text-foreground/65">Special services ({ssrSet.size})</dt><dd>{ssrTotal > 0 ? `+₹${ssrTotal.toLocaleString("en-IN")}` : "Free"}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-foreground/65">Taxes & fees</dt><dd>₹486</dd></div>
            </dl>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm font-semibold">Total</span>
              <span className="font-display text-lg font-semibold text-accent">₹{(5336 + ssrTotal).toLocaleString("en-IN")}</span>
            </div>

          </Card>

          <Link
            to="/app/$"
            params={{ _splat: "booking/extras" }}
            className="block rounded-xl bg-accent py-3 text-center text-sm font-semibold text-white hover:opacity-90"
          >
            → Continue to payment ↗
          </Link>

          <ul className="space-y-1.5 px-1 text-[11px] text-foreground/55">
            <li>🔒 Passport data encrypted with AES-256</li>
            <li>↻ APIS data sent securely to authorities</li>
            <li>✦ Data never sold to third parties</li>
            <li>⏱ Seat held · 12 min remaining</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

// ============================ EXTRAS / ANCILLARIES ============================

type BagOption = { id: string; title: string; sub: string; price: string; selected?: boolean; included?: boolean };
type MealOption = { id: string; name: string; code: string; icon: string; selected?: boolean };
type ExtraTile = { id: string; icon: string; title: string; sub: string; price: string; tone: "pink" | "amber" | "sky" | "violet"; iconBg: string };

const BAG_OPTIONS: BagOption[] = [
  { id: "inc", title: "1 × 23 kg", sub: "Included with Flex", price: "Included", selected: true, included: true },
  { id: "x2", title: "2 × 23 kg", sub: "Extra bag added", price: "+₹1,200" },
  { id: "x3", title: "3 × 23 kg", sub: "Two extra bags", price: "+₹2,200" },
  { id: "x32", title: "1 × 32 kg", sub: "Heavy bag", price: "+₹1,600" },
];

const MEALS: MealOption[] = [
  { id: "vgml", name: "Vegetarian", code: "VGML", icon: "🥗", selected: true },
  { id: "moml", name: "Muslim meal", code: "MOML · Halal", icon: "🌙" },
  { id: "hnml", name: "Hindu meal", code: "HNML", icon: "✦" },
  { id: "gfml", name: "Gluten-free", code: "GFML", icon: "🚫" },
  { id: "chml", name: "Child meal", code: "CHML", icon: "🧒" },
  { id: "nlml", name: "Standard meal", code: "NLML", icon: "🍽" },
];

const EXTRAS_TILES: ExtraTile[] = [
  { id: "ins", icon: "♥", title: "Travel insurance", sub: "Medical cover, trip cancellation, delay compensation up to ₹2L", price: "+₹349", tone: "pink", iconBg: "bg-emerald-500/15 text-emerald-400" },
  { id: "lng", icon: "🏛", title: "Lounge access", sub: "T2 SkyLounge DEL — food, drinks, Wi-Fi, showers (3-hr access)", price: "+₹1,200", tone: "amber", iconBg: "bg-amber-500/15 text-amber-400" },
  { id: "wifi", icon: "📶", title: "In-flight Wi-Fi", sub: "Unlimited streaming and browsing for the full flight", price: "+₹699", tone: "sky", iconBg: "bg-sky-500/15 text-sky-400" },
  { id: "pb", icon: "★", title: "Priority boarding", sub: "Board in group 1 before general boarding begins", price: "Free · Gold perk", tone: "violet", iconBg: "bg-violet-500/15 text-violet-400" },
];

export function ExtrasPage() {
  const [bag, setBag] = useState<string>("inc");
  const [meal, setMeal] = useState<string>("vgml");
  const [legroom, setLegroom] = useState(false);
  const [business, setBusiness] = useState(false);
  const [extras, setExtras] = useState<Record<string, boolean>>({ ins: false, lng: false, wifi: false, pb: false });

  return (
    <div>
      <BookingSteps current={5} />

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-[1fr_340px]">
        {/* LEFT */}
        <div className="space-y-5">
          {/* Trip strip */}
          <div className="flex items-center justify-between rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
            <div>
              <div className="font-display text-base font-semibold">DEL → BOM · SW-218</div>
              <div className="text-xs text-foreground/60">15 Jun · Seat 14A · Flex fare · 1 adult</div>
            </div>
            <div className="text-xs font-medium text-accent">Step 5 of 6</div>
          </div>

          {/* Personalised banner */}
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 text-sm">
            <div className="flex items-start gap-2 text-foreground">
              <span className="text-violet-400">✦</span>
              <p>
                <span className="font-semibold text-violet-300">Personalised for you</span>{" "}
                <span className="text-foreground/75">— based on your past bookings, we've pre-selected a vegetarian meal. The travel insurance is recommended for international routes. Review and adjust below.</span>
              </p>
            </div>
          </div>

          {/* Checked baggage */}
          <section>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/55">Checked baggage</div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {BAG_OPTIONS.map((b) => {
                const active = bag === b.id;
                return (
                  <button
                    key={b.id}
                    data-quiet onClick={() => setBag(b.id)}
                    className={`relative rounded-xl border p-4 text-left transition-all ${
                      active ? "border-accent bg-accent/5 ring-1 ring-accent/40" : "border-border bg-card hover:border-foreground/20"
                    }`}
                  >
                    {active && <div className="absolute right-3 top-3 text-accent">✓</div>}
                    <div className="mb-2 text-foreground/70">
                      {b.included ? "✓" : "🧳"}
                    </div>
                    <div className={`font-display text-sm font-semibold ${active ? "text-accent" : ""}`}>{b.title}</div>
                    <div className="mt-0.5 text-[11px] text-foreground/55">{b.sub}</div>
                    <div className={`mt-2 text-sm font-semibold ${b.included ? "text-emerald-400" : "text-accent"}`}>{b.price}</div>
                    {active && <div className="mt-1 text-[10px] font-medium text-accent">✓ Selected</div>}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-foreground/50">
              ⓘ Cabin bag (7 kg) always included · oversized sports equipment — <a className="text-accent" href="#">contact us</a>
            </p>
          </section>

          {/* Meal */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground/55">In-flight meal</div>
              <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-400">✓ Included with Flex</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {MEALS.map((m) => {
                const active = meal === m.id;
                return (
                  <button
                    key={m.id}
                    data-quiet onClick={() => setMeal(m.id)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                      active ? "border-accent bg-accent/5" : "border-border bg-card hover:border-foreground/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? "bg-accent/15" : "bg-muted"}`}>
                        <span className="text-base">{m.icon}</span>
                      </div>
                      <div className="text-left">
                        <div className={`text-sm font-semibold ${active ? "text-accent" : ""}`}>{m.name}</div>
                        <div className="text-[11px] text-foreground/55">{m.code}</div>
                      </div>
                    </div>
                    {active && <span className="text-accent">⊙</span>}
                  </button>
                );
              })}
            </div>

            {/* In-Flight Dining Preview Component */}
            <div className="mt-4 pt-2">
              <InFlightDiningPreview
                initialRouteKey="DEL-BOM"
                initialCabinClass={business ? "business" : "economy"}
              />
            </div>
          </section>

          {/* Seat upgrade */}
          <section>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/55">Seat upgrade</div>
            <div className="space-y-3">
              <UpgradeRow
                icon="💺"
                title="Extra legroom seat"
                bullets={['34" seat pitch vs 30" standard', "Rows 7–13 · bulkhead & exit rows", "Priority boarding included"]}
                price="+₹799"
                meta="4 seats left"
                added={legroom}
                onToggle={() => setLegroom((v) => !v)}
              />
              <UpgradeRow
                icon="👑"
                title="Upgrade to Business"
                bullets={["Reclining flatbed · rows 1–6", "Lounge access + priority check-in", "32 kg bag + premium dining"]}
                price="+₹11,050"
                meta="2 seats left"
                added={business}
                onToggle={() => setBusiness((v) => !v)}
              />
            </div>
          </section>

          {/* Other extras */}
          <section>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/55">Other extras</div>
            <div className="grid gap-3 md:grid-cols-2">
              {EXTRAS_TILES.map((e) => {
                const on = extras[e.id];
                return (
                  <button
                    key={e.id}
                    data-quiet onClick={() => setExtras((p) => ({ ...p, [e.id]: !p[e.id] }))}
                    className={`relative rounded-xl border bg-card p-4 text-left transition-all ${
                      on ? "border-accent ring-1 ring-accent/30" : "border-border hover:border-foreground/20"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${e.iconBg}`}>
                        <span className="text-sm">{e.icon}</span>
                      </div>
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${on ? "border-accent bg-accent text-white" : "border-foreground/30"}`}>
                        {on && <span className="text-[10px]">✓</span>}
                      </div>
                    </div>
                    <div className="mt-3 font-display text-sm font-semibold">{e.title}</div>
                    <div className="mt-1 text-[11px] leading-relaxed text-foreground/55">{e.sub}</div>
                    <div className={`mt-2 text-sm font-semibold ${e.price.startsWith("Free") ? "text-emerald-400" : "text-accent"}`}>{e.price}</div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* RIGHT — Your extras */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <div className="text-xs font-semibold uppercase tracking-wider text-foreground/55">Your extras</div>
            <div className="mt-4 space-y-3 text-sm">
              <SummaryRow icon="🧳" label="Baggage" value="1 × 23 kg incl." valueClass="text-accent" />
              <SummaryRow icon="🍽" label="Meal" value="Vegetarian (VGML)" valueClass="text-accent" />
              <SummaryRow icon="💺" label="Seat upgrade" value={legroom || business ? "Added" : "None added"} valueClass={legroom || business ? "text-accent" : "text-foreground/55"} />
              <SummaryRow icon="♥" label="Insurance" value={extras.ins ? "Added" : "Not added"} valueClass={extras.ins ? "text-accent" : "text-foreground/55"} />
              <SummaryRow icon="🏛" label="Lounge" value={extras.lng ? "Added" : "Not added"} valueClass={extras.lng ? "text-accent" : "text-foreground/55"} />
              <SummaryRow icon="📶" label="Wi-Fi" value={extras.wifi ? "Added" : "Not added"} valueClass={extras.wifi ? "text-accent" : "text-foreground/55"} />
            </div>

            <div className="mt-5 space-y-1.5 border-t border-border pt-4 text-sm">
              {(() => {
                const bagCost = { inc: 0, x2: 1200, x3: 2200, x32: 1600 }[bag as "inc"|"x2"|"x3"|"x32"] ?? 0;
                const legroomCost = legroom ? 799 : 0;
                const businessCost = business ? 11050 : 0;
                const extraCosts = (extras.ins ? 349 : 0) + (extras.lng ? 1200 : 0) + (extras.wifi ? 699 : 0);
                const extrasTotal = bagCost + legroomCost + businessCost + extraCosts;
                const total = 4850 + 299 + extrasTotal + 486;
                return (
                  <>
                    <div className="flex justify-between"><span className="text-foreground/65">Base fare</span><span>₹4,850</span></div>
                    <div className="flex justify-between"><span className="text-foreground/65">Seat (14A)</span><span>₹299</span></div>
                    {bagCost > 0 && <div className="flex justify-between"><span className="text-foreground/65">Extra baggage</span><span>+₹{bagCost.toLocaleString("en-IN")}</span></div>}
                    {legroom && <div className="flex justify-between"><span className="text-foreground/65">Extra legroom</span><span>+₹799</span></div>}
                    {business && <div className="flex justify-between"><span className="text-foreground/65">Business upgrade</span><span>+₹11,050</span></div>}
                    {extras.ins && <div className="flex justify-between"><span className="text-foreground/65">Travel insurance</span><span>+₹349</span></div>}
                    {extras.lng && <div className="flex justify-between"><span className="text-foreground/65">Lounge access</span><span>+₹1,200</span></div>}
                    {extras.wifi && <div className="flex justify-between"><span className="text-foreground/65">In-flight Wi-Fi</span><span>+₹699</span></div>}
                    <div className="flex justify-between"><span className="text-foreground/65">Taxes & fees</span><span>₹486</span></div>
                    <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
                      <span className="font-display text-base font-semibold">Total</span>
                      <span className="font-display text-xl font-semibold text-accent">₹{total.toLocaleString("en-IN")}</span>
                    </div>
                  </>
                );
              })()}
            </div>

          </Card>

          <Link
            to="/app/$"
            params={{ _splat: "booking/payment" }}
            className="flex items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-medium text-white hover:opacity-90"
          >
            → Continue to payment ↗
          </Link>
          <Link
            to="/app/$"
            params={{ _splat: "booking/payment" }}
            className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-foreground/75 hover:bg-muted"
          >
            → Skip extras — go to payment
          </Link>
          <div className="text-center text-[11px] text-foreground/55">⏱ Seat held · 14 min remaining</div>
        </aside>
      </div>
    </div>
  );
}

function UpgradeRow({
  icon, title, bullets, price, meta, added, onToggle,
}: { icon: string; title: string; bullets: string[]; price: string; meta: string; added: boolean; onToggle: () => void }) {
  return (
    <div className={`rounded-xl border bg-card p-4 transition-colors ${added ? "border-accent" : "border-border"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base">{icon}</span>
            <span className="font-display text-base font-semibold">{title}</span>
          </div>
          <ul className="mt-2 space-y-1 text-[12px] text-foreground/65">
            {bullets.map((b) => (
              <li key={b} className="flex gap-2"><span className="text-emerald-400">✓</span>{b}</li>
            ))}
          </ul>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-accent">{price}</div>
          <div className="mt-0.5 text-[10px] text-rose-400">{meta}</div>
          <button
            onClick={onToggle}
            className={`mt-3 rounded-md border px-4 py-1.5 text-xs font-medium transition-colors ${
              added ? "border-accent bg-accent text-white" : "border-border text-foreground/75 hover:bg-muted"
            }`}
          >
            {added ? "✓ Added" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ icon, label, value, valueClass }: { icon: string; label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-foreground/75"><span className="text-sm">{icon}</span>{label}</span>
      <span className={`text-xs font-medium ${valueClass ?? "text-foreground/65"}`}>{value}</span>
    </div>
  );
}

// ============================ PAYMENT ============================

type PayMethod = "saved" | "new" | "upi" | "netbank" | "later";
type SavedCard = { id: string; brand: string; last4: string; name: string; exp: string; default?: boolean };

const SAVED_CARDS: SavedCard[] = [
  { id: "visa", brand: "Visa", last4: "4291", name: "Arjun Reddy", exp: "08/28", default: true },
  { id: "mc", brand: "Mastercard", last4: "8832", name: "Arjun Reddy", exp: "03/27" },
];

const PROMOS: Record<string, { pct?: number; flat?: number; label: string }> = {
  MONSOON30: { pct: 30, label: "30% off — Monsoon sale" },
  SKY500:    { flat: 500, label: "₹500 off" },
  GOLD10:    { pct: 10, label: "10% Gold member discount" },
};

export function PaymentPage() {
  const navigate = useNavigate();
  const [promoInput, setPromoInput] = useState("MONSOON30");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number; label: string } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [miles, setMiles] = useState(0);

  const subtotal = 5984; // base + seat + insurance + taxes
  const milesDiscount = Math.floor(miles / 5000) * 500;
  const promoDiscount = appliedPromo
    ? Math.min(subtotal, appliedPromo.discount)
    : 0;
  const total = Math.max(0, subtotal - milesDiscount - promoDiscount);

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    const p = PROMOS[code];
    if (!p) {
      setAppliedPromo(null);
      setPromoError(`"${code}" is not a valid promo code`);
      return;
    }
    const discount = p.flat ?? Math.round((subtotal * (p.pct ?? 0)) / 100);
    setAppliedPromo({ code, discount, label: p.label });
    setPromoError(null);
    toast.success(`Promo code ${code} applied! Saved ₹${discount.toLocaleString("en-IN")}`);
  };
  const removePromo = () => {
    setAppliedPromo(null);
    setPromoError(null);
  };

  const handlePaymentSuccess = (result: { pnr: string; transaction: any; booking: any }) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("lastPaymentTxn", JSON.stringify(result.transaction || {}));
    }
    navigate({ to: "/app/$", params: { _splat: "booking/confirm" } });
  };

  return (
    <div>
      <BookingSteps current={6} />

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-[1fr_380px]">
        {/* LEFT - Stripe Card Elements & Digital Wallets */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/80">
              <div className="flex items-center gap-2.5">
                <span className="text-accent text-xl">💳</span>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    Secure Payment via Stripe
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Choose payment method and confirm flight reservation
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                🔒 256-bit Encrypted
              </span>
            </div>

            <div className="pt-5">
              <StripeCheckoutForm
                amount={total}
                currency="INR"
                flightNumber="SW-218"
                pnr="SW8X4K"
                passengerName="Arjun Reddy"
                passengerEmail="arjun.reddy@email.com"
                passengerPhone="+91 98765 43210"
                seatNumber="14A"
                cabinClass="Economy"
                baggageCount={1}
                mealPreference="Vegetarian (VGML)"
                onSuccess={handlePaymentSuccess}
              />
            </div>
          </Card>

          {/* Promo / Miles Redemption */}
          <Card>
            <div className="flex items-center gap-2">
              <span className="text-accent font-bold">⊘</span>
              <div className="font-display text-base font-semibold">Promo code or SkyMiles redemption</div>
            </div>
            <div className="mt-4 flex gap-2">
              <input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm uppercase text-foreground"
                placeholder="Enter promo code (e.g. MONSOON30)"
              />
              {appliedPromo ? (
                <button
                  type="button"
                  onClick={removePromo}
                  className="rounded-md border border-border px-5 py-2 text-sm font-medium hover:bg-muted"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={applyPromo}
                  className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-white hover:opacity-90 shadow-sm"
                >
                  Apply
                </button>
              )}
            </div>
            {appliedPromo && (
              <div className="mt-2 rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600">
                ✓ {appliedPromo.label} applied — you save ₹{appliedPromo.discount.toLocaleString("en-IN")}
              </div>
            )}
            {promoError && (
              <div className="mt-2 rounded-md bg-rose-500/10 px-3 py-2 text-xs text-rose-500">
                ✕ {promoError}
              </div>
            )}
            <p className="mt-2 text-[11px] text-foreground/50">Available test promos: MONSOON30, SKY500, or GOLD10</p>

            <div className="mt-5 border-t border-border pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="text-accent">★</span>Use SkyMiles towards payment
                </span>
                <span className="text-xs text-foreground/55">42,580 miles available</span>
              </div>
              <input
                type="range"
                min={0}
                max={42580}
                step={500}
                value={miles}
                onChange={(e) => setMiles(Number(e.target.value))}
                className="mt-3 w-full accent-accent"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-foreground/55">
                <span>{miles.toLocaleString("en-IN")} miles redeemed</span>
                <span className="font-semibold text-accent">−₹{milesDiscount.toLocaleString("en-IN")}</span>
              </div>
              <div className="mt-1 text-right text-[11px] text-foreground/55">5,000 miles = ₹500 discount</div>
            </div>
          </Card>

          {/* Billing address */}
          <Card>
            <div className="flex items-center gap-2">
              <span className="text-accent">📍</span>
              <div className="font-display text-base font-semibold">Billing address</div>
            </div>
            <div className="mt-4 space-y-3">
              <PayField label="Address line 1" defaultValue="42 Banjara Hills Road No. 3" />
              <div className="grid grid-cols-2 gap-3">
                <PayField label="City" defaultValue="Hyderabad" />
                <PayField label="PIN code" defaultValue="500034" />
              </div>
              <PayField label="Country" defaultValue="India" select />
            </div>
          </Card>
        </div>

        {/* RIGHT - Order Summary Ledger */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <div className="text-xs font-semibold uppercase tracking-wider text-foreground/55">Order summary</div>
            <div className="mt-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
              <div className="font-display text-base font-semibold">DEL → BOM</div>
              <div className="text-[11px] text-foreground/65">SW-218 · 15 Jun · Seat 14A · Economy Flex</div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground/70">Base fare (1 Adult)</span>
                <span>₹4,850</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/70">Seat Selection (14A Window)</span>
                <span>₹299</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/70">Baggage Allowance (23kg)</span>
                <span className="text-emerald-500 font-medium">Included</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/70">Meal Choice (Vegetarian VGML)</span>
                <span className="text-emerald-500 font-medium">Included</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/70">Travel Insurance (Comprehensive)</span>
                <span>₹349</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/70">Aviation Security & GST (18%)</span>
                <span>₹486</span>
              </div>
              {milesDiscount > 0 && (
                <div className="flex justify-between text-emerald-500 font-medium">
                  <span>SkyMiles ({miles.toLocaleString("en-IN")})</span>
                  <span>−₹{milesDiscount.toLocaleString("en-IN")}</span>
                </div>
              )}
              {appliedPromo && (
                <div className="flex justify-between text-emerald-500 font-medium">
                  <span>Promo ({appliedPromo.code})</span>
                  <span>−₹{promoDiscount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="font-display text-base font-semibold">Total due now</span>
                <span className="font-display text-2xl font-semibold text-accent">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="text-right text-[11px] text-foreground/55">
                Processed instantly via Stripe Payment Gateway
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-y-2 text-[11px] text-foreground/70">
            <div className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Stripe PCI-DSS L1</div>
            <div className="flex items-center gap-1.5"><span className="text-emerald-500">🔒</span> 256-bit TLS Encrypted</div>
            <div className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> 3D Secure 2.0 / OTP</div>
            <div className="flex items-center gap-1.5"><span className="text-emerald-500">↻</span> Automated Refunds</div>
          </div>

          <div className="text-center text-[11px] text-foreground/55">⏱ Seat 14A held · Guaranteed fare</div>
        </aside>
      </div>
    </div>
  );
}


function PayField({ label, defaultValue, select }: { label: string; defaultValue?: string; select?: boolean }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
        {label} <span className="text-rose-400">*</span>
      </div>
      {select ? (
        <div className="relative mt-1.5">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40">🌐</span>
          <select defaultValue={defaultValue} className="w-full appearance-none rounded-md border border-border bg-background px-9 py-2 text-sm">
            <option>India</option><option>United States</option><option>United Kingdom</option>
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40">▾</span>
        </div>
      ) : (
        <input defaultValue={defaultValue} className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
      )}
    </div>
  );
}

// ============================================================
// Booking Confirmation
// ============================================================

function MiniBoardingPass({
  carrier = "SkyWay Airlines · SW-218",
  cabin = "Economy · Flex",
  aircraft = "Airbus A321",
  from = "DEL",
  to = "BOM",
  fromCity = "Delhi · T2",
  toCity = "Mumbai · T1",
  dep = "08:30",
  arr = "10:35",
  duration = "Non-stop · 2h 05m",
  passenger = "Arjun Reddy",
  seat = "14A",
  gate = "A07",
  boarding = "07:55",
  date = "15 Jun 26",
  pnr = "SW8X4K",
}: Partial<{
  carrier: string; cabin: string; aircraft: string;
  from: string; to: string; fromCity: string; toCity: string;
  dep: string; arr: string; duration: string;
  passenger: string; seat: string; gate: string; boarding: string; date: string; pnr: string;
}>) {
  return (
    <div className="overflow-hidden rounded-xl bg-gradient-to-br from-accent to-accent/80 text-white shadow-lg">
      <div className="flex items-start justify-between px-5 pt-4 text-[11px]">
        <span className="text-white/75">{carrier}</span>
        <div className="flex gap-1.5">
          <span className="rounded-full bg-white/15 px-2 py-0.5">{cabin}</span>
          <span className="rounded-full bg-white/15 px-2 py-0.5">{aircraft}</span>
        </div>
      </div>
      <div className="px-5 pt-3">
        <div className="font-display text-3xl font-bold tracking-tight">
          {from} <span className="opacity-80">→</span> {to}
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="font-display text-2xl font-semibold">{dep}</div>
            <div className="text-[11px] text-white/70">{fromCity}</div>
          </div>
          <div className="pb-1 text-[11px] text-white/70">{duration}</div>
          <div className="text-right">
            <div className="font-display text-2xl font-semibold">{arr}</div>
            <div className="text-[11px] text-white/70">{toCity}</div>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2 border-t border-white/15 px-5 py-3 text-[10px] uppercase tracking-wider text-white/65">
        <div><div>Passenger</div><div className="mt-0.5 text-xs font-medium normal-case tracking-normal text-white">{passenger}</div></div>
        <div><div>Seat</div><div className="mt-0.5 text-xs font-mono text-white">{seat}</div></div>
        <div><div>Gate</div><div className="mt-0.5 text-xs font-mono text-white">{gate}</div></div>
        <div><div>Boarding</div><div className="mt-0.5 text-xs font-mono text-white">{boarding}</div></div>
        <div><div>Date</div><div className="mt-0.5 text-xs font-mono text-white">{date}</div></div>
      </div>
      <div className="relative border-t border-dashed border-white/25 bg-white/5 px-5 py-3">
        <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-background" />
        <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-background" />
        <div className="flex items-center justify-between gap-3">
          <div className="h-10 flex-1 bg-[repeating-linear-gradient(90deg,white_0_2px,transparent_2px_5px)] opacity-90" />
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/15">
            <div className="h-7 w-7 bg-[repeating-linear-gradient(0deg,white_0_2px,transparent_2px_4px),repeating-linear-gradient(90deg,white_0_2px,transparent_2px_4px)] opacity-90" />
          </div>
        </div>
        <div className="mt-2 font-mono text-[10px] text-white/70">
          {pnr} · ARJUNREDDY · 218{from} · {seat} · {cabin.split(" ")[0].toUpperCase()}
        </div>
      </div>
    </div>
  );
}

function ActionTile({ icon, label, sub, tone = "neutral", to, onClick }: {
  icon: string; label: string; sub: string;
  tone?: "neutral" | "blue" | "green" | "amber" | "rose";
  to?: string;
  onClick?: () => void;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-muted text-foreground",
    blue: "bg-accent/10 text-accent",
    green: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-300",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    rose: "bg-rose-500/10 text-rose-500 dark:text-rose-300",
  };
  const inner = (
    <>
      <span className={`flex h-10 w-10 items-center justify-center rounded-full text-base ${tones[tone]}`}>{icon}</span>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="text-[11px] leading-snug text-foreground/55">{sub}</span>
    </>
  );
  const cls = "flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 text-center transition-colors hover:border-accent/40";
  if (to) return <Link to="/app/$" params={{ _splat: to }} className={cls}>{inner}</Link>;
  return <button onClick={onClick} className={cls}>{inner}</button>;
}

// helpers for confirm-page actions
function downloadBoardingPassPDF() {
  const text = `SkyWay Boarding Pass
====================
PNR: SW8X4K
Passenger: Arjun Reddy
Flight: SW-218
From: DEL (Terminal 2) → To: BOM (Terminal 1)
Date: 15 Jun 2026
Departure: 08:30    Arrival: 10:35
Seat: 14A (Window)
Gate: A07
Boarding: 07:55
Cabin: Economy · Flex

Present this pass and a valid photo ID at the gate.
`;
  const blob = new Blob([text], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "SkyWay-BoardingPass-SW8X4K.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function copyPNR() {
  navigator.clipboard?.writeText("SW8X4K");
  toast.success("PNR SW8X4K copied to clipboard");
}
function sharePass() {
  const data = { title: "My SkyWay booking SW8X4K", text: "DEL → BOM · 15 Jun · Seat 14A", url: typeof window !== "undefined" ? window.location.href : "" };
  if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }).share) {
    (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share(data).catch(() => {});
  } else {
    navigator.clipboard?.writeText(`SkyWay SW8X4K · DEL → BOM · 15 Jun · Seat 14A`);
    toast.success("Trip details copied to clipboard");
  }
}

function downloadICS(opts: { title: string; startISO: string; endISO: string; location?: string; description?: string; filename?: string }) {
  const dt = (s: string) => s.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SkyWay//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@skyway`,
    `DTSTAMP:${dt(new Date().toISOString())}`,
    `DTSTART:${dt(opts.startISO)}`,
    `DTEND:${dt(opts.endISO)}`,
    `SUMMARY:${opts.title}`,
    `LOCATION:${opts.location ?? ""}`,
    `DESCRIPTION:${opts.description ?? ""}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = opts.filename ?? "flight.ics";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function shareStatus(title: string, text: string) {
  const url = typeof window !== "undefined" ? window.location.href : "";
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
  if (typeof navigator !== "undefined" && nav.share) {
    nav.share({ title, text, url }).then(() => toast.success("Shared")).catch(() => {});
  } else {
    navigator.clipboard?.writeText(`${title} — ${text} ${url}`);
    toast.success("Status link copied to clipboard");
  }
}




export function ConfirmPage() {
  const page = findPage("/booking/confirm")!;
  const [showStripeReceipt, setShowStripeReceipt] = useState(false);

  return (
    <div>
      <PageHeader title="Booking confirmed" blurb={page.blurb} services={page.services} crumbs={["Booking", "Confirmation"]} />
      <div className="space-y-5 p-6 md:p-8">
        {/* success banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 dark:text-emerald-300">✓</span>
            <div>
              <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
                <span>Booking confirmed & payment settled via Stripe!</span>
                <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold">Stripe Verified</span>
              </div>
              <div className="text-xs text-emerald-700/80 dark:text-emerald-200/75">
                Confirmation email and SMS sent to arjun.reddy@email.com and +91 98765 43210
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-foreground/55">Booking reference (PNR)</div>
            <div className="flex items-center gap-2 font-mono text-lg font-semibold text-accent">
              SW8X4K{" "}
              <button onClick={copyPNR} className="cursor-pointer text-foreground/50 hover:text-accent" aria-label="Copy PNR">
                ⧉
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* left column */}
          <div className="space-y-5">
            <Card>
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <span className="text-accent">▦</span> Your boarding pass
              </div>
              <MiniBoardingPass />
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                {[
                  { i: "⤓", l: "Download PDF", onClick: () => { downloadBoardingPassPDF(); toast.success("Boarding pass downloaded"); } },
                  { i: "📅", l: "Add to Calendar", onClick: () => {
                    downloadIcsFile({
                      pnr: "SW8X4K",
                      flightNumber: "SW-218",
                      aircraft: "A321neo",
                      originCity: "Delhi",
                      originCode: "DEL",
                      originTerminal: "Terminal 2 · Gate A07",
                      destinationCity: "Mumbai",
                      destinationCode: "BOM",
                      destinationTerminal: "Terminal 1",
                      departureDate: "15 Jun 2026",
                      departureTime: "08:30 AM",
                      arrivalDate: "15 Jun 2026",
                      arrivalTime: "10:35 AM",
                      duration: "2h 05m",
                      seat: "14A (Window)",
                      cabinClass: "Economy",
                      meal: "Vegetarian Meal (VGML)",
                      baggageAllowance: "7kg cabin + 23kg hold",
                      status: "Confirmed",
                    });
                    toast.success("Downloaded .ics calendar file for flight SW-218");
                  }},
                  { i: "▭", l: "Add to wallet", onClick: () => { window.open("about:blank", "_blank"); toast.success("Opening Apple/Google Wallet…"); } },
                  { i: "✉", l: "Email to me", onClick: () => { window.location.href = "mailto:arjun.reddy@email.com?subject=Your%20SkyWay%20boarding%20pass%20(SW8X4K)&body=Attached%20is%20your%20boarding%20pass%20for%20SW-218%20on%2015%20Jun."; } },
                  { i: "↗", l: "Share", onClick: sharePass },
                ].map((b) => (
                  <button key={b.l} onClick={b.onClick} className="flex items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2.5 text-xs sm:text-sm text-foreground/80 hover:border-accent/40">
                    <span className="text-foreground/55">{b.i}</span>{b.l}
                  </button>
                ))}
              </div>

            </Card>

            {/* Stripe Payment & Settlement Card */}
            <Card className="border-[#635BFF]/30 bg-[#635BFF]/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#635BFF] text-white font-bold text-xs">
                    S
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">Stripe Payment Record</div>
                    <div className="text-[11px] text-muted-foreground">Charge ID: ch_3N9xK2A81SkyWay_SW8X4K</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowStripeReceipt(true)}
                  className="rounded-xl bg-[#635BFF] px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-[#534bd9] transition-colors"
                >
                  View Official Receipt ↗
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-[#635BFF]/20 pt-3 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block">STATUS</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Succeeded</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">METHOD</span>
                  <span className="font-semibold text-foreground">Visa •••• 4242</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">TOTAL SETTLED</span>
                  <span className="font-semibold text-foreground">₹5,484 INR</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">SECURITY</span>
                  <span className="font-semibold text-foreground">3D Secure 2.0</span>
                </div>
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><span className="text-accent">✈</span> Flight itinerary</div>
              <div className="relative space-y-5 pl-5">
                <span className="absolute left-[5px] top-2 h-[calc(100%-1rem)] w-px bg-border" />
                <div className="relative">
                  <span className="absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-accent/15" />
                  <div className="text-sm font-medium">08:30 · Wed 15 Jun 2026</div>
                  <div className="text-sm text-foreground/65">Indira Gandhi Intl, Delhi (DEL) · Terminal 2</div>
                  <div className="mt-1 flex gap-1.5">
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] text-accent">Departs</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground/70">Gate A07</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-300">On time</span>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/15" />
                  <div className="text-sm font-medium">10:35 · Wed 15 Jun 2026</div>
                  <div className="text-sm text-foreground/65">Chhatrapati Shivaji Intl, Mumbai (BOM) · Terminal 1</div>
                  <div className="mt-1 flex gap-1.5">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-300">Arrives</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground/70">Baggage belt 4</span>
                  </div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
                <Field label="Flight" value="SW-218" mono />
                <Field label="Aircraft" value="A321neo" />
                <Field label="Seat" value="14A · Window" />
                <Field label="Baggage" value="7kg + 23kg" />
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><span className="text-accent">≡</span> What to do next</div>
              <ol className="space-y-4">
                {[
                  { t: "Check in online (opens 14 Jun at 08:30)", d: "Web check-in opens 24 hours before departure. Choose or confirm your seat, add bags, and download your boarding pass before arriving at the airport.", cta: "Set check-in reminder →" },
                  { t: "Arrive at DEL Terminal 2 by 06:00", d: "Airport security and boarding can take 60–90 minutes. Gate A07 closes at 08:15 — arrive at the gate by 07:55 for boarding." },
                  { t: "Drop bag at counter 18–26 (if checked luggage)", d: "Your Flex fare includes 1 × 23 kg hold bag. Tag is in your boarding pass — attach it at the bag drop counter. No need to queue for a ticket." },
                  { t: "Enable flight notifications", d: "Get instant alerts for gate changes, delays, and boarding calls via the SkyWay app or SMS.", cta: "Enable notifications →" },
                ].map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">{i + 1}</span>
                    <div>
                      <div className="text-sm font-medium">{s.t}</div>
                      <div className="mt-1 text-xs leading-relaxed text-foreground/65">{s.d}</div>
                      {s.cta && <div className="mt-1 text-xs font-medium text-accent">{s.cta}</div>}
                    </div>
                  </li>
                ))}
              </ol>
            </Card>

            <Card>
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><span className="text-accent">⚙</span> Manage your booking</div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <ActionTile icon="◉" label="Change seat" sub="Switch to another available seat" tone="blue" to="booking/seats" />
                <ActionTile icon="+" label="Add extras" sub="Bags, meals, upgrades, Wi-Fi" tone="green" to="booking/extras" />
                <ActionTile icon="◎" label="Track flight" sub="Live ADS-B flight status" tone="amber" to="flight-status/SW-218" />
                <ActionTile icon="▣" label="Change date" sub="Flex fare — one free change" tone="blue" to="my-trips/SW8X4K" />
                <ActionTile icon="✕" label="Cancel booking" sub="50% refund with Flex fare" tone="rose" onClick={() => { if (confirm("Cancel booking SW8X4K? You will receive 50% refund (~₹2,992) with Flex fare.")) toast.success("Cancellation initiated — refund of ₹2,992 in 5–7 days"); }} />
                <ActionTile icon="✎" label="Fix name" sub="Minor spelling corrections" to="help/topic/booking" />
              </div>

            </Card>
          </div>

          {/* right column */}
          <aside className="space-y-5">
            <Card>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/55">Receipt</div>
              <div className="space-y-2 text-sm">
                {[
                  ["Base fare", "₹4,850"],
                  ["Seat 14A · window", "₹299"],
                  ["Baggage (23 kg)", "Included", "emerald"],
                  ["Meal (VGML)", "Included", "emerald"],
                  ["Travel insurance", "₹349"],
                  ["Taxes & fees", "₹489"],
                  ["Promo (MONSOON30)", "−₹500", "rose"],
                ].map(([l, v, tone]) => (
                  <div key={l} className="flex justify-between">
                    <span className="text-foreground/70">{l}</span>
                    <span className={`font-medium ${tone === "emerald" ? "text-emerald-600 dark:text-emerald-300" : tone === "rose" ? "text-rose-500" : ""}`}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="my-3 border-t border-border" />
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-foreground/70">Paid via Visa •••• 4291</span>
                <span className="font-display text-xl font-bold text-accent">₹5,487</span>
              </div>
              <button onClick={() => { downloadBoardingPassPDF(); toast.success("GST invoice downloaded"); }} className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
                <span>⤓</span> Download invoice / GST receipt
              </button>

            </Card>

            <Card className="border-accent/30 bg-accent/5">
              <div className="flex items-center gap-2 text-sm font-semibold text-accent">★ Miles credited</div>
              <p className="mt-2 text-xs text-foreground/70">Your Gold member miles for this flight will be credited within 72 hours of landing.</p>
              <div className="mt-3 font-display text-2xl font-bold text-accent">+3,240 miles</div>
              <div className="mt-1 text-xs text-foreground/60">New balance after landing: ~45,820 miles</div>
            </Card>

            <Card>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/55">Recommended for you</div>
              <div className="space-y-3">
                {[
                  { i: "🏨", t: "Hotels in Mumbai", s: "3-star hotels near BOM from ₹2,800/night — exclusive member rates", cta: "From ₹2,800/night ↗", tone: "blue", to: "help/topic/travel" },
                  { i: "🚗", t: "Airport transfer · BOM", s: "Pre-book a taxi or cab from BOM to your destination", cta: "From ₹650 ↗", tone: "green", to: "help/topic/travel" },
                  { i: "💺", t: "Upgrade to Business · SW-218", s: "2 business seats still available — bid from ₹8,500", cta: "Bid from ₹8,500 ↗", tone: "amber", to: "flights/SW-218" },
                ].map((r) => (
                  <Link key={r.t} to="/app/$" params={{ _splat: r.to }} className="flex gap-3 rounded-lg border border-border p-3 hover:border-accent/40">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-md ${r.tone === "blue" ? "bg-accent/10" : r.tone === "green" ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>{r.i}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{r.t}</div>
                      <div className="text-[11px] leading-snug text-foreground/60">{r.s}</div>
                      <div className="mt-1 text-xs font-medium text-accent">{r.cta}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            <Card>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/55">Share this trip</div>
              <div className="grid grid-cols-2 gap-2">
                <a href="https://wa.me/?text=SkyWay%20SW8X4K%20%C2%B7%20DEL%20%E2%86%92%20BOM%20%C2%B7%2015%20Jun%20%C2%B7%20Seat%2014A" target="_blank" rel="noopener" className="flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">⌬ WhatsApp</a>
                <a href="mailto:?subject=My%20SkyWay%20trip%20SW8X4K&body=DEL%20%E2%86%92%20BOM%20%C2%B7%2015%20Jun%20%C2%B7%20SW-218%20%C2%B7%20Seat%2014A" className="flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">✉ Email</a>
              </div>
            </Card>

          </aside>
        </div>
      </div>

      <StripeReceiptModal
        pnr="SW8X4K"
        isOpen={showStripeReceipt}
        onClose={() => setShowStripeReceipt(false)}
      />
    </div>
  );
}

// ============================================================
// My Trips
// ============================================================

type TripCard = {
  pnr: string; route: string; date: string; daysAway: string;
  dep: string; arr: string; depAirport: string; arrAirport: string;
  duration: string; flight: string; seat: string; bag: string; meal?: string; fare?: string;
  status: "delayed" | "confirmed" | "completed" | "cancelled";
  category: "upcoming" | "past" | "cancelled";
  statusBadges: { label: string; tone: "amber" | "green" | "muted" | "rose" }[];
  banner?: { title: string; body: string; cta: string };
  primaryActions: string[];
};

const TRIPS: TripCard[] = [
  {
    pnr: "SW8X4K", route: "DEL → BOM", date: "15 Jun 2026", daysAway: "3 days away",
    dep: "06:00", arr: "08:10", depAirport: "DEL · T2", arrAirport: "BOM · T1",
    duration: "2h 10m · SW-204", flight: "SW-204", seat: "14A · window", bag: "1 × 23 kg", meal: "Veg meal",
    status: "delayed", category: "upcoming",
    statusBadges: [
      { label: "⚠ 55-min delay", tone: "amber" },
      { label: "Check-in open", tone: "green" },
    ],
    banner: {
      title: "Flight delayed — new departure 07:25",
      body: "ATC hold at DEL. Your 06:30 connection window in BOM may be affected — we've found alternatives for you.",
      cta: "View options and rebook →",
    },
    primaryActions: ["Check-in now", "Boarding pass", "Track flight", "Change seat", "Add bags", "View alternatives"],
  },
  {
    pnr: "SW9M2P", route: "BOM → DXB", date: "28 Jun 2026", daysAway: "16 days away",
    dep: "22:15", arr: "00:40", depAirport: "BOM · T2", arrAirport: "DXB · T3",
    duration: "3h 25m · SW-811", flight: "SW-811", seat: "No seat yet", bag: "1 × 23 kg", fare: "Flex fare",
    status: "confirmed", category: "upcoming",
    statusBadges: [
      { label: "Confirmed", tone: "green" },
      { label: "Open for check-in", tone: "muted" },
    ],
    primaryActions: ["Check-in", "Select seat", "Add meal", "Bid upgrade", "Track", "Cancel"],
  },
  {
    pnr: "SW6T1Q", route: "BLR → DEL", date: "12 May 2026", daysAway: "1 month ago",
    dep: "09:20", arr: "12:05", depAirport: "BLR · T2", arrAirport: "DEL · T3",
    duration: "2h 45m · SW-501", flight: "SW-501", seat: "8F · window", bag: "1 × 23 kg", meal: "Non-veg",
    status: "completed", category: "past",
    statusBadges: [{ label: "✓ Completed", tone: "green" }, { label: "+2,840 miles", tone: "muted" }],
    primaryActions: ["View receipt", "Download invoice", "Rebook same route", "Rate this flight"],
  },
  {
    pnr: "SW3H7L", route: "DEL → GOI", date: "2 Apr 2026", daysAway: "2 months ago",
    dep: "07:00", arr: "09:35", depAirport: "DEL · T2", arrAirport: "GOI · T1",
    duration: "2h 35m · SW-118", flight: "SW-118", seat: "22C · aisle", bag: "1 × 15 kg", meal: "Veg meal",
    status: "completed", category: "past",
    statusBadges: [{ label: "✓ Completed", tone: "green" }],
    primaryActions: ["View receipt", "Download invoice", "Rebook same route", "Rate this flight"],
  },
  {
    pnr: "SW2C9V", route: "DEL → SIN", date: "26 Jun 2026", daysAway: "Refunded",
    dep: "23:40", arr: "07:55", depAirport: "DEL · T3", arrAirport: "SIN · T1",
    duration: "5h 45m · SW-902", flight: "SW-902", seat: "—", bag: "—", fare: "Saver fare",
    status: "cancelled", category: "cancelled",
    statusBadges: [{ label: "✕ Cancelled", tone: "rose" }, { label: "Refunded ₹18,240", tone: "muted" }],
    primaryActions: ["View refund", "Rebook", "Contact support"],
  },
];

function StatusChip({ label, tone }: { label: string; tone: "amber" | "green" | "muted" | "rose" }) {
  const cls =
    tone === "amber" ? "bg-amber-500/10 text-amber-600 dark:text-amber-300 ring-amber-500/25"
      : tone === "green" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 ring-emerald-500/25"
      : tone === "rose" ? "bg-rose-500/10 text-rose-600 dark:text-rose-300 ring-rose-500/25"
      : "bg-muted text-foreground/75 ring-border";
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${cls}`}>{label}</span>;
}

function resolveTripAction(action: string, pnr: string): { splat?: string; message?: string } {
  const a = action.toLowerCase();
  if (a.startsWith("check-in")) return { splat: `check-in/${pnr}` };
  if (a === "boarding pass") return { splat: `check-in/${pnr}/boarding-pass` };
  if (a.startsWith("select seat") || a.startsWith("change seat")) return { splat: `check-in/${pnr}/seats` };
  if (a.startsWith("track")) return { splat: `flight-status/${pnr}` };
  if (a.includes("terminal map") || a.includes("airport map") || a.includes("navigate gate") || a.includes("view gate")) return { splat: "terminal-map" };
  if (a.startsWith("view alternatives")) return { splat: "disruption" };
  if (a.startsWith("view refund")) return { splat: "disruption/refund" };
  if (a === "rebook" || a.startsWith("rebook")) return { splat: "booking" };
  if (a.startsWith("contact support")) return { splat: "help/chat" };
  if (a.startsWith("view receipt") || a.startsWith("download invoice")) return { message: "Invoice download started" };
  if (a.startsWith("rate")) return { message: "Thanks for your rating — 5★ recorded" };
  if (a.startsWith("add meal")) return { message: "Meal preference updated (VGML)" };
  if (a.startsWith("add bags")) return { message: "23 kg extra bag added — ₹1,200" };
  if (a.startsWith("bid upgrade")) return { message: "Upgrade bid placed — you'll be notified 24h before departure" };
  if (a === "cancel") return { splat: "disruption/refund" };
  if (a.startsWith("change date")) return { splat: "booking" };
  return { message: `${action} — coming soon` };
}

function TripCardRow({ t }: { t: TripCard }) {
  const navigate = useNavigate();
  const handle = (action: string) => (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const r = resolveTripAction(action, t.pnr);
    if (r.splat) navigate({ to: "/app/$", params: { _splat: r.splat } });
    else if (r.message) toast.success(r.message);
  };
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between text-xs text-foreground/60">
        <span className="inline-flex items-center gap-1.5"><span>📅</span> {t === TRIPS[0] ? "Next flight" : ""} {t.date} · {t.daysAway}</span>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-display text-2xl font-semibold tracking-tight">{t.route}</div>
          <div className="text-xs text-foreground/55">PNR: {t.pnr} · Booked 3 Jun 2026</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {t.statusBadges.map((b) => <StatusChip key={b.label} {...b} />)}
        </div>
      </div>

      {t.banner && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-300">⚠ {t.banner.title}</div>
          <div className="mt-1 text-xs text-amber-700/80 dark:text-amber-200/75">{t.banner.body}</div>
          <button onClick={handle("View alternatives")} className="mt-1.5 text-xs font-medium text-amber-700 dark:text-amber-200 hover:underline">{t.banner.cta}</button>
        </div>
      )}

      <div className="flex items-end justify-between rounded-lg border border-border p-4">
        <div>
          <div className="font-display text-2xl font-semibold">{t.dep}</div>
          <div className="text-xs text-foreground/55">{t.depAirport}</div>
        </div>
        <div className="flex flex-col items-center text-[11px] text-foreground/55">
          <div>{t.duration}</div>
          <div className="my-1 h-px w-24 bg-border" />
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-600 dark:text-emerald-300">Non-stop</span>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-semibold">{t.arr}</div>
          <div className="text-xs text-foreground/55">{t.arrAirport}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-foreground/70">
        <span>💺 Seat {t.seat}</span>
        <span>🧳 {t.bag}</span>
        {t.meal && <span>🍽 {t.meal}</span>}
        {t.fare && <span>★ {t.fare}</span>}
        <span>👤 1 adult</span>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {t.primaryActions.map((a, i) => (
          <button key={a} onClick={handle(a)} className={`rounded-md border border-border px-3 py-2 text-xs font-medium hover:border-accent/40 ${i === 0 ? "bg-accent/10 text-accent border-accent/30" : "bg-card text-foreground/80"}`}>
            {a}
          </button>
        ))}
      </div>
    </Card>
  );
}

export function MyTripsPage() {
  const page = findPage("/my-trips")!;
  const navigate = useNavigate();
  const [tab, setTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [sortBy, setSortBy] = useState<"dep" | "book" | "route">("dep");
  const [addPnr, setAddPnr] = useState("");
  const [extraTrips, setExtraTrips] = useState<TripCard[]>([]);

  const allTrips = useMemo(() => {
    const combined = [...TRIPS, ...extraTrips];
    return combined.sort((a, b) => {
      if (sortBy === "route") return a.route.localeCompare(b.route);
      if (sortBy === "book") return b.pnr.localeCompare(a.pnr);
      return a.date.localeCompare(b.date);
    });
  }, [extraTrips, sortBy]);

  const handleAddBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = addPnr.trim().toUpperCase();
    if (!clean) {
      toast.error("Please enter a valid 6-character PNR (e.g. SW8X4K)");
      return;
    }
    const match = allTrips.find((t) => t.pnr.toUpperCase() === clean);
    if (match) {
      toast.success(`Booking ${clean} found! Opening trip details...`);
      navigate({ to: "/app/$", params: { _splat: `my-trips/${clean}` } });
    } else {
      const newTrip: TripCard = {
        pnr: clean,
        route: "DEL → BLR",
        date: "15 Jul 2026",
        daysAway: "in 42 days",
        dep: "14:15",
        arr: "17:00",
        depAirport: "DEL · Terminal 3",
        arrAirport: "BLR · Terminal 2",
        duration: "2h 45m · SW-305",
        flight: "SW-305",
        seat: "14A · window",
        bag: "1 × 23 kg",
        meal: "Vegetarian",
        status: "confirmed",
        category: "upcoming",
        statusBadges: [
          { label: "✓ Confirmed", tone: "green" },
          { label: "Imported PNR", tone: "muted" },
        ],
        primaryActions: ["Check-in", "Select seat", "Add meal", "Track flight", "Cancel"],
      };
      setExtraTrips((prev) => [newTrip, ...prev]);
      toast.success(`Booking ${clean} retrieved and added to your upcoming trips!`);
      navigate({ to: "/app/$", params: { _splat: `my-trips/${clean}` } });
    }
    setAddPnr("");
  };

  const filteredTrips = allTrips.filter((t) => t.category === tab);

  return (
    <div>
      <PageHeader title="My trips" blurb={page.blurb} services={page.services} crumbs={["Trips"]} />
      <div className="p-6 md:p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {([
              { k: "upcoming", l: "Upcoming", i: "📅" },
              { k: "past", l: "Past", i: "🕘" },
              { k: "cancelled", l: "Cancelled", i: "✕" },
            ] as const).map((t) => {
              const n = allTrips.filter((x) => x.category === t.k).length;
              return (
                <button
                  key={t.k}
                  data-quiet onClick={() => setTab(t.k)}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    tab === t.k ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-card text-foreground/75 hover:bg-muted"
                  }`}
                >
                  <span>{t.i}</span>{t.l}
                  <span className={`ml-1 rounded-full px-1.5 text-[11px] ${tab === t.k ? "bg-accent text-white" : "bg-muted text-foreground/70"}`}>{n}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-foreground/55">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground cursor-pointer"
            >
              <option value="dep">Departure date</option>
              <option value="book">Booking date</option>
              <option value="route">Route name</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            {filteredTrips.map((t) => (
              <Link key={t.pnr} to="/app/$" params={{ _splat: `my-trips/${t.pnr}` }} className="block">
                <TripCardRow t={t} />
              </Link>
            ))}
            {filteredTrips.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-foreground/60">
                No {tab} trips
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <Card>
              <div className="mb-3 text-sm font-semibold">★ Miles & loyalty</div>
              <div className="rounded-lg bg-gradient-to-br from-accent to-accent/80 p-4 text-white">
                <div className="text-[11px] uppercase tracking-wider text-white/75">SkyWay Gold member</div>
                <div className="text-base font-semibold">Arjun Reddy</div>
                <div className="mt-3 font-display text-3xl font-bold">42,580 <span className="text-sm font-normal text-white/75">miles</span></div>
                <div className="mt-2 text-[11px] text-white/80">Gold <span className="float-right">Platinum: 75k</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full w-[57%] bg-white" />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3">
                  <div className="font-display text-xl font-semibold">47</div>
                  <div className="text-[11px] text-foreground/60">Flights taken</div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="font-display text-xl font-semibold">89k</div>
                  <div className="text-[11px] text-foreground/60">Total earned</div>
                </div>
              </div>
              <Link to="/app/$" params={{ _splat: "loyalty" }} className="mt-3 block w-full rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-center text-sm font-medium text-accent hover:bg-accent/15">Redeem miles ↗</Link>
            </Card>

            <Card>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold"><span className="text-accent">🔔</span> Recent alerts</div>
                <Link to="/app/$" params={{ _splat: "notifications" }} className="text-[11px] font-semibold text-accent hover:underline">
                  All alerts →
                </Link>
              </div>
              <div className="space-y-3 text-xs">
                {[
                  { i: "⚠", t: "SW-204 delayed 55 min", s: "ATC hold · new dep 07:25", time: "2m ago", tone: "amber", link: "disruption" },
                  { i: "✈", t: "Check-in open · SW-811", s: "BOM→DXB · Jun 28", time: "1h ago", tone: "blue", link: "check-in/SW9M2P" },
                  { i: "★", t: "2,840 miles credited", s: "BLR→DEL · SW-501", time: "2d ago", tone: "green", link: "loyalty" },
                ].map((a) => (
                  <Link
                    key={a.t}
                    to="/app/$"
                    params={{ _splat: a.link }}
                    className="flex gap-3 rounded-lg p-2 transition-colors hover:bg-muted/60"
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      a.tone === "amber" ? "bg-amber-500/10 text-amber-500"
                        : a.tone === "blue" ? "bg-accent/10 text-accent"
                        : "bg-emerald-500/10 text-emerald-500"
                    }`}>{a.i}</span>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium hover:text-accent">{a.t}</span>
                        <span className="text-foreground/50">{a.time}</span>
                      </div>
                      <div className="text-foreground/60">{a.s}</div>
                    </div>
                  </Link>
                ))}
              </div>
              <button
                type="button"
                onClick={() => navigate({ to: "/app/$", params: { _splat: "notifications" } })}
                className="mt-3 w-full rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground/80 hover:bg-muted transition-colors"
              >
                View all notifications
              </button>
            </Card>

            <Card>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><span className="text-accent">+</span> Add a booking</div>
              <p className="text-xs text-foreground/65">Enter a PNR to add a booking made elsewhere (travel agent, partner airline).</p>
              <form onSubmit={handleAddBooking} className="mt-3 flex gap-2">
                <input
                  value={addPnr}
                  onChange={(e) => setAddPnr(e.target.value.toUpperCase())}
                  className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm uppercase font-mono placeholder:normal-case placeholder:font-sans"
                  placeholder="E.G. SW8X4K"
                />
                <button
                  type="submit"
                  className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                >
                  Add
                </button>
              </form>
              <p className="mt-2 text-[11px] text-foreground/55">Also works for codeshare and interline bookings.</p>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Trip Detail
// ============================================================

export function TripDetailPage({ pnr }: { pnr: string }) {
  const page = findPage("/my-trips/:pnr")!;
  const navigate = useNavigate();
  const seat = useSelectedSeat(pnr);
  const handle = (action: string) => () => {
    const r = resolveTripAction(action, pnr);
    if (r.splat) navigate({ to: "/app/$", params: { _splat: r.splat } });
    else if (r.message) toast.success(r.message);
  };

  const handleShareTrip = () => {
    const shareData = {
      title: `SkyWay Booking · ${pnr}`,
      text: `Flight BOM → DXB (SW-811) on 28 Jun 2026. PNR: ${pnr}`,
      url: window.location.href,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share(shareData).catch(() => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href);
          toast.success("Trip itinerary link copied to clipboard!");
        }
      });
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Trip itinerary link copied to clipboard!");
    } else {
      toast.success(`Share link ready: https://skyway.aero/trips/${pnr}`);
    }
  };

  const handleDownloadItinerary = () => {
    try {
      downloadIcsFile({
        pnr: pnr || "SW9M2P",
        flightNumber: "SW-811",
        airline: "SkyWay Airlines",
        originCode: "BOM",
        originCity: "Mumbai",
        destinationCode: "DXB",
        destinationCity: "Dubai",
        departureTime: "2026-06-28T22:15:00",
        arrivalTime: "2026-06-29T00:40:00",
        seat: seat ?? "12A",
        terminal: "T2",
        gate: "C12",
      });
      toast.success("Flight calendar event (.ics) & itinerary downloaded!");
    } catch {
      toast.success("Flight itinerary downloaded successfully!");
    }
  };

  const handleDownloadInvoice = () => {
    toast.success(`Tax invoice & GST receipt downloaded for ${pnr}`);
  };

  const handleCopyPnr = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(pnr);
      toast.success(`Booking reference ${pnr} copied to clipboard!`);
    } else {
      toast.info(`PNR: ${pnr}`);
    }
  };

  return (
    <div>
      <PageHeader title={`Trip · ${pnr}`} blurb={page.blurb} services={page.services} crumbs={["Trips", pnr]} />
      <div className="space-y-5 p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm">
            <Link to="/app/$" params={{ _splat: "my-trips" }} className="text-foreground/65 hover:text-foreground">← My trips</Link>
            <span className="text-foreground/40">›</span>
            <span
              onClick={handleCopyPnr}
              className="font-mono text-foreground/80 cursor-pointer hover:text-accent hover:underline flex items-center gap-1"
              title="Click to copy PNR"
            >
              PNR: {pnr} ⧉
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleShareTrip}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted font-medium transition-colors"
            >
              ↗ Share trip
            </button>
            <button
              type="button"
              onClick={handleDownloadItinerary}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted font-medium transition-colors"
            >
              ⤓ Download
            </button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            {/* hero card */}
            <div className="overflow-hidden rounded-xl bg-gradient-to-br from-accent to-accent/80 p-5 text-white">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-white/75">Booking reference</span>
                <span
                  onClick={handleCopyPnr}
                  className="font-mono text-sm cursor-pointer underline hover:text-white/90"
                  title="Click to copy"
                >
                  {pnr} ⧉
                </span>
                <span className="ml-auto flex gap-1.5">
                  <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[11px] text-emerald-50">Confirmed</span>
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px]">Open for check-in</span>
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px]">Flex fare</span>
                </span>
              </div>
              <div className="mt-2 font-display text-3xl font-bold tracking-tight">BOM → DXB</div>
              <div className="mt-4 grid grid-cols-3 items-end">
                <div>
                  <div className="font-display text-2xl font-semibold">22:15</div>
                  <div className="text-[11px] text-white/75">BOM · Terminal 2</div>
                </div>
                <div className="text-center text-[11px] text-white/80">
                  <div>3h 25m · SW-811 · Non-stop</div>
                  <div className="text-white/65">Airbus A330 · on time</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl font-semibold">00:40</div>
                  <div className="text-[11px] text-white/75">DXB · Terminal 3</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-white/85 md:grid-cols-3">
                <span>📅 28 Jun 2026 · Sat</span>
                <span>🚪 Gate: C12 (tentative)</span>
                <span>⏱ Boarding: 21:45</span>
                <span>📶 Wi-Fi on board</span>
                <span>✓ On time</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {["Check-in now", "Select seat", "Boarding pass", "Track flight", "Change date", "Cancel"].map((a, i) => (
                <button key={a} onClick={handle(a)} className={`rounded-md border px-3 py-2 text-sm font-medium ${i === 0 ? "bg-accent/10 text-accent border-accent/30" : "border-border text-foreground/80 hover:bg-muted"}`}>{a}</button>
              ))}
            </div>

            <Card>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><span className="text-accent">✈</span> Flight itinerary</div>
              <div className="relative space-y-5 pl-5">
                <span className="absolute left-[5px] top-2 h-[calc(100%-1rem)] w-px bg-border" />
                <div className="relative">
                  <span className="absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-accent/15" />
                  <div className="text-sm font-medium">22:15 · Sat 28 Jun 2026</div>
                  <div className="text-sm text-foreground/65">Chhatrapati Shivaji Maharaj Intl — Mumbai (BOM) · Terminal 2</div>
                  <div className="mt-1 flex gap-1.5">
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] text-accent">Departs</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground/70">Gate C12</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-300">On time</span>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/15" />
                  <div className="text-sm font-medium">00:40 · Sun 29 Jun 2026 (+1 day)</div>
                  <div className="text-sm text-foreground/65">Dubai International Airport (DXB) · Terminal 3</div>
                  <div className="mt-1 flex gap-1.5">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-300">Arrives</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground/70">Baggage belt 7</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><span className="text-accent">👤</span> Passengers</div>
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">AR</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">Arjun Reddy</div>
                  <div className="text-[11px] text-foreground/60">Adult · Passport J8924031 · Indian · DOB 12 Mar 1990</div>
                </div>
                {seat ? (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-300">Seat {seat}</span>
                ) : (
                  <Link to="/app/$" params={{ _splat: `check-in/${pnr}/seats` }} className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-600 dark:text-amber-300 hover:underline">Seat: not selected — pick →</Link>
                )}
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-300">VGML</span>
              </div>
            </Card>

            <Card>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><span className="text-accent">🧳</span> Add-ons included</div>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { i: "🧳", t: "Baggage", s: "7 kg cabin + 23 kg hold (Flex)", act: () => toast.success("Baggage allowance confirmed: 1 x 23 kg hold + 7 kg cabin") },
                  { i: "🍽", t: "Meal", s: "Vegetarian (VGML)", act: () => toast.success("Special meal confirmed: Vegetarian Hindu (VGML)") },
                  { i: "🛡", t: "Travel insurance", s: "Medical + cancellation cover", act: () => toast.success("Travel insurance policy active · Policy #TI-991204") },
                  { i: "+", t: "Add more extras", s: "Wi-Fi, lounge, upgrade", act: () => navigate({ to: "/app/$", params: { _splat: "booking/extras" } }) },
                ].map((x) => (
                  <div
                    key={x.t}
                    onClick={x.act}
                    className="flex gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-accent/40 hover:bg-muted/40 transition-colors"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/10">{x.i}</span>
                    <div><div className="text-sm font-medium">{x.t}</div><div className="text-[11px] text-foreground/60">{x.s}</div></div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><span className="text-accent">📄</span> Payment receipt</div>
              <div className="space-y-1.5 text-sm">
                {[
                  ["Base fare (1 adult)", "₹12,400"],
                  ["Baggage (23 kg)", "Included", "emerald"],
                  ["Meal (VGML)", "Included", "emerald"],
                  ["Travel insurance", "₹349"],
                  ["Taxes & fees", "₹1,240"],
                  ["Promo (MONSOON30)", "−₹500", "rose"],
                ].map(([l, v, tone]) => (
                  <div key={l} className="flex justify-between">
                    <span className="text-foreground/70">{l}</span>
                    <span className={`font-medium ${tone === "emerald" ? "text-emerald-600 dark:text-emerald-300" : tone === "rose" ? "text-rose-500" : ""}`}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="my-3 border-t border-border" />
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold">Total charged</span>
                <span className="font-display text-xl font-bold text-accent">₹13,489</span>
              </div>
              <div className="mt-1 text-[11px] text-foreground/55">Paid via Visa •••• 4291 · 3 Jun 2026</div>
              <button
                type="button"
                onClick={handleDownloadInvoice}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                ⤓ Download invoice / GST receipt
              </button>
            </Card>
          </div>

          {/* right column */}
          <aside className="space-y-5">
            <Card className="border-accent/30 bg-accent/5">
              <div className="text-sm font-semibold text-accent">🔔 Check-in is open for this flight.</div>
              <p className="mt-1 text-xs text-foreground/70">Online check-in closes at 21:30 on 28 Jun.</p>
              <Link to="/app/$" params={{ _splat: `check-in/${pnr}` }} className="mt-2 inline-block text-xs font-medium text-accent">Check in now →</Link>
            </Card>

            <Card>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><span className="text-accent">▦</span> Boarding pass</div>
              <MiniBoardingPass
                carrier="" cabin="" aircraft=""
                from="BOM" to="DXB" fromCity="" toCity=""
                dep="" arr="" duration=""
                passenger="Arjun Reddy" seat={seat ?? "Not yet"} gate="C12" boarding="21:45" date="28 Jun 26" pnr="SW-811"
              />
              <p className="mt-2 text-center text-[11px] text-foreground/60">Complete check-in to generate full boarding pass</p>
              <Link to="/app/$" params={{ _splat: `check-in/${pnr}` }} className="mt-3 block rounded-md border border-border bg-card px-3 py-2 text-center text-sm hover:bg-muted">✓ Check-in to unlock</Link>
            </Card>

            <Card>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><span className="text-accent">✨</span> Complete your trip</div>
              <div className="space-y-3">
                {[
                  {
                    i: "💺",
                    t: "Upgrade to Business",
                    s: "2 seats left · reclining bed + lounge",
                    cta: "Bid from ₹8,500",
                    act: () => toast.success("Upgrade bid of ₹8,500 submitted for Business class!"),
                  },
                  {
                    i: "🛋",
                    t: "BOM lounge access",
                    s: "T2 SkyLounge · food, showers, Wi-Fi",
                    cta: "₹1,200",
                    act: () => toast.success("BOM T2 SkyLounge pass added to booking (+₹1,200)"),
                  },
                  {
                    i: "📶",
                    t: "In-flight Wi-Fi",
                    s: "Unlimited for the full flight",
                    cta: "₹699",
                    act: () => toast.success("Unlimited In-flight Wi-Fi pass activated (+₹699)"),
                  },
                  {
                    i: "🏨",
                    t: "Hotels in Dubai",
                    s: "Member rates · near DXB",
                    cta: "From ₹6,400/night",
                    act: () => toast.info("Searching partner hotel rates in Dubai for SkyWay members..."),
                  },
                ].map((x) => (
                  <div
                    key={x.t}
                    onClick={x.act}
                    className="flex gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-accent/40 hover:bg-muted/40 transition-colors"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/10">{x.i}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{x.t}</div>
                      <div className="text-[11px] text-foreground/60">{x.s}</div>
                      <div className="mt-0.5 text-xs font-medium text-accent">{x.cta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><span className="text-accent">ℹ</span> Key info</div>
              <div className="space-y-2 text-xs">
                {[
                  ["Check-in closes", "21:30 · 28 Jun"],
                  ["Gate closes", "22:00 · 28 Jun"],
                  ["Arrives DXB", "00:40 · 29 Jun"],
                  ["Miles to earn", "~3,240 miles", "accent"],
                  ["Booking date", "3 Jun 2026"],
                ].map(([l, v, tone]) => (
                  <div key={l} className="flex justify-between">
                    <span className="text-foreground/65">{l}</span>
                    <span className={`font-medium ${tone === "accent" ? "text-accent" : ""}`}>{v}</span>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Web Check-in flow
// ============================================================

const CHECKIN_STEPS = ["Verify", "Passenger", "Seat", "Bags & extras", "Boarding pass"];

function CheckInProgress({ current }: { current: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {CHECKIN_STEPS.map((s, i) => {
        const active = i + 1 === current;
        const done = i + 1 < current;
        return (
          <div key={s} className="flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
              active ? "bg-accent text-white" : done ? "bg-emerald-500 text-white" : "bg-muted text-foreground/55"
            }`}>{done ? "✓" : i + 1}</span>
            <span className={`text-xs ${active ? "text-foreground font-medium" : "text-foreground/55"}`}>{s}</span>
            {i < CHECKIN_STEPS.length - 1 && <span className="h-px w-6 bg-border md:w-10" />}
          </div>
        );
      })}
    </div>
  );
}

export function CheckInPage({ pnr }: { pnr: string }) {
  const page = findPage("/check-in/:pnr")!;
  const seat = useSelectedSeat(pnr);
  return (
    <div>
      <PageHeader title={`Web check-in · ${pnr}`} blurb={page.blurb} services={page.services} crumbs={["Check-in", pnr]} />
      <div className="space-y-5 p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
          <Link to="/app/$" params={{ _splat: `my-trips/${pnr}` }} className="text-sm text-foreground/65 hover:text-foreground">← Back</Link>
          <CheckInProgress current={1} />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <Card>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><span className="text-accent">✈</span> Confirm your flight</div>
              <div className="overflow-hidden rounded-xl bg-gradient-to-br from-accent to-accent/80 p-5 text-white">
                <div className="text-[11px] text-white/75">SkyWay SW-811 · Sat 28 Jun 2026</div>
                <div className="mt-1 font-display text-3xl font-bold">BOM → DXB</div>
                <div className="mt-4 grid grid-cols-3 items-end">
                  <div>
                    <div className="font-display text-2xl font-semibold">22:15</div>
                    <div className="text-[11px] text-white/75">BOM · T2</div>
                  </div>
                  <div className="text-center text-[11px] text-white/80">
                    <div>3h 25m · Non-stop</div>
                    <div className="text-white/65">on time</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl font-semibold">00:40</div>
                    <div className="text-[11px] text-white/75">DXB · T3</div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-white/85">
                  <span>🚪 Gate C12</span><span>⏱ Boarding 21:45</span><span>✈ Airbus A330</span><span>✓ On time</span>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              {[
                { i: "⟳", t: "Check-in window open", s: "Opens T-24h · closes 21:30 on 28 Jun (T-45min)", badge: "Active", tone: "blue" },
                { i: "🪪", t: "APIS / passport check", s: "Passport J8924031 · Indian · valid through Jan 2030", badge: "Verified", tone: "green" },
                { i: "🔍", t: "Watchlist screening", s: `PNR ${pnr} passed government no-fly list check`, badge: "Cleared", tone: "green" },
                { i: "💺", t: seat ? `Seat ${seat} selected` : "Seat not yet selected", s: seat ? "You can change it any time before check-in closes" : "You can choose a seat in the next step", badge: seat ? "Assigned" : "Pending", tone: seat ? "green" : "amber" },
                { i: "🧳", t: "Baggage included", s: "7 kg cabin + 23 kg check-in (Flex fare)", badge: "Included", tone: "green" },
              ].map((row) => (
                <Card key={row.t} className="flex items-center gap-3">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    row.tone === "blue" ? "bg-accent/10 text-accent"
                      : row.tone === "green" ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-300"
                      : "bg-amber-500/10 text-amber-500 dark:text-amber-300"
                  }`}>{row.i}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{row.t}</div>
                    <div className="text-[11px] text-foreground/60">{row.s}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${
                    row.tone === "blue" ? "bg-accent/10 text-accent ring-accent/30"
                      : row.tone === "green" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 ring-emerald-500/25"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-300 ring-amber-500/25"
                  }`}>{row.badge}</span>
                </Card>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <Card>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/55">Check-in summary</div>
              <div className="space-y-2 text-sm">
                {[
                  ["Flight", "SW-811 · 28 Jun"],
                  ["Route", "BOM → DXB", "accent"],
                  ["Passenger", "Arjun Reddy"],
                  ["Seat", seat ?? "Not selected", seat ? "emerald" : "accent"],
                  ["Baggage", "1 × 23 kg", "emerald"],
                  ["Meal", "VGML"],
                  ["Wi-Fi", "Not added", "muted"],
                  ["Lounge", "Not added", "muted"],
                ].map(([l, v, tone]) => (
                  <div key={l} className="flex justify-between">
                    <span className="text-foreground/65">{l}</span>
                    <span className={`font-medium ${
                      tone === "accent" ? "text-accent"
                        : tone === "emerald" ? "text-emerald-600 dark:text-emerald-300"
                        : tone === "muted" ? "text-foreground/55" : ""
                    }`}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="my-3 border-t border-border" />
              <div className="flex justify-between text-sm">
                <span className="text-foreground/65">Extras due</span>
                <span className="font-semibold text-accent">₹0</span>
              </div>
            </Card>

            <Card className="border-accent/30 bg-accent/5">
              <div className="text-sm font-semibold text-accent">⏱ Check-in closes at 21:30 on 28 Jun</div>
              <p className="mt-1 text-xs text-foreground/70">(45 min before departure). Gate C12 closes at 22:00.</p>
            </Card>

            <Card>
              <div className="text-sm font-semibold">📍 Arrive at BOM Terminal 2</div>
              <p className="mt-1 text-xs text-foreground/65">at least 2 hours before departure. Bag drop at counters 30–38.</p>
            </Card>
          </aside>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3">
          <span className="text-xs text-foreground/60">🔒 Secure check-in · step 1 of 5</span>
          <Link to="/app/$" params={{ _splat: `check-in/${pnr}/boarding-pass` }} className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:opacity-90">
            Confirm flight details ↗
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Boarding Pass
// ============================================================

function BPRow({ l, v, tone }: { l: string; v: string; tone?: "accent" | "muted" }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-foreground/65">{l}</span>
      <span className={`font-medium ${tone === "accent" ? "text-accent" : tone === "muted" ? "text-foreground/55" : ""}`}>{v}</span>
    </div>
  );
}

export function BoardingPassPage({ pnr }: { pnr: string }) {
  const page = findPage("/check-in/:pnr/boarding-pass")!;
  const seat = useSelectedSeat(pnr, "22A") ?? "22A";
  const seatCol = seat.slice(-1);
  const seatSuffix = seatCol === "A" || seatCol === "F" ? " · window" : seatCol === "C" || seatCol === "D" ? " · aisle" : " · middle";
  return (
    <div>
      <PageHeader title="Boarding pass" blurb={page.blurb} services={page.services} crumbs={["Check-in", pnr, "Pass"]} />
      <div className="space-y-5 p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm">
            <Link to="/app/$" params={{ _splat: `check-in/${pnr}` }} className="text-foreground/65 hover:text-foreground">← Back</Link>
            <span className="text-foreground/40">›</span>
            <span className="text-foreground/80">Boarding pass · {pnr}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/app/$" params={{ _splat: `check-in/${pnr}/seats` }} className="rounded-md border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/15">💺 Select seat</Link>
            <button data-quiet onClick={() => { downloadBoardingPassPDF(); toast.success("Boarding pass PDF downloaded"); }} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">⤓ Download PDF</button>
            <button data-quiet onClick={() => { window.open("about:blank", "_blank"); toast.success("Opening Apple/Google Wallet…"); }} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">▭ Add to wallet</button>
          </div>
        </div>


        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <Card>
              <div className="mb-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-semibold"><span className="text-accent">✈</span> SW-811 · BOM → DXB · live status</div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-300">● Updated 18s ago</span>
              </div>
              <div className="space-y-2 text-sm">
                <BPRow l="Status" v="On time" tone="accent" />
                <BPRow l="Departure" v="22:15 · Gate C12 · Terminal 2" />
                <BPRow l="Boarding starts" v="21:45 · in 3 hrs 12 min" tone="accent" />
                <BPRow l="Aircraft" v="Airbus A330 · VT-SKW · at gate" />
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-semibold">Boarding pass</div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toast.info("Viewing Arjun Reddy's primary boarding pass")}
                    className="rounded-full border border-accent bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
                  >
                    👤 Arjun Reddy
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.info("Companion pass: Priya Reddy (Seat 12B) added to view")}
                    className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-foreground/65 hover:bg-muted hover:text-foreground"
                  >
                    + Add pax
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl bg-gradient-to-br from-accent to-accent/80 text-white">
                <div className="flex items-center justify-between px-5 pt-4 text-[11px]">
                  <span className="text-white/75">✈ SkyWay Airlines · Economy</span>
                  <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[11px] text-emerald-50">On time</span>
                </div>
                <div className="px-5 pb-4 pt-3">
                  <div className="font-display text-3xl font-bold">BOM <span className="opacity-80">→</span> DXB</div>
                  <div className="mt-4 grid grid-cols-3 items-end">
                    <div>
                      <div className="font-display text-2xl font-semibold">22:15</div>
                      <div className="text-[11px] text-white/75">Mumbai (BOM)</div>
                      <div className="text-[11px] text-white/65">Terminal 2</div>
                    </div>
                    <div className="text-center text-[11px] text-white/80">
                      <div>✈ Non-stop · 3h 25m</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-2xl font-semibold">00:40</div>
                      <div className="text-[11px] text-white/75">Dubai (DXB)</div>
                      <div className="text-[11px] text-white/65">Terminal 3 (+1 day)</div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-2 border-t border-white/15 pt-3 text-[10px] uppercase tracking-wider text-white/65">
                    <div><div>Passenger</div><div className="mt-0.5 text-xs font-medium normal-case tracking-normal text-white">Arjun Reddy</div></div>
                    <div><div>Seat</div><div className="mt-0.5 text-xs font-mono text-white">{seat}</div></div>
                    <div><div>Gate</div><div className="mt-0.5 text-xs font-mono text-white">C12</div></div>
                    <div><div>Boarding</div><div className="mt-0.5 text-xs font-mono text-white">21:45</div></div>
                  </div>
                </div>
                <div className="relative border-t border-dashed border-white/25 bg-white/5 px-5 py-4">
                  <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-background" />
                  <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-background" />
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">AR</span>
                    <div className="text-[11px] text-white/85">
                      <div className="text-sm font-medium text-white">Arjun Reddy</div>
                      <div>Passport J8924031 · Indian</div>
                    </div>
                    <div className="ml-auto flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px]">★ Gold</span>
                      <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px]">VGML</span>
                      <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px]">23 kg bag</span>
                      <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px]">SW-811</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-[10px] uppercase tracking-wider text-white/65">Scan at gate</div>
                      <div className="mt-2 h-14 bg-[repeating-linear-gradient(90deg,white_0_2px,transparent_2px_5px)] opacity-90" />
                      <div className="mt-1 font-mono text-[10px] text-white/70">{pnr} · 218 · ARJUNREDDY · {seat} · BOM DXB</div>
                    </div>
                    <div className="flex h-20 w-20 items-center justify-center rounded-md bg-white/15">
                      <div className="h-14 w-14 bg-[repeating-linear-gradient(0deg,white_0_2px,transparent_2px_4px),repeating-linear-gradient(90deg,white_0_2px,transparent_2px_4px)] opacity-90" />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 border-t border-dashed border-white/25 pt-3 text-[10px] uppercase tracking-wider text-white/65">
                    <div><div>PNR</div><div className="mt-0.5 text-xs font-mono text-white">{pnr}</div></div>
                    <div><div>Flight</div><div className="mt-0.5 text-xs font-mono text-white">SW-811</div></div>
                    <div><div>Date</div><div className="mt-0.5 text-xs font-mono text-white">28 Jun 26</div></div>
                    <div><div>Class</div><div className="mt-0.5 text-xs font-mono text-white">Economy</div></div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="mb-4 text-sm font-semibold">Get your boarding pass</div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {[
                  { i: "⤓", t: "Download PDF", s: "Print at home or show on screen", toast: "Boarding pass PDF downloaded" },
                  { i: "🍎", t: "Apple Wallet", s: "One-tap access · auto-updates", toast: "Added to Apple Wallet" },
                  { i: "G", t: "Google Wallet", s: "Android · Wear OS compatible", toast: "Added to Google Wallet" },
                  { i: "✉", t: "Email to me", s: "PDF attached to arjun@email.com", toast: "Emailed to arjun@email.com" },
                  { i: "⌬", t: "WhatsApp", s: "Send link to mobile", toast: "WhatsApp link sent to +91 98765 43210" },
                  { i: "🖨", t: "Print at kiosk", s: "BOM Terminal 2 · counters 18–26", toast: "Kiosk QR generated — scan at counter 18–26" },
                ].map((x) => (
                  <button key={x.t} data-quiet onClick={() => {
                    if (x.t === "Download PDF") downloadBoardingPassPDF();
                    else if (x.t === "Apple Wallet" || x.t === "Google Wallet") window.open("about:blank", "_blank");
                    toast.success(x.toast);
                  }} className="flex items-start gap-3 rounded-lg border border-border p-3 text-left hover:border-accent/40">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">{x.i}</span>
                    <div><div className="text-sm font-medium">{x.t}</div><div className="text-[11px] text-foreground/60">{x.s}</div></div>
                  </button>
                ))}

              </div>
            </Card>
          </div>

          <aside className="space-y-5">
            <Card className="border-accent/30 bg-accent/5 text-center">
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground/60">Boarding opens in</div>
              <div className="mt-2 font-display text-4xl font-bold text-accent">3:10:47</div>
              <div className="mt-1 text-xs text-foreground/65">Gate C12 · Terminal 2</div>
            </Card>

            <Card>
              <div className="space-y-2">
                <BPRow l="Flight" v="SW-811" />
                <BPRow l="Date" v="28 Jun 2026 · Sat" />
                <BPRow l="Seat" v={`${seat}${seatSuffix}`} tone="accent" />
                <BPRow l="Boarding group" v="Group 1 · priority" tone="accent" />
                <BPRow l="Gate" v="C12" />
                <BPRow l="Baggage" v="7 kg + 23 kg" />
                <BPRow l="Miles to earn" v="~3,240" tone="accent" />
              </div>
            </Card>

            <Card>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold"><span className="text-accent">📍</span> Airport guide · BOM T2</div>
                <Link to="/app/$" params={{ _splat: "terminal-map" }} className="text-xs font-semibold text-accent hover:underline">
                  Open Map ↗
                </Link>
              </div>
              <ol className="space-y-3 text-xs">
                {[
                  { t: "Bag drop", s: "Counters 30–38 · Flex lane available", cta: "By 21:00 (90 min before)" },
                  { t: "Security checkpoint", s: "Terminal 2 main · 15–25 min average wait", cta: "Allow 30 min" },
                  { t: "SkyLounge (Gold access)", s: "Level 3 · international departures · complimentary", cta: "Opens until 22:00" },
                  { t: "Gate C12", s: "Concourse C · 8-min walk from security", cta: "Boarding 21:45" },
                ].map((s, i) => (
                  <li key={s.t} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[11px] font-semibold text-accent">{i + 1}</span>
                    <div>
                      <div className="text-sm font-medium">{s.t}</div>
                      <div className="text-foreground/60">{s.s}</div>
                      <div className="mt-0.5 font-medium text-accent">{s.cta}</div>
                    </div>
                  </li>
                ))}
              </ol>
              <Link to="/app/$" params={{ _splat: "terminal-map" }} className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-accent/10 border border-accent/30 py-2 text-xs font-semibold text-accent hover:bg-accent/20 transition-all">
                <span>🧭</span> View Gate C12 on Interactive Terminal Map →
              </Link>
            </Card>

            <Card>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><span className="text-accent">🔔</span> Notifications enabled</div>
              <ul className="space-y-1.5 text-xs text-foreground/75">
                <li>✓ Gate change alerts</li>
                <li>✓ Boarding call (T-30 min)</li>
                <li>✓ Delay & cancellation alerts</li>
                <li>✓ Baggage carousel notification</li>
              </ul>
              <Link to="/app/$" params={{ _splat: "notifications" }} data-quiet className="mt-3 block w-full rounded-md border border-border px-3 py-2 text-center text-xs hover:bg-muted">Manage notification settings</Link>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

export function LoyaltyPage() {
  const page = findPage("/loyalty")!;
  const [milesToUse, setMilesToUse] = useState(25000);
  const [redeemTab, setRedeemTab] = useState<"Flights" | "Upgrades" | "Hotels" | "Shopping">("Flights");
  const [expiry, setExpiry] = useState("Dec 2026");
  const [validityExtended, setValidityExtended] = useState(false);
  const fareOffset = Math.round((milesToUse / 1000) * 100);
  const remaining = 42580 - milesToUse;
  const history = [
    { icon: "✈", route: "BLR → DEL · SW-501", sub: "Flight completed · 1 Jun 2026", amt: "+2,840", note: "Credited 2 Jun", pos: true },
    { icon: "⏱", route: "BOM → DXB · SW-811", sub: "Pending · flight 28 Jun 2026", amt: "+3,240 pending", note: "Credits after landing", pos: true, muted: true },
    { icon: "★", route: "Tier bonus · Gold qualifying", sub: "25,000 threshold bonus", amt: "+5,000", note: "15 Apr 2026", pos: true },
    { icon: "✕", route: "Upgrade redemption · DEL-LHR", sub: "Business class upgrade used", amt: "−25,000", note: "18 May 2026", pos: false },
    { icon: "✈", route: "DEL → DXB → LHR · SW-502", sub: "Flight completed · 19 May 2026", amt: "+6,120", note: "Credited 19 May", pos: true },
  ];
  const redeemOptions: Record<typeof redeemTab, Array<{ i: string; t: string; m: string; d: string; badge: string; badgeTone: "emerald" | "amber" | "sky" | "muted"; toast: string }>> = {
    Flights: [
      { i: "✈", t: "Free domestic flight", m: "40,000 miles", d: "Any domestic route · economy · subject to availability", badge: "You qualify", badgeTone: "emerald", toast: "Searching award flights…" },
      { i: "🌐", t: "Free international flight", m: "80,000 miles", d: "Short-haul international · BOM-DXB, DEL-SIN etc.", badge: "Need 37,420 more", badgeTone: "amber", toast: "You need 37,420 more miles" },
      { i: "₹", t: "Offset fare with miles", m: "1,000 miles = ₹100", d: "Use miles to reduce any booking fare at checkout", badge: "Apply at checkout", badgeTone: "sky", toast: "Miles will apply at checkout" },
      { i: "↔", t: "Transfer to partner", m: "Min. 10,000 miles", d: "Emirates Skywards, Marriott, KrisFlyer +5 more", badge: "8 partners", badgeTone: "muted", toast: "Opening partner transfer…" },
    ],
    Upgrades: [
      { i: "★", t: "Economy → Premium Economy", m: "8,000 miles / segment", d: "Confirm 48 hrs before departure", badge: "Available", badgeTone: "emerald", toast: "Upgrade request submitted for SW-811" },
      { i: "★★", t: "Economy → Business", m: "25,000 miles / segment", d: "Lie-flat seat on wide-body flights", badge: "Available", badgeTone: "emerald", toast: "Business upgrade requested" },
      { i: "★★★", t: "Business → First (long-haul)", m: "45,000 miles / segment", d: "First class on select A380 routes", badge: "Limited", badgeTone: "amber", toast: "Added to First class upgrade waitlist" },
      { i: "🥂", t: "Add lounge access", m: "3,500 miles", d: "SkyLounge single-visit pass, any airport", badge: "Instant", badgeTone: "sky", toast: "Lounge pass credited to your wallet" },
    ],
    Hotels: [
      { i: "🛏", t: "Marriott night · category 4", m: "22,000 miles", d: "Standard room, member-only rate", badge: "Best value", badgeTone: "emerald", toast: "Redirecting to Marriott booking" },
      { i: "🌴", t: "Taj resort · leisure category", m: "35,000 miles", d: "Two nights + breakfast at select Taj resorts", badge: "Popular", badgeTone: "amber", toast: "Opening Taj resort collection" },
      { i: "🏙", t: "City hotel · 3–4★", m: "12,000 miles / night", d: "Radisson, Novotel, Lemon Tree, Ibis", badge: "300+ hotels", badgeTone: "sky", toast: "Loading city hotel deals" },
      { i: "🛁", t: "Spa day pass", m: "6,500 miles", d: "Partner spas · 90 min treatment", badge: "Instant", badgeTone: "muted", toast: "Spa voucher emailed to you" },
    ],
    Shopping: [
      { i: "🛒", t: "Amazon voucher", m: "5,000 miles = ₹500", d: "Delivered instantly to your inbox", badge: "Instant", badgeTone: "emerald", toast: "Amazon voucher on the way to your inbox" },
      { i: "📱", t: "Apple gift card", m: "10,000 miles = ₹1,000", d: "For App Store, iTunes, Apple Store", badge: "Instant", badgeTone: "emerald", toast: "Apple gift card redemption started" },
      { i: "🎧", t: "SkyWay merch store", m: "3,000+ miles", d: "Cabin bags, headphones, travel accessories", badge: "New arrivals", badgeTone: "sky", toast: "Opening SkyWay merch store" },
      { i: "🎟", t: "Concert & event tickets", m: "Varies", d: "BookMyShow partnership · early access", badge: "Members-only", badgeTone: "amber", toast: "Loading events near you" },
    ],
  };
  const options = redeemOptions[redeemTab];

  return (
    <div>
      <PageHeader title="Miles & loyalty" blurb={page.blurb} services={page.services} crumbs={["Account", "Miles & loyalty"]} />
      <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Member header card */}
          <Card className="overflow-hidden bg-gradient-to-br from-accent/15 via-card to-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-foreground/60"><span>👤</span>SkyWay Gold member</div>
                <div className="mt-2 font-display text-2xl font-bold">Arjun Reddy</div>
                <div className="mt-1 font-mono text-xs text-foreground/55">SW · 4829 · 1047 · 3821</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider text-foreground/55">Available miles</div>
                <div className="font-display text-4xl font-bold text-accent">42,580</div>
                <div className="text-xs text-foreground/55">valid until Dec 2026</div>
              </div>
            </div>
            <div className="mt-6">
              <div className="mb-1.5 flex justify-between text-xs text-foreground/65"><span>Progress to Platinum</span><span className="font-medium text-foreground">42,580 / 75,000 miles</span></div>
              <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-accent" style={{ width: "56.8%" }} /></div>
              <div className="mt-1.5 flex justify-between text-[11px] text-foreground/55"><span>Gold · 25,000</span><span>32,420 miles to Platinum</span><span>Platinum · 75,000</span></div>
            </div>
          </Card>

          {/* Stat cells */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { v: "42,580", l: "Miles available" },
              { v: "89,420", l: "Total earned" },
              { v: "47",     l: "Flights taken" },
              { v: "Gold",   l: "Current tier" },
            ].map((s) => (
              <Card key={s.l} className="p-4">
                <div className="font-display text-2xl font-semibold">{s.v}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-foreground/55">{s.l}</div>
              </Card>
            ))}
          </div>

          {/* Redeem miles */}
          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold"><span className="text-accent">✈</span>Redeem miles</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["Flights", "Upgrades", "Hotels", "Shopping"] as const).map((t) => (
                <button key={t} data-quiet onClick={() => setRedeemTab(t)} className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${redeemTab === t ? "bg-accent text-white" : "border border-border text-foreground/70 hover:bg-muted"}`}>{t}</button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {options.map((o) => {
                const toneCls =
                  o.badgeTone === "emerald" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" :
                  o.badgeTone === "amber" ? "bg-amber-500/15 text-amber-600 dark:text-amber-300" :
                  o.badgeTone === "sky" ? "bg-sky-500/15 text-sky-600 dark:text-sky-300" :
                  "bg-muted text-foreground/70";
                return (
                  <div key={o.t} className="flex flex-col rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold"><span className="text-accent">{o.i}</span>{o.t}</div>
                    <div className="mt-2 font-display text-2xl font-bold text-accent">{o.m}</div>
                    <div className="mt-0.5 text-xs text-foreground/60">{o.d}</div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${toneCls}`}>{o.badge}</span>
                      <button
                        type="button"
                        onClick={() => toast.success(o.toast)}
                        className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                      >
                        Redeem ↗
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>


          {/* Miles calculator */}
          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold"><span className="text-accent">🧮</span>Miles calculator</div>
            <div className="mt-4 flex items-center gap-4">
              <span className="text-xs text-foreground/60">Miles to use</span>
              <input type="range" min={0} max={42580} step={500} value={milesToUse} onChange={(e) => setMilesToUse(Number(e.target.value))} className="flex-1 accent-accent" />
              <span className="w-20 text-right font-mono text-sm font-semibold">{milesToUse.toLocaleString()}</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4 text-center">
              <div>
                <div className="font-display text-2xl font-bold text-accent">₹{fareOffset.toLocaleString()}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-foreground/55">Fare offset</div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold">{remaining.toLocaleString()}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-foreground/55">Miles remaining</div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold">Dec 2026</div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-foreground/55">Expiry (unchanged)</div>
              </div>
            </div>
          </Card>

          {/* Miles history */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold"><span className="text-accent">🕘</span>Miles history</div>
              <a href="#" className="text-xs font-medium text-accent">View all →</a>
            </div>
            <div className="mt-3 divide-y divide-border">
              {history.map((h) => (
                <div key={h.route} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">{h.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium">{h.route}</div>
                    <div className="truncate text-xs text-foreground/55">{h.sub}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono text-sm font-semibold ${h.pos ? (h.muted ? "text-amber-500" : "text-emerald-500") : "text-rose-500"}`}>{h.amt}</div>
                    <div className="text-[10px] text-foreground/50">{h.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Tier benefits */}
          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold"><span className="text-accent">🏆</span>Tier benefits</div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                { name: "Blue", meta: "0 miles", active: false, perks: [["✓","Earn 1 mile / ₹5 spent"],["✓","Online check-in"],["✕","Priority boarding"],["✕","Lounge access"],["✕","Bonus miles 25%"]] },
                { name: "Gold", meta: "Your tier", active: true, perks: [["✓","Earn 1.5 miles / ₹5"],["✓","Priority check-in"],["✓","Priority boarding"],["✓","Lounge (intl flights)"],["✓","Bonus miles 25%"]] },
                { name: "Platinum", meta: "75,000 miles", active: false, perks: [["✓","Earn 2 miles / ₹5"],["✓","Dedicated check-in"],["✓","Priority + fast track"],["✓","Lounge (all flights)"],["✓","Bonus miles 50%"]] },
              ].map((t) => (
                <div key={t.name} className={`rounded-lg border p-4 ${t.active ? "border-accent ring-2 ring-accent/40 bg-accent/5" : "border-border bg-muted/20"}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-display text-lg font-semibold">{t.name}</div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.active ? "bg-accent text-white" : "bg-muted text-foreground/60"}`}>{t.meta}</span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs">
                    {t.perks.map(([ok, txt]) => (
                      <li key={txt} className="flex items-start gap-2">
                        <span className={ok === "✓" ? "text-emerald-500" : "text-foreground/30"}>{ok}</span>
                        <span className={ok === "✓" ? "text-foreground/80" : "text-foreground/40 line-through"}>{txt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>

          {/* Earn with partners */}
          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold"><span className="text-accent">🏬</span>Earn with partners</div>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              {[
                { icon: "🛏", name: "Marriott hotels", rate: "2 miles per ₹100", tag: "Active", tone: "emerald" },
                { icon: "🚗", name: "Hertz car rental", rate: "3 miles per ₹100", tag: "Active", tone: "emerald" },
                { icon: "💳", name: "HDFC co-brand card", rate: "5 miles per ₹100", tag: "Apply now", tone: "accent" },
                { icon: "🍽", name: "Dining partners", rate: "1 mile per ₹50", tag: "120+ venues", tone: "muted" },
                { icon: "🛒", name: "Amazon India", rate: "1 mile per ₹100", tag: "Linked", tone: "sky" },
                { icon: "···", name: "More partners", rate: "30+ earn partners", tag: "Explore", tone: "muted" },
              ].map((p) => (
                <div key={p.name} className="rounded-lg border border-border bg-muted/20 p-4 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">{p.icon}</div>
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="mt-0.5 text-[11px] text-foreground/55">{p.rate}</div>
                  <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    p.tone === "emerald" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" :
                    p.tone === "accent"  ? "bg-accent/15 text-accent" :
                    p.tone === "sky"     ? "bg-sky-500/15 text-sky-600 dark:text-sky-300" :
                                           "bg-muted text-foreground/60"
                  }`}>{p.tag}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold"><span className="text-amber-500">⏳</span>Miles expiry</div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <div className="font-display text-2xl font-bold">42,580 miles</div>
                <div className="text-xs text-foreground/55">Main balance</div>
              </div>
              <div className="text-right">
                <div className="font-display text-lg font-semibold text-accent">42,580</div>
                <div className="text-xs text-foreground/55">Expires {expiry}</div>
              </div>
            </div>
            {validityExtended ? (
              <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                <span className="font-semibold">✓ Validity extended.</span> Your 42,580 miles now expire {expiry}.
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
                <span className="font-semibold">⚠ Miles expire in 6 months.</span> Book a flight or redeem to keep them active.
              </div>
            )}
            <button
              disabled={validityExtended}
              onClick={() => { setExpiry("Dec 2027"); setValidityExtended(true); }}
              data-toast={validityExtended ? "Already extended" : "Validity extended by 12 months"}
              data-toast-kind="success"
              className="mt-3 w-full rounded-md border border-border py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {validityExtended ? "✓ Extended to Dec 2027" : "Extend validity ↗"}
            </button>
          </Card>

          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold"><span className="text-accent">✦</span>Earn opportunities</div>
            <div className="mt-3 space-y-3 text-sm">
              {[
                { i: "✈", t: "+3,240 miles incoming", s: "BOM→DXB SW-811 · 28 Jun · credits after landing" },
                { i: "💳", t: "5x miles with HDFC card", s: "Earn 5 miles per ₹100 on all SkyWay bookings" },
                { i: "🎁", t: "Monsoon bonus · 2x miles", s: "All flights Jul-Sep · auto-applied · ends 30 Sep" },
              ].map((o) => (
                <div key={o.t} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">{o.i}</span>
                  <div>
                    <div className="text-sm font-medium">{o.t}</div>
                    <div className="text-xs text-foreground/55">{o.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold"><span className="text-accent">ⓘ</span>Quick facts</div>
            <dl className="mt-3 space-y-2 text-sm">
              {[["Earn rate","1.5 miles / ₹5"],["Miles value","₹0.10 per mile"],["Tier year-end","Dec 2026"],["Family pooling","Set up ↗"]].map(([k,v]) => (
                <div key={k} className="flex items-center justify-between">
                  <dt className="text-foreground/60">{k}</dt>
                  <dd className={`font-medium ${v.includes("↗") ? "text-accent" : ""}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const [tab, setTab] = useState<"personal" | "docs" | "prefs" | "pay" | "companions" | "sec">("personal");

  const tabs = [
    { label: "ACCOUNT", items: [
      { id: "personal", icon: "👤", label: "Personal details" },
      { id: "docs", icon: "📄", label: "Travel documents" },
      { id: "prefs", icon: "⚙", label: "Preferences" },
    ]},
    { label: "PAYMENTS", items: [{ id: "pay", icon: "💳", label: "Payment methods" }] },
    { label: "TRAVEL", items: [{ id: "companions", icon: "👥", label: "Travel companions" }] },
    { label: "SETTINGS", items: [{ id: "sec", icon: "🛡", label: "Security & privacy" }] },
  ] as const;

  const personal = [
    ["First name", "Arjun"], ["Last name", "Reddy"],
    ["Date of birth", "12 Mar 1990"], ["Gender", "Male"], ["Nationality", "Indian"],
    ["Email", "arjun.reddy@email.com"], ["Mobile", "+91 98765 43210"],
    ["TSA precheck / KTN", "KTN-491827"], ["Global entry", "Not added"],
  ];
  const address = [
    ["Address", "42 Banjara Hills Road No. 3"], ["City", "Hyderabad"],
    ["Pin code", "500034"], ["State", "Telangana"], ["Country", "India"],
  ];

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-800 shadow-lg">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="relative grid gap-5 p-6 md:grid-cols-[auto_1fr_auto] md:items-center md:p-8">
          <div className="relative">
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-white/15 font-display text-2xl font-bold text-white ring-2 ring-white/30 backdrop-blur-sm md:h-24 md:w-24 md:text-3xl">AR</div>
            <button
              type="button"
              onClick={() => toast.info("Profile photo update opened. Choose a photo to upload.")}
              className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-sky-700 bg-white text-xs text-sky-700 shadow hover:bg-slate-50 transition-colors"
              title="Edit profile photo"
            >
              ✎
            </button>
          </div>

          <div className="min-w-0 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold md:text-3xl">Arjun Reddy</h1>
              <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-xs font-semibold text-amber-200 ring-1 ring-amber-300/40">★ Gold member</span>
            </div>
            <div className="mt-1 text-sm text-white/80">arjun.reddy@email.com · Member since 2019</div>
            <div className="mt-4 max-w-md">
              <div className="mb-1.5 flex items-center justify-between text-xs text-white/80">
                <span>42,580 miles</span><span>Platinum at 60,000</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500" style={{ width: "71%" }} />
              </div>
              <div className="mt-1 text-xs text-white/70">17,420 miles to Platinum</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center text-white md:gap-6">
            {[["42", "Trips"], ["18", "Countries"], ["G", "Tier"]].map(([n, l]) => (
              <div key={l} className="rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm ring-1 ring-white/15">
                <div className="font-display text-xl font-bold">{n}</div>
                <div className="text-[10px] uppercase tracking-wider text-white/70">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar tabs */}
        <aside className="rounded-2xl border border-border bg-card p-3">
          {tabs.map((sec) => (
            <div key={sec.label} className="mt-3 first:mt-0">
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">{sec.label}</div>
              <div className="space-y-0.5">
                {sec.items.map((it) => {
                  const active = tab === it.id;
                  return (
                    <button key={it.id} data-quiet onClick={() => setTab(it.id as typeof tab)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${active ? "bg-accent/10 font-semibold text-accent" : "text-foreground/70 hover:bg-muted"}`}>
                      <span className="w-4 text-center">{it.icon}</span>{it.label}
                      {active && <span className="ml-auto text-xs">→</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* Main panels */}
        <div className="space-y-6">
          {tab === "personal" && <>
            <ProfileSection icon="👤" title="Personal details" action="Edit">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {personal.map(([l, v]) => (
                  <ProfileField key={l} label={l} value={v} />
                ))}
              </div>
            </ProfileSection>

            <ProfileSection icon="📍" title="Address & billing" action="Edit">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {address.map(([l, v]) => (
                  <ProfileField key={l} label={l} value={v} />
                ))}
              </div>
            </ProfileSection>
          </>}

          {tab === "docs" && (
            <ProfileSection icon="📄" title="Travel documents" action="+ Add document">
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { t: "Passport · India", n: "P8492103 · expires 12 Aug 2029", tag: "Verified", tone: "emerald", ic: "🛂" },
                  { t: "PAN card", n: "ABCDE1234F", tag: "Verified", tone: "emerald", ic: "🆔" },
                  { t: "US visa · B1/B2", n: "Valid until 04 Jun 2028", tag: "Verified", tone: "emerald", ic: "🛃" },
                  { t: "Aadhaar", n: "Not linked", tag: "+ Add", tone: "muted", ic: "📇" },
                ].map((d) => (
                  <div key={d.t} className="flex items-center justify-between rounded-xl border border-border bg-background/40 p-4 transition-colors hover:border-foreground/20">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-lg">{d.ic}</div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">{d.t}</div>
                        <div className="text-xs text-foreground/60">{d.n}</div>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${d.tone === "emerald" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" : "bg-muted text-foreground/60"}`}>{d.tag}</span>
                  </div>
                ))}
              </div>
            </ProfileSection>
          )}

          {tab === "prefs" && (
            <ProfileSection icon="⚙" title="Travel preferences" action="Save">
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["Seat preference", "Window · forward cabin"],
                  ["Meal", "Vegetarian (Indian)"],
                  ["Cabin class", "Economy Plus"],
                  ["Special assistance", "None"],
                  ["Communication", "Email + Push"],
                  ["Language", "English (India)"],
                ].map(([l, v]) => <ProfileField key={l} label={l} value={v} />)}
              </div>
            </ProfileSection>
          )}

          {tab === "pay" && (
            <ProfileSection icon="💳" title="Payment methods" action="+ Add card">
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { brand: "Visa", last: "4821", exp: "09 / 27", primary: true },
                  { brand: "Mastercard", last: "9012", exp: "03 / 26" },
                ].map((c) => (
                  <div key={c.last} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-md">
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
                    <div className="flex items-center justify-between text-xs uppercase tracking-wider text-white/70">
                      <span>{c.brand}</span>
                      {c.primary && <span className="rounded-full bg-emerald-500/25 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Primary</span>}
                    </div>
                    <div className="mt-6 font-mono text-lg tracking-widest">•••• •••• •••• {c.last}</div>
                    <div className="mt-4 flex justify-between text-xs text-white/70">
                      <span>Arjun Reddy</span><span>Exp {c.exp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ProfileSection>
          )}

          {tab === "companions" && (
            <ProfileSection icon="👥" title="Travel companions" action="+ Add companion">
              <div className="space-y-2">
                {[
                  { n: "Meera Reddy", r: "Spouse", d: "DOB 22 Aug 1991 · Passport verified", i: "MR" },
                  { n: "Kabir Reddy", r: "Son", d: "DOB 14 Jan 2018 · Minor", i: "KR" },
                ].map((p) => (
                  <div key={p.n} className="flex items-center justify-between rounded-xl border border-border bg-background/40 p-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-sm font-semibold text-white">{p.i}</div>
                      <div>
                        <div className="text-sm font-semibold">{p.n} <span className="text-xs font-normal text-foreground/60">· {p.r}</span></div>
                        <div className="text-xs text-foreground/60">{p.d}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toast.info(`Editing companion details for ${p.n}`)}
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </ProfileSection>
          )}

          {tab === "sec" && (
            <ProfileSection icon="🛡" title="Security & privacy">
              <div className="divide-y divide-border">
                {[
                  { t: "Password", s: "Last changed 3 months ago", cta: "Change" },
                  { t: "Two-factor authentication", s: "Authenticator app · enabled", cta: "Manage", ok: true },
                  { t: "Active sessions", s: "3 devices signed in", cta: "Review" },
                  { t: "Data & privacy", s: "Download or delete your data", cta: "Manage" },
                ].map((r) => (
                  <div key={r.t} className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-sm font-semibold">{r.t}</div>
                      <div className="text-xs text-foreground/60">{r.s}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.ok && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">On</span>}
                      <button
                        type="button"
                        onClick={() => toast.info(`Opened ${r.t} settings modal`)}
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                      >
                        {r.cta}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </ProfileSection>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ icon, title, action, children }: { icon: string; title: string; action?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/15 text-accent">{icon}</span>
          {title}
        </div>
        {action && (
          <button
            type="button"
            onClick={() => toast.success(`${title}: ${action} opened`)}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            {action}
          </button>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  const missing = value === "Not added" || value === "Not linked";
  return (
    <div
      onClick={() => toast.info(`Editing ${label}: ${value}`)}
      className="cursor-pointer group"
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/55">{label}</div>
      <div className="mt-1 flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2.5 text-sm transition-colors group-hover:border-accent/50 group-hover:bg-muted/30">
        <span className={missing ? "text-foreground/40" : "font-medium"}>{value}</span>
        <span className="text-xs text-foreground/40 group-hover:text-accent">{missing ? "+" : "✎"}</span>
      </div>
    </div>
  );
}


export function NotificationsPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <FlightNotificationCenter />
    </div>
  );
}

// ===================================================================
// Disruption support — matches ref image 3
// ===================================================================
export function DisruptionPage({ pnr }: { pnr: string }) {
  const [choice, setChoice] = useState<"rebook" | "browse" | "refund">("rebook");
  const [channels, setChannels] = useState<Record<string, boolean>>({ sms: true, push: true, email: false, call: false });
  const steps = [
    { n: 1, label: "Delay detected", done: true },
    { n: 2, label: "Passengers notified", done: true },
    { n: 3, label: "Choose an option", active: true },
    { n: 4, label: "Confirmation" },
    { n: 5, label: "Resolved" },
  ];

  return (
    <div className="space-y-5 p-6 md:p-8">
      {/* Alert banner */}
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-500/20 text-rose-500">⚠</div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg font-semibold text-foreground">SW411 (DEL → BOM) delayed 45 minutes</div>
            <p className="mt-1 text-sm text-foreground/70">
              Cause: ATC congestion at Delhi. Your connecting flight SW220 (BOM → DXB, 13:30) may be affected. We've put together options below.
            </p>
            <Link to="/app/$" params={{ _splat: "help/article/flight-delayed-3-hours" }} data-quiet className="mt-2 inline-flex text-sm font-medium text-accent hover:underline">Why was this flight delayed? ↗</Link>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {steps.map((s) => (
            <div key={s.n} className="flex flex-col items-center text-center">
              <div className={`grid h-10 w-10 place-items-center rounded-full text-sm font-semibold ${
                s.done ? "bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30" :
                s.active ? "bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/40" :
                "bg-muted text-foreground/50"
              }`}>{s.done ? "✓" : s.n}</div>
              <div className="mt-2 text-xs font-medium text-foreground/75">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Choose options */}
      <div>
        <h2 className="font-display text-xl font-semibold">Choose how to proceed</h2>
        <p className="text-sm text-foreground/60">Pick one option — no action needed if you're happy to continue on the delayed flight</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {[
            { k: "rebook", to: "disruption/rebook", tag: "Recommended", icon: "⇄", title: "Rebook connecting flight", body: "Move to SW 224 (BOM → DXB, 15:45) at no extra cost. Seat and meal preferences carry over.", cta: "Rebook to SW 224" },
            { k: "browse", to: "disruption/browse", icon: "📅", title: "Choose another flight", body: "Browse all available SkyWay and partner flights to Dubai over the next 48 hours.", cta: "Browse flights" },
            { k: "refund", to: "disruption/refund", icon: "🧾", title: "Cancel and refund", body: "Cancel remaining segments and get a full refund to your original payment method.", cta: "View refund breakdown" },
          ].map((o) => {
            const active = choice === (o.k as typeof choice);
            return (
              <Link key={o.k} to="/app/$" params={{ _splat: o.to }} data-quiet
                onClick={() => setChoice(o.k as typeof choice)}
                className={`block text-left rounded-2xl border p-5 transition-all ${active ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-border bg-card hover:border-foreground/20"}`}>
                {o.tag && <div className="mb-2 inline-flex rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">{o.tag}</div>}
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-lg">{o.icon}</div>
                <div className="mt-3 font-display text-base font-semibold">{o.title}</div>
                <p className="mt-1 text-sm text-foreground/65">{o.body}</p>
                <div className={`mt-4 w-full rounded-md py-2 text-center text-sm font-medium ${active ? "bg-accent text-white" : "border border-border text-foreground/80"}`}>{o.cta}</div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Vouchers */}
      <DisruptionVouchers />

      {/* Passengers */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Passengers on this booking</h3>
          <div className="text-xs text-foreground/60">PNR <span className="font-mono font-semibold text-foreground">{pnr.toUpperCase()}</span></div>
        </div>
        <div className="mt-4 space-y-2">
          {[
            { i: "AR", n: "Aarav Rao (you)", status: "Awaiting choice", tone: "amber" },
            { i: "MR", n: "Meera Rao", status: "Awaiting choice", tone: "amber" },
            { i: "KR", n: "Kabir Rao", status: "Rebooked to SW 224", tone: "emerald" },
          ].map((p) => (
            <div key={p.n} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-3 py-2.5">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-xs font-semibold text-white">{p.i}</div>
                <div className="text-sm font-medium">{p.n}</div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${p.tone === "emerald" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" : "bg-amber-500/15 text-amber-600 dark:text-amber-300"}`}>{p.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Compensation */}
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 md:flex-row md:items-center">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/20 text-emerald-500">$</div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-base font-semibold">You may be eligible for compensation</div>
          <p className="text-sm text-foreground/65">Delays over 3 hours qualify for cash compensation under DGCA guidelines</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-foreground/60">Up to</div>
          <div className="font-display text-xl font-bold text-emerald-500">₹5,000</div>
        </div>
        <CompensationCheck />
      </div>

      {/* Contact + notify */}
      <div className="grid gap-3 md:grid-cols-2">
        {[
          { icon: "💬", t: "Chat with support", s: "Avg wait 2 min", to: "help/chat" },
          { icon: "📞", t: "Request a call back", s: "Within 10 min", to: "help/call" },
        ].map((c) => (
          <Link key={c.t} to="/app/$" params={{ _splat: c.to }} data-quiet className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left hover:border-foreground/20">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted">{c.icon}</div>
            <div><div className="text-sm font-semibold">{c.t}</div><div className="text-xs text-foreground/60">{c.s}</div></div>
          </Link>
        ))}
      </div>


      <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4 md:flex-row md:items-center">
        <div className="text-sm font-medium">Notify me about this disruption via</div>
        <div className="flex flex-wrap gap-2">
          {[["sms", "SMS"], ["push", "Push"], ["email", "Email"], ["call", "Call"]].map(([k, l]) => {
            const on = channels[k];
            return (
              <button key={k} data-quiet onClick={() => setChannels({ ...channels, [k]: !on })}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${on ? "bg-accent text-white" : "border border-border text-foreground/70 hover:bg-muted"}`}>
                {l}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DisruptionVouchers() {
  const [hotel, setHotel] = useState<null | { eligible: boolean; ref: string }>(null);
  const [meal, setMeal] = useState<null | { code: string }>(null);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {/* Hotel */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">🏨</div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-base font-semibold">Overnight hotel voucher</div>
            <p className="mt-1 text-sm text-foreground/65">If your rebooked flight departs after 11pm, a hotel near BOM airport is arranged and billed to SkyWay.</p>
            {!hotel ? (
              <button data-quiet onClick={() => {
                const ref = "HTL-" + Math.random().toString(36).slice(2, 7).toUpperCase();
                setHotel({ eligible: true, ref });
                toast.success("Eligible — Hyatt Regency BOM booked");
              }} className="mt-2 inline-flex text-sm font-medium text-accent hover:underline">Check eligibility ↗</button>
            ) : (
              <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
                <div className="font-semibold text-emerald-600 dark:text-emerald-300">✓ Eligible — Hyatt Regency BOM</div>
                <div className="mt-1 text-xs text-foreground/70">Check-in 20:00 · Booking ref <span className="font-mono font-semibold">{hotel.ref}</span></div>
                <div className="mt-2 flex gap-2">
                  <button data-quiet onClick={() => { navigator.clipboard?.writeText(hotel.ref); toast.success("Booking reference copied"); }} className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted">Copy ref</button>
                  <button data-quiet onClick={() => setHotel(null)} className="rounded-md px-2.5 py-1 text-xs font-medium text-foreground/60 hover:text-foreground">Undo</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Meal */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">🍽</div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-base font-semibold">Meal voucher</div>
            <p className="mt-1 text-sm text-foreground/65">Delays over 2 hours qualify for a meal voucher redeemable at any airport outlet.</p>
            {!meal ? (
              <button data-quiet onClick={() => {
                const code = "MEAL-" + Math.random().toString(36).slice(2, 7).toUpperCase();
                setMeal({ code });
                toast.success("₹500 meal voucher added to your wallet");
              }} className="mt-2 inline-flex text-sm font-medium text-accent hover:underline">Redeem voucher ↗</button>
            ) : (
              <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
                <div className="font-semibold text-emerald-600 dark:text-emerald-300">✓ ₹500 voucher added</div>
                <div className="mt-1 text-xs text-foreground/70">Show this code at the outlet: <span className="font-mono font-semibold">{meal.code}</span></div>
                <div className="mt-2 flex gap-2">
                  <button data-quiet onClick={() => { navigator.clipboard?.writeText(meal.code); toast.success("Voucher code copied"); }} className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted">Copy code</button>
                  <button data-quiet onClick={() => setMeal(null)} className="rounded-md px-2.5 py-1 text-xs font-medium text-foreground/60 hover:text-foreground">Undo</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompensationCheck() {
  const [status, setStatus] = useState<"idle" | "checking" | "eligible">("idle");
  if (status === "eligible") {
    return (
      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-300">
        ✓ Eligible — ₹5,000 credited in 7 days
      </div>
    );
  }
  return (
    <button data-quiet disabled={status === "checking"} onClick={() => {
      setStatus("checking");
      setTimeout(() => { setStatus("eligible"); toast.success("You're eligible — ₹5,000 will be credited within 7 days"); }, 800);
    }} className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60">
      {status === "checking" ? "Checking…" : "Check eligibility"}
    </button>
  );
}

// ===================================================================
// Disruption sub-pages
// ===================================================================
export function DisruptionRebookPage() {
  const [confirmed, setConfirmed] = useState(false);
  const [seat, setSeat] = useState("14A");
  const [meal, setMeal] = useState("Vegetarian (VGML)");
  const pnr = "SW8F2K";
  return (
    <div className="space-y-5 p-6 md:p-8">
      <div className="flex items-center gap-2 text-sm text-foreground/60">
        <Link to="/app/$" params={{ _splat: "disruption" }} className="hover:text-foreground">← Disruption</Link>
        <span>/</span><span className="text-foreground">Rebook</span>
      </div>
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-accent">Recommended alternative</div>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <div className="font-display text-2xl font-semibold">SW 224</div>
          <div className="text-sm text-foreground/70">BOM → DXB · Airbus A321neo</div>
        </div>
        <div className="mt-4 grid grid-cols-3 items-center gap-4 text-sm">
          <div>
            <div className="font-display text-xl font-semibold">15:45</div>
            <div className="text-xs text-foreground/60">BOM · Terminal 2</div>
          </div>
          <div className="text-center text-xs text-foreground/60">3h 25m · Non-stop</div>
          <div className="text-right">
            <div className="font-display text-xl font-semibold">17:10</div>
            <div className="text-xs text-foreground/60">DXB · Terminal 1</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="font-display text-base font-semibold">Your preferences carry over</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-foreground/70">Seat</span>
            <select value={seat} onChange={(e) => setSeat(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
              {["14A", "14C", "22F", "9D (Extra legroom, +₹800)"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-foreground/70">Meal</span>
            <select value={meal} onChange={(e) => setMeal(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
              {["Vegetarian (VGML)", "Non-veg", "Vegan (VGAN)", "Hindu (HNML)", "No meal"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="font-display text-base font-semibold">Fare difference</div>
          <div className="text-emerald-500 font-semibold">₹0 · waived</div>
        </div>
        <p className="mt-1 text-xs text-foreground/60">SkyWay is covering the difference under the disruption policy.</p>
      </div>

      {!confirmed ? (
        <button onClick={() => { setConfirmed(true); toast.success("Rebooked to SW 224 — new boarding pass sent"); }} className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white hover:brightness-110">
          Confirm rebooking to SW 224
        </button>
      ) : (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <div className="font-display text-lg font-semibold text-emerald-600 dark:text-emerald-300">✓ Rebooking confirmed</div>
          <div className="mt-2 text-sm text-foreground/75">PNR <span className="font-mono font-semibold">{pnr}</span> · Seat <span className="font-semibold">{seat.split(" ")[0]}</span> · {meal}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/app/$" params={{ _splat: `check-in/${pnr}/boarding-pass` }} className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white">View boarding pass</Link>
            <Link to="/app/$" params={{ _splat: "disruption" }} className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted">Back to disruption</Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function DisruptionBrowsePage() {
  const [selected, setSelected] = useState<string | null>(null);
  const flights = [
    { id: "SW224", label: "SW 224", dep: "15:45", arr: "17:10", dur: "3h 25m", stops: "Non-stop", price: 0, tag: "Recommended" },
    { id: "SW226", label: "SW 226", dep: "19:20", arr: "20:55", dur: "3h 35m", stops: "Non-stop", price: 0, tag: "Included" },
    { id: "SW230", label: "SW 230", dep: "16:30", arr: "18:05", dur: "3h 35m", stops: "Non-stop", price: 0, tag: "Included" },
    { id: "SW232", label: "SW 232", dep: "21:55", arr: "23:35", dur: "3h 40m", stops: "Non-stop", price: 0, tag: "Included" },
    { id: "SW228", label: "SW 228 (next day)", dep: "06:15", arr: "07:55", dur: "3h 40m", stops: "Non-stop", price: 0, tag: "Overnight stay" },
  ];
  const filtered = flights;
  const active = filtered.find((f) => f.id === selected);
  return (
    <div className="space-y-5 p-6 md:p-8">
      <div className="flex items-center gap-2 text-sm text-foreground/60">
        <Link to="/app/$" params={{ _splat: "disruption" }} className="hover:text-foreground">← Disruption</Link>
        <span>/</span><span className="text-foreground">Browse flights</span>
      </div>
      <div>
        <h1 className="font-display text-2xl font-semibold">Alternative SkyWay flights to Dubai</h1>
        <p className="text-sm text-foreground/60">Next 48 hours · complimentary rebooking on any SkyWay flight</p>
      </div>

      <div className="space-y-2">
        {filtered.map((f) => (
          <button key={f.id} onClick={() => setSelected(f.id)} className={`w-full rounded-2xl border p-4 text-left transition-colors ${selected === f.id ? "border-accent bg-accent/5" : "border-border bg-card hover:border-foreground/20"}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-display text-base font-semibold">{f.label}</div>
                  {f.tag && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">{f.tag}</span>}
                </div>
                <div className="mt-1 text-sm text-foreground/70">{f.dep} → {f.arr} · {f.dur} · {f.stops}</div>
              </div>
              <div className="text-right">
                <div className="font-display text-lg font-semibold">{f.price === 0 ? "Free" : `+₹${f.price.toLocaleString("en-IN")}`}</div>
                <div className="text-[10px] uppercase tracking-wider text-foreground/50">fare diff</div>
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-foreground/60">No flights match this filter</div>}
      </div>
      {active && (
        <div className="sticky bottom-4 rounded-2xl border border-accent/40 bg-card p-4 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm"><span className="font-semibold">{active.label}</span> · {active.dep} → {active.arr} · {active.price === 0 ? "no extra charge" : `+₹${active.price.toLocaleString("en-IN")}`}</div>
            <button onClick={() => toast.success(`Rebooked to ${active.label} — confirmation sent`)} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:brightness-110">Rebook</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DisruptionRefundPage() {
  const [method, setMethod] = useState<"original" | "wallet">("original");
  const [initiated, setInitiated] = useState(false);
  const rows: Array<[string, string]> = [
    ["Base fare (BOM → DXB)", "₹6,200"],
    ["Taxes & fees", "₹1,450"],
    ["Seat selection", "₹350"],
    ["Cancellation fee", "−₹0 (disruption waiver)"],
  ];
  const total = method === "wallet" ? "₹8,400" : "₹8,000";
  return (
    <div className="space-y-5 p-6 md:p-8">
      <div className="flex items-center gap-2 text-sm text-foreground/60">
        <Link to="/app/$" params={{ _splat: "disruption" }} className="hover:text-foreground">← Disruption</Link>
        <span>/</span><span className="text-foreground">Refund</span>
      </div>
      <div>
        <h1 className="font-display text-2xl font-semibold">Cancel & refund</h1>
        <p className="text-sm text-foreground/60">Cancels the remaining BOM → DXB segment. Delhi → Mumbai will still operate.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-lg font-semibold">Refund breakdown</h3>
        <div className="mt-4 divide-y divide-border">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-foreground/70">{k}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
          {method === "wallet" && (
            <div className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-foreground/70">Wallet bonus (+5%)</span>
              <span className="font-medium text-emerald-500">+₹400</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-3 text-base font-semibold">
            <span>Total refund</span><span>{total}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="font-display text-base font-semibold">Refund to</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {([["original", "Original payment · Visa •• 4821", "5–7 business days"], ["wallet", "SkyWay wallet (+5% bonus)", "Instant"]] as const).map(([k, t, s]) => (
            <button key={k} onClick={() => setMethod(k)} className={`rounded-xl border p-3 text-left ${method === k ? "border-accent bg-accent/5" : "border-border hover:border-foreground/20"}`}>
              <div className="text-sm font-semibold">{t}</div>
              <div className="text-xs text-foreground/60">{s}</div>
            </button>
          ))}
        </div>
      </div>

      {!initiated ? (
        <button onClick={() => { setInitiated(true); toast.success(`Refund of ${total} initiated`); }} className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white hover:brightness-110">
          Confirm cancellation & refund {total}
        </button>
      ) : (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <div className="font-display text-lg font-semibold text-emerald-600 dark:text-emerald-300">✓ Refund initiated</div>
          <div className="mt-2 text-sm text-foreground/75">{total} to {method === "wallet" ? "SkyWay wallet (available now)" : "Visa •• 4821 in 5–7 business days"}. A confirmation email has been sent.</div>
          <div className="mt-3">
            <Link to="/app/$" params={{ _splat: "my-trips" }} className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white">View my trips</Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ===================================================================
// Flight status — matches ref images 2 & 5
// ===================================================================
export function FlightStatusPage({ id }: { id: string }) {
  const [mode, setMode] = useState<"num" | "route">("num");
  const [status, setStatus] = useState<string>("On time");
  const [notified, setNotified] = useState(false);
  const bars = [70, 92, 88, 95, 91]; // on-time trend
  const dates = ["28 Jun", "29 Jun", "30 Jun", "02 Jul", "03 Jul"];

  const statusMeta: Record<string, { tone: string; note: string; badge: string }> = {
    "On time":   { tone: "emerald", note: "On schedule", badge: "✓ On time" },
    "Delayed":   { tone: "amber",   note: "Delayed 45 min · ATC congestion", badge: "⏱ Delayed" },
    "Boarding":  { tone: "sky",     note: "Boarding at Gate A22", badge: "🚪 Boarding" },
    "In air":    { tone: "indigo",  note: "Cruising at 36,000 ft · ETA 12:25", badge: "✈ In air" },
    "Landed":    { tone: "emerald", note: "Landed · Baggage on belt 6", badge: "🛬 Landed" },
    "Cancelled": { tone: "rose",    note: "Cancelled · Rebooking options available", badge: "✕ Cancelled" },
  };
  const meta = statusMeta[status];
  const toneClasses: Record<string, string> = {
    emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    amber:   "bg-amber-500/15 text-amber-600 dark:text-amber-300",
    sky:     "bg-sky-500/15 text-sky-600 dark:text-sky-300",
    indigo:  "bg-indigo-500/15 text-indigo-500",
    rose:    "bg-rose-500/15 text-rose-500",
  };

  const runSearch = () => {
    toast.success(mode === "num" ? `Tracking ${id.toUpperCase()} · 04 Jul` : "Showing DEL → BOM · 04 Jul");
  };

  return (
    <div className="space-y-5 p-6 md:p-8">
      {/* Search switcher */}
      <div className="flex gap-2">
        {[["num", "By flight number"], ["route", "By route"]].map(([k, l]) => (
          <button key={k} data-quiet onClick={() => setMode(k as typeof mode)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${mode === k ? "bg-accent text-white" : "border border-border text-foreground/70 hover:bg-muted"}`}>
            {l}
          </button>
        ))}
      </div>

      {mode === "num" ? (
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <FieldBox label="Flight number" value={id.toUpperCase()} />
          <FieldBox label="Date" value="04 Jul 2026" />
          <button data-quiet onClick={runSearch} className="rounded-2xl border border-border bg-card px-6 py-4 text-sm font-semibold hover:border-foreground/20">Track flight</button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr]">
          <FieldBox label="From" value="Delhi (DEL)" sub="Indira Gandhi Intl" />
          <div className="grid place-items-center"><button data-quiet onClick={() => toast("Origin & destination swapped")} className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card">⇄</button></div>
          <FieldBox label="To" value="Mumbai (BOM)" sub="Chhatrapati Shivaji" />
          <div className="md:col-span-2"><FieldBox label="Date" value="04 Jul 2026" /></div>
          <button data-quiet onClick={runSearch} className="rounded-2xl bg-accent px-6 py-4 text-sm font-semibold text-white hover:opacity-90">🔍 Search</button>
        </div>
      )}

      {/* Status chips */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(statusMeta).map((s) => (
          <button key={s} data-quiet onClick={() => { setStatus(s); toast.info(`Filtering by "${s}"`); }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${status === s ? "bg-accent text-white" : "border border-border text-foreground/70 hover:bg-muted"}`}>{s}</button>
        ))}
      </div>

      {/* Main flight card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-display text-xl font-semibold">{id.toUpperCase()} · Delhi to Mumbai</div>
            <div className="text-sm text-foreground/60">Fri, 04 Jul 2026 · Airbus A320neo</div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${toneClasses[meta.tone]}`}>{meta.badge}</span>
        </div>

        <div className="mt-6 grid grid-cols-[auto_1fr_auto] items-center gap-4">
          <div>
            <div className="font-display text-4xl font-bold tracking-tight">DEL</div>
            <div className="text-xs text-foreground/60">Delhi · T3</div>
            <div className="mt-1 text-lg font-semibold">10:15</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative h-1 w-full rounded-full bg-muted">
              <div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: status === "In air" ? "60%" : status === "Landed" ? "100%" : "30%" }} />
              <div className="absolute -top-1.5 text-lg" style={{ left: status === "In air" ? "58%" : status === "Landed" ? "96%" : "28%" }}>✈</div>
            </div>
            <div className="mt-3 text-xs text-foreground/60">{meta.note}</div>
          </div>
          <div className="text-right">
            <div className="font-display text-4xl font-bold tracking-tight">BOM</div>
            <div className="text-xs text-foreground/60">Mumbai · T2</div>
            <div className="mt-1 text-lg font-semibold">12:25</div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-4 py-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-amber-500/15 text-amber-500">☀</div>
            <div className="min-w-0"><div className="text-xs text-foreground/60">Delhi</div><div className="text-sm font-semibold">34°C <span className="font-normal text-foreground/60">Clear</span></div></div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-4 py-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-sky-500/15 text-sky-500">🌧</div>
            <div className="min-w-0"><div className="text-xs text-foreground/60">Mumbai</div><div className="text-sm font-semibold">29°C <span className="font-normal text-foreground/60">Light rain</span></div></div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
          <Field label="Gate" value="A22" />
          <Field label="Terminal" value="T3 → T2" />
          <Field label="Baggage belt" value={status === "Landed" ? "6" : "—"} />
          <Field label="Status note" value={meta.note} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-foreground/80"><span className="text-amber-500">⚠</span> This delay may affect your connecting flight. See rebooking options.</div>
          <Link to="/app/$" params={{ _splat: "disruption" }} data-quiet className="rounded-md bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted">View options →</Link>
        </div>
      </div>

      {/* Action row */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <Link to="/app/$" params={{ _splat: "terminal-map" }}
          className="flex items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent hover:bg-accent/15 transition-colors">
          <span>🧭</span>Terminal Map
        </Link>
        <button data-quiet onClick={() => { setNotified((v) => !v); toast.success(notified ? "Notifications turned off" : `You'll be notified about ${id.toUpperCase()}`); }}
          className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${notified ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-foreground/20"}`}>
          <span>🔔</span>{notified ? "Notifications on" : "Notify me"}
        </button>
        <button data-quiet onClick={() => shareStatus(`${id.toUpperCase()} · DEL → BOM`, `${meta.badge} · Dep 10:15 → Arr 12:25`)}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:border-foreground/20"><span>↗</span>Share status</button>
        <button data-quiet onClick={() => { downloadICS({ title: `${id.toUpperCase()} DEL → BOM`, startISO: "2026-07-04T10:15:00", endISO: "2026-07-04T12:25:00", location: "DEL T3 → BOM T2", description: `SkyWay ${id.toUpperCase()} · Gate A22`, filename: `${id}.ics` }); toast.success("Calendar event downloaded"); }}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:border-foreground/20"><span>📅</span>Add to calendar</button>
      </div>


      {/* Info + performance */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><span className="text-accent">✈</span> Aircraft & flight info</div>
          <div className="mt-3 divide-y divide-border text-sm">
            {[["Aircraft", "Airbus A320neo"], ["Tail number", "VT-SWK"], ["Aircraft age", "2.4 years"], ["Wifi onboard", "Available"], ["Flight duration", "2h 10m"]].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2"><span className="text-foreground/60">{k}</span><span className="font-medium">{v}</span></div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><span className="text-accent">📊</span> On-time performance · {id.toUpperCase()}</div>
          <div className="mt-4 flex h-32 items-end gap-3">
            {bars.map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="w-full rounded-t bg-emerald-500/70 transition-all hover:bg-emerald-500" style={{ height: `${h}%` }} />
                <div className="text-[10px] text-foreground/60">{dates[i]}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-sm"><span className="text-foreground/60">30-day on-time rate</span><span className="font-semibold text-emerald-500">91%</span></div>
        </div>
      </div>

      {/* Recently tracked */}
      <div>
        <h3 className="mb-2 font-display text-lg font-semibold">Recently tracked</h3>
        <div className="space-y-2">
          {[
            { n: "SW220", r: "BOM → DXB · 02 Jul", s: "Landed", tone: "emerald" },
            { n: "SW118", r: "BLR → DEL · 29 Jun", s: "Landed", tone: "emerald" },
            { n: "SW902", r: "DEL → SIN · 26 Jun", s: "Cancelled", tone: "rose" },
          ].map((r) => (
            <div key={r.n} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-4">
                <div className="font-mono text-sm font-semibold w-16">{r.n}</div>
                <div className="text-sm text-foreground/70">{r.r}</div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${r.tone === "emerald" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" : "bg-rose-500/15 text-rose-500"}`}>{r.s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FieldBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">{label}</div>
      <div className="mt-0.5 text-base font-semibold">{value}</div>
      {sub && <div className="text-xs text-foreground/55">{sub}</div>}
    </div>
  );
}

// ===================================================================
// Help centre — matches ref image 4
// ===================================================================
export function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const topics = [
    { i: "🎫", t: "Booking & payments", slug: "booking-payments", tone: "sky" },
    { i: "✓", t: "Check-in & boarding", slug: "check-in-boarding", tone: "emerald" },
    { i: "🧳", t: "Baggage", slug: "baggage", tone: "amber" },
    { i: "⚠", t: "Delays & cancellations", slug: "delays-cancellations", tone: "rose" },
    { i: "💳", t: "Refunds & cancellations", slug: "refunds", tone: "indigo" },
    { i: "★", t: "Miles & loyalty", slug: "miles-loyalty", tone: "amber" },
    { i: "♿", t: "Special assistance", slug: "special-assistance", tone: "sky" },
    { i: "🔒", t: "Account & security", slug: "account-security", tone: "emerald" },
  ].map((t) => ({ ...t, n: HELP_TOPICS[t.slug]?.articles.length ?? 0 }));
  const toneMap: Record<string, string> = {
    sky: "bg-sky-500/15 text-sky-500",
    emerald: "bg-emerald-500/15 text-emerald-500",
    amber: "bg-amber-500/15 text-amber-500",
    rose: "bg-rose-500/15 text-rose-500",
    indigo: "bg-indigo-500/15 text-indigo-500",
  };
  const faqs = [
    { q: "Can I get a refund for a Saver fare?", a: "Saver fares are non-refundable but you may receive a travel credit for the fare value minus a service fee, valid for 12 months." },
    { q: "How do I add special meal or seat requests?", a: "Open My trips → select booking → Add-ons. Meal preferences can be set up to 24 hours before departure." },
    { q: "What documents do I need for international travel?", a: "A passport valid for at least 6 months, any required visas, and vaccination proof for select destinations." },
  ];
  const popular: Array<[string, string, string]> = [
    ["How do I change my flight date online?", "Booking", "change-flight-date"],
    ["What happens if my flight is delayed 3+ hours?", "Disruption", "flight-delayed-3-hours"],
    ["How much does excess baggage cost?", "Baggage", "excess-baggage-cost"],
    ["How long do refunds take to process?", "Refunds", "refund-processing-time"],
    ["How do I request wheelchair assistance?", "Assistance", "wheelchair-assistance"],
    ["How do I redeem miles for a free flight?", "Miles", "redeem-miles"],
  ];
  const contacts: Array<{ i: string; t: string; s: string; badge?: string; to: string }> = [
    { i: "💬", t: "Live chat", s: "Avg wait 2 min", badge: "Online", to: "help/chat" },
    { i: "📞", t: "Request a call back", s: "Within 10 minutes", to: "help/call" },
    { i: "🟢", t: "WhatsApp", s: "+91 98765 00000", to: "help/whatsapp" },
    { i: "✉", t: "Email us", s: "Reply within 24 hours", to: "help/email" },
  ];

  const allArticles = Object.entries(ARTICLE_INDEX).map(([slug, a]) => ({ slug, q: a.body[0]?.slice(0, 90) ?? slug, tag: a.topic }));
  const q = query.trim().toLowerCase();
  const searchMatches = q
    ? [
        ...popular.filter(([qq, , slug]) => qq.toLowerCase().includes(q) || slug.includes(q)).map(([qq, tag, slug]) => ({ slug, q: qq, tag })),
        ...allArticles.filter((a) => a.slug.includes(q) || a.q.toLowerCase().includes(q)),
      ].filter((v, i, arr) => arr.findIndex((x) => x.slug === v.slug) === i).slice(0, 8)
    : [];
  const runHelpSearch = () => {
    if (!q) { toast.info("Type a keyword to search"); return; }
    if (searchMatches[0]) navigate({ to: "/app/$", params: { _splat: `help/article/${searchMatches[0].slug}` } });
    else toast.error(`No articles found for "${query}"`);
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="rounded-3xl bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-800 p-8 text-white shadow-lg md:p-12">
        <h1 className="text-center font-display text-3xl font-semibold md:text-4xl">How can we help you today?</h1>
        <div className="mx-auto mt-6 flex max-w-2xl overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
          <div className="grid place-items-center px-4 text-white/70">🔍</div>
          <input placeholder="Search for help, e.g. 'change my flight'"
            value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") runHelpSearch(); }}
            className="flex-1 bg-transparent px-2 py-4 text-sm text-white placeholder-white/60 outline-none" />
          <button data-quiet onClick={runHelpSearch} className="bg-white px-6 py-4 text-sm font-semibold text-sky-700 hover:bg-white/90">Search</button>
        </div>
        {q && (
          <div className="mx-auto mt-3 max-w-2xl rounded-xl bg-white/10 p-2 ring-1 ring-white/20">
            {searchMatches.length === 0 ? (
              <div className="px-3 py-2 text-sm text-white/80">No results for "{query}"</div>
            ) : (
              <ul className="divide-y divide-white/10">
                {searchMatches.map((m) => (
                  <li key={m.slug}>
                    <Link to="/app/$" params={{ _splat: `help/article/${m.slug}` }} data-quiet className="flex items-center justify-between px-3 py-2 text-sm text-white hover:bg-white/10">
                      <span className="truncate">{m.q}</span>
                      <span className="ml-2 shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wider">{m.tag}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">Browse by topic</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {topics.map((t) => (
            <Link key={t.t} to="/app/$" params={{ _splat: `help/topic/${t.slug}` }} data-quiet className="group rounded-2xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md">
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${toneMap[t.tone]}`}>{t.i}</div>
              <div className="mt-3 font-semibold">{t.t}</div>
              <div className="text-xs text-foreground/60">{t.n} articles</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h2 className="mb-3 font-display text-lg font-semibold">Popular articles</h2>
          <div className="space-y-2">
            {popular.map(([q, tag, slug]) => (
              <Link key={slug} to="/app/$" params={{ _splat: `help/article/${slug}` }} data-quiet className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left hover:border-foreground/20">
                <span className="flex items-center gap-3 text-sm"><span className="text-foreground/40">📄</span>{q}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground/70">{tag}</span>
              </Link>
            ))}
          </div>
        </div>


        <div className="space-y-4">
          <div>
            <h2 className="mb-3 font-display text-lg font-semibold">Contact us</h2>
            <div className="space-y-2">
              {contacts.map((c) => (
                <Link key={c.t} to="/app/$" params={{ _splat: c.to }} data-quiet className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left hover:border-foreground/20">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-accent/15 text-accent">{c.i}</div>
                    <div><div className="text-sm font-semibold">{c.t}</div><div className="text-xs text-foreground/60">{c.s}</div></div>
                  </div>
                  {c.badge && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-500">{c.badge}</span>}
                </Link>
              ))}
            </div>
          </div>


          <div>
            <h2 className="mb-3 font-display text-lg font-semibold">Your open tickets</h2>
            <div className="space-y-2">
              {[
                { id: "#SW-88213", t: "Refund request · SW411", s: "In progress", tone: "amber" },
                { id: "#SW-87450", t: "Baggage delay claim", s: "Resolved", tone: "emerald" },
              ].map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                  <div><div className="font-mono text-sm font-semibold">{t.id}</div><div className="text-xs text-foreground/60">{t.t}</div></div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${t.tone === "emerald" ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"}`}>{t.s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">Frequently asked questions</h2>
        <div className="space-y-2">
          {faqs.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={f.q} className="rounded-xl border border-border bg-card">
                <button data-quiet onClick={() => setOpenFaq(open ? null : i)} className="flex w-full items-center justify-between px-4 py-3 text-left">
                  <span className="text-sm font-medium">{f.q}</span>
                  <span className={`text-foreground/60 transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
                </button>
                {open && <div className="border-t border-border px-4 py-3 text-sm text-foreground/70">{f.a}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// Login — matches ref image 1
// ===================================================================
export function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-border bg-card shadow-xl md:grid-cols-2">
        {/* Left promo */}
        <div className="relative overflow-hidden bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-700 p-8 text-white md:p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />

          <div className="relative flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 backdrop-blur-sm">✈</div>
            <span className="font-display text-xl font-semibold">SkyWay</span>
          </div>

          <h2 className="relative mt-16 font-display text-3xl font-semibold leading-tight md:text-[2rem]">
            Manage bookings, check in, and track flights in one place
          </h2>

          <ul className="relative mt-8 space-y-4 text-sm">
            {[
              ["🎫", "Access all your bookings and boarding passes instantly"],
              ["🔔", "Get real-time alerts on gate changes and delays"],
              ["★", "Earn and redeem SkyWay miles on every trip"],
            ].map(([i, t]) => (
              <li key={t} className="flex items-start gap-3">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/15">{i}</div>
                <span className="text-white/95">{t}</span>
              </li>
            ))}
          </ul>

          <div className="relative mt-10 grid grid-cols-3 gap-4 border-t border-white/20 pt-6">
            {[["40M+", "Travellers"], ["98%", "On-time rate"], ["120+", "Destinations"]].map(([n, l]) => (
              <div key={l}><div className="font-display text-2xl font-bold">{n}</div><div className="text-xs text-white/70">{l}</div></div>
            ))}
          </div>

          <div className="relative mt-10 border-t border-white/20 pt-4 text-xs text-white/70">
            Trusted by over 40 million travellers · IATA accredited
          </div>
        </div>

        {/* Right form */}
        <div className="p-8 md:p-10">
          <div className="flex items-center justify-end text-xs text-foreground/60">🌐 EN · INR</div>

          <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {[["signin", "Sign in"], ["signup", "Create account"]].map(([k, l]) => (
              <button key={k} data-quiet onClick={() => setMode(k as typeof mode)}
                className={`rounded-md py-2 text-sm font-medium transition-all ${mode === k ? "bg-card text-accent shadow-sm" : "text-foreground/60"}`}>
                {l}
              </button>
            ))}
          </div>

          <div className="mt-8">
            <h1 className="font-display text-2xl font-semibold">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
            <p className="mt-1 text-sm text-foreground/60">{mode === "signin" ? "Sign in to manage your trips and profile" : "Join in 30 seconds — earn miles from your first flight"}</p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={(e) => {
            e.preventDefault();
            toast.success(mode === "signin" ? "Signed in as Aarav Rao" : "Account created — welcome to SkyWay");
            navigate({ to: "/app" });
          }}>
            {mode === "signup" && (
              <div>
                <label className="text-sm font-medium">Full name</label>
                <input placeholder="Aarav Rao" className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent" />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Email address</label>
              <input placeholder="name@example.com" className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <div className="mt-1.5 flex overflow-hidden rounded-lg border border-border bg-background focus-within:border-accent">
                <input type={showPw ? "text" : "password"} placeholder="Enter your password" className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none" />
                <button type="button" data-quiet onClick={() => setShowPw(!showPw)} className="px-3 text-foreground/50 hover:text-foreground">{showPw ? "🙈" : "👁"}</button>
              </div>
            </div>

            {mode === "signin" && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-foreground/70 cursor-pointer"><input type="checkbox" className="rounded" /> Remember me</label>
                <button
                  type="button"
                  onClick={() => toast.info("Password reset instructions sent to your email.")}
                  className="font-medium text-accent hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" data-quiet className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95">
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>

            {mode === "signin" && (
              <button
                type="button"
                onClick={() => toast.info("OTP verification code sent to +91 98765 43210")}
                className="w-full text-center text-sm font-medium text-accent hover:underline"
              >
                Sign in with OTP instead
              </button>
            )}

            <div className="flex items-center gap-3 text-xs text-foreground/50">
              <div className="h-px flex-1 bg-border" />or continue with<div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  toast.success("Signed in with Google account");
                  navigate({ to: "/app" });
                }}
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                <span className="font-bold text-red-500">G</span> Google
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.success("Signed in with Apple ID");
                  navigate({ to: "/app" });
                }}
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                <span></span> Apple
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-foreground/60">
            By continuing you agree to SkyWay's <a className="text-accent hover:underline">Terms</a> and <a className="text-accent hover:underline">Privacy Policy</a>
          </div>
          <div className="mt-2 text-center text-xs text-foreground/50">🔒 Secured with 256-bit encryption</div>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// Help — topic list, article detail, contact channels
// ===================================================================

const HELP_TOPICS: Record<string, { title: string; icon: string; tone: string; articles: Array<{ slug: string; q: string; excerpt: string }> }> = {
  "booking-payments": {
    title: "Booking & payments", icon: "🎫", tone: "bg-sky-500/15 text-sky-500",
    articles: [
      { slug: "change-flight-date", q: "How do I change my flight date online?", excerpt: "Manage from My trips → Change dates. Fare difference and change fee apply." },
      { slug: "payment-methods", q: "What payment methods are accepted?", excerpt: "Cards, UPI, netbanking, wallets, and SkyMiles redemption." },
      { slug: "failed-payment", q: "My payment failed but money was deducted", excerpt: "Refunds auto-initiate within 24 hours if the booking didn't confirm." },
      { slug: "book-for-someone", q: "Can I book a ticket for someone else?", excerpt: "Yes — enter the traveller's name; the payer doesn't need to fly." },
    ],
  },
  "check-in-boarding": {
    title: "Check-in & boarding", icon: "✓", tone: "bg-emerald-500/15 text-emerald-500",
    articles: [
      { slug: "web-checkin", q: "When does web check-in open?", excerpt: "48 hours before departure and closes 60 min before for domestic flights." },
      { slug: "boarding-pass", q: "How do I get my boarding pass?", excerpt: "Complete web check-in and download the PDF or add to your wallet." },
      { slug: "gate-close", q: "When does the boarding gate close?", excerpt: "Gates close 20 minutes before departure — arrive early." },
    ],
  },
  "baggage": {
    title: "Baggage", icon: "🧳", tone: "bg-amber-500/15 text-amber-500",
    articles: [
      { slug: "excess-baggage-cost", q: "How much does excess baggage cost?", excerpt: "₹600/kg on domestic and $30/kg on international, cheaper when pre-booked." },
      { slug: "cabin-allowance", q: "Cabin baggage allowance", excerpt: "7 kg + one personal item, max dimensions 55×35×25 cm." },
      { slug: "damaged-bag", q: "My bag was damaged during transit", excerpt: "Report at the baggage desk within 7 days with your tag and photos." },
    ],
  },
  "delays-cancellations": {
    title: "Delays & cancellations", icon: "⚠", tone: "bg-rose-500/15 text-rose-500",
    articles: [
      { slug: "flight-delayed-3-hours", q: "What happens if my flight is delayed 3+ hours?", excerpt: "You're eligible for rebooking, meal vouchers, and refund per DGCA rules." },
      { slug: "flight-cancelled", q: "My flight was cancelled by SkyWay", excerpt: "Choose free rebooking, full refund, or travel credit — all fee-waived." },
      { slug: "missed-connection", q: "I missed my connecting flight", excerpt: "If both segments were on one PNR, we rebook you on the next available flight." },
    ],
  },
  "refunds": {
    title: "Refunds & cancellations", icon: "💳", tone: "bg-indigo-500/15 text-indigo-500",
    articles: [
      { slug: "refund-processing-time", q: "How long do refunds take to process?", excerpt: "7 business days to your card, 5 days to UPI/wallet after approval." },
      { slug: "cancel-online", q: "How do I cancel a booking online?", excerpt: "My trips → Cancel booking. Cancellation fee depends on fare class." },
      { slug: "no-show", q: "I missed my flight — can I get a refund?", excerpt: "Taxes are refundable; base fare is forfeited on no-show." },
    ],
  },
  "miles-loyalty": {
    title: "Miles & loyalty", icon: "★", tone: "bg-amber-500/15 text-amber-500",
    articles: [
      { slug: "redeem-miles", q: "How do I redeem miles for a free flight?", excerpt: "Search normally and toggle 'Pay with miles' — Saver awards from 8,000 miles." },
      { slug: "tier-benefits", q: "SkyMiles tier benefits", excerpt: "Silver, Gold, and Platinum unlock lounges, priority boarding, and bonus miles." },
      { slug: "expiry", q: "Do my miles expire?", excerpt: "Miles never expire as long as you have activity every 24 months." },
    ],
  },
  "special-assistance": {
    title: "Special assistance", icon: "♿", tone: "bg-sky-500/15 text-sky-500",
    articles: [
      { slug: "wheelchair-assistance", q: "How do I request wheelchair assistance?", excerpt: "Add during booking or via My trips → Add-ons at least 48 hours before departure." },
      { slug: "unaccompanied-minor", q: "Unaccompanied minor service", excerpt: "Available for kids 5–12 on domestic flights for ₹1,500 per segment." },
    ],
  },
  "account-security": {
    title: "Account & security", icon: "🔒", tone: "bg-emerald-500/15 text-emerald-500",
    articles: [
      { slug: "reset-password", q: "How do I reset my password?", excerpt: "Go to Sign in → Forgot password and check your email for the link." },
      { slug: "two-factor", q: "Enable two-factor authentication", excerpt: "Profile → Security → 2FA. We support authenticator apps and SMS." },
    ],
  },
};

const ARTICLE_INDEX: Record<string, { topic: string; body: string[] }> = {
  "change-flight-date": { topic: "booking-payments", body: [
    "You can change your flight date online up to 2 hours before departure.",
    "Go to My trips, select your booking, and tap 'Change flight'. Pick a new date, review the fare difference and change fee, then pay to confirm.",
    "Flex and Business fares waive the change fee. Saver fares incur ₹2,500 per passenger plus fare difference.",
  ]},
  "flight-delayed-3-hours": { topic: "delays-cancellations", body: [
    "If your flight is delayed 3 hours or more, you're entitled to a full refund, free rebooking on the next available flight, or a meal voucher.",
    "SkyWay proactively pushes options to your app under Disruption support — accept your preferred option in a tap.",
    "For delays over 6 hours between 8pm–3am, hotel accommodation is included at no cost.",
  ]},
  "excess-baggage-cost": { topic: "baggage", body: [
    "Excess baggage pricing depends on your route and fare.",
    "Domestic (India): ₹600 per kg at the airport, ₹450 per kg pre-booked online (up to 24 hrs before departure).",
    "International short-haul: US$25/kg pre-booked, US$40/kg at airport. Long-haul: US$30/kg pre-booked.",
    "Add extra baggage under My trips → Add-ons for the best rate.",
  ]},
  "refund-processing-time": { topic: "refunds", body: [
    "Refund timelines depend on your original payment method.",
    "Credit/debit cards: 5–7 business days after approval. UPI, wallets, and netbanking: 3–5 business days.",
    "For SkyMiles or travel credit refunds, miles or credits are re-issued instantly.",
    "You'll receive an email and app notification the moment we initiate the refund.",
  ]},
  "wheelchair-assistance": { topic: "special-assistance", body: [
    "Wheelchair assistance is free of charge and can be requested during booking or via My trips.",
    "For best service, request at least 48 hours before departure. On-demand assistance is available at the airport but subject to availability.",
    "Three service levels: WCHR (up steps unaided), WCHS (unable to climb steps), and WCHC (immobile).",
  ]},
  "redeem-miles": { topic: "miles-loyalty", body: [
    "Search flights as usual and toggle 'Pay with miles' at the top of results.",
    "Saver awards start at 8,000 miles one-way for domestic economy. Flex awards give more availability at a higher mileage cost.",
    "You can combine miles + cash if you don't have enough miles for a full ticket.",
  ]},
};

// Fill remaining articles with a generic body so any slug works.
for (const [topicSlug, topic] of Object.entries(HELP_TOPICS)) {
  for (const a of topic.articles) {
    if (!ARTICLE_INDEX[a.slug]) {
      ARTICLE_INDEX[a.slug] = { topic: topicSlug, body: [a.excerpt, "Contact our support team via chat, WhatsApp, or a call back if you need more help with this."] };
    }
  }
}

function BackToHelp() {
  return (
    <Link to="/app/$" params={{ _splat: "help" }} data-quiet className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground">
      ← Back to Help
    </Link>
  );
}

export function HelpTopicPage({ slug }: { slug: string }) {
  const topic = HELP_TOPICS[slug];
  if (!topic) {
    return (
      <div className="space-y-4 p-6 md:p-8">
        <BackToHelp />
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="font-display text-xl font-semibold">Topic not found</div>
          <div className="mt-1 text-sm text-foreground/60">We couldn't find articles for "{slug}".</div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-5 p-6 md:p-8">
      <BackToHelp />
      <div className="flex items-center gap-3">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl text-lg ${topic.tone}`}>{topic.icon}</div>
        <div>
          <h1 className="font-display text-2xl font-semibold">{topic.title}</h1>
          <div className="text-sm text-foreground/60">{topic.articles.length} articles</div>
        </div>
      </div>
      <div className="space-y-2">
        {topic.articles.map((a) => (
          <Link key={a.slug} to="/app/$" params={{ _splat: `help/article/${a.slug}` }} data-quiet className="block rounded-xl border border-border bg-card px-4 py-4 hover:border-foreground/20">
            <div className="text-sm font-semibold">{a.q}</div>
            <div className="mt-1 text-xs text-foreground/60">{a.excerpt}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function HelpArticlePage({ slug }: { slug: string }) {
  const article = ARTICLE_INDEX[slug];
  const topicSlug = article?.topic;
  const topic = topicSlug ? HELP_TOPICS[topicSlug] : null;
  const meta = topic?.articles.find((x) => x.slug === slug);
  if (!article || !meta || !topic) {
    return (
      <div className="space-y-4 p-6 md:p-8">
        <BackToHelp />
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="font-display text-xl font-semibold">Article not found</div>
        </div>
      </div>
    );
  }
  const related = topic.articles.filter((x) => x.slug !== slug).slice(0, 3);
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <BackToHelp />
      <div className="text-xs text-foreground/60">
        <Link to="/app/$" params={{ _splat: `help/topic/${topicSlug}` }} data-quiet className="hover:text-foreground">{topic.title}</Link>
        <span className="mx-2">›</span>
        <span>Article</span>
      </div>
      <h1 className="font-display text-3xl font-semibold">{meta.q}</h1>
      <div className="flex items-center gap-3 text-xs text-foreground/60">
        <span>Updated Jun 12, 2026</span><span>·</span><span>3 min read</span>
      </div>
      <article className="space-y-4 text-[15px] leading-relaxed text-foreground/85">
        {article.body.map((p, i) => (<p key={i}>{p}</p>))}
      </article>
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="text-sm">Was this article helpful?</div>
        <button
          type="button"
          onClick={() => toast.success("Thanks for your feedback! Glad this article helped.")}
          className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted transition-colors"
        >
          👍 Yes
        </button>
        <button
          type="button"
          onClick={() => toast.info("Thanks for your feedback — our team will update this article.")}
          className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted transition-colors"
        >
          👎 No
        </button>
      </div>
      {related.length > 0 && (
        <div>
          <h2 className="mb-2 font-display text-lg font-semibold">Related articles</h2>
          <div className="space-y-2">
            {related.map((r) => (
              <Link key={r.slug} to="/app/$" params={{ _splat: `help/article/${r.slug}` }} data-quiet className="block rounded-xl border border-border bg-card px-4 py-3 text-sm hover:border-foreground/20">
                {r.q}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function nowHHMM() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function botReply(userText: string): string {
  const t = userText.toLowerCase();
  if (/(hi|hello|hey|namaste)\b/.test(t)) return "Hi there! Are you asking about a booking, a flight status, refunds, baggage, or something else?";
  if (/(refund|money back|reimburse)/.test(t)) return "For refunds, please share your PNR. Card refunds land in 5–7 business days; UPI/wallet in 3–5 days after approval.";
  if (/(cancel|cancelled|cancellation)/.test(t)) return "You can cancel from My trips → Cancel booking. Cancellation fees depend on your fare — Saver ₹3,000, Flex ₹1,500, Business free.";
  if (/(delay|delayed|late)/.test(t)) return "Sorry about the delay. If it's 3+ hrs you're entitled to rebooking, meal voucher, or full refund. Would you like me to rebook you on the next flight?";
  if (/(baggage|luggage|bag)/.test(t)) return "Cabin allowance is 7 kg (55×35×25 cm). Check-in bag depends on your fare. Excess is ₹450/kg pre-booked online.";
  if (/(seat|window|aisle)/.test(t)) return "You can pick or change seats from My trips → Add-ons → Choose seat. Free for Flex/Business; ₹200–₹800 for Saver.";
  if (/(meal|food|veg|vegan|jain)/.test(t)) return "Special meals (AVML/VGML/JNML/HNML) can be requested up to 24 hrs before departure via My trips → Add-ons.";
  if (/(check[- ]?in|boarding pass)/.test(t)) return "Web check-in opens 48 hrs before departure and closes 60 min before. Open the Check-in tab in the app to get your boarding pass.";
  if (/(pnr|booking id|reference)/.test(t)) return "Please share your 6-character PNR (e.g. SW8F2K) and I'll pull up your booking.";
  if (/(sw[- ]?\d{2,4}|flight status|status)/.test(t)) {
    const m = userText.match(/sw[- ]?(\d{2,4})/i);
    const num = m ? `SW${m[1]}` : "your flight";
    return `${num} is currently on time. Departure gate assignments open 90 min before boarding.`;
  }
  if (/(miles|reward|loyalty|gold|platinum)/.test(t)) return "You currently have 42,580 miles (Gold tier). You can redeem from the Miles & loyalty page.";
  if (/(wheelchair|assistance|special)/.test(t)) return "I can add wheelchair or special assistance to your booking. Which PNR should I attach it to?";
  if (/(human|agent|person|representative)/.test(t)) return "Connecting you to a human agent — average wait is 2 minutes. In the meantime, you can also request a call back from the Help page.";
  if (/(thank|thanks|ty)/.test(t)) return "You're welcome! Safe travels ✈️. Anything else I can help with?";
  if (/(bye|goodbye|see ya)/.test(t)) return "Take care! You can reopen this chat from Help anytime.";
  return "Got it. Could you share a bit more detail (PNR, flight number, or which trip this is about) so I can help precisely?";
}

const QUICK_REPLIES = [
  "Check flight status",
  "Cancel my booking",
  "Change my seat",
  "Refund status",
  "Talk to a human",
];

export function HelpChatPage() {
  const [messages, setMessages] = useState<Array<{ from: "you" | "agent"; text: string; time: string }>>([
    { from: "agent", text: "Hi, I'm Riya from SkyWay support 👋 How can I help you today? You can ask about bookings, refunds, delays, baggage, seats, meals, and more.", time: nowHHMM() },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const push = (text: string) => {
    const time = nowHHMM();
    setMessages((m) => [...m, { from: "you", text, time }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { from: "agent", text: botReply(text), time: nowHHMM() }]);
      setTyping(false);
    }, 700 + Math.min(text.length * 15, 900));
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    push(text);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col p-4 md:p-6">
      <BackToHelp />
      <div className="mt-3 flex items-center gap-3 rounded-t-2xl border border-b-0 border-border bg-card px-4 py-3">
        <div className="relative grid h-10 w-10 place-items-center rounded-full bg-accent/15 text-accent">👩‍💼<span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card"/></div>
        <div className="flex-1"><div className="text-sm font-semibold">Riya · SkyWay support</div><div className="text-xs text-emerald-500">{typing ? "typing…" : "Online · avg reply 30s"}</div></div>
        <button data-quiet data-toast="Chat transcript cleared" onClick={() => setMessages([{ from: "agent", text: "Chat cleared. How can I help you?", time: nowHHMM() }])} className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted">Clear</button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto border border-border bg-muted/30 p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === "you" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.from === "you" ? "bg-accent text-white" : "bg-card border border-border"}`}>
              <div>{m.text}</div>
              <div className={`mt-0.5 text-[10px] ${m.from === "you" ? "text-white/70" : "text-foreground/50"}`}>{m.time}</div>
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-border bg-card px-3 py-2 text-sm">
              <span className="inline-flex gap-1"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40" style={{ animationDelay: "120ms" }} /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40" style={{ animationDelay: "240ms" }} /></span>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-1.5 overflow-x-auto border-x border-border bg-card/60 px-2 py-2">
        {QUICK_REPLIES.map((q) => (
          <button key={q} data-quiet onClick={() => push(q)} className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-foreground/75 hover:border-accent hover:text-accent">{q}</button>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-b-2xl border border-t-0 border-border bg-card p-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder="Type a message…" className="flex-1 bg-transparent px-2 py-2 text-sm outline-none" />
        <button data-quiet onClick={send} className="rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90">Send</button>
      </div>
    </div>
  );
}


export function HelpCallPage() {
  const [phone, setPhone] = useState("+91 98765 43210");
  const [reason, setReason] = useState("Flight change / cancellation");
  const [slot, setSlot] = useState("Now (within 10 min)");
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6 md:p-8">
      <BackToHelp />
      <h1 className="font-display text-2xl font-semibold">Request a call back</h1>
      {submitted ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-sm">
          <div className="font-semibold text-emerald-500">Call back scheduled</div>
          <div className="mt-1 text-foreground/75">We'll call you on <b>{phone}</b> {slot.toLowerCase()}. Reference #SW-CB-{Math.floor(Math.random()*90000+10000)}.</div>
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <label className="text-xs font-semibold text-foreground/60">Phone number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground/60">Reason for call</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent">
              <option>Flight change / cancellation</option>
              <option>Baggage issue</option>
              <option>Refund status</option>
              <option>Special assistance</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground/60">Preferred time</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {["Now (within 10 min)", "In 1 hour", "Later today", "Tomorrow morning"].map((s) => (
                <button key={s} data-quiet onClick={() => setSlot(s)} className={`rounded-lg border px-3 py-2 text-xs ${slot === s ? "border-accent bg-accent/10 text-accent" : "border-border hover:border-foreground/30"}`}>{s}</button>
              ))}
            </div>
          </div>
          <button onClick={() => setSubmitted(true)} data-toast="Call back scheduled" data-toast-kind="success" className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white hover:opacity-90">Request call back</button>
        </div>
      )}
    </div>
  );
}

export function HelpWhatsAppPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6 md:p-8">
      <BackToHelp />
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-3xl">🟢</div>
        <h1 className="mt-3 font-display text-2xl font-semibold">Chat on WhatsApp</h1>
        <div className="mt-1 text-sm text-foreground/60">We're online 24/7 · avg reply 45 seconds</div>
        <div className="mt-4 rounded-xl bg-muted p-3 font-mono text-sm">+91 98765 00000</div>
        <a href="https://wa.me/919876500000?text=Hi%20SkyWay%20support" target="_blank" rel="noreferrer" data-quiet className="mt-4 inline-block rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:opacity-90">Open in WhatsApp</a>
      </div>
    </div>
  );
}

export function HelpEmailPage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6 md:p-8">
      <BackToHelp />
      <h1 className="font-display text-2xl font-semibold">Email us</h1>
      <div className="text-sm text-foreground/60">Reply within 24 hours to <span className="font-medium text-foreground">support@skyway.example</span></div>
      {sent ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-sm">
          <div className="font-semibold text-emerald-500">Message sent</div>
          <div className="mt-1 text-foreground/75">Ticket #SW-{Math.floor(Math.random()*90000+10000)} created. Check your inbox for updates.</div>
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <label className="text-xs font-semibold text-foreground/60">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground/60">Message</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={7} placeholder="Describe your issue, include your PNR if relevant." className="mt-1 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent" />
          </div>
          <button onClick={() => setSent(true)} data-toast="Email sent" data-toast-kind="success" disabled={!subject || !body} className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40">Send email</button>
        </div>
      )}
    </div>
  );
}


export function TerminalMapPage({ airport, gate, pnr }: { airport?: string; gate?: string; pnr?: string }) {
  const page = findPage("/terminal-map") || {
    id: "terminal-map",
    name: "Interactive Terminal Map",
    path: "/terminal-map",
    blurb: "D3.js indoor terminal map with live gate wayfinding, security wait-times & amenities",
    services: ["flight", "passenger", "ancillary"] as ServiceKey[],
  };

  return (
    <div>
      <PageHeader
        title="Interactive Terminal Map & Wayfinding"
        blurb={page.blurb}
        services={page.services}
        crumbs={["Airport Guide", airport?.toUpperCase() || "DEL T3", "Terminal Map"]}
      />
      <div className="p-6 md:p-8">
        <TerminalGuideView initialAirportCode={airport || "DEL"} initialGate={gate} initialPnr={pnr} />
      </div>
    </div>
  );
}

// ===================================================================
// Splat resolver
// ===================================================================

export function resolvePage(splat: string) {
  const parts = splat.split("/").filter(Boolean);
  const [a, b, c] = parts;

  if (parts.length === 0) return <HomePage />;
  if (a === "search") return <SearchResultsPage routeKey={b} />;
  if (a === "flights" && b) return <FlightDetailPage id={b} />;
  if (a === "booking" && b === "seats") return <SeatMapPage />;
  if (a === "booking" && b === "passengers") return <PassengersPage />;
  if (a === "booking" && b === "extras") return <ExtrasPage />;
  if (a === "booking" && b === "payment") return <PaymentPage />;
  if (a === "booking" && b === "confirm") return <ConfirmPage />;
  if (a === "my-trips" && !b) return <MyTripsPage />;
  if (a === "my-trips" && b) return <TripDetailPage pnr={b} />;
  if (a === "check-in" && b && c === "boarding-pass") return <BoardingPassPage pnr={b} />;
  if (a === "check-in" && b && c === "seats") return <SeatMapPage pnr={b} returnTo={`check-in/${b}/boarding-pass`} />;
  if (a === "check-in" && b) return <CheckInPage pnr={b} />;
  if (a === "loyalty") return <LoyaltyPage />;
  if (a === "wallet") return <WalletPage />;
  if (a === "analytics") return <TravelAnalyticsPage />;
  if (a === "assistant") return <AssistantPage />;
  if (a === "profile") return <ProfilePage />;
  if (a === "notifications") return <NotificationsPage />;
  if (a === "terminal-map" || a === "airport-map" || a === "terminal" || a === "map") return <TerminalMapPage airport={b} gate={c} />;
  if (a === "help" && b === "topic" && c) return <HelpTopicPage slug={c} />;
  if (a === "help" && b === "article" && c) return <HelpArticlePage slug={c} />;
  if (a === "help" && b === "chat") return <HelpChatPage />;
  if (a === "help" && b === "call") return <HelpCallPage />;
  if (a === "help" && b === "whatsapp") return <HelpWhatsAppPage />;
  if (a === "help" && b === "email") return <HelpEmailPage />;
  if (a === "help") return <HelpPage />;
  if (a === "disruption" && b === "rebook") return <DisruptionRebookPage />;
  if (a === "disruption" && b === "browse") return <DisruptionBrowsePage />;
  if (a === "disruption" && b === "refund") return <DisruptionRefundPage />;
  if (a === "disruption") return <DisruptionPage pnr={b ?? "SW8F2K"} />;
  if (a === "flight-status" && b) return <FlightStatusPage id={b} />;
  if ((a === "baggage" || a === "baggage-tracker" || a === "track-baggage") && b) return <BaggageTrackerPage pnr={b} lastName={c} />;
  if (a === "baggage" || a === "baggage-tracker" || a === "track-baggage") return <BaggageTrackerPage />;
  if (a === "dashboard" || a === "user-dashboard" || a === "account") return <UserDashboardPage />;
  if (a === "login" || a === "register") return <LoginPage />;

  return (
    <div className="p-12 text-center text-foreground/55">
      <div className="font-display text-2xl">Page not found</div>
      <div className="mt-2 text-sm">No passenger page matches /{splat}</div>
    </div>
  );
}

// ===================================================================
// Wallet & payment history
// ===================================================================
export function WalletPage() {
  const page = findPage("/wallet")!;
  const [tab, setTab] = useState<"Transactions" | "Refunds" | "Vouchers" | "Methods">("Transactions");
  const stats = [
    { v: "₹1,24,850", l: "Spent · 12 mo" },
    { v: "₹8,240", l: "Refunds pending" },
    { v: "3", l: "Active vouchers" },
    { v: "₹2,500", l: "Travel credit" },
  ];
  const tx = [
    { d: "12 Jun 2026", ref: "SW9M2P", desc: "Booking · BOM → DXB · SW-811", meth: "Visa ···· 4291", amt: "−₹13,489", state: "Completed", tone: "emerald" as const },
    { d: "02 Jun 2026", ref: "SW-501", desc: "Seat upgrade · row 4A", meth: "Miles + Visa", amt: "−₹1,200", state: "Completed", tone: "emerald" as const },
    { d: "28 May 2026", ref: "SW7L3A", desc: "Extra baggage · 10 kg", meth: "UPI · gpay", amt: "−₹1,900", state: "Completed", tone: "emerald" as const },
    { d: "20 May 2026", ref: "SW6P1F", desc: "Booking · DEL → LHR · SW-502", meth: "Amex ···· 1102", amt: "−₹58,320", state: "Completed", tone: "emerald" as const },
    { d: "18 May 2026", ref: "SW5K8N", desc: "Cancellation · SW-330 refund", meth: "Original card", amt: "+₹6,240", state: "Pending", tone: "amber" as const },
    { d: "02 May 2026", ref: "VCHR-2026", desc: "Weather voucher issued", meth: "Travel credit", amt: "+₹2,500", state: "Credited", tone: "sky" as const },
  ];
  const refunds = [
    { d: "18 May 2026", ref: "SW5K8N", desc: "Cancelled — schedule change SW-330", amt: "₹6,240", eta: "3–5 business days", state: "Pending", tone: "amber" as const },
    { d: "12 Apr 2026", ref: "SW3H9C", desc: "Fare difference · downgrade", amt: "₹2,050", eta: "Refunded to Visa 4291", state: "Completed", tone: "emerald" as const },
    { d: "01 Mar 2026", ref: "SW1A2B", desc: "Baggage overcharge dispute", amt: "₹800", eta: "Resolved · goodwill voucher", state: "Resolved", tone: "sky" as const },
  ];
  const vouchers = [
    { code: "SKYWEATHER2500", label: "Weather disruption credit", amt: "₹2,500", exp: "Expires 31 Dec 2026", note: "Any SkyWay booking · non-transferable" },
    { code: "GOLDBIRTHDAY", label: "Gold birthday gift", amt: "5,000 miles", exp: "Expires 15 Aug 2026", note: "Auto-applied at checkout" },
    { code: "MONSOON30", label: "Monsoon fare discount", amt: "30% off (max ₹4,000)", exp: "Ends 20 Jun 2026", note: "Applies to selected international routes" },
  ];
  const methods = [
    { brand: "Visa", last: "4291", holder: "Arjun Reddy", exp: "08/28", primary: true },
    { brand: "Amex", last: "1102", holder: "Arjun Reddy", exp: "11/27" },
    { brand: "UPI", last: "arjun@okhdfc", holder: "Google Pay", exp: "—" },
  ];
  const chip = (tone: "emerald" | "amber" | "sky") => ({
    emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    amber: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
    sky: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  }[tone]);

  return (
    <div>
      <PageHeader title="Wallet & payment history" blurb={page.blurb} crumbs={["Account", "Wallet"]} />
      <div className="space-y-6 p-6 md:p-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.l} className="p-4">
              <div className="font-display text-2xl font-semibold">{s.v}</div>
              <div className="mt-1 text-[11px] uppercase tracking-wider text-foreground/55">{s.l}</div>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {(["Transactions", "Refunds", "Vouchers", "Methods"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${tab === t ? "bg-accent text-white" : "border border-border text-foreground/70 hover:bg-muted"}`}>{t}</button>
          ))}
        </div>

        {tab === "Transactions" && (
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-[10px] uppercase tracking-wider text-foreground/60">
                <tr>{["Date", "Reference", "Description", "Method", "Amount", "Status"].map((h) => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tx.map((t) => (
                  <tr key={t.ref + t.d} className="hover:bg-muted/40">
                    <td className="px-4 py-3 text-foreground/70">{t.d}</td>
                    <td className="px-4 py-3 font-mono text-xs">{t.ref}</td>
                    <td className="px-4 py-3">{t.desc}</td>
                    <td className="px-4 py-3 text-foreground/70">{t.meth}</td>
                    <td className={`px-4 py-3 font-semibold ${t.amt.startsWith("+") ? "text-emerald-500" : "text-foreground"}`}>{t.amt}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${chip(t.tone)}`}>{t.state}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2 text-[11px] text-foreground/60">
              <span>Download consolidated statement for tax filing.</span>
              <button onClick={() => toast.success("Statement PDF sent to your email.")} className="rounded-md border border-border bg-background px-2.5 py-1 hover:bg-muted">Download statement</button>
            </div>
          </Card>
        )}

        {tab === "Refunds" && (
          <div className="grid gap-3 md:grid-cols-2">
            {refunds.map((r) => (
              <Card key={r.ref}>
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs text-foreground/60">{r.ref}</div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${chip(r.tone)}`}>{r.state}</span>
                </div>
                <div className="mt-2 font-display text-lg font-semibold">{r.desc}</div>
                <div className="mt-1 text-xs text-foreground/60">{r.d}</div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <Field label="Amount" value={r.amt} />
                  <Field label="ETA" value={r.eta} />
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => toast.success("Refund status refreshed.")} className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted">Refresh</button>
                  <button onClick={() => toast("Support ticket opened for this refund.")} className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted">Contact support</button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === "Vouchers" && (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {vouchers.map((v) => (
              <Card key={v.code} className="bg-gradient-to-br from-accent/10 via-card to-card">
                <div className="text-[10px] uppercase tracking-wider text-foreground/55">{v.label}</div>
                <div className="mt-2 font-display text-2xl font-bold text-accent">{v.amt}</div>
                <div className="mt-2 rounded-md border border-dashed border-accent/40 bg-background/60 px-3 py-1.5 font-mono text-xs">{v.code}</div>
                <div className="mt-3 text-xs text-foreground/60">{v.exp}</div>
                <div className="mt-1 text-[11px] text-foreground/55">{v.note}</div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => { navigator.clipboard?.writeText(v.code); toast.success("Voucher code copied."); }} className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-white hover:opacity-90">Copy code</button>
                  <button onClick={() => toast("Voucher will apply at checkout.")} className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted">Use now</button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === "Methods" && (
          <div className="grid gap-3 md:grid-cols-3">
            {methods.map((m) => (
              <Card key={m.brand + m.last}>
                <div className="flex items-center justify-between">
                  <div className="font-display text-lg font-semibold">{m.brand}</div>
                  {m.primary && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">Primary</span>}
                </div>
                <div className="mt-3 font-mono text-sm">···· {m.last}</div>
                <div className="mt-1 text-xs text-foreground/60">{m.holder} · exp {m.exp}</div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => toast.success(`${m.brand} set as primary.`)} className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted">Make primary</button>
                  <button onClick={() => toast(`${m.brand} ···· ${m.last} removed.`)} className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted">Remove</button>
                </div>
              </Card>
            ))}
            <Card className="flex items-center justify-center border-dashed">
              <button onClick={() => toast("Add-card modal placeholder")} className="text-sm font-medium text-accent">+ Add payment method</button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// ===================================================================
// Travel analytics
// ===================================================================
export function TravelAnalyticsPage() {
  const page = findPage("/analytics")!;
  const stats = [
    { v: "47", l: "Flights taken" },
    { v: "18", l: "Countries visited" },
    { v: "184,320 km", l: "Distance travelled" },
    { v: "22.4 t", l: "CO₂ footprint (est.)" },
  ];
  const byYear = [
    { y: "2022", flights: 6, km: 21_400 },
    { y: "2023", flights: 11, km: 42_800 },
    { y: "2024", flights: 14, km: 55_120 },
    { y: "2025", flights: 12, km: 48_600 },
    { y: "2026 YTD", flights: 4, km: 16_400 },
  ];
  const maxKm = Math.max(...byYear.map((y) => y.km));
  const topRoutes = [
    { r: "BLR → DEL", n: 12, km: "20,880" },
    { r: "BOM → DXB", n: 7, km: "13,930" },
    { r: "DEL → LHR", n: 5, km: "34,150" },
    { r: "BLR → SIN", n: 4, km: "13,880" },
    { r: "DEL → JFK", n: 3, km: "34,890" },
  ];
  const countries = ["🇮🇳 India","🇦🇪 UAE","🇸🇬 Singapore","🇬🇧 UK","🇺🇸 USA","🇫🇷 France","🇯🇵 Japan","🇹🇭 Thailand","🇩🇪 Germany","🇮🇹 Italy","🇳🇱 Netherlands","🇦🇺 Australia","🇭🇰 Hong Kong","🇰🇷 South Korea","🇹🇷 Turkey","🇪🇸 Spain","🇨🇭 Switzerland","🇱🇰 Sri Lanka"];
  const tierPct = 56.8;
  const co2 = { flights: 22.4, offset: 4.1, target: 15 };

  return (
    <div>
      <PageHeader title="Travel analytics" blurb={page.blurb} crumbs={["Account", "Analytics"]} />
      <div className="space-y-6 p-6 md:p-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.l} className="p-4">
              <div className="font-display text-2xl font-semibold">{s.v}</div>
              <div className="mt-1 text-[11px] uppercase tracking-wider text-foreground/55">{s.l}</div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Flights & distance by year</div>
              <div className="text-xs text-foreground/55">Miles flown normalised across years</div>
            </div>
            <div className="mt-4 space-y-3">
              {byYear.map((y) => (
                <div key={y.y}>
                  <div className="mb-1 flex justify-between text-xs text-foreground/65"><span className="font-medium text-foreground">{y.y}</span><span>{y.flights} flights · {y.km.toLocaleString()} km</span></div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-gradient-to-r from-accent to-amber-400" style={{ width: `${(y.km / maxKm) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="text-sm font-semibold">Loyalty progress</div>
            <div className="mt-4 text-[11px] uppercase tracking-wider text-foreground/55">Gold → Platinum</div>
            <div className="mt-2 flex items-end justify-between">
              <div className="font-display text-3xl font-bold text-accent">{tierPct}%</div>
              <div className="text-xs text-foreground/60">32,420 miles to go</div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-accent" style={{ width: `${tierPct}%` }} /></div>
            <div className="mt-4 space-y-2 text-xs text-foreground/70">
              <div className="flex justify-between"><span>Qualifying miles</span><span className="font-medium text-foreground">42,580 / 75,000</span></div>
              <div className="flex justify-between"><span>Qualifying segments</span><span className="font-medium text-foreground">18 / 30</span></div>
              <div className="flex justify-between"><span>Tier expires</span><span className="font-medium text-foreground">31 Mar 2027</span></div>
            </div>
          </Card>

          <Card>
            <div className="text-sm font-semibold">Top routes</div>
            <div className="mt-3 space-y-2 text-sm">
              {topRoutes.map((r) => (
                <div key={r.r} className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
                  <div className="font-mono text-xs font-semibold">{r.r}</div>
                  <div className="text-xs text-foreground/70">{r.n} trips · {r.km} km</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Carbon footprint</div>
              <button onClick={() => toast.success("Added 5.0 t CO₂ offset to your booking preferences.")} className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted">Offset more</button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-[10px] uppercase tracking-wider text-foreground/55">Emissions</div>
                <div className="mt-1 font-display text-xl font-semibold">{co2.flights} t</div>
              </div>
              <div className="rounded-lg border border-border bg-emerald-500/10 p-3">
                <div className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-300">Offset</div>
                <div className="mt-1 font-display text-xl font-semibold text-emerald-600 dark:text-emerald-300">{co2.offset} t</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-[10px] uppercase tracking-wider text-foreground/55">2026 target</div>
                <div className="mt-1 font-display text-xl font-semibold">{co2.target} t</div>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-foreground/55">Estimated using ICAO carbon methodology. Offset via SkyWay's certified reforestation and SAF programmes.</div>
          </Card>
        </div>

        <Card>
          <div className="text-sm font-semibold">Countries visited</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {countries.map((c) => (
              <span key={c} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs">{c}</span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ===================================================================
// AI travel assistant
// ===================================================================
type AsstMessage = { id: string; role: "user" | "assistant"; content: string };

export function AssistantPage() {
  const page = findPage("/assistant")!;
  const [messages, setMessages] = useState<AsstMessage[]>([
    { id: "seed", role: "assistant", content: "Hi Arjun — I'm your SkyWay travel assistant. I can find cheaper fares, explain baggage rules, track a refund, summarise your itinerary, or suggest destinations. What would you like to do?" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const suggestions = [
    "Find cheaper flights to Dubai next month",
    "Explain my baggage allowance on SW-811",
    "Track my refund for SW5K8N",
    "Can I upgrade my seat on SW-811?",
    "Suggest a vegetarian meal for my next flight",
    "Explain check-in rules for international flights",
    "Summarise my upcoming itinerary",
    "Recommend a family-friendly destination for December",
  ];

  const canned = (q: string): string => {
    const s = q.toLowerCase();
    if (s.includes("cheaper") || s.includes("fare")) return "I found 3 cheaper alternatives for your route:\n\n• SW-902 · departs 18:45 · ₹9,890 (₹3,600 less)\n• SW-221 · 1 stop DUB · ₹8,450 (₹5,040 less)\n• Flexible dates: 22 Jun saves an additional ₹1,200.\n\nWant me to hold the SW-902 offer for 15 minutes?";
    if (s.includes("baggage")) return "Your SW-811 BOM → DXB booking (Economy Flex) includes:\n\n• Cabin: 7 kg + 1 personal item\n• Check-in: 30 kg total across up to 2 bags\n• Extra bag: ₹1,900 per 10 kg pre-paid, ₹3,200 at airport\n\nAs a Gold member you get an extra 10 kg free — already applied.";
    if (s.includes("refund")) return "Refund for PNR SW5K8N is currently **Pending** with your bank.\n\n• Amount: ₹6,240\n• Initiated: 18 May 2026\n• Expected credit: 3–5 business days to Visa ···· 4291\n\nI'll ping you as soon as it clears. Want me to escalate to priority processing?";
    if (s.includes("upgrade")) return "You're eligible to upgrade SW-811 to Business:\n\n• Miles only: 25,000 (you have 42,580)\n• Cash + miles: 8,000 miles + ₹6,500\n• Bid upgrade: from ₹7,500 (moderate chance)\n\nShall I confirm the miles-only upgrade now?";
    if (s.includes("meal")) return "For your next flight I'd recommend:\n\n• **Vegetarian Jain (VJML)** — no root vegetables, light and travel-friendly\n• **Asian Vegetarian (AVML)** — dal, sabzi, rice, roti\n• **Fruit platter (FPML)** — great on short hops\n\nWould you like me to set VJML as your default for future bookings?";
    if (s.includes("check-in")) return "International check-in rules for SW-811 BOM → DXB:\n\n• Online check-in opens T-48h, closes T-90 min\n• Passport valid ≥ 6 months from arrival — yours is ✅\n• UAE visa or visa-on-arrival required\n• Cabin gates close 20 min before departure\n\nOnline check-in opens tomorrow at 21:30 — I'll remind you.";
    if (s.includes("itinerary") || s.includes("summari")) return "Here's your upcoming trip in one view:\n\n**PNR SW9M2P · BOM → DXB · 28 Jun 2026**\n• SW-811 · Depart 23:30 IST · Arrive 01:15 GST · Gate C12\n• Seat 4A · Business (upgraded)\n• Cabin bag + 30 kg checked · VJML meal\n• Hotel: Rove Downtown · 29 Jun–02 Jul\n\nAll documents are ready. Want a PDF summary or Apple Wallet pass?";
    if (s.includes("destination") || s.includes("recommend")) return "Based on your travel history and December preferences, I'd suggest:\n\n• **Kyoto, Japan** — cool, cultural, direct via DEL\n• **Cape Town, South Africa** — summer + safaris, best value 12–19 Dec\n• **Queenstown, NZ** — adventure + snow, needs ~19 hr transit\n\nWant fare alerts on any of these?";
    return "I can help with fares, refunds, baggage, upgrades, check-in, meals, and itinerary summaries — anything about your SkyWay travel. Try a suggestion below or ask in your own words.";
  };

  const send = (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    setInput("");
    const uMsg: AsstMessage = { id: `u-${Date.now()}`, role: "user", content: question };
    setMessages((m) => [...m, uMsg]);
    setBusy(true);
    setTimeout(() => {
      const aMsg: AsstMessage = { id: `a-${Date.now()}`, role: "assistant", content: canned(question) };
      setMessages((m) => [...m, aMsg]);
      setBusy(false);
    }, 550);
  };

  return (
    <div>
      <PageHeader title="AI travel assistant" blurb={page.blurb} crumbs={["Account", "Assistant"]} />
      <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card className="flex h-[560px] flex-col p-0">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-white">✦</span>
              <div>
                <div className="text-sm font-semibold">SkyWay assistant</div>
                <div className="text-[11px] text-foreground/55">Personalised for Gold member · Arjun</div>
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-accent text-white" : "bg-muted text-foreground"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm text-foreground/60">Thinking…</div>
                </div>
              )}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-center gap-2 border-t border-border p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about fares, baggage, refunds, upgrades…"
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <button type="submit" disabled={busy || !input.trim()} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">Send</button>
            </form>
          </Card>
        </div>

        <div className="space-y-3">
          <Card>
            <div className="text-sm font-semibold">Try asking</div>
            <div className="mt-3 flex flex-col gap-2">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-md border border-border bg-muted/30 px-3 py-2 text-left text-xs hover:border-accent/50 hover:bg-accent/5">{s}</button>
              ))}
            </div>
          </Card>
          <Card>
            <div className="text-sm font-semibold">Context</div>
            <div className="mt-2 space-y-2 text-xs text-foreground/70">
              <div className="flex justify-between"><span>Next trip</span><span className="font-medium text-foreground">BOM → DXB · 28 Jun</span></div>
              <div className="flex justify-between"><span>PNR</span><span className="font-mono text-foreground">SW9M2P</span></div>
              <div className="flex justify-between"><span>Tier</span><span className="font-medium text-foreground">Gold</span></div>
              <div className="flex justify-between"><span>Miles</span><span className="font-medium text-foreground">42,580</span></div>
            </div>
            <div className="mt-3 text-[11px] text-foreground/50">The assistant uses your bookings, tier, and preferences to personalise answers. It never shares your details with third parties.</div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// Baggage Tracker Page
// ===================================================================
export function BaggageTrackerPage({ pnr, lastName }: { pnr?: string; lastName?: string }) {
  return (
    <div>
      <PageHeader
        title="Baggage Tracker"
        blurb="Live location, security screening status, cargo hold loading, and carousel delivery"
        crumbs={["Travel", "Baggage Tracker"]}
      />
      <div className="p-6 md:p-8">
        <BaggageTracker initialPnr={pnr || "SW8K2P"} initialLastName={lastName || "Sharma"} />
      </div>
    </div>
  );
}

// ===================================================================
// User Dashboard Page
// ===================================================================
export function UserDashboardPage() {
  return (
    <div>
      <PageHeader
        title="Passenger Dashboard"
        blurb="Frequent flyer miles status, upcoming itineraries, and flight history ledger"
        crumbs={["Account", "User Dashboard"]}
      />
      <div className="p-6 md:p-8">
        <UserDashboard />
      </div>
    </div>
  );
}


