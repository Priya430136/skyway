import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search, Filter, Plus, X, Sparkles, User, Mail, Plane, Ticket as TicketIcon,
  AlertCircle, CheckCircle2, MessageSquare, ArrowRight, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { SupportTopbar } from "@/components/support/SupportTopbar";
import {
  tickets,
  addTicket,
  type Ticket,
  type TicketStatus,
  type TicketPriority,
  type TicketCategory,
  AGENTS,
  PASSENGERS,
  FLIGHTS,
  CATS,
} from "@/lib/support/mock";

export const Route = createFileRoute("/support/tickets")({ component: TicketsPage });

const STATUS_TONE: Record<TicketStatus, string> = {
  open: "bg-sky-500/15 text-sky-500",
  pending: "bg-amber-500/15 text-amber-500",
  resolved: "bg-emerald-500/15 text-emerald-500",
  closed: "bg-muted text-muted-foreground",
  escalated: "bg-red-500/15 text-red-500",
};

const PRIO_TONE: Record<TicketPriority, string> = {
  low: "text-muted-foreground",
  medium: "text-sky-500",
  high: "text-amber-500",
  urgent: "text-red-500 font-semibold",
};

const TICKET_TEMPLATES = [
  {
    label: "EU261 Flight Delay (>4h)",
    category: "Flight Delay" as TicketCategory,
    priority: "high" as TicketPriority,
    subject: "Claim for 4h+ Flight Delay under EU261 Regulation",
    preview: "Passenger flight was delayed over 4 hours at departure due to technical issue. Requesting EU261 compensation and voucher reimbursement.",
    flight: "SW841",
  },
  {
    label: "Lost Baggage on Arrival",
    category: "Lost Baggage" as TicketCategory,
    priority: "urgent" as TicketPriority,
    subject: "Missing checked baggage on carousel — tag SW-BAG-9921",
    preview: "Checked bag did not arrive at destination carousel. PIR report filed. Passenger requests direct courier to hotel and incidental allowance.",
    flight: "SW214",
  },
  {
    label: "Seat Upgrade & Meal Inconsistency",
    category: "Seat Issue" as TicketCategory,
    priority: "medium" as TicketPriority,
    subject: "Special Meal Request Not Provided in Business Class",
    preview: "Passenger ordered Gluten-Free special meal (GFML) 48h in advance; catering failed to load the meal. Requesting miles credit.",
    flight: "SW612",
  },
  {
    label: "Urgent Wheelchair Assistance",
    category: "Check-in Problem" as TicketCategory,
    priority: "urgent" as TicketPriority,
    subject: "Wheelchair Assistance SSR WCHR confirmation required",
    preview: "Elderly passenger requires ramp-side wheelchair assistance at connection airport. Ground handler notified.",
    flight: "SW508",
  },
  {
    label: "Duplicate Credit Card Charge",
    category: "Payment Issue" as TicketCategory,
    priority: "high" as TicketPriority,
    subject: "Double billed for seat selection and extra luggage",
    preview: "Passenger card was charged twice ($120 x 2) during online check-in for seat reservation. Requires immediate transaction refund.",
    flight: "SW733",
  },
];

function TicketsPage() {
  const [ticketList, setTicketList] = useState<Ticket[]>(() => [...tickets]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | TicketStatus>("all");
  const [priority, setPriority] = useState<"all" | TicketPriority>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | TicketCategory>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);

  // New ticket form state
  const [passenger, setPassenger] = useState("");
  const [email, setEmail] = useState("");
  const [booking, setBooking] = useState("");
  const [flight, setFlight] = useState("SW841");
  const [category, setCategory] = useState<TicketCategory>("Flight Delay");
  const [newPriority, setNewPriority] = useState<TicketPriority>("high");
  const [newStatus, setNewStatus] = useState<TicketStatus>("open");
  const [agent, setAgent] = useState(AGENTS[0]);
  const [subject, setSubject] = useState("");
  const [preview, setPreview] = useState("");

  const resetForm = () => {
    setPassenger("");
    setEmail("");
    setBooking(`SW${Math.floor(100000 + Math.random() * 900000)}`);
    setFlight("SW841");
    setCategory("Flight Delay");
    setNewPriority("high");
    setNewStatus("open");
    setAgent(AGENTS[0]);
    setSubject("");
    setPreview("");
  };

  const handleOpenNewTicket = () => {
    resetForm();
    setIsNewTicketOpen(true);
  };

  const handleApplyTemplate = (tpl: typeof TICKET_TEMPLATES[0]) => {
    const randomPax = PASSENGERS[Math.floor(Math.random() * PASSENGERS.length)];
    setPassenger(randomPax);
    setEmail(randomPax.toLowerCase().replace(/[^a-z]+/g, ".") + "@mail.com");
    setFlight(tpl.flight);
    setCategory(tpl.category);
    setNewPriority(tpl.priority);
    setSubject(tpl.subject);
    setPreview(tpl.preview);
    setBooking(`SW${Math.floor(100000 + Math.random() * 900000)}`);
    toast.info(`Loaded "${tpl.label}" template.`);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passenger.trim()) {
      toast.error("Please enter the passenger name.");
      return;
    }
    if (!subject.trim()) {
      toast.error("Please enter the ticket subject.");
      return;
    }

    const newTicketId = `TCK-${8450 + Math.floor(Math.random() * 2000)}`;
    const createdTicket: Ticket = {
      id: newTicketId,
      passenger: passenger.trim(),
      passengerId: `pax_${Math.floor(1000 + Math.random() * 9000)}`,
      email: email.trim() || `${passenger.toLowerCase().replace(/[^a-z]+/g, ".")}@mail.com`,
      booking: booking.trim() || `SW${Math.floor(100000 + Math.random() * 900000)}`,
      flight: flight.trim() || "SW841",
      category,
      priority: newPriority,
      status: newStatus,
      agent,
      subject: subject.trim(),
      preview: preview.trim() || `Passenger reports: ${subject.trim()} — needs immediate review and resolution.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sentiment: newPriority === "urgent" || newPriority === "high" ? "negative" : "neutral",
      aiConfidence: Math.floor(82 + Math.random() * 15),
    };

    addTicket(createdTicket);
    setTicketList((prev) => [createdTicket, ...prev]);
    setIsNewTicketOpen(false);
    toast.success(`Ticket ${newTicketId} created successfully!`, {
      description: `Assigned to ${agent} with ${newPriority} priority.`,
    });
  };

  const rows = useMemo(() => ticketList.filter((t) =>
    (status === "all" || t.status === status) &&
    (priority === "all" || t.priority === priority) &&
    (categoryFilter === "all" || t.category === categoryFilter) &&
    (agentFilter === "all" || t.agent === agentFilter) &&
    (q === "" || `${t.id} ${t.passenger} ${t.subject} ${t.booking} ${t.flight} ${t.category} ${t.agent}`.toLowerCase().includes(q.toLowerCase()))
  ), [ticketList, q, status, priority, categoryFilter, agentFilter]);

  return (
    <>
      <SupportTopbar
        crumbs={[{ label: "Support", to: "/support" }, { label: "Tickets" }]}
        action={{ label: "New ticket", onClick: handleOpenNewTicket }}
      />
      <main className="flex-1 space-y-5 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Ticket management</h1>
            <p className="text-sm text-muted-foreground">View, assign, resolve, and escalate passenger support cases.</p>
          </div>
          <button
            onClick={handleOpenNewTicket}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-sky-dark px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" /> New Ticket
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-xs">
            <div className="relative flex-1 min-w-56">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by ticket ID, passenger, booking, flight, subject…"
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm focus:border-sky-accent focus:outline-none focus:ring-1 focus:ring-sky-accent/30"
              />
              {q && (
                <button onClick={() => setQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "all" | TicketStatus)}
              className="rounded-md border border-border bg-background px-2.5 py-2 text-sm focus:border-sky-accent focus:outline-none"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="escalated">Escalated</option>
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as "all" | TicketPriority)}
              className="rounded-md border border-border bg-background px-2.5 py-2 text-sm focus:border-sky-accent focus:outline-none"
            >
              <option value="all">All priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button
              onClick={() => setShowAdvanced((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-2 text-xs transition ${
                showAdvanced || categoryFilter !== "all" || agentFilter !== "all"
                  ? "border-sky-accent bg-sky-500/10 text-sky-500 font-medium"
                  : "border-border hover:bg-muted text-muted-foreground"
              }`}
            >
              <Filter className="h-3.5 w-3.5" /> Advanced
            </button>
            <button
              onClick={handleOpenNewTicket}
              className="inline-flex items-center gap-1.5 rounded-md bg-sky-dark px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition"
            >
              <Plus className="h-3.5 w-3.5" /> New
            </button>
          </div>

          {/* Advanced Filter Expansion */}
          {showAdvanced && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as "all" | TicketCategory)}
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                >
                  <option value="all">All categories</option>
                  {CATS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground">Assigned Agent:</span>
                <select
                  value={agentFilter}
                  onChange={(e) => setAgentFilter(e.target.value)}
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                >
                  <option value="all">All agents</option>
                  {AGENTS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              {(categoryFilter !== "all" || agentFilter !== "all" || status !== "all" || priority !== "all" || q) && (
                <button
                  onClick={() => {
                    setStatus("all");
                    setPriority("all");
                    setCategoryFilter("all");
                    setAgentFilter("all");
                    setQ("");
                  }}
                  className="ml-auto inline-flex items-center gap-1 text-sky-accent hover:underline"
                >
                  <RefreshCw className="h-3 w-3" /> Reset all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tickets Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5">Ticket</th>
                  <th className="px-4 py-2.5">Passenger</th>
                  <th className="px-4 py-2.5">Booking</th>
                  <th className="px-4 py-2.5">Flight</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Priority</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Agent</th>
                  <th className="px-4 py-2.5">Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-t border-border/60 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <Link to="/support/tickets/$ticketId" params={{ ticketId: t.id }} className="font-mono text-xs font-medium text-sky-accent hover:underline">
                        {t.id}
                      </Link>
                      <div className="text-[11px] text-muted-foreground line-clamp-1 max-w-xs">{t.subject}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{t.passenger}</div>
                      <div className="text-[11px] text-muted-foreground">{t.email}</div>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{t.booking}</td>
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold">{t.flight}</td>
                    <td className="px-4 py-2.5 text-xs">{t.category}</td>
                    <td className={`px-4 py-2.5 text-xs capitalize ${PRIO_TONE[t.priority]}`}>{t.priority}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_TONE[t.status]}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{t.agent}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(t.updatedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                      No tickets match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground bg-muted/20">
            <span>Showing {rows.length} of {ticketList.length} tickets</span>
            <span>SkyWay Operations & Support CRM</span>
          </div>
        </div>
      </main>

      {/* New Ticket Modal */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-dark text-sky-gold">
                  <TicketIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Create Support Ticket</h2>
                  <p className="text-xs text-muted-foreground">Open a new passenger assistance case in the CRM</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewTicketOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Templates Bar */}
            <div className="border-b border-border bg-muted/15 px-6 py-2.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                <Sparkles className="h-3.5 w-3.5 text-sky-accent" />
                <span className="font-semibold text-foreground">Quick Scenarios:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TICKET_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="rounded-md border border-border/80 bg-background px-2.5 py-1 text-[11px] hover:border-sky-accent hover:bg-sky-500/10 hover:text-sky-500 transition-colors"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Passenger Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      required
                      value={passenger}
                      onChange={(e) => setPassenger(e.target.value)}
                      placeholder="e.g. Elena Rossi"
                      className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs outline-none focus:border-sky-accent focus:ring-1 focus:ring-sky-accent/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Passenger Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. elena.rossi@mail.com"
                      className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs outline-none focus:border-sky-accent focus:ring-1 focus:ring-sky-accent/30"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Booking Reference (PNR)</label>
                  <input
                    value={booking}
                    onChange={(e) => setBooking(e.target.value)}
                    placeholder="e.g. SW08419"
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs uppercase font-mono outline-none focus:border-sky-accent focus:ring-1 focus:ring-sky-accent/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Flight Number</label>
                  <select
                    value={flight}
                    onChange={(e) => setFlight(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs font-mono outline-none focus:border-sky-accent"
                  >
                    {FLIGHTS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TicketCategory)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  >
                    {CATS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs capitalize outline-none focus:border-sky-accent"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Initial Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs capitalize outline-none focus:border-sky-accent"
                  >
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="escalated">Escalated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Assigned Agent</label>
                  <select
                    value={agent}
                    onChange={(e) => setAgent(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  >
                    {AGENTS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Subject *</label>
                <input
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Flight cancelled — need emergency overnight rebooking"
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent focus:ring-1 focus:ring-sky-accent/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Case Summary / Passenger Message</label>
                <textarea
                  rows={3}
                  value={preview}
                  onChange={(e) => setPreview(e.target.value)}
                  placeholder="Detailed notes regarding passenger request or incident details..."
                  className="w-full rounded-lg border border-border bg-background p-3 text-xs outline-none focus:border-sky-accent focus:ring-1 focus:ring-sky-accent/30"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition"
                >
                  <CheckCircle2 className="h-4 w-4" /> Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

