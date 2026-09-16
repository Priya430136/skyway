import { useState, useEffect, useRef } from "react";
import { Search, Plane, User, Ticket, Compass, MapPin, X, ChevronRight, CornerDownLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import {
  searchGlobal,
  saveRecentSearch,
  type SearchResultItem,
} from "@/lib/global-search";
import { GlobalSearchModal } from "@/components/GlobalSearchModal";

interface GlobalSearchBarProps {
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export function GlobalSearchBar({
  placeholder = "Search flights, passengers, tickets…",
  className = "",
  compact = false,
}: GlobalSearchBarProps) {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update inline live results when typing
  useEffect(() => {
    if (inputValue.trim()) {
      const res = searchGlobal(inputValue, "all", 6);
      setResults(res);
      setIsDropdownOpen(true);
    } else {
      setResults([]);
      setIsDropdownOpen(false);
    }
  }, [inputValue]);

  const handleSelectResult = (item: SearchResultItem) => {
    saveRecentSearch(inputValue.trim() || item.title);
    setIsDropdownOpen(false);
    setInputValue("");
    navigate({ to: item.routeUrl as any });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (results.length > 0) {
        handleSelectResult(results[0]);
      } else {
        setModalOpen(true);
      }
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <>
      <div ref={containerRef} className={`relative ${className}`}>
        <div
          className={`flex items-center gap-2 rounded-xl border border-border bg-background/80 px-3 py-1.5 text-xs transition-all focus-within:border-sky-accent focus-within:ring-2 focus-within:ring-sky-500/20 hover:border-sky-500/40 shadow-2xs ${
            compact ? "w-44 sm:w-60" : "w-48 sm:w-72 md:w-80 lg:w-96"
          }`}
        >
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => {
              if (inputValue.trim()) setIsDropdownOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-hidden min-w-0 text-xs"
          />

          {inputValue ? (
            <button
              onClick={() => {
                setInputValue("");
                setIsDropdownOpen(false);
              }}
              className="p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          ) : (
            <button
              onClick={() => setModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1 rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground hover:text-foreground transition cursor-pointer"
              title="Open full command palette (Cmd+K / Ctrl+K)"
            >
              <span>⌘K</span>
            </button>
          )}
        </div>

        {/* Live Inline Dropdown for Instant Search Feedback */}
        {isDropdownOpen && inputValue.trim() && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-border bg-popover p-1.5 shadow-xl animate-in fade-in zoom-in-95 min-w-[320px] max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 mb-1">
              <span>Quick Matches ({results.length})</span>
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  setModalOpen(true);
                }}
                className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
              >
                Full search &rarr;
              </button>
            </div>

            {results.length > 0 ? (
              <div className="space-y-1">
                {results.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectResult(item)}
                    className="flex items-start gap-2.5 rounded-lg p-2 hover:bg-muted/70 transition cursor-pointer text-left group"
                  >
                    <div
                      className={`grid h-7 w-7 place-items-center rounded-md shrink-0 mt-0.5 border ${
                        item.category === "flight"
                          ? "bg-sky-500/15 text-sky-600 border-sky-500/30"
                          : item.category === "passenger"
                          ? "bg-indigo-500/15 text-indigo-600 border-indigo-500/30"
                          : item.category === "ticket"
                          ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
                          : item.category === "fleet"
                          ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                          : "bg-purple-500/15 text-purple-600 border-purple-500/30"
                      }`}
                    >
                      {item.category === "flight" && <Plane className="h-3.5 w-3.5" />}
                      {item.category === "passenger" && <User className="h-3.5 w-3.5" />}
                      {item.category === "ticket" && <Ticket className="h-3.5 w-3.5" />}
                      {item.category === "fleet" && <Compass className="h-3.5 w-3.5" />}
                      {item.category === "airport" && <MapPin className="h-3.5 w-3.5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <div className="text-xs font-bold text-foreground truncate">{item.title}</div>
                        {item.badge && (
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[9px] font-extrabold uppercase shrink-0 ${
                              item.badgeVariant === "success"
                                ? "bg-emerald-500/15 text-emerald-600"
                                : item.badgeVariant === "warning"
                                ? "bg-amber-500/15 text-amber-600"
                                : item.badgeVariant === "destructive"
                                ? "bg-rose-500/15 text-rose-600"
                                : item.badgeVariant === "info"
                                ? "bg-sky-500/15 text-sky-600"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">{item.subtitle}</div>
                    </div>

                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition self-center shrink-0" />
                  </div>
                ))}

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setModalOpen(true);
                  }}
                  className="w-full text-center py-1.5 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 rounded-lg transition"
                >
                  View all results for "{inputValue}" &rarr;
                </button>
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No instant matches found. Press Enter or click below for full search.
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setModalOpen(true);
                  }}
                  className="mt-2 block mx-auto text-sky-600 dark:text-sky-400 font-semibold hover:underline"
                >
                  Search all categories &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <GlobalSearchModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialQuery={inputValue}
      />
    </>
  );
}
