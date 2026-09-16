import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Users, Star, HeartHandshake, RefreshCcw, CheckCircle2,
  X, Plane, Utensils, Hotel, Send, Download, Sparkles, FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { OpsTopbar } from "@/components/ops/OpsTopbar";
import { KpiCard } from "@/components/ops/KpiCard";
import { delaysQuery, flightsQuery } from "@/lib/ops/queries";
import type { Delay } from "@/lib/ops/mock-data";

export const Route = createFileRoute("/ops/passengers")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(delaysQuery);
    context.queryClient.ensureQueryData(flightsQuery);
  },
  component: Passengers,
});

function Passengers() {
  const { data: delays } = useSuspenseQuery(delaysQuery);
  const { data: flights } = useSuspenseQuery(flightsQuery);

  const [selectedDelay, setSelectedDelay] = useState<Delay | null>(null);
  const [rebookedFlightNos, setRebookedFlightNos] = useState<string[]>([]);
  const [rebookOption, setRebookOption] = useState("next-flight");
  const [sendSms, setSendSms] = useState(true);
  const [issueMealVoucher, setIssueMealVoucher] = useState(true);
  const [issueHotel, setIssueHotel] = useState(false);

  const affected = delays.reduce((s, d) => s + d.affected_passengers, 0);
  const vipEstimate = Math.round(affected * 0.06);
  const missedConn = Math.round(affected * 0.14);
  const specialAssist = Math.round(affected * 0.03);
  const compensation = Math.round(affected * 210);

  const handleConfirmRebooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelay) return;
    setRebookedFlightNos(prev => [...prev, selectedDelay.flight_no]);
    toast.success(`Successfully rebooked ${selectedDelay.affected_passengers} passengers from ${selectedDelay.flight_no}!`, {
      description: `New boarding passes generated & digital vouchers sent via SMS/WhatsApp.`,
    });
    setSelectedDelay(null);
  };

  const handleBatchRebookAll = () => {
    const allFlightNos = delays.map(d => d.flight_no);
    setRebookedFlightNos(allFlightNos);
    toast.success(`AI Auto-Rebooking triggered for all ${affected} passengers across ${delays.length} delayed flights!`, {
      description: "Allocated nearest open seats on SkyWay and partner flights.",
    });
  };

  const handleExportManifest = (delay: Delay) => {
    const csvContent = `Passenger Name,PNR,Status,Original Flight,New Flight,Seat,Special Req,Voucher\n` +
      `Alexander Wright,SKY921,SkyWay Platinum,${delay.flight_no},SW204,2A,None,MEAL-25-OK\n` +
      `Elena Rostova,SKY884,SkyWay Gold,${delay.flight_no},SW204,4C,Vegetarian,MEAL-25-OK\n` +
      `Marcus Chen,SKY103,Economy,${delay.flight_no},SW204,18F,Wheelchair,MEAL-25-OK\n` +
      `Sarah Jenkins,SKY452,Economy,${delay.flight_no},SW204,22B,None,MEAL-25-OK`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SkyWay_RebookingManifest_${delay.flight_no}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Passenger manifest for ${delay.flight_no} exported!`);
  };

  return (
    <>
      <OpsTopbar crumbs={[{ label: "OCC", to: "/ops" }, { label: "Passenger Impact" }]} />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Passenger impact & rebooking</h1>
            <p className="text-sm text-muted-foreground">Automated passenger re-accommodation, connection protection, and compensation management.</p>
          </div>
          <button
            type="button"
            onClick={handleBatchRebookAll}
            className="inline-flex items-center gap-1.5 rounded-md bg-sky-dark px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
          >
            <Sparkles className="h-3.5 w-3.5 text-sky-gold" />
            AI Auto-Rebook All Flights
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="Affected passengers" value={affected.toLocaleString()} icon={Users} tone="warning" />
          <KpiCard label="Missed connections" value={missedConn} icon={RefreshCcw} tone="danger" />
          <KpiCard label="VIP / status" value={vipEstimate} icon={Star} />
          <KpiCard label="Special assistance" value={specialAssist} icon={HeartHandshake} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg">Rebooking queue</h3>
              <span className="text-xs text-muted-foreground">{delays.length} flights affected</span>
            </div>
            <ul className="mt-4 space-y-3">
              {delays.map((d) => {
                const flight = flights.find((f) => f.flight_no === d.flight_no);
                const isRebooked = rebookedFlightNos.includes(d.flight_no);
                return (
                  <li key={d.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold">{d.flight_no}</span>
                        {isRebooked && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-500">
                            <CheckCircle2 className="h-3 w-3" /> Rebooked
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">{flight?.origin} → {flight?.destination} · {d.reason}</div>
                    </div>
                    <div className="text-right ml-2 shrink-0">
                      <div className="text-sm font-semibold">{d.affected_passengers} pax</div>
                      <div className="text-[11px] text-amber-500 font-mono">+{d.minutes}m</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedDelay(d)}
                      className={`ml-4 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isRebooked ? "border border-border bg-muted text-foreground hover:bg-muted/80" : "bg-sky-dark text-white hover:opacity-90"
                      }`}
                    >
                      {isRebooked ? "Manage" : "Rebook"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display text-lg">Compensation estimate</h3>
            <p className="mt-2 text-xs text-muted-foreground">Based on EU261/APR 400 policies and cabin class distribution across affected flights.</p>
            <div className="mt-6 font-display text-5xl tracking-tight text-foreground">${compensation.toLocaleString()}</div>
            <div className="mt-2 text-xs text-muted-foreground">Total accrued today · to be validated by finance</div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs">
              <div className="rounded-lg bg-muted/40 p-3"><div className="font-mono text-lg font-bold">$180</div><div className="text-muted-foreground">avg / pax</div></div>
              <div className="rounded-lg bg-muted/40 p-3"><div className="font-mono text-lg font-bold">62%</div><div className="text-muted-foreground">voucher</div></div>
              <div className="rounded-lg bg-muted/40 p-3"><div className="font-mono text-lg font-bold">38%</div><div className="text-muted-foreground">cash</div></div>
            </div>
          </div>
        </div>
      </main>

      {/* Passenger Rebooking Console Modal */}
      {selectedDelay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setSelectedDelay(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-sky-accent">
              <RefreshCcw className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Passenger Re-accommodation Console</span>
            </div>
            <h2 className="mt-1 font-display text-2xl">Rebook Flight {selectedDelay.flight_no}</h2>
            <p className="text-xs text-muted-foreground">
              {selectedDelay.affected_passengers} impacted passengers · Delayed +{selectedDelay.minutes}m due to {selectedDelay.reason}
            </p>

            <form onSubmit={handleConfirmRebooking} className="mt-5 space-y-4 text-xs">
              {/* Passenger Roster Breakdown */}
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-3 text-center">
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground">SkyWay Gold/VIP</span>
                  <div className="font-mono text-sm font-bold text-sky-gold">{Math.round(selectedDelay.affected_passengers * 0.08)} pax</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground">Connecting Flights</span>
                  <div className="font-mono text-sm font-bold text-amber-500">{Math.round(selectedDelay.affected_passengers * 0.22)} pax</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground">Special Assist (PRM)</span>
                  <div className="font-mono text-sm font-bold text-sky-accent">{Math.round(selectedDelay.affected_passengers * 0.04)} pax</div>
                </div>
              </div>

              {/* Recommended Rebooking Strategy */}
              <div>
                <label className="font-bold text-foreground">Select Alternate Flight Assignment</label>
                <div className="mt-2 space-y-2">
                  <label className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-colors ${
                    rebookOption === "next-flight" ? "border-sky-accent bg-sky-accent/10" : "border-border bg-background hover:bg-muted/40"
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="rebookOption"
                        checked={rebookOption === "next-flight"}
                        onChange={() => setRebookOption("next-flight")}
                      />
                      <div>
                        <div className="font-bold text-foreground">Next SkyWay Flight SW204 (Departs in 2h 15m)</div>
                        <div className="text-[11px] text-muted-foreground">84 open seats · Direct routing · Same terminal</div>
                      </div>
                    </div>
                    <span className="font-semibold text-emerald-500">Recommended</span>
                  </label>

                  <label className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-colors ${
                    rebookOption === "codeshare" ? "border-sky-accent bg-sky-accent/10" : "border-border bg-background hover:bg-muted/40"
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="rebookOption"
                        checked={rebookOption === "codeshare"}
                        onChange={() => setRebookOption("codeshare")}
                      />
                      <div>
                        <div className="font-bold text-foreground">Partner Airline Codeshare (LH402 / BA118)</div>
                        <div className="text-[11px] text-muted-foreground">Interline IATA e-ticket endorsement</div>
                      </div>
                    </div>
                    <span className="text-muted-foreground">Available</span>
                  </label>

                  <label className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-colors ${
                    rebookOption === "overnight" ? "border-sky-accent bg-sky-accent/10" : "border-border bg-background hover:bg-muted/40"
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="rebookOption"
                        checked={rebookOption === "overnight"}
                        onChange={() => setRebookOption("overnight")}
                      />
                      <div>
                        <div className="font-bold text-foreground">Next-Day Morning Flight + 5-Star Airport Hotel</div>
                        <div className="text-[11px] text-muted-foreground">Includes complimentary breakfast & transfers</div>
                      </div>
                    </div>
                    <span className="text-muted-foreground">Contingency</span>
                  </label>
                </div>
              </div>

              {/* Amenity & Communication Checkboxes */}
              <div className="rounded-xl border border-border bg-background p-3.5 space-y-2.5">
                <span className="font-bold text-foreground block">Automated Care Package</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={issueMealVoucher}
                    onChange={(e) => setIssueMealVoucher(e.target.checked)}
                    className="rounded"
                  />
                  <Utensils className="h-3.5 w-3.5 text-sky-accent" />
                  <span>Issue instant $25 digital airport food & beverage voucher</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={issueHotel}
                    onChange={(e) => setIssueHotel(e.target.checked)}
                    className="rounded"
                  />
                  <Hotel className="h-3.5 w-3.5 text-sky-accent" />
                  <span>Reserve airport transit hotel rooms for stranded passengers</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendSms}
                    onChange={(e) => setSendSms(e.target.checked)}
                    className="rounded"
                  />
                  <Send className="h-3.5 w-3.5 text-sky-accent" />
                  <span>Send instant SMS & WhatsApp notifications with new boarding passes</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => handleExportManifest(selectedDelay)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                  Export Manifest (CSV)
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDelay(null)}
                    className="rounded-lg border border-border px-3 py-2 font-medium hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-4 py-2 font-semibold text-white hover:opacity-90"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-sky-gold" />
                    Confirm & Issue Rebookings
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

