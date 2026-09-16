import { createFileRoute, Link } from "@tanstack/react-router";
import featurePassenger from "@/assets/feature-passenger.jpg";
import { SiteHeader, SiteFooter } from "@/components/landing/SiteChrome";

const TITLE = "Passenger Experience — SkyWay";
const DESCRIPTION =
  "Frictionless booking, biometric boarding, in-flight personalization, and loyalty integration across web, mobile, and kiosk.";

export const Route = createFileRoute("/passenger")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/passenger" },
      { property: "og:site_name", content: "SkyWay" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "/passenger" }],
  }),
  component: PassengerPage,
});

const FEATURES = [
  {
    title: "Booking & NDC offers",
    body: "Multi-city, round-trip, and open-jaw itineraries with Redis-backed seat locks and ticketing deadlines.",
  },
  {
    title: "Check-in everywhere",
    body: "Web, mobile, and airport kiosk check-in with biometric face match against passport photo.",
  },
  {
    title: "Wallet boarding passes",
    body: "Apple Wallet & Google Pay integration. Offline-capable on mobile, printable at any gate.",
  },
  {
    title: "Loyalty & miles",
    body: "Earn, burn, expiry, and tier upgrades — fully wired through the Passenger service.",
  },
  {
    title: "Ancillaries",
    body: "Baggage, meals, seat upgrades, lounge access, and travel insurance via EMD documents.",
  },
  {
    title: "Special services",
    body: "WCHR, VGML, UMNR and the full SSR catalog, propagated to ground staff and crew automatically.",
  },
];

function PassengerPage() {
  return (
    <div className="min-h-screen bg-sky-surface text-sky-dark">
      <SiteHeader />
      <CapabilityHero
        eyebrow="Passenger"
        title="Every touchpoint, beautifully orchestrated."
        body="From the search box to the jet bridge, SkyWay's passenger surfaces deliver a calm, premium experience."
        image={featurePassenger}
      />
      <FeatureList features={FEATURES} />
      <CallToAction />
      <SiteFooter />
    </div>
  );
}

// Shared capability page chrome (kept inline to avoid extra imports)
export function CapabilityHero({
  eyebrow,
  title,
  body,
  image,
}: {
  eyebrow: string;
  title: string;
  body: string;
  image: string;
}) {
  return (
    <header className="container mx-auto grid grid-cols-1 items-center gap-12 px-8 py-20 lg:grid-cols-2 lg:py-32">
      <div>
        <span className="mb-6 inline-block rounded-full bg-sky-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-sky-accent">
          {eyebrow} platform
        </span>
        <h1 className="font-display text-5xl font-light leading-tight tracking-tight md:text-6xl">
          {title}
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-sky-dark/70">
          {body}
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            to="/"
            hash="demo"
            className="rounded-xl bg-sky-dark px-6 py-4 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-sky-accent"
          >
            Request a demo
          </Link>
          <Link
            to="/"
            className="rounded-xl border border-sky-dark/15 bg-white px-6 py-4 text-sm font-semibold uppercase tracking-widest text-sky-dark transition-colors hover:border-sky-accent hover:text-sky-accent"
          >
            Back to overview
          </Link>
        </div>
      </div>
      <div className="aspect-[4/3] w-full overflow-hidden rounded-3xl bg-slate-100 outline outline-1 -outline-offset-1 outline-black/5">
        <img src={image} alt="" width={800} height={608} className="h-full w-full object-cover" />
      </div>
    </header>
  );
}

export function FeatureList({
  features,
}: {
  features: Array<{ title: string; body: string }>;
}) {
  return (
    <section className="border-y border-sky-dark/5 bg-white py-20">
      <div className="container mx-auto grid grid-cols-1 gap-10 px-8 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <article key={f.title}>
            <div className="mb-3 font-display text-xs font-bold tracking-widest text-sky-accent">
              {String(i + 1).padStart(2, "0")}
            </div>
            <h3 className="mb-2 font-display text-xl font-medium">{f.title}</h3>
            <p className="text-sm leading-relaxed text-sky-dark/60">{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CallToAction() {
  return (
    <section className="container mx-auto px-8 py-20 text-center">
      <h2 className="font-display text-3xl font-light leading-tight tracking-tight md:text-4xl">
        Ready to see it on your network?
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm text-sky-dark/60">
        Book a tailored walkthrough with our solutions team.
      </p>
      <Link
        to="/"
        hash="demo"
        className="mt-8 inline-block rounded-xl bg-sky-accent px-8 py-4 text-sm font-semibold uppercase tracking-widest text-white hover:scale-[1.02]"
      >
        Request a demo
      </Link>
    </section>
  );
}
