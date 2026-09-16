import React, { useState, useMemo } from "react";
import {
  Crown,
  Sparkles,
  ShieldCheck,
  Coffee,
  Wifi,
  Utensils,
  Wine,
  ShowerHead,
  Bed,
  MapPin,
  Clock,
  QrCode,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Info,
  Users,
  Compass,
  CreditCard,
  Download,
  Share2,
  Star,
  SlidersHorizontal,
  Armchair,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type FrequentFlyerTier = "Member" | "Silver" | "Gold" | "Platinum" | "VIP";
export type TicketClass = "Economy" | "Premium Economy" | "Business" | "First";
export type FlightType = "domestic" | "international";

export interface LoungeFacility {
  id: string;
  name: string;
  airportCode: string;
  airportCity: string;
  terminal: string;
  concourse: string;
  locationDetails: string;
  hours: string;
  rating: number;
  reviewCount: number;
  capacityLevel: "Quiet" | "Moderate" | "Busy";
  capacityPct: number;
  operator: string;
  amenities: { icon: string; name: string }[];
  highlights: string[];
  accessRules: string;
}

export interface LoungeEligibility {
  isEligible: boolean;
  statusType: "complimentary_first" | "complimentary_business" | "complimentary_tier" | "silver_discount" | "paid_pass_available";
  tierTitle: string;
  badgeText: string;
  badgeTone: "emerald" | "amber" | "purple" | "blue" | "slate";
  guestCount: number;
  guestPolicy: string;
  reasons: { label: string; passed: boolean; detail: string }[];
  primaryPerks: string[];
  priceINR?: number;
  milesCost?: number;
}

// Master Airport Lounge Database
export const AIRPORT_LOUNGES_DATABASE: Record<string, LoungeFacility[]> = {
  DEL: [
    {
      id: "del-sky-sig",
      name: "SkyWay Signature Lounge",
      airportCode: "DEL",
      airportCity: "New Delhi",
      terminal: "Terminal 3",
      concourse: "International Departures · Mezzanine Level (Near Gate 15)",
      locationDetails: "Take escalator after Security / Emigration to Level 3 Mezzanine.",
      hours: "Open 24 Hours · Daily",
      rating: 4.8,
      reviewCount: 1420,
      capacityLevel: "Quiet",
      capacityPct: 35,
      operator: "SkyWay Premium Services",
      amenities: [
        { icon: "Utensils", name: "Chef's Hot Buffet & Live Stations" },
        { icon: "Wine", name: "Full Premium Bar & Sommelier Wine" },
        { icon: "ShowerHead", name: "Luxury Rain Showers & Amenity Kits" },
        { icon: "Bed", name: "Private Nap Pods & Snooze Rooms" },
        { icon: "Wifi", name: "Gigabit Ultra-Fast Wi-Fi" },
        { icon: "Compass", name: "Tarmac Runway Panorama View" },
      ],
      highlights: [
        "Complimentary for First, Business, Gold & Platinum tiers",
        "A-la-carte dining for First Class & Platinum passengers",
        "Barista crafted espresso & signature mocktails",
      ],
      accessRules: "Complimentary for First Class, Business Class, Gold Elite, Platinum, Star Alliance Gold. Paid day passes subject to capacity.",
    },
    {
      id: "del-encalm-dom",
      name: "Encalm Privé Flagship Lounge",
      airportCode: "DEL",
      airportCity: "New Delhi",
      terminal: "Terminal 3 & Terminal 2",
      concourse: "Domestic Departures · Near Gate 32 (T3) & Security Hold (T2)",
      locationDetails: "Immediately past Domestic Security Checkpoint on Concourse B.",
      hours: "04:00 AM – 23:30 PM",
      rating: 4.6,
      reviewCount: 980,
      capacityLevel: "Moderate",
      capacityPct: 58,
      operator: "Encalm Hospitality & SkyWay Partner",
      amenities: [
        { icon: "Utensils", name: "North & South Indian Buffet" },
        { icon: "Coffee", name: "Specialty Tea & Coffee Bar" },
        { icon: "Wifi", name: "High-Speed Work Desks & USB-C Power" },
        { icon: "Armchair", name: "Soundproof Acoustic Calling Booths" },
      ],
      highlights: [
        "Express entry via SkyWay Digital Pass QR code",
        "Flight information display boards inside lounge",
      ],
      accessRules: "Complimentary for Business, Platinum & Gold tier members. Silver & Economy can purchase day pass.",
    },
  ],
  BOM: [
    {
      id: "bom-sky-pavilion",
      name: "SkyWay Royal Pavilion Lounge",
      airportCode: "BOM",
      airportCity: "Mumbai",
      terminal: "Terminal 2",
      concourse: "Level 4 · International Departures (Post Security)",
      locationDetails: "Elevator opposite Duty Free rotunda to Level 4.",
      hours: "Open 24 Hours · Daily",
      rating: 4.9,
      reviewCount: 1840,
      capacityLevel: "Quiet",
      capacityPct: 40,
      operator: "SkyWay Flagship",
      amenities: [
        { icon: "Utensils", name: "Michelin-Inspired Tasting Counter" },
        { icon: "Wine", name: "Cocktail Lounge with Mixologist" },
        { icon: "ShowerHead", name: "Forest Essentials Shower Suites" },
        { icon: "Bed", name: "Relaxation Sleep Cabins" },
        { icon: "Wifi", name: "High-Speed Encrypted Wi-Fi" },
      ],
      highlights: [
        "Exclusive VIP wing for First Class & Platinum Elite",
        "Express 15-minute tension relief shoulder massage",
      ],
      accessRules: "Complimentary for First, Business, Gold, Platinum.",
    },
    {
      id: "bom-adani-dom",
      name: "Adani Lounge BOM Domestic",
      airportCode: "BOM",
      airportCity: "Mumbai",
      terminal: "Terminal 2",
      concourse: "Domestic Departures · Near Gate 44",
      locationDetails: "Level 3 Domestic concourse next to Gate 44.",
      hours: "04:30 AM – 00:30 AM",
      rating: 4.5,
      reviewCount: 890,
      capacityLevel: "Moderate",
      capacityPct: 62,
      operator: "Adani Airports & SkyWay",
      amenities: [
        { icon: "Utensils", name: "Hot Meals & Salad Bar" },
        { icon: "Coffee", name: "Espresso & Beverages" },
        { icon: "Wifi", name: "High-speed Internet" },
      ],
      highlights: ["Boarding announcements broadcasted live"],
      accessRules: "Complimentary for Business, Gold, Platinum.",
    },
  ],
  DXB: [
    {
      id: "dxb-sky-concourse-b",
      name: "SkyWay & Partner Grand Lounge",
      airportCode: "DXB",
      airportCity: "Dubai",
      terminal: "Terminal 3",
      concourse: "Concourse B · Above Gate B18",
      locationDetails: "Central escalator to upper level above Gate B18.",
      hours: "Open 24 Hours · Daily",
      rating: 4.9,
      reviewCount: 2200,
      capacityLevel: "Quiet",
      capacityPct: 32,
      operator: "SkyWay International Network",
      amenities: [
        { icon: "Utensils", name: "International Gourmet Buffet" },
        { icon: "Wine", name: "Fine Spirits & Champagne Bar" },
        { icon: "ShowerHead", name: "Private Shower Cabanas" },
        { icon: "Bed", name: "Day Beds & Sleep Sanctuaries" },
        { icon: "Wifi", name: "High-speed 5G Wi-Fi" },
      ],
      highlights: ["Direct boarding access from lounge for select gates"],
      accessRules: "Complimentary for First, Business, Gold, Platinum.",
    },
  ],
  LHR: [
    {
      id: "lhr-sky-queens",
      name: "SkyWay London Club Lounge",
      airportCode: "LHR",
      airportCity: "London",
      terminal: "Terminal 2",
      concourse: "The Queen's Terminal · Satellite Concourse B",
      locationDetails: "Level 2 opposite Gate B36.",
      hours: "05:30 AM – 22:30 PM",
      rating: 4.8,
      reviewCount: 1650,
      capacityLevel: "Moderate",
      capacityPct: 50,
      operator: "SkyWay UK",
      amenities: [
        { icon: "Utensils", name: "Traditional British Afternoon Tea" },
        { icon: "Wine", name: "Gin Bar & English Sparkling Wine" },
        { icon: "ShowerHead", name: "Private Shower Suites" },
        { icon: "Wifi", name: "Business Hub with Printers" },
      ],
      highlights: ["Quiet Library zone for focused working"],
      accessRules: "Complimentary for First, Business, Gold, Platinum.",
    },
  ],
  SIN: [
    {
      id: "sin-sky-sanctuary",
      name: "SkyWay Changi Sanctuary Lounge",
      airportCode: "SIN",
      airportCity: "Singapore",
      terminal: "Terminal 3",
      concourse: "Level 3 Transit Area (Above Gate A)",
      locationDetails: "Take transit escalators opposite Central Butterfly Garden.",
      hours: "Open 24 Hours · Daily",
      rating: 5.0,
      reviewCount: 3100,
      capacityLevel: "Quiet",
      capacityPct: 28,
      operator: "SkyWay Global Lounge",
      amenities: [
        { icon: "Utensils", name: "Live Singapore Laksa & Noodle Bar" },
        { icon: "ShowerHead", name: "Rainforest Showers" },
        { icon: "Bed", name: "Private Sleeping Pods" },
        { icon: "Wine", name: "Tiger Beer on Tap & Singapore Slings" },
      ],
      highlights: ["Direct views of Changi indoor botanical green walls"],
      accessRules: "Complimentary for First, Business, Gold, Platinum.",
    },
  ],
  JFK: [
    {
      id: "jfk-sky-panorama",
      name: "SkyWay New York Flagship Lounge",
      airportCode: "JFK",
      airportCity: "New York",
      terminal: "Terminal 4",
      concourse: "Concourse A (Near Gate A4)",
      locationDetails: "Level 4 above Gate A4.",
      hours: "05:00 AM – 23:00 PM",
      rating: 4.7,
      reviewCount: 1280,
      capacityLevel: "Moderate",
      capacityPct: 55,
      operator: "SkyWay USA",
      amenities: [
        { icon: "Utensils", name: "Artisanal NYC Deli & Pastries" },
        { icon: "Wine", name: "Brooklyn Craft Beer & Wine Flight Bar" },
        { icon: "ShowerHead", name: "Shower Suites" },
        { icon: "Wifi", name: "Gigabit Work Pods" },
      ],
      highlights: ["Runway view of transatlantic departures"],
      accessRules: "Complimentary for First, Business, Gold, Platinum.",
    },
  ],
  BLR: [
    {
      id: "blr-080-garden",
      name: "080 Signature Garden Lounge",
      airportCode: "BLR",
      airportCity: "Bengaluru",
      terminal: "Terminal 2",
      concourse: "International & Domestic Wings (Level 3)",
      locationDetails: "Follow signs for 080 Lounge past central security atrium.",
      hours: "Open 24 Hours · Daily",
      rating: 4.8,
      reviewCount: 1100,
      capacityLevel: "Quiet",
      capacityPct: 30,
      operator: "080 & SkyWay Partner",
      amenities: [
        { icon: "Utensils", name: "Live Dosa Counter & Global Buffet" },
        { icon: "Coffee", name: "South Indian Filter Coffee Bar" },
        { icon: "Wine", name: "Craft Cocktail Bar" },
        { icon: "ShowerHead", name: "Luxury Showers" },
      ],
      highlights: ["Overlooks the lush T2 terminal indoor botanical flora"],
      accessRules: "Complimentary for First, Business, Gold, Platinum.",
    },
  ],
};

/**
 * Calculates accurate lounge eligibility based on ticket class, frequent flyer tier, and route.
 */
export function checkLoungeEligibility(
  tier: FrequentFlyerTier,
  ticketClass: TicketClass,
  isInternational: boolean = false,
  hasPaidPass: boolean = false
): LoungeEligibility {
  // Case 1: First Class Ticket
  if (ticketClass === "First") {
    return {
      isEligible: true,
      statusType: "complimentary_first",
      tierTitle: "First Class Flagship Access",
      badgeText: "First Class · Full Access (+2 Guests)",
      badgeTone: "purple",
      guestCount: 2,
      guestPolicy: "Complimentary for passenger + 2 traveling guests on same flight itinerary",
      reasons: [
        { label: "Ticket Class", passed: true, detail: "First Class Cabin includes Flagship Lounge & VIP Dining" },
        { label: "Guest Allowance", passed: true, detail: "2 Complimentary traveling guests" },
        { label: "VIP Services", passed: true, detail: "Complimentary A-la-Carte dining, private cabana & shower priority" },
      ],
      primaryPerks: ["Access to Flagship First Lounges", "Private Shower Suites & Nap Cabins", "A-la-carte chef menu & Champagne", "Dedicated VIP Lounge Escort"],
    };
  }

  // Case 2: Business Class Ticket
  if (ticketClass === "Business") {
    const isGoldOrPlatinum = tier === "Gold" || tier === "Platinum" || tier === "VIP";
    const guestCount = isGoldOrPlatinum ? 1 : 0;
    return {
      isEligible: true,
      statusType: "complimentary_business",
      tierTitle: "Business Class Lounge Access",
      badgeText: `Business Class · Complimentary ${guestCount > 0 ? "(+1 Guest)" : "(Solo)"}`,
      badgeTone: "emerald",
      guestCount: guestCount,
      guestPolicy: guestCount > 0
        ? "1 Complimentary traveling guest included with your Elite Tier"
        : "Complimentary for ticketed passenger (additional guests can be added for ₹1,200 / 3,500 miles)",
      reasons: [
        { label: "Ticket Class", passed: true, detail: "Business Class Cabin qualifies for all SkyWay & Partner Business Lounges" },
        { label: "Frequent Flyer Tier", passed: true, detail: `${tier} Tier status recognized` },
        { label: "Departure & Transits", passed: true, detail: "Valid at origin airport and connecting international transfer hubs" },
      ],
      primaryPerks: ["Complimentary Hot Buffet & Bar", "Luxury Shower Suites", "Ultra-fast Wi-Fi & Workspaces", "Priority boarding direct from lounge"],
    };
  }

  // Case 3: Platinum Frequent Flyer Tier (Traveling in Economy or Premium Economy)
  if (tier === "Platinum" || tier === "VIP") {
    return {
      isEligible: true,
      statusType: "complimentary_tier",
      tierTitle: "Platinum Elite Privilege Access",
      badgeText: "Platinum Elite · Full Access (+2 Guests)",
      badgeTone: "purple",
      guestCount: 2,
      guestPolicy: "Member + 2 complimentary traveling guests regardless of cabin class",
      reasons: [
        { label: "Frequent Flyer Tier", passed: true, detail: "Platinum Tier unlocks First & Business Class lounges worldwide" },
        { label: "Ticket Class", passed: true, detail: `Traveling in ${ticketClass} with all-lounge access privileges` },
        { label: "Guest Benefit", passed: true, detail: "2 traveling companions enter free" },
      ],
      primaryPerks: ["First & Business Class Lounge Access", "2 Complimentary Guests", "Express Shower & Spa access", "Complimentary bar & buffet"],
    };
  }

  // Case 4: Gold Frequent Flyer Tier (Traveling in Economy or Premium Economy)
  if (tier === "Gold") {
    return {
      isEligible: true,
      statusType: "complimentary_tier",
      tierTitle: "Gold Elite Lounge Privilege",
      badgeText: "Gold Elite · Complimentary (+1 Guest)",
      badgeTone: "amber",
      guestCount: 1,
      guestPolicy: "Member + 1 complimentary traveling companion on same day SkyWay/Partner flight",
      reasons: [
        { label: "Frequent Flyer Tier", passed: true, detail: "SkyWay Gold Elite unlocks complimentary Business Lounge access" },
        { label: "Ticket Class", passed: true, detail: `Traveling in ${ticketClass} with Gold lounge privileges` },
        { label: "Guest Benefit", passed: true, detail: "1 free traveling guest included" },
      ],
      primaryPerks: ["Business Class Lounge Access", "1 Free Traveling Guest", "Buffet & Premium Beverages", "High-speed Wi-Fi & quiet areas"],
    };
  }

  // Case 5: Has Paid / Voucher Pass
  if (hasPaidPass) {
    return {
      isEligible: true,
      statusType: "paid_pass_available",
      tierTitle: "SkyLounge Single-Visit Day Pass",
      badgeText: "Day Pass Activated · Solo Entry",
      badgeTone: "blue",
      guestCount: 0,
      guestPolicy: "Valid for 1 passenger for up to 3 hours prior to departure",
      reasons: [
        { label: "Purchased Day Pass", passed: true, detail: "Lounge voucher confirmed and credited to digital wallet" },
        { label: "Flight Verification", passed: true, detail: "Pass linked to boarding pass & PNR" },
      ],
      primaryPerks: ["3 Hours Lounge Access", "Full Hot Buffet & Non-Alcoholic Drinks", "Workstation & Charging Pods"],
    };
  }

  // Case 6: Silver Frequent Flyer Tier (Discount or Voucher Eligible)
  if (tier === "Silver") {
    return {
      isEligible: false,
      statusType: "silver_discount",
      tierTitle: "Silver Member 50% Lounge Privilege",
      badgeText: "Silver Tier · 50% Off Day Pass",
      badgeTone: "blue",
      guestCount: 0,
      guestPolicy: "Silver members get 50% discount on day passes (₹600 or 1,750 miles)",
      reasons: [
        { label: "Frequent Flyer Tier", passed: false, detail: "Silver Tier requires 50% co-pay or annual voucher redemption" },
        { label: "Cabin Class", passed: false, detail: `${ticketClass} does not include default complimentary lounge` },
        { label: "Silver Perk", passed: true, detail: "Eligible for 50% off standard pass (₹600 / 1,750 miles)" },
      ],
      primaryPerks: ["50% Discount on Single-Visit Pass", "Priority access during busy peak hours", "Redeemable using frequent flyer miles"],
      priceINR: 600,
      milesCost: 1750,
    };
  }

  // Case 7: Classic Member / Economy (Purchase required)
  return {
    isEligible: false,
    statusType: "paid_pass_available",
    tierTitle: "Day Pass Available for Purchase",
    badgeText: "Pass Required · Add for ₹1,200",
    badgeTone: "slate",
    guestCount: 0,
    guestPolicy: "Entry available with Single-Visit Day Pass (₹1,200 / $35 or 3,500 miles)",
    reasons: [
      { label: "Cabin Class", passed: false, detail: `${ticketClass} cabin does not include complimentary lounge access` },
      { label: "Loyalty Tier", passed: false, detail: `${tier} tier does not have automatic lounge privileges (upgrade to Gold for free entry)` },
      { label: "Add-On Option", passed: true, detail: "Instant digital pass available for purchase with cash or miles" },
    ],
    primaryPerks: ["Instant access at departure airport", "Full buffet & refreshments", "Comfortable seating away from crowded gates"],
    priceINR: 1200,
    milesCost: 3500,
  };
}

export interface LoungeAccessIndicatorProps {
  tier?: FrequentFlyerTier;
  ticketClass?: TicketClass;
  flightNumber?: string;
  pnr?: string;
  passengerName?: string;
  departureAirport?: string;
  destinationAirport?: string;
  isInternational?: boolean;
  compact?: boolean;
  showSimulator?: boolean;
  onOpenBookingExtras?: () => void;
  className?: string;
}

/**
 * LoungeAccessIndicator
 * Rich component that checks the passenger's tier and ticket class to show their eligibility for airport lounge entry.
 */
export function LoungeAccessIndicator({
  tier: initialTier = "Gold",
  ticketClass: initialTicketClass = "Economy",
  flightNumber = "SW-204",
  pnr = "SW8X4K",
  passengerName = "Arjun Mehta",
  departureAirport = "DEL",
  destinationAirport = "BOM",
  isInternational = false,
  compact = false,
  showSimulator = false,
  onOpenBookingExtras,
  className,
}: LoungeAccessIndicatorProps) {
  // Simulator State
  const [selectedTier, setSelectedTier] = useState<FrequentFlyerTier>(initialTier);
  const [selectedClass, setSelectedClass] = useState<TicketClass>(initialTicketClass);
  const [hasPurchasedPass, setHasPurchasedPass] = useState(false);
  const [activeAirport, setActiveAirport] = useState<string>(departureAirport.toUpperCase());
  
  // UI Dialog States
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [selectedLounge, setSelectedLounge] = useState<LoungeFacility | null>(null);

  // Compute Eligibility
  const eligibility = useMemo(() => {
    return checkLoungeEligibility(selectedTier, selectedClass, isInternational, hasPurchasedPass);
  }, [selectedTier, selectedClass, isInternational, hasPurchasedPass]);

  // Available lounges at active airport
  const availableLounges = useMemo(() => {
    const list = AIRPORT_LOUNGES_DATABASE[activeAirport] || AIRPORT_LOUNGES_DATABASE["DEL"];
    return list;
  }, [activeAirport]);

  // Handle Instant Buy / Redeem
  const handleBuyPass = (method: "cash" | "miles") => {
    setHasPurchasedPass(true);
    setBuyModalOpen(false);
    if (method === "miles") {
      toast.success(`Redeemed ${eligibility.milesCost || 3500} miles! Lounge Day Pass credited to PNR ${pnr}.`);
    } else {
      toast.success(`Purchased Lounge Pass (₹${eligibility.priceINR || 1200})! Confirmed for ${flightNumber}.`);
    }
  };

  // Helper for tone badge classes
  const getBadgeClasses = (tone: LoungeEligibility["badgeTone"]) => {
    switch (tone) {
      case "emerald":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "purple":
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30";
      case "amber":
        return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
      case "blue":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "slate":
      default:
        return "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30";
    }
  };

  // 1. Compact View (Used for flight card headers, inline summaries, or quick badges)
  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition-all",
          eligibility.isEligible
            ? "border-emerald-500/30 bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
            : "border-amber-500/30 bg-amber-50/80 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
          className
        )}
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/80 dark:bg-slate-900 shadow-xs">
          {eligibility.isEligible ? (
            <Crown className="h-3 w-3 text-amber-500" />
          ) : (
            <Coffee className="h-3 w-3 text-amber-600" />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold">Lounge:</span>
          <span>{eligibility.badgeText}</span>
        </div>
        <button
          type="button"
          onClick={() => setPassModalOpen(true)}
          className="ml-1 font-bold text-sky-600 hover:underline dark:text-sky-400"
        >
          {eligibility.isEligible ? "View Pass" : "Get Access"} &rarr;
        </button>
      </div>
    );
  }

  // 2. Full Standard / Interactive View
  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm text-card-foreground transition-all space-y-6",
        className
      )}
    >
      {/* Header with Title and Quick Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl shadow-md",
              eligibility.isEligible
                ? "bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold"
                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            {eligibility.statusType === "complimentary_first" || eligibility.statusType === "complimentary_tier" ? (
              <Crown className="h-6 w-6 fill-current" />
            ) : (
              <Armchair className="h-6 w-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                Airport Lounge Access Eligibility
              </h3>
              <Badge
                variant="outline"
                className={cn("text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border", getBadgeClasses(eligibility.badgeTone))}
              >
                {eligibility.isEligible ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Eligible
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Add-On Required
                  </span>
                )}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Evaluated for <strong>{passengerName}</strong> ({selectedTier} Tier) &bull; {selectedClass} Cabin on {flightNumber} ({departureAirport} &rarr; {destinationAirport})
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {eligibility.isEligible ? (
            <Button
              onClick={() => setPassModalOpen(true)}
              className="rounded-xl bg-amber-500 font-bold text-slate-950 hover:bg-amber-400 shadow-sm"
              size="sm"
            >
              <QrCode className="mr-1.5 h-4 w-4" />
              Digital Lounge Pass
            </Button>
          ) : (
            <Button
              onClick={() => setBuyModalOpen(true)}
              className="rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700 shadow-sm"
              size="sm"
            >
              <CreditCard className="mr-1.5 h-4 w-4" />
              Unlock Access {eligibility.priceINR ? `(₹${eligibility.priceINR})` : ""}
            </Button>
          )}
        </div>
      </div>

      {/* Main Status Hero Card */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border p-5 transition-all",
          eligibility.isEligible
            ? "border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-transparent dark:from-emerald-950/40 dark:via-amber-950/20"
            : "border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-500/5 to-transparent dark:from-amber-950/40 dark:via-slate-900/40"
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-8 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Access Level:
              </span>
              <span className="text-sm font-black text-foreground">
                {eligibility.tierTitle}
              </span>
            </div>

            <p className="text-xs text-foreground/80 leading-relaxed">
              {eligibility.isEligible ? (
                <>
                  You have complimentary access to SkyWay and Star Alliance partner lounges at{" "}
                  <strong>{departureAirport}</strong>. {eligibility.guestPolicy}.
                </>
              ) : (
                <>
                  Your current {selectedClass} ticket / {selectedTier} status does not include automatic free lounge access.{" "}
                  {eligibility.guestPolicy}.
                </>
              )}
            </p>

            {/* Criteria Checkpoints */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              {eligibility.reasons.map((r, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-xl bg-background/80 p-2.5 text-[11px] border border-border backdrop-blur-xs"
                >
                  {r.passed ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold text-foreground block">{r.label}</span>
                    <span className="text-muted-foreground leading-tight text-[10px] block mt-0.5">
                      {r.detail}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Highlights & Guest Policy */}
          <div className="md:col-span-4 rounded-xl border border-border bg-background/90 p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-sky-500" />
                Guest Allowance:
              </span>
              <span className="font-mono text-xs font-extrabold text-foreground">
                {eligibility.guestCount > 0
                  ? `+${eligibility.guestCount} Guest${eligibility.guestCount > 1 ? "s" : ""} Free`
                  : "Solo Entry"}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-muted-foreground block mb-1">
                Included Lounge Amenities:
              </span>
              <ul className="text-[11px] space-y-1 text-foreground/80">
                {eligibility.primaryPerks.slice(0, 3).map((perk, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>

            {eligibility.isEligible ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPassModalOpen(true)}
                className="w-full text-xs font-bold rounded-xl border-amber-400/50 bg-amber-50/50 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
              >
                <QrCode className="mr-1.5 h-3.5 w-3.5" />
                Show Scannable Pass
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleBuyPass("cash")}
                  className="flex-1 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                >
                  Pay ₹{eligibility.priceINR || 1200}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBuyPass("miles")}
                  className="flex-1 text-xs font-bold rounded-xl border-amber-300 bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300"
                >
                  {eligibility.milesCost || 3500} pts
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Available Lounges at the Airport */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-500" />
              Available Lounges at {activeAirport} ({availableLounges[0]?.airportCity || activeAirport})
            </h4>
            <p className="text-xs text-muted-foreground">
              Direct access with your boarding pass or digital lounge QR
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-muted-foreground">Airport:</span>
            {["DEL", "BOM", "DXB", "LHR", "SIN"].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setActiveAirport(code)}
                className={cn(
                  "rounded-lg px-2 py-1 font-mono font-bold transition-all text-[11px]",
                  activeAirport === code
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableLounges.map((lounge) => (
            <div
              key={lounge.id}
              className="rounded-2xl border border-border bg-card p-4 hover:border-sky-500/40 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="text-sm font-extrabold text-foreground">{lounge.name}</h5>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {lounge.terminal} &bull; {lounge.concourse}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        lounge.capacityLevel === "Quiet"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : lounge.capacityLevel === "Moderate"
                          ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {lounge.capacityPct}% full &bull; {lounge.capacityLevel}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 mt-1">
                      <Star className="h-3 w-3 fill-current" />
                      <span>{lounge.rating}</span>
                      <span className="text-muted-foreground text-[10px]">({lounge.reviewCount})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {lounge.hours}
                  </span>
                </div>

                {/* Amenity Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {lounge.amenities.map((amenity, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-lg bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                    >
                      {amenity.icon === "Utensils" && <Utensils className="h-2.5 w-2.5 text-amber-500" />}
                      {amenity.icon === "Wine" && <Wine className="h-2.5 w-2.5 text-purple-500" />}
                      {amenity.icon === "ShowerHead" && <ShowerHead className="h-2.5 w-2.5 text-blue-500" />}
                      {amenity.icon === "Bed" && <Bed className="h-2.5 w-2.5 text-indigo-500" />}
                      {amenity.icon === "Wifi" && <Wifi className="h-2.5 w-2.5 text-emerald-500" />}
                      {amenity.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {lounge.operator}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedLounge(lounge);
                    setPassModalOpen(true);
                  }}
                  className="h-7 text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400"
                >
                  View Details & Directions &rarr;
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier & Ticket Class Interactive Simulator (Toggle / preview different rules) */}
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-sky-500" />
            <span className="text-xs font-bold text-foreground">
              Tier & Cabin Eligibility Simulator
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Test how different loyalty tiers & fare classes affect lounge access
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1.5">
              Frequent Flyer Tier:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(["Member", "Silver", "Gold", "Platinum"] as FrequentFlyerTier[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTier(t)}
                  className={cn(
                    "rounded-xl px-3 py-1 text-xs font-bold transition-all border",
                    selectedTier === t
                      ? "border-amber-400 bg-amber-500 text-slate-950 shadow-xs"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t === "Platinum" ? "👑 " : t === "Gold" ? "⭐ " : t === "Silver" ? "🥈 " : ""}
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1.5">
              Ticket Cabin Class:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(["Economy", "Premium Economy", "Business", "First"] as TicketClass[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedClass(c)}
                  className={cn(
                    "rounded-xl px-3 py-1 text-xs font-bold transition-all border",
                    selectedClass === c
                      ? "border-sky-400 bg-sky-600 text-white shadow-xs"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Digital Lounge Pass Modal Dialog */}
      {passModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl text-card-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-extrabold">SkyWay Digital Lounge Pass</h3>
              </div>
              <button
                type="button"
                onClick={() => setPassModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Pass Card */}
              <div className="rounded-2xl border border-amber-300/60 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-5 text-white shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">
                      Official Lounge Entry Pass
                    </span>
                    <h4 className="text-sm font-black">{passengerName}</h4>
                  </div>
                  <Badge className="bg-amber-500 font-black text-slate-950 border-0">
                    {selectedTier} Tier
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px]">Flight / PNR</span>
                    <p className="font-mono font-bold text-white">{flightNumber} &bull; {pnr}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Cabin Class</span>
                    <p className="font-bold text-white">{selectedClass}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Airport & Terminal</span>
                    <p className="font-bold text-white">{activeAirport} &bull; Terminal 3</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Guest Privilege</span>
                    <p className="font-bold text-amber-300">
                      {eligibility.guestCount > 0 ? `+${eligibility.guestCount} Guest Included` : "Solo Entry"}
                    </p>
                  </div>
                </div>

                {/* QR Code Graphic */}
                <div className="flex flex-col items-center justify-center rounded-xl bg-white p-4 text-slate-950">
                  {/* Generated clean SVG QR pattern */}
                  <div className="h-32 w-32 border-4 border-slate-950 p-2 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="h-7 w-7 bg-slate-950 p-1 flex items-center justify-center">
                        <div className="h-3 w-3 bg-white" />
                      </div>
                      <div className="h-7 w-7 bg-slate-950 p-1 flex items-center justify-center">
                        <div className="h-3 w-3 bg-white" />
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1 font-mono text-[9px] font-black tracking-widest">
                      <span>SKYWAY</span>
                      <span>LOUNGE</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="h-7 w-7 bg-slate-950 p-1 flex items-center justify-center">
                        <div className="h-3 w-3 bg-white" />
                      </div>
                      <div className="grid grid-cols-3 gap-0.5 h-6 w-6">
                        <div className="bg-slate-950" />
                        <div className="bg-slate-950" />
                        <div className="bg-white" />
                        <div className="bg-white" />
                        <div className="bg-slate-950" />
                        <div className="bg-slate-950" />
                      </div>
                    </div>
                  </div>

                  <span className="font-mono text-[11px] font-extrabold tracking-wider mt-2">
                    LNG-{activeAirport}-{pnr}-VALID
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Scan at lounge reception turnstiles or front desk
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    toast.success("Pass added to Apple Wallet / Google Pay format.");
                  }}
                  className="flex-1 text-xs font-semibold rounded-xl"
                >
                  <Share2 className="mr-1.5 h-3.5 w-3.5" />
                  Save to Wallet
                </Button>
                <Button
                  onClick={() => {
                    toast.success("Downloaded digital pass PDF.");
                    setPassModalOpen(false);
                  }}
                  className="flex-1 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buy / Redeem Pass Modal */}
      {buyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl text-card-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-extrabold">Unlock Airport Lounge Access</h3>
              <button
                type="button"
                onClick={() => setBuyModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <p className="text-muted-foreground">
                Enjoy hot gourmet buffets, barista coffee, quiet nap pods, and luxury showers before your flight from{" "}
                <strong>{activeAirport}</strong>.
              </p>

              <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Single-Visit SkyLounge Pass (3 Hours)</span>
                  <Badge variant="outline" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono">
                    {activeAirport} Hub
                  </Badge>
                </div>
                <ul className="text-[11px] space-y-1 text-muted-foreground">
                  <li>&bull; Valid 3 hours prior to scheduled departure</li>
                  <li>&bull; Full buffet, high-speed Wi-Fi, and workstations</li>
                  <li>&bull; 100% refundable up to 2 hours before flight</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleBuyPass("cash")}
                  className="flex flex-col items-center justify-center rounded-2xl border border-blue-500/40 bg-blue-50/50 p-4 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-900 dark:text-blue-200 transition-all"
                >
                  <CreditCard className="h-5 w-5 mb-1 text-blue-600 dark:text-blue-400" />
                  <span className="font-extrabold text-sm">Pay ₹{eligibility.priceINR || 1200}</span>
                  <span className="text-[10px] text-muted-foreground">Debit / Credit / UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBuyPass("miles")}
                  className="flex flex-col items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-50/50 p-4 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 transition-all"
                >
                  <Sparkles className="h-5 w-5 mb-1 text-amber-600 dark:text-amber-400" />
                  <span className="font-extrabold text-sm">{eligibility.milesCost || 3500} Miles</span>
                  <span className="text-[10px] text-muted-foreground">Deduct from 42,580 pts</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact Badge Component for inline display in tables, headers, and cards.
 */
export function LoungeAccessBadge({
  tier,
  ticketClass,
  isInternational = false,
  className,
}: {
  tier: FrequentFlyerTier;
  ticketClass: TicketClass;
  isInternational?: boolean;
  className?: string;
}) {
  const eligibility = checkLoungeEligibility(tier, ticketClass, isInternational);

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 font-bold text-[11px] px-2.5 py-0.5 rounded-full border",
        eligibility.isEligible
          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
          : "bg-muted text-muted-foreground border-border",
        className
      )}
    >
      {eligibility.isEligible ? (
        <Crown className="h-3 w-3 text-amber-500 fill-amber-500" />
      ) : (
        <Coffee className="h-3 w-3 text-muted-foreground" />
      )}
      <span>{eligibility.badgeText}</span>
    </Badge>
  );
}

export default LoungeAccessIndicator;
