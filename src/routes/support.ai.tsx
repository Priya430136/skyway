import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Languages, MessageSquare, AlertTriangle, Wand2, ThumbsUp, ThumbsDown, Loader2, Check, Copy } from "lucide-react";
import { SupportTopbar } from "@/components/support/SupportTopbar";
import { toast } from "sonner";

export const Route = createFileRoute("/support/ai")({ component: AiAssistantPage });

const CAPABILITIES = [
  { icon: MessageSquare, title: "Summarize conversation", desc: "Condense long threads into key points, agreements, and open questions." },
  { icon: AlertTriangle, title: "Detect sentiment",      desc: "Flag negative sentiment early and highlight urgent cases." },
  { icon: Wand2,         title: "Classify tickets",      desc: "Auto-categorize incoming tickets and route to the right team." },
  { icon: MessageSquare, title: "Suggest replies",       desc: "Generate professional draft replies grounded in policy." },
  { icon: Sparkles,      title: "Next action",           desc: "Recommend the best next step: approve, escalate, or investigate." },
  { icon: Languages,     title: "Translate messages",    desc: "Real-time translation into the passenger's preferred language." },
];

const RECENT = [
  { id: "1", title: "TCK-8420 · Elena Rossi",  action: "Approve compensation 400 EUR + meal voucher",   confidence: 94, tag: "Compensation" },
  { id: "2", title: "TCK-8425 · Chloé Dubois", action: "Send draft response — confirm rebooking",       confidence: 88, tag: "Rebooking" },
  { id: "3", title: "TCK-8432 · Miguel Santos",action: "Escalate to supervisor — negative sentiment",    confidence: 91, tag: "Escalation" },
  { id: "4", title: "TCK-8412 · Aiko Sato",    action: "Recommend partial refund per fare rules",         confidence: 82, tag: "Refund" },
];

function AiAssistantPage() {
  const [query, setQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, "up" | "down">>({});

  const handleGenerate = () => {
    if (!query.trim()) {
      toast.info("Please enter a question or ticket description first.");
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      const q = query.toLowerCase();
      let res = "";

      if (q.includes("eu261") || q.includes("delay") || q.includes("compensat")) {
        res = `**EU261 Assessment & Suggested Action:**\n\n• **Eligibility:** Flight delay exceeded 3 hours on an EU-operated route.\n• **Compensation Amount:** €400 per passenger under Regulation (EC) No 261/2004.\n• **Duty of Care:** Refreshment voucher and lounge access approved.\n• **Recommended Reply:** *"Dear Passenger, we sincerely regret the delay on your flight. In accordance with EU261 regulations, your compensation of €400 has been approved and processed to your original payment method."*`;
      } else if (q.includes("refund") || q.includes("cancel")) {
        res = `**Fare Rules & Refund Policy:**\n\n• **Ticket Class:** Flex Economy / Business — 100% refundable with zero penalty.\n• **Processing Timeline:** 3–5 business days to original payment method.\n• **SkyMiles Option:** Passenger may alternatively choose 120% value in SkyMiles travel credit.`;
      } else if (q.includes("baggage") || q.includes("lost") || q.includes("damaged")) {
        res = `**Baggage Resolution Workflow:**\n\n• **Action:** Create WorldTracer PIR incident report immediately.\n• **Immediate Relief:** Authorize up to $150 interim emergency expense reimbursement.\n• **Escalation:** Route to Central Baggage Tracing unit at hub station.`;
      } else {
        res = `**AI Support Assessment:**\n\n• **Identified Intent:** Passenger inquiry regarding SkyWay policy and journey details.\n• **Recommended Step:** Verify booking PNR, review ticket conditions, and provide empathetic confirmation.\n• **Customer Sentiment:** Neutral / Informative\n• **Policy Confidence:** 96%`;
      }

      setResponse(res);
      setIsGenerating(false);
      toast.success("Policy-grounded recommendation generated!");
    }, 600);
  };

  const handleCopy = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <SupportTopbar crumbs={[{ label: "Support", to: "/support" }, { label: "AI Assistant" }]} />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight">AI Smart Assistant</h1>
            <p className="text-sm text-muted-foreground">Grounded in SkyWay policies, EU261 rules, and your customer knowledge base.</p>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-500">Model healthy · 99.4% uptime</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="rounded-xl border border-border bg-card p-4">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-accent/10 text-sky-accent"><c.icon className="h-4 w-4" /></div>
              <div className="mt-3 font-semibold">{c.title}</div>
              <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
            <h3 className="font-display text-lg">Recent AI recommendations</h3>
            <ul className="mt-4 space-y-3">
              {RECENT.map((r) => (
                <li key={r.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{r.title}</span>
                    <span className="rounded-full bg-sky-accent/10 px-2 py-0.5 text-[10px] font-semibold text-sky-accent">{r.tag}</span>
                  </div>
                  <p className="mt-1 text-xs text-foreground/80">{r.action}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>Confidence</span>
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-sky-accent" style={{ width: `${r.confidence}%` }} />
                        </div>
                        <span className="font-mono">{r.confidence}%</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setFeedback((prev) => ({ ...prev, [r.id]: "up" }));
                          toast.success("Helpful feedback recorded!");
                        }}
                        className={`rounded-md border border-border p-1.5 hover:bg-muted ${feedback[r.id] === "up" ? "bg-emerald-500/20 text-emerald-600" : ""}`}
                      >
                        <ThumbsUp className="h-3.5 w-3.5 text-emerald-500" />
                      </button>
                      <button
                        onClick={() => {
                          setFeedback((prev) => ({ ...prev, [r.id]: "down" }));
                          toast.info("Feedback noted for model refinement.");
                        }}
                        className={`rounded-md border border-border p-1.5 hover:bg-muted ${feedback[r.id] === "down" ? "bg-red-500/20 text-red-600" : ""}`}
                      >
                        <ThumbsDown className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between">
            <div>
              <h3 className="font-display text-lg">Ask the assistant</h3>
              <p className="text-xs text-muted-foreground">Get a policy-grounded answer in seconds.</p>
              <textarea
                rows={4}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Is passenger eligible for EU261 compensation on SW841?"
                className="mt-3 w-full rounded-md border border-border bg-background p-3 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-sky-dark px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing Policy...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" /> Generate Advice
                  </>
                )}
              </button>
            </div>

            {response && (
              <div className="mt-4 rounded-lg border border-sky-accent/30 bg-sky-accent/5 p-3 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-sky-accent/20">
                  <span className="font-bold text-sky-accent flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Policy Guidance
                  </span>
                  <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground">
                    {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
                <div className="mt-2 text-foreground/90 whitespace-pre-line leading-relaxed">
                  {response}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
