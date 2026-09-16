import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  Search,
  Luggage,
  Clock,
  RefreshCcw,
  Armchair,
  Users,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  MessageSquare,
  X,
  Sparkles,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export type FaqCategory =
  | "all"
  | "baggage"
  | "checkin"
  | "changes"
  | "inflight"
  | "special";

export interface FaqQuestion {
  id: string;
  category: FaqCategory;
  categoryLabel: string;
  question: string;
  answer: string;
  highlights?: string[];
  actionLabel?: string;
  actionHref?: string;
}

export const FAQ_DATA: FaqQuestion[] = [
  {
    id: "baggage-allowance",
    category: "baggage",
    categoryLabel: "Baggage & Packing",
    question: "What are SkyWay's checked baggage allowances and weight limits?",
    answer:
      "Complimentary baggage allowances vary depending on your cabin class. All checked luggage must adhere to standard dimensional guidelines (sum of length + width + height under 158 cm / 62 inches).",
    highlights: [
      "Economy Class: 1 piece up to 23 kg (50 lbs) + 1 carry-on bag (up to 7 kg) + 1 small personal item.",
      "Premium Economy: 2 pieces up to 23 kg each + 1 carry-on bag up to 10 kg.",
      "Business Class: 2 pieces up to 32 kg (70 lbs) each + 2 carry-on items (total 14 kg).",
      "First Class: 3 pieces up to 32 kg each + 2 carry-on items.",
      "SkyWay Club Gold & Platinum members receive 1 additional complimentary 23 kg checked bag across all cabins.",
    ],
    actionLabel: "View Baggage Calculator",
    actionHref: "/app/booking/extras",
  },
  {
    id: "baggage-batteries-liquids",
    category: "baggage",
    categoryLabel: "Baggage & Packing",
    question: "Can I bring lithium power banks, electronics, and liquids in carry-on bags?",
    answer:
      "Power banks, spare lithium-ion batteries, and e-cigarettes must strictly be kept in your carry-on cabin baggage and are strictly prohibited inside checked luggage. Batteries must not exceed 100Wh (or 160Wh with airline special authorization). Liquids, aerosols, and gels in hand luggage must be in containers of 100 ml (3.4 oz) or less, packed inside one transparent, resealable 1-litre plastic pouch per passenger.",
    highlights: [
      "Spare power banks up to 100Wh: Allowed in carry-on only (max 2 per passenger).",
      "Liquids: Max 100 ml per container inside a transparent 1-litre bag.",
      "Smart bags with non-removable lithium batteries cannot be accepted.",
    ],
  },
  {
    id: "baggage-excess",
    category: "baggage",
    categoryLabel: "Baggage & Packing",
    question: "How do I purchase extra baggage, and what are the pre-booking discounts?",
    answer:
      "You can add prepaid baggage online anytime up to 4 hours before your scheduled departure through 'Manage Booking' or during web check-in. Pre-purchasing baggage online saves up to 45% compared to airport check-in desk rates.",
    highlights: [
      "Available in prepaid tiers of 5 kg, 10 kg, 15 kg, or an additional 23 kg bag.",
      "Instant confirmation and digital baggage receipt directly added to your boarding pass.",
      "Special rates apply for sports equipment, musical instruments, and oversized bags.",
    ],
    actionLabel: "Add Baggage to Booking",
    actionHref: "/app/booking/extras",
  },
  {
    id: "checkin-times",
    category: "checkin",
    categoryLabel: "Check-In & Boarding",
    question: "When does online check-in open and close?",
    answer:
      "Web and mobile check-in opens exactly 24 hours prior to scheduled departure. It closes 60 minutes before departure for domestic flights and 90 minutes before departure for international flights. Checking in online allows you to select seats, declare baggage, and generate your mobile boarding pass.",
    highlights: [
      "Opens: 24 hours before flight departure.",
      "Closes: 60 minutes before domestic flights; 90 minutes before international flights.",
      "Direct gate access with digital Apple Wallet or Google Pay boarding passes.",
    ],
    actionLabel: "Check In Online Now",
    actionHref: "/app/check-in/SW9M2P",
  },
  {
    id: "checkin-airport-arrival",
    category: "checkin",
    categoryLabel: "Check-In & Boarding",
    question: "How early should I arrive at the airport terminal before my flight?",
    answer:
      "For domestic flights, we recommend arriving at least 2 hours before scheduled departure. For international flights, please arrive at least 3 hours prior to allow sufficient time for bag drops, security screening, and international border control. Boarding gates close promptly 20 minutes prior to pushback.",
    highlights: [
      "Domestic Flights: Arrive 2 hours before departure.",
      "International Flights: Arrive 3 hours before departure.",
      "Boarding gates close strictly 20 minutes before departure.",
    ],
    actionLabel: "Live Flight Status & Terminal Info",
    actionHref: "/app/flight-status/SW128",
  },
  {
    id: "checkin-digital-pass",
    category: "checkin",
    categoryLabel: "Check-In & Boarding",
    question: "Do I need a printed paper boarding pass or is the digital pass accepted?",
    answer:
      "Digital boarding passes on your smartphone or smartwatch are accepted at over 98% of SkyWay destinations. Simply present the QR code at security checkpoints and gate scanners. If you are departing from an airport where local civil aviation rules require a physical stamp, automated fast-track self-service kiosks and bag drop desks will print your physical pass in seconds for free.",
  },
  {
    id: "changes-flex-policy",
    category: "changes",
    categoryLabel: "Changes, Cancellations & Refunds",
    question: "Can I change my flight date, time, or destination after booking?",
    answer:
      "Yes. If you booked a Flex, Business, or First Class ticket, you can make unlimited complimentary flight date and time changes up to 2 hours before departure (any fare difference applies). Standard Saver fares may be modified for a transparent, nominal fee through 'Manage Booking' on our website or mobile app.",
    highlights: [
      "Flex & Business fares: Free date & flight changes online.",
      "Standard fares: Low fixed modification fee + any fare differential.",
      "Self-service rebooking takes less than 60 seconds with your 6-digit PNR.",
    ],
    actionLabel: "Manage or Change Booking",
    actionHref: "/app/my-trips",
  },
  {
    id: "changes-24h-cancellation",
    category: "changes",
    categoryLabel: "Changes, Cancellations & Refunds",
    question: "What is SkyWay's 24-hour risk-free cancellation guarantee?",
    answer:
      "All tickets purchased directly on skyway.com or via the SkyWay mobile app qualify for our 24-hour risk-free cancellation policy. You can cancel your reservation within 24 hours of booking for a 100% full refund with zero cancellation penalty fees, provided the reservation was made at least 7 days before the scheduled departure.",
    highlights: [
      "100% full cash refund with zero deduction within 24 hours of booking.",
      "Applies to all ticket fare types including non-refundable promotional fares.",
      "Instant refund processing back to your original payment method.",
    ],
  },
  {
    id: "changes-refund-speed",
    category: "changes",
    categoryLabel: "Changes, Cancellations & Refunds",
    question: "How long do flight refunds take, and what options do I have?",
    answer:
      "Approved card refunds are processed back to your original payment card within 3 to 5 business days. Alternatively, travelers can choose instant SkyWay Travel Credits or SkyMiles bonus credits, which deposit immediately into your SkyWay account with an extra 10% bonus value and remain valid for 24 full months.",
    highlights: [
      "Original payment card: Processed in 3-5 business days.",
      "SkyWay Travel Wallet: Instant credit deposit with +10% bonus travel value.",
      "Transparent status tracking through our 24/7 self-service portal.",
    ],
  },
  {
    id: "inflight-wifi-entertainment",
    category: "inflight",
    categoryLabel: "In-Flight & SkyClub Lounges",
    question: "Is high-speed Wi-Fi and streaming available onboard SkyWay flights?",
    answer:
      "Yes! High-speed Ka-band satellite Wi-Fi is equipped across 100% of our Boeing 787 Dreamliner and Airbus A350 fleet. All passengers enjoy free unlimited in-flight text messaging (WhatsApp, iMessage, Messenger, WeChat). High-speed streaming passes for browsing, email, and 4K entertainment are available starting at ₹499 ($6), and are completely complimentary for First Class, Business Class, and SkyWay Club Platinum members.",
    highlights: [
      "Free messaging on WhatsApp, iMessage, and Messenger for all cabins.",
      "High-speed satellite connectivity with speeds up to 50 Mbps.",
      "Over 1,200 hours of movies, TV boxsets, and live satellite sports on personal 4K displays.",
    ],
    actionLabel: "Explore Fleet & Cabins",
    actionHref: "/app/flights/SW-502",
  },
  {
    id: "inflight-meals-dietary",
    category: "inflight",
    categoryLabel: "In-Flight & SkyClub Lounges",
    question: "How do I request special dietary meals (vegan, gluten-free, halal, kosher, Jain)?",
    answer:
      "SkyWay provides 18 certified special dietary meal options at zero extra charge. You can select your dietary meal profile during booking or anytime up to 24 hours prior to departure in 'Manage Booking'. Meals are prepared in certified facilities following strict allergen and religious guidelines.",
    highlights: [
      "Options include: Jain Vegetarian, Asian Vegetarian, Vegan, Gluten-Intolerant, Halal, Kosher, Diabetic, and Low-Sodium.",
      "Must be requested at least 24 hours prior to scheduled departure.",
      "Complimentary baby and toddler nutritional meals also available on long-haul routes.",
    ],
    actionLabel: "Preview In-Flight Dining",
    actionHref: "/app/booking/extras",
  },
  {
    id: "inflight-lounge-access",
    category: "inflight",
    categoryLabel: "In-Flight & SkyClub Lounges",
    question: "Who is eligible for SkyWay Club Airport Lounge access?",
    answer:
      "Complimentary lounge access is extended to passengers traveling in First Class and Business Class, as well as SkyWay Club Gold and Platinum elite tier members (with 1 guest). Economy and Premium Economy passengers can purchase discounted lounge day passes starting from ₹2,200 ($28) during booking or via the SkyWay app, subject to lounge capacity.",
    highlights: [
      "First & Business Class guests: Complimentary premium lounge access.",
      "SkyWay Club Gold & Platinum: Complimentary entry + 1 accompanying guest.",
      "Pay-per-use day passes available for purchase in advance across 60+ global hubs.",
    ],
    actionLabel: "Learn About SkyClub Loyalty",
    actionHref: "/app/loyalty",
  },
  {
    id: "special-traveling-with-infants",
    category: "special",
    categoryLabel: "Family, Pets & Special Care",
    question: "What are the rules for traveling with infants and young children?",
    answer:
      "Infants under 2 years can travel on an adult's lap for a nominal 10% infant fare. Every traveling family is entitled to bring one fully collapsible stroller/pram and one child car seat or booster seat completely free of charge, which can be gate-checked right at the aircraft door. Dedicated bassinet baby cots can be reserved in advance for bulkhead seats on international flights.",
    highlights: [
      "Free gate-check for strollers and baby car seats.",
      "Bulkhead baby bassinet reservation available on international flights.",
      "Complimentary priority family boarding before general boarding commences.",
    ],
    actionLabel: "Family Travel Guide",
    actionHref: "/app/help/topic/family-travel",
  },
  {
    id: "special-mobility-assistance",
    category: "special",
    categoryLabel: "Family, Pets & Special Care",
    question: "How do I arrange wheelchair or special airport mobility assistance?",
    answer:
      "Wheelchair assistance (from curb to gate, ramp, and onboard aisle chairs) is provided free of charge. Please request mobility assistance at least 48 hours before departure via 'Manage Booking' or our 24/7 Special Assistance hotline. Dedicated SkyWay care ambassadors will guide you through security, immigration, and boarding seamlessly.",
    highlights: [
      "100% complimentary wheelchair and escort service across all departure, transit, and arrival airports.",
      "Battery-powered personal mobility wheelchairs transported free of charge.",
      "Pre-boarding priority for travelers needing extra time to settle into their seats.",
    ],
    actionLabel: "Request Special Assistance",
    actionHref: "/app/help/topic/special-assistance",
  },
  {
    id: "special-pets-in-cabin",
    category: "special",
    categoryLabel: "Family, Pets & Special Care",
    question: "Can I bring a pet on SkyWay flights, and what are the requirements?",
    answer:
      "Small domestic dogs and cats weighing up to 8 kg (including an approved ventilated, leak-proof carrier) can travel in the cabin on select domestic and short-haul flights. The pet carrier must fit under the seat in front of you. Certified assistance and guide dogs travel free of charge in the cabin on all routes alongside their handlers with appropriate veterinary certificates.",
    highlights: [
      "In-cabin pets: Max 8 kg including carrier; must remain under seat in front.",
      "Certified service & guide dogs fly completely free of charge on all routes.",
      "Advance registration required at least 48 hours prior to departure due to cabin quota limits.",
    ],
  },
];

const CATEGORIES: { id: FaqCategory; label: string; icon: any }[] = [
  { id: "all", label: "All Questions", icon: HelpCircle },
  { id: "baggage", label: "Baggage & Packing", icon: Luggage },
  { id: "checkin", label: "Check-In & Boarding", icon: Clock },
  { id: "changes", label: "Changes & Refunds", icon: RefreshCcw },
  { id: "inflight", label: "In-Flight & Lounges", icon: Armchair },
  { id: "special", label: "Family, Pets & Care", icon: Users },
];

export function LandingFaqSection() {
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(
    new Set(["baggage-allowance", "checkin-times"])
  );
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, "yes" | "no">>({});

  const toggleItem = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setOpenIds(new Set(filteredFaqs.map((f) => f.id)));
  };

  const collapseAll = () => {
    setOpenIds(new Set());
  };

  const handleFeedback = (faqId: string, helpful: "yes" | "no") => {
    setFeedbackGiven((prev) => ({ ...prev, [faqId]: helpful }));
    toast.success(
      helpful === "yes"
        ? "Thank you! Glad we could help."
        : "Thank you for the feedback. We'll improve this answer."
    );
  };

  const filteredFaqs = useMemo(() => {
    let list = FAQ_DATA;
    if (selectedCategory !== "all") {
      list = list.filter((item) => item.category === selectedCategory);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q) ||
          item.categoryLabel.toLowerCase().includes(q) ||
          item.highlights?.some((h) => h.toLowerCase().includes(q))
      );
    }
    return list;
  }, [selectedCategory, searchQuery]);

  return (
    <section id="faq" className="relative overflow-hidden bg-sky-mist/60 py-24 dark:bg-background/40" suppressHydrationWarning>
      {/* Decorative navy & sky atmospheric background accents */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-sky-accent/5 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-sky-dark/5 blur-3xl dark:bg-sky-accent/10" />

      <div className="relative mx-auto max-w-5xl px-4 md:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-dark/10 bg-white/80 px-3.5 py-1 shadow-xs backdrop-blur dark:border-white/10 dark:bg-white/5">
            <Sparkles className="h-3.5 w-3.5 text-sky-accent" />
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-sky-dark dark:text-sky-accent">
              Traveler Help Desk
            </span>
          </div>
          <h2 className="mt-4 font-display text-4xl leading-[1.1] tracking-tight text-sky-dark dark:text-foreground md:text-5xl lg:text-6xl">
            Frequently Asked <em className="italic text-sky-gold font-normal">Questions</em>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Clear, instant answers regarding baggage, web check-in, ticket changes, in-flight amenities, and airport services.
          </p>
        </div>

        {/* Search & Controls Container */}
        <div className="mt-10 rounded-2xl border border-sky-dark/10 bg-white p-4 shadow-sm shadow-sky-dark/5 dark:border-border dark:bg-card md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Live Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions (e.g. baggage allowance, cancellation, Wi-Fi, infant)..."
                className="w-full rounded-xl border border-border bg-sky-mist/50 py-2.5 pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground transition focus:border-sky-accent focus:bg-background focus:outline-hidden focus:ring-2 focus:ring-sky-accent/20 dark:bg-muted/40"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Expand / Collapse All Controls */}
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                Showing {filteredFaqs.length} {filteredFaqs.length === 1 ? "question" : "questions"}
              </span>
              <div className="flex items-center gap-1.5 border-l border-border pl-3">
                <button
                  onClick={expandAll}
                  className="rounded-lg px-2.5 py-1 font-semibold text-sky-dark transition hover:bg-sky-accent/10 hover:text-sky-accent dark:text-foreground cursor-pointer"
                >
                  Expand all
                </button>
                <span className="text-border">·</span>
                <button
                  onClick={collapseAll}
                  className="rounded-lg px-2.5 py-1 font-semibold text-sky-dark transition hover:bg-sky-accent/10 hover:text-sky-accent dark:text-foreground cursor-pointer"
                >
                  Collapse all
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pt-2 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              const count =
                cat.id === "all"
                  ? FAQ_DATA.length
                  : FAQ_DATA.filter((f) => f.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    isSelected
                      ? "bg-sky-dark text-white shadow-sm ring-1 ring-sky-dark dark:bg-sky-accent dark:text-slate-950 dark:ring-sky-accent"
                      : "border border-border/80 bg-background text-muted-foreground hover:border-sky-accent/40 hover:bg-sky-mist hover:text-foreground dark:hover:bg-muted/60"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-sky-gold dark:text-slate-950" : "text-sky-accent"}`} />
                  <span>{cat.label}</span>
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isSelected
                        ? "bg-white/20 text-white dark:bg-black/20 dark:text-slate-950"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accordion FAQ List */}
        <div className="mt-6 space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = openIds.has(faq.id);
              const feedback = feedbackGiven[faq.id];

              return (
                <div
                  key={faq.id}
                  className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                    isOpen
                      ? "border-sky-accent/40 bg-white shadow-md shadow-sky-dark/5 ring-1 ring-sky-accent/20 dark:border-sky-accent/30 dark:bg-card"
                      : "border-sky-dark/8 bg-white/90 hover:border-sky-accent/30 hover:bg-white dark:border-border dark:bg-card/70 dark:hover:bg-card"
                  }`}
                >
                  {/* Accordion Header / Trigger */}
                  <button
                    onClick={() => toggleItem(faq.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-start justify-between gap-4 p-5 text-left transition cursor-pointer md:p-6"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-mist px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-dark dark:bg-muted dark:text-sky-accent">
                          {faq.categoryLabel}
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-semibold leading-snug text-sky-dark dark:text-foreground md:text-xl">
                        {faq.question}
                      </h3>
                    </div>

                    <div
                      className={`mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-transform duration-200 ${
                        isOpen
                          ? "rotate-180 border-sky-accent bg-sky-accent text-white dark:text-slate-950"
                          : "border-border bg-sky-mist/60 text-sky-dark dark:bg-muted dark:text-foreground"
                      }`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </button>

                  {/* Accordion Content */}
                  {isOpen && (
                    <div className="border-t border-border/70 px-5 pt-4 pb-6 md:px-6 animate-in fade-in-50 duration-200">
                      <p className="text-sm leading-relaxed text-foreground/85 md:text-base">
                        {faq.answer}
                      </p>

                      {faq.highlights && faq.highlights.length > 0 && (
                        <div className="mt-4 rounded-xl border border-sky-accent/15 bg-sky-mist/40 p-4 dark:border-sky-accent/20 dark:bg-muted/30">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-sky-dark dark:text-sky-accent flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-sky-accent" /> Key Details
                          </div>
                          <ul className="mt-2.5 space-y-2 text-xs text-foreground/80 md:text-sm">
                            {faq.highlights.map((point, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-accent" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Footer Actions & Helpful Feedback */}
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border/50 pt-4 text-xs">
                        {faq.actionLabel && faq.actionHref ? (
                          <Link
                            to={faq.actionHref}
                            className="inline-flex items-center gap-1.5 font-semibold text-sky-accent hover:underline"
                          >
                            <span>{faq.actionLabel}</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">SkyWay Official Traveler Guidance</span>
                        )}

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="text-[11px]">Was this helpful?</span>
                          <button
                            onClick={() => handleFeedback(faq.id, "yes")}
                            disabled={!!feedback}
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 transition cursor-pointer ${
                              feedback === "yes"
                                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 font-semibold"
                                : "border-border hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            <ThumbsUp className="h-3 w-3" />
                            <span>Yes</span>
                          </button>
                          <button
                            onClick={() => handleFeedback(faq.id, "no")}
                            disabled={!!feedback}
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 transition cursor-pointer ${
                              feedback === "no"
                                ? "border-rose-500/40 bg-rose-500/15 text-rose-600 font-semibold"
                                : "border-border hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            <ThumbsDown className="h-3 w-3" />
                            <span>No</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-white/60 p-10 text-center dark:bg-card/40">
              <Search className="mx-auto h-8 w-8 text-muted-foreground/60" />
              <h4 className="mt-3 font-display text-lg text-foreground">
                No matching questions found
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                We couldn't find any questions matching "{searchQuery}". Try different keywords or contact our 24/7 care team.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-dark px-4 py-2 text-xs font-semibold text-white hover:bg-sky-dark/90 transition cursor-pointer"
              >
                Reset Search & Filters
              </button>
            </div>
          )}
        </div>

        {/* ── Still Have Questions? Banner ── */}
        <div className="mt-12 overflow-hidden rounded-3xl border border-sky-dark/15 bg-sky-dark text-white p-6 shadow-xl md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-0.5 text-xs font-semibold text-sky-gold backdrop-blur">
                <MessageSquare className="h-3.5 w-3.5" /> 24/7 Dedicated Support
              </div>
              <h3 className="font-display text-2xl md:text-3xl text-white">
                Can't find what you're looking for?
              </h3>
              <p className="text-sm text-white/75 leading-relaxed">
                Our AI travel concierge and international support specialists are available around the clock to assist with custom booking changes, visa questions, and baggage tracking.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/app/help/chat"
                className="inline-flex items-center gap-2 rounded-full bg-sky-gold px-6 py-3 text-xs font-bold uppercase tracking-wider text-sky-dark transition hover:bg-white shadow-md active:scale-95 cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" /> Chat With AI Concierge
              </Link>
              <Link
                to="/app/help"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white/15 cursor-pointer"
              >
                Full Help Desk &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
