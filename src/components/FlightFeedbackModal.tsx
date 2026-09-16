import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Star,
  Plane,
  HeartHandshake,
  Sparkles,
  Award,
  CheckCircle2,
  ThumbsUp,
  MessageSquareHeart,
  Loader2,
  ShieldCheck,
  Calendar,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface FeedbackFlightTarget {
  flightNumber: string;
  pnr?: string;
  originCity: string;
  originCode: string;
  destinationCity: string;
  destinationCode: string;
  flightDate: string;
  cabinClass?: string;
}

export interface FlightFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight?: FeedbackFlightTarget | null;
  passengerInfo?: {
    name: string;
    email: string;
  };
  onFeedbackSubmitted?: (feedback: any) => void;
}

const HIGHLIGHT_TAG_OPTIONS = [
  "Smooth Landing",
  "Attentive Crew",
  "Delicious Hot Meals",
  "On-Time Arrival",
  "Comfortable Legroom",
  "Quiet Cabin",
  "Fast Baggage Delivery",
  "Clean Lavatories",
  "Friendly Gate Staff",
  "Excellent In-Flight Wi-Fi",
  "Seamless Boarding",
];

const RATING_LABELS: Record<number, { text: string; color: string; desc: string }> = {
  1: { text: "Poor", color: "text-rose-500", desc: "Significant service issues encountered" },
  2: { text: "Fair", color: "text-amber-500", desc: "Below standard expectations" },
  3: { text: "Good", color: "text-yellow-500", desc: "Met normal airline expectations" },
  4: { text: "Very Good", color: "text-blue-500", desc: "Pleasant & comfortable flight" },
  5: { text: "Exceptional!", color: "text-emerald-500", desc: "Flawless hospitality & journey" },
};

export function FlightFeedbackModal({
  isOpen,
  onClose,
  flight,
  passengerInfo = {
    name: "Priya Sehrawat",
    email: "sehrawatpriya430@gmail.com",
  },
  onFeedbackSubmitted,
}: FlightFeedbackModalProps) {
  // Form State
  const [overallRating, setOverallRating] = useState<number>(5);
  const [hoverOverall, setHoverOverall] = useState<number | null>(null);
  
  // Criteria Ratings (1-5)
  const [crewRating, setCrewRating] = useState<number>(5);
  const [cleanlinessRating, setCleanlinessRating] = useState<number>(5);
  const [foodRating, setFoodRating] = useState<number>(5);
  const [punctualityRating, setPunctualityRating] = useState<number>(5);

  // Tags & Text
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "Smooth Landing",
    "Attentive Crew",
  ]);
  const [recommendAirline, setRecommendAirline] = useState<boolean>(true);
  const [comments, setComments] = useState<string>("");
  const [followUpRequested, setFollowUpRequested] = useState<boolean>(false);

  // Submission Status
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [awardedMiles, setAwardedMiles] = useState<number>(250);

  // Reset or preset when opened
  useEffect(() => {
    if (isOpen) {
      setSubmittedSuccess(false);
      setIsSubmitting(false);
      setOverallRating(5);
      setCrewRating(5);
      setCleanlinessRating(5);
      setFoodRating(5);
      setPunctualityRating(5);
      setSelectedTags(["Smooth Landing", "Attentive Crew"]);
      setRecommendAirline(true);
      setComments("");
      setFollowUpRequested(false);
    }
  }, [isOpen, flight]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        pnr: flight?.pnr || "SW-SURVEY",
        flightNumber: flight?.flightNumber || "SW-GEN",
        passengerName: passengerInfo.name || "Passenger",
        passengerEmail: passengerInfo.email || "passenger@skywayairlines.com",
        overallRating,
        flightCrewRating: crewRating,
        cabinCleanlinessRating: cleanlinessRating,
        foodBeverageRating: foodRating,
        punctualityRating,
        recommendAirline,
        comments,
        highlightTags: selectedTags,
        followUpRequested,
      };

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit survey");
      }

      setAwardedMiles(data.bonusMilesAwarded || 250);
      setSubmittedSuccess(true);
      toast.success("Survey Submitted Successfully!", {
        description: `+${data.bonusMilesAwarded || 250} SkyMiles credited to your account. Feedback saved to PostgreSQL.`,
      });

      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(data.feedback);
      }
    } catch (err: any) {
      console.error("Survey submission error:", err);
      toast.error("Could not save feedback: " + (err.message || "Network error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRating = hoverOverall || overallRating;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {!submittedSuccess ? (
          <form onSubmit={handleSubmit} className="flex flex-col">
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 p-6 text-white">
              <div className="flex items-center justify-between">
                <Badge className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border-white/20 text-[11px] font-bold px-3 py-1">
                  <Sparkles className="mr-1.5 h-3 w-3 text-amber-300 fill-amber-300" />
                  Post-Flight Passenger Survey
                </Badge>

                <div className="flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-400/30">
                  <Award className="h-3.5 w-3.5" />
                  <span>+250 Bonus SkyMiles</span>
                </div>
              </div>

              <div className="mt-4">
                <DialogTitle className="text-2xl font-black tracking-tight text-white">
                  How was your flight experience?
                </DialogTitle>
                <DialogDescription className="text-blue-100 text-xs mt-1">
                  Your direct feedback empowers SkyWay Airlines to refine cabin hospitality and on-time performance.
                </DialogDescription>
              </div>

              {/* Flight Details Pill if provided */}
              {flight && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-white/10 p-3.5 backdrop-blur-md border border-white/15 text-xs text-white">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
                      <Plane className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-extrabold text-sm font-mono">{flight.flightNumber}</span>
                  </div>

                  <span className="text-white/40">&bull;</span>
                  <span className="font-semibold">
                    {flight.originCity} ({flight.originCode}) &rarr; {flight.destinationCity} ({flight.destinationCode})
                  </span>

                  <span className="text-white/40">&bull;</span>
                  <span className="text-blue-200 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {flight.flightDate}
                  </span>

                  {flight.pnr && (
                    <>
                      <span className="text-white/40">&bull;</span>
                      <span className="font-mono text-[11px] text-blue-200 flex items-center gap-1">
                        <Ticket className="h-3 w-3" /> PNR: {flight.pnr}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Form Fields Body */}
            <div className="p-6 space-y-6">
              {/* 1. Overall Star Rating */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 text-center dark:border-slate-800 dark:bg-slate-800/40">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Overall Flight Satisfaction
                </label>
                
                <div className="mt-3 flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= activeRating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setOverallRating(star)}
                        onMouseEnter={() => setHoverOverall(star)}
                        onMouseLeave={() => setHoverOverall(null)}
                        className="p-1.5 transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          className={cn(
                            "h-9 w-9 transition-colors",
                            isFilled
                              ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                              : "text-slate-300 dark:text-slate-600"
                          )}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2">
                  <span className={cn("text-sm font-extrabold", RATING_LABELS[activeRating]?.color)}>
                    {RATING_LABELS[activeRating]?.text}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {RATING_LABELS[activeRating]?.desc}
                  </p>
                </div>
              </div>

              {/* 2. Detailed Rating Criteria */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                  Service Category Ratings
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Flight Crew */}
                  <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>👨‍✈️ Flight Crew & Service</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Hospitality & attentiveness</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setCrewRating(s)}
                          className="p-0.5"
                        >
                          <Star
                            className={cn(
                              "h-4 w-4",
                              s <= crewRating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cabin Cleanliness */}
                  <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>🧼 Cabin Cleanliness</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Seats, tray & lavatories</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setCleanlinessRating(s)}
                          className="p-0.5"
                        >
                          <Star
                            className={cn(
                              "h-4 w-4",
                              s <= cleanlinessRating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Food & Beverage */}
                  <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>🍽️ Food & Beverage</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Meal quality & drinks</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFoodRating(s)}
                          className="p-0.5"
                        >
                          <Star
                            className={cn(
                              "h-4 w-4",
                              s <= foodRating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Punctuality */}
                  <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>⏱️ On-Time & Boarding</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Gate departure & baggage</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setPunctualityRating(s)}
                          className="p-0.5"
                        >
                          <Star
                            className={cn(
                              "h-4 w-4",
                              s <= punctualityRating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Highlight Tags */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  What stood out on your journey? (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {HIGHLIGHT_TAG_OPTIONS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border",
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                        )}
                      >
                        {isSelected && <span className="mr-1">✓</span>}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Comments & Suggestions */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Comments & Detailed Feedback
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {comments.length}/500 characters
                  </span>
                </div>
                <Textarea
                  placeholder="Share details about your in-flight comfort, cabin crew care, in-flight entertainment, or suggestions for improvement..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value.slice(0, 500))}
                  rows={3}
                  className="rounded-2xl border-slate-200 text-xs dark:border-slate-800 dark:bg-slate-900"
                />
              </div>

              {/* 5. NPS & Follow-up Options */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                {/* Net Promoter Question */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ThumbsUp className="h-3.5 w-3.5 text-blue-600" />
                    <span>Would you recommend SkyWay Airlines to friends & family?</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRecommendAirline(true)}
                      className={cn(
                        "rounded-xl px-3 py-1 text-xs font-bold transition-all border",
                        recommendAirline
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
                      )}
                    >
                      Yes, Definitely
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecommendAirline(false)}
                      className={cn(
                        "rounded-xl px-3 py-1 text-xs font-bold transition-all border",
                        !recommendAirline
                          ? "bg-rose-600 text-white border-rose-600"
                          : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
                      )}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* Follow up request */}
                <div className="flex items-start gap-2 pt-2">
                  <Checkbox
                    id="follow-up"
                    checked={followUpRequested}
                    onCheckedChange={(c) => setFollowUpRequested(Boolean(c))}
                    className="mt-0.5 rounded-md"
                  />
                  <label htmlFor="follow-up" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    I would like SkyWay Priority Guest Relations to follow up with me regarding this review.
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Encrypted & stored in PostgreSQL database</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Submitting to DB...
                    </>
                  ) : (
                    <>
                      <MessageSquareHeart className="mr-1.5 h-3.5 w-3.5" />
                      Submit Satisfaction Survey
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          /* Success Screen */
          <div className="p-8 text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                Thank You for Your Feedback!
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Your post-flight survey has been recorded into SkyWay's PostgreSQL satisfaction analytics database.
              </p>
            </div>

            <div className="mx-auto max-w-sm rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/40">
              <div className="flex items-center justify-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-sm">
                <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <span>+{awardedMiles} Bonus SkyMiles Credited!</span>
              </div>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1">
                Added directly to your frequent flyer balance as a gesture of our appreciation.
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={onClose}
                className="rounded-xl bg-slate-900 px-6 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
              >
                Close & Return to Dashboard
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default FlightFeedbackModal;
