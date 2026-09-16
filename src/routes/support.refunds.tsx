import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  CheckCircle2, XCircle, MessageCircleQuestion, ArrowUpRight, Search,
  Filter, Download, Plus, DollarSign, Clock, ShieldCheck, AlertCircle,
  FileText, CreditCard, Wallet, ArrowRight, X, Sparkles, Check,
} from "lucide-react";
import { toast } from "sonner";
import { SupportTopbar } from "@/components/support/SupportTopbar";
import { refunds as initialRefunds, type RefundRow } from "@/lib/support/mock";

export const Route = createFileRoute("/support/refunds")({ component: RefundsPage });

export function RefundsPage() {
  const [refundList, setRefundList] = useState<RefundRow[]>(initialRefunds);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eligibilityFilter, setEligibilityFilter] = useState<string>("all");

  // Modals / Drawer states
  const [selectedRefund, setSelectedRefund] = useState<RefundRow | null>(null);
  const [actionModalType, setActionModalType] = useState<"approve" | "reject" | "info" | "escalate" | null>(null);
  const [showNewRefundModal, setShowNewRefundModal] = useState(false);

  // Approval form state
  const [payoutMethod, setPayoutMethod] = useState<"Original Card" | "SkyWay Wallet (+10% Bonus)" | "Bank Wire">("Original Card");
  const [adminWaiverApplied, setAdminWaiverApplied] = useState(true);

  // Rejection form state
  const [rejectReason, setRejectReason] = useState("Non-refundable Basic Economy fare terms apply");
  const [rejectNotes, setRejectNotes] = useState("");

  // New refund form state
  const [newBooking, setNewBooking] = useState("");
  const [newPassenger, setNewPassenger] = useState("");
  const [newFlight, setNewFlight] = useState("SW101");
  const [newAmount, setNewAmount] = useState("350");
  const [newReason, setNewReason] = useState("Flight cancellation");
  const [newEligibility, setNewEligibility] = useState<"eligible" | "partial" | "not-eligible">("eligible");

  // Stats calculation
  const totalAmount = useMemo(() => refundList.reduce((s, r) => s + r.amount, 0), [refundList]);
  const pendingCount = useMemo(() => refundList.filter((r) => r.status === "pending").length, [refundList]);
  const approvedCount = useMemo(() => refundList.filter((r) => r.status === "approved").length, [refundList]);
  const approvedAmount = useMemo(() => refundList.filter((r) => r.status === "approved").reduce((s, r) => s + r.amount, 0), [refundList]);

  // Filtering
  const filteredRefunds = useMemo(() => {
    return refundList.filter((r) => {
      const matchSearch =
        searchQuery === "" ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.booking.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.passenger.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.flight.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reason.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (eligibilityFilter !== "all" && r.eligibility !== eligibilityFilter) return false;

      return true;
    });
  }, [refundList, searchQuery, statusFilter, eligibilityFilter]);

  // Handle Approve
  const handleConfirmApprove = () => {
    if (!selectedRefund) return;
    const finalAmount = payoutMethod.includes("Bonus")
      ? Math.round(selectedRefund.amount * 1.1)
      : selectedRefund.amount;

    setRefundList((prev) =>
      prev.map((r) =>
        r.id === selectedRefund.id
          ? { ...r, status: "approved" as const }
          : r
      )
    );

    toast.success(
      `Refund ${selectedRefund.id} APPROVED! $${finalAmount} dispatched via ${payoutMethod}. PNR ${selectedRefund.booking} updated.`
    );
    setActionModalType(null);
    setSelectedRefund(null);
  };

  // Handle Reject
  const handleConfirmReject = () => {
    if (!selectedRefund) return;

    setRefundList((prev) =>
      prev.map((r) =>
        r.id === selectedRefund.id
          ? { ...r, status: "rejected" as const }
          : r
      )
    );

    toast.error(
      `Refund ${selectedRefund.id} REJECTED. Reason: "${rejectReason}". Formal notice sent to ${selectedRefund.passenger}.`
    );
    setActionModalType(null);
    setSelectedRefund(null);
  };

  // Handle Escalate
  const handleConfirmEscalate = () => {
    if (!selectedRefund) return;

    setRefundList((prev) =>
      prev.map((r) =>
        r.id === selectedRefund.id
          ? { ...r, status: "processing" as const }
          : r
      )
    );

    toast.info(
      `Refund ${selectedRefund.id} escalated to OCC Revenue & Billing Audit Desk.`
    );
    setActionModalType(null);
    setSelectedRefund(null);
  };

  // Handle Create New Refund
  const handleCreateRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking || !newPassenger) {
      toast.error("Please fill in booking reference and passenger name.");
      return;
    }

    const created: RefundRow = {
      id: `RF-${Math.floor(6200 + Math.random() * 800)}`,
      booking: newBooking.toUpperCase(),
      passenger: newPassenger,
      flight: newFlight,
      amount: parseFloat(newAmount) || 200,
      reason: newReason,
      eligibility: newEligibility,
      status: "pending",
      method: "Visa",
      requestedAt: new Date().toISOString(),
    };

    setRefundList([created, ...refundList]);
    setShowNewRefundModal(false);
    setNewBooking("");
    setNewPassenger("");
    toast.success(`Initiated refund claim ${created.id} for ${created.passenger} ($${created.amount}).`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = "Refund ID,Booking,Passenger,Flight,Amount,Reason,Eligibility,Status,Method\n";
    const rows = filteredRefunds
      .map((r) => `${r.id},${r.booking},"${r.passenger}",${r.flight},$${r.amount},"${r.reason}",${r.eligibility},${r.status},${r.method}`)
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SkyWay_Refunds_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Exported refunds ledger to CSV.");
  };

  return (
    <>
      <SupportTopbar
        crumbs={[{ label: "Support", to: "/support" }, { label: "Refund Center" }]}
        action={{
          label: "Initiate Refund",
          onClick: () => setShowNewRefundModal(true),
        }}
      />

      <main className="flex-1 space-y-5 p-6 overflow-y-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl tracking-tight">Refund Command Center</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Review passenger refund requests, calculate fare penalties, and issue disbursements.
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
              onClick={() => setShowNewRefundModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" /> New Refund Request
            </button>
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Total Requested</span>
              <DollarSign className="h-4 w-4 text-sky-accent" />
            </div>
            <p className="mt-1 font-display text-2xl tracking-tight text-foreground">${totalAmount.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{refundList.length} total claims logged</p>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-card p-4">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-amber-500">
              <span>Pending Review</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-1 font-display text-2xl tracking-tight text-amber-500">{pendingCount}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Requires supervisor sign-off</p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-card p-4">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-emerald-500">
              <span>Approved Payouts</span>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-1 font-display text-2xl tracking-tight text-emerald-500">${approvedAmount.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{approvedCount} claims disbursed</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Avg Processing SLA</span>
              <Sparkles className="h-4 w-4 text-purple-500" />
            </div>
            <p className="mt-1 font-display text-2xl tracking-tight text-foreground">42 mins</p>
            <p className="text-[10px] text-emerald-500 mt-0.5">99.4% within 24h guarantee</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by refund ID, booking reference, passenger, or flight…"
              className="w-full rounded-lg border border-border bg-background py-1.5 pl-9 pr-3 text-xs outline-none focus:border-sky-accent focus:ring-1 focus:ring-sky-accent/30"
            />
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
              <option value="processing">Processing</option>
            </select>

            <select
              value={eligibilityFilter}
              onChange={(e) => setEligibilityFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium outline-none focus:border-sky-accent"
            >
              <option value="all">All Eligibility</option>
              <option value="eligible">100% Eligible</option>
              <option value="partial">Partial Refund</option>
              <option value="not-eligible">Not Eligible</option>
            </select>
          </div>
        </div>

        {/* Main Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Refund ID</th>
                  <th className="px-4 py-3">PNR</th>
                  <th className="px-4 py-3">Passenger</th>
                  <th className="px-4 py-3">Flight</th>
                  <th className="px-4 py-3">Claim Amount</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Eligibility</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredRefunds.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                      No refund requests found matching the current criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRefunds.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-sky-accent">{r.id}</td>
                      <td className="px-4 py-3 font-mono font-semibold">{r.booking}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{r.passenger}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{r.flight}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-foreground">${r.amount}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.reason}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                            r.eligibility === "eligible"
                              ? "bg-emerald-500/15 text-emerald-500"
                              : r.eligibility === "partial"
                              ? "bg-amber-500/15 text-amber-500"
                              : "bg-red-500/15 text-red-500"
                          }`}
                        >
                          {r.eligibility}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                            r.status === "approved"
                              ? "bg-emerald-500/15 text-emerald-500"
                              : r.status === "rejected"
                              ? "bg-red-500/15 text-red-500"
                              : r.status === "processing"
                              ? "bg-sky-500/15 text-sky-500"
                              : "bg-amber-500/15 text-amber-500"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{r.method}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRefund(r);
                              setActionModalType("approve");
                            }}
                            title="Approve Refund"
                            disabled={r.status === "approved"}
                            className="rounded-md border border-emerald-500/30 p-1.5 text-emerald-600 hover:bg-emerald-500/10 disabled:opacity-30 transition-colors"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRefund(r);
                              setActionModalType("reject");
                            }}
                            title="Reject Refund"
                            disabled={r.status === "rejected"}
                            className="rounded-md border border-red-500/30 p-1.5 text-red-500 hover:bg-red-500/10 disabled:opacity-30 transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRefund(r);
                              setActionModalType("info");
                            }}
                            title="View Dossier & Policy Details"
                            className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          >
                            <MessageCircleQuestion className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRefund(r);
                              setActionModalType("escalate");
                            }}
                            title="Escalate to Finance"
                            className="rounded-md border border-amber-500/30 p-1.5 text-amber-600 hover:bg-amber-500/10 transition-colors"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: APPROVE REFUND */}
        {actionModalType === "approve" && selectedRefund && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-semibold text-base">Authorize Refund Payment</h3>
                </div>
                <button onClick={() => setActionModalType(null)} className="rounded p-1 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-lg bg-muted/40 p-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Claim ID:</span>
                  <span className="font-mono font-semibold">{selectedRefund.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Passenger / Booking:</span>
                  <span className="font-semibold">{selectedRefund.passenger} ({selectedRefund.booking})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reason:</span>
                  <span>{selectedRefund.reason}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border/60 text-sm font-semibold">
                  <span>Gross Claim Amount:</span>
                  <span className="text-sky-accent font-mono">${selectedRefund.amount}</span>
                </div>
              </div>

              {/* Payout Method Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Select Payout Destination</label>
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between rounded-lg border border-border p-2.5 text-xs cursor-pointer hover:bg-muted/30">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payout"
                        checked={payoutMethod === "Original Card"}
                        onChange={() => setPayoutMethod("Original Card")}
                      />
                      <CreditCard className="h-4 w-4 text-sky-accent" />
                      <span>Original Payment Method ({selectedRefund.method})</span>
                    </div>
                    <span className="font-mono font-semibold">${selectedRefund.amount}</span>
                  </label>

                  <label className="flex items-center justify-between rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-2.5 text-xs cursor-pointer hover:bg-emerald-500/10">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payout"
                        checked={payoutMethod === "SkyWay Wallet (+10% Bonus)"}
                        onChange={() => setPayoutMethod("SkyWay Wallet (+10% Bonus)")}
                      />
                      <Wallet className="h-4 w-4 text-emerald-500" />
                      <span className="font-medium text-emerald-600">SkyWay Wallet Credit (+10% Instant Bonus)</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-600">${Math.round(selectedRefund.amount * 1.1)}</span>
                  </label>

                  <label className="flex items-center justify-between rounded-lg border border-border p-2.5 text-xs cursor-pointer hover:bg-muted/30">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payout"
                        checked={payoutMethod === "Bank Wire"}
                        onChange={() => setPayoutMethod("Bank Wire")}
                      />
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>Manual Bank Wire Transfer</span>
                    </div>
                    <span className="font-mono font-semibold">${selectedRefund.amount}</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setActionModalType(null)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApprove}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
                >
                  <Check className="h-3.5 w-3.5" /> Disburse & Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: REJECT REFUND */}
        {actionModalType === "reject" && selectedRefund && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold text-base">Reject Refund Claim</h3>
                </div>
                <button onClick={() => setActionModalType(null)} className="rounded p-1 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                Please select the contractual policy reason for declining refund for <strong>{selectedRefund.passenger}</strong> (Claim {selectedRefund.id}).
              </p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Decline Policy Rule</label>
                  <select
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-sky-accent"
                  >
                    <option value="Non-refundable Basic Economy fare terms apply">Non-refundable Basic Economy fare terms apply</option>
                    <option value="Passenger No-Show post-departure without prior cancellation">Passenger No-Show post-departure without prior cancellation</option>
                    <option value="Voluntary cancellation after 24-hour cooling window">Voluntary cancellation after 24-hour cooling window</option>
                    <option value="Force Majeure weather disruption outside airline liability">Force Majeure weather disruption outside airline liability</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Agent Audit Notes</label>
                  <textarea
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    placeholder="Enter explanatory notes for customer service log…"
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-sky-accent resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setActionModalType(null)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-red-700"
                >
                  <XCircle className="h-3.5 w-3.5" /> Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Drawer / Modal: MORE INFO / DOSSIER */}
        {actionModalType === "info" && selectedRefund && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-sky-accent" />
                  <h3 className="font-semibold text-base">Refund Case Dossier · {selectedRefund.id}</h3>
                </div>
                <button onClick={() => setActionModalType(null)} className="rounded p-1 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                  <div className="text-muted-foreground font-medium">Passenger Details</div>
                  <div className="font-semibold text-sm">{selectedRefund.passenger}</div>
                  <div className="font-mono text-muted-foreground">PNR: {selectedRefund.booking}</div>
                  <div className="font-mono text-muted-foreground">Flight: {selectedRefund.flight}</div>
                </div>

                <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                  <div className="text-muted-foreground font-medium">Financial Breakdown</div>
                  <div className="flex justify-between">
                    <span>Base Fare:</span>
                    <span className="font-mono">${selectedRefund.amount - 45}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Airport Taxes & YQ:</span>
                    <span className="font-mono">$45</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t border-border/60">
                    <span>Total Disbursable:</span>
                    <span className="text-sky-accent font-mono">${selectedRefund.amount}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-sky-accent/30 bg-sky-accent/5 p-3 text-xs space-y-1.5">
                <div className="font-semibold text-sky-accent flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Automated Fare Rule Audit
                </div>
                <p className="text-foreground/80 text-[11px] leading-relaxed">
                  Booking was issued under Fare Family <strong>Flex Economy</strong>. Involuntary disruption rules apply. Passenger is eligible for 100% waiver of cancellation fees per IATA Reso 735d.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    toast.info(`Dispatched document request email to ${selectedRefund.passenger}.`);
                  }}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  Request Medical / Disruption Proof
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActionModalType("approve");
                  }}
                  className="rounded-lg bg-sky-dark px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                >
                  Proceed to Approval
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: ESCALATE */}
        {actionModalType === "escalate" && selectedRefund && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold text-base">Escalate Claim to Finance Supervisory Desk</h3>
                </div>
                <button onClick={() => setActionModalType(null)} className="rounded p-1 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                This will route claim <strong>{selectedRefund.id} (${selectedRefund.amount})</strong> to the Senior Revenue Manager for override approval.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Escalation Justification</label>
                <textarea
                  placeholder="Explain why standard policy requires management override (e.g. VIP passenger, compassionate exception)…"
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-sky-accent resize-none"
                  defaultValue="Requesting supervisor override for fare penalty waiver due to bereavement exception."
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setActionModalType(null)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmEscalate}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-700"
                >
                  Confirm Escalation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: INITIATE NEW REFUND */}
        {showNewRefundModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-sky-accent" />
                  <h3 className="font-semibold text-base">Initiate New Passenger Refund</h3>
                </div>
                <button onClick={() => setShowNewRefundModal(false)} className="rounded p-1 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateRefund} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Booking PNR</label>
                    <input
                      value={newBooking}
                      onChange={(e) => setNewBooking(e.target.value)}
                      placeholder="e.g. SW94182"
                      required
                      className="w-full rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-sky-accent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Passenger Full Name</label>
                    <input
                      value={newPassenger}
                      onChange={(e) => setNewPassenger(e.target.value)}
                      placeholder="e.g. Isla McKenzie"
                      required
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
                      placeholder="e.g. SW101"
                      className="w-full rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-sky-accent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Refund Amount ($)</label>
                    <input
                      type="number"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="350"
                      required
                      className="w-full rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-sky-accent"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Refund Reason</label>
                  <select
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-sky-accent"
                  >
                    <option value="Flight cancellation">Flight cancellation</option>
                    <option value="Schedule change > 120 mins">Schedule change &gt; 120 mins</option>
                    <option value="Duplicate payment / charged twice">Duplicate payment / charged twice</option>
                    <option value="Medical emergency waiver">Medical emergency waiver</option>
                    <option value="Voluntary cancellation (Flex fare)">Voluntary cancellation (Flex fare)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Policy Eligibility</label>
                  <select
                    value={newEligibility}
                    onChange={(e) => setNewEligibility(e.target.value as any)}
                    className="w-full rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-sky-accent"
                  >
                    <option value="eligible">100% Eligible (Full refund)</option>
                    <option value="partial">Partial (Taxes & Fees only)</option>
                    <option value="not-eligible">Requires Supervisor Exception</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowNewRefundModal(false)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90"
                  >
                    Submit Refund Claim
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
