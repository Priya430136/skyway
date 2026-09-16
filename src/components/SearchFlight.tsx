import React, { useState, useEffect, useId } from "react";
import { format, addDays, isBefore, startOfToday } from "date-fns";
import {
  PlaneTakeoff,
  PlaneLanding,
  Calendar as CalendarIcon,
  Users,
  Search,
  ArrowRightLeft,
  Luggage,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Plane,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { POPULAR_AIRPORTS } from "@/lib/airports";

export interface FlightResult {
  flightNumber: string;
  origin?: string;
  originCode?: string;
  originCity?: string;
  destination?: string;
  destinationCode?: string;
  destinationCity?: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  aircraft: string;
  status: string;
  gate?: string;
  terminal?: string;
  priceEconomy: number;
  pricePremium: number;
  priceBusiness: number;
  priceFirst: number;
  seatsAvailable?: {
    economy: number;
    premium: number;
    business: number;
    first: number;
  };
  seatsEconomyAvailable?: number;
  seatsPremiumAvailable?: number;
  seatsBusinessAvailable?: number;
  seatsFirstAvailable?: number;
  onTimePct?: number;
  baggageCarousel?: string;
}

export interface SearchFlightProps {
  initialOrigin?: string;
  initialDestination?: string;
  initialDepartureDate?: Date;
  initialReturnDate?: Date;
  initialCabin?: "Economy" | "Premium" | "Business" | "First";
  initialPassengers?: number;
  tripType?: "oneWay" | "roundTrip";
  compact?: boolean;
  autoSearchOnMount?: boolean;
  onFlightSelect?: (flight: FlightResult, searchMeta: FlightSearchMeta) => void;
  onSearchResultsChange?: (results: FlightResult[]) => void;
  className?: string;
}

export interface FlightSearchMeta {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  cabin: string;
  passengers: number;
  tripType: "oneWay" | "roundTrip";
}

export function SearchFlight({
  initialOrigin = "DEL",
  initialDestination = "LHR",
  initialDepartureDate,
  initialReturnDate,
  initialCabin = "Economy",
  initialPassengers = 1,
  tripType: initialTripType = "oneWay",
  compact = false,
  autoSearchOnMount = false,
  onFlightSelect,
  onSearchResultsChange,
  className,
}: SearchFlightProps) {
  const compId = useId();
  const today = startOfToday();

  // State
  const [tripType, setTripType] = useState<"oneWay" | "roundTrip">(initialTripType);
  const [origin, setOrigin] = useState<string>(initialOrigin.toUpperCase());
  const [destination, setDestination] = useState<string>(initialDestination.toUpperCase());
  const [departureDate, setDepartureDate] = useState<Date>(initialDepartureDate || addDays(today, 3));
  const [returnDate, setReturnDate] = useState<Date>(initialReturnDate || addDays(today, 10));
  const [cabin, setCabin] = useState<"Economy" | "Premium" | "Business" | "First">(initialCabin);
  const [passengers, setPassengers] = useState<number>(initialPassengers);

  // Airport dropdown popovers
  const [originOpen, setOriginOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [originSearchText, setOriginSearchText] = useState("");
  const [destSearchText, setDestSearchText] = useState("");

  // Results & Loading
  const [flights, setFlights] = useState<FlightResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedFlightNumber, setSelectedFlightNumber] = useState<string | null>(null);

  // Filter airport helpers
  const filteredOrigins = POPULAR_AIRPORTS.filter(
    (a) =>
      a.code.toLowerCase().includes(originSearchText.toLowerCase()) ||
      a.city.toLowerCase().includes(originSearchText.toLowerCase()) ||
      a.name.toLowerCase().includes(originSearchText.toLowerCase())
  );

  const filteredDests = POPULAR_AIRPORTS.filter(
    (a) =>
      a.code.toLowerCase().includes(destSearchText.toLowerCase()) ||
      a.city.toLowerCase().includes(destSearchText.toLowerCase()) ||
      a.name.toLowerCase().includes(destSearchText.toLowerCase())
  );

  const swapAirports = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const executeSearch = async () => {
    if (!origin || !destination) {
      setError("Please select both origin and destination airports.");
      return;
    }
    if (origin === destination) {
      setError("Origin and destination airports cannot be identical.");
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const formattedDate = format(departureDate, "yyyy-MM-dd");
      const searchUrl = `/api/flights/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(
        destination
      )}&cabin=${encodeURIComponent(cabin)}&date=${encodeURIComponent(formattedDate)}&pax=${passengers}`;

      const res = await fetch(searchUrl);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      let results: FlightResult[] = [];

      if (data.success && Array.isArray(data.flights)) {
        results = data.flights;
      } else if (Array.isArray(data)) {
        results = data;
      }

      // If exact search yielded 0 items, fallback to fetching all flights and filtering
      if (results.length === 0) {
        const allRes = await fetch("/api/flights");
        if (allRes.ok) {
          const allData = await allRes.json();
          if (allData.flights && Array.isArray(allData.flights)) {
            results = allData.flights.filter(
              (f: any) =>
                (f.origin === origin || f.originCode === origin) &&
                (f.destination === destination || f.destinationCode === destination)
            );
          }
        }
      }

      setFlights(results);
      if (onSearchResultsChange) {
        onSearchResultsChange(results);
      }
    } catch (err: any) {
      console.error("Flight search error:", err);
      setError("Unable to retrieve flight schedules. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoSearchOnMount) {
      executeSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectFlight = (flight: FlightResult) => {
    setSelectedFlightNumber(flight.flightNumber);
    if (onFlightSelect) {
      onFlightSelect(flight, {
        origin,
        destination,
        departureDate: format(departureDate, "yyyy-MM-dd"),
        returnDate: tripType === "roundTrip" ? format(returnDate, "yyyy-MM-dd") : undefined,
        cabin,
        passengers,
        tripType,
      });
    }
  };

  const getPriceForCabin = (flight: FlightResult) => {
    switch (cabin) {
      case "Premium":
        return flight.pricePremium || Math.round(flight.priceEconomy * 1.5);
      case "Business":
        return flight.priceBusiness || flight.priceEconomy * 3;
      case "First":
        return flight.priceFirst || flight.priceEconomy * 5;
      case "Economy":
      default:
        return flight.priceEconomy;
    }
  };

  const getSeatsLeft = (flight: FlightResult) => {
    if (flight.seatsAvailable) {
      const key = cabin === "Premium" ? "premium" : (cabin.toLowerCase() as "economy" | "business" | "first");
      return flight.seatsAvailable[key] ?? 12;
    }
    if (cabin === "Economy") return flight.seatsEconomyAvailable ?? 45;
    if (cabin === "Premium") return flight.seatsPremiumAvailable ?? 15;
    if (cabin === "Business") return flight.seatsBusinessAvailable ?? 8;
    if (cabin === "First") return flight.seatsFirstAvailable ?? 4;
    return 10;
  };

  const originAirportObj = POPULAR_AIRPORTS.find((a) => a.code === origin);
  const destAirportObj = POPULAR_AIRPORTS.find((a) => a.code === destination);

  return (
    <div id={`search-flight-component-${compId}`} className={cn("w-full space-y-6", className)}>
      {/* Search Input Box Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
        {/* Top Controls: Trip Type & Cabin & Pax */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          {/* Trip Type Tabs */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              id="btn-trip-oneway"
              onClick={() => setTripType("oneWay")}
              className={cn(
                "rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all",
                tripType === "oneWay"
                  ? "bg-white text-blue-700 shadow-sm dark:bg-slate-700 dark:text-blue-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              One Way
            </button>
            <button
              type="button"
              id="btn-trip-roundtrip"
              onClick={() => setTripType("roundTrip")}
              className={cn(
                "rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all",
                tripType === "roundTrip"
                  ? "bg-white text-blue-700 shadow-sm dark:bg-slate-700 dark:text-blue-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              Round Trip
            </button>
          </div>

          {/* Cabin & Passenger Selectors */}
          <div className="flex items-center gap-3">
            {/* Passengers */}
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-slate-400" />
              <Select value={String(passengers)} onValueChange={(val) => setPassengers(Number(val))}>
                <SelectTrigger id="pax-select" className="h-8 w-28 text-xs font-medium">
                  <SelectValue placeholder="Passengers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Passenger</SelectItem>
                  <SelectItem value="2">2 Passengers</SelectItem>
                  <SelectItem value="3">3 Passengers</SelectItem>
                  <SelectItem value="4">4 Passengers</SelectItem>
                  <SelectItem value="5">5 Passengers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cabin Class */}
            <div className="flex items-center gap-1.5">
              <Select value={cabin} onValueChange={(val: any) => setCabin(val)}>
                <SelectTrigger id="cabin-select" className="h-8 w-36 text-xs font-medium">
                  <SelectValue placeholder="Cabin Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Economy">Economy</SelectItem>
                  <SelectItem value="Premium">Premium Economy</SelectItem>
                  <SelectItem value="Business">Business Class</SelectItem>
                  <SelectItem value="First">First Class</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Core Flight Search Fields Grid */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-center">
          {/* Origin Airport Input */}
          <div className="relative md:col-span-3">
            <Label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              From (Origin)
            </Label>
            <Popover open={originOpen} onOpenChange={setOriginOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  id="origin-airport-button"
                  className="flex h-14 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-left transition-colors hover:bg-slate-100/70 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                      <PlaneTakeoff className="h-4 w-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {origin}
                        </span>
                        <span className="text-xs font-medium text-slate-500 truncate">
                          {originAirportObj?.city || origin}
                        </span>
                      </div>
                      <p className="truncate text-[11px] text-slate-400">
                        {originAirportObj?.name || "Selected departure hub"}
                      </p>
                    </div>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-2" align="start">
                <div className="p-1">
                  <Input
                    placeholder="Search city or airport code..."
                    value={originSearchText}
                    onChange={(e) => setOriginSearchText(e.target.value)}
                    className="mb-2 h-8 text-xs"
                    autoFocus
                  />
                  <div className="max-h-60 space-y-1 overflow-y-auto">
                    {filteredOrigins.map((a) => (
                      <button
                        key={a.code}
                        type="button"
                        onClick={() => {
                          setOrigin(a.code);
                          setOriginOpen(false);
                          setOriginSearchText("");
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                          origin === a.code && "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                        )}
                      >
                        <div>
                          <span className="font-bold">{a.city}</span> ({a.code})
                          <p className="text-[11px] text-slate-500 truncate">{a.name}</p>
                        </div>
                        {origin === a.code && <Check className="h-4 w-4 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Swap Airport Button */}
          <div className="flex justify-center md:col-span-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              id="swap-airports-btn"
              onClick={swapAirports}
              aria-label="Swap origin and destination"
              className="h-10 w-10 shrink-0 rounded-full border-slate-200 bg-white shadow-sm hover:bg-blue-50 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Destination Airport Input */}
          <div className="relative md:col-span-3">
            <Label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              To (Destination)
            </Label>
            <Popover open={destOpen} onOpenChange={setDestOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  id="destination-airport-button"
                  className="flex h-14 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-left transition-colors hover:bg-slate-100/70 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                      <PlaneLanding className="h-4 w-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {destination}
                        </span>
                        <span className="text-xs font-medium text-slate-500 truncate">
                          {destAirportObj?.city || destination}
                        </span>
                      </div>
                      <p className="truncate text-[11px] text-slate-400">
                        {destAirportObj?.name || "Selected arrival hub"}
                      </p>
                    </div>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-2" align="start">
                <div className="p-1">
                  <Input
                    placeholder="Search city or airport code..."
                    value={destSearchText}
                    onChange={(e) => setDestSearchText(e.target.value)}
                    className="mb-2 h-8 text-xs"
                    autoFocus
                  />
                  <div className="max-h-60 space-y-1 overflow-y-auto">
                    {filteredDests.map((a) => (
                      <button
                        key={a.code}
                        type="button"
                        onClick={() => {
                          setDestination(a.code);
                          setDestOpen(false);
                          setDestSearchText("");
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                          destination === a.code && "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400"
                        )}
                      >
                        <div>
                          <span className="font-bold">{a.city}</span> ({a.code})
                          <p className="text-[11px] text-slate-500 truncate">{a.name}</p>
                        </div>
                        {destination === a.code && <Check className="h-4 w-4 text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Departure Date Picker */}
          <div className={cn("relative", tripType === "roundTrip" ? "md:col-span-2" : "md:col-span-3")}>
            <Label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Departure Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="departure-date-picker-btn"
                  variant="outline"
                  className="h-14 w-full justify-start rounded-xl border-slate-200 bg-slate-50/50 px-3.5 text-left font-normal hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <CalendarIcon className="h-4 w-4 text-slate-500" />
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {format(departureDate, "dd MMM yyyy")}
                      </div>
                      <p className="text-[11px] text-slate-400">{format(departureDate, "EEEE")}</p>
                    </div>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={departureDate}
                  onSelect={(date) => {
                    if (date) {
                      setDepartureDate(date);
                      if (isBefore(returnDate, date)) {
                        setReturnDate(addDays(date, 7));
                      }
                    }
                  }}
                  disabled={(date) => isBefore(date, today)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Return Date Picker (When Round Trip) */}
          {tripType === "roundTrip" && (
            <div className="relative md:col-span-2">
              <Label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                Return Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="return-date-picker-btn"
                    variant="outline"
                    className="h-14 w-full justify-start rounded-xl border-slate-200 bg-slate-50/50 px-3.5 text-left font-normal hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <CalendarIcon className="h-4 w-4 text-slate-500" />
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {format(returnDate, "dd MMM yyyy")}
                        </div>
                        <p className="text-[11px] text-slate-400">{format(returnDate, "EEEE")}</p>
                      </div>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={returnDate}
                    onSelect={(date) => date && setReturnDate(date)}
                    disabled={(date) => isBefore(date, departureDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Search Trigger Button */}
          <div className={cn("md:flex md:items-end", tripType === "roundTrip" ? "md:col-span-1" : "md:col-span-2")}>
            <Button
              id="search-flights-submit-btn"
              onClick={executeSearch}
              disabled={loading}
              className="h-14 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <span className="text-sm">Search</span>
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Header / Summary */}
      {hasSearched && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Available Flights ({flights.length})
              </h3>
              <p className="text-xs text-slate-500">
                {origin} &rarr; {destination} &bull; {format(departureDate, "EEE, MMM d, yyyy")} &bull; {cabin} Class
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Badge variant="outline" className="gap-1 border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300">
                <ShieldCheck className="h-3 w-3 text-emerald-600" /> Best Fare Guaranteed
              </Badge>
            </div>
          </div>

          {/* Loading Skeleton / State */}
          {loading && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Searching available SkyWay flights...
              </p>
              <p className="text-xs text-slate-400">Comparing direct routes and real-time inventory</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && flights.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-slate-800 dark:bg-slate-900/50">
              <Plane className="mx-auto h-10 w-10 text-slate-400" />
              <h4 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                No direct flights found for {origin} to {destination}
              </h4>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                Try selecting different travel dates, switching to popular routes (e.g. DEL &harr; LHR, BOM &harr; DXB, BLR &harr; SIN), or adjusting your cabin class.
              </p>
            </div>
          )}

          {/* Flight Result Cards List */}
          {!loading && flights.length > 0 && (
            <div className="space-y-3.5">
              {flights.map((flight) => {
                const originCode = flight.originCode || flight.origin || origin;
                const destCode = flight.destinationCode || flight.destination || destination;
                const price = getPriceForCabin(flight);
                const seatsLeft = getSeatsLeft(flight);
                const isSelected = selectedFlightNumber === flight.flightNumber;

                return (
                  <div
                    key={flight.flightNumber}
                    id={`flight-card-${flight.flightNumber}`}
                    className={cn(
                      "group relative rounded-2xl border bg-white p-5 transition-all hover:shadow-md dark:bg-slate-900",
                      isSelected
                        ? "border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-400"
                        : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
                    )}
                  >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:items-center">
                      {/* Column 1: Flight & Aircraft Info */}
                      <div className="md:col-span-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                            {flight.flightNumber}
                          </span>
                          <span className="text-xs text-slate-500 truncate">{flight.aircraft}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                            <Sparkles className="h-3 w-3" /> {flight.onTimePct || 95}% On-Time
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-400">
                          Terminal {flight.terminal || "T3"} &bull; Gate {flight.gate || "TBD"}
                        </div>
                      </div>

                      {/* Column 2: Departure, Timeline Duration, Arrival */}
                      <div className="md:col-span-5">
                        <div className="flex items-center justify-between gap-2">
                          {/* Departure */}
                          <div className="text-left">
                            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                              {flight.departureTime}
                            </div>
                            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                              {originCode}
                            </div>
                            <p className="text-[10px] text-slate-400">
                              {flight.originCity || POPULAR_AIRPORTS.find((a) => a.code === originCode)?.city || originCode}
                            </p>
                          </div>

                          {/* Flight Duration Visual Graphic */}
                          <div className="flex flex-1 flex-col items-center px-3">
                            <span className="mb-1 text-[11px] font-medium text-slate-400">
                              {flight.duration}
                            </span>
                            <div className="relative flex w-full items-center">
                              <div className="h-[2px] w-full bg-slate-200 dark:bg-slate-700" />
                              <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-white p-0.5 dark:bg-slate-900">
                                <Plane className="h-3.5 w-3.5 rotate-90 text-blue-600 dark:text-blue-400" />
                              </div>
                            </div>
                            <span className="mt-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              Direct Flight
                            </span>
                          </div>

                          {/* Arrival */}
                          <div className="text-right">
                            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                              {flight.arrivalTime}
                            </div>
                            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                              {destCode}
                            </div>
                            <p className="text-[10px] text-slate-400">
                              {flight.destinationCity || POPULAR_AIRPORTS.find((a) => a.code === destCode)?.city || destCode}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Column 3: Pricing, Seats, & Select Action */}
                      <div className="flex flex-row items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800 md:col-span-4 md:flex-col md:items-end md:border-t-0 md:pt-0">
                        <div className="md:text-right">
                          <div className="text-xs text-slate-400">{cabin} from</div>
                          <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                            ₹{price.toLocaleString("en-IN")}
                          </div>
                          <div className="mt-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                            {seatsLeft <= 5 ? `Only ${seatsLeft} seats left!` : `${seatsLeft} seats available`}
                          </div>
                        </div>

                        <div className="mt-2">
                          <Button
                            type="button"
                            id={`select-flight-${flight.flightNumber}-btn`}
                            onClick={() => handleSelectFlight(flight)}
                            className={cn(
                              "rounded-xl px-4 py-2 text-xs font-semibold transition-all",
                              isSelected
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            )}
                          >
                            {isSelected ? (
                              <div className="flex items-center gap-1.5">
                                <Check className="h-3.5 w-3.5" /> Selected
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span>Select Flight</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                              </div>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Flight Perks Footer Bar */}
                    <div className="mt-3.5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500 dark:border-slate-800">
                      <span className="flex items-center gap-1">
                        <Luggage className="h-3.5 w-3.5 text-slate-400" />
                        {cabin === "Economy" ? "1x 23kg Baggage" : cabin === "Business" ? "2x 32kg Baggage" : "2x 23kg Baggage"}
                      </span>
                      <span>&bull;</span>
                      <span>Free In-flight Meals & Beverage</span>
                      <span>&bull;</span>
                      <span>Complimentary Wi-Fi Access</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchFlight;
