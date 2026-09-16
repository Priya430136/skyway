import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Upload, Plane, Clock, AlertTriangle, XCircle, Check, X, Calendar, MapPin, Gauge } from "lucide-react";
import { toast } from "sonner";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { flights as initialFlights, type AdminFlight } from "@/lib/admin/mock";

export const Route = createFileRoute("/admin/flights")({ component: FlightsPage });

const statusColor: Record<string, string> = {
  "on-time": "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30",
  "delayed": "bg-amber-500/15 text-amber-500 border border-amber-500/30",
  "boarding": "bg-sky-accent/15 text-sky-accent border border-sky-500/30",
  "in-flight": "bg-purple-500/15 text-purple-500 border border-purple-500/30",
  "cancelled": "bg-red-500/15 text-red-500 border border-red-500/30",
  "completed": "bg-muted text-muted-foreground border border-border",
};

function FlightsPage() {
  const [flightList, setFlightList] = useState<AdminFlight[]>(initialFlights);

  // Modals
  const [isAddFlightOpen, setIsAddFlightOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState<AdminFlight | null>(null);
  const [delayingFlight, setDelayingFlight] = useState<AdminFlight | null>(null);
  const [cancellingFlight, setCancellingFlight] = useState<AdminFlight | null>(null);

  // Add flight form
  const [newNo, setNewNo] = useState("SK-");
  const [newRoute, setNewRoute] = useState("JFK → LHR");
  const [newAircraft, setNewAircraft] = useState("N789SK · A350-900");
  const [newGate, setNewGate] = useState("B12");
  const [newSchedule, setNewSchedule] = useState("14:30 - 22:45");
  const [newCapacity, setNewCapacity] = useState(300);
  const [newOccupancy, setNewOccupancy] = useState(240);

  // Delay form
  const [delayDuration, setDelayDuration] = useState("45 mins");
  const [delayReason, setDelayReason] = useState("Air Traffic Control Hold");

  // Import state
  const [importBatch, setImportBatch] = useState("Summer 2026 High-Density Transatlantic");
  const [isImporting, setIsImporting] = useState(false);

  const handleAddFlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNo.trim() || !newRoute.trim()) {
      toast.error("Flight number and route are required.");
      return;
    }

    const flight: AdminFlight = {
      id: `f_${Date.now()}`,
      no: newNo.trim().toUpperCase(),
      route: newRoute.trim(),
      aircraft: newAircraft.trim(),
      gate: newGate.trim().toUpperCase(),
      schedule: newSchedule.trim(),
      status: "on-time",
      occupancy: Number(newOccupancy) || 0,
      capacity: Number(newCapacity) || 300,
    };

    setFlightList((prev) => [flight, ...prev]);
    setIsAddFlightOpen(false);
    setNewNo("SK-");
    toast.success(`Flight ${flight.no} added to live schedule!`, {
      description: `${flight.route} · Gate ${flight.gate}`,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlight) return;

    setFlightList((prev) =>
      prev.map((f) => (f.id === editingFlight.id ? { ...editingFlight } : f))
    );
    toast.success(`Flight ${editingFlight.no} schedule updated.`);
    setEditingFlight(null);
  };

  const handleConfirmDelay = () => {
    if (!delayingFlight) return;

    setFlightList((prev) =>
      prev.map((f) =>
        f.id === delayingFlight.id ? { ...f, status: "delayed" } : f
      )
    );
    toast.warning(`Flight ${delayingFlight.no} delayed by ${delayDuration}`, {
      description: `Reason: ${delayReason}. Passenger notifications dispatched.`,
    });
    setDelayingFlight(null);
  };

  const handleConfirmCancel = () => {
    if (!cancellingFlight) return;

    setFlightList((prev) =>
      prev.map((f) =>
        f.id === cancellingFlight.id ? { ...f, status: "cancelled" } : f
      )
    );
    toast.error(`Flight ${cancellingFlight.no} marked CANCELLED`, {
      description: "Automatic re-accommodation and refunds queued.",
    });
    setCancellingFlight(null);
  };

  const handleExecuteImport = () => {
    setIsImporting(true);
    setTimeout(() => {
      const importedFlights: AdminFlight[] = [
        {
          id: `imp_${Date.now()}_1`,
          no: "SK-902",
          route: "BOS → DUB",
          aircraft: "N321SK · A321neo",
          gate: "E4",
          schedule: "19:15 - 06:40 (+1)",
          status: "on-time",
          occupancy: 182,
          capacity: 196,
        },
        {
          id: `imp_${Date.now()}_2`,
          no: "SK-904",
          route: "ORD → FRA",
          aircraft: "N787SK · B787-9",
          gate: "M18",
          schedule: "17:50 - 09:20 (+1)",
          status: "on-time",
          occupancy: 268,
          capacity: 290,
        },
        {
          id: `imp_${Date.now()}_3`,
          no: "SK-908",
          route: "SEA → HND",
          aircraft: "N350SK · A350-900",
          gate: "S12",
          schedule: "13:00 - 16:30 (+1)",
          status: "on-time",
          occupancy: 295,
          capacity: 314,
        },
      ];

      setFlightList((prev) => [...importedFlights, ...prev]);
      setIsImporting(false);
      setIsImportOpen(false);
      toast.success(`Imported 3 active flights from "${importBatch}"!`);
    }, 600);
  };

  return (
    <>
      <AdminTopbar
        crumbs={[{ label: "Admin", to: "/admin" }, { label: "Flights" }]}
        action={{
          label: "Add Flight",
          onClick: () => setIsAddFlightOpen(true),
        }}
      />
      <main className="flex-1 space-y-5 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Flight management</h1>
            <p className="text-sm text-muted-foreground">Add, edit, cancel, or delay any flight in the schedule.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted transition shadow-xs"
            >
              <Upload className="h-3.5 w-3.5" /> Import schedule
            </button>
            <button
              onClick={() => setIsAddFlightOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-sky-dark px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 transition shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Add flight
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Flight</th>
                <th className="px-4 py-2.5">Route</th>
                <th className="px-4 py-2.5">Aircraft</th>
                <th className="px-4 py-2.5">Gate</th>
                <th className="px-4 py-2.5">Schedule</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Occupancy</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flightList.map((f) => {
                const pct = Math.round((f.occupancy / f.capacity) * 100);
                return (
                  <tr key={f.id} className="border-t border-border/60 hover:bg-muted/30 transition">
                    <td className="px-4 py-2.5 font-mono font-semibold text-sky-dark dark:text-sky-300">{f.no}</td>
                    <td className="px-4 py-2.5 font-medium">{f.route}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{f.aircraft}</td>
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold">{f.gate}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{f.schedule}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusColor[f.status]}`}>{f.status}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <div className={`h-full ${pct > 90 ? "bg-emerald-500" : pct > 60 ? "bg-sky-accent" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">{f.occupancy}/{f.capacity}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-[11px]">
                        <button
                          onClick={() => setEditingFlight({ ...f })}
                          className="rounded border border-border px-2 py-1 hover:bg-muted font-medium transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDelayingFlight(f)}
                          className="rounded border border-amber-500/40 px-2 py-1 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-medium transition"
                        >
                          Delay
                        </button>
                        <button
                          onClick={() => setCancellingFlight(f)}
                          className="rounded border border-red-500/40 px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-500/10 font-medium transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* Add Flight Modal */}
      {isAddFlightOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-dark text-sky-gold">
                  <Plane className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Schedule New Flight</h2>
                  <p className="text-xs text-muted-foreground">Register route, aircraft assignment, and timings</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddFlightOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddFlight} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Flight Number *</label>
                  <input
                    required
                    value={newNo}
                    onChange={(e) => setNewNo(e.target.value)}
                    placeholder="e.g. SK-404"
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs font-mono uppercase outline-none focus:border-sky-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Route (Origin → Dest) *</label>
                  <input
                    required
                    value={newRoute}
                    onChange={(e) => setNewRoute(e.target.value)}
                    placeholder="e.g. JFK → LHR"
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Assigned Aircraft Tail</label>
                  <input
                    value={newAircraft}
                    onChange={(e) => setNewAircraft(e.target.value)}
                    placeholder="e.g. N789SK · A350-900"
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs font-mono outline-none focus:border-sky-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Departure Gate</label>
                  <input
                    value={newGate}
                    onChange={(e) => setNewGate(e.target.value)}
                    placeholder="e.g. B12"
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs font-mono uppercase outline-none focus:border-sky-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Schedule (Departure - Arrival UTC)</label>
                <input
                  value={newSchedule}
                  onChange={(e) => setNewSchedule(e.target.value)}
                  placeholder="e.g. 14:30 - 22:45"
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs font-mono outline-none focus:border-sky-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Total Seat Capacity</label>
                  <input
                    type="number"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Initial Booked Occupancy</label>
                  <input
                    type="number"
                    value={newOccupancy}
                    onChange={(e) => setNewOccupancy(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddFlightOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-5 py-2 text-xs font-semibold text-white hover:opacity-90 transition shadow-sm"
                >
                  <Check className="h-4 w-4" /> Add Flight to Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Flight Modal */}
      {editingFlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-dark text-sky-gold">
                  <Plane className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Edit Flight {editingFlight.no}</h2>
                  <p className="text-xs text-muted-foreground">Modify gate, route, or operational status</p>
                </div>
              </div>
              <button
                onClick={() => setEditingFlight(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Route</label>
                  <input
                    value={editingFlight.route}
                    onChange={(e) => setEditingFlight({ ...editingFlight, route: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Gate</label>
                  <input
                    value={editingFlight.gate}
                    onChange={(e) => setEditingFlight({ ...editingFlight, gate: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs font-mono uppercase outline-none focus:border-sky-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Schedule</label>
                  <input
                    value={editingFlight.schedule}
                    onChange={(e) => setEditingFlight({ ...editingFlight, schedule: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs font-mono outline-none focus:border-sky-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Flight Status</label>
                  <select
                    value={editingFlight.status}
                    onChange={(e) => setEditingFlight({ ...editingFlight, status: e.target.value as any })}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  >
                    <option value="on-time">On-time</option>
                    <option value="boarding">Boarding</option>
                    <option value="in-flight">In-Flight</option>
                    <option value="delayed">Delayed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingFlight(null)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-5 py-2 text-xs font-semibold text-white hover:opacity-90 transition shadow-sm"
                >
                  <Check className="h-4 w-4" /> Save Schedule Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delay Flight Modal */}
      {delayingFlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-amber-500/10 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500/20 text-amber-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Postpone Flight {delayingFlight.no}</h2>
                  <p className="text-xs text-muted-foreground">{delayingFlight.route} · Gate {delayingFlight.gate}</p>
                </div>
              </div>
              <button
                onClick={() => setDelayingFlight(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Estimated Delay Duration</label>
                <select
                  value={delayDuration}
                  onChange={(e) => setDelayDuration(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                >
                  <option value="15 mins">15 minutes (Gate Turnaround)</option>
                  <option value="30 mins">30 minutes (Luggage Loading)</option>
                  <option value="45 mins">45 minutes (ATC Flow Management)</option>
                  <option value="1 hr 15 mins">1 hour 15 minutes (Weather Hold)</option>
                  <option value="2 hrs">2 hours (Technical Inspection)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Operational Delay Reason</label>
                <select
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                >
                  <option value="Air Traffic Control Hold">Air Traffic Control Flow Management</option>
                  <option value="Adverse Weather Conditions">Adverse Weather / De-icing Queue</option>
                  <option value="Late Inbound Aircraft">Late Arriving Inbound Aircraft</option>
                  <option value="Pre-flight Maintenance Check">Minor Avionics / Maintenance Check</option>
                  <option value="Cabin Crew Rest Period">Crew Rest / Shift Swap Mandate</option>
                </select>
              </div>

              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Broadcasting this delay will update the airport FIDS monitors and send push SMS to all {delayingFlight.occupancy} ticketed passengers.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setDelayingFlight(null)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelay}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-5 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition shadow-sm"
                >
                  <Check className="h-4 w-4" /> Apply Delay Notice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Flight Modal */}
      {cancellingFlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-red-500/10 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-red-500/20 text-red-600">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Cancel Flight {cancellingFlight.no}</h2>
                  <p className="text-xs text-muted-foreground">{cancellingFlight.route}</p>
                </div>
              </div>
              <button
                onClick={() => setCancellingFlight(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-muted-foreground">
                Are you sure you want to cancel flight <strong className="text-foreground">{cancellingFlight.no}</strong> ({cancellingFlight.route})?
              </p>

              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-700 dark:text-red-300 space-y-1">
                <p className="font-semibold">Cancellation Protocol Initiated:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>Gate {cancellingFlight.gate} will be released back to airport ops</li>
                  <li>{cancellingFlight.occupancy} passengers will receive automatic flight re-booking or 100% refund vouchers</li>
                  <li>Aircraft {cancellingFlight.aircraft} will be returned to hangar standby</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setCancellingFlight(null)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
                >
                  Keep Flight
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-5 py-2 text-xs font-semibold text-white hover:bg-red-700 transition shadow-sm"
                >
                  <XCircle className="h-4 w-4" /> Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Schedule Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-dark text-white">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Import Flight Schedule</h2>
                  <p className="text-xs text-muted-foreground">Load IATA / OAG seasonal slot files</p>
                </div>
              </div>
              <button
                onClick={() => setIsImportOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Select Schedule Package</label>
                <select
                  value={importBatch}
                  onChange={(e) => setImportBatch(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                >
                  <option value="Summer 2026 High-Density Transatlantic">Summer 2026 High-Density Transatlantic (Slots Approved)</option>
                  <option value="Fall 2026 Transpacific Expansion">Fall 2026 Transpacific Expansion (Tokyo/Singapore)</option>
                  <option value="Winter 2026 Caribbean & Ski Hubs">Winter 2026 Caribbean & Alpine Charters</option>
                </select>
              </div>

              <div className="rounded-xl border-2 border-dashed border-border p-6 text-center hover:bg-muted/20 transition cursor-pointer">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs font-medium">Click to upload CSV or drag .oag schedule file</p>
                <p className="text-[11px] text-muted-foreground mt-1">SSIM / IATA Standard format accepted</p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isImporting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-5 py-2 text-xs font-semibold text-white hover:opacity-90 transition shadow-sm disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" /> {isImporting ? "Processing Slots..." : "Import Schedule"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

