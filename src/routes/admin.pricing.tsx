import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Eye, Copy, Trash2, Edit3, Check, X, Tag, Percent, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { pricing as initialPricing, type PricingRule } from "@/lib/admin/mock";

export const Route = createFileRoute("/admin/pricing")({ component: PricingPage });

function PricingPage() {
  const [pricingList, setPricingList] = useState<PricingRule[]>(initialPricing);
  const [preview, setPreview] = useState(false);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);

  // Add rule form
  const [ruleName, setRuleName] = useState("Peak Summer Holiday Surcharge");
  const [scope, setScope] = useState("All Transatlantic Corridors");
  const [adjust, setAdjust] = useState("+22%");
  const [ruleType, setRuleType] = useState<"surge" | "discount" | "coupon" | "seasonal">("seasonal");
  const [isActive, setIsActive] = useState(true);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) {
      toast.error("Rule name is required.");
      return;
    }

    const newRule: PricingRule = {
      id: `pr_${Date.now()}`,
      name: ruleName.trim(),
      scope: scope.trim() || "All Flights",
      adjust: adjust.trim().startsWith("+") || adjust.trim().startsWith("-") ? adjust.trim() : `+${adjust.trim()}`,
      type: ruleType,
      active: isActive,
    };

    setPricingList((prev) => [newRule, ...prev]);
    setIsAddOpen(false);
    toast.success(`Pricing rule "${newRule.name}" created!`, {
      description: `Adjustment: ${newRule.adjust} · Scope: ${newRule.scope}`,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;

    setPricingList((prev) =>
      prev.map((p) => (p.id === editingRule.id ? { ...editingRule } : p))
    );
    toast.success(`Pricing rule "${editingRule.name}" updated.`);
    setEditingRule(null);
  };

  const handleDuplicate = (rule: PricingRule) => {
    const dup: PricingRule = {
      ...rule,
      id: `pr_${Date.now()}`,
      name: `${rule.name} (Copy)`,
      active: false,
    };
    setPricingList((prev) => [dup, ...prev]);
    toast.success(`Duplicated rule as "${dup.name}"`);
  };

  const handleToggleActive = (id: string) => {
    setPricingList((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const next = !p.active;
          toast.info(`Rule "${p.name}" is now ${next ? "active" : "paused"}.`);
          return { ...p, active: next };
        }
        return p;
      })
    );
  };

  const handleDeleteRule = (id: string, name: string) => {
    setPricingList((prev) => prev.filter((p) => p.id !== id));
    toast.info(`Deleted pricing rule "${name}".`);
  };

  return (
    <>
      <AdminTopbar
        crumbs={[{ label: "Admin", to: "/admin" }, { label: "Pricing" }]}
        action={{
          label: "New Rule",
          onClick: () => setIsAddOpen(true),
        }}
      />
      <main className="flex-1 space-y-5 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Pricing management</h1>
            <p className="text-sm text-muted-foreground">Dynamic rules, yield management, seasonal surcharges, and fare promo rules.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setPreview((p) => !p);
                toast.info(!preview ? "Preview mode activated: simulating yield adjustments." : "Exited preview mode.");
              }}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition ${
                preview ? "border-sky-accent bg-sky-50 text-sky-dark dark:bg-sky-950/40 dark:text-sky-300" : "border-border bg-card hover:bg-muted"
              }`}
            >
              <Eye className="h-3.5 w-3.5" /> {preview ? "Exit preview" : "Preview changes"}
            </button>
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-sky-dark px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 shadow-xs transition"
            >
              <Plus className="h-3.5 w-3.5" /> New rule
            </button>
          </div>
        </div>

        {preview && (
          <div className="rounded-xl border border-sky-accent/40 bg-sky-accent/5 p-4 text-sm text-sky-dark dark:text-sky-300 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-500" />
              <span><strong>Simulation Mode:</strong> Projected revenue lift is <strong>+8.4%</strong> across transatlantic sectors with 0.9% estimated demand attrition.</span>
            </div>
            <span className="text-xs font-mono bg-sky-dark text-white px-2 py-0.5 rounded">Yield Sandbox</span>
          </div>
        )}

        <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {pricingList.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-4 shadow-xs transition hover:border-sky-accent/40">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-lg tracking-tight">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.scope}</div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={p.active}
                    onChange={() => handleToggleActive(p.id)}
                    className="peer sr-only"
                  />
                  <span className="h-5 w-9 rounded-full bg-muted after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-4" />
                </label>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className={`font-display text-3xl tracking-tight ${p.adjust.startsWith("-") ? "text-emerald-500" : "text-amber-500"}`}>{p.adjust}</span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded">{p.type}</span>
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-[11px]">
                <button
                  onClick={() => setEditingRule({ ...p })}
                  className="flex-1 rounded border border-border px-2.5 py-1.5 font-medium hover:bg-muted transition"
                >
                  Edit rule
                </button>
                <button
                  onClick={() => handleDuplicate(p)}
                  className="rounded border border-border px-2.5 py-1.5 font-medium hover:bg-muted transition"
                  title="Duplicate rule"
                >
                  <Copy className="h-3.5 w-3.5 inline mr-1" /> Duplicate
                </button>
                <button
                  onClick={() => handleDeleteRule(p.id, p.name)}
                  className="rounded border border-red-500/30 px-2 py-1.5 text-red-500 hover:bg-red-500/10 transition"
                  title="Delete rule"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* New Rule Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-dark text-sky-gold">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">New Pricing Rule</h2>
                  <p className="text-xs text-muted-foreground">Configure fare algorithm or promotion</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddRule} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Rule Name *</label>
                <input
                  required
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. Flash Summer Sale"
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Scope / Applicability</label>
                <input
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  placeholder="e.g. First & Business cabins, JFK routes"
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Fare Adjustment *</label>
                  <input
                    required
                    value={adjust}
                    onChange={(e) => setAdjust(e.target.value)}
                    placeholder="+20% or -$50"
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs font-mono font-bold outline-none focus:border-sky-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Rule Strategy Type</label>
                  <select
                    value={ruleType}
                    onChange={(e) => setRuleType(e.target.value as any)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent capitalize"
                  >
                    <option value="seasonal">Seasonal Surge</option>
                    <option value="surge">Dynamic Yield Surge</option>
                    <option value="discount">Advance Purchase Discount</option>
                    <option value="coupon">Promo Coupon Code</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="activeCheck" className="text-xs cursor-pointer select-none">
                  Enable rule immediately across booking engines
                </label>
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
                  <Check className="h-4 w-4" /> Save Pricing Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-dark text-sky-gold">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Edit Pricing Rule</h2>
                  <p className="text-xs text-muted-foreground">{editingRule.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingRule(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Rule Name</label>
                <input
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Scope</label>
                <input
                  value={editingRule.scope}
                  onChange={(e) => setEditingRule({ ...editingRule, scope: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Adjustment</label>
                  <input
                    value={editingRule.adjust}
                    onChange={(e) => setEditingRule({ ...editingRule, adjust: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs font-mono font-bold outline-none focus:border-sky-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Type</label>
                  <select
                    value={editingRule.type}
                    onChange={(e) => setEditingRule({ ...editingRule, type: e.target.value as any })}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent capitalize"
                  >
                    <option value="seasonal">Seasonal</option>
                    <option value="surge">Surge</option>
                    <option value="discount">Discount</option>
                    <option value="coupon">Coupon</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-5 py-2 text-xs font-semibold text-white hover:opacity-90 transition shadow-sm"
                >
                  <Check className="h-4 w-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

