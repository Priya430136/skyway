import { useMemo, useState } from "react";
import {
  AIRPORTS,
  formatDuration,
  searchItineraries,
  type Itinerary,
} from "@/lib/sample-flights";
import { track } from "@/lib/analytics";

const CABINS: Itinerary["cabin"][] = ["Economy", "Premium", "Business", "First"];

export function FlightSearch() {
  const [origin, setOrigin] = useState("LHR");
  const [destination, setDestination] = useState("JFK");
  const [cabin, setCabin] = useState<Itinerary["cabin"]>("Economy");
  const [submitted, setSubmitted] = useState<{
    origin: string;
    destination: string;
    cabin: Itinerary["cabin"];
  } | null>({ origin: "LHR", destination: "JFK", cabin: "Economy" });

  const results = useMemo<Itinerary[]>(() => {
    if (!submitted) return [];
    return searchItineraries(submitted.origin, submitted.destination, submitted.cabin);
  }, [submitted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (origin === destination) return;
    track("search_submitted", { origin, destination, cabin });
    setSubmitted({ origin, destination, cabin });
  };

  return (
    <section id="search" className="bg-white py-24" aria-labelledby="search-heading">
      <div className="container mx-auto px-8">
        <div className="mb-12 max-w-2xl">
          <span className="mb-4 inline-block rounded-full bg-sky-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-sky-accent">
            Live route search
          </span>
          <h2
            id="search-heading"
            className="font-display text-4xl font-light leading-tight tracking-tight md:text-5xl"
          >
            Plan a route. See live itineraries.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-sky-dark/60">
            A demo of the SkyWay search engine across our partner network. Pick
            two airports and a cabin — results stream in instantly.
          </p>
        </div>

        {/* Search form */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-3 rounded-2xl border border-sky-dark/10 bg-sky-surface p-3 md:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <label className="rounded-xl bg-white px-4 py-3 ring-1 ring-sky-dark/5">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-sky-dark/40">
              Origin
            </span>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full bg-transparent font-display text-base font-medium text-sky-dark focus:outline-none"
            >
              {AIRPORTS.map((a) => (
                <option key={a.iata} value={a.iata}>
                  {a.iata} · {a.city}
                </option>
              ))}
            </select>
          </label>
          <label className="rounded-xl bg-white px-4 py-3 ring-1 ring-sky-dark/5">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-sky-dark/40">
              Destination
            </span>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-transparent font-display text-base font-medium text-sky-dark focus:outline-none"
            >
              {AIRPORTS.map((a) => (
                <option key={a.iata} value={a.iata}>
                  {a.iata} · {a.city}
                </option>
              ))}
            </select>
          </label>
          <label className="rounded-xl bg-white px-4 py-3 ring-1 ring-sky-dark/5">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-sky-dark/40">
              Cabin
            </span>
            <select
              value={cabin}
              onChange={(e) => setCabin(e.target.value as Itinerary["cabin"])}
              className="w-full bg-transparent font-display text-base font-medium text-sky-dark focus:outline-none"
            >
              {CABINS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={origin === destination}
            className="rounded-xl bg-sky-dark px-8 py-4 text-sm font-semibold uppercase tracking-widest text-white transition-all hover:bg-sky-accent disabled:cursor-not-allowed disabled:bg-sky-dark/30"
          >
            Search
          </button>
        </form>
        {origin === destination && (
          <p className="mt-3 text-sm text-destructive">
            Origin and destination must be different.
          </p>
        )}

        {/* Results */}
        {submitted && results.length > 0 && (
          <ul className="mt-10 space-y-3" aria-live="polite">
            {results.map((it) => (
              <li
                key={it.id}
                className="group rounded-2xl border border-sky-dark/5 bg-white p-6 transition-all hover:border-sky-accent/30 hover:shadow-lg hover:shadow-sky-dark/5"
              >
                <button
                  type="button"
                  onClick={() =>
                    track("search_result_clicked", {
                      flight: it.flightNumber,
                      cabin: it.cabin,
                      price: it.priceUSD,
                    })
                  }
                  className="grid w-full grid-cols-1 items-center gap-6 text-left md:grid-cols-[auto_1fr_auto_auto]"
                >
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-sky-dark/40">
                      {it.flightNumber}
                    </div>
                    <div className="font-display text-sm text-sky-dark/70">
                      {it.aircraft}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-display text-2xl font-medium">
                        {it.departure}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-sky-dark/40">
                        {it.origin.iata}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col items-center">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-sky-dark/40">
                        {formatDuration(it.durationMinutes)} ·{" "}
                        {it.stops === 0 ? "Direct" : `${it.stops} stop`}
                      </div>
                      <div className="my-2 h-px w-full bg-gradient-to-r from-transparent via-sky-accent/40 to-transparent" />
                      <div className="text-[10px] font-bold uppercase tracking-widest text-sky-dark/40">
                        OTP {it.onTimePct}%
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-2xl font-medium">
                        {it.arrival}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-sky-dark/40">
                        {it.destination.iata}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-full bg-sky-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-sky-accent">
                    {it.cabin}
                  </div>

                  <div className="text-right">
                    <div className="font-display text-2xl font-medium text-sky-dark">
                      ${it.priceUSD.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-sky-dark/40">
                      per passenger
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
