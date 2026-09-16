import { LineChart, Line, ResponsiveContainer } from "recharts";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export function KpiCard({
  label, value, delta, icon: Icon, trend, tone = "neutral",
}: {
  label: string;
  value: string | number;
  delta?: number;
  icon: LucideIcon;
  trend?: number[];
  tone?: "neutral" | "positive" | "warning" | "danger";
}) {
  const toneCls = {
    neutral: "text-sky-accent",
    positive: "text-emerald-500",
    warning: "text-amber-500",
    danger: "text-red-500",
  }[tone];

  const up = (delta ?? 0) >= 0;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl leading-none tracking-tight text-foreground">{value}</p>
          {delta !== undefined && (
            <p className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold ${up ? "text-emerald-500" : "text-red-500"}`}>
              {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(delta).toFixed(1)}%<span className="text-muted-foreground font-normal ml-1">vs. yesterday</span>
            </p>
          )}
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-lg bg-muted ${toneCls}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 h-10">
          <ResponsiveContainer>
            <LineChart data={trend.map((v, i) => ({ i, v }))}>
              <Line dataKey="v" type="monotone" stroke="currentColor" strokeWidth={2} dot={false} className={toneCls} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
