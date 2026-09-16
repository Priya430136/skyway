import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import {
  Bot, Send, Sparkles, Plus, MessageSquare, Trash2, Copy, Check, Download,
  Eraser, Mic, MicOff, Paperclip, Zap, AlertTriangle, Plane, Building2, Gauge,
  Bell, LineChart, TrendingUp, Loader2, Search, PlaneTakeoff, FileText,
  Users, Wrench, CloudLightning, Activity, ChevronRight, X, ExternalLink, Filter,
  FileCode,
} from "lucide-react";
import { OpsTopbar } from "@/components/ops/OpsTopbar";
import { useAuth } from "@/lib/auth";
import { askCopilot } from "@/lib/ops/copilot.functions";

export const Route = createFileRoute("/ops/copilot")({
  head: () => ({
    meta: [
      { title: "AI Operations Copilot · SkyWay OCC" },
      { name: "description", content: "Conversational AI assistant for SkyWay Airlines operations — flights, disruptions, predictions, reports, and recommendations." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CopilotPage,
});

// ---------------- Types & storage ----------------
type Role = "user" | "assistant";
type ChatMessage = { id: string; role: Role; content: string; at: string };
type Conversation = { id: string; title: string; createdAt: string; messages: ChatMessage[] };

const STORAGE_KEY = "skyway.copilot.conversations.v1";

const SUGGESTIONS = [
  { icon: Plane, label: "Show delayed flights", prompt: "Show me all currently delayed SkyWay flights, ordered by delay severity, and highlight any with >90 minutes of delay." },
  { icon: FileText, label: "Generate today's report", prompt: "Generate today's daily operations report for SkyWay Airlines with KPIs, delay summary, disruption impact, and top actions." },
  { icon: TrendingUp, label: "Predict disruptions", prompt: "Predict likely disruptions in the next 4 hours. Give risk level, confidence, reasoning, and recommended mitigation for each." },
  { icon: Building2, label: "Show busiest airports", prompt: "Which airports in the SkyWay network currently have the highest congestion? Include throughput, gate utilization, and inbound queue." },
  { icon: Activity, label: "Analyze operational performance", prompt: "Analyze today's operational performance vs. the 7-day average. Focus on OTP, cancellation rate, load factor, and turnaround time." },
  { icon: AlertTriangle, label: "Find flights at risk", prompt: "List SkyWay flights at risk of delay in the next 2 hours. Include reason, confidence, and recommended recovery action." },
];

const SUGGESTED_PROMPTS = [
  "Show all delayed flights.",
  "Which flights are likely to be delayed today?",
  "Which airport currently has congestion?",
  "Generate today's operations report.",
  "Show cancelled flights.",
  "Show flights waiting for crew.",
  "Which aircraft require maintenance?",
  "Which routes have the most delays?",
  "Show passengers affected by disruptions.",
  "Recommend recovery actions.",
  "Generate executive summary.",
  "Summarize today's airline performance.",
];

// ---------------- Mock ops data (for right dashboard) ----------------
const FLIGHTS_AT_RISK = [
  { flight: "SW732", route: "LHR → JFK", risk: 78, reason: "Convective wx at JFK" },
  { flight: "SW220", route: "AMS → SIN", risk: 64, reason: "Low visibility AMS" },
  { flight: "SW1225", route: "DXB → HKG", risk: 71, reason: "Airspace flow control" },
  { flight: "SW508", route: "FRA → BOM", risk: 55, reason: "Crew connection tight" },
];

const ACTIVE_ALERTS = [
  { level: "critical", icon: CloudLightning, text: "Severe thunderstorms across HKG airspace — 6 flights impacted." },
  { level: "high", icon: Wrench, text: "A320 SW-A012 grounded for unscheduled maintenance." },
  { level: "medium", icon: Users, text: "Crew shortage risk at FRA base for evening bank." },
  { level: "low", icon: Plane, text: "Minor pushback delays at LHR T5 — 8-12 min avg." },
];

const KPIS = [
  { label: "OTP", value: "82.4%", trend: "+1.2%", tone: "positive" as const },
  { label: "Cancellations", value: "3", trend: "-1", tone: "positive" as const },
  { label: "Load factor", value: "89%", trend: "+0.4%", tone: "positive" as const },
  { label: "Fleet in service", value: "142/148", trend: "6 AOG", tone: "neutral" as const },
];

const AIRPORT_STATUS = [
  { code: "LHR", state: "Amber", flights: 42 },
  { code: "JFK", state: "Red", flights: 31 },
  { code: "FRA", state: "Green", flights: 38 },
  { code: "DXB", state: "Amber", flights: 27 },
  { code: "SIN", state: "Green", flights: 22 },
];

type RecLink =
  | { kind: "flight"; id: string }
  | { kind: "kpi"; id: string }
  | { kind: "route"; to: string };

const RECOMMENDATION_FEED: Array<{ title: string; why: string; priority: string; link: RecLink }> = [
  { title: "Pre-position SW-A006 at FRA", why: "Absorbs 3 at-risk rotations tonight.", priority: "High", link: { kind: "kpi", id: "Fleet in service" } },
  { title: "Trigger EU261 auto-comp for SW732", why: "Meets delay threshold at ETA+45.", priority: "Medium", link: { kind: "flight", id: "SW732" } },
  { title: "Reassign crew C-8821 to SW508", why: "Prevents crew-out cancellation.", priority: "High", link: { kind: "flight", id: "SW508" } },
  { title: "Slot swap for SW1225 via alternate FIR", why: "Bypasses flow control; recovers ~35 min.", priority: "Medium", link: { kind: "flight", id: "SW1225" } },
  { title: "Review OTP recovery playbook", why: "Sustains today's +1.2% gain into evening bank.", priority: "Low", link: { kind: "kpi", id: "OTP" } },
];

// ---------------- Utils ----------------
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const now = () => new Date().toISOString();
const titleFromPrompt = (p: string) => (p.length <= 42 ? p : p.slice(0, 42).trim() + "…");

function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Conversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function saveConversations(list: Conversation[]) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50))); } catch { /* ignore */ }
}

// ================== Page ==================
function CopilotPage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  // Restrict to Operations Controllers & Admins.
  useEffect(() => {
    if (!ready) return;
    if (!user || (user.role !== "ops" && user.role !== "admin")) {
      navigate({ to: "/signin", search: { redirect: "/ops/copilot" }, replace: true });
    }
  }, [ready, user, navigate]);

  const [hydrated, setHydrated] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [historyQuery, setHistoryQuery] = useState("");
  const [detail, setDetail] = useState<RecLink | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content?: string } | null>(null);
  const [isListening, setIsListening] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const ask = useServerFn(askCopilot);

  // Load conversations on mount (client-only to avoid hydration mismatch).
  useEffect(() => {
    const list = loadConversations();
    setConversations(list);
    setActiveId(list[0]?.id ?? null);
    setHydrated(true);
  }, []);

  useEffect(() => { if (hydrated) saveConversations(conversations); }, [conversations, hydrated]);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );
  const messages = active?.messages ?? [];

  // Autoscroll on new message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, sending]);

  const startNewChat = () => {
    setActiveId(null);
    setError(null);
    setInput("");
    setAttachedFile(null);
    toast.info("Started new Copilot thread.");
  };

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
    toast.success("Conversation deleted.");
  };

  const clearActive = () => {
    if (!active) return;
    setConversations((prev) => prev.map((c) => c.id === active.id ? { ...c, messages: [] } : c));
    toast.success("Active conversation messages cleared.");
  };

  const exportActive = () => {
    if (!active || active.messages.length === 0) return;
    const text = `# ${active.title}\n\n${active.messages.map((m) => `**${m.role === "user" ? "You" : "SkyWay Copilot"}** · ${new Date(m.at).toLocaleString()}\n\n${m.content}`).join("\n\n---\n\n")}`;
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SkyWay_Copilot_${active.title.replace(/[^\w-]+/g, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Exported conversation as Markdown!");
  };

  const copyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy text.");
    }
  };

  // Toggle voice recognition
  const toggleVoiceInput = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser environment. Please type your prompt.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        toast.info("Listening... speak your operations query.");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          toast.success("Voice transcribed!");
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech error", event.error);
        setIsListening(false);
        toast.error(`Voice input: ${event.error || "Capture unavailable"}`);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
      toast.error("Could not activate microphone. Please check permissions.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setAttachedFile({ name: file.name, content: content ? content.slice(0, 4000) : undefined });
      toast.success(`Attached file: ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const send = async (raw: string) => {
    let text = raw.trim();
    if (!text && attachedFile) {
      text = `Analyze attached file ${attachedFile.name}`;
    }
    if (!text || sending) return;
    setError(null);

    let finalPrompt = text;
    if (attachedFile?.content) {
      finalPrompt += `\n\n[Attached File: ${attachedFile.name}]\n${attachedFile.content}`;
    }

    let convo = active;
    if (!convo) {
      convo = { id: uid(), title: titleFromPrompt(text), createdAt: now(), messages: [] };
      setConversations((prev) => [convo!, ...prev]);
      setActiveId(convo.id);
    }
    const userMsg: ChatMessage = { id: uid(), role: "user", content: finalPrompt, at: now() };
    setConversations((prev) => prev.map((c) => c.id === convo!.id ? { ...c, messages: [...c.messages, userMsg] } : c));
    setInput("");
    setAttachedFile(null);
    setSending(true);

    try {
      const history = [...convo.messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const { content } = await ask({ data: { messages: history } });
      const aiMsg: ChatMessage = { id: uid(), role: "assistant", content, at: now() };
      setConversations((prev) => prev.map((c) => c.id === convo!.id ? { ...c, messages: [...c.messages, aiMsg] } : c));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Copilot request failed";
      setError(message);
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); send(input); };
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const filteredHistory = conversations.filter((c) =>
    !historyQuery || c.title.toLowerCase().includes(historyQuery.toLowerCase())
    || c.messages.some((m) => m.content.toLowerCase().includes(historyQuery.toLowerCase())),
  );

  if (!ready || !user || (user.role !== "ops" && user.role !== "admin")) return null;

  return (
    <>
      <OpsTopbar crumbs={[{ label: "OCC", to: "/ops" }, { label: "AI Copilot" }]} />
      <main className="flex-1 min-h-0 p-4 lg:p-6">
        <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
          {/* -------- Conversation history -------- */}
          <aside className="hidden lg:flex min-h-0 flex-col rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-3">
              <div className="flex items-center gap-2 text-sm font-semibold"><MessageSquare className="h-4 w-4 text-sky-accent" /> Conversations</div>
              <button onClick={startNewChat} className="grid h-7 w-7 place-items-center rounded-md bg-sky-dark text-white hover:opacity-90 transition-opacity" title="New chat">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={historyQuery}
                  onChange={(e) => setHistoryQuery(e.target.value)}
                  placeholder="Search history…"
                  className="w-full rounded-md border border-border bg-background py-1.5 pl-7 pr-2 text-xs"
                />
              </div>
            </div>
            <ul className="flex-1 space-y-1 overflow-y-auto p-2 pt-0">
              {filteredHistory.length === 0 && (
                <li className="rounded-md border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground">
                  No conversations yet.
                </li>
              )}
              {filteredHistory.map((c) => {
                const isActive = c.id === activeId;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setActiveId(c.id)}
                      className={`group flex w-full items-start justify-between gap-2 rounded-md border px-2.5 py-2 text-left text-xs transition-colors ${
                        isActive ? "border-sky-accent/60 bg-sky-accent/10" : "border-transparent hover:bg-muted"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{c.title}</div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          {new Date(c.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} · {c.messages.length} msg
                        </div>
                      </div>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); deleteConversation(c.id); } }}
                        className="opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* -------- Chat panel -------- */}
          <section className="flex min-h-0 flex-col rounded-xl border border-border bg-card">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-sky-dark to-sky-accent text-white shadow-sm">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">SkyWay AI Operations Copilot</div>
                  <div className="text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online · Gemini 2.5 Flash Engine</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={exportActive}
                  disabled={!active || messages.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium hover:bg-muted disabled:opacity-40 transition-colors"
                  title="Export as markdown"
                >
                  <Download className="h-3.5 w-3.5 text-sky-accent" /> Export
                </button>
                <button
                  type="button"
                  onClick={clearActive}
                  disabled={!active || messages.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <Eraser className="h-3.5 w-3.5 text-muted-foreground" /> Clear
                </button>
                <button
                  type="button"
                  onClick={startNewChat}
                  className="inline-flex items-center gap-1.5 rounded-md bg-sky-dark px-3 py-1.5 text-[11px] font-semibold text-white hover:opacity-90 shadow-sm transition-opacity"
                >
                  <Plus className="h-3.5 w-3.5" /> New chat
                </button>
              </div>
            </div>

            {/* Messages / welcome */}
            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-5">
              {messages.length === 0 ? (
                <WelcomeScreen onPick={(p) => send(p)} disabled={sending} userName={user.name} />
              ) : (
                <div className="mx-auto flex max-w-3xl flex-col gap-5">
                  {messages.map((m) => (
                    <MessageBubble
                      key={m.id}
                      message={m}
                      copied={copiedId === m.id}
                      onCopy={() => copyMessage(m.id, m.content)}
                    />
                  ))}
                  {sending && <TypingIndicator />}
                  {error && (
                    <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
                      <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-3.5 w-3.5" /> Copilot error</div>
                      <div className="mt-1">{error}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Suggested prompt chips */}
            {messages.length > 0 && (
              <div className="border-t border-border p-3">
                <div className="mx-auto max-w-3xl">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Suggested follow-ups</div>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_PROMPTS.slice(0, 6).map((p) => (
                      <button
                        key={p}
                        onClick={() => send(p)}
                        disabled={sending}
                        className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-foreground/80 hover:border-sky-accent hover:text-sky-accent disabled:opacity-40 transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".txt,.csv,.json,.md,.log"
            />

            {/* Composer */}
            <form onSubmit={onSubmit} className="border-t border-border p-3">
              <div className="mx-auto max-w-3xl rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-sky-accent/40 shadow-sm">
                {attachedFile && (
                  <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <FileCode className="h-3.5 w-3.5 text-sky-accent" />
                      <span>{attachedFile.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedFile(null)}
                      className="rounded p-0.5 hover:bg-muted"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={2}
                  placeholder={isListening ? "Listening... speak your operations query..." : "Ask about flights, delays, airports, aircraft, passengers, or draft a report…"}
                  className="w-full resize-none rounded-t-xl bg-transparent p-3 text-sm outline-none placeholder:text-muted-foreground/70"
                />
                <div className="flex items-center justify-between gap-2 border-t border-border/60 px-2 py-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach flight log, brief, or CSV"
                      className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={toggleVoiceInput}
                      title={isListening ? "Stop voice listening" : "Voice input"}
                      className={`grid h-8 w-8 place-items-center rounded-md transition-colors ${
                        isListening ? "bg-red-500 text-white animate-pulse" : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                    <span className="ml-1 text-[10px] text-muted-foreground hidden sm:inline">Press Enter to send · Shift+Enter for newline</span>
                  </div>
                  <button
                    type="submit"
                    disabled={(!input.trim() && !attachedFile) || sending}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
                  >
                    {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    {sending ? "Thinking…" : "Send"}
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* -------- Right dashboard -------- */}
          <aside className="hidden xl:flex min-h-0 flex-col gap-3 overflow-y-auto pr-1">
            <DashCard title="Today's KPIs" icon={Gauge}>
              <div className="grid grid-cols-2 gap-2">
                {KPIS.map((k) => (
                  <button
                    key={k.label}
                    onClick={() => setDetail({ kind: "kpi", id: k.label })}
                    className="rounded-lg border border-border bg-background/60 p-2.5 text-left transition-colors hover:border-sky-accent/50 hover:bg-sky-accent/5"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</div>
                    <div className="mt-0.5 text-lg font-semibold">{k.value}</div>
                    <div className={`text-[10px] ${k.tone === "positive" ? "text-emerald-500" : "text-muted-foreground"}`}>{k.trend}</div>
                  </button>
                ))}
              </div>
            </DashCard>

            <DashCard title="Flights at risk" icon={PlaneTakeoff}>
              <ul className="space-y-1.5">
                {FLIGHTS_AT_RISK.map((f) => (
                  <li key={f.flight}>
                    <button
                      onClick={() => setDetail({ kind: "flight", id: f.flight })}
                      className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-background/60 p-2 text-left text-xs transition-colors hover:border-sky-accent/50 hover:bg-sky-accent/5"
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] font-semibold">{f.flight}</div>
                        <div className="truncate text-[10px] text-muted-foreground">{f.route} · {f.reason}</div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${f.risk >= 70 ? "bg-red-500/15 text-red-500" : "bg-amber-500/15 text-amber-500"}`}>{f.risk}%</span>
                    </button>
                  </li>
                ))}
              </ul>
            </DashCard>

            <DashCard title="Active alerts" icon={Bell}>
              <ul className="space-y-1.5">
                {ACTIVE_ALERTS.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-md border border-border bg-background/60 p-2 text-[11px]">
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${alertTone(a.level)}`}><a.icon className="h-3.5 w-3.5" /></span>
                    <span className="min-w-0 text-foreground/80">{a.text}</span>
                  </li>
                ))}
              </ul>
            </DashCard>

            <DashCard title="Airport status" icon={Building2}>
              <ul className="space-y-1">
                {AIRPORT_STATUS.map((a) => (
                  <li key={a.code} className="flex items-center justify-between rounded-md border border-border bg-background/60 px-2 py-1.5 text-xs">
                    <span className="font-mono font-semibold">{a.code}</span>
                    <span className="text-[10px] text-muted-foreground">{a.flights} flights</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${airportTone(a.state)}`}>{a.state}</span>
                  </li>
                ))}
              </ul>
            </DashCard>

            <DashCard title="AI recommendations" icon={Sparkles} tone="accent">
              <ul className="space-y-1.5">
                {RECOMMENDATION_FEED.map((r, i) => {
                  const linkLabel =
                    r.link.kind === "flight" ? `Flight ${r.link.id}` :
                    r.link.kind === "kpi" ? `KPI · ${r.link.id}` :
                    "Open";
                  return (
                    <li key={i}>
                      <button
                        onClick={() => setDetail(r.link)}
                        className="group w-full rounded-md border border-sky-accent/20 bg-sky-accent/5 p-2 text-left text-[11px] transition-colors hover:border-sky-accent/60 hover:bg-sky-accent/10"
                        title={`Open ${linkLabel}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold">{r.title}</div>
                          <span className="rounded-full bg-sky-dark/90 px-1.5 py-0.5 text-[9px] font-semibold text-white">{r.priority}</span>
                        </div>
                        <div className="mt-0.5 text-foreground/70">{r.why}</div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-sky-accent opacity-80 group-hover:opacity-100">
                          <ExternalLink className="h-3 w-3" /> {linkLabel}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </DashCard>


            <DashCard title="Integrations" icon={Zap}>
              <div className="grid grid-cols-2 gap-2">
                <IntegrationLink to="/ops" label="Ops Center" icon={LineChart} onNav={navigate} />
                <IntegrationLink to="/ops/ai" label="Disruption AI" icon={CloudLightning} onNav={navigate} />
                <IntegrationLink to="/support" label="Support" icon={Users} onNav={navigate} />
                <IntegrationLink to="/admin" label="Admin" icon={Gauge} onNav={navigate} />
              </div>
            </DashCard>
          </aside>
        </div>

        {detail && (
          <DetailDrawer
            link={detail}
            onClose={() => setDetail(null)}
            onAsk={(prompt) => { setDetail(null); send(prompt); }}
            onNavigate={(to, search) => {
              setDetail(null);
              navigate({ to, search: search as never });
            }}
          />
        )}
      </main>
    </>
  );
}

// ---------------- Sub-components ----------------
function WelcomeScreen({ onPick, disabled, userName }: { onPick: (p: string) => void; disabled: boolean; userName: string }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center py-6 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-sky-dark to-sky-accent text-white shadow-lg">
        <Sparkles className="h-6 w-6" />
      </div>
      <h1 className="mt-4 font-display text-3xl tracking-tight">Welcome, {userName.split(" ")[0]}.</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Ask anything about flights, disruptions, airports, aircraft, passengers, or airline operations. I combine live data with AI-powered analysis to help you decide faster.
      </p>

      <div className="mt-6 grid w-full gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            disabled={disabled}
            onClick={() => onPick(s.prompt)}
            className="group flex items-start gap-3 rounded-xl border border-border bg-background/60 p-3 text-left transition-all hover:border-sky-accent/60 hover:bg-sky-accent/5 disabled:opacity-50"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sky-dark/10 text-sky-accent"><s.icon className="h-4 w-4" /></span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{s.label}</span>
              <span className="block text-[11px] text-muted-foreground line-clamp-2">{s.prompt}</span>
            </span>
            <ChevronRight className="ml-auto mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>

      <div className="mt-6 w-full">
        <div className="mb-2 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Or try one of these</div>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_PROMPTS.map((p) => (
            <button
              key={p}
              disabled={disabled}
              onClick={() => onPick(p)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground/80 hover:border-sky-accent/50 hover:bg-sky-accent/5 disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, copied, onCopy }: { message: ChatMessage; copied: boolean; onCopy: () => void }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${isUser ? "bg-sky-dark text-white" : "bg-gradient-to-br from-sky-accent to-sky-gold text-sky-dark"}`}>
        {isUser ? <span className="text-[11px] font-semibold">YOU</span> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`group max-w-[85%] rounded-xl border p-3 text-sm ${isUser ? "border-sky-accent/30 bg-sky-accent/10" : "border-border bg-background"}`}>
        <div className="mb-1 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="font-semibold uppercase tracking-wider">{isUser ? "You" : "Copilot"}</span>
          <span>· {new Date(message.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          {!isUser && (
            <button onClick={onCopy} className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted">
              {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
            </button>
          )}
        </div>
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-headings:tracking-tight prose-table:text-xs prose-th:bg-muted prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1 prose-pre:bg-muted prose-code:text-sky-accent prose-a:text-sky-accent">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-sky-accent to-sky-gold text-sky-dark">
        <Bot className="h-4 w-4" />
      </div>
      <div className="rounded-xl border border-border bg-background px-3 py-2">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-sky-accent [animation-delay:-200ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-sky-accent [animation-delay:-100ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-sky-accent" />
        </div>
      </div>
    </div>
  );
}

function DashCard({ title, icon: Icon, tone, children }: { title: string; icon: React.ComponentType<{ className?: string }>; tone?: "accent"; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border p-3 ${tone === "accent" ? "border-sky-accent/25 bg-sky-accent/5" : "border-border bg-card"}`}>
      <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-sky-accent" /> {title}
      </h3>
      {children}
    </div>
  );
}

function IntegrationLink({ to, label, icon: Icon, onNav }: { to: string; label: string; icon: React.ComponentType<{ className?: string }>; onNav: ReturnType<typeof useNavigate> }) {
  return (
    <button
      onClick={() => onNav({ to })}
      className="flex items-center gap-2 rounded-md border border-border bg-background/60 px-2 py-1.5 text-[11px] font-medium hover:border-sky-accent/50 hover:bg-sky-accent/5"
    >
      <Icon className="h-3.5 w-3.5 text-sky-accent" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function alertTone(level: string) {
  switch (level) {
    case "critical": return "bg-red-500/15 text-red-500";
    case "high": return "bg-orange-500/15 text-orange-500";
    case "medium": return "bg-amber-500/15 text-amber-500";
    default: return "bg-sky-500/15 text-sky-500";
  }
}
function airportTone(state: string) {
  switch (state) {
    case "Red": return "bg-red-500/15 text-red-500";
    case "Amber": return "bg-amber-500/15 text-amber-500";
    default: return "bg-emerald-500/15 text-emerald-500";
  }
}

type DrillSearch = { route?: string; airport?: string; range?: RangeKey };
type RangeKey = "1h" | "4h" | "today" | "24h" | "7d";
const RANGE_OPTIONS: Array<{ value: RangeKey; label: string }> = [
  { value: "1h", label: "Next 1h" },
  { value: "4h", label: "Next 4h" },
  { value: "today", label: "Today" },
  { value: "24h", label: "Last 24h" },
  { value: "7d", label: "Last 7 days" },
];
const AIRPORT_CODES = ["LHR", "JFK", "AMS", "SIN", "DXB", "HKG", "FRA", "BOM", "CDG", "MAD"];

function parseRoute(route: string): { origin?: string; destination?: string } {
  const m = route.match(/([A-Z]{3})\s*(?:→|-|to)\s*([A-Z]{3})/);
  return m ? { origin: m[1], destination: m[2] } : {};
}

function DetailDrawer({
  link, onClose, onAsk, onNavigate,
}: {
  link: RecLink;
  onClose: () => void;
  onAsk: (prompt: string, filters: DrillSearch) => void;
  onNavigate: (to: "/ops/flights" | "/ops/analytics", search: DrillSearch) => void;
}) {
  const flight = link.kind === "flight" ? FLIGHTS_AT_RISK.find((f) => f.flight === link.id) : null;
  const kpi = link.kind === "kpi" ? KPIS.find((k) => k.label === link.id) : null;
  const relatedRecs = RECOMMENDATION_FEED.filter(
    (r) => r.link.kind === link.kind && "id" in r.link && "id" in link && r.link.id === link.id,
  );

  // Unmapped: link kind is flight/kpi but we can't resolve it against the live dataset.
  const isUnmapped =
    (link.kind === "flight" && !flight) ||
    (link.kind === "kpi" && !kpi);
  const unmappedId = (link.kind === "flight" || link.kind === "kpi") ? link.id : "";

  const defaults: DrillSearch = flight
    ? { route: flight.route.replace(/\s*→\s*/, "-"), airport: parseRoute(flight.route).destination, range: "4h" }
    : link.kind === "flight" ? { range: "today" } : { range: "today" };
  const [filters, setFilters] = useState<DrillSearch>(defaults);
  const target: "/ops/flights" | "/ops/analytics" = link.kind === "flight" ? "/ops/flights" : "/ops/analytics";
  const activeFilterCount = [filters.route, filters.airport, filters.range].filter(Boolean).length;

  const filterSummary = () => {
    const parts: string[] = [];
    if (filters.route) parts.push(`route ${filters.route}`);
    if (filters.airport) parts.push(`airport ${filters.airport}`);
    if (filters.range) parts.push(`range ${filters.range}`);
    return parts.length ? ` (scoped to ${parts.join(", ")})` : "";
  };

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <button aria-label="Close" onClick={onClose} className="flex-1 bg-black/40 backdrop-blur-sm" />
      <div className="flex w-full max-w-md flex-col border-l border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-dark/10 text-sky-accent">
              {link.kind === "flight" ? <Plane className="h-4 w-4" /> : <Gauge className="h-4 w-4" />}
            </span>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {link.kind === "flight" ? "Flight detail" : "KPI detail"}
              </div>
              <div className="font-display text-lg tracking-tight">
                {link.kind === "flight" ? link.id : kpi?.label ?? "—"}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {isUnmapped && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">
                    {link.kind === "flight" ? "Flight" : "KPI"} <span className="font-mono">{unmappedId}</span> isn't in the live feed
                  </div>
                  <p className="text-foreground/75">
                    This recommendation references {link.kind === "flight" ? "a flight" : "a metric"} that we can't resolve against the current dataset — it may have been completed, renumbered, or is outside the loaded scope.
                  </p>
                  <div className="pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Suggested next steps</div>
                  <ul className="list-inside list-disc space-y-0.5 text-foreground/75">
                    <li>Ask Copilot to look it up across today's operations</li>
                    <li>{link.kind === "flight" ? "Search Live Flights" : "Open Analytics"} with a broader time range</li>
                    <li>Narrow the drilldown below by route, airport, or range</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {flight && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Route" value={flight.route} mono />
                <Stat label="Risk" value={`${flight.risk}%`} tone={flight.risk >= 70 ? "danger" : "warning"} />
                <Stat label="Primary cause" value={flight.reason} full />
              </div>
              <div className="rounded-lg border border-border bg-background/60 p-3 text-xs">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Copilot summary</div>
                <p className="text-foreground/80">
                  Flight <span className="font-mono font-semibold">{flight.flight}</span> ({flight.route}) is currently tracking at a <span className="font-semibold">{flight.risk}% delay risk</span> due to <span className="italic">{flight.reason.toLowerCase()}</span>. Recommend proactive recovery to protect downstream rotations and connections.
                </p>
              </div>
            </>
          )}

          {kpi && (
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Current" value={kpi.value} />
              <Stat label="Δ vs. 7-day" value={kpi.trend} tone={kpi.tone === "positive" ? "positive" : "neutral"} />
              <Stat label="Metric" value={kpi.label} full />
            </div>
          )}

          <div className="rounded-lg border border-border bg-background/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Filter className="h-3 w-3" /> Narrow the drilldown
              </div>
              {activeFilterCount > 0 && (
                <button onClick={() => setFilters({})} className="text-[10px] text-sky-accent hover:underline">Clear</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Route
                <input
                  value={filters.route ?? ""}
                  onChange={(e) => setFilters((f) => ({ ...f, route: e.target.value.toUpperCase() || undefined }))}
                  placeholder="e.g. LHR-JFK"
                  className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 font-mono text-xs normal-case text-foreground"
                />
              </label>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Airport
                <select
                  value={filters.airport ?? ""}
                  onChange={(e) => setFilters((f) => ({ ...f, airport: e.target.value || undefined }))}
                  className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                >
                  <option value="">Any</option>
                  {AIRPORT_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Time range
                <select
                  value={filters.range ?? ""}
                  onChange={(e) => setFilters((f) => ({ ...f, range: (e.target.value || undefined) as RangeKey | undefined }))}
                  className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                >
                  <option value="">Any</option>
                  {RANGE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </label>
            </div>
          </div>

          {relatedRecs.length > 0 && (
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Linked recommendations</div>
              <ul className="space-y-1.5">
                {relatedRecs.map((r, i) => (
                  <li key={i} className="rounded-md border border-sky-accent/25 bg-sky-accent/5 p-2 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold">{r.title}</div>
                      <span className="rounded-full bg-sky-dark/90 px-1.5 py-0.5 text-[9px] font-semibold text-white">{r.priority}</span>
                    </div>
                    <div className="mt-0.5 text-foreground/70">{r.why}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-border p-3">
          <button
            onClick={() => {
              const scope = filterSummary();
              if (link.kind === "flight" && flight) {
                onAsk(`Give me a detailed recovery plan for SkyWay flight ${flight.flight} on ${flight.route}${scope}. Primary risk: ${flight.reason}. Include risk level, confidence, options with cost/benefit, and passenger impact.`, filters);
              } else if (link.kind === "kpi" && kpi) {
                onAsk(`Deep-dive today's ${kpi.label} performance (current ${kpi.value}, trend ${kpi.trend})${scope}. Break down drivers, at-risk contributors, and recommended actions to sustain or improve it.`, filters);
              } else if (link.kind === "flight") {
                onAsk(`Look up SkyWay flight ${unmappedId}${scope}. It isn't in the current at-risk feed — check today's roster, recent status changes, and whether it has already departed, been completed, cancelled, or renumbered. Then summarize its current state and any follow-up actions needed.`, filters);
              } else if (link.kind === "kpi") {
                onAsk(`The KPI "${unmappedId}" isn't in the current dashboard snapshot${scope}. Explain what it typically measures for airline ops, estimate today's likely value from related signals, and suggest which dashboards or data sources to consult.`, filters);
              }
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-sky-dark px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
          >
            <Sparkles className="h-3.5 w-3.5" /> Ask Copilot
          </button>
          <button
            onClick={() => onNavigate(target, filters)}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open in {link.kind === "flight" ? "Flights" : "Analytics"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone, mono, full }: { label: string; value: string; tone?: "positive" | "warning" | "danger" | "neutral"; mono?: boolean; full?: boolean }) {
  const toneCls =
    tone === "positive" ? "text-emerald-500" :
    tone === "warning" ? "text-amber-500" :
    tone === "danger" ? "text-red-500" :
    "text-foreground";
  return (
    <div className={`rounded-lg border border-border bg-background/60 p-2.5 ${full ? "col-span-2" : ""}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-sm font-semibold ${toneCls} ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
