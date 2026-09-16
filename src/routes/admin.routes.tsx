import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, MapPin, BarChart3, Trash2, Edit3, Check, X, Plane, ArrowRight, DollarSign, Activity } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { toast } from "sonner";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { routes as initialRoutes, type Route as AdminRoute } from "@/lib/admin/mock";

export const Route = createFileRoute("/admin/routes")({ component: RoutesPage });

function RoutesPage() {
  const [routeList, setRouteList] = useState<AdminRoute[]>(initialRoutes);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<AdminRoute | null>(null);
  const [perfRoute, setPerfRoute] = useState<AdminRoute | null>(null);
  const [deletingRoute, setDeletingRoute] = useState<AdminRoute | null>(null);

  // Add form state
  const [newPair, setNewPair] = useState("JFK ⇄ CDG");
  const [newDistance, setNewDistance] = useState(5830);
  const [newPax, setNewPax] = useState(240000);
  const [newLoad, setNewLoad] = useState(88);
  const [newProfit, setNewProfit] = useState(14.5);

  const handleAddRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPair.trim()) {
      toast.error("City pair is required.");
      return;
    }

    const route: AdminRoute = {
      id: `r_${Date.now()}`,
      pair: newPair.trim(),
      distance: Number(newDistance) || 3000,
      pax: Number(newPax) || 100000,
      load: Number(newLoad) || 80,
      profit: Number(newProfit) || 5.0,
      trend: +(Math.random() * 8 - 2).toFixed(1),
    };

    setRouteList((prev) => [route, ...prev]);
    setIsAddOpen(false);
    toast.success(`Network corridor ${route.pair} created!`, {
      description: `Distance: ${route.distance.toLocaleString()} km · Projected Profit: $${route.profit.toFixed(1)}M/yr`,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute) return;

    setRouteList((prev) =>
      prev.map((r) => (r.id === editingRoute.id ? { ...editingRoute } : r))
    );
    toast.success(`Route ${editingRoute.pair} targets updated.`);
    setEditingRoute(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingRoute) return;

    setRouteList((prev) => prev.filter((r) => r.id !== deletingRoute.id));
    toast.info(`Route corridor ${deletingRoute.pair} decommissioned from network.`);
    setDeletingRoute(null);
  };

  return (
    <>
      <AdminTopbar
        crumbs={[{ label: "Admin", to: "/admin" }, { label: "Routes" }]}
        action={{
          label: "New Route",
          onClick: () => setIsAddOpen(true),
        }}
      />
      <main className="flex-1 space-y-5 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Route management</h1>
            <p className="text-sm text-muted-foreground">Performance, demand, and profitability across the network.</p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-sky-dark px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 shadow-xs transition"
          >
            <Plus className="h-3.5 w-3.5" /> New route
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Route</th>
                <th className="px-4 py-2.5">Distance</th>
                <th className="px-4 py-2.5">Passengers / yr</th>
                <th className="px-4 py-2.5">Load factor</th>
                <th className="px-4 py-2.5">Profit ($M)</th>
                <th className="px-4 py-2.5">Trend</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {routeList.map((r) => (
                <tr key={r.id} className="border-t border-border/60 hover:bg-muted/30 transition">
                  <td className="px-4 py-2.5 font-semibold text-sky-dark dark:text-sky-300">{r.pair}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.distance.toLocaleString()} km</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{r.pax.toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-sky-accent" style={{ width: `${r.load}%` }} />
                      </div>
                      <span className="text-xs font-mono">{r.load}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono font-medium text-emerald-600 dark:text-emerald-400">${r.profit.toFixed(1)}M</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${r.trend >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {r.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(r.trend).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-[11px]">
                      <button
                        onClick={() => setEditingRoute({ ...r })}
                        className="rounded border border-border px-2 py-1 font-medium hover:bg-muted transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setPerfRoute(r)}
                        className="rounded border border-border px-2 py-1 font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 transition"
                      >
                        Performance
                      </button>
                      <button
                        onClick={() => setDeletingRoute(r)}
                        className="rounded border border-red-500/40 px-2 py-1 font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* New Route Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-dark text-sky-gold">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Open New Route Corridor</h2>
                  <p className="text-xs text-muted-foreground">Add city pair and set load targets</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddRoute} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Route City Pair *</label>
                <input
                  required
                  value={newPair}
                  onChange={(e) => setNewPair(e.target.value)}
                  placeholder="e.g. JFK ⇄ CDG"
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs font-semibold outline-none focus:border-sky-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Distance (km)</label>
                  <input
                    type="number"
                    value={newDistance}
                    onChange={(e) => setNewDistance(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Annual Projected Pax</label>
                  <input
                    type="number"
                    value={newPax}
                    onChange={(e) => setNewPax(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Target Load Factor %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newLoad}
                    onChange={(e) => setNewLoad(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Projected Profit ($M/yr)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newProfit}
                    onChange={(e) => setNewProfit(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  />
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
                  <Check className="h-4 w-4" /> Initialize Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Route Modal */}
      {editingRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-dark text-sky-gold">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Edit Route {editingRoute.pair}</h2>
                  <p className="text-xs text-muted-foreground">Adjust targets and network parameters</p>
                </div>
              </div>
              <button
                onClick={() => setEditingRoute(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Route Corridor</label>
                <input
                  value={editingRoute.pair}
                  onChange={(e) => setEditingRoute({ ...editingRoute, pair: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs font-semibold outline-none focus:border-sky-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Distance (km)</label>
                  <input
                    type="number"
                    value={editingRoute.distance}
                    onChange={(e) => setEditingRoute({ ...editingRoute, distance: Number(e.target.value) })}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Annual Passengers</label>
                  <input
                    type="number"
                    value={editingRoute.pax}
                    onChange={(e) => setEditingRoute({ ...editingRoute, pax: Number(e.target.value) })}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Load Factor %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingRoute.load}
                    onChange={(e) => setEditingRoute({ ...editingRoute, load: Number(e.target.value) })}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Profit ($M/yr)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingRoute.profit}
                    onChange={(e) => setEditingRoute({ ...editingRoute, profit: Number(e.target.value) })}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingRoute(null)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-5 py-2 text-xs font-semibold text-white hover:opacity-90 transition shadow-sm"
                >
                  <Check className="h-4 w-4" /> Save Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Route Performance Modal */}
      {perfRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-dark text-sky-gold">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">{perfRoute.pair} · Performance Deep Dive</h2>
                  <p className="text-xs text-muted-foreground">{perfRoute.distance.toLocaleString()} km · Trailing 12-month analytics</p>
                </div>
              </div>
              <button
                onClick={() => setPerfRoute(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <p className="text-[11px] text-muted-foreground">Load Factor</p>
                  <p className="text-lg font-bold text-sky-dark dark:text-sky-300 font-mono mt-0.5">{perfRoute.load}%</p>
                  <span className="text-[10px] text-emerald-500 font-medium">+3.2% vs industry avg</span>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <p className="text-[11px] text-muted-foreground">Annual Net Profit</p>
                  <p className="text-lg font-bold text-emerald-600 font-mono mt-0.5">${perfRoute.profit.toFixed(1)}M</p>
                  <span className="text-[10px] text-muted-foreground font-medium">Margin: 18.4%</span>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <p className="text-[11px] text-muted-foreground">Total Pax</p>
                  <p className="text-lg font-bold font-mono mt-0.5">{(perfRoute.pax / 1000).toFixed(0)}k</p>
                  <span className="text-[10px] text-sky-500 font-medium">94.2% On-time</span>
                </div>
              </div>

              <div className="rounded-xl border border-border p-4 bg-background">
                <h4 className="text-xs font-semibold mb-2">Monthly Load Factor Trend (%)</h4>
                <div className="h-40">
                  <ResponsiveContainer>
                    <AreaChart data={[
                      { m: "Jan", l: perfRoute.load - 6 },
                      { m: "Feb", l: perfRoute.load - 4 },
                      { m: "Mar", l: perfRoute.load - 2 },
                      { m: "Apr", l: perfRoute.load + 1 },
                      { m: "May", l: perfRoute.load + 3 },
                      { m: "Jun", l: perfRoute.load + 5 },
                      { m: "Jul", l: perfRoute.load + 6 },
                      { m: "Aug", l: perfRoute.load + 5 },
                      { m: "Sep", l: perfRoute.load + 2 },
                      { m: "Oct", l: perfRoute.load },
                      { m: "Nov", l: perfRoute.load - 2 },
                      { m: "Dec", l: perfRoute.load + 4 },
                    ]}>
                      <XAxis dataKey="m" tick={{ fontSize: 10 }} />
                      <YAxis domain={[60, 100]} tick={{ fontSize: 10 }} width={25} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Area dataKey="l" stroke="#0284c7" fill="#0284c7" fillOpacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setPerfRoute(null)}
                  className="rounded-lg bg-sky-dark px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition"
                >
                  Close Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Route Modal */}
      {deletingRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-red-500/10 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-red-500/20 text-red-600">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Decommission Corridor</h2>
                  <p className="text-xs text-muted-foreground">{deletingRoute.pair}</p>
                </div>
              </div>
              <button
                onClick={() => setDeletingRoute(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-muted-foreground">
                Are you sure you want to discontinue route corridor <strong className="text-foreground">{deletingRoute.pair}</strong>?
              </p>
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-700 dark:text-red-300">
                All future seasonal scheduled slots on this corridor will be relinquished and aircraft rotated.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setDeletingRoute(null)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-5 py-2 text-xs font-semibold text-white hover:bg-red-700 transition shadow-sm"
                >
                  <Trash2 className="h-4 w-4" /> Decommission Route
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

