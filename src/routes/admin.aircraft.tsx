import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Fuel, Wrench, Trash2, Edit3, Check, X, Plane, AlertCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { fleet as initialFleet, type Aircraft } from "@/lib/admin/mock";

export const Route = createFileRoute("/admin/aircraft")({ component: AircraftPage });

function AircraftPage() {
  const [aircraftList, setAircraftList] = useState<Aircraft[]>(initialFleet);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAircraft, setEditingAircraft] = useState<Aircraft | null>(null);
  const [maintAircraft, setMaintAircraft] = useState<Aircraft | null>(null);
  const [retiringAircraft, setRetiringAircraft] = useState<Aircraft | null>(null);

  // Add form state
  const [tail, setTail] = useState("N");
  const [model, setModel] = useState("Airbus A350-900");
  const [capacity, setCapacity] = useState(314);
  const [airport, setAirport] = useState("JFK");
  const [fuel, setFuel] = useState(100);
  const [maintStatus, setMaintStatus] = useState<"ok" | "due" | "in-service">("ok");

  // Maintenance form state
  const [maintType, setMaintType] = useState("C-Check (Comprehensive Structural)");
  const [maintHangar, setMaintHangar] = useState("JFK Technical Operations Center Hangar 4");
  const [maintDate, setMaintDate] = useState("2026-09-15");

  const handleAddAircraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tail.trim() || !model.trim()) {
      toast.error("Tail number and model are required.");
      return;
    }

    const newCraft: Aircraft = {
      tail: tail.trim().toUpperCase(),
      model: model.trim(),
      capacity: Number(capacity) || 180,
      airport: airport.trim().toUpperCase(),
      flight: null,
      maint: maintStatus,
      available: true,
      fuel: Number(fuel) || 100,
    };

    setAircraftList((prev) => [newCraft, ...prev]);
    setIsAddOpen(false);
    setTail("N");
    toast.success(`Aircraft ${newCraft.tail} registered into active fleet!`, {
      description: `${newCraft.model} · Hub: ${newCraft.airport}`,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAircraft) return;

    setAircraftList((prev) =>
      prev.map((a) => (a.tail === editingAircraft.tail ? { ...editingAircraft } : a))
    );
    toast.success(`Aircraft ${editingAircraft.tail} specifications updated.`);
    setEditingAircraft(null);
  };

  const handleConfirmMaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintAircraft) return;

    setAircraftList((prev) =>
      prev.map((a) =>
        a.tail === maintAircraft.tail
          ? { ...a, maint: "in-service", available: false }
          : a
      )
    );
    toast.success(`Scheduled ${maintType} for ${maintAircraft.tail}`, {
      description: `Target Date: ${maintDate} at ${maintHangar}. Aircraft flagged in-service.`,
    });
    setMaintAircraft(null);
  };

  const handleConfirmRetire = () => {
    if (!retiringAircraft) return;

    setAircraftList((prev) => prev.filter((a) => a.tail !== retiringAircraft.tail));
    toast.info(`Aircraft ${retiringAircraft.tail} decommissioned and archived.`);
    setRetiringAircraft(null);
  };

  return (
    <>
      <AdminTopbar
        crumbs={[{ label: "Admin", to: "/admin" }, { label: "Aircraft" }]}
        action={{
          label: "Add Aircraft",
          onClick: () => setIsAddOpen(true),
        }}
      />
      <main className="flex-1 space-y-5 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Aircraft management</h1>
            <p className="text-sm text-muted-foreground">Track fleet availability, maintenance schedules, and fuel telemetry.</p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-sky-dark px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 shadow-xs transition"
          >
            <Plus className="h-3.5 w-3.5" /> Add aircraft
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {aircraftList.map((a) => (
            <div key={a.tail} className="rounded-xl border border-border bg-card p-4 shadow-xs transition hover:border-sky-accent/40">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-lg font-semibold text-sky-dark dark:text-sky-300">{a.tail}</div>
                  <div className="text-xs text-muted-foreground">{a.model}</div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize border ${
                  a.maint === "ok" ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" :
                  a.maint === "due" ? "bg-amber-500/15 text-amber-500 border-amber-500/30" :
                  "bg-purple-500/15 text-purple-500 border-purple-500/30"
                }`}>{a.maint === "in-service" ? "in service" : a.maint}</span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div><dt className="text-muted-foreground">Capacity</dt><dd className="mt-0.5 font-mono">{a.capacity} seats</dd></div>
                <div><dt className="text-muted-foreground">Location</dt><dd className="mt-0.5 font-mono">{a.airport}</dd></div>
                <div><dt className="text-muted-foreground">Assigned Flight</dt><dd className="mt-0.5 font-mono">{a.flight ?? "Standby"}</dd></div>
                <div><dt className="text-muted-foreground">Availability</dt><dd className="mt-0.5">{a.available ? <span className="font-semibold text-emerald-500">Available</span> : <span className="text-muted-foreground">Assigned / In Maint</span>}</dd></div>
              </dl>

              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Fuel className="h-3 w-3" /> Fuel Reserve</span>
                  <span className="font-mono font-medium">{a.fuel}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full transition-all ${a.fuel > 60 ? "bg-emerald-500" : a.fuel > 30 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${a.fuel}%` }} />
                </div>
              </div>

              <div className="mt-4 flex gap-1.5 text-[11px]">
                <button
                  onClick={() => setEditingAircraft({ ...a })}
                  className="flex-1 rounded border border-border px-2 py-1.5 font-medium hover:bg-muted transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => setMaintAircraft(a)}
                  className="flex-1 rounded border border-border px-2 py-1.5 font-medium hover:bg-muted transition"
                >
                  Schedule maint.
                </button>
                <button
                  onClick={() => setRetiringAircraft(a)}
                  className="rounded border border-red-500/40 px-2 py-1.5 font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition"
                >
                  Retire
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Add Aircraft Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-dark text-sky-gold">
                  <Plane className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Induct Aircraft into Fleet</h2>
                  <p className="text-xs text-muted-foreground">Register registration, aircraft type, and hub</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddAircraft} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Tail Registration *</label>
                  <input
                    required
                    value={tail}
                    onChange={(e) => setTail(e.target.value)}
                    placeholder="e.g. N789SK"
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs font-mono uppercase outline-none focus:border-sky-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Aircraft Model *</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  >
                    <option value="Airbus A350-900">Airbus A350-900 (Widebody)</option>
                    <option value="Airbus A321neo">Airbus A321neo (Narrowbody)</option>
                    <option value="Airbus A320neo">Airbus A320neo (Short-haul)</option>
                    <option value="Boeing 787-9 Dreamliner">Boeing 787-9 Dreamliner</option>
                    <option value="Boeing 777-300ER">Boeing 777-300ER</option>
                    <option value="Embraer E195-E2">Embraer E195-E2 (Regional)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Total Passenger Seats</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Home Base Airport</label>
                  <input
                    value={airport}
                    onChange={(e) => setAirport(e.target.value)}
                    placeholder="e.g. JFK"
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs font-mono uppercase outline-none focus:border-sky-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Initial Fuel Tank %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={fuel}
                    onChange={(e) => setFuel(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Maintenance Status</label>
                  <select
                    value={maintStatus}
                    onChange={(e) => setMaintStatus(e.target.value as any)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  >
                    <option value="ok">OK (Airworthy)</option>
                    <option value="due">Due for Routine Check</option>
                    <option value="in-service">In-Service (Hangar)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-5 py-2 text-xs font-semibold text-white hover:opacity-90 transition shadow-sm"
                >
                  <Check className="h-4 w-4" /> Induct Aircraft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Aircraft Modal */}
      {editingAircraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-dark text-sky-gold">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Edit Aircraft {editingAircraft.tail}</h2>
                  <p className="text-xs text-muted-foreground">Modify model, base, or fuel capacity</p>
                </div>
              </div>
              <button
                onClick={() => setEditingAircraft(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Model Description</label>
                <input
                  value={editingAircraft.model}
                  onChange={(e) => setEditingAircraft({ ...editingAircraft, model: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Hub Station</label>
                  <input
                    value={editingAircraft.airport}
                    onChange={(e) => setEditingAircraft({ ...editingAircraft, airport: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs font-mono uppercase outline-none focus:border-sky-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Seat Capacity</label>
                  <input
                    type="number"
                    value={editingAircraft.capacity}
                    onChange={(e) => setEditingAircraft({ ...editingAircraft, capacity: Number(e.target.value) })}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Fuel %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingAircraft.fuel}
                    onChange={(e) => setEditingAircraft({ ...editingAircraft, fuel: Number(e.target.value) })}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Maintenance</label>
                  <select
                    value={editingAircraft.maint}
                    onChange={(e) => setEditingAircraft({ ...editingAircraft, maint: e.target.value as any })}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  >
                    <option value="ok">OK</option>
                    <option value="due">Due</option>
                    <option value="in-service">In-service</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingAircraft(null)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-5 py-2 text-xs font-semibold text-white hover:opacity-90 transition shadow-sm"
                >
                  <Check className="h-4 w-4" /> Save Specs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Maintenance Modal */}
      {maintAircraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-dark text-sky-gold">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Schedule Maintenance</h2>
                  <p className="text-xs text-muted-foreground">Book hangar slot for {maintAircraft.tail}</p>
                </div>
              </div>
              <button
                onClick={() => setMaintAircraft(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmMaint} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Inspection Type</label>
                <select
                  value={maintType}
                  onChange={(e) => setMaintType(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                >
                  <option value="A-Check (Routine Systems & Avionics)">A-Check (Routine Systems & Avionics · ~10 hrs)</option>
                  <option value="B-Check (Deep Component Diagnostic)">B-Check (Deep Component Diagnostic · ~48 hrs)</option>
                  <option value="C-Check (Comprehensive Structural)">C-Check (Comprehensive Structural & Hull · ~2 weeks)</option>
                  <option value="D-Check (Heavy Maintenance Complete Strip)">D-Check (Heavy Stripdown & Recertification · ~1 month)</option>
                  <option value="Turbofan Engine Overhaul">Rolls-Royce / GE Engine Overhaul</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Hangar Location</label>
                <select
                  value={maintHangar}
                  onChange={(e) => setMaintHangar(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                >
                  <option value="JFK Technical Operations Center Hangar 4">JFK Technical Operations Center Hangar 4</option>
                  <option value="LHR British Engineering Complex Hangar 2">LHR British Engineering Complex Hangar 2</option>
                  <option value="DXB Middle-East Avionics Facility">DXB Middle-East Avionics Facility</option>
                  <option value="ORD Mid-Continent Overhaul Bay 1">ORD Mid-Continent Overhaul Bay 1</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Scheduled Commencing Date</label>
                <input
                  type="date"
                  value={maintDate}
                  onChange={(e) => setMaintDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setMaintAircraft(null)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-5 py-2 text-xs font-semibold text-white hover:opacity-90 transition shadow-sm"
                >
                  <Check className="h-4 w-4" /> Book Hangar Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Retire Aircraft Modal */}
      {retiringAircraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-red-500/10 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-red-500/20 text-red-600">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Retire Aircraft {retiringAircraft.tail}</h2>
                  <p className="text-xs text-muted-foreground">{retiringAircraft.model}</p>
                </div>
              </div>
              <button
                onClick={() => setRetiringAircraft(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-muted-foreground">
                Are you sure you want to permanently decommission aircraft <strong className="text-foreground">{retiringAircraft.tail}</strong>?
              </p>

              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-700 dark:text-red-300">
                <p className="font-semibold">Decommissioning steps:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] mt-1">
                  <li>Aircraft will be unlinked from all flight rotations</li>
                  <li>FAA/EASA deregistration export bundle will be queued</li>
                  <li>Hull logbook will be archived in the security vault</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setRetiringAircraft(null)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
                >
                  Keep in Fleet
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRetire}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-5 py-2 text-xs font-semibold text-white hover:bg-red-700 transition shadow-sm"
                >
                  <Trash2 className="h-4 w-4" /> Confirm Decommission
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

