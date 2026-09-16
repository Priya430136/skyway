import React, { useState, useId, useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  Award,
  Luggage,
  Plane,
  PlaneTakeoff,
  PlaneLanding,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  CreditCard,
  ShieldCheck,
  QrCode,
  Download,
  Share2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Plus,
  Star,
  Receipt,
  FileText,
  Search,
  ExternalLink,
  ChevronDown,
  Gift,
  HelpCircle,
  User,
  ArrowRight,
  Flame,
  MessageSquareHeart,
  Navigation,
  Compass,
  Globe,
  Radio,
  Bell,
  Crown,
  Armchair,
  CloudSun,
  Utensils,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DestinationTravelTipsCard } from "./DestinationTravelTipsCard";
import { DestinationWeatherCard } from "./DestinationWeatherCard";
import { InFlightDiningPreview, type CabinClassType } from "./InFlightDiningPreview";
import { AddToCalendarButton } from "./AddToCalendarButton";
import { downloadAllIcsFiles } from "@/lib/calendar-utils";
import { PostFlightFeedbackView } from "./PostFlightFeedbackView";
import { FlightFeedbackModal, type FeedbackFlightTarget } from "./FlightFeedbackModal";
import { FlightRouteMap, type FlightRouteItem } from "./FlightRouteMap";
import { RealtimeFlightStatusWidget } from "./RealtimeFlightStatusWidget";
import { DashboardNotificationCenter } from "./DashboardNotificationCenter";
import { useFlightAlerts } from "@/lib/flight-alert-store";
import { LoungeAccessIndicator, LoungeAccessBadge } from "./passenger/LoungeAccessIndicator";

export interface FrequentFlyerAccount {
  membershipNumber: string;
  tier: "Silver" | "Gold" | "Platinum" | "Diamond";
  tierLabel: string;
  currentMiles: number;
  lifetimeMiles: number;
  tierPointsEarned: number;
  tierPointsRequiredNext: number;
  nextTier: string;
  tierExpiryDate: string;
  statusSegments: number;
  statusSegmentsRequiredNext: number;
  benefits: { icon: string; title: string; desc: string }[];
}

export interface UpcomingTrip {
  pnr: string;
  flightNumber: string;
  aircraft: string;
  originCode: string;
  originCity: string;
  originTerminal: string;
  destinationCode: string;
  destinationCity: string;
  destinationTerminal: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  duration: string;
  seat: string;
  seatSelected: boolean;
  cabinClass: "Economy" | "Premium Economy" | "Business" | "First";
  meal: string;
  baggageAllowance: string;
  status: "Confirmed" | "Check-in Open" | "Delayed" | "Boarding";
  delayNotice?: string;
  checkInAvailable: boolean;
  boardingPassReady: boolean;
  countdownText: string;
  estimatedMilesEarn: number;
}

export interface PastFlightHistory {
  id: string;
  pnr: string;
  flightNumber: string;
  aircraft: string;
  originCode: string;
  originCity: string;
  destinationCode: string;
  destinationCity: string;
  flightDate: string;
  departureTime: string;
  arrivalTime: string;
  seat: string;
  cabinClass: string;
  milesEarned: number;
  statusPointsEarned: number;
  bookingRefDate: string;
  totalFareINR: number;
  ratedScore?: number;
}

export interface UserDashboardProps {
  className?: string;
}

const DEFAULT_LOYALTY: FrequentFlyerAccount = {
  membershipNumber: "SW-8829-4109-GLD",
  tier: "Gold",
  tierLabel: "SkyWay Gold Elite",
  currentMiles: 42580,
  lifetimeMiles: 89420,
  tierPointsEarned: 42580,
  tierPointsRequiredNext: 75000,
  nextTier: "Platinum",
  tierExpiryDate: "31 Dec 2026",
  statusSegments: 28,
  statusSegmentsRequiredNext: 40,
  benefits: [
    { icon: "✨", title: "50% Bonus Miles", desc: "Earn 1.5x frequent flyer miles on all flights" },
    { icon: "🛋️", title: "Star & Sky Lounge", desc: "Complimentary access for member + 1 guest" },
    { icon: "🧳", title: "+23kg Baggage Allowance", desc: "Free extra checked bag across all routes" },
    { icon: "⚡", title: "Priority Check-in & Boarding", desc: "Dedicated lane and Zone 1 boarding" },
  ],
};

const SAMPLE_UPCOMING_TRIPS: UpcomingTrip[] = [
  {
    pnr: "SW8X4K",
    flightNumber: "SW-204",
    aircraft: "Airbus A321neo",
    originCode: "DEL",
    originCity: "New Delhi",
    originTerminal: "T2 · Gate 14",
    destinationCode: "BOM",
    destinationCity: "Mumbai",
    destinationTerminal: "T1",
    departureDate: "15 Jun 2026",
    departureTime: "06:00 AM",
    arrivalDate: "15 Jun 2026",
    arrivalTime: "08:10 AM",
    duration: "2h 10m",
    seat: "14A",
    seatSelected: true,
    cabinClass: "Economy",
    meal: "Vegetarian Meal (VGML)",
    baggageAllowance: "1 × 23 kg + 7 kg Cabin",
    status: "Delayed",
    delayNotice: "ATC hold at DEL — New estimated departure 07:25 AM",
    checkInAvailable: true,
    boardingPassReady: true,
    countdownText: "Departs in 3 days",
    estimatedMilesEarn: 1140,
  },
  {
    pnr: "SW9M2P",
    flightNumber: "SW-811",
    aircraft: "Boeing 787-9 Dreamliner",
    originCode: "BOM",
    originCity: "Mumbai",
    originTerminal: "T2 · Gate 42",
    destinationCode: "DXB",
    destinationCity: "Dubai",
    destinationTerminal: "T3",
    departureDate: "28 Jun 2026",
    departureTime: "22:15 PM",
    arrivalDate: "29 Jun 2026",
    arrivalTime: "00:40 AM",
    duration: "3h 25m",
    seat: "Select Seat",
    seatSelected: false,
    cabinClass: "Business",
    meal: "Chef's Selection (Gourmet)",
    baggageAllowance: "2 × 32 kg + 10 kg Cabin",
    status: "Confirmed",
    checkInAvailable: true,
    boardingPassReady: false,
    countdownText: "Departs in 16 days",
    estimatedMilesEarn: 3820,
  },
];

const SAMPLE_PAST_FLIGHTS: PastFlightHistory[] = [
  {
    id: "fl-hist-1",
    pnr: "SW6T1Q",
    flightNumber: "SW-501",
    aircraft: "Boeing 787-9",
    originCode: "BLR",
    originCity: "Bengaluru",
    destinationCode: "DEL",
    destinationCity: "New Delhi",
    flightDate: "12 May 2026",
    departureTime: "09:20 AM",
    arrivalTime: "12:05 PM",
    seat: "8F (Window)",
    cabinClass: "Premium Economy",
    milesEarned: 2840,
    statusPointsEarned: 2840,
    bookingRefDate: "28 Apr 2026",
    totalFareINR: 9450,
    ratedScore: 5,
  },
  {
    id: "fl-hist-2",
    pnr: "SW3H7L",
    flightNumber: "SW-118",
    aircraft: "Airbus A320neo",
    originCode: "DEL",
    originCity: "New Delhi",
    destinationCode: "GOI",
    destinationCity: "Goa (Dabolim)",
    flightDate: "02 Apr 2026",
    departureTime: "07:00 AM",
    arrivalTime: "09:35 AM",
    seat: "22C (Aisle)",
    cabinClass: "Economy",
    milesEarned: 1650,
    statusPointsEarned: 1650,
    bookingRefDate: "18 Mar 2026",
    totalFareINR: 6200,
    ratedScore: 4,
  },
  {
    id: "fl-hist-3",
    pnr: "SW904X",
    flightNumber: "SW-904",
    aircraft: "Airbus A350-900",
    originCode: "BOM",
    originCity: "Mumbai",
    destinationCode: "SIN",
    destinationCity: "Singapore",
    flightDate: "14 Feb 2026",
    departureTime: "23:55 PM",
    arrivalTime: "07:45 AM",
    seat: "3A (Flat Bed)",
    cabinClass: "Business",
    milesEarned: 4950,
    statusPointsEarned: 4950,
    bookingRefDate: "05 Jan 2026",
    totalFareINR: 42800,
    ratedScore: 5,
  },
  {
    id: "fl-hist-4",
    pnr: "SW720D",
    flightNumber: "SW-720",
    aircraft: "Airbus A321neo",
    originCode: "DEL",
    originCity: "New Delhi",
    destinationCode: "HYD",
    destinationCity: "Hyderabad",
    flightDate: "20 Dec 2025",
    departureTime: "18:30 PM",
    arrivalTime: "20:45 PM",
    seat: "12D (Aisle)",
    cabinClass: "Economy",
    milesEarned: 1420,
    statusPointsEarned: 1420,
    bookingRefDate: "02 Dec 2025",
    totalFareINR: 5800,
    ratedScore: 5,
  },
];

export function UserDashboard({ className }: UserDashboardProps) {
  const compId = useId();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { alerts, unreadCount, urgentCount, showToastForAlert } = useFlightAlerts();

  // State
  const [activeTab, setActiveTab] = useState<
    "overview" | "notifications" | "tracker" | "upcoming" | "routes" | "travel-tips" | "history" | "loyalty" | "feedback" | "lounge" | "weather" | "dining"
  >("overview");
  const [selectedMapFlightId, setSelectedMapFlightId] = useState<string | undefined>(undefined);
  const [tipsFlightCode, setTipsFlightCode] = useState<string>("BOM");
  const [tipsFlightCity, setTipsFlightCity] = useState<string>("Mumbai");
  const [selectedDiningRoute, setSelectedDiningRoute] = useState<string>("DEL-BOM");
  const [selectedDiningCabin, setSelectedDiningCabin] = useState<CabinClassType>("business");
  const [selectedDiningPnr, setSelectedDiningPnr] = useState<string>("SW8X4K");
  const [historySearch, setHistorySearch] = useState("");
  const [historyYear, setHistoryYear] = useState<string>("all");
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimPnr, setClaimPnr] = useState("");
  const [claimFlightNo, setClaimFlightNo] = useState("");
  const [addBookingPnr, setAddBookingPnr] = useState("");
  const [isAddingBooking, setIsAddingBooking] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PastFlightHistory | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedFeedbackFlight, setSelectedFeedbackFlight] = useState<FeedbackFlightTarget | null>(null);
  const [selectedLoungeTrip, setSelectedLoungeTrip] = useState<UpcomingTrip | null>(null);

  // Dynamic user data derivation
  const userName = user?.name || "Arjun Reddy";
  const userEmail = user?.email || "arjun.reddy@skyway.example";

  // Route map items
  const upcomingRouteItems: FlightRouteItem[] = useMemo(() => {
    return SAMPLE_UPCOMING_TRIPS.map((trip) => ({
      id: `upcoming-${trip.pnr}`,
      pnr: trip.pnr,
      flightNumber: trip.flightNumber,
      aircraft: trip.aircraft,
      originCode: trip.originCode,
      originCity: trip.originCity,
      destinationCode: trip.destinationCode,
      destinationCity: trip.destinationCity,
      departureDate: trip.departureDate,
      departureTime: trip.departureTime,
      arrivalDate: trip.arrivalDate,
      arrivalTime: trip.arrivalTime,
      duration: trip.duration,
      seat: trip.seat,
      cabinClass: trip.cabinClass,
      status: trip.status,
      isUpcoming: true,
      milesEarn: trip.estimatedMilesEarn,
    }));
  }, []);

  const pastRouteItems: FlightRouteItem[] = useMemo(() => {
    return SAMPLE_PAST_FLIGHTS.map((flight) => ({
      id: `past-${flight.id}`,
      pnr: flight.pnr,
      flightNumber: flight.flightNumber,
      aircraft: flight.aircraft,
      originCode: flight.originCode,
      originCity: flight.originCity,
      destinationCode: flight.destinationCode,
      destinationCity: flight.destinationCity,
      departureDate: flight.flightDate,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      duration: "2h 15m",
      seat: flight.seat,
      cabinClass: flight.cabinClass,
      status: "Completed",
      isUpcoming: false,
      milesEarn: flight.milesEarned,
    }));
  }, []);

  const loyaltyProgressPercent = Math.min(
    100,
    Math.round((DEFAULT_LOYALTY.tierPointsEarned / DEFAULT_LOYALTY.tierPointsRequiredNext) * 100)
  );
  const milesNeededForNextTier = DEFAULT_LOYALTY.tierPointsRequiredNext - DEFAULT_LOYALTY.tierPointsEarned;

  // Flight history filter
  const filteredHistory = SAMPLE_PAST_FLIGHTS.filter((flight) => {
    const matchesSearch =
      historySearch === "" ||
      flight.pnr.toLowerCase().includes(historySearch.toLowerCase()) ||
      flight.flightNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
      flight.originCity.toLowerCase().includes(historySearch.toLowerCase()) ||
      flight.destinationCity.toLowerCase().includes(historySearch.toLowerCase()) ||
      flight.originCode.toLowerCase().includes(historySearch.toLowerCase()) ||
      flight.destinationCode.toLowerCase().includes(historySearch.toLowerCase());

    const matchesYear =
      historyYear === "all" || flight.flightDate.includes(historyYear);

    return matchesSearch && matchesYear;
  });

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimPnr || !claimFlightNo) {
      toast.error("Please provide both PNR and Flight Number to claim missing miles.");
      return;
    }
    toast.success(`Claim submitted for ${claimFlightNo.toUpperCase()} (${claimPnr.toUpperCase()}). Miles will reflect within 48 hours.`);
    setClaimModalOpen(false);
    setClaimPnr("");
    setClaimFlightNo("");
  };

  const handleAddBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addBookingPnr) {
      toast.error("Please enter a valid 6-character PNR code.");
      return;
    }
    setIsAddingBooking(true);
    setTimeout(() => {
      toast.success(`Booking ${addBookingPnr.toUpperCase()} linked successfully to your dashboard!`);
      setAddBookingPnr("");
      setIsAddingBooking(false);
    }, 600);
  };

  return (
    <div id={`user-dashboard-${compId}`} className={cn("w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12", className)}>
      {/* 1. Welcome & Frequent Flyer Status Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 p-6 text-white shadow-xl dark:border-slate-800 md:p-8">
        {/* Background decorative glow & patterns */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 h-48 w-48 rounded-full bg-amber-500/10 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* User & Tier Info */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-black tracking-wide text-amber-300 ring-1 ring-amber-400/40">
                <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                {DEFAULT_LOYALTY.tierLabel}
              </span>
              <span className="font-mono text-xs text-slate-300">
                Member ID: <strong className="text-white">{DEFAULT_LOYALTY.membershipNumber}</strong>
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Welcome back, {userName}
              </h1>
              <p className="text-xs text-slate-300 sm:text-sm">
                Track your active flights, frequent flyer miles, tier benefits, and past receipts
              </p>
            </div>

            {/* Quick Badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> Identity Verified
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-blue-400" /> Tier valid through {DEFAULT_LOYALTY.tierExpiryDate}
              </span>
            </div>
          </div>

          {/* Miles & Tier Card Highlight */}
          <div className="w-full lg:max-w-md rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Available Frequent Flyer Miles
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-black text-white sm:text-4xl">
                    {DEFAULT_LOYALTY.currentMiles.toLocaleString()}
                  </span>
                  <span className="text-sm font-semibold text-amber-300">miles</span>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => navigate({ to: "/app/$", params: { _splat: "loyalty" } })}
                className="rounded-xl bg-amber-400 text-xs font-bold text-slate-950 shadow-md hover:bg-amber-300"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Redeem
              </Button>
            </div>

            {/* Progress to Next Tier */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-200">
                <span className="font-medium">Progress to {DEFAULT_LOYALTY.nextTier}</span>
                <span className="font-mono font-bold text-white">
                  {DEFAULT_LOYALTY.tierPointsEarned.toLocaleString()} / {DEFAULT_LOYALTY.tierPointsRequiredNext.toLocaleString()} pts
                </span>
              </div>
              <Progress value={loyaltyProgressPercent} className="h-2 bg-white/20" />
              <div className="flex justify-between text-[11px] text-slate-300">
                <span>{loyaltyProgressPercent}% Completed</span>
                <span className="text-amber-300 font-semibold">{milesNeededForNextTier.toLocaleString()} miles to Platinum</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="relative z-10 mt-8 flex flex-wrap gap-2 border-t border-white/15 pt-5 text-xs">
          {[
            { key: "overview", label: "Dashboard Overview", icon: TrendingUp },
            {
              key: "notifications",
              label: unreadCount > 0 ? `Alerts & Notices (${unreadCount})` : "Alerts Center",
              icon: Bell,
              badge: unreadCount > 0 ? unreadCount : undefined,
              isUrgent: urgentCount > 0,
            },
            { key: "tracker", label: "Live Radar & Gates", icon: Radio },
            { key: "upcoming", label: `Upcoming Trips (${SAMPLE_UPCOMING_TRIPS.length})`, icon: Calendar },
            { key: "dining", label: "In-Flight Dining Preview", icon: Utensils },
            { key: "routes", label: "Flight Route Radar", icon: Navigation },
            { key: "weather", label: "Destination Weather", icon: CloudSun },
            { key: "travel-tips", label: "AI Packing & Travel Tips", icon: Sparkles },
            { key: "history", label: `Flight History (${SAMPLE_PAST_FLIGHTS.length})`, icon: Clock },
            { key: "feedback", label: "Post-Flight Survey", icon: MessageSquareHeart },
            { key: "lounge", label: "Lounge Access", icon: Armchair },
            { key: "loyalty", label: "Miles & Tier Rewards", icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  "relative flex items-center gap-2 rounded-xl px-4 py-2.5 font-bold transition-all",
                  isSelected
                    ? "bg-white text-slate-900 shadow-md shadow-black/20"
                    : tab.isUrgent
                    ? "bg-rose-500/30 text-rose-200 hover:bg-rose-500/40 ring-1 ring-rose-400/40"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                <Icon className={cn("h-4 w-4", tab.isUrgent && !isSelected && "animate-bounce text-rose-300")} />
                <span>{tab.label}</span>
                {tab.badge && !isSelected && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Key Stats Highlights Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Flights Taken</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Plane className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-slate-900 dark:text-slate-100">47</span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">+3 this quarter</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Lifetime Miles</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-slate-900 dark:text-slate-100">89.4k</span>
            <span className="text-[11px] font-semibold text-slate-500">Tier: Gold Elite</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Upcoming Bookings</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Luggage className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-slate-900 dark:text-slate-100">{SAMPLE_UPCOMING_TRIPS.length}</span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">1 Check-in open</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Carbon Offset</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Flame className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-slate-900 dark:text-slate-100">2.4t</span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">100% Certified</span>
          </div>
        </div>
      </div>

      {/* 3. Main Body - Dynamic Tab Views */}

      {/* TAB: NOTIFICATIONS & URGENT TRAVEL ALERTS */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          <DashboardNotificationCenter
            onNavigateToFlight={(flightNum) => {
              setActiveTab("tracker");
            }}
            onNavigateToMap={(flightNum) => {
              const match = upcomingRouteItems.find(
                (r) =>
                  r.flightNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase() ===
                  flightNum.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
              );
              if (match) setSelectedMapFlightId(match.id);
              setActiveTab("routes");
            }}
          />
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Urgent Alert Ticker Ribbon in Overview */}
          {alerts.length > 0 && alerts.some((a) => !a.dismissed && (a.isUrgent || a.severity === "critical" || a.severity === "warning")) && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/90 p-4 dark:border-amber-900/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold animate-pulse">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      Live Travel Notice:
                    </span>
                    <span className="font-mono text-xs font-black">
                      {alerts.find((a) => !a.dismissed)?.flightNumber}
                    </span>
                  </div>
                  <p className="text-xs font-semibold mt-0.5">
                    {alerts.find((a) => !a.dismissed)?.title} &mdash;{" "}
                    <span className="font-normal opacity-90">{alerts.find((a) => !a.dismissed)?.message}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const topAlert = alerts.find((a) => !a.dismissed);
                    if (topAlert) showToastForAlert(topAlert);
                  }}
                  className="h-8 rounded-xl border-amber-400/60 bg-white/80 dark:bg-slate-900 text-xs font-bold text-amber-900 dark:text-amber-200"
                >
                  Fire Toast
                </Button>
                <Button
                  size="sm"
                  onClick={() => setActiveTab("notifications")}
                  className="h-8 rounded-xl bg-amber-600 text-xs font-bold text-white shadow-sm hover:bg-amber-700"
                >
                  Open Notification Hub &rarr;
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left Column: Upcoming Trips Summary + Quick Actions (8 Cols) */}
            <div className="space-y-6 lg:col-span-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                  Upcoming Trips Summary
                </h2>
                <p className="text-xs text-slate-500">
                  Confirmed bookings ready for check-in, seat assignments, and live flight telemetry
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("upcoming")}
                className="gap-1 rounded-xl text-xs font-semibold"
              >
                <span>View All ({SAMPLE_UPCOMING_TRIPS.length})</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Live Real-Time Flight Status & Gate Radar Widget */}
            <RealtimeFlightStatusWidget
              userUpcomingTrips={SAMPLE_UPCOMING_TRIPS}
              onNavigateToMap={(flightNum) => {
                const match = upcomingRouteItems.find(
                  (r) =>
                    r.flightNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase() ===
                    flightNum.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
                );
                if (match) setSelectedMapFlightId(match.id);
                setActiveTab("routes");
              }}
            />

            {/* Upcoming Trip Cards List */}
            <div className="space-y-4">
              {SAMPLE_UPCOMING_TRIPS.map((trip) => (
                <div
                  key={trip.pnr}
                  className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  {/* Top Notification Bar if Delayed */}
                  {trip.delayNotice && (
                    <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-xs font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{trip.delayNotice}</span>
                    </div>
                  )}

                  {/* Flight Info Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-md shadow-blue-600/20">
                        <PlaneTakeoff className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-slate-100">
                            {trip.flightNumber}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">&bull;</span>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            {trip.aircraft}
                          </span>
                          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-[10px] font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
                            {trip.cabinClass}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          PNR: <strong className="font-mono text-slate-800 dark:text-slate-200">{trip.pnr}</strong> &bull; {trip.departureDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className={cn(
                        "rounded-lg px-2.5 py-1 text-xs font-bold",
                        trip.status === "Delayed"
                          ? "bg-amber-500 text-white"
                          : trip.status === "Check-in Open"
                          ? "bg-emerald-600 text-white"
                          : "bg-blue-600 text-white"
                      )}>
                        {trip.status}
                      </Badge>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {trip.countdownText}
                      </span>
                    </div>
                  </div>

                  {/* Route & Times Visual Block */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-12">
                      {/* Origin */}
                      <div className="md:col-span-4 space-y-1">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Origin</div>
                        <div className="font-mono text-2xl font-black text-slate-900 dark:text-slate-100">
                          {trip.originCode}
                        </div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {trip.originCity}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          {trip.departureTime} &bull; {trip.originTerminal}
                        </div>
                      </div>

                      {/* Flight Path Graphic */}
                      <div className="flex flex-col items-center justify-center md:col-span-4">
                        <span className="text-xs font-semibold text-slate-400">{trip.duration}</span>
                        <div className="relative my-2 w-full flex items-center justify-center">
                          <div className="h-[2px] w-full bg-slate-200 dark:bg-slate-700" />
                          <div className="absolute flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                            <Plane className="h-3.5 w-3.5 rotate-90" />
                          </div>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Non-Stop
                        </span>
                      </div>

                      {/* Destination */}
                      <div className="space-y-1 md:col-span-4 md:text-right">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Destination</div>
                        <div className="font-mono text-2xl font-black text-slate-900 dark:text-slate-100">
                          {trip.destinationCode}
                        </div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {trip.destinationCity}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          {trip.arrivalTime} &bull; Terminal {trip.destinationTerminal}
                        </div>
                      </div>
                    </div>

                    {/* Flight Details Pills */}
                    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-semibold dark:bg-slate-800">
                        <span>Seat:</span>
                        <span className="text-blue-600 dark:text-blue-400">{trip.seat}</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-semibold dark:bg-slate-800">
                        <span>Meal:</span>
                        <span>{trip.meal}</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-semibold dark:bg-slate-800">
                        <span>Baggage:</span>
                        <span>{trip.baggageAllowance}</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-500/20">
                        <Crown className="h-3.5 w-3.5 text-amber-500" />
                        <span>Lounge: {DEFAULT_LOYALTY.tier} Eligible</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        <Sparkles className="h-3 w-3" />
                        <span>+{trip.estimatedMilesEarn} Frequent Flyer Miles</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => navigate({ to: "/app/$", params: { _splat: `check-in/${trip.pnr}` } })}
                          className="rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
                        >
                          <Ticket className="mr-1.5 h-3.5 w-3.5" />
                          Check-in Now
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedLoungeTrip(trip)}
                          className="rounded-xl border-amber-300/80 bg-amber-50/60 text-xs font-bold text-amber-900 hover:bg-amber-100 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-300"
                        >
                          <Armchair className="mr-1.5 h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          Lounge Access
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate({ to: "/app/$", params: { _splat: `check-in/${trip.pnr}/seats` } })}
                          className="rounded-xl text-xs font-semibold"
                        >
                          Change Seat
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate({ to: "/app/$", params: { _splat: `baggage` } })}
                          className="rounded-xl text-xs font-semibold"
                        >
                          <Luggage className="mr-1.5 h-3.5 w-3.5" />
                          Track Baggage
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedMapFlightId(`upcoming-${trip.pnr}`);
                            setActiveTab("routes");
                          }}
                          className="rounded-xl border-blue-300/80 bg-blue-50/50 text-xs font-bold text-blue-800 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                        >
                          <Navigation className="mr-1.5 h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          Route Map
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setTipsFlightCode(trip.destinationCode);
                            setTipsFlightCity(trip.destinationCity);
                            setActiveTab("travel-tips");
                          }}
                          className="rounded-xl border-blue-200 bg-blue-50/70 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
                        >
                          <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          AI Packing & Tips
                        </Button>
                        <AddToCalendarButton trip={trip} />
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate({ to: "/app/$", params: { _splat: `my-trips/${trip.pnr}` } })}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Trip Details & Receipt &rarr;
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Destination Weather Forecast for Upcoming Trips in Overview */}
            <div className="mt-8">
              <DestinationWeatherCard upcomingTrips={SAMPLE_UPCOMING_TRIPS} />
            </div>

            {/* Live Flight Route Corridor Map Section in Overview */}
            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Upcoming Flight Path Radar & Corridors
                  </h3>
                  <p className="text-xs text-slate-500">
                    Interactive geodesic projection showing great-circle flight paths, live telemetry, and airport weather
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("routes")}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Expand Full Radar &rarr;
                </Button>
              </div>

              <FlightRouteMap
                upcomingFlights={upcomingRouteItems}
                pastFlights={pastRouteItems}
                defaultSelectedId={selectedMapFlightId || upcomingRouteItems[0]?.id}
              />
            </div>

            {/* Recent Flight History Snippet in Overview */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    Recent Flight History & Points Credited
                  </h3>
                  <p className="text-xs text-slate-500">
                    Completed flights with miles earned and instant receipt downloads
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("history")}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  View Full History &rarr;
                </Button>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {SAMPLE_PAST_FLIGHTS.slice(0, 3).map((flight) => (
                    <div
                      key={flight.id}
                      className="flex flex-wrap items-center justify-between gap-4 p-4 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40 sm:p-5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 font-bold">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                              {flight.originCode} &rarr; {flight.destinationCode} ({flight.flightNumber})
                            </h4>
                            <span className="text-xs text-slate-400">&bull;</span>
                            <span className="text-xs font-medium text-slate-500">{flight.flightDate}</span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {flight.originCity} to {flight.destinationCity} &bull; Seat {flight.seat} &bull; PNR {flight.pnr}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                            +{flight.milesEarned.toLocaleString()} miles
                          </span>
                          <p className="text-[10px] text-slate-400">Credited to Gold Tier</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedFeedbackFlight({
                              flightNumber: flight.flightNumber,
                              pnr: flight.pnr,
                              originCity: flight.originCity,
                              originCode: flight.originCode,
                              destinationCity: flight.destinationCity,
                              destinationCode: flight.destinationCode,
                              flightDate: flight.flightDate,
                              cabinClass: flight.cabinClass,
                            });
                            setFeedbackModalOpen(true);
                          }}
                          className="h-8 rounded-lg border-amber-300/80 bg-amber-50/50 text-xs font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                        >
                          <Star className="mr-1 h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          Rate (+250m)
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReceipt(flight)}
                          className="h-8 rounded-lg text-xs font-semibold"
                        >
                          <Receipt className="mr-1 h-3.5 w-3.5" />
                          Receipt
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Frequent Flyer Profile & Tier Benefits (4 Cols) */}
          <div className="space-y-6 lg:col-span-4">
            {/* Digital Membership Card Preview */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Digital Membership Card
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Active
                </span>
              </div>

              <div className="mt-4 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 p-5 text-white shadow-lg shadow-amber-600/20">
                <div className="flex items-center justify-between">
                  <div className="font-display text-base font-bold tracking-tight">
                    SkyWay <span className="text-amber-200">Club</span>
                  </div>
                  <Badge className="bg-white/20 text-white font-bold text-[10px]">
                    GOLD ELITE
                  </Badge>
                </div>

                <div className="mt-6">
                  <div className="text-[10px] uppercase tracking-wider text-amber-200">Member Name</div>
                  <div className="text-base font-black tracking-wide">{userName}</div>
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-amber-200">Account Number</div>
                    <div className="font-mono text-xs font-bold tracking-wider">{DEFAULT_LOYALTY.membershipNumber}</div>
                  </div>
                  <div className="rounded-lg bg-white/15 p-1.5 backdrop-blur-sm">
                    <QrCode className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Tier Benefits List */}
              <div className="mt-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Active Gold Tier Privileges
                </h4>
                <div className="space-y-2.5">
                  {DEFAULT_LOYALTY.benefits.map((b) => (
                    <div key={b.title} className="flex items-start gap-2.5 text-xs">
                      <span className="text-base">{b.icon}</span>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{b.title}</div>
                        <div className="text-slate-500">{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 grid grid-cols-2 gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setClaimModalOpen(true)}
                  className="rounded-xl text-xs font-semibold"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Claim Miles
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate({ to: "/app/$", params: { _splat: "loyalty" } })}
                  className="rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                >
                  Rewards Store
                </Button>
              </div>
            </div>

            {/* Link An External Booking Card */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Link Another Booking
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                Add a flight booked via corporate portal or travel agency with your 6-digit PNR.
              </p>

              <form onSubmit={handleAddBooking} className="mt-4 flex gap-2">
                <Input
                  placeholder="e.g. SW4N9P"
                  value={addBookingPnr}
                  onChange={(e) => setAddBookingPnr(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="font-mono uppercase text-xs h-10"
                />
                <Button type="submit" disabled={isAddingBooking} size="sm" className="h-10 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700">
                  {isAddingBooking ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Link"}
                </Button>
              </form>
            </div>
          </div>

          {/* AI Destination & Packing Tips Embedded Card in Overview */}
          <div className="lg:col-span-12">
            <DestinationTravelTipsCard
              upcomingFlights={SAMPLE_UPCOMING_TRIPS}
              initialDestinationCode={tipsFlightCode}
              initialDestinationCity={tipsFlightCity}
            />
          </div>
        </div>
        </div>
      )}

      {/* TAB: DEDICATED LIVE RADAR & GATES TRACKER */}
      {activeTab === "tracker" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Radio className="h-6 w-6 text-blue-600 animate-pulse" />
                Live Flight Status & Gate Reassignment Radar
              </h2>
              <p className="text-xs text-slate-500">
                Real-time telemetry, PostgreSQL database synchronizations, gate change notices, and runway delay tracking
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("routes")}
                className="rounded-xl text-xs font-semibold gap-1.5"
              >
                <Navigation className="h-3.5 w-3.5 text-blue-600" />
                <span>Open Great-Circle Map</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setActiveTab("upcoming")}
                className="rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
              >
                <Calendar className="mr-1.5 h-3.5 w-3.5" /> View Bookings
              </Button>
            </div>
          </div>

          {/* Primary Real-time Tracking Widget with full telemetry & live dispatch simulator */}
          <RealtimeFlightStatusWidget
            userUpcomingTrips={SAMPLE_UPCOMING_TRIPS}
            onNavigateToMap={(flightNum) => {
              const match = upcomingRouteItems.find(
                (r) =>
                  r.flightNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase() ===
                  flightNum.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
              );
              if (match) setSelectedMapFlightId(match.id);
              setActiveTab("routes");
            }}
          />

          {/* Geodesic Route Map for Visual Confirmation */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Live Air Corridor & Great Circle Paths
                </h3>
                <p className="text-xs text-slate-500">
                  Interactive geodesic flight path telemetry matching live radar coordinates
                </p>
              </div>
            </div>
            <FlightRouteMap
              upcomingFlights={upcomingRouteItems}
              pastFlights={pastRouteItems}
              defaultSelectedId={selectedMapFlightId || upcomingRouteItems[0]?.id}
            />
          </div>
        </div>
      )}

      {/* TAB: DEDICATED AI TRAVEL & PACKING ADVICE */}
      {activeTab === "travel-tips" && (
        <div className="space-y-6">
          <DestinationTravelTipsCard
            upcomingFlights={SAMPLE_UPCOMING_TRIPS}
            initialDestinationCode={tipsFlightCode}
            initialDestinationCity={tipsFlightCity}
          />
        </div>
      )}

      {/* TAB 2: UPCOMING TRIPS DETAILED VIEW */}
      {activeTab === "upcoming" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                Your Upcoming Flights
              </h2>
              <p className="text-xs text-slate-500">
                Manage your confirmed bookings, add baggage, choose meals, and generate digital boarding passes
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  downloadAllIcsFiles(SAMPLE_UPCOMING_TRIPS);
                  toast.success("Downloaded all upcoming flights (.ics)", {
                    description: "Import into Apple Calendar, Google Calendar, or Outlook to sync all itineraries.",
                  });
                }}
                className="rounded-xl border-slate-200 text-xs font-semibold gap-1.5 hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:hover:bg-slate-800"
              >
                <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Sync All Trips (.ics)</span>
              </Button>

              <Button
                onClick={() => navigate({ to: "/app" })}
                className="rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Book New Flight
              </Button>
            </div>
          </div>

          {/* Real-time Status Tracker Widget for Upcoming Trips */}
          <RealtimeFlightStatusWidget
            userUpcomingTrips={SAMPLE_UPCOMING_TRIPS}
            onNavigateToMap={(flightNum) => {
              const match = upcomingRouteItems.find(
                (r) =>
                  r.flightNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase() ===
                  flightNum.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
              );
              if (match) setSelectedMapFlightId(match.id);
              setActiveTab("routes");
            }}
          />

          {/* Interactive Route Corridor Map for Upcoming Flights */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Navigation className="h-3.5 w-3.5 text-blue-600" />
                Upcoming Geodesic Radar Map
              </span>
              <span className="text-[11px] text-slate-400">
                Click any route pill to focus flight telemetry
              </span>
            </div>
            <FlightRouteMap
              upcomingFlights={upcomingRouteItems}
              pastFlights={pastRouteItems}
              defaultSelectedId={selectedMapFlightId || upcomingRouteItems[0]?.id}
            />
          </div>

          {/* Destination Weather Forecast Card in Upcoming Trips Tab */}
          <div className="pt-2">
            <DestinationWeatherCard upcomingTrips={SAMPLE_UPCOMING_TRIPS} />
          </div>

          <div className="space-y-6 pt-2">
            {SAMPLE_UPCOMING_TRIPS.map((trip) => (
              <div
                key={trip.pnr}
                className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Trip Header Banner */}
                <div className="flex flex-wrap items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
                      <Plane className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                        {trip.originCity} ({trip.originCode}) &rarr; {trip.destinationCity} ({trip.destinationCode})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Flight <strong className="font-mono text-slate-800 dark:text-slate-200">{trip.flightNumber}</strong> &bull; PNR: <strong className="font-mono text-slate-800 dark:text-slate-200">{trip.pnr}</strong> &bull; {trip.departureDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="px-3 py-1 font-bold text-xs bg-white dark:bg-slate-800">
                      {trip.cabinClass} Class
                    </Badge>
                    <Badge className={cn(
                      "px-3 py-1 text-xs font-bold",
                      trip.status === "Delayed" ? "bg-amber-500" : "bg-emerald-600"
                    )}>
                      {trip.status}
                    </Badge>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="p-6 md:p-8 space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Origin Departure */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Departure</div>
                      <div className="mt-1 text-xl font-extrabold text-slate-900 dark:text-slate-100">{trip.originCity} ({trip.originCode})</div>
                      <div className="mt-1 text-sm font-semibold text-blue-600 dark:text-blue-400">{trip.departureTime}</div>
                      <div className="text-xs text-slate-500">{trip.originTerminal}</div>
                    </div>

                    {/* Flight Specs */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30 text-center flex flex-col justify-center">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Flight Duration</div>
                      <div className="mt-1 text-base font-extrabold text-slate-900 dark:text-slate-100">{trip.duration}</div>
                      <div className="text-xs text-slate-500">{trip.aircraft} &bull; Non-stop</div>
                      <div className="mt-2 text-xs font-bold text-amber-600 dark:text-amber-400">+{trip.estimatedMilesEarn} Miles Reward</div>
                    </div>

                    {/* Destination Arrival */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30 md:text-right">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Arrival</div>
                      <div className="mt-1 text-xl font-extrabold text-slate-900 dark:text-slate-100">{trip.destinationCity} ({trip.destinationCode})</div>
                      <div className="mt-1 text-sm font-semibold text-blue-600 dark:text-blue-400">{trip.arrivalTime}</div>
                      <div className="text-xs text-slate-500">Terminal {trip.destinationTerminal}</div>
                    </div>
                  </div>

                  {/* Amenities / Included list */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                      <span className="text-slate-400 block font-semibold">Seat Number</span>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100">{trip.seat}</span>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                      <span className="text-slate-400 block font-semibold">Meal Preference</span>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100">{trip.meal}</span>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                      <span className="text-slate-400 block font-semibold">Checked Bags</span>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100">{trip.baggageAllowance}</span>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                      <span className="text-slate-400 block font-semibold">Wi-Fi & Streaming</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">Complimentary</span>
                    </div>
                  </div>

                  {/* Actions Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => navigate({ to: "/app/$", params: { _splat: `check-in/${trip.pnr}` } })}
                        className="rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
                      >
                        <Ticket className="mr-1.5 h-3.5 w-3.5" />
                        Check-in & Boarding Pass
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate({ to: "/app/$", params: { _splat: `check-in/${trip.pnr}/seats` } })}
                        className="rounded-xl text-xs font-semibold"
                      >
                        Select / Change Seat
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedMapFlightId(`upcoming-${trip.pnr}`);
                          setActiveTab("routes");
                        }}
                        className="rounded-xl border-blue-300/80 bg-blue-50/50 text-xs font-bold text-blue-800 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                      >
                        <Navigation className="mr-1.5 h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        Route Radar Map
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate({ to: "/app/$", params: { _splat: "baggage" } })}
                        className="rounded-xl text-xs font-semibold"
                      >
                        <Luggage className="mr-1.5 h-3.5 w-3.5" />
                        Baggage Tracker
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate({ to: "/app/$", params: { _splat: `flight-status/${trip.flightNumber}` } })}
                        className="rounded-xl text-xs font-semibold"
                      >
                        <PlaneTakeoff className="mr-1.5 h-3.5 w-3.5" />
                        Live Status
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const routeKey = `${trip.originCode}-${trip.destinationCode}`;
                          setSelectedDiningRoute(routeKey === "DEL-BOM" || routeKey === "BOM-DXB" || routeKey === "DEL-LHR" ? routeKey : "DEL-BOM");
                          setSelectedDiningCabin(trip.cabinClass.toLowerCase().includes("business") ? "business" : trip.cabinClass.toLowerCase().includes("prem") ? "premium-economy" : "economy");
                          setSelectedDiningPnr(trip.pnr);
                          setActiveTab("dining");
                        }}
                        className="rounded-xl border-amber-300/80 bg-amber-50/70 text-xs font-bold text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                      >
                        <Utensils className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
                        Preview In-Flight Dining
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setTipsFlightCode(trip.destinationCode);
                          setTipsFlightCity(trip.destinationCity);
                          setActiveTab("travel-tips");
                        }}
                        className="rounded-xl border-blue-200 bg-blue-50/70 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
                      >
                        <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        AI Packing & Travel Advice
                      </Button>
                      <AddToCalendarButton trip={trip} />
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate({ to: "/app/$", params: { _splat: `my-trips/${trip.pnr}` } })}
                      className="text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300"
                    >
                      View Invoice & Details &rarr;
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: DEDICATED INTERACTIVE FLIGHT ROUTE RADAR */}
      {activeTab === "routes" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                Interactive Flight Path & Corridor Radar
              </h2>
              <p className="text-xs text-slate-500">
                Explore interactive geodesic arcs, aircraft speed, cruising altitude, live runway status, and airport weather
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("upcoming")}
                className="rounded-xl text-xs font-semibold gap-1.5"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>View Itineraries</span>
              </Button>
              <Button
                size="sm"
                onClick={() => navigate({ to: "/app" })}
                className="rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Book New Route
              </Button>
            </div>
          </div>

          <FlightRouteMap
            upcomingFlights={upcomingRouteItems}
            pastFlights={pastRouteItems}
            defaultSelectedId={selectedMapFlightId || upcomingRouteItems[0]?.id}
          />
        </div>
      )}

      {/* TAB 3: FLIGHT HISTORY DETAILED VIEW */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                Recent Flight History
              </h2>
              <p className="text-xs text-slate-500">
                Audit past journeys, frequent flyer mileage credits, and download tax invoices/receipts
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClaimModalOpen(true)}
                className="rounded-xl text-xs font-semibold gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Claim Missing Miles
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by city, flight #, or PNR..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-9 text-xs h-10 dark:bg-slate-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Filter Year:</span>
              <select
                value={historyYear}
                onChange={(e) => setHistoryYear(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="all">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
          </div>

          {/* History List Table / Cards */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredHistory.map((flight) => (
                <div
                  key={flight.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-bold">
                      <PlaneLanding className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                          {flight.originCity} ({flight.originCode}) &rarr; {flight.destinationCity} ({flight.destinationCode})
                        </span>
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {flight.flightNumber}
                        </Badge>
                        <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                          Completed
                        </Badge>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>Date: <strong className="text-slate-700 dark:text-slate-300">{flight.flightDate}</strong></span>
                        <span>&bull;</span>
                        <span>Seat: <strong className="text-slate-700 dark:text-slate-300">{flight.seat}</strong></span>
                        <span>&bull;</span>
                        <span>Cabin: <strong className="text-slate-700 dark:text-slate-300">{flight.cabinClass}</strong></span>
                        <span>&bull;</span>
                        <span>PNR: <strong className="font-mono text-slate-700 dark:text-slate-300">{flight.pnr}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left md:text-right">
                      <div className="inline-flex items-center gap-1 font-mono text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        +{flight.milesEarned.toLocaleString()} miles
                      </div>
                      <p className="text-[11px] text-slate-400">₹{flight.totalFareINR.toLocaleString()} total fare</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFeedbackFlight({
                            flightNumber: flight.flightNumber,
                            pnr: flight.pnr,
                            originCity: flight.originCity,
                            originCode: flight.originCode,
                            destinationCity: flight.destinationCity,
                            destinationCode: flight.destinationCode,
                            flightDate: flight.flightDate,
                            cabinClass: flight.cabinClass,
                          });
                          setFeedbackModalOpen(true);
                        }}
                        className="rounded-xl border-amber-300/80 bg-amber-50/50 text-xs font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                      >
                        <Star className="mr-1 h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        Rate Flight (+250m)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReceipt(flight)}
                        className="rounded-xl text-xs font-semibold"
                      >
                        <FileText className="mr-1 h-3.5 w-3.5" />
                        Invoice
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => navigate({ to: "/app" })}
                        className="rounded-xl bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                      >
                        Rebook
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredHistory.length === 0 && (
                <div className="p-12 text-center text-slate-500">
                  <Clock className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-sm font-medium">No past flight records matching criteria.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LOYALTY & REWARDS DETAILS */}
      {activeTab === "loyalty" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                SkyWay Frequent Flyer & Rewards
              </h2>
              <p className="text-xs text-slate-500">
                Spend your miles on reward flights, cabin upgrades, luxury hotels, and airport experiences
              </p>
            </div>

            <Button
              onClick={() => navigate({ to: "/app/$", params: { _splat: "loyalty" } })}
              className="rounded-xl bg-amber-500 text-xs font-bold text-slate-950 shadow-md hover:bg-amber-400"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Full Rewards Catalog
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Quick Redemption 1 */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-bold">
                  <Plane className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Domestic Flight Reward
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Redeem for full economy return tickets on any domestic Indian route (DEL, BOM, BLR, GOI).
                </p>
                <div className="mt-4 font-mono text-2xl font-black text-blue-600 dark:text-blue-400">
                  12,000 <span className="text-xs font-sans text-slate-400">miles</span>
                </div>
              </div>
              <Button
                onClick={() => {
                  toast.success("Reward flight search opened with 12,000 miles applied!");
                  navigate({ to: "/app" });
                }}
                className="mt-6 w-full rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
              >
                Book with Miles
              </Button>
            </div>

            {/* Quick Redemption 2 */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 font-bold">
                  <Star className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Business Class Upgrade
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Instant confirmation for lie-flat seats, gourmet dining, and lounge access on your next flight.
                </p>
                <div className="mt-4 font-mono text-2xl font-black text-amber-600 dark:text-amber-400">
                  8,500 <span className="text-xs font-sans text-slate-400">miles</span>
                </div>
              </div>
              <Button
                onClick={() => {
                  toast.success("Upgrade request placed for upcoming booking SW8X4K!");
                }}
                className="mt-6 w-full rounded-xl bg-amber-500 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                Upgrade Seat
              </Button>
            </div>

            {/* Quick Redemption 3 */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 font-bold">
                  <Gift className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Luxury Lounge & Spa Pass
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Premium buffet, champagne bar, shower suites, and 30-min express massage at DEL/BOM/DXB.
                </p>
                <div className="mt-4 font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  3,000 <span className="text-xs font-sans text-slate-400">miles</span>
                </div>
              </div>
              <Button
                onClick={() => {
                  toast.success("Lounge Pass voucher sent to your registered email & Apple Wallet!");
                }}
                className="mt-6 w-full rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Redeem Lounge Pass
              </Button>
            </div>
          </div>

          {/* Lounge Access Privileges Section */}
          <div className="pt-2">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-3">
              Your Tier Lounge Access & Airport Privileges
            </h3>
            <LoungeAccessIndicator
              tier={DEFAULT_LOYALTY.tier as any}
              ticketClass="Economy"
              passengerName={userName}
              departureAirport="DEL"
              destinationAirport="BOM"
              showSimulator={true}
            />
          </div>
        </div>
      )}

      {/* 5. Airport Lounge Privileges & Access Checker Tab */}
      {activeTab === "lounge" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                Airport Lounge Privileges & Access Checker
              </h2>
              <p className="text-xs text-slate-500">
                Instant eligibility evaluation based on your loyalty tier ({DEFAULT_LOYALTY.tierLabel}) and ticket class
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500 font-bold text-slate-950">
                {DEFAULT_LOYALTY.tier} Elite Status
              </Badge>
            </div>
          </div>

          <LoungeAccessIndicator
            tier={DEFAULT_LOYALTY.tier as any}
            ticketClass="Economy"
            passengerName={userName}
            departureAirport="DEL"
            destinationAirport="BOM"
            showSimulator={true}
          />
        </div>
      )}

      {/* 6. Post-Flight Feedback & Satisfaction Tab */}
      {activeTab === "feedback" && (
        <PostFlightFeedbackView
          passengerInfo={{
            name: userName,
            email: userEmail,
            milesBalance: DEFAULT_LOYALTY.currentMiles,
          }}
          pastFlights={SAMPLE_PAST_FLIGHTS}
        />
      )}

      {/* 7. Destination Weather Forecast & Trend Analysis Tab */}
      {activeTab === "weather" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CloudSun className="h-6 w-6 text-blue-600" />
                Destination Weather Forecast & Aviation Conditions
              </h2>
              <p className="text-xs text-slate-500">
                Current temperature, condition icons, and 3-day meteorological trend analysis for your scheduled landings
              </p>
            </div>
            <Badge className="bg-blue-600 font-bold text-white">
              Live Aviation METAR Telemetry
            </Badge>
          </div>

          <DestinationWeatherCard upcomingTrips={SAMPLE_UPCOMING_TRIPS} />

          {/* Connected AI Packing & Destination Tips */}
          <div className="pt-4">
            <DestinationTravelTipsCard
              upcomingFlights={SAMPLE_UPCOMING_TRIPS}
              initialDestinationCode={tipsFlightCode}
              initialDestinationCity={tipsFlightCity}
            />
          </div>
        </div>
      )}

      {/* 8. In-Flight Dining & Gourmet Menu Preview Tab */}
      {activeTab === "dining" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Utensils className="h-6 w-6 text-amber-600" />
                In-Flight Dining Preview & Gourmet Menus
              </h2>
              <p className="text-xs text-slate-500">
                Browse hot entrées, sommelier cellars, and dietary selections crafted for your flight route and cabin experience
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-600 font-bold text-white">
                Chef Curated &bull; HACCP Certified
              </Badge>
            </div>
          </div>

          <InFlightDiningPreview
            initialRouteKey={selectedDiningRoute}
            initialCabinClass={selectedDiningCabin}
            selectedPnr={selectedDiningPnr}
          />
        </div>
      )}

      {/* Claim Missing Miles Modal Dialog */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Claim Missing Frequent Flyer Miles
              </h3>
              <button
                type="button"
                onClick={() => setClaimModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleClaimSubmit} className="mt-4 space-y-4 text-xs">
              <p className="text-slate-500">
                If you took a flight on SkyWay or partner airlines in the past 6 months without entering your membership number, claim them here.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Booking Reference (PNR)
                </label>
                <Input
                  required
                  placeholder="e.g. SW991K"
                  value={claimPnr}
                  onChange={(e) => setClaimPnr(e.target.value.toUpperCase())}
                  className="h-10 font-mono text-xs uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Flight Number
                </label>
                <Input
                  required
                  placeholder="e.g. SW-101"
                  value={claimFlightNo}
                  onChange={(e) => setClaimFlightNo(e.target.value.toUpperCase())}
                  className="h-10 font-mono text-xs uppercase"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setClaimModalOpen(false)}
                  className="flex-1 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
                >
                  Submit Claim
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice & Tax Receipt Modal Dialog */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Electronic Ticket & Tax Invoice
                </h3>
                <span className="font-mono text-xs text-slate-400">Invoice Ref: INV-2026-{selectedReceipt.pnr}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Passenger:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Frequent Flyer:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{DEFAULT_LOYALTY.membershipNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Route & Flight:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {selectedReceipt.originCity} ({selectedReceipt.originCode}) &rarr; {selectedReceipt.destinationCity} ({selectedReceipt.destinationCode}) &bull; {selectedReceipt.flightNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Travel Date:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedReceipt.flightDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Points Credited:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{selectedReceipt.milesEarned.toLocaleString()} miles</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-1.5 dark:border-slate-800">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Base Airfare:</span>
                  <span>₹{(selectedReceipt.totalFareINR * 0.85).toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Aviation Security & GST (18%):</span>
                  <span>₹{(selectedReceipt.totalFareINR * 0.15).toFixed(0)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Total Amount Paid:</span>
                  <span className="text-blue-600 dark:text-blue-400">₹{selectedReceipt.totalFareINR.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    toast.success("Receipt sent to your registered email address.");
                    setSelectedReceipt(null);
                  }}
                  className="flex-1 rounded-xl text-xs font-semibold"
                >
                  <Share2 className="mr-1.5 h-3.5 w-3.5" />
                  Email Receipt
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    toast.success("PDF Tax Invoice download completed.");
                    setSelectedReceipt(null);
                  }}
                  className="flex-1 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flight Feedback Satisfaction Survey Modal */}
      <FlightFeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        flight={selectedFeedbackFlight}
        passengerInfo={{
          name: userName,
          email: userEmail,
        }}
        onFeedbackSubmitted={() => {
          toast.success("Feedback submitted and recorded in PostgreSQL!");
        }}
      />

      {/* Trip-Specific Lounge Access & Digital Pass Modal */}
      {selectedLoungeTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl text-card-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Armchair className="h-5 w-5 text-amber-500" />
                  Flight Lounge Privileges &bull; {selectedLoungeTrip.flightNumber}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedLoungeTrip.originCity} ({selectedLoungeTrip.originCode}) &rarr; {selectedLoungeTrip.destinationCity} ({selectedLoungeTrip.destinationCode}) &bull; PNR: <strong className="font-mono">{selectedLoungeTrip.pnr}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLoungeTrip(null)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <LoungeAccessIndicator
              tier={DEFAULT_LOYALTY.tier as any}
              ticketClass={selectedLoungeTrip.cabinClass}
              flightNumber={selectedLoungeTrip.flightNumber}
              pnr={selectedLoungeTrip.pnr}
              passengerName={userName}
              departureAirport={selectedLoungeTrip.originCode}
              destinationAirport={selectedLoungeTrip.destinationCode}
              isInternational={selectedLoungeTrip.destinationCode === "DXB"}
              showSimulator={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;
