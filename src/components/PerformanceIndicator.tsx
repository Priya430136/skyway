import { useState, useEffect } from "react";
import { Gauge, Zap } from "lucide-react";
import { perfMonitor, subscribeToPerformance, getPortalCategory } from "@/lib/performance-monitor";
import { PerformanceMonitorModal } from "@/components/PerformanceMonitorModal";

interface PerformanceIndicatorProps {
  portalScope?: "operations" | "admin" | "support" | "passenger";
  className?: string;
}

export function PerformanceIndicator({ portalScope, className = "" }: PerformanceIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    perfMonitor.init();
    const unsub = subscribeToPerformance(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, []);

  const stats = perfMonitor.getPortalStats();
  const targetScope = portalScope || "operations";
  const portalStat = stats.find((s) => s.portal === targetScope);
  const latency = portalStat?.avgDurationMs || 145;
  const isHealthy = latency < 350;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition hover:opacity-85 shadow-xs ${
          isHealthy
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        } ${className}`}
        title="SkyWay APM: Click to view load time metrics, Web Vitals, and bottleneck diagnostics"
        aria-label="APM Performance Monitor"
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isHealthy ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isHealthy ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
        </span>
        <span className="font-mono font-bold">{latency}ms</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground hidden xl:inline">
          · APM
        </span>
      </button>

      <PerformanceMonitorModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
