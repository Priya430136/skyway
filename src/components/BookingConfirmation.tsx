import React, { useState, useId } from "react";
import {
  CheckCircle2,
  Plane,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Luggage,
  Utensils,
  Download,
  Printer,
  QrCode,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Ticket,
  Copy,
  Check,
  Share2,
  Award,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface BookingConfirmationProps {
  booking: {
    pnr: string;
    flightNumber: string;
    passengerName: string;
    passengerEmail: string;
    passengerPhone?: string;
    seatNumber?: string;
    seat?: string;
    cabinClass: string;
    isCheckedIn?: boolean;
    baggageCount?: number;
    specialAssistance?: string;
    mealPreference?: string;
    totalPaid?: number;
    currency?: string;
    bookingDate?: string;
    status?: string;
    flight?: {
      flightNumber?: string;
      originCode?: string;
      origin?: string;
      destinationCode?: string;
      destination?: string;
      originCity?: string;
      destinationCity?: string;
      departureTime?: string;
      arrivalTime?: string;
      duration?: string;
      aircraft?: string;
      gate?: string;
      terminal?: string;
      baggageCarousel?: string;
    };
    passenger?: {
      id?: string;
      fullName?: string;
      email?: string;
      phone?: string;
      passportNumber?: string;
      nationality?: string;
      loyaltyTier?: string;
      milesBalance?: number;
    };
  };
  onCheckInNow?: (pnr: string) => void;
  onDownloadTicket?: () => void;
  onPrint?: () => void;
  onBookAnother?: () => void;
  onViewAllBookings?: () => void;
  className?: string;
}

export function BookingConfirmation({
  booking,
  onCheckInNow,
  onDownloadTicket,
  onPrint,
  onBookAnother,
  onViewAllBookings,
  className,
}: BookingConfirmationProps) {
  const compId = useId();
  const [copiedPnr, setCopiedPnr] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Normalize flight details
  const pnr = booking.pnr || "SW8K2P";
  const seat = booking.seatNumber || booking.seat || "12A";
  const flightNo = booking.flightNumber || booking.flight?.flightNumber || "SW128";
  const originCode = booking.flight?.originCode || booking.flight?.origin || "DEL";
  const originCity = booking.flight?.originCity || (originCode === "DEL" ? "New Delhi" : originCode);
  const destCode = booking.flight?.destinationCode || booking.flight?.destination || "LHR";
  const destCity = booking.flight?.destinationCity || (destCode === "LHR" ? "London" : destCode);
  const depTime = booking.flight?.departureTime || "08:30";
  const arrTime = booking.flight?.arrivalTime || "15:45";
  const duration = booking.flight?.duration || "7h 15m";
  const aircraft = booking.flight?.aircraft || "Boeing 787-9 Dreamliner";
  const terminal = booking.flight?.terminal || "T3";
  const gate = booking.flight?.gate || "B08";
  const bookingDate = booking.bookingDate || new Date().toISOString().split("T")[0];
  const totalPaid = booking.totalPaid ?? 42900;
  const currency = booking.currency || "INR";
  const baggageCount = booking.baggageCount ?? 1;
  const earnedMiles = Math.round(totalPaid * 0.1);

  const handleCopyPNR = () => {
    navigator.clipboard.writeText(pnr);
    setCopiedPnr(true);
    setTimeout(() => setCopiedPnr(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `SkyWay Booking ${pnr}`,
          text: `My SkyWay flight ${flightNo} (${originCode} -> ${destCode}) is confirmed under PNR: ${pnr}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      handleCopyPNR();
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div
      id={`booking-confirmation-${compId}`}
      className={cn("w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300", className)}
    >
      {/* 1. Top Success Banner Card */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-500/10 via-emerald-50/50 to-white p-6 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 md:p-8">
        <div className="flex flex-col items-center text-center md:flex-row md:items-start md:text-left md:justify-between gap-6">
          <div className="flex flex-col items-center md:flex-row md:items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 dark:bg-emerald-500">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  Booking Confirmed!
                </h2>
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold border-emerald-200">
                  Ticket Issued
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                A confirmation email and e-ticket have been sent to{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {booking.passengerEmail}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 rounded-xl border-slate-200 bg-white text-xs font-semibold shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / PDF</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-1.5 rounded-xl border-slate-200 bg-white text-xs font-semibold shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{shareSuccess ? "Link Copied!" : "Share"}</span>
            </Button>
          </div>
        </div>

        {/* PNR Code Pill Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200/70 bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:border-emerald-900/60 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Booking Reference (PNR)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-mono font-black tracking-widest text-slate-900 dark:text-slate-100">
                  {pnr}
                </span>
                <button
                  type="button"
                  id="btn-copy-pnr"
                  onClick={handleCopyPNR}
                  aria-label="Copy PNR reference"
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  {copiedPnr ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <div>
              <span className="block text-[10px] uppercase text-slate-400">Booking Date</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{bookingDate}</span>
            </div>
            <div className="h-7 w-[1px] bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="block text-[10px] uppercase text-slate-400">Status</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Confirmed</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Boarding Pass Card Structure */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-xs">
              SW
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                SkyWay Airlines &bull; Flight {flightNo}
              </h3>
              <p className="text-[11px] text-slate-400">{aircraft}</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-white text-xs font-bold text-blue-700 border-blue-200 dark:bg-slate-800 dark:text-blue-400 dark:border-slate-700">
            {booking.cabinClass} Class
          </Badge>
        </div>

        {/* Route Path & Timings */}
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6">
            {/* Origin */}
            <div className="text-left md:col-span-4">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {originCode}
              </span>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{originCity}</p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                <span className="font-bold text-slate-900 dark:text-slate-200">{depTime}</span>
                <span>Scheduled Departure</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Terminal {terminal} &bull; Gate {gate}</p>
            </div>

            {/* Flight Duration Graphic */}
            <div className="flex flex-col items-center justify-center md:col-span-4">
              <span className="text-xs font-semibold text-slate-500 mb-1">{duration}</span>
              <div className="relative flex w-full max-w-[200px] items-center">
                <div className="h-[2px] w-full bg-slate-200 dark:bg-slate-700" />
                <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-blue-50 p-1.5 text-blue-600 dark:bg-slate-800 dark:text-blue-400">
                  <Plane className="h-4 w-4 rotate-90" />
                </div>
              </div>
              <span className="mt-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                Non-Stop Direct
              </span>
            </div>

            {/* Destination */}
            <div className="text-left md:text-right md:col-span-4">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {destCode}
              </span>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{destCity}</p>
              <div className="mt-2 flex items-center md:justify-end gap-1.5 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5 text-indigo-600" />
                <span className="font-bold text-slate-900 dark:text-slate-200">{arrTime}</span>
                <span>Estimated Arrival</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Baggage: {booking.flight?.baggageCarousel || "Carousel 3"}
              </p>
            </div>
          </div>

          {/* Tear-line perforation divider */}
          <div className="relative my-6">
            <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-800" />
            <div className="absolute -left-9 -top-3.5 h-7 w-7 rounded-full bg-slate-100 border border-slate-200 dark:bg-slate-950 dark:border-slate-800" />
            <div className="absolute -right-9 -top-3.5 h-7 w-7 rounded-full bg-slate-100 border border-slate-200 dark:bg-slate-950 dark:border-slate-800" />
          </div>

          {/* Passenger & Ticket Attributes Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-6">
            {/* Passenger */}
            <div className="rounded-xl bg-slate-50/70 p-3.5 dark:bg-slate-800/50">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase">
                <User className="h-3 w-3" /> Passenger
              </span>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {booking.passengerName}
              </p>
              <span className="text-[10px] text-slate-400">Adult (12+ yrs)</span>
            </div>

            {/* Seat */}
            <div className="rounded-xl bg-slate-50/70 p-3.5 dark:bg-slate-800/50">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase">
                <Sparkles className="h-3 w-3" /> Seat Assigned
              </span>
              <p className="mt-1 text-base font-black text-blue-600 dark:text-blue-400">
                {seat}
              </p>
              <span className="text-[10px] text-slate-400">{booking.cabinClass} Cabin</span>
            </div>

            {/* Baggage */}
            <div className="rounded-xl bg-slate-50/70 p-3.5 dark:bg-slate-800/50">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase">
                <Luggage className="h-3 w-3" /> Baggage
              </span>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                {baggageCount} Checked Bag{baggageCount > 1 ? "s" : ""}
              </p>
              <span className="text-[10px] text-slate-400">+ 1 Hand Cabin bag</span>
            </div>

            {/* Meals / Assistance */}
            <div className="rounded-xl bg-slate-50/70 p-3.5 dark:bg-slate-800/50">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase">
                <Utensils className="h-3 w-3" /> Meal Service
              </span>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {booking.mealPreference || "Standard Meal"}
              </p>
              <span className="text-[10px] text-slate-400">
                {booking.specialAssistance || "Complimentary"}
              </span>
            </div>
          </div>
        </div>

        {/* Boarding Pass Bottom Bar with Simulated Barcode */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 bg-slate-50/70 p-6 dark:border-slate-800 dark:bg-slate-800/40 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
              <QrCode className="h-9 w-9 text-slate-900 dark:text-slate-100" />
            </div>
            <div className="text-left">
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                {pnr}-{seat}-{flightNo}
              </span>
              <p className="text-[11px] text-slate-400">Scan at kiosk or automated boarding gate</p>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex items-center gap-2.5">
            {onCheckInNow && (
              <Button
                type="button"
                id="btn-checkin-direct"
                onClick={() => onCheckInNow(pnr)}
                className="rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
              >
                Web Check-in Now
              </Button>
            )}
            {onDownloadTicket && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onDownloadTicket}
                className="gap-1.5 rounded-xl text-xs font-semibold"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Save Pass</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Loyalty Reward & Fare Breakdown Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* SkyMiles Loyalty Card */}
        <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-500/10 via-amber-50/40 to-white p-6 dark:border-amber-900/50 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                SkyWay Club Loyalty
              </span>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                +{earnedMiles.toLocaleString("en-IN")} Miles Credited
              </h4>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
            These miles have been credited to your frequent flyer account for{" "}
            <span className="font-semibold">{booking.passengerEmail}</span> and can be redeemed for
            cabin upgrades and free flights.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <ShieldCheck className="h-4 w-4" />
            <span>Tier Status: Silver Member</span>
          </div>
        </div>

        {/* Payment Summary Box */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Payment Breakdown</h4>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Base Airfare ({booking.cabinClass})</span>
              <span className="font-medium text-slate-900 dark:text-slate-200">
                ₹{Math.round(totalPaid * 0.82).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Aviation Security & Airport Taxes</span>
              <span className="font-medium text-slate-900 dark:text-slate-200">
                ₹{Math.round(totalPaid * 0.18).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Seat Selection & Baggage Allowance</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">Included</span>
            </div>
            <div className="border-t border-slate-100 pt-2 dark:border-slate-800 flex justify-between text-sm font-bold text-slate-900 dark:text-slate-100">
              <span>Total Amount Paid</span>
              <span className="text-base text-blue-600 dark:text-blue-400">
                ₹{totalPaid.toLocaleString("en-IN")} {currency}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="font-bold text-[#635BFF]">Stripe</span> Verified Payment
            </span>
            <span className="font-semibold text-emerald-600">Settled (TXN: {pnr}99)</span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Navigational Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {onViewAllBookings && (
          <Button
            type="button"
            variant="outline"
            onClick={onViewAllBookings}
            className="rounded-xl text-xs font-semibold"
          >
            View All My Bookings
          </Button>
        )}
        {onBookAnother && (
          <Button
            type="button"
            onClick={onBookAnother}
            className="ml-auto rounded-xl bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Book Another Flight
          </Button>
        )}
      </div>
    </div>
  );
}

export default BookingConfirmation;
