import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  MessageSquareHeart,
  Sparkles,
  PlaneLanding,
  Award,
  ThumbsUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Plus,
  RefreshCw,
  TrendingUp,
  Database,
  Calendar,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FlightFeedbackModal, FeedbackFlightTarget } from "./FlightFeedbackModal";
import { toast } from "sonner";

export interface PostFlightFeedbackViewProps {
  passengerInfo?: {
    name: string;
    email: string;
    milesBalance?: number;
  };
  pastFlights?: Array<{
    id: string;
    pnr: string;
    flightNumber: string;
    originCode: string;
    originCity: string;
    destinationCode: string;
    destinationCity: string;
    flightDate: string;
    departureTime: string;
    arrivalTime: string;
    seat: string;
    cabinClass: string;
  }>;
}

export function PostFlightFeedbackView({
  passengerInfo = {
    name: "Priya Sehrawat",
    email: "sehrawatpriya430@gmail.com",
    milesBalance: 89420,
  },
  pastFlights = [],
}: PostFlightFeedbackViewProps) {
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [summaryStats, setSummaryStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedFlightForFeedback, setSelectedFlightForFeedback] = useState<FeedbackFlightTarget | null>(null);

  const fetchFeedbackData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch user feedbacks
      const listRes = await fetch(`/api/feedback?email=${encodeURIComponent(passengerInfo.email)}`);
      if (listRes.ok) {
        const listData = await listRes.json();
        if (listData.success) {
          setFeedbackList(listData.feedback || []);
        }
      }

      // 2. Fetch summary stats
      const sumRes = await fetch("/api/feedback/summary");
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        if (sumData.success) {
          setSummaryStats(sumData);
        }
      }
    } catch (err) {
      console.error("Failed to load feedback from server:", err);
    } finally {
      setLoading(false);
    }
  }, [passengerInfo.email]);

  useEffect(() => {
    fetchFeedbackData();
  }, [fetchFeedbackData]);

  const handleOpenFlightFeedback = (flight: any) => {
    setSelectedFlightForFeedback({
      flightNumber: flight.flightNumber,
      pnr: flight.pnr,
      originCity: flight.originCity,
      originCode: flight.originCode,
      destinationCity: flight.destinationCity,
      destinationCode: flight.destinationCode,
      flightDate: flight.flightDate,
      cabinClass: flight.cabinClass,
    });
    setModalOpen(true);
  };

  const handleOpenGeneralFeedback = () => {
    setSelectedFlightForFeedback(null);
    setModalOpen(true);
  };

  const handleFeedbackSubmitted = (newFeedback: any) => {
    setFeedbackList((prev) => [newFeedback, ...prev]);
    fetchFeedbackData();
  };

  // Find past flights that have already been reviewed vs. pending
  const reviewedPnrs = new Set(
    feedbackList.map((f) => f.pnr?.toUpperCase()).filter(Boolean)
  );

  const pendingSurveyFlights = pastFlights.filter(
    (f) => !reviewedPnrs.has(f.pnr?.toUpperCase())
  );

  return (
    <div className="space-y-8">
      {/* 1. Header with Stats and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
              Post-Flight Satisfaction & Surveys
            </h2>
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-mono text-[10px] font-bold">
              <Database className="mr-1 h-3 w-3 text-blue-600" />
              PostgreSQL Table: Feedback
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit verified post-flight reviews, earn bonus frequent flyer SkyMiles, and monitor your past flight ratings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFeedbackData}
            className="rounded-xl text-xs font-semibold gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Sync DB
          </Button>

          <Button
            onClick={handleOpenGeneralFeedback}
            className="rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Submit Survey (+250 Miles)
          </Button>
        </div>
      </div>

      {/* 2. Satisfaction Metrics Summary Strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Overall Rating */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Passenger Score</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-slate-900 dark:text-slate-100">
              {summaryStats?.averageOverallRating || 4.9}
            </span>
            <span className="text-xs text-slate-400">/ 5.0</span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              High Excellence
            </span>
          </div>
        </div>

        {/* Net Promoter Score */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Airline NPS Score</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <ThumbsUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-slate-900 dark:text-slate-100">
              {summaryStats?.npsScore || 95}%
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Would Recommend
            </span>
          </div>
        </div>

        {/* Crew & Cleanliness Rating */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Crew & Service</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-slate-900 dark:text-slate-100">
              {summaryStats?.criteriaAverages?.flightCrew || 4.9}
            </span>
            <span className="text-xs text-slate-400">/ 5.0</span>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              Top Ranked
            </span>
          </div>
        </div>

        {/* Bonus Miles Incentive */}
        <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Survey Reward</span>
            <div className="rounded-lg bg-amber-500/20 p-2 text-amber-600 dark:text-amber-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-amber-600 dark:text-amber-400">+250</span>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">SkyMiles / Survey</span>
          </div>
        </div>
      </div>

      {/* 3. Section: Completed Flights Eligible for Survey */}
      {pendingSurveyFlights.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold dark:bg-amber-950 dark:text-amber-400">
                {pendingSurveyFlights.length}
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Journeys Awaiting Your Review
              </h3>
            </div>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
              Earn +250 SkyMiles for each completed survey
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {pendingSurveyFlights.map((flight) => (
              <div
                key={flight.id}
                className="flex flex-col justify-between rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5 transition-all hover:border-amber-300 hover:shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        {flight.flightNumber}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-bold border-amber-300 bg-amber-100/50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                        {flight.cabinClass}
                      </Badge>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {flight.flightDate}
                    </span>
                  </div>

                  <div className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                    {flight.originCity} ({flight.originCode}) &rarr; {flight.destinationCity} ({flight.destinationCode})
                  </div>

                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    <span>PNR: <strong className="font-mono text-slate-700 dark:text-slate-300">{flight.pnr}</strong></span>
                    <span>&bull;</span>
                    <span>Seat: <strong className="text-slate-700 dark:text-slate-300">{flight.seat}</strong></span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 font-semibold">
                    <Award className="h-3.5 w-3.5" />
                    <span>+250 Miles Reward</span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleOpenFlightFeedback(flight)}
                    className="rounded-xl bg-amber-500 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-sm"
                  >
                    <Star className="mr-1.5 h-3.5 w-3.5 fill-slate-950" />
                    Rate Flight
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Section: Submitted Feedback History in PostgreSQL */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Submitted Satisfaction Surveys ({feedbackList.length})
            </h3>
            <p className="text-xs text-slate-500">
              Verified passenger reviews stored in PostgreSQL <code className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">feedback</code> table
            </p>
          </div>
        </div>

        {feedbackList.length === 0 ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <MessageSquareHeart className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No Feedback Submitted Yet
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Share your satisfaction review for any recent flight to help us continuously elevate the SkyWay flying experience.
            </p>
            <Button
              onClick={handleOpenGeneralFeedback}
              className="rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Submit First Survey (+250 Miles)
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbackList.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900 p-6"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-slate-900 dark:text-slate-100">
                        {item.flightNumber || "SkyWay General Experience"}
                      </span>
                      {item.pnr && (
                        <Badge variant="outline" className="text-[10px] font-mono font-bold">
                          PNR: {item.pnr}
                        </Badge>
                      )}
                      <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Stored in PostgreSQL
                      </Badge>
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <span>Submitted by <strong>{item.passengerName}</strong></span>
                      <span>&bull;</span>
                      <span>{new Date(item.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  </div>

                  {/* Overall Star Rating Badge */}
                  <div className="flex items-center gap-1 rounded-2xl bg-amber-50 px-3 py-1.5 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-900/60">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "h-4 w-4",
                            s <= item.overallRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300 dark:text-slate-700"
                          )}
                        />
                      ))}
                    </div>
                    <span className="ml-1 font-mono text-xs font-black text-amber-800 dark:text-amber-300">
                      {item.overallRating}.0
                    </span>
                  </div>
                </div>

                {/* Criteria Ratings Breakdown */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-2xl bg-slate-50/60 p-3.5 dark:bg-slate-800/40">
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Flight Crew</span>
                    <span className="font-mono text-xs font-extrabold text-slate-700 dark:text-slate-300">
                      ⭐ {item.flightCrewRating || 5}/5
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Cleanliness</span>
                    <span className="font-mono text-xs font-extrabold text-slate-700 dark:text-slate-300">
                      ⭐ {item.cabinCleanlinessRating || 5}/5
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Food & Drink</span>
                    <span className="font-mono text-xs font-extrabold text-slate-700 dark:text-slate-300">
                      ⭐ {item.foodBeverageRating || 5}/5
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Punctuality</span>
                    <span className="font-mono text-xs font-extrabold text-slate-700 dark:text-slate-300">
                      ⭐ {item.punctualityRating || 5}/5
                    </span>
                  </div>
                </div>

                {/* Highlight Tags */}
                {Array.isArray(item.highlightTags) && item.highlightTags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {item.highlightTags.map((tag: string) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="bg-blue-50/60 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900 text-[11px] font-semibold"
                      >
                        ✓ {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Passenger Comments */}
                {item.comments && (
                  <div className="mt-3 rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 italic border border-slate-100 dark:border-slate-800">
                    &ldquo;{item.comments}&rdquo;
                  </div>
                )}

                {/* Bottom Badges */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <ThumbsUp className="h-3 w-3" />
                      {item.recommendAirline !== false ? "Recommends SkyWay Airlines" : "Did not recommend"}
                    </span>
                  </div>

                  {item.followUpRequested && (
                    <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px]">
                      Customer Care Follow-up Requested
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flight Feedback Survey Modal */}
      <FlightFeedbackModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        flight={selectedFlightForFeedback}
        passengerInfo={passengerInfo}
        onFeedbackSubmitted={handleFeedbackSubmitted}
      />
    </div>
  );
}

export default PostFlightFeedbackView;
