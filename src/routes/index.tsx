import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Plane, Menu, X, Search, Users, ArrowRight, Sparkles,
  CheckCircle2, Luggage, MapPin, Ticket, Armchair, Accessibility,
  Shield, Wifi, Clock, Globe2, Headset, RefreshCcw, Star,
  Bell, Smartphone, ChevronDown, Calendar, ArrowLeftRight
} from "lucide-react";
import { toast } from "sonner";
import heroPlane from "@/assets/hero-plane.jpg";
import destParis from "@/assets/dest-paris.jpg";
import destTokyo from "@/assets/dest-tokyo.jpg";
import destNewYork from "@/assets/dest-newyork.jpg";
import destIsland from "@/assets/dest-island.jpg";
import destDubai from "@/assets/dest-dubai.jpg";
import destLondon from "@/assets/dest-london.jpg";
import cabinBusiness from "@/assets/cabin-business.jpg";

const TITLE = "SkyWay Airlines — Fly Smarter. Travel Better.";
const DESCRIPTION =
  "Book flights to 250+ destinations with SkyWay Airlines. AI-powered travel assistance, premium cabins, seamless check-in, and world-class service.";

const ROLE_HOME: Record<string, string> = {
  admin: "/app",
  agent: "/app",
  traveler: "/app",
};

function useAuth() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<{ role: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("skyway_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  const signOut = () => {
    localStorage.removeItem("skyway_user");
    setUser(null);
  };

  return { isAuthenticated: !!user, ready, user, signOut };
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

const NAV: { l: string; h?: string; to?: string }[] = [
  { l: "Home",           h: "#top" },
  { l: "Book Flight",    h: "#book" },
  { l: "Manage Booking", to: "/app/my-trips" },
  { l: "Flight Status",  to: "/app/flight-status/SW128" },
  { l: "Destinations",   h: "#destinations" },
  { l: "Travel Info",    to: "/app/help" },
  { l: "Offers",         h: "#offers" },
  { l: "About Us",       h: "#about" },
  { l: "Contact",        to: "/app/help/chat" },
];

const DESTINATIONS = [
  { img: destParis,   name: "Paris",     code: "DEL → CDG", price: "₹42,900", hours: "8h 40m", to: "DEL-CDG" },
  { img: destTokyo,   name: "Tokyo",     code: "DEL → HND", price: "₹58,200", hours: "9h 15m", to: "DEL-SIN" },
  { img: destNewYork, name: "New York",  code: "DEL → JFK", price: "₹64,500", hours: "16h 40m", to: "DEL-JFK" },
  { img: destIsland,  name: "Maldives",  code: "DEL → MLE", price: "₹24,900", hours: "4h 20m", to: "DEL-BOM" },
  { img: destDubai,   name: "Dubai",     code: "DEL → DXB", price: "₹12,400", hours: "3h 30m", to: "DEL-DXB" },
  { img: destLondon,  name: "London",    code: "DEL → LHR", price: "₹48,900", hours: "9h 20m", to: "DEL-LHR" },
];

const SERVICES = [
  { i: CheckCircle2, t: "Online Check-in",    d: "Check in from T-24h, walk straight to the gate.", to: "/app/check-in/SW9M2P" },
  { i: Ticket,       t: "Manage Booking",     d: "Update passengers, dates, and preferences.",       to: "/app/my-trips" },
  { i: Clock,        t: "Flight Status",      d: "Live gates, delays, and boarding alerts.",         to: "/app/flight-status/SW128" },
  { i: Armchair,     t: "Seat Selection",     d: "Pick your seat on a live cabin map.",              to: "/app/booking/seats" },
  { i: Luggage,      t: "Extra Baggage",      d: "Add checked bags at a fraction of airport rates.", to: "/app/booking/extras" },
  { i: Accessibility,t: "Special Assistance", d: "Wheelchair, medical, unaccompanied minor.",        to: "/app/help/topic/special-assistance" },
  { i: Sparkles,     t: "Lounge Access",      d: "Premium lounges across 60+ hubs.",                 to: "/app/loyalty" },
  { i: Shield,       t: "Travel Insurance",   d: "Trip, medical, and baggage protection.",           to: "/app/booking/extras" },
];

const WHY = [
  { i: Sparkles, t: "AI travel assistant",     d: "Personalized itineraries and instant answers." },
  { i: Armchair, t: "Comfortable cabins",      d: "Class-leading legroom in every cabin." },
  { i: Globe2,   t: "Global destinations",     d: "250+ cities across 6 continents." },
  { i: Ticket,   t: "Easy booking",            d: "Book in under 3 minutes on any device." },
  { i: Clock,    t: "Fast check-in",           d: "Wallet-ready boarding pass in seconds." },
  { i: Headset,  t: "Premium customer care",   d: "24/7 human support in 12 languages." },
  { i: RefreshCcw,t: "Flexible ticket changes",d: "Same-day flexibility on Flex fares." },
  { i: Shield,   t: "Secure travel",           d: "Bank-grade encryption on every payment." },
];

const CABINS = [
  { t: "Economy",           d: "Refined essentials with 32\" seat pitch, hot meals, and personal 4K screens.", to: "/app/search/DEL-CDG" },
  { t: "Premium Economy",   d: "38\" pitch, priority boarding, upgraded dining, and dedicated overhead bins.",  to: "/app/search/DEL-LHR" },
  { t: "Business",          d: "Lie-flat suites, direct aisle access, chef-curated tasting menus, and lounge access.", to: "/app/flights/SW-502" },
  { t: "First",             d: "Private suites with sliding doors, turndown service, on-demand caviar service.", to: "/app/flights/SW-811" },
];

const OFFERS = [
  { tag: "Seasonal",    t: "Monsoon Getaways", d: "Up to 30% off select Southeast Asia routes.", chip: "Ends Aug 31", to: "/app/search/DEL-SIN" },
  { tag: "Students",    t: "Student Fares",    d: "Flat 15% off with a valid student ID.",       chip: "Year-round",  to: "/app/search/DEL-LHR" },
  { tag: "Family",      t: "Family Pack",      d: "Kids fly free on select long-haul routes.",   chip: "4+ pax",      to: "/app/search/DEL-DXB" },
  { tag: "Holidays",    t: "Winter in Europe", d: "Flights + hotel bundles starting ₹62,900.",   chip: "Dec–Feb",     to: "/app/search/DEL-CDG" },
  { tag: "Early Bird",  t: "Book 60 Days Out", d: "Extra 10% off when you book early.",          chip: "All fares",   to: "/app/search/DEL-JFK" },
];

const APP_FEATURES = [
  { i: Ticket,     t: "Mobile boarding pass" },
  { i: Bell,       t: "Real-time notifications" },
  { i: MapPin,     t: "Live flight tracking" },
  { i: Smartphone, t: "One-tap easy booking" },
  { i: Sparkles,   t: "AI travel assistant" },
];

const TESTIMONIALS = [
  { n: "Priya R.",   r: "DEL → CDG", q: "Seamless from booking to boarding. The AI assistant even suggested a museum near my layover hotel." },
  { n: "Aditya M.",  r: "BOM → DXB", q: "My flight was delayed and SkyWay had me rebooked before I even reached the desk. Effortless." },
  { n: "Sneha K.",   r: "DEL → LHR", q: "Business class felt like a boutique hotel. Crew were warm, food was exceptional." },
];

const FAQS = [
  { q: "How do I book a flight on SkyWay?", a: "Use the flight search on our home page. Enter your origin, destination, dates, and passenger count — you'll get real-time fares within seconds." },
  { q: "When can I check in online?",       a: "Online check-in opens 24 hours before departure and closes 90 minutes prior for international flights." },
  { q: "What is the baggage allowance?",    a: "Economy: 1×23kg checked + 7kg cabin. Business: 2×32kg + 10kg cabin. First: 3×32kg + 10kg cabin." },
  { q: "Can I change my booking?",          a: "Yes — Flex and Business fares allow free date changes. Saver fares incur a change fee. Manage everything from 'Manage Booking'." },
  { q: "How do I contact SkyWay support?",  a: "Our contact center runs 24/7 in 12 languages. You can also chat with the AI assistant for instant answers." },
];

const AIRPORTS = [
  { code: "DEL", city: "Delhi", name: "Indira Gandhi International" },
  { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj" },
  { code: "DXB", city: "Dubai", name: "Dubai International" },
  { code: "LHR", city: "London", name: "Heathrow Airport" },
  { code: "JFK", city: "New York", name: "John F. Kennedy" },
  { code: "CDG", city: "Paris", name: "Charles de Gaulle" },
  { code: "SIN", city: "Singapore", name: "Changi Airport" },
  { code: "HND", city: "Tokyo", name: "Haneda Airport" },
  { code: "MLE", city: "Maldives", name: "Velana International" },
];

function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, ready, user, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navigateWithAuth = (targetPath: string) => {
    if (isAuthenticated) {
      navigate({ to: targetPath });
    } else {
      navigate({ to: "/signin", search: { redirect: targetPath } });
    }
  };

  const showAccount = ready && isAuthenticated && !!user;
  const accountHref = showAccount ? ROLE_HOME[user.role] : "/signin";

  return (
    <div id="top" className="min-h-screen bg-background text-foreground">
      {/* ─── NAV ─── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-border/70 bg-background/85 backdrop-blur-xl"
            : "border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 md:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className={`grid h-9 w-9 place-items-center rounded-lg transition ${scrolled ? "bg-sky-dark" : "bg-white/15 ring-1 ring-white/25 backdrop-blur"}`}>
              <Plane className={`h-4 w-4 ${scrolled ? "text-sky-gold" : "text-white"}`} strokeWidth={2.4} />
            </span>
            <span className={`font-display text-xl leading-none tracking-tight transition ${scrolled ? "text-foreground" : "text-white"}`}>
              SkyWay <span className="text-sky-gold">Airlines</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 xl:flex">
            {NAV.map((n) =>
              n.to ? (
                <button
                  key={n.l}
                  onClick={() => navigateWithAuth(n.to!)}
                  className={`text-[13px] font-medium transition ${
                    scrolled ? "text-foreground/70 hover:text-sky-accent" : "text-white/85 hover:text-white"
                  }`}
                >
                  {n.l}
                </button>
              ) : (
                <a
                  key={n.l}
                  href={n.h}
                  className={`text-[13px] font-medium transition ${
                    scrolled ? "text-foreground/70 hover:text-sky-accent" : "text-white/85 hover:text-white"
                  }`}
                >
                  {n.l}
                </a>
              )
            )}
          </nav>

          <div className="flex items-center gap-2">
            {showAccount ? (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  to={accountHref}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    scrolled
                      ? "bg-sky-dark text-white hover:bg-sky-dark/90"
                      : "bg-white text-sky-dark hover:bg-sky-gold"
                  }`}
                >
                  My account
                </Link>
                <button
                  onClick={signOut}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    scrolled
                      ? "border-border text-foreground/80 hover:bg-muted"
                      : "border-white/40 text-white hover:bg-white/10"
                  }`}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                to="/signin"
                className={`hidden rounded-full px-5 py-2 text-sm font-semibold transition sm:inline-flex ${
                  scrolled
                    ? "bg-sky-dark text-white hover:bg-sky-dark/90"
                    : "bg-white text-sky-dark hover:bg-sky-gold hover:text-sky-dark"
                }`}
              >
                Sign In
              </Link>
            )}
            <button
              onClick={() => setMenu((m) => !m)}
              className={`grid h-9 w-9 place-items-center rounded-md xl:hidden ${scrolled ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/10"}`}
              aria-label="Toggle menu"
            >
              {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menu && (
          <div className="border-t border-border bg-background xl:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
              {NAV.map((n) =>
                n.to ? (
                  <button
                    key={n.l}
                    onClick={() => {
                      setMenu(false);
                      navigateWithAuth(n.to!);
                    }}
                    className="rounded-md px-3 py-2 text-left text-sm font-medium text-foreground/80 hover:bg-muted"
                  >
                    {n.l}
                  </button>
                ) : (
                  <a
                    key={n.l}
                    href={n.h}
                    onClick={() => setMenu(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
                  >
                    {n.l}
                  </a>
                )
              )}
              {showAccount ? (
                <>
                  <Link to={accountHref} onClick={() => setMenu(false)} className="mt-2 rounded-md bg-sky-dark px-3 py-2.5 text-center text-sm font-semibold text-white">
                    My account
                  </Link>
                  <button
                    onClick={() => { setMenu(false); signOut(); }}
                    className="mt-1 rounded-md border border-border px-3 py-2.5 text-center text-sm font-semibold text-foreground/80"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link to="/signin" onClick={() => setMenu(false)} className="mt-2 rounded-md bg-sky-dark px-3 py-2.5 text-center text-sm font-semibold text-white">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO ─── */}
      <section className="relative min-h-[92vh] w-full overflow-hidden">
        <img src={heroPlane} alt="Modern airliner cruising above the clouds" className="absolute inset-0 h-full w-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-dark/70 via-sky-dark/40 to-sky-dark/85" />
        <div className="absolute inset-0 bg-gradient-to-r from-sky-dark/50 via-transparent to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-between px-4 pt-36 pb-16 md:px-6">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-sky-gold" /> AI-powered · Global · Award winning
            </span>
            <h1 className="mt-6 font-display text-[46px] leading-[0.98] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[92px]">
              Fly Smarter. <em className="italic text-sky-gold">Travel Better.</em>
              <span className="mt-2 block text-white/90">Welcome to SkyWay Airlines.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-white/85 md:text-lg">
              Experience seamless travel with smart booking, personalized services, and AI-powered travel assistance across 250+ destinations.
            </p>
          </div>

          {/* Flight Search Widget */}
          <div id="book" className="mt-10">
            <FlightSearchWidget onSearch={(routeKey) => navigateWithAuth(`/app/search/${routeKey}`)} />
          </div>
        </div>
      </section>

      {/* ─── POPULAR DESTINATIONS ─── */}
      <section id="destinations" className="mx-auto max-w-7xl px-4 py-24 md:px-6">
        <SectionHeader
          eyebrow="Popular Destinations"
          title={<>Your next escape <em className="italic text-sky-gold">awaits</em></>}
          sub="Loved by travelers, connected by SkyWay — pick a city, we'll fly you there."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DESTINATIONS.map((d) => (
            <article key={d.name} className="group relative h-[440px] overflow-hidden rounded-2xl ring-1 ring-border transition-all hover:-translate-y-1 hover:shadow-2xl hover:ring-sky-accent/40">
              <img src={d.img} alt={d.name} width={1024} height={1280} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-sky-dark/90 via-sky-dark/25 to-transparent" />
              <div className="absolute inset-x-5 bottom-5 rounded-xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="font-display text-3xl text-white">{d.name}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-widest text-white/70">{d.code} · {d.hours}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest text-white/70">from</div>
                    <div className="font-display text-2xl text-sky-gold">{d.price}</div>
                  </div>
                </div>
                <button
                  onClick={() => navigateWithAuth(`/app/search/${d.to}`)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-sky-gold px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-sky-dark transition hover:bg-white active:scale-[0.99] cursor-pointer"
                >
                  Explore <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section id="manage" className="bg-sky-mist py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHeader eyebrow="Our Services" title={<>Everything you need, <em className="italic text-sky-gold">in one place</em></>} sub="From check-in to lounge access — thoughtful services that make travel effortless." />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s) => (
              <div
                key={s.t}
                onClick={() => navigateWithAuth(s.to)}
                role="button"
                tabIndex={0}
                className="group cursor-pointer rounded-2xl border border-border bg-background p-6 transition-all hover:-translate-y-1 hover:border-sky-accent/40 hover:shadow-lg text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sky-dark text-sky-gold transition group-hover:bg-sky-accent group-hover:text-white">
                    <s.i className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100 group-hover:translate-x-1" />
                </div>
                <div className="mt-4 font-display text-xl text-foreground group-hover:text-sky-accent transition-colors">{s.t}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY FLY ─── */}
      <section id="about" className="mx-auto max-w-7xl px-4 py-24 md:px-6">
        <SectionHeader eyebrow="Why Fly with SkyWay" title={<>Reasons travelers <em className="italic text-sky-gold">stay with us</em></>} sub="Built on decades of aviation craft and reimagined for the AI era." />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((w) => (
            <div key={w.t} className="rounded-xl border-l-2 border-sky-gold bg-background p-5 shadow-sm border-y border-r border-border/50">
              <w.i className="h-5 w-5 text-sky-accent" strokeWidth={2} />
              <div className="mt-3 font-display text-lg text-foreground">{w.t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{w.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── AI ASSISTANT SECTION ─── */}
      <section id="travel-info" className="relative overflow-hidden bg-sky-dark py-24 text-white">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-sky-accent/25 blur-3xl" />
        <div className="absolute -left-32 -bottom-32 h-80 w-80 rounded-full bg-sky-gold/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 md:grid-cols-2 md:items-center md:px-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-gold backdrop-blur">
              <Sparkles className="h-3 w-3" /> AI Travel Assistant
            </span>
            <h2 className="mt-6 font-display text-4xl leading-tight tracking-tight md:text-6xl">
              Your personal <em className="italic text-sky-gold">flight concierge</em>, 24/7
            </h2>
            <p className="mt-5 max-w-lg text-white/75">
              Find the best flights, ask baggage questions, understand airline policies, track bookings, and receive personalized recommendations — all in a natural conversation.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/80">
              {["Instant fare comparisons & hold bookings","Baggage & refund policy answers","Live flight status & gate changes","Personalized destination recommendations"].map((x) => (
                <li key={x} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-sky-gold" /> {x}</li>
              ))}
            </ul>
            <div className="mt-8">
              <button
                onClick={() => navigateWithAuth("/app/assistant")}
                className="inline-flex items-center gap-2 rounded-full bg-sky-gold px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-sky-dark transition hover:bg-white shadow-lg active:scale-95 cursor-pointer"
              >
                Open AI Assistant <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* AI Mock Card UI */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl">
            <div className="space-y-4 text-sm">
              <div className="flex justify-end">
                <div className="max-w-xs rounded-2xl rounded-br-none bg-sky-accent px-4 py-2.5 text-white shadow-md">
                  Find me the cheapest flight to Paris next month.
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-md rounded-2xl rounded-bl-none bg-white/10 p-4 text-white/90 backdrop-blur-md border border-white/10 shadow-md">
                  <div className="flex items-center gap-2 text-xs text-sky-gold font-semibold uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5" /> Best Match Found
                  </div>
                  <div className="mt-2 font-display text-lg text-white">SW 128 · ₹42,900</div>
                  <p className="mt-1 text-xs text-white/75">DEL 07:40 → CDG 14:20 · 8h 40m nonstop</p>
                  <p className="mt-2 text-xs text-white/80">Includes 1×23kg bag, meal & lounge access option.</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => navigateWithAuth("/app/search/DEL-CDG")}
                      className="rounded-lg bg-sky-gold px-3 py-1.5 text-xs font-bold text-sky-dark hover:bg-white transition cursor-pointer"
                    >
                      Book Now
                    </button>
                    <button
                      onClick={() => navigateWithAuth("/app/assistant")}
                      className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white hover:bg-white/10 transition cursor-pointer"
                    >
                      View details
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-xs rounded-2xl rounded-br-none bg-sky-accent px-4 py-2.5 text-white shadow-md">
                  What's the baggage allowance?
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-md rounded-2xl rounded-bl-none bg-white/10 p-4 text-white/90 backdrop-blur-md border border-white/10 shadow-md">
                  <p className="text-xs text-white/85">
                    Economy includes <strong>1 × 23kg checked bag</strong> and <strong>7kg cabin bag</strong>. Extra baggage can be added anytime.
                  </p>
                  <div className="mt-2">
                    <button
                      onClick={() => navigateWithAuth("/app/booking/extras")}
                      className="text-[11px] text-sky-gold hover:text-white transition underline cursor-pointer"
                    >
                      Check baggage rules →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRAVEL EXPERIENCE (Cabins) ─── */}
      <section className="mx-auto max-w-7xl px-4 py-24 md:px-6">
        <SectionHeader eyebrow="Travel Experience" title={<>Choose your <em className="italic text-sky-gold">cabin</em></>} sub="Four distinct classes, one uncompromising standard of care." />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="relative h-[420px] overflow-hidden rounded-2xl">
            <img src={cabinBusiness} alt="Business class cabin" width={1280} height={832} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-sky-dark/90 to-transparent" />
            <div className="absolute inset-x-6 bottom-6 text-white">
              <div className="text-[11px] uppercase tracking-widest text-sky-gold">Signature</div>
              <div className="mt-1 font-display text-4xl">Business Class</div>
              <div className="mt-2 max-w-sm text-sm text-white/80">Lie-flat suites, direct aisle access, and a tasting menu curated by Michelin-starred chefs.</div>
              <button
                onClick={() => navigateWithAuth("/app/flights/SW-502")}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-sky-dark hover:bg-sky-gold transition cursor-pointer"
              >
                View Business Class <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="grid gap-4">
            {CABINS.map((c) => (
              <div
                key={c.t}
                onClick={() => navigateWithAuth(c.to)}
                role="button"
                tabIndex={0}
                className="group cursor-pointer rounded-2xl border border-border bg-background p-6 transition-all hover:border-sky-accent/50 hover:shadow-md"
              >
                <div className="flex items-baseline justify-between">
                  <div className="font-display text-2xl text-foreground group-hover:text-sky-accent transition-colors">{c.t}</div>
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-sky-accent group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Explore →
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SPECIAL OFFERS ─── */}
      <section id="offers" className="bg-sky-mist py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHeader eyebrow="Special Offers" title={<>Fares worth <em className="italic text-sky-gold">chasing</em></>} sub="Seasonal deals, student fares, and family bundles — refreshed weekly." />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {OFFERS.map((o) => (
              <div key={o.t} className="group relative overflow-hidden rounded-2xl bg-background p-6 ring-1 ring-border transition hover:ring-sky-accent/40 hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-sky-dark px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-sky-gold">{o.tag}</span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{o.chip}</span>
                </div>
                <div className="mt-4 font-display text-2xl text-foreground">{o.t}</div>
                <p className="mt-2 text-sm text-muted-foreground">{o.d}</p>
                <button
                  onClick={() => navigateWithAuth(o.to)}
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-accent hover:text-sky-dark transition cursor-pointer"
                >
                  Grab offer <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MOBILE APP ─── */}
      <section className="mx-auto max-w-7xl px-4 py-24 md:px-6">
        <div className="grid gap-12 rounded-3xl bg-sky-dark p-8 text-white md:grid-cols-2 md:items-center md:p-14">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-gold">SkyWay Mobile</span>
            <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
              Your airline, <em className="italic text-sky-gold">in your pocket</em>
            </h2>
            <p className="mt-4 max-w-md text-white/75">Boarding pass, flight tracker, itinerary — everything you need, always with you.</p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {APP_FEATURES.map((f) => (
                <li key={f.t} className="flex items-center gap-2.5 text-sm">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10"><f.i className="h-4 w-4 text-sky-gold" /></span>
                  {f.t}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => toast.success("SkyWay App is ready — you can install or use this responsive web app on iOS/Android.")}
                className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-sky-dark hover:bg-sky-gold transition"
              >
                App Store
              </button>
              <button
                onClick={() => toast.success("SkyWay App is ready — you can install or use this responsive web app on iOS/Android.")}
                className="rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
              >
                Google Play
              </button>
            </div>
          </div>
          {/* Phone mock */}
          <div className="mx-auto grid place-items-center">
            <div
              onClick={() => navigateWithAuth("/app/check-in/SW9M2P/boarding-pass")}
              role="button"
              tabIndex={0}
              className="relative aspect-[9/19] w-64 rounded-[2.5rem] border-4 border-white/20 bg-gradient-to-b from-sky-accent/40 to-sky-dark p-3 shadow-2xl cursor-pointer hover:scale-105 transition-transform"
              title="Click to view digital boarding pass"
            >
              <div className="h-full w-full rounded-[2rem] bg-background p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-muted-foreground">
                    <span>Boarding Pass</span>
                    <span className="text-emerald-500 font-bold">● Live</span>
                  </div>
                  <div className="mt-1 font-display text-2xl text-foreground">SW 128</div>
                  <div className="mt-3 flex items-center justify-between text-foreground">
                    <div><div className="font-display text-3xl">DEL</div><div className="text-[10px] text-muted-foreground">07:40</div></div>
                    <Plane className="h-5 w-5 text-sky-accent" />
                    <div className="text-right"><div className="font-display text-3xl">CDG</div><div className="text-[10px] text-muted-foreground">14:20</div></div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <div>Seat<div className="mt-0.5 text-sm font-semibold text-foreground">3A</div></div>
                    <div>Gate<div className="mt-0.5 text-sm font-semibold text-foreground">B12</div></div>
                    <div>Class<div className="mt-0.5 text-sm font-semibold text-foreground">Business</div></div>
                  </div>
                </div>

                <div>
                  <div className="h-14 rounded-md bg-[repeating-linear-gradient(90deg,_var(--sky-dark)_0_2px,_transparent_2px_5px)]" />
                  <div className="mt-2 text-center text-[10px] text-muted-foreground">Tap to view full ticket</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="mx-auto max-w-7xl px-4 py-24 md:px-6">
        <SectionHeader eyebrow="Guest Reviews" title={<>Loved by <em className="italic text-sky-gold">travelers</em></>} sub="4.8★ average across 120,000+ verified passenger reviews." />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.n} className="rounded-2xl border border-border bg-background p-7 shadow-sm">
              <div className="flex gap-0.5 text-sky-gold">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <blockquote className="mt-4 font-display text-xl leading-snug text-foreground">"{t.q}"</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4 text-sm">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-sky-dark text-xs font-bold text-sky-gold">{t.n.split(" ").map(x=>x[0]).join("")}</span>
                <div>
                  <div className="font-semibold text-foreground">{t.n}</div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{t.r}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="status" className="bg-sky-mist py-24">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <SectionHeader eyebrow="FAQ" title={<>Questions, <em className="italic text-sky-gold">answered</em></>} sub="Everything travelers ask, in one place." />
          <div className="mt-10 space-y-3">
            {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section id="contact" className="relative overflow-hidden bg-sky-dark py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_oklch(0.68_0.15_240/0.35),_transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center md:px-6">
          <h2 className="font-display text-5xl leading-tight md:text-7xl">
            Ready for your <em className="italic text-sky-gold">next journey?</em>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-white/75">
            Book in minutes. Fly in style. Earn miles on every ticket.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                const el = document.getElementById("book");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 rounded-full bg-sky-gold px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-sky-dark transition hover:bg-white shadow-lg active:scale-95 cursor-pointer"
            >
              Book a flight <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigateWithAuth("/app")}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-white/10 cursor-pointer"
            >
              {showAccount ? "My account" : "Sign In"}
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 bg-sky-dark text-white/60">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-5 md:px-6">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10"><Plane className="h-4 w-4 text-sky-gold" /></span>
              <span className="font-display text-xl text-white">SkyWay <span className="text-sky-gold">Airlines</span></span>
            </div>
            <p className="mt-4 max-w-sm text-sm">Fly Smarter. Travel Better. Connecting 250+ cities with world-class care since 1998.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { name: "X (Twitter)", label: "X" },
                { name: "Instagram", label: "IG" },
                { name: "LinkedIn", label: "LI" },
                { name: "YouTube", label: "YT" },
              ].map((s) => (
                <button
                  key={s.name}
                  onClick={() => toast(`SkyWay on ${s.name}`)}
                  title={`Follow SkyWay on ${s.name}`}
                  className="inline-flex h-8 items-center justify-center rounded-full border border-white/15 px-3 text-[11px] font-semibold text-white/80 transition hover:border-sky-gold hover:bg-white/10 hover:text-white"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          {[
            {
              h: "Company",
              l: [
                { title: "About Us", to: "#about" },
                { title: "Destinations", to: "#destinations" },
                { title: "Fleet & Cabins", to: "/app/flights/SW-502" },
                { title: "Sustainability", to: "/app/analytics" },
              ],
            },
            {
              h: "Support",
              l: [
                { title: "Contact Support", to: "/app/help/chat" },
                { title: "FAQs & Guides", to: "/app/help" },
                { title: "Baggage Policy", to: "/app/booking/extras" },
                { title: "Flight Status", to: "/app/flight-status/SW128" },
              ],
            },
            {
              h: "Services",
              l: [
                { title: "Online Check-In", to: "/app/check-in/SW9M2P" },
                { title: "Manage Trips", to: "/app/my-trips" },
                { title: "SkyWay Loyalty", to: "/app/loyalty" },
                { title: "AI Travel Assistant", to: "/app/assistant" },
              ],
            },
          ].map((c) => (
            <div key={c.h}>
              <div className="text-xs font-bold uppercase tracking-widest text-sky-gold">{c.h}</div>
              <ul className="mt-4 space-y-2 text-sm">
                {c.l.map((item) => (
                  <li key={item.title}>
                    {item.to.startsWith("#") ? (
                      <a href={item.to} className="hover:text-white transition-colors">{item.title}</a>
                    ) : (
                      <button
                        onClick={() => navigateWithAuth(item.to)}
                        className="hover:text-white transition-colors text-left cursor-pointer"
                      >
                        {item.title}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-white/45 md:px-6">
            <div>© 2026 SkyWay Airlines. IATA accredited.</div>
            <div className="flex items-center gap-4"><span>EN / INR</span><span>·</span><span>India</span></div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ────────────────── Sub-components ────────────────── */

function SectionHeader({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-sky-accent">{eyebrow}</p>
      <h2 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight text-foreground md:text-5xl">{title}</h2>
      <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

function FlightSearchWidget({ onSearch }: { onSearch: (routeKey: string) => void }) {
  const [trip, setTrip] = useState<"round" | "one">("round");
  const [fromCode, setFromCode] = useState("DEL");
  const [toCode, setToCode] = useState("CDG");
  const [departDate, setDepartDate] = useState("2026-08-28");
  const [returnDate, setReturnDate] = useState("2026-09-04");
  const [pax, setPax] = useState("1 Adult");
  const [travelClass, setTravelClass] = useState("Economy");

  const handleSwap = () => {
    const temp = fromCode;
    setFromCode(toCode);
    setToCode(temp);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const key = `${fromCode}-${toCode}`;
    onSearch(key);
  };

  return (
    <form onSubmit={handleSearchSubmit} className="rounded-2xl border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/30 backdrop-blur-2xl md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {(["round","one"] as const).map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => setTrip(k)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition cursor-pointer ${
                trip === k ? "bg-sky-gold text-sky-dark" : "border border-white/25 text-white/80 hover:bg-white/10"
              }`}
            >
              {k === "round" ? "Round trip" : "One way"}
            </button>
          ))}
        </div>
        <div className="text-xs text-white/70">
          Showing best nonstop & connection fares
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-6 relative">
        {/* Origin */}
        <div className="flex flex-col rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15 md:col-span-1">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/60">
            <MapPin className="h-3 w-3 text-sky-gold" /> From
          </span>
          <select
            value={fromCode}
            onChange={(e) => setFromCode(e.target.value)}
            className="mt-1 bg-transparent text-sm font-semibold text-white outline-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
          >
            {AIRPORTS.map((a) => (
              <option key={a.code} value={a.code}>
                {a.city} ({a.code})
              </option>
            ))}
          </select>
        </div>

        {/* Destination with Swap Button */}
        <div className="flex flex-col rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15 md:col-span-1 relative">
          <button
            type="button"
            onClick={handleSwap}
            title="Swap Origin and Destination"
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 hidden md:grid h-6 w-6 place-items-center rounded-full bg-sky-gold text-sky-dark shadow-md hover:scale-110 transition cursor-pointer"
          >
            <ArrowLeftRight className="h-3 w-3" />
          </button>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/60">
            <MapPin className="h-3 w-3 text-sky-gold" /> To
          </span>
          <select
            value={toCode}
            onChange={(e) => setToCode(e.target.value)}
            className="mt-1 bg-transparent text-sm font-semibold text-white outline-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
          >
            {AIRPORTS.map((a) => (
              <option key={a.code} value={a.code}>
                {a.city} ({a.code})
              </option>
            ))}
          </select>
        </div>

        {/* Departure */}
        <div className="flex flex-col rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15 md:col-span-1">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/60">
            <Calendar className="h-3 w-3 text-sky-gold" /> Departure
          </span>
          <input
            type="date"
            value={departDate}
            onChange={(e) => setDepartDate(e.target.value)}
            className="mt-1 bg-transparent text-xs font-semibold text-white outline-none cursor-pointer"
          />
        </div>

        {/* Return */}
        <div className={`flex flex-col rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15 md:col-span-1 ${trip === "one" ? "opacity-50" : ""}`}>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/60">
            <Calendar className="h-3 w-3 text-sky-gold" /> Return
          </span>
          <input
            type="date"
            disabled={trip === "one"}
            value={trip === "round" ? returnDate : ""}
            onChange={(e) => setReturnDate(e.target.value)}
            className="mt-1 bg-transparent text-xs font-semibold text-white outline-none cursor-pointer disabled:cursor-not-allowed"
          />
        </div>

        {/* Passengers */}
        <div className="flex flex-col rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15 md:col-span-1">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/60">
            <Users className="h-3 w-3 text-sky-gold" /> Passengers
          </span>
          <select
            value={pax}
            onChange={(e) => setPax(e.target.value)}
            className="mt-1 bg-transparent text-sm font-semibold text-white outline-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
          >
            <option value="1 Adult">1 Adult</option>
            <option value="2 Adults">2 Adults</option>
            <option value="2 Adults, 1 Child">2 Adults, 1 Child</option>
            <option value="Family (2+2)">Family (2+2)</option>
            <option value="Group (5+)">Group (5+)</option>
          </select>
        </div>

        {/* Class */}
        <div className="flex flex-col rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15 md:col-span-1">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/60">
            <Armchair className="h-3 w-3 text-sky-gold" /> Class
          </span>
          <select
            value={travelClass}
            onChange={(e) => setTravelClass(e.target.value)}
            className="mt-1 bg-transparent text-sm font-semibold text-white outline-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
          >
            <option value="Economy">Economy</option>
            <option value="Premium Economy">Premium Economy</option>
            <option value="Business">Business</option>
            <option value="First">First Class</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-sky-gold px-6 py-3 text-sm font-bold uppercase tracking-wider text-sky-dark transition hover:bg-white shadow-lg active:scale-95 cursor-pointer"
        >
          <Search className="h-4 w-4" /> Search Flights
        </button>
        <a
          href="#destinations"
          className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-white/10"
        >
          Explore Destinations
        </a>
      </div>
    </form>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-background shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
      >
        <span className="font-display text-lg text-foreground">{q}</span>
        <ChevronDown className={`h-4 w-4 flex-none text-sky-accent transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-border px-5 py-4 text-sm text-muted-foreground leading-relaxed">{a}</div>}
    </div>
  );
}
