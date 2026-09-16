import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search, BookOpen, Sparkles, Copy, Check, ExternalLink, Tag, ThumbsUp,
  ThumbsDown, Plus, X, ArrowRight, ShieldCheck, Clock, FileText, Share2,
} from "lucide-react";
import { toast } from "sonner";
import { SupportTopbar } from "@/components/support/SupportTopbar";
import { kbArticles as initialArticles, type KbArticle } from "@/lib/support/mock";

export const Route = createFileRoute("/support/knowledge")({ component: KnowledgePage });

export function KnowledgePage() {
  const [articles, setArticles] = useState<KbArticle[]>(initialArticles);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeArticle, setActiveArticle] = useState<KbArticle | null>(null);
  const [showNewArticleModal, setShowNewArticleModal] = useState(false);
  const [copiedPolicy, setCopiedPolicy] = useState(false);
  const [articleFeedback, setArticleFeedback] = useState<Record<string, "yes" | "no">>({});

  // AI Ask Copilot state
  const [copilotQuestion, setCopilotQuestion] = useState("");
  const [copilotAnswer, setCopilotAnswer] = useState<{ question: string; answer: string; matchedArticleId: string } | null>(null);
  const [copilotLoading, setCopilotLoading] = useState(false);

  // New article form
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Airline Policies");
  const [newExcerpt, setNewExcerpt] = useState("");
  const [newContent, setNewContent] = useState("");

  const categories = useMemo(() => {
    const list = Array.from(new Set(articles.map((a) => a.category)));
    return ["All", ...list];
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const matchCat = selectedCategory === "All" || a.category === selectedCategory;
      if (!matchCat) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        (a.tags && a.tags.some((t) => t.toLowerCase().includes(q))) ||
        (a.content && a.content.toLowerCase().includes(q))
      );
    });
  }, [articles, selectedCategory, searchQuery]);

  // Copy policy to clipboard
  const handleCopyPolicy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedPolicy(true);
    toast.success("Policy snippet copied to clipboard!");
    setTimeout(() => setCopiedPolicy(false), 2000);
  };

  // AI KB Copilot Ask
  const handleAskCopilot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotQuestion.trim()) return;

    setCopilotLoading(true);
    setTimeout(() => {
      setCopilotLoading(false);
      const q = copilotQuestion.toLowerCase();

      if (q.includes("delay") || q.includes("compensation") || q.includes("eu261")) {
        setCopilotAnswer({
          question: copilotQuestion,
          answer: "Under EU261 / UK261, flights delayed 3+ hours qualify for statutory compensation of €250 (<1500km), €400 (1500–3500km), or €600 (>3500km). Meal vouchers (€25) are mandatory after 2 hours.",
          matchedArticleId: "kb5",
        });
      } else if (q.includes("baggage") || q.includes("weight") || q.includes("luggage")) {
        setCopilotAnswer({
          question: copilotQuestion,
          answer: "Cabin bags are limited to 8kg (55x40x23cm) in Economy and 2x10kg in Business. Overweight checked bags (23–32kg) incur a flat $75 fee.",
          matchedArticleId: "kb1",
        });
      } else if (q.includes("refund") || q.includes("cancel")) {
        setCopilotAnswer({
          question: copilotQuestion,
          answer: "100% full refund with zero fees applies within 24h of booking (if booked ≥7 days prior) or if SkyWay cancels/delays a flight >120 mins. Basic Economy is non-refundable.",
          matchedArticleId: "kb2",
        });
      } else if (q.includes("infant") || q.includes("child") || q.includes("bassinet")) {
        setCopilotAnswer({
          question: copilotQuestion,
          answer: "Lap infants (under 2) fly at 10% adult fare with 1 free checked bag (10kg) + free gate-checked stroller. Bulkhead bassinets must be reserved in advance (max 11kg).",
          matchedArticleId: "kb6",
        });
      } else {
        setCopilotAnswer({
          question: copilotQuestion,
          answer: "SkyWay SOP: Standard airline operating procedures require verifying booking PNR, passenger ID, and fare rules before issuing waivers or ticket modifications.",
          matchedArticleId: "kb2",
        });
      }
      toast.success("AI Copilot analyzed knowledge base.");
    }, 600);
  };

  // Create article
  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please provide an article title.");
      return;
    }

    const created: KbArticle = {
      id: `kb${articles.length + 1}`,
      title: newTitle,
      category: newCategory,
      views: 1,
      updated: new Date().toISOString().slice(0, 10),
      excerpt: newExcerpt || newTitle,
      content: newContent || `### Policy Overview\n${newExcerpt}\n\nStandard SkyWay Customer Care guidelines apply.`,
      author: "Support Operations Desk",
      policyRef: `SOP-KB-${Date.now().toString().slice(-4)}`,
      tags: [newCategory.toLowerCase(), "custom", "sop"],
    };

    setArticles([created, ...articles]);
    setShowNewArticleModal(false);
    setNewTitle("");
    setNewExcerpt("");
    setNewContent("");
    toast.success(`Published new KB policy: "${created.title}"`);
  };

  return (
    <>
      <SupportTopbar
        crumbs={[{ label: "Support", to: "/support" }, { label: "Knowledge Base" }]}
        action={{
          label: "Create Policy Article",
          onClick: () => setShowNewArticleModal(true),
        }}
      />

      <main className="flex-1 space-y-6 p-6 overflow-y-auto">
        {/* Header & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl tracking-tight">Airline Knowledge Base</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Official SOPs, fare family rules, baggage dimensions, and regulatory compliance guidelines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewArticleModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" /> New SOP Article
            </button>
          </div>
        </div>

        {/* AI Copilot Ask Bar */}
        <div className="rounded-xl border border-sky-accent/30 bg-gradient-to-r from-sky-accent/10 via-card to-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-accent mb-2">
            <Sparkles className="h-4 w-4" />
            <span>Ask Support Policy Copilot</span>
          </div>

          <form onSubmit={handleAskCopilot} className="flex gap-2">
            <input
              value={copilotQuestion}
              onChange={(e) => setCopilotQuestion(e.target.value)}
              placeholder="Ask any policy question (e.g., 'What is compensation for 4-hour delay?' or 'Can infants have extra bag?')"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-sky-accent focus:ring-1 focus:ring-sky-accent/30"
            />
            <button
              type="submit"
              disabled={copilotLoading || !copilotQuestion.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 disabled:opacity-40"
            >
              {copilotLoading ? "Searching…" : "Ask AI"}
            </button>
          </form>

          {copilotAnswer && (
            <div className="mt-3 rounded-lg border border-sky-accent/20 bg-background/80 p-3 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-foreground">Q: {copilotAnswer.question}</div>
                <button
                  type="button"
                  onClick={() => setCopilotAnswer(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-foreground/90 leading-relaxed">{copilotAnswer.answer}</p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const found = articles.find((a) => a.id === copilotAnswer.matchedArticleId);
                    if (found) setActiveArticle(found);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-accent hover:underline"
                >
                  <span>Read full referenced policy</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
                <span className="text-muted-foreground">·</span>
                <button
                  type="button"
                  onClick={() => handleCopyPolicy(copilotAnswer.answer)}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-3 w-3" /> Copy snippet
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search & Category Pills */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge base by keyword, policy code, or topic…"
              className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-xs sm:text-sm outline-none focus:border-sky-accent focus:ring-1 focus:ring-sky-accent/30 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Clickable Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count = cat === "All" ? articles.length : articles.filter((a) => a.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-sky-dark text-white font-semibold shadow-xs"
                      : "border border-border bg-card text-foreground/80 hover:border-sky-accent/50 hover:bg-muted"
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredArticles.length === 0 ? (
            <div className="col-span-full rounded-xl border border-border bg-card p-12 text-center text-xs text-muted-foreground">
              No knowledge base articles found matching "{searchQuery}".
            </div>
          ) : (
            filteredArticles.map((a) => (
              <article
                key={a.id}
                onClick={() => setActiveArticle(a)}
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 hover:border-sky-accent/60 hover:shadow-md transition-all cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-sky-accent">
                      <BookOpen className="h-3.5 w-3.5" /> {a.category}
                    </span>
                    {a.policyRef && (
                      <span className="font-mono text-[10px] text-muted-foreground">{a.policyRef}</span>
                    )}
                  </div>

                  <h3 className="mt-2 font-display text-base sm:text-lg font-semibold group-hover:text-sky-accent transition-colors">
                    {a.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {a.excerpt}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Updated {a.updated}
                  </span>
                  <span className="font-medium text-foreground flex items-center gap-1">
                    {a.views.toLocaleString()} reads
                    <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </article>
            ))
          )}
        </div>

        {/* AI Suggested Banner */}
        <div className="rounded-xl border border-sky-accent/30 bg-sky-accent/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-accent">
              <Sparkles className="h-4 w-4" /> AI Operations Alert · Recommended Policy
            </div>
            <p className="mt-1 text-xs text-foreground/80">
              Based on 4 active delay tickets today, agents are reviewing <strong>"EU261 delay compensation"</strong>.
            </p>
          </div>
          <button
            onClick={() => {
              const eu261 = articles.find((a) => a.id === "kb5");
              if (eu261) setActiveArticle(eu261);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 shrink-0"
          >
            Read EU261 Guide <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Modal: ARTICLE READER */}
        {activeArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              {/* Reader Header */}
              <div className="flex items-center justify-between border-b border-border p-4 bg-muted/20 shrink-0">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-sky-accent">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{activeArticle.category}</span>
                    {activeArticle.policyRef && (
                      <span className="font-mono text-muted-foreground">· Ref: {activeArticle.policyRef}</span>
                    )}
                  </div>
                  <h2 className="mt-1 font-display text-xl font-bold">{activeArticle.title}</h2>
                </div>
                <button
                  onClick={() => setActiveArticle(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Reader Content Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm leading-relaxed text-foreground/90">
                <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground flex items-center justify-between">
                  <span>Author: {activeArticle.author || "SkyWay Ground & Commercial Compliance"}</span>
                  <span>Effective Date: {activeArticle.updated}</span>
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none space-y-3">
                  {activeArticle.content ? (
                    <div className="whitespace-pre-line font-sans text-xs sm:text-sm leading-relaxed">
                      {activeArticle.content}
                    </div>
                  ) : (
                    <p>{activeArticle.excerpt}</p>
                  )}
                </div>

                {activeArticle.tags && (
                  <div className="flex flex-wrap gap-1.5 pt-4 border-t border-border/60">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Tag className="h-3 w-3" /> Related tags:
                    </span>
                    {activeArticle.tags.map((tag) => (
                      <span key={tag} className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Reader Footer Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border p-4 bg-muted/10 shrink-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Was this policy helpful?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setArticleFeedback((prev) => ({ ...prev, [activeArticle.id]: "yes" }));
                      toast.success("Thank you for your feedback!");
                    }}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 border transition-colors ${
                      articleFeedback[activeArticle.id] === "yes"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-600 font-semibold"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <ThumbsUp className="h-3 w-3" /> Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setArticleFeedback((prev) => ({ ...prev, [activeArticle.id]: "no" }));
                      toast.info("Feedback noted for policy review.");
                    }}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 border transition-colors ${
                      articleFeedback[activeArticle.id] === "no"
                        ? "bg-red-500/20 border-red-500 text-red-600 font-semibold"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <ThumbsDown className="h-3 w-3" /> No
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyPolicy(activeArticle.content || activeArticle.excerpt)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    {copiedPolicy ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedPolicy ? "Copied!" : "Copy Policy Text"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      toast.success(`Inserted "${activeArticle.title}" into active support queue.`);
                      setActiveArticle(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                  >
                    <Share2 className="h-3.5 w-3.5" /> Send to Live Chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: CREATE NEW KB ARTICLE */}
        {showNewArticleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-sky-accent" />
                  <h3 className="font-semibold text-base">Draft New SOP Policy Article</h3>
                </div>
                <button onClick={() => setShowNewArticleModal(false)} className="rounded p-1 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateArticle} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Article Title</label>
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Pet in cabin guidelines and crate dimensions"
                    required
                    className="w-full rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-sky-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-sky-accent"
                  >
                    <option value="Baggage Policy">Baggage Policy</option>
                    <option value="Refund Policy">Refund Policy</option>
                    <option value="Check-in Rules">Check-in Rules</option>
                    <option value="Visa Information">Visa Information</option>
                    <option value="Airline Policies">Airline Policies</option>
                    <option value="Travel Guidelines">Travel Guidelines</option>
                    <option value="Special Assistance">Special Assistance</option>
                    <option value="Loyalty Program">Loyalty Program</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Executive Excerpt (Summary)</label>
                  <input
                    value={newExcerpt}
                    onChange={(e) => setNewExcerpt(e.target.value)}
                    placeholder="Brief 1-line description of the policy..."
                    className="w-full rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-sky-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Full Policy Text / Markdown</label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Enter full step-by-step operating procedure guidelines…"
                    rows={5}
                    className="w-full rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-sky-accent resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowNewArticleModal(false)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90"
                  >
                    Publish Policy Article
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
