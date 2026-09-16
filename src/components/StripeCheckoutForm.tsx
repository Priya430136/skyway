import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  Smartphone,
  Building2,
  Check,
  RefreshCw,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  createStripePaymentIntent,
  confirmStripePayment,
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  STRIPE_TEST_CARDS,
  type TestCard,
} from "@/lib/stripe-service";
import { toast } from "sonner";

export interface StripeCheckoutFormProps {
  amount: number;
  currency?: string;
  flightNumber?: string;
  pnr?: string;
  passengerName?: string;
  passengerEmail?: string;
  passengerPhone?: string;
  seatNumber?: string;
  cabinClass?: string;
  baggageCount?: number;
  mealPreference?: string;
  specialAssistance?: string;
  onSuccess: (result: {
    pnr: string;
    transaction: any;
    booking: any;
  }) => void;
  className?: string;
}

export function StripeCheckoutForm({
  amount = 5984,
  currency = "INR",
  flightNumber = "SW-218",
  pnr = "SW8X4K",
  passengerName = "Arjun Reddy",
  passengerEmail = "arjun.reddy@email.co",
  passengerPhone = "+91 98765 43210",
  seatNumber = "14A",
  cabinClass = "Economy",
  baggageCount = 1,
  mealPreference = "Vegetarian (VGML)",
  specialAssistance,
  onSuccess,
  className,
}: StripeCheckoutFormProps) {
  // Stripe form state
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardHolder, setCardHolder] = useState(passengerName);
  const [expiry, setExpiry] = useState("12/28");
  const [cvc, setCvc] = useState("424");
  const [zipCode, setZipCode] = useState("500034");
  const [saveCard, setSaveCard] = useState(true);

  // Digital Wallets / Express Pay state
  const [selectedWallet, setSelectedWallet] = useState<"card" | "apple_pay" | "gpay" | "link" | "upi">("card");
  const [upiId, setUpiId] = useState("arjun@okaxis");

  // Payment Processing Lifecycle state
  const [processing, setProcessing] = useState(false);
  const [statusStep, setStatusStep] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLiveStripe, setIsLiveStripe] = useState<boolean>(false);

  // 3D Secure Banking Authentication Modal Simulation
  const [show3DSModal, setShow3DSModal] = useState(false);
  const [otpCode, setOtpCode] = useState("888888");
  const [otpTimer, setOtpTimer] = useState(45);

  const cardBrand = detectCardBrand(cardNumber);

  // Initialize PaymentIntent on mount
  useEffect(() => {
    let mounted = true;
    createStripePaymentIntent({
      amount,
      currency,
      flightNumber,
      pnr,
      passengerName,
      passengerEmail,
    }).then((res) => {
      if (mounted) {
        setClientSecret(res.clientSecret || null);
        setIsLiveStripe(!!res.isLiveStripe);
      }
    });
    return () => {
      mounted = false;
    };
  }, [amount, currency, flightNumber, pnr, passengerName, passengerEmail]);

  // Handle Quick Test Card Selection
  const applyTestCard = (testCard: TestCard) => {
    setCardNumber(testCard.number);
    setExpiry(testCard.exp);
    setCvc(testCard.cvc);
    setErrorMsg(null);
    toast.info(`Applied test card: ${testCard.label}`);
  };

  // 3DS OTP Countdown
  useEffect(() => {
    if (!show3DSModal) return;
    const interval = setInterval(() => {
      setOtpTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [show3DSModal]);

  // Main Payment Submission
  const handlePay = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    // Validation
    const cleanNum = cardNumber.replace(/\s/g, "");
    if (selectedWallet === "card") {
      if (cleanNum.length < 12) {
        setErrorMsg("Please enter a valid card number (12-16 digits).");
        return;
      }
      if (!expiry || expiry.length < 5) {
        setErrorMsg("Please enter a valid card expiry (MM/YY).");
        return;
      }
      if (!cvc || cvc.length < 3) {
        setErrorMsg("Please enter a 3 or 4-digit CVC code.");
        return;
      }
    } else if (selectedWallet === "upi" && !/@/.test(upiId)) {
      setErrorMsg("Please enter a valid UPI ID (e.g. username@bank).");
      return;
    }

    // Check for test decline card
    if (cleanNum === "4000000000000341") {
      setProcessing(true);
      setStatusStep("Validating credentials with Stripe...");
      await new Promise((r) => setTimeout(r, 1200));
      setProcessing(false);
      setStatusStep(null);
      setErrorMsg("Your card was declined by the issuing bank. Please use another card or payment method.");
      toast.error("Stripe Error: Card was declined.");
      return;
    }

    // Check if card requires 3DS challenge
    if (cleanNum === "4000002760003184") {
      setShow3DSModal(true);
      setOtpTimer(45);
      return;
    }

    // Proceed to process payment
    executePaymentFinalization();
  };

  // Complete the backend confirmation & ticket issuance
  const executePaymentFinalization = async () => {
    try {
      setProcessing(true);
      setStatusStep("Encrypting payment token via Stripe TLS...");
      await new Promise((r) => setTimeout(r, 600));

      setStatusStep("Authorizing transaction with bank gateway...");
      await new Promise((r) => setTimeout(r, 800));

      setStatusStep("Stripe payment confirmed! Finalizing e-ticket...");

      const confirmRes = await confirmStripePayment({
        paymentIntentId: clientSecret || `pi_skyway_${Date.now()}`,
        pnr,
        amount,
        currency,
        paymentMethod: selectedWallet === "card" ? "card" : selectedWallet,
        cardBrand: cardBrand.label,
        cardLast4: cardNumber.replace(/\s/g, "").slice(-4) || "4242",
        bookingData: {
          flightNumber,
          passengerName,
          passengerEmail,
          passengerPhone,
          seatNumber,
          cabinClass,
          baggageCount,
          mealPreference,
          specialAssistance,
          totalPaid: amount,
        },
      });

      setStatusStep("Success!");
      await new Promise((r) => setTimeout(r, 400));
      setProcessing(false);

      toast.success(`Payment of ₹${amount.toLocaleString("en-IN")} confirmed via Stripe!`);

      if (onSuccess) {
        onSuccess({
          pnr: confirmRes.booking?.pnr || pnr,
          transaction: confirmRes.transaction,
          booking: confirmRes.booking,
        });
      }
    } catch (err: any) {
      setProcessing(false);
      setStatusStep(null);
      setErrorMsg(err.message || "Payment processing failed. Please try again.");
      toast.error("Payment failed. Please retry.");
    }
  };

  // 3DS OTP Submission
  const handleVerify3DS = () => {
    if (otpCode.length < 4) {
      toast.error("Please enter a valid OTP code");
      return;
    }
    setShow3DSModal(false);
    executePaymentFinalization();
  };

  return (
    <div className={`space-y-6 ${className || ""}`}>
      {/* 1. Stripe Brand & Security Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-muted/40 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#635BFF] text-white shadow-md shadow-[#635BFF]/20 font-black text-sm">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-foreground tracking-tight">
                Stripe Secure Checkout
              </span>
              <Badge className="bg-[#635BFF]/15 text-[#635BFF] dark:text-violet-300 border-none font-bold text-[10px]">
                {isLiveStripe ? "Stripe Live Connected" : "Stripe Sandbox Ready"}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              End-to-end 256-bit encryption &bull; PCI-DSS Level 1 compliant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Lock className="h-3.5 w-3.5 text-emerald-500" />
            TLS 1.3 Verified
          </span>
          <span className="hidden sm:inline">&bull;</span>
          <span className="hidden sm:flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
            3D Secure 2.0
          </span>
        </div>
      </div>

      {/* 2. Express Digital Wallets */}
      <div className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Express Checkout
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => setSelectedWallet("card")}
            className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all ${
              selectedWallet === "card"
                ? "border-[#635BFF] bg-[#635BFF]/10 text-foreground ring-1 ring-[#635BFF]/40"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            <CreditCard className="h-4 w-4 text-[#635BFF]" />
            <span>Credit / Debit Card</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedWallet("apple_pay");
              toast.info("Apple Pay selected. Click 'Pay with Apple Pay' to authenticate with Touch ID / Face ID.");
            }}
            className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all ${
              selectedWallet === "apple_pay"
                ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            <span> Pay</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedWallet("gpay");
              toast.info("Google Pay selected via Stripe.");
            }}
            className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all ${
              selectedWallet === "gpay"
                ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            <span>G Pay</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedWallet("upi")}
            className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all ${
              selectedWallet === "upi"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            <Smartphone className="h-4 w-4 text-emerald-500" />
            <span>UPI Instant</span>
          </button>
        </div>
      </div>

      {/* 3. Card Element Form (When Card is selected) */}
      {selectedWallet === "card" && (
        <div className="space-y-4 rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm">
          {/* Visual Interactive Card Preview */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-800 p-5 text-white shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-10 rounded-md bg-amber-400/90 shadow-inner flex items-center justify-center text-[10px] font-bold text-amber-950">
                  CHIP
                </div>
                <Zap className="h-4 w-4 text-white/50" />
              </div>
              <span className="font-mono text-sm font-extrabold uppercase tracking-wider text-white/90">
                {cardBrand.label}
              </span>
            </div>

            <div className="mt-5 font-mono text-lg sm:text-xl font-bold tracking-widest text-white/95 truncate">
              {cardNumber || "•••• •••• •••• ••••"}
            </div>

            <div className="mt-4 flex items-end justify-between text-xs text-white/80">
              <div>
                <span className="block text-[9px] uppercase tracking-wider text-white/50">
                  Cardholder Name
                </span>
                <span className="font-medium truncate max-w-[180px] block">
                  {cardHolder || "YOUR NAME"}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[9px] uppercase tracking-wider text-white/50">
                  Expires
                </span>
                <span className="font-mono font-medium">{expiry || "MM/YY"}</span>
              </div>
            </div>
          </div>

          {/* Test Card Quick-Pill Tray */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Quick Test Cards:
              </span>
              <span className="text-[10px] text-muted-foreground">Click to fill</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STRIPE_TEST_CARDS.map((tc) => (
                <button
                  key={tc.label}
                  type="button"
                  onClick={() => applyTestCard(tc)}
                  className="rounded-lg border border-border/80 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                >
                  <span className="font-mono font-bold text-accent">{tc.number.slice(0, 4)}</span>
                  <span>{tc.label.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Card Inputs */}
          <form onSubmit={handlePay} className="space-y-3 pt-2">
            {/* Card Number */}
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Card number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                  className="w-full rounded-xl border border-border bg-background px-9 py-2.5 font-mono text-sm tracking-wide text-foreground focus:border-[#635BFF] focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  {cardBrand.label}
                </div>
              </div>
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Cardholder name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                placeholder="Name as it appears on card"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-[#635BFF] focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
              />
            </div>

            {/* Expiry, CVC & ZIP in responsive grid */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">
                  Expiry <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm text-center text-foreground focus:border-[#635BFF] focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">
                  CVC / CVV <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="CVC"
                  maxLength={4}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm text-center text-foreground focus:border-[#635BFF] focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">
                  Billing PIN/ZIP
                </label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.slice(0, 8))}
                  placeholder="500034"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm text-center text-foreground focus:border-[#635BFF] focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
                />
              </div>
            </div>

            {/* Save Card Checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-2.5 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveCard}
                  onChange={(e) => setSaveCard(e.target.checked)}
                  className="rounded border-border text-[#635BFF] focus:ring-[#635BFF]"
                />
                <span>Save this card securely for future flight bookings & upgrades</span>
              </label>
            </div>
          </form>
        </div>
      )}

      {/* 4. UPI Form (When UPI is selected) */}
      {selectedWallet === "upi" && (
        <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 font-bold">
              UPI
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">UPI Payment Request</h4>
              <p className="text-xs text-muted-foreground">
                Pay via GPay, PhonePe, Paytm, or BHIM UPI ID
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1">
              UPI Virtual Payment Address (VPA)
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="username@bank"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 font-mono text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {["@okaxis", "@okhdfcbank", "@paytm", "@ibl", "@ybl"].map((suffix) => (
              <button
                key={suffix}
                type="button"
                onClick={() => setUpiId((id) => (id.includes("@") ? id.split("@")[0] + suffix : id + suffix))}
                className="rounded-lg border border-border bg-muted/30 px-2 py-1 text-[11px] hover:bg-muted font-mono"
              >
                {suffix}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Apple Pay / Google Pay Selected State */}
      {(selectedWallet === "apple_pay" || selectedWallet === "gpay") && (
        <div className="rounded-3xl border border-border/80 bg-card p-6 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl">
            {selectedWallet === "apple_pay" ? "" : "G"}
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">
              {selectedWallet === "apple_pay" ? "Apple Pay Checkout" : "Google Pay Checkout"}
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              Biometric tokenization authenticated by Stripe. Your default card will be charged.
            </p>
          </div>
        </div>
      )}

      {/* Error Message Feedback */}
      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-600 dark:text-rose-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Processing Status Banner */}
      {processing && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#635BFF]/30 bg-[#635BFF]/10 p-4 text-xs text-[#635BFF] dark:text-violet-300 animate-pulse">
          <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
          <div className="font-semibold">{statusStep || "Processing Stripe Payment..."}</div>
        </div>
      )}

      {/* 6. Primary Action Button */}
      <Button
        type="button"
        disabled={processing}
        onClick={() => handlePay()}
        className={`w-full py-4 text-sm font-bold shadow-lg transition-all rounded-2xl ${
          selectedWallet === "apple_pay"
            ? "bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black"
            : "bg-[#635BFF] text-white hover:bg-[#534bd9] shadow-[#635BFF]/25"
        }`}
      >
        {processing ? (
          <span className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Processing ₹{amount.toLocaleString("en-IN")}...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Lock className="h-4 w-4" />
            <span>
              Pay ₹{amount.toLocaleString("en-IN")} {currency} via Stripe &rarr;
            </span>
          </span>
        )}
      </Button>

      {/* 3D Secure / OTP Simulation Modal */}
      {show3DSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border bg-background p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
                  3DS
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Bank Authentication Challenge
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Verified by Visa &bull; Mastercard Identity Check
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                Live 3DS Simulator
              </Badge>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <p>
                SkyWay Airlines is requesting authorization for{" "}
                <strong className="text-foreground">
                  ₹{amount.toLocaleString("en-IN")} {currency}
                </strong>
                . A one-time verification passcode has been sent to your registered mobile number.
              </p>
              <div className="rounded-xl bg-muted/40 p-3 flex justify-between font-mono text-[11px]">
                <span>Merchant: SkyWay Airlines</span>
                <span>Card: •••• 3184</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Enter 6-digit OTP
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.slice(0, 6))}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 font-mono text-lg font-bold tracking-widest text-center text-foreground focus:border-[#635BFF] focus:outline-none"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Code expires in: {otpTimer}s</span>
                <button
                  type="button"
                  onClick={() => {
                    setOtpTimer(45);
                    toast.info("New OTP sent: 888888");
                  }}
                  className="text-[#635BFF] hover:underline font-medium"
                >
                  Resend OTP
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShow3DSModal(false)}
                className="flex-1 rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerify3DS}
                className="flex-1 rounded-xl bg-[#635BFF] text-white text-xs font-semibold hover:bg-[#534bd9]"
              >
                Authorize & Pay ₹{amount.toLocaleString("en-IN")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
