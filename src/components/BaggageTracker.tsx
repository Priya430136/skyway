import React, { useState, useEffect, useId } from "react";
import { format } from "date-fns";
import {
  Luggage,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Plane,
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Bell,
  Download,
  Share2,
  FileText,
  HelpCircle,
  Sparkles,
  PhoneCall,
  ChevronRight,
  User,
  Ticket,
  ArrowRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface BaggageMilestone {
  id: string;
  stage: string;
  title: string;
  location: string;
  airportCode: string;
  terminal?: string;
  timestamp: string;
  completed: boolean;
  active?: boolean;
  details: string;
  stationOrBelt?: string;
}

export interface CheckedBag {
  tagNumber: string;
  bagIndex: number;
  totalBags: number;
  weightKg: number;
  weightAllowanceKg: number;
  type: string;
  color?: string;
  status:
    | "Checked In"
    | "Security Cleared"
    | "Loaded on Aircraft"
    | "In Flight"
    | "Ramp Transfer"
    | "Ready for Pickup"
    | "Delivered to Carousel"
    | "Claimed"
    | "Delayed"
    | string;
  currentLocation: string;
  flightNumber: string;
  originCode: string;
  destinationCode: string;
  arrivalTerminal: string;
  baggageCarousel: string;
  estimatedDeliveryTime?: string;
  milestones: BaggageMilestone[];
}

export interface BaggageBookingData {
  pnr: string;
  passengerLastName: string;
  passengerFullName: string;
  passengerEmail?: string;
  flightNumber: string;
  flightDate: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  departureTime: string;
  arrivalTime: string;
  bags: CheckedBag[];
}

export interface BaggageTrackerProps {
  initialPnr?: string;
  initialLastName?: string;
  onBaggageFound?: (data: BaggageBookingData) => void;
  className?: string;
}

const SAMPLE_BOOKINGS: { pnr: string; lastName: string; label: string; status: string }[] = [
  { pnr: "SW8K2P", lastName: "Sharma", label: "DEL → LHR (In Transit)", status: "In Flight" },
  { pnr: "QX7A2K", lastName: "Reddy", label: "BOM → DXB (On Carousel 7)", status: "Ready for Pickup" },
  { pnr: "DL914A", lastName: "Kapoor", label: "BLR → SIN (Loaded)", status: "Loaded on Aircraft" },
];

export function BaggageTracker({
  initialPnr = "SW8K2P",
  initialLastName = "Sharma",
  onBaggageFound,
  className,
}: BaggageTrackerProps) {
  const compId = useId();

  // Search input state
  const [pnrInput, setPnrInput] = useState(initialPnr);
  const [lastNameInput, setLastNameInput] = useState(initialLastName);
  const [selectedBagIndex, setSelectedBagIndex] = useState<number>(0);

  // Result state
  const [baggageData, setBaggageData] = useState<BaggageBookingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [notificationsActive, setNotificationsActive] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportType, setReportType] = useState<"delayed" | "damaged" | "missing_item">("delayed");
  const [reportNotes, setReportNotes] = useState("");

  const handleSearch = (pnrToSearch?: string, lastNameToSearch?: string) => {
    const pnr = (pnrToSearch || pnrInput).trim().toUpperCase();
    const lastName = (lastNameToSearch || lastNameInput).trim();

    if (!pnr) {
      setError("Please enter your 6-character booking reference (PNR).");
      return;
    }
    if (!lastName) {
      setError("Please enter the passenger's last name.");
      return;
    }

    setLoading(true);
    setError(null);

    // Simulate search with realistic flight baggage telemetry
    setTimeout(() => {
      try {
        const result = generateBaggageData(pnr, lastName);
        setBaggageData(result);
        setSelectedBagIndex(0);
        if (onBaggageFound) {
          onBaggageFound(result);
        }
      } catch (err: any) {
        setError("Unable to find baggage records for the provided details. Please verify your PNR and last name.");
      } finally {
        setLoading(false);
      }
    }, 450);
  };

  useEffect(() => {
    handleSearch(initialPnr, initialLastName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateBaggageData = (pnr: string, lastName: string): BaggageBookingData => {
    const capitalizedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
    const isReddy = capitalizedLastName.toLowerCase().includes("reddy") || pnr === "QX7A2K";
    const isKapoor = capitalizedLastName.toLowerCase().includes("kapoor") || pnr === "DL914A";

    const origin = isReddy ? "BOM" : isKapoor ? "BLR" : "DEL";
    const originCity = isReddy ? "Mumbai" : isKapoor ? "Bengaluru" : "New Delhi";
    const dest = isReddy ? "DXB" : isKapoor ? "SIN" : "LHR";
    const destCity = isReddy ? "Dubai" : isKapoor ? "Singapore" : "London";
    const flightNo = isReddy ? "SW811" : isKapoor ? "SW305" : "SW128";
    const arrivalTerminal = isReddy ? "T3" : isKapoor ? "T2" : "T2";
    const carousel = isReddy ? "Belt 7" : isKapoor ? "Belt 3" : "Carousel 4";

    const bag1Tag = `0124-${pnr}-01`;
    const bag2Tag = `0124-${pnr}-02`;

    const bag1Milestones: BaggageMilestone[] = [
      {
        id: "m1",
        stage: "checkin",
        title: "Bag Tag Issued & Checked In",
        location: `${originCity} (${origin})`,
        airportCode: origin,
        terminal: "Terminal 3",
        timestamp: "06:45 AM",
        completed: true,
        details: "Bag checked at Counter 14 by agent Priya S.",
        stationOrBelt: "Counter 14",
      },
      {
        id: "m2",
        stage: "security",
        title: "Automated Screening & Security Cleared",
        location: `${originCity} (${origin})`,
        airportCode: origin,
        terminal: "Baggage Handling Matrix",
        timestamp: "07:12 AM",
        completed: true,
        details: "Passed Level 3 Dual-Energy X-Ray & Explosive Trace screening.",
        stationOrBelt: "BHS Sort Station 04",
      },
      {
        id: "m3",
        stage: "loaded",
        title: "Loaded onto Aircraft Cargo Hold",
        location: `${originCity} (${origin})`,
        airportCode: origin,
        terminal: "Apron Stand 28",
        timestamp: "08:05 AM",
        completed: true,
        active: isKapoor,
        details: `Loaded into ULD #AKE-98124 on flight ${flightNo} (Aft Hold 2).`,
        stationOrBelt: "Ramp Loader 02",
      },
      {
        id: "m4",
        stage: "inflight",
        title: `In Flight (${origin} → ${dest})`,
        location: "Cruising 38,000 ft",
        airportCode: `${origin}-${dest}`,
        timestamp: "08:30 AM – 15:45 PM",
        completed: isReddy,
        active: !isReddy && !isKapoor,
        details: `Secured in pressurized cargo hold of ${flightNo}.`,
      },
      {
        id: "m5",
        stage: "unloaded",
        title: "Arrived & Unloaded to Ramp",
        location: `${destCity} (${dest})`,
        airportCode: dest,
        terminal: arrivalTerminal,
        timestamp: "15:55 PM",
        completed: isReddy,
        active: false,
        details: `Baggage container transferred to Terminal ${arrivalTerminal} ground handling.`,
        stationOrBelt: "Ramp Tug #14",
      },
      {
        id: "m6",
        stage: "carousel",
        title: "Delivered to Baggage Carousel",
        location: `${destCity} (${dest})`,
        airportCode: dest,
        terminal: arrivalTerminal,
        timestamp: isReddy ? "16:10 PM" : "Est. 16:15 PM",
        completed: isReddy,
        active: isReddy,
        details: isReddy
          ? `Bags currently delivering on ${carousel}. Please collect your baggage.`
          : `Scheduled for delivery on ${carousel} upon flight touchdown.`,
        stationOrBelt: carousel,
      },
    ];

    const bag2Milestones = [...bag1Milestones];

    const bag1Status = isReddy ? "Ready for Pickup" : isKapoor ? "Loaded on Aircraft" : "In Flight";
    const bag2Status = isReddy ? "Ready for Pickup" : isKapoor ? "Loaded on Aircraft" : "In Flight";

    return {
      pnr,
      passengerLastName: capitalizedLastName,
      passengerFullName: `${capitalizedLastName === "Reddy" ? "Arjun" : capitalizedLastName === "Kapoor" ? "Rohit" : "Ananya"} ${capitalizedLastName}`,
      passengerEmail: `${capitalizedLastName.toLowerCase()}@skyway-travel.com`,
      flightNumber: flightNo,
      flightDate: format(new Date(), "yyyy-MM-dd"),
      origin,
      originCity,
      destination: dest,
      destinationCity: destCity,
      departureTime: "08:30",
      arrivalTime: "15:45",
      bags: [
        {
          tagNumber: bag1Tag,
          bagIndex: 1,
          totalBags: 2,
          weightKg: 21.4,
          weightAllowanceKg: 23.0,
          type: "Large Hard-shell Trolley",
          color: "Navy Blue",
          status: bag1Status,
          currentLocation: isReddy ? `${destCity} (${dest}) ${carousel}` : !isKapoor ? "In Flight En Route" : `${originCity} (${origin}) Cargo Hold`,
          flightNumber: flightNo,
          originCode: origin,
          destinationCode: dest,
          arrivalTerminal,
          baggageCarousel: carousel,
          estimatedDeliveryTime: "16:15 PM",
          milestones: bag1Milestones,
        },
        {
          tagNumber: bag2Tag,
          bagIndex: 2,
          totalBags: 2,
          weightKg: 18.2,
          weightAllowanceKg: 23.0,
          type: "Medium Soft Suitcase",
          color: "Charcoal Grey",
          status: bag2Status,
          currentLocation: isReddy ? `${destCity} (${dest}) ${carousel}` : !isKapoor ? "In Flight En Route" : `${originCity} (${origin}) Cargo Hold`,
          flightNumber: flightNo,
          originCode: origin,
          destinationCode: dest,
          arrivalTerminal,
          baggageCarousel: carousel,
          estimatedDeliveryTime: "16:15 PM",
          milestones: bag2Milestones,
        },
      ],
    };
  };

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  const handleQuickSelect = (pnr: string, lastName: string) => {
    setPnrInput(pnr);
    setLastNameInput(lastName);
    handleSearch(pnr, lastName);
  };

  const getStatusBadgeColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("ready") || s.includes("carousel") || s.includes("delivered") || s.includes("claimed")) {
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300";
    }
    if (s.includes("flight") || s.includes("transit") || s.includes("en route")) {
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300";
    }
    if (s.includes("loaded") || s.includes("security") || s.includes("checked")) {
      return "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300";
    }
    if (s.includes("delayed") || s.includes("hold") || s.includes("customs")) {
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300";
    }
    return "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200";
  };

  const activeBag = baggageData?.bags[selectedBagIndex] || baggageData?.bags[0];

  return (
    <div id={`baggage-tracker-${compId}`} className={cn("w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300", className)}>
      {/* 1. Top Search Header Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                <Luggage className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Checked Baggage Live Tracker
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Track the exact location, security clearance, aircraft loading, and baggage belt for your bags
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Live Telemetry</span>
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* Form Inputs */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-end">
          {/* PNR Field */}
          <div className="sm:col-span-5">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Booking Reference (PNR)
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Ticket className="h-4 w-4" />
              </div>
              <Input
                id="baggage-pnr-input"
                placeholder="e.g. SW8K2P"
                value={pnrInput}
                onChange={(e) => setPnrInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                maxLength={8}
                className="h-12 pl-10 font-mono text-sm font-bold uppercase tracking-wider dark:bg-slate-800"
              />
            </div>
          </div>

          {/* Last Name Field */}
          <div className="sm:col-span-4">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Passenger Last Name
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <Input
                id="baggage-lastname-input"
                placeholder="e.g. Sharma, Reddy"
                value={lastNameInput}
                onChange={(e) => setLastNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-12 pl-10 text-sm font-medium dark:bg-slate-800"
              />
            </div>
          </div>

          {/* Track Bags Button */}
          <div className="sm:col-span-3">
            <Button
              type="button"
              id="btn-track-baggage-submit"
              onClick={() => handleSearch()}
              disabled={loading}
              className="h-12 w-full rounded-xl bg-blue-600 font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <span>Track Bags</span>
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Demo Quick Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium mr-1">Quick Demos:</span>
          {SAMPLE_BOOKINGS.map((sample) => (
            <button
              key={sample.pnr}
              type="button"
              onClick={() => handleQuickSelect(sample.pnr, sample.lastName)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors",
                pnrInput === sample.pnr
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300"
              )}
            >
              <span className="font-mono">{sample.pnr}</span>
              <span className="text-[10px] text-slate-400">({sample.lastName})</span>
              <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-1 text-[9px]">
                {sample.status}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* 2. Main Tracking Manifest & Bag Cards */}
      {baggageData && activeBag && (
        <div className="space-y-6">
          {/* Passenger & Flight Overview Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 font-bold text-sm">
                {baggageData.passengerLastName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Traveler & Flight</span>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {baggageData.passengerFullName} &bull; Flight {baggageData.flightNumber}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-600 dark:text-slate-400">
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Route</span>
                <span className="font-bold text-slate-900 dark:text-slate-200">
                  {baggageData.origin} → {baggageData.destination}
                </span>
              </div>
              <div className="h-7 w-[1px] bg-slate-200 dark:bg-slate-800" />
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Total Checked Bags</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {baggageData.bags.length} Bags ({baggageData.bags.reduce((a, b) => a + b.weightKg, 0).toFixed(1)} kg)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNotificationsActive(!notificationsActive)}
                className={cn(
                  "gap-1.5 rounded-xl text-xs font-semibold",
                  notificationsActive && "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300"
                )}
              >
                <Bell className="h-3.5 w-3.5" />
                <span>{notificationsActive ? "Live SMS Alert Active" : "Get Belt Alert"}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReportModalOpen(true)}
                className="gap-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Baggage Help</span>
              </Button>
            </div>
          </div>

          {/* Multiple Bag Selector Tabs if > 1 Bag */}
          {baggageData.bags.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Select Bag:</span>
              {baggageData.bags.map((bag, idx) => (
                <button
                  key={bag.tagNumber}
                  type="button"
                  onClick={() => setSelectedBagIndex(idx)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all shadow-sm",
                    selectedBagIndex === idx
                      ? "border-blue-600 bg-blue-600 text-white shadow-blue-600/20"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  )}
                >
                  <Luggage className="h-3.5 w-3.5" />
                  <span>Bag {bag.bagIndex} of {bag.totalBags}</span>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px]",
                    selectedBagIndex === idx ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  )}>
                    {bag.weightKg} kg
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 3. Selected Bag Status Card */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* Bag Tag Header Banner */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40 gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100">
                  <Luggage className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bag Tag:</span>
                    <span className="font-mono text-base font-black text-slate-900 dark:text-slate-100">
                      {activeBag.tagNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyTag(activeBag.tagNumber)}
                      className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Copy Bag Tag"
                    >
                      {copiedTag === activeBag.tagNumber ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    {activeBag.type} &bull; {activeBag.color} &bull; {activeBag.weightKg} kg (Allowance {activeBag.weightAllowanceKg} kg)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className={cn("px-3 py-1 text-xs font-bold border", getStatusBadgeColor(activeBag.status))}>
                  {activeBag.status}
                </Badge>
              </div>
            </div>

            {/* Arrival Carousel & Belt Delivery Highlight Box */}
            <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-white p-6 dark:border-slate-800 dark:from-slate-850 dark:via-slate-900 dark:to-slate-900">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 items-center">
                {/* Carousel Card */}
                <div className="flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Baggage Carousel
                    </span>
                    <h4 className="text-lg font-black text-blue-600 dark:text-blue-400">
                      {activeBag.baggageCarousel}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {activeBag.destinationCode} &bull; Terminal {activeBag.arrivalTerminal}
                    </p>
                  </div>
                </div>

                {/* Delivery Time */}
                <div className="flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Estimated Belt Time
                    </span>
                    <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">
                      {activeBag.estimatedDeliveryTime}
                    </h4>
                    <p className="text-[11px] text-emerald-600 font-semibold">
                      On Schedule
                    </p>
                  </div>
                </div>

                {/* Barcode & Security Stamp */}
                <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                      <QrCode className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        IATA Bag Scan
                      </span>
                      <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {activeBag.tagNumber}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                        <ShieldCheck className="h-3 w-3" /> Screened & Cleared
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Detailed Live Journey Timeline */}
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Live Baggage Tracking Timeline
                  </h4>
                  <p className="text-xs text-slate-400">
                    Chronological airport baggage handling scans from origin check-in to arrival carousel
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearch()}
                  className="gap-1.5 rounded-xl text-xs font-semibold"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                  <span>Refresh Scans</span>
                </Button>
              </div>

              {/* Step Timeline Container */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800">
                {activeBag.milestones.map((m, idx) => {
                  return (
                    <div key={m.id} className="relative flex items-start gap-4">
                      {/* Node Dot Icon */}
                      <div
                        className={cn(
                          "absolute -left-6 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                          m.completed
                            ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                            : m.active
                            ? "border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950 animate-pulse"
                            : "border-slate-300 bg-white text-slate-300 dark:border-slate-700 dark:bg-slate-900"
                        )}
                      >
                        {m.completed ? (
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        ) : m.active ? (
                          <Plane className="h-3 w-3 rotate-90" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                        )}
                      </div>

                      {/* Milestone Content Card */}
                      <div
                        className={cn(
                          "flex-1 rounded-2xl border p-4 transition-all",
                          m.active
                            ? "border-blue-200 bg-blue-50/40 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/20"
                            : m.completed
                            ? "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900"
                            : "border-slate-100 bg-slate-50/50 opacity-60 dark:border-slate-800/40 dark:bg-slate-900/40"
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h5 className={cn("text-xs font-extrabold", m.active ? "text-blue-700 dark:text-blue-300" : "text-slate-900 dark:text-slate-100")}>
                              {m.title}
                            </h5>
                            {m.active && (
                              <Badge className="bg-blue-600 text-white text-[10px] font-bold">
                                Current Stage
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                            {m.timestamp}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                          {m.details}
                        </p>

                        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {m.location}
                          </span>
                          {m.terminal && (
                            <>
                              <span>&bull;</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {m.terminal}
                              </span>
                            </>
                          )}
                          {m.stationOrBelt && (
                            <>
                              <span>&bull;</span>
                              <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                {m.stationOrBelt}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-wrap items-center justify-between border-t border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-800/40 gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Protected by SkyWay Baggage Guarantee & Real-time Scan Network</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReportModalOpen(true)}
                  className="rounded-xl text-xs font-semibold text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-900/60 dark:hover:bg-amber-950/40"
                >
                  Report Delay / Issue
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Baggage Issue / Help Report Modal Dialog */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {reportSubmitted ? (
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Baggage Claim File Created
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Reference File: <span className="font-mono font-bold text-slate-900 dark:text-slate-100">PIR-SW-{baggageData?.pnr || "89204"}</span>
                  </p>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    Our ground baggage desk at {baggageData?.destinationCity} ({baggageData?.destination}) has been notified. You will receive real-time SMS updates.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setReportModalOpen(false);
                    setReportSubmitted(false);
                  }}
                  className="w-full rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                >
                  Close & Continue Tracking
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Report Baggage Issue
                  </h3>
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Issue Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setReportType("delayed")}
                        className={cn(
                          "rounded-xl border p-2 text-center text-xs font-semibold transition-colors",
                          reportType === "delayed"
                            ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            : "border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-800"
                        )}
                      >
                        Delayed Bag
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportType("damaged")}
                        className={cn(
                          "rounded-xl border p-2 text-center text-xs font-semibold transition-colors",
                          reportType === "damaged"
                            ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            : "border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-800"
                        )}
                      >
                        Damaged Bag
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportType("missing_item")}
                        className={cn(
                          "rounded-xl border p-2 text-center text-xs font-semibold transition-colors",
                          reportType === "missing_item"
                            ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            : "border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-800"
                        )}
                      >
                        Item Missing
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Bag Tag Reference
                    </label>
                    <Input
                      readOnly
                      value={activeBag?.tagNumber || "0124-SW-892401"}
                      className="h-10 font-mono text-xs bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Description / Delivery Address
                    </label>
                    <textarea
                      rows={3}
                      value={reportNotes}
                      onChange={(e) => setReportNotes(e.target.value)}
                      placeholder="Provide suitcase color, brand, or local hotel/home delivery address..."
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={() => setReportSubmitted(true)}
                    className="w-full rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
                  >
                    Submit Baggage Incident Report
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BaggageTracker;
