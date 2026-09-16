import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Search,
  X,
  Plane,
  User,
  Ticket,
  MapPin,
  Compass,
  ArrowRight,
  Clock,
  CornerDownLeft,
  Sparkles,
  Layers,
  ChevronRight,
} from "lucide-react";
import {
  searchGlobal,
  getRecentSearches,
  saveRecentSearch,
  type SearchCategory,
  type SearchResultItem,
} from "@/lib/global-search";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  initialCategory?: SearchCategory;
}

export function GlobalSearchModal({
  isOpen,
  onClose,
  initialQuery = "",
  initialCategory = "all",
}: GlobalSearchModalProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>(initialCategory);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setActiveCategory(initialCategory);
      setSelectedIndex(0);
      setRecentSearches(getRecentSearches());
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, initialQuery, initialCategory]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return searchGlobal(query, activeCategory);
  }, [query, activeCategory]);

  // Reset selected index when query or category changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  const handleSelect = (item: SearchResultItem) => {
    saveRecentSearch(query.trim() || item.title);
    onClose();
    navigate({ to: item.routeUrl as any });
  };

  // Keyboard navigation within the modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (searchResults.length > 0 ? (prev + 1) % searchResults.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (searchResults.length > 0 ? (prev - 1 + searchResults.length) % searchResults.length : 0));
      } else if (e.key === "Enter") {
        if (searchResults.length > 0 && searchResults[selectedIndex]) {
          e.preventDefault();
          handleSelect(searchResults[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, searchResults, selectedIndex, onClose, query]);

  const handleQuickSearch = (term: string, cat: SearchCategory = "all") => {
    setQuery(term);
    setActiveCategory(cat);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 sm:pt-20 overflow-y-auto">
      <div
        className="relative w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-3.5 shrink-0">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search flights (SW128), passengers (Elena), tickets (TCK-8420), fleet..."
            className="flex-1 bg-transparent text-sm sm:text-base font-medium text-foreground placeholder:text-muted-foreground focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted transition"
          >
            ESC
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border/80 bg-muted/20 px-4 py-2 text-xs shrink-0 no-scrollbar">
          {(
            [
              { id: "all", label: "All Items", icon: Layers },
              { id: "flights", label: "Flights", icon: Plane },
              { id: "passengers", label: "Passengers", icon: User },
              { id: "tickets", label: "Support Tickets", icon: Ticket },
              { id: "fleet", label: "Fleet & Aircraft", icon: Compass },
              { id: "airports", label: "Airports & Hubs", icon: MapPin },
            ] as const
          ).map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition ${
                  isSelected
                    ? "bg-sky-dark text-white shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search Results / Suggestion Body */}
        <div ref={listRef} className="p-3 overflow-y-auto flex-1 space-y-2">
          {query.trim() ? (
            searchResults.length > 0 ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Results ({searchResults.length})</span>
                  <span>Press ↑↓ to navigate, ↵ to open</span>
                </div>

                {searchResults.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`group flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${
                        isSelected
                          ? "border-sky-500/60 bg-sky-500/10 shadow-xs"
                          : "border-transparent bg-muted/20 hover:border-border hover:bg-muted/40"
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`grid h-9 w-9 place-items-center rounded-lg shrink-0 mt-0.5 border ${
                          item.category === "flight"
                            ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30"
                            : item.category === "passenger"
                            ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30"
                            : item.category === "ticket"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            : item.category === "fleet"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30"
                        }`}
                      >
                        {item.category === "flight" && <Plane className="h-4 w-4" />}
                        {item.category === "passenger" && <User className="h-4 w-4" />}
                        {item.category === "ticket" && <Ticket className="h-4 w-4" />}
                        {item.category === "fleet" && <Compass className="h-4 w-4" />}
                        {item.category === "airport" && <MapPin className="h-4 w-4" />}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground truncate">{item.title}</span>
                          {item.badge && (
                            <span
                              className={`rounded-full px-2 py-0.2 text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                                item.badgeVariant === "success"
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                  : item.badgeVariant === "warning"
                                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                  : item.badgeVariant === "destructive"
                                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                                  : item.badgeVariant === "info"
                                  ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30"
                                  : "bg-muted text-muted-foreground border border-border"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                        {item.description && (
                          <p className="text-[11px] text-muted-foreground/80 line-clamp-1">{item.description}</p>
                        )}
                      </div>

                      {/* Action */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 self-center">
                        <span className="text-[11px] font-medium hidden sm:inline text-muted-foreground group-hover:text-foreground">
                          Jump to portal
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-sky-dark group-hover:translate-x-0.5 transition" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center space-y-2">
                <Search className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
                <h4 className="font-bold text-sm text-foreground">No matching records found</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  No flights, passengers, or support tickets matched "{query}". Try checking flight numbers (e.g. SW128), passenger names, or booking codes.
                </p>
              </div>
            )
          ) : (
            /* Empty state with recent searches & quick shortcuts */
            <div className="space-y-5 p-2">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> Recent Queries
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleQuickSearch(term)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-sky-500/50 hover:bg-muted transition shadow-2xs"
                      >
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Jump Suggestions */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-sky-accent" /> Quick Portal Shortcuts
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => handleQuickSearch("SW128", "flights")}
                    className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-2.5 text-left hover:border-sky-500/40 hover:bg-muted/60 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-7 w-7 place-items-center rounded-md bg-sky-500/15 text-sky-600">
                        <Plane className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">SW128 · DEL → CDG</div>
                        <div className="text-[10px] text-muted-foreground">Live In-Flight Telemetry</div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>

                  <button
                    onClick={() => handleQuickSearch("Elena Rossi", "passengers")}
                    className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-2.5 text-left hover:border-sky-500/40 hover:bg-muted/60 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-7 w-7 place-items-center rounded-md bg-indigo-500/15 text-indigo-600">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Elena Rossi (SW047514)</div>
                        <div className="text-[10px] text-muted-foreground">VIP Platinum Passenger</div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>

                  <button
                    onClick={() => handleQuickSearch("TCK-8420", "tickets")}
                    className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-2.5 text-left hover:border-sky-500/40 hover:bg-muted/60 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-7 w-7 place-items-center rounded-md bg-amber-500/15 text-amber-600">
                        <Ticket className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">TCK-8420: Compensation</div>
                        <div className="text-[10px] text-muted-foreground">High Priority Support Ticket</div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>

                  <button
                    onClick={() => handleQuickSearch("JFK", "airports")}
                    className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-2.5 text-left hover:border-sky-500/40 hover:bg-muted/60 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-7 w-7 place-items-center rounded-md bg-purple-500/15 text-purple-600">
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">JFK · New York Hub</div>
                        <div className="text-[10px] text-muted-foreground">Gate & Capacity Management</div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5 text-[11px] text-muted-foreground shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                ↵
              </kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                ESC
              </kbd>
              Close
            </span>
          </div>

          <span className="font-medium text-[10px] hidden sm:inline">
            Global Search Engine · Cross-portal routing active
          </span>
        </div>
      </div>
    </div>
  );
}
