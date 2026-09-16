import { useState, useEffect, useMemo } from "react";
import { Gauge, Zap, AlertTriangle, Play, RefreshCw, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  perfMonitor,
  subscribeToPerformance,
  type PortalStats,
  type BottleneckAlert,
} from "@/lib/performance-monitor";
import { PerformanceMonitorModal } from "@/components/PerformanceMonitorModal";

interface PortalPerformanceSectionProps {
  currentPortal?: "operations" | "admin" | "support" | "passenger";
}

export function PortalPerformanceSection({ currentPortal = "operations" }: PortalPerformanceSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    perfMonitor.init();
    const unsub = subscribeToPerformance(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, []);

  const stats = useMemo(() => perfMonitor.getPortalStats(), []);
  const bottlenecks = useMemo(() => perfMonitor.getBottlenecks(), []);
  const health = useMemo(() => perfMonitor.getOverallHealthScore(), []);

  const handleBenchmark = async () => {
    setIsBenchmarking(true);
    toast.info("Profiling response latency across all operational portals...");
    try {
      await perfMonitor.runSyntheticBenchmark();
      toast.success("Benchmark completed! Portal latency updated.");
    } catch {
      toast.error("Benchmark failed.");
    } finally {
      setIsBenchmarking(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
            <Gauge className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg">System & Portal Performance APM</h3>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.2 text-[10px] font-bold text-emerald-600 border border-emerald-500/30">
                Score {health.score}/100
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Real-time load times, render latency, and bottleneck diagnosis across critical operational portals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBenchmark}
            disabled={isBenchmarking}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-semibold hover:bg-muted transition disabled:opacity-50"
          >
            {isBenchmarking ? <RefreshCw className="h-3 w-3 animate-spin text-sky-accent" /> : <Play className="h-3 w-3 text-sky-accent" />}
            {isBenchmarking ? "Profiling…" : "Run Benchmark"}
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-sky-dark px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition"
          >
            Full APM Monitor <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Portal Latency Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((portal) => {
          const isSelected = portal.portal === currentPortal;
          return (
            <div
              key={portal.portal}
              className={`rounded-lg border p-3.5 transition space-y-2.5 ${
                isSelected
                  ? "border-sky-500/50 bg-sky-500/5 ring-1 ring-sky-500/30"
                  : "border-border/80 bg-background/50 hover:bg-muted/20"
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <div>
                  <div className="font-semibold text-xs text-foreground truncate">{portal.name}</div>
                  <div className="text-[10px] text-muted-foreground">{portal.sampleCount} recorded loads</div>
                </div>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                    portal.status === "excellent"
                      ? "bg-emerald-500/15 text-emerald-600"
                      : portal.status === "good"
                      ? "bg-sky-500/15 text-sky-600"
                      : "bg-amber-500/15 text-amber-600"
                  }`}
                >
                  {portal.status.replace("_", " ")}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-[10px] text-muted-foreground">Avg Load: </span>
                  <span className="font-mono font-bold text-sm text-foreground">{portal.avgDurationMs}ms</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">P90: </span>
                  <span className="font-mono font-bold text-xs text-sky-600 dark:text-sky-400">{portal.p90Ms}ms</span>
                </div>
              </div>

              {/* Latency Progress Bar */}
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    portal.p90Ms < 200 ? "bg-emerald-500" : portal.p90Ms < 400 ? "bg-sky-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${Math.min(100, (portal.p90Ms / 500) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottlenecks Warning Banner or Status Summary */}
      {bottlenecks.length > 0 ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2.5 text-xs">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-foreground">Active Bottleneck Notice: </span>
            <span className="text-muted-foreground">{bottlenecks[0].message}. </span>
            <span className="font-medium text-amber-700 dark:text-amber-400">
              Recommendation: {bottlenecks[0].recommendation}
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="text-muted-foreground">
              <strong className="text-foreground">Optimal Performance:</strong> All operational consoles and passenger web app modules are responding within target 250ms SLA thresholds.
            </span>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline shrink-0"
          >
            View Diagnostics &rarr;
          </button>
        </div>
      )}

      <PerformanceMonitorModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
