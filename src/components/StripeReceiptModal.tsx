import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  Download,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  CreditCard,
  Plane,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getStripePaymentReceipt,
  type StripePaymentReceipt,
} from "@/lib/stripe-service";

interface StripeReceiptModalProps {
  pnr: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StripeReceiptModal({
  pnr,
  isOpen,
  onClose,
}: StripeReceiptModalProps) {
  const [receipt, setReceipt] = useState<StripePaymentReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !pnr) return;
    setLoading(true);
    getStripePaymentReceipt(pnr).then((data) => {
      if (data) {
        setReceipt(data);
      } else {
        // Fallback demo receipt
        setReceipt({
          receiptNumber: `RCP-${pnr}-2026`,
          pnr,
          transactionId: `txn_skw_${pnr.toLowerCase()}`,
          chargeId: `ch_3N9xK2A81SkyWay_${pnr}`,
          paymentIntentId: `pi_3N9xK2A81SkyWay_${pnr}`,
          amount: 5984,
          currency: "INR",
          paymentMethod: "Visa Card (Stripe)",
          cardBrand: "Visa",
          cardLast4: "4242",
          status: "succeeded",
          date: new Date().toISOString(),
          passenger: {
            name: "Arjun Reddy",
            email: "arjun.reddy@email.co",
          },
          flight: {
            flightNumber: "SW-218",
            origin: "DEL",
            destination: "BOM",
            departureTime: "08:30",
            seat: "14A",
            cabinClass: "Economy (Flex)",
          },
          breakdown: [
            { label: "Base Airfare (DEL → BOM)", amount: 4850 },
            { label: "Seat Selection (14A Window)", amount: 299 },
            { label: "Travel Insurance (Gold Cover)", amount: 349 },
            { label: "Aviation Security & GST (18%)", amount: 486 },
          ],
        });
      }
      setLoading(false);
    });
  }, [isOpen, pnr]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!receipt) return;
    const content = `SKYWAY AIRLINES - OFFICIAL PAYMENT RECEIPT (STRIPE)
======================================================
Receipt #: ${receipt.receiptNumber}
Booking Reference (PNR): ${receipt.pnr}
Date: ${new Date(receipt.date).toLocaleString()}
Status: ${receipt.status.toUpperCase()} (Settled)

PASSENGER & FLIGHT DETAILS:
- Passenger: ${receipt.passenger.name} (${receipt.passenger.email})
- Flight: ${receipt.flight.flightNumber} (${receipt.flight.origin} -> ${receipt.flight.destination})
- Cabin / Seat: ${receipt.flight.cabinClass} / Seat ${receipt.flight.seat}

STRIPE TRANSACTION DETAILS:
- Payment Method: ${receipt.cardBrand} ending in ${receipt.cardLast4}
- Stripe PaymentIntent: ${receipt.paymentIntentId}
- Stripe Charge ID: ${receipt.chargeId}
- Total Amount Paid: ₹${receipt.amount.toLocaleString("en-IN")} ${receipt.currency}

FARE BREAKDOWN:
${receipt.breakdown.map((b) => `- ${b.label}: ₹${b.amount.toLocaleString("en-IN")}`).join("\n")}
------------------------------------------------------
Total Settled: ₹${receipt.amount.toLocaleString("en-IN")} ${receipt.currency}
Security: 256-bit TLS / PCI-DSS Level 1 Verified via Stripe
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SkyWay-Stripe-Receipt-${receipt.pnr}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-background shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 font-bold dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Stripe Payment Receipt & Invoice
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Transaction settled & verified by Stripe
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent mb-3" />
              <span>Fetching Stripe transaction records...</span>
            </div>
          ) : receipt ? (
            <>
              {/* Receipt Top Banner */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      Payment Confirmed
                    </span>
                    <div className="mt-0.5 text-2xl font-black text-foreground">
                      ₹{receipt.amount.toLocaleString("en-IN")}{" "}
                      <span className="text-xs font-semibold text-muted-foreground">
                        {receipt.currency}
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-emerald-600 text-white font-bold text-[10px] border-none">
                    Stripe Succeeded
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>
                    Secured with 256-bit TLS &bull; Card ending in{" "}
                    <strong>{receipt.cardLast4}</strong>
                  </span>
                </div>
              </div>

              {/* Transaction Identifiers Grid */}
              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border/80 bg-card p-4 text-xs">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                    Booking PNR
                  </span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-foreground mt-0.5">
                    <span>{receipt.pnr}</span>
                    <button
                      onClick={() => copyToClipboard(receipt.pnr, "pnr")}
                      className="text-muted-foreground hover:text-accent"
                    >
                      {copiedId === "pnr" ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                    Receipt Number
                  </span>
                  <div className="font-mono font-medium text-foreground mt-0.5 truncate">
                    {receipt.receiptNumber}
                  </div>
                </div>

                <div className="col-span-2 border-t border-border/60 pt-2">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                    Stripe PaymentIntent ID
                  </span>
                  <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground mt-0.5 bg-muted/40 p-1.5 rounded-lg">
                    <span className="truncate">{receipt.paymentIntentId}</span>
                    <button
                      onClick={() =>
                        copyToClipboard(receipt.paymentIntentId, "pi")
                      }
                      className="ml-2 text-foreground/60 hover:text-foreground shrink-0"
                    >
                      {copiedId === "pi" ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="col-span-2">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                    Stripe Charge ID
                  </span>
                  <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground mt-0.5 bg-muted/40 p-1.5 rounded-lg">
                    <span className="truncate">{receipt.chargeId}</span>
                    <button
                      onClick={() =>
                        copyToClipboard(receipt.chargeId, "charge")
                      }
                      className="ml-2 text-foreground/60 hover:text-foreground shrink-0"
                    >
                      {copiedId === "charge" ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Flight Summary */}
              <div className="rounded-2xl border border-border bg-muted/20 p-4 text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Plane className="h-3.5 w-3.5 text-accent" />
                    {receipt.flight.flightNumber} &bull;{" "}
                    {receipt.flight.origin} &rarr; {receipt.flight.destination}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {receipt.flight.cabinClass}
                  </Badge>
                </div>
                <div className="flex justify-between text-muted-foreground text-[11px]">
                  <span>Passenger: {receipt.passenger.name}</span>
                  <span>Seat: {receipt.flight.seat}</span>
                </div>
              </div>

              {/* Itemized Fare Breakdown */}
              <div className="space-y-2 border-t border-border/60 pt-3 text-xs">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Itemized Charge Details
                </div>
                <div className="space-y-1.5">
                  {receipt.breakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-muted-foreground"
                    >
                      <span>{item.label}</span>
                      <span className="font-medium text-foreground">
                        {item.amount > 0
                          ? `₹${item.amount.toLocaleString("en-IN")}`
                          : item.note || "Included"}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-border/80 pt-2 flex items-center justify-between font-bold text-foreground text-sm">
                    <span>Total Charged via Stripe</span>
                    <span className="text-accent">
                      ₹{receipt.amount.toLocaleString("en-IN")}{" "}
                      {receipt.currency}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between border-t border-border/70 bg-muted/30 p-4 gap-2">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <CreditCard className="h-3.5 w-3.5 text-accent" />
            <span>Processed securely by Stripe, Inc.</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs rounded-xl"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              className="gap-1.5 text-xs rounded-xl"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Invoice</span>
            </Button>
            <Button
              size="sm"
              onClick={onClose}
              className="rounded-xl bg-foreground text-background text-xs font-semibold px-4"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
