import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Sparkles, CheckCircle2, XCircle, ArrowUpRight, Search, Filter,
  DollarSign, Clock, ShieldCheck, Download, Plus, X, Plane, User,
  Check, Gift, Award, AlertTriangle, FileText, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { SupportTopbar } from "@/components/support/SupportTopbar";
import { compensations as initialCompensations, type Compensation } from "@/lib/support/mock";

export const Route = createFileRoute("/support/compensation")({ component: CompensationPage });

export function CompensationPage() {
  const [claimList, setClaimList] = useState<Compensation[]>(initialCompensations);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Active Modals & Selected item
  const [selectedClaim, setSelectedClaim] = useState<Compensation | null>(null);
  const [modalType, setModalType] = useState<"approve" | "reject" | "dossier" | "new" | null>(null);

  // Approval Form State
  const [payoutOption, setPayoutOption] = useState<"voucher" | "cash" | "miles">("voucher");

  // Reject Form State
  const [rejectReason, setRejectReason] = useState("Delay caused by extraordinary weather below safety minima (ATC hold)");
  const [rejectNotes, setRejectNotes] = useState("");

  // New Claim Form State
  const [newPassenger, setNewPassenger] = useState("");
  const [newFlight, setNewFlight] = useState("SW101");
  const [newBooking, setNewBooking] = useState("");
  const [newReason, setNewReason] = useState("4h 20m Flight Delay");
  const [newAmount, setNewAmount] = useState("400");
  const [newType, setNewType] = useState<"Voucher" | "Miles" | "Cash" | "Upgrade">("Voucher");

  // Dynamic KPI Metrics
  const totalValue = useMemo(() => claimList.reduce((s, c) => s + c.amount, 0), [claimList]);
  const pendingCount = useMemo(() => claimList.filter((c) => c.status === "pending").length, [claimList]);
  const approvedCount = useMemo(() => claimList.filter((c) => c.status === "approved").length, [claimList]);
  const approvedAmount = useMemo(() => claimList.filter((c) => c.status === "approved").reduce((s, c) => s + c.amount, 0), [claimList]);

  // Filtered list
  const filteredClaims = useMemo(() => {
    return claimList.filter((c) => {
      const matchSearch =
        searchQuery === "" ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.passenger.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.flight.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.bookingRef && c.bookingRef.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (typeFilter !== "all" && c.type !== typeFilter) return false;

      return true;
    });
  }, [claimList, searchQuery, statusFilter, typeFilter]);

  // Handle Card Direct Approve
  const handleApproveClaim = (claim: Compensation) => {
    setSelectedClaim(claim);
    setPayoutOption(claim.type === "Miles" ? "miles" : claim.type === "Cash" ? "cash" : "voucher");
    setModalType("approve");
  };

  // Confirm Approval Execution
  const handleConfirmApprove = () => {
    if (!selectedClaim) return;

    let bonusMultiplier = 1;
    let methodLabel = "Direct Cash Wire";
    if (payoutOption === "voucher") {
      bonusMultiplier = 1.25;
      methodLabel = "SkyWay Flight Voucher (+25% bonus)";
    } else if (payoutOption === "miles") {
      methodLabel = "SkyWay Loyalty Frequent Flyer Miles";
    }

    const disbursedAmount = Math.round(selectedClaim.amount * bonusMultiplier);
    const txId = `TX-CMP-${Math.floor(10000 + Math.random() * 90000)}`;

    setClaimList((prev) =>
      prev.map((c) =>
        c.id === selectedClaim.id
          ? {
              ...c,
              status: "approved" as const,
              payoutMethod: methodLabel,
              payoutTxId: txId,
            }
          : c
      )
    );

    toast.success(
      `Claim ${selectedClaim.id} for ${selectedClaim.passenger} APPROVED! Issued $${disbursedAmount} via ${methodLabel} (Ref: ${txId}).`
    );
    setModalType(null);
    setSelectedClaim(null);
  };

  // Handle Card Direct Reject
  const handleRejectClaim = (claim: Compensation) => {
    setSelectedClaim(claim);
    setModalType("reject");
  };

  // Confirm Reject Execution
  const handleConfirmReject = () => {
    if (!selectedClaim) return;

    setClaimList((prev) =>
      prev.map((c) =>
        c.id === selectedClaim.id
          ? {
              ...c,
              status: "rejected" as const,
              reviewNotes: rejectReason,
            }
          : c
      )
    );

    toast.error(
      `Claim ${selectedClaim.id} REJECTED. Notice dispatched to ${selectedClaim.passenger}. Reason: "${rejectReason}".`
    );
    setModalType(null);
    setSelectedClaim(null);
  };

  // Handle Card View Dossier
  const handleViewDossier = (claim: Compensation) => {
    setSelectedClaim(claim);
    setModalType("dossier");
  };

  // Handle Create Claim
  const handleCreateNewClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassenger.trim()) {
      toast.error("Please enter passenger name.");
      return;
    }

    const created: Compensation = {
      id: `CMP-C${Math.floor(4300 + Math.random() * 700)}`,
      passenger: newPassenger,
      flight: newFlight,
      bookingRef: newBooking ? newBooking.toUpperCase() : `SW${Math.floor(10000 + Math.random() * 90000)}`,
      reason: newReason,
      type: newType,
      amount: parseFloat(newAmount) || 400,
      status: "pending",
      aiRecommendation: "Approve",
      aiConfidence: 96,
      route: "LHR → CDG",
      delayMinutes: 240,
      rootCause: "Technical sensor fault during pre-flight turnaround",
      passengerTier: "Gold",
      submittedAt: new Date().toISOString(),
    };

    setClaimList([created, ...claimList]);
    setModalType(null);
    setNewPassenger("");
    setNewBooking("");
    toast.success(`Logged compensation claim ${created.id} for ${created.passenger}.`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = "Claim ID,Passenger,Flight,PNR,Reason,Amount,Type,Status,AI Recommendation,AI Confidence\n";
    const rows = filteredClaims
      .map(
        (c) =>
          `${c.id},"${c.passenger}",${c.flight},${c.bookingRef || ""},"${c.reason}",$${c.amount},${c.type},${c.status},${c.aiRecommendation},${c.aiConfidence}%`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SkyWay_Compensations_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Exported compensations to CSV.");
  };

  return (
    <>
      <SupportTopbar
        crumbs={[{ label: "Support", to: "/support" }, { label: "Compensation" }]}
        action={{
          label: "Intake New Claim",
          onClick: () => setModalType("new"),
        }}
      />

      <main className="flex-1 space-y-5 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl tracking-tight">Compensation Command Center</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Automated AI evaluation against EU261, US DOT, and airline disruption rules with instant payout authorization.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
            <button
              onClick={() => setModalType("new")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" /> Intake Claim
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Total Claimed</span>
              <DollarSign className="h-4 w-4 text-sky-accent" />
            </div>
            <p className="mt-1 font-display text-2xl tracking-tight text-foreground">${totalValue.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{claimList.length} total claims</p>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-card p-4">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-amber-500">
              <span>Pending Review</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-1 font-display text-2xl tracking-tight text-amber-500">{pendingCount}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Ready for agent authorization</p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-card p-4">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-emerald-500">
              <span>Disbursed</span>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-1 font-display text-2xl tracking-tight text-emerald-500">${approvedAmount.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{approvedCount} claims resolved</p>
          </div>

          <div className="rounded-xl border border-purple-500/20 bg-card p-4">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-purple-500">
              <span>AI Auto-Confidence</span>
              <Sparkles className="h-4 w-4 text-purple-500" />
            </div>
            <p className="mt-1 font-display text-2xl tracking-tight text-foreground">94.8%</p>
            <p className="text-[10px] text-emerald-500 mt-0.5">Telemetry grounded via OCC</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by passenger, claim ID, flight, PNR, or disruption reason…"
              className="w-full rounded-lg border border-border bg-background py-1.5 pl-9 pr-3 text-xs outline-none focus:border-sky-accent focus:ring-1 focus:ring-sky-accent/30"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              <span>Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium outline-none focus:border-sky-accent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium outline-none focus:border-sky-accent"
            >
              <option value="all">All Payout Types</option>
              <option value="Voucher">Voucher</option>
              <option value="Cash">Cash</option>
              <option value="Miles">Miles</option>
              <option value="Upgrade">Upgrade</option>
            </select>
          </div>
        </div>

        {/* Claims Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredClaims.length === 0 ? (
            <div className="col-span-full rounded-xl border border-border bg-card p-12 text-center text-xs text-muted-foreground">
              No compensation claims matching your search criteria.
            </div>
          ) : (
            filteredClaims.map((c) => (
              <div
                key={c.id}
                className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs hover:border-sky-accent/40 transition-all"
              >
                <div>
                  {/* Top row */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-medium text-sky-accent">{c.id}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                        c.status === "approved"
                          ? "bg-emerald-500/15 text-emerald-500"
                          : c.status === "rejected"
                          ? "bg-red-500/15 text-red-500"
                          : "bg-amber-500/15 text-amber-500"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  {/* Passenger & Flight */}
                  <div className="mt-2.5 flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      {c.passenger}
                      {c.passengerTier && (
                        <span className="rounded bg-sky-accent/15 px-1.5 py-0.2 text-[9px] font-bold text-sky-accent">
                          {c.passengerTier}
                        </span>
                      )}
                    </h3>
                    {c.bookingRef && (
                      <span className="font-mono text-[10px] text-muted-foreground">{c.bookingRef}</span>
                    )}
                  </div>

                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-sky-accent font-medium">{c.flight}</span>
                    {c.route && <span>({c.route})</span>}
                    <span>·</span>
                    <span className="truncate">{c.reason}</span>
                  </div>

                  {/* Amount & Type */}
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display text-2xl font-bold tracking-tight text-foreground">${c.amount}</span>
                    <span className="text-xs text-muted-foreground font-medium">({c.type} Settlement)</span>
                  </div>

                  {/* AI Recommendation Box */}
                  <div className="mt-3.5 rounded-lg border border-sky-accent/25 bg-sky-accent/5 p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 font-semibold text-sky-accent">
                        <Sparkles className="h-3 w-3" />
                        <span>AI Recommendation</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">Confidence {c.aiConfidence}%</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">
                        {c.aiRecommendation === "Approve" ? "✅ Statutory Payout Approved" : c.aiRecommendation === "Reject" ? "❌ Extraordinary Circumstance" : "⚠️ Supervisor Audit Needed"}
                      </span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full transition-all ${
                          c.aiConfidence > 90 ? "bg-emerald-500" : c.aiConfidence > 80 ? "bg-sky-accent" : "bg-amber-500"
                        }`}
                        style={{ width: `${c.aiConfidence}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons (Functionable) */}
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApproveClaim(c)}
                    disabled={c.status === "approved"}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-35 transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{c.status === "approved" ? "Approved" : "Approve"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRejectClaim(c)}
                    disabled={c.status === "rejected"}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/20 disabled:opacity-35 transition-colors"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>{c.status === "rejected" ? "Rejected" : "Reject"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleViewDossier(c)}
                    title="View Full Claim Dossier & Telemetry"
                    className="inline-flex items-center justify-center rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal: APPROVE CLAIM */}
        {modalType === "approve" && selectedClaim && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-semibold text-base">Authorize Compensation Settlement</h3>
                </div>
                <button onClick={() => setModalType(null)} className="rounded p-1 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Passenger / Claim:</span>
                  <span className="font-semibold">{selectedClaim.passenger} ({selectedClaim.id})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Disruption Event:</span>
                  <span>Flight {selectedClaim.flight} · {selectedClaim.reason}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-border/60 text-sm font-semibold">
                  <span>Statutory Entitlement:</span>
                  <span className="text-sky-accent font-mono">${selectedClaim.amount}</span>
                </div>
              </div>

              {/* Settlement Payout Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Choose Settlement Format</label>

                <div className="space-y-1.5">
                  <label className="flex items-center justify-between rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 text-xs cursor-pointer hover:bg-emerald-500/10 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="compPayout"
                        checked={payoutOption === "voucher"}
                        onChange={() => setPayoutOption("voucher")}
                      />
                      <div>
                        <div className="font-semibold text-emerald-600 flex items-center gap-1.5">
                          <Gift className="h-3.5 w-3.5" /> SkyWay Flight Voucher (+25% Bonus)
                        </div>
                        <div className="text-[11px] text-muted-foreground">Valid for 24 months across all routes</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-emerald-600 text-sm">
                      ${Math.round(selectedClaim.amount * 1.25)}
                    </span>
                  </label>

                  <label className="flex items-center justify-between rounded-lg border border-border p-3 text-xs cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="compPayout"
                        checked={payoutOption === "cash"}
                        onChange={() => setPayoutOption("cash")}
                      />
                      <div>
                        <div className="font-semibold">Direct Cash Wire / Card Reversal</div>
                        <div className="text-[11px] text-muted-foreground">Processed to registered passenger bank card</div>
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-sm">${selectedClaim.amount}</span>
                  </label>

                  <label className="flex items-center justify-between rounded-lg border border-border p-3 text-xs cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="compPayout"
                        checked={payoutOption === "miles"}
                        onChange={() => setPayoutOption("miles")}
                      />
                      <div>
                        <div className="font-semibold flex items-center gap-1.5 text-purple-600">
                          <Award className="h-3.5 w-3.5" /> SkyWay Rewards Miles (10x Multiplier)
                        </div>
                        <div className="text-[11px] text-muted-foreground">Instant loyalty account deposit</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-purple-600 text-sm">
                      {(selectedClaim.amount * 100).toLocaleString()} PTS
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApprove}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
                >
                  <Check className="h-3.5 w-3.5" /> Confirm Disbursement
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: REJECT CLAIM */}
        {modalType === "reject" && selectedClaim && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold text-base">Decline Compensation Claim</h3>
                </div>
                <button onClick={() => setModalType(null)} className="rounded p-1 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                Please specify the statutory justification for rejecting claim <strong>{selectedClaim.id}</strong> for {selectedClaim.passenger}.
              </p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Regulatory Defense / Exemption</label>
                  <select
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-sky-accent"
                  >
                    <option value="Delay caused by extraordinary weather below safety minima (ATC hold)">
                      Delay caused by extraordinary weather below safety minima (ATC hold)
                    </option>
                    <option value="Actual arrival delay was less than statutory 3-hour threshold">
                      Actual arrival delay was less than statutory 3-hour threshold
                    </option>
                    <option value="Re-routed on alternate flight arriving within 1 hour of scheduled time">
                      Re-routed on alternate flight arriving within 1 hour of scheduled time
                    </option>
                    <option value="Air Traffic Control (ATC) industrial action outside airline control">
                      Air Traffic Control (ATC) industrial action outside airline control
                    </option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Passenger Communication Notes</label>
                  <textarea
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    placeholder="Include radar logs, METAR report reference, or ATC slot hold number…"
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-sky-accent resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-red-700 transition-colors"
                >
                  <XCircle className="h-3.5 w-3.5" /> Decline Claim
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: CLAIM DOSSIER */}
        {modalType === "dossier" && selectedClaim && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-sky-accent" />
                  <h3 className="font-semibold text-base">Claim Dossier & Telemetry · {selectedClaim.id}</h3>
                </div>
                <button onClick={() => setModalType(null)} className="rounded p-1 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Grid overview */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                  <div className="text-muted-foreground font-medium">Passenger & PNR</div>
                  <div className="font-semibold text-sm">{selectedClaim.passenger}</div>
                  <div className="font-mono text-muted-foreground">Booking: {selectedClaim.bookingRef || "SW99120"}</div>
                  <div className="text-sky-accent font-medium">Tier: {selectedClaim.passengerTier || "Gold Member"}</div>
                </div>

                <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                  <div className="text-muted-foreground font-medium">Flight Disruption Telemetry</div>
                  <div className="font-semibold text-sm">{selectedClaim.flight} ({selectedClaim.route || "LHR → CDG"})</div>
                  <div className="text-red-500 font-medium">Delay: {selectedClaim.delayMinutes || 260} minutes</div>
                  <div className="text-muted-foreground text-[11px]">Root cause: {selectedClaim.rootCause || "Technical mechanical item"}</div>
                </div>
              </div>

              {/* AI Evaluation */}
              <div className="rounded-lg border border-sky-accent/30 bg-sky-accent/5 p-3.5 text-xs space-y-2">
                <div className="flex items-center justify-between font-semibold text-sky-accent">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" /> AI Statutory Decision Engine
                  </div>
                  <span className="font-mono text-[11px]">Confidence {selectedClaim.aiConfidence}%</span>
                </div>
                <p className="text-foreground/90 leading-relaxed text-[11px]">
                  Flight <strong>{selectedClaim.flight}</strong> incurred a 260-minute arrival delay due to an unscheduled hydraulic seal replacement. Per European Court of Justice (ECJ) Wallentin-Hermann case law, routine mechanical faults do not constitute extraordinary circumstances. Statutory entitlement of <strong>${selectedClaim.amount}</strong> is verified under EU261 Regulation Article 7.
                </p>
              </div>

              {/* Action buttons inside dossier */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    toast.info(`Claim ${selectedClaim.id} escalated to SkyWay Aviation Legal Counsel.`);
                    setModalType(null);
                  }}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  Escalate to Legal
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleRejectClaim(selectedClaim);
                    }}
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/20"
                  >
                    Reject Claim
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleApproveClaim(selectedClaim);
                    }}
                    className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Approve Payout (${selectedClaim.amount})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: INTAKE NEW CLAIM */}
        {modalType === "new" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-sky-accent" />
                  <h3 className="font-semibold text-base">Intake Compensation Claim</h3>
                </div>
                <button onClick={() => setModalType(null)} className="rounded p-1 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateNewClaim} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Passenger Full Name</label>
                    <input
                      value={newPassenger}
                      onChange={(e) => setNewPassenger(e.target.value)}
                      placeholder="e.g. Chloé Dubois"
                      required
                      className="w-full rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-sky-accent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Booking PNR</label>
                    <input
                      value={newBooking}
                      onChange={(e) => setNewBooking(e.target.value)}
                      placeholder="e.g. SW84910"
                      className="w-full rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-sky-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Flight Number</label>
                    <input
                      value={newFlight}
                      onChange={(e) => setNewFlight(e.target.value)}
                      placeholder="e.g. SW841"
                      required
                      className="w-full rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-sky-accent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Claim Amount ($)</label>
                    <input
                      type="number"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="400"
                      required
                      className="w-full rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-sky-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Disruption Reason</label>
                    <select
                      value={newReason}
                      onChange={(e) => setNewReason(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-sky-accent"
                    >
                      <option value="4h 20m Flight Delay">4h 20m Flight Delay</option>
                      <option value="Flight Cancellation (Tech Item)">Flight Cancellation (Tech Item)</option>
                      <option value="Involuntary Denied Boarding">Involuntary Denied Boarding</option>
                      <option value="Mishandled Baggage > 24h">Mishandled Baggage &gt; 24h</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Settlement Format</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as any)}
                      className="w-full rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-sky-accent"
                    >
                      <option value="Voucher">Travel Voucher (+25%)</option>
                      <option value="Cash">Direct Cash Wire</option>
                      <option value="Miles">Loyalty Rewards Miles</option>
                      <option value="Upgrade">Complimentary Cabin Upgrade</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90"
                  >
                    Register Claim
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
