import { createFileRoute } from "@tanstack/react-router";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export const Route = createFileRoute("/admin/settings")({ component: SettingsPage });

function SettingsPage() {
  return (
    <>
      <AdminTopbar crumbs={[{ label: "Admin", to: "/admin" }, { label: "System settings" }]} />
      <main className="flex-1 space-y-5 p-6">
        <div>
          <h1 className="font-display text-3xl tracking-tight">System settings</h1>
          <p className="text-sm text-muted-foreground">Configure airline defaults, integrations, and platform behavior.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Appearance & Color Theme">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold text-foreground">Interface Color Scheme</p>
                <p className="text-xs text-muted-foreground">The platform is configured with an airline-grade Light Theme.</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700">
                Light Mode Enforced
              </span>
            </div>
          </Section>
          <Section title="PostgreSQL & Docker Infrastructure">
            <div className="rounded-lg border border-border bg-background p-3 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">PostgreSQL Database:</span>
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Drizzle ORM Configured
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Docker Compose Stack:</span>
                <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                  Containerized (App + Postgres)
                </span>
              </div>
              <div className="pt-2 text-muted-foreground">
                <p>Database URL: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">postgres://skyway_admin:***@localhost:5432/skyway_airlines</code></p>
                <p className="mt-1">Docker Target: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">docker-compose.yml (node:20 + postgres:16)</code></p>
              </div>
            </div>
            <Field label="Database Host / Connection String" value="postgres://skyway_admin:skyway_secure_pass@localhost:5432/skyway_airlines" />
            <Field label="PostgreSQL Container Name" value="skyway-postgres (Port 5432)" />
            <Toggle label="Automated DB Migration on Startup" on />
            <Toggle label="Enable Connection Pool (Max: 10)" on />
          </Section>

          <Section title="Airline information">
            <Field label="Airline name" value="SkyWay Airlines" />
            <Field label="IATA code" value="SW" />
            <Field label="ICAO code" value="SWA" />
            <Field label="Headquarters" value="London, United Kingdom" />
          </Section>

          <Section title="Localization">
            <Field label="Default time zone" value="UTC" />
            <Field label="Default currency" value="USD ($)" />
            <Field label="Languages" value="English, Español, Français, 日本語" />
          </Section>

          <Section title="Notifications & email">
            <Field label="Booking confirmation template" value="templates/booking-v3.html" />
            <Field label="Disruption alerts channel" value="ops-alerts@skyway.io" />
            <Toggle label="Push notifications" on />
            <Toggle label="SMS fallback" on />
          </Section>

          <Section title="Payments & integrations">
            <Field label="Primary gateway" value="Stripe" />
            <Field label="Secondary gateway" value="Adyen" />
            <Field label="Loyalty API" value="skymiles.internal" />
            <Toggle label="Apple Pay / Google Pay" on />
          </Section>

          <Section title="Backup & maintenance">
            <Field label="Backup schedule" value="Every 6 hours" />
            <Field label="Retention" value="90 days" />
            <Toggle label="Maintenance mode" />
          </Section>

          <Section title="API integrations">
            <Field label="Weather provider" value="Meteorix v3" />
            <Field label="Flight tracker" value="OpenSky Enterprise" />
            <Field label="OAuth providers" value="Google, Microsoft, Apple" />
          </Section>
        </div>

        <div className="flex justify-end gap-2">
          <button className="rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted">Discard</button>
          <button className="rounded-md bg-sky-dark px-3 py-2 text-xs font-semibold text-white hover:opacity-90">Save changes</button>
        </div>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-display text-lg">{title}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}
function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input defaultValue={value} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
    </label>
  );
}
function Toggle({ label, on }: { label: string; on?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <label className="relative inline-flex cursor-pointer items-center">
        <input type="checkbox" defaultChecked={on} className="peer sr-only" />
        <span className="h-5 w-9 rounded-full bg-muted after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-4" />
      </label>
    </div>
  );
}
