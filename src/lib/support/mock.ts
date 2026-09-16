// Mock data for the Customer Support Center — front-end only.

export type TicketStatus = "open" | "pending" | "resolved" | "closed" | "escalated";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketCategory =
  | "Flight Delay" | "Cancellation" | "Lost Baggage" | "Damaged Baggage"
  | "Seat Issue" | "Food Complaint" | "Staff Behaviour" | "Check-in Problem"
  | "Payment Issue" | "Refund Request" | "Technical Issue";

export type Ticket = {
  id: string;
  passenger: string;
  passengerId: string;
  email: string;
  booking: string;
  flight: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  agent: string;
  subject: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
  sentiment: "positive" | "neutral" | "negative";
  aiConfidence: number;
};

const AGENTS = ["Amelia Carter", "Rohan Verma", "Sofia Ricci", "Kenji Tanaka", "Lena Novak"];
const PASSENGERS = [
  "Elena Rossi", "Michael O'Brien", "Aiko Sato", "Rafael Costa", "Priya Nair",
  "Jonas Weber", "Chloé Dubois", "Aarav Patel", "Nora Lindqvist", "Miguel Santos",
  "Isla McKenzie", "Farid Hosseini", "Zara Ahmed", "Owen Reilly", "Tomás Kalinen",
  "Marta Kowalski", "Diego Alvarez", "Hana Okafor", "Yui Nakamura", "Marcus Bell",
];
const FLIGHTS = ["SW101","SW214","SW508","SW612","SW733","SW841","SW902","SW118"];
const CATS: TicketCategory[] = [
  "Flight Delay","Cancellation","Lost Baggage","Damaged Baggage","Seat Issue",
  "Food Complaint","Staff Behaviour","Check-in Problem","Payment Issue","Refund Request","Technical Issue",
];
const STATUSES: TicketStatus[] = ["open","open","pending","resolved","escalated","closed"];
const PRIORITIES: TicketPriority[] = ["low","medium","medium","high","urgent"];
const SUBJECTS: Record<TicketCategory, string> = {
  "Flight Delay": "Compensation for 4h delay",
  "Cancellation": "Flight cancelled — need rebooking",
  "Lost Baggage": "Missing checked bag at arrival",
  "Damaged Baggage": "Suitcase damaged upon delivery",
  "Seat Issue": "Assigned seat was broken",
  "Food Complaint": "Meal did not match dietary request",
  "Staff Behaviour": "Complaint about cabin crew",
  "Check-in Problem": "Boarding pass failed to generate",
  "Payment Issue": "Charged twice for the same ticket",
  "Refund Request": "Requesting refund for unused segment",
  "Technical Issue": "App crashes when opening boarding pass",
};

export const tickets: Ticket[] = Array.from({ length: 24 }, (_, i) => {
  const cat = CATS[i % CATS.length];
  const status = STATUSES[i % STATUSES.length];
  const prio = PRIORITIES[i % PRIORITIES.length];
  const created = new Date(Date.now() - (i + 1) * 3600 * 1000 * 1.6).toISOString();
  const updated = new Date(Date.now() - i * 900 * 1000).toISOString();
  return {
    id: `TCK-${8420 + i}`,
    passenger: PASSENGERS[i % PASSENGERS.length],
    passengerId: `pax_${1000 + i}`,
    email: PASSENGERS[i % PASSENGERS.length].toLowerCase().replace(/[^a-z]+/g, ".") + "@mail.com",
    booking: `SW${(i * 7919 % 100000).toString().padStart(6, "0")}`,
    flight: FLIGHTS[i % FLIGHTS.length],
    category: cat,
    priority: prio,
    status,
    agent: AGENTS[i % AGENTS.length],
    subject: SUBJECTS[cat],
    preview: `Passenger reports: ${SUBJECTS[cat].toLowerCase()} — needs review and follow-up.`,
    createdAt: created,
    updatedAt: updated,
    sentiment: (["negative","neutral","positive","negative","neutral"] as const)[i % 5],
    aiConfidence: 68 + (i * 13) % 32,
  };
});

export function addTicket(newTicket: Ticket) {
  tickets.unshift(newTicket);
}
export { AGENTS, PASSENGERS, FLIGHTS, CATS, PRIORITIES };

export type ChatThread = {
  id: string;
  ticketId: string;
  passenger: string;
  lastMessage: string;
  unread: number;
  online: boolean;
  updatedAt: string;
};
export const chatThreads: ChatThread[] = tickets.slice(0, 10).map((t, i) => ({
  id: `chat_${100 + i}`,
  ticketId: t.id,
  passenger: t.passenger,
  lastMessage: t.preview,
  unread: i % 3 === 0 ? (i % 4) + 1 : 0,
  online: i % 2 === 0,
  updatedAt: new Date(Date.now() - i * 120 * 1000).toISOString(),
}));

export type ChatMessage = {
  id: string; role: "passenger" | "agent" | "ai"; body: string; at: string; read?: boolean;
};
export const chatHistory: ChatMessage[] = [
  { id: "m1", role: "passenger", body: "Hi, my flight SW841 was cancelled and I need help rebooking as soon as possible.", at: new Date(Date.now() - 26 * 60000).toISOString(), read: true },
  { id: "m2", role: "ai", body: "Suggested reply: acknowledge cancellation, apologize, offer next 2 available flights and compensation voucher per EU261.", at: new Date(Date.now() - 25 * 60000).toISOString() },
  { id: "m3", role: "agent", body: "Hello — I'm truly sorry about the cancellation. I've found two options for you: SW846 tomorrow 08:15 or SW849 tomorrow 14:20. Would either work?", at: new Date(Date.now() - 22 * 60000).toISOString(), read: true },
  { id: "m4", role: "passenger", body: "SW846 works. Can I also get a meal voucher for tonight?", at: new Date(Date.now() - 6 * 60000).toISOString(), read: true },
  { id: "m5", role: "ai", body: "Eligible: 25 EUR meal voucher + 400 EUR EU261 compensation. Confidence 94%.", at: new Date(Date.now() - 5 * 60000).toISOString() },
];

export type RefundRow = {
  id: string; booking: string; passenger: string; flight: string;
  amount: number; reason: string; eligibility: "eligible" | "partial" | "not-eligible";
  status: "pending" | "approved" | "rejected" | "processing";
  method: "Visa" | "Mastercard" | "PayPal" | "Wallet" | "Bank Transfer";
  requestedAt: string;
};
export const refunds: RefundRow[] = Array.from({ length: 12 }, (_, i) => ({
  id: `RF-${6100 + i}`,
  booking: `SW${(i * 4231 % 100000).toString().padStart(6, "0")}`,
  passenger: PASSENGERS[i % PASSENGERS.length],
  flight: FLIGHTS[i % FLIGHTS.length],
  amount: 180 + (i * 137 % 900),
  reason: ["Cancellation","Schedule change","Duplicate charge","Downgrade","Illness","Service failure"][i % 6],
  eligibility: (["eligible","eligible","partial","not-eligible","eligible"] as const)[i % 5],
  status: (["pending","approved","processing","rejected","pending"] as const)[i % 5],
  method: (["Visa","Mastercard","PayPal","Wallet","Bank Transfer"] as const)[i % 5],
  requestedAt: new Date(Date.now() - (i + 1) * 3600 * 1000 * 3).toISOString(),
}));

export type Complaint = {
  id: string; passenger: string; category: TicketCategory; flight: string;
  severity: "low" | "medium" | "high"; status: "open" | "investigating" | "resolved";
  opened: string;
  timeline: { at: string; label: string; done: boolean }[];
};
export const complaints: Complaint[] = Array.from({ length: 10 }, (_, i) => {
  const cat = CATS[i % CATS.length];
  const opened = new Date(Date.now() - (i + 1) * 86400000 * 0.6).toISOString();
  return {
    id: `CMP-${3300 + i}`,
    passenger: PASSENGERS[i % PASSENGERS.length],
    category: cat,
    flight: FLIGHTS[i % FLIGHTS.length],
    severity: (["low","medium","high","medium","high"] as const)[i % 5],
    status: (["open","investigating","resolved","investigating","open"] as const)[i % 5],
    opened,
    timeline: [
      { at: opened, label: "Complaint filed", done: true },
      { at: new Date(Date.now() - i * 3600000 * 5).toISOString(), label: "AI categorized", done: true },
      { at: new Date(Date.now() - i * 3600000 * 4).toISOString(), label: "Assigned to agent", done: true },
      { at: new Date(Date.now() - i * 3600000 * 2).toISOString(), label: "Passenger contacted", done: i % 3 !== 2 },
      { at: new Date(Date.now() - i * 3600000).toISOString(), label: "Issue investigated", done: i % 4 !== 3 },
      { at: new Date().toISOString(), label: "Resolution proposed", done: i % 5 === 2 },
      { at: new Date().toISOString(), label: "Passenger confirmed", done: false },
      { at: new Date().toISOString(), label: "Ticket closed", done: false },
    ],
  };
});

export type Compensation = {
  id: string; passenger: string; flight: string; reason: string;
  type: "Voucher" | "Miles" | "Cash" | "Upgrade";
  amount: number; status: "pending" | "approved" | "rejected";
  aiRecommendation: "Approve" | "Reject" | "Escalate"; aiConfidence: number;
  route?: string;
  delayMinutes?: number;
  rootCause?: string;
  passengerTier?: "Silver" | "Gold" | "Platinum" | "Standard";
  bookingRef?: string;
  payoutMethod?: string;
  payoutTxId?: string;
  reviewNotes?: string;
  submittedAt?: string;
};
export const compensations: Compensation[] = Array.from({ length: 12 }, (_, i) => {
  const pax = PASSENGERS[i % PASSENGERS.length];
  const flight = FLIGHTS[i % FLIGHTS.length];
  const reasons = ["4h 20m Flight Delay", "Flight Cancellation (Tech Issue)", "Mishandled Checked Baggage > 24h", "Involuntary Denied Boarding (Oversold)", "Cabin Air Conditioning Failure in Cruise", "Downgrade from Business to Economy"];
  const routes = ["LHR → JFK", "CDG → DXB", "DEL → SIN", "FRA → BOM", "SIN → SYD", "AMS → HKG"];
  const rootCauses = ["Technical hydraulic sensor malfunction", "Ground turn-around slot miss at hub", "Baggage sorter breakdown at Terminal 2", "Involuntary bump due to aircraft gauge change", "Cabin pressurization sensor alert", "Aircraft swap from A350 to A320"];
  const tiers: ("Silver" | "Gold" | "Platinum" | "Standard")[] = ["Platinum", "Gold", "Silver", "Standard", "Gold", "Platinum"];

  return {
    id: `CMP-C${4200 + i}`,
    passenger: pax,
    flight,
    reason: reasons[i % reasons.length],
    type: (["Voucher", "Miles", "Cash", "Upgrade", "Voucher", "Cash"] as const)[i % 6],
    amount: [400, 600, 250, 800, 350, 500][i % 6],
    status: (["pending", "approved", "pending", "rejected", "approved", "pending"] as const)[i % 6],
    aiRecommendation: (["Approve", "Approve", "Escalate", "Reject", "Approve", "Approve"] as const)[i % 6],
    aiConfidence: [94, 98, 76, 89, 92, 95][i % 6],
    route: routes[i % routes.length],
    delayMinutes: [260, 0, 0, 180, 45, 0][i % 6],
    rootCause: rootCauses[i % rootCauses.length],
    passengerTier: tiers[i % tiers.length],
    bookingRef: `SW${(i * 3821 % 100000).toString().padStart(6, "0")}`,
    submittedAt: new Date(Date.now() - (i + 1) * 3600000 * 4).toISOString(),
    reviewNotes: i % 2 === 0 ? "Automated telemetry verified with OCC dispatch logs. No extraordinary circumstances detected." : "Passenger presented airport food and taxi receipts.",
  };
});

export type KbArticle = {
  id: string; title: string; category: string; views: number; updated: string; excerpt: string;
  tags?: string[];
  content?: string;
  author?: string;
  policyRef?: string;
};
export const kbArticles: KbArticle[] = [
  {
    id: "kb1",
    title: "Baggage allowance & excess fees policy",
    category: "Baggage Policy",
    views: 12480,
    updated: "2026-05-11",
    author: "Ground Ops Compliance",
    policyRef: "POL-BAG-2026-V3",
    tags: ["baggage", "luggage", "weight", "fees", "cabin", "carry-on"],
    excerpt: "Checked and cabin allowances by fare class and route, including excess weight rates and sports equipment.",
    content: `### 1. Cabin (Hand) Baggage Allowances
- **Economy Standard & Flex:** 1 piece up to 8 kg (max dimensions 55 x 40 x 23 cm) + 1 small personal item (handbag or laptop bag, max 40 x 30 x 15 cm).
- **Business Class:** 2 pieces up to 10 kg each + 1 personal item.
- **First Class / VIP Suite:** 2 pieces up to 14 kg each + 1 garment bag.

### 2. Checked Baggage by Fare Class
| Fare Class | Allowance | Max Weight per Piece |
| :--- | :--- | :--- |
| Economy Light | 0 pieces (Paid add-on) | 23 kg |
| Economy Standard | 1 piece included | 23 kg |
| Economy Flex | 2 pieces included | 23 kg each |
| Business Class | 2 pieces included | 32 kg each |
| Platinum Tier Bonus | +1 additional piece free | 32 kg |

### 3. Excess Baggage & Overweight Charges
- **Overweight (23.1 kg – 32.0 kg):** Flat fee of $75 / €70 per piece at the gate or check-in desk.
- **Extra Bag (Pre-booked online):** $45 / €40 per piece up to 24 hours prior to departure.
- **Extra Bag (Airport gate):** $85 / €80 per piece.
- **Musical Instruments & Sports Gear:** Allowed as checked baggage within weight limit; hard cases mandatory.`,
  },
  {
    id: "kb2",
    title: "Refund eligibility & cancellation matrix",
    category: "Refund Policy",
    views: 9820,
    updated: "2026-06-02",
    author: "Revenue & Ticketing",
    policyRef: "POL-REF-2026-REV2",
    tags: ["refund", "cancellation", "fare rules", "waivers", "wallet"],
    excerpt: "When passengers are entitled to full cash, partial credit, or SkyWay Wallet refunds across all fare classes.",
    content: `### 1. 24-Hour Cooling-Off Period
All tickets booked directly via SkyWay channels (website, app, or call center) at least 7 days before departure are entitled to a **100% full refund with zero cancellation fees** within 24 hours of booking.

### 2. Involuntary Cancellation / Airline Disruption
If SkyWay cancels a flight or changes departure time by **more than 120 minutes**:
- **Full Cash Refund:** 100% of unused ticket segments refunded to original payment method within 5–7 business days.
- **SkyWay Wallet Bonus:** Passenger can opt for SkyWay Wallet credit with an instant **+10% bonus value** and 24-month validity.

### 3. Voluntary Passenger Cancellation Matrix
| Fare Family | Refund Eligibility | Admin Fee | SkyWay Wallet Credit |
| :--- | :--- | :--- | :--- |
| **Basic Economy** | Non-refundable (Taxes only) | $50 | Not eligible |
| **Standard Economy** | Refundable with penalty | $100 fee deducted | Available (-$50 fee waiver) |
| **Flex Economy** | 100% Refundable | $0 fee | Full value + 5% credit bonus |
| **Business & First** | 100% Refundable | $0 fee | Full value |

### 4. Medical / Compassionate Waivers
With valid hospital admission documentation or death certificate of first-degree relative, cancellation penalties are waived in full (Authority Code: \`WAIVER-MED-2026\`).`,
  },
  {
    id: "kb3",
    title: "Online check-in & boarding pass cut-offs",
    category: "Check-in Rules",
    views: 7412,
    updated: "2026-04-19",
    author: "Airport Operations",
    policyRef: "POL-CHK-2026-01",
    tags: ["check-in", "boarding pass", "cut-off", "deadlines", "gates"],
    excerpt: "Cut-offs, document checks, digital boarding pass exceptions, and gate closure timing across all global hubs.",
    content: `### 1. Check-in Opening & Closing Windows
- **Online & Mobile App Check-in:** Opens **48 hours** prior to scheduled departure time (24 hours for US-bound flights due to TSA Secure Flight requirements). Closes **60 minutes** before departure.
- **Airport Kiosks & Bag Drop Desks:**
  - Short-haul / Domestic: Opens 2.5 hours prior, closes **45 minutes** prior.
  - Long-haul / International: Opens 3.5 hours prior, closes **60 minutes** prior.

### 2. Gate Closure Deadlines
- Boarding commences **45 minutes** before departure.
- Aircraft boarding gate strictly closes **15 minutes** before scheduled push-back.
- Offloaded passenger baggage retrieval takes 20+ minutes; late passengers cannot be boarded once gate is closed.

### 3. Digital Boarding Pass Restrictions
Physical check-in counter verification is mandatory for:
- Passengers requiring manual Visa / Entry permit verification (e.g. Schengen zone for select passport holders).
- Unaccompanied minors (UMNR) and medical oxygen / wheelchair passengers.`,
  },
  {
    id: "kb4",
    title: "Visa, passport validity & travel document guidelines",
    category: "Visa Information",
    views: 5301,
    updated: "2026-06-22",
    author: "International Regulatory Desk",
    policyRef: "POL-DOC-2026-V1",
    tags: ["visa", "passport", "immigration", "schengen", "transit", "esta"],
    excerpt: "Required travel documents, 6-month passport validity rules, transit visas, and automated Timatic lookups.",
    content: `### 1. Six-Month Passport Validity Rule
Passports must be valid for at least **6 months** beyond the intended date of return for travel to most destinations (including UAE, Singapore, India, Thailand, and United States). For Schengen zone countries, passport must have at least 3 months validity from planned departure date.

### 2. Transit Visa Requirements
- **London Heathrow (LHR):** Direct Airside Transit Visas (DATV) are required for non-exempt nationalities unless holding valid US/Canadian visas.
- **Dubai (DXB):** Airside transit permitted up to 24 hours without visa if connecting on single SkyWay / Emirates ticket.
- **Frankfurt (FRA) & Paris (CDG):** Non-Schengen to non-Schengen airside transit does not require Schengen visa for eligible nationalities.

### 3. Electronic Travel Authorizations
- **USA:** ESTA must be approved at least 72 hours prior.
- **UK:** ETA mandatory for Gulf Cooperation Council (GCC) nationals and expanding globally.
- **EU/Schengen:** ETIAS requirement checks integrated directly into SkyWay DCS.`,
  },
  {
    id: "kb5",
    title: "EU261 & global flight delay compensation rights",
    category: "Airline Policies",
    views: 8190,
    updated: "2026-03-08",
    author: "Legal & Passenger Rights",
    policyRef: "POL-EU261-2026",
    tags: ["eu261", "compensation", "delay", "cancellation", "rights", "voucher"],
    excerpt: "Official passenger rights, statutory compensation tiers (€250, €400, €600), extraordinary circumstances, and duty of care.",
    content: `### 1. EU261 / UK261 Compensation Schedule
Passengers are entitled to fixed statutory compensation when their flight arrives at final destination with **3+ hours of delay**, or is cancelled within 14 days of departure:

| Flight Distance | Delay Threshold | Statutory Cash Compensation | SkyWay Travel Voucher (+25%) |
| :--- | :--- | :--- | :--- |
| Under 1,500 km | 3+ hours | **€250 / $275** | €315 voucher |
| 1,500 km – 3,500 km | 3+ hours | **€400 / $440** | €500 voucher |
| Over 3,500 km | 3–4 hours | **€300 / $330** (50% rule) | €375 voucher |
| Over 3,500 km | 4+ hours | **€600 / $660** | **€750 voucher** or 60k miles |

### 2. Immediate Duty of Care (Free of Charge)
- **Delays > 2 Hours:** Refreshment and meal vouchers (€20–€30 per passenger). Two complimentary 3-minute telephone calls, faxes, or emails.
- **Overnight Delay:** Free hotel accommodation, airport transfers to/from hotel, and breakfast/dinner.

### 3. Extraordinary Circumstances (Exempt from Compensation)
Compensation is NOT payable if disruption is caused by:
- Severe weather (fog, typhoons, winter storm blizzards) below safety minima.
- Air Traffic Control (ATC) strikes or slot holds.
- Bird strikes or political instability.
*Note: Routine technical faults and airline crew shortages are NOT extraordinary circumstances per ECJ precedent.*`,
  },
  {
    id: "kb6",
    title: "Traveling with infants & minor policies",
    category: "Travel Guidelines",
    views: 4610,
    updated: "2026-02-14",
    author: "Cabin Safety Team",
    policyRef: "POL-INF-2026",
    tags: ["infant", "children", "bassinet", "stroller", "unaccompanied minor"],
    excerpt: "Seating guidelines, infant bassinet pre-booking, collapsible strollers, and Unaccompanied Minor (UMNR) protocols.",
    content: `### 1. Lap Infant Policy (Under 2 Years)
- **Fare:** 10% of adult fare + taxes for infant sitting on adult's lap.
- **Baggage Allowance:** 1 checked bag (up to 10 kg) + 1 fully collapsible stroller / pushchair and 1 car seat checked free of charge at the gate.
- **Bassinets:** Available on long-haul widebody aircraft (A350, B787) in bulkhead rows. Maximum infant weight 11 kg / length 70 cm. Must be reserved during booking.

### 2. Child Fares (2–11 Years)
- Child occupies own seat at 75%–85% of adult base fare. Full standard baggage allowance applies.

### 3. Unaccompanied Minors (UMNR) (Ages 5–14)
- Mandatory service for children traveling without an adult aged 18+.
- Dedicated SkyWay guardian escorts child through security, lounge, and boarding, and hands over to designated recipient at destination.
- UMNR fee: $100 short-haul / $150 long-haul per direction.`,
  },
  {
    id: "kb7",
    title: "Special assistance & accessibility services",
    category: "Special Assistance",
    views: 3520,
    updated: "2026-05-30",
    author: "Passenger Care Accessibility",
    policyRef: "POL-ACC-2026",
    tags: ["wheelchair", "special assistance", "oxygen", "service animal", "blind", "deaf"],
    excerpt: "Wheelchair assistance categories (WCHR, WCHS, WCHC), service animals, medical oxygen, and airport escorting.",
    content: `### 1. Wheelchair Assistance Categories (IATA Codes)
- **WCHR (Ramp):** Passenger can climb stairs and walk to cabin seat, but needs assistance across terminal concourses.
- **WCHS (Steps):** Passenger cannot climb stairs, but can slowly walk inside aircraft cabin to seat.
- **WCHC (Cabin):** Passenger is completely immobile; requires aisle wheelchair to reach seat and assistance with transfers.

### 2. Service Animals (SVAN)
- Recognized guide dogs and assistance dogs fly free in cabin at the passenger's feet.
- Notification required at least **48 hours** prior with valid vaccination and training certificates.

### 3. Medical Clearances (MEDIF)
- Medical Information Form required for stretcher cases, incubator, continuous medical oxygen (FAA approved POC models only), or recent surgery within 10 days.`,
  },
  {
    id: "kb8",
    title: "SkyWay Rewards tier benefits & loyalty privileges",
    category: "Loyalty Program",
    views: 6270,
    updated: "2026-06-01",
    author: "Loyalty & CRM",
    policyRef: "POL-LOY-2026",
    tags: ["rewards", "loyalty", "silver", "gold", "platinum", "lounge", "upgrades"],
    excerpt: "Silver, Gold, and Platinum tier qualification, complimentary upgrades, lounge access rules, and bonus miles.",
    content: `### 1. Tier Qualification & Benefits
| Benefit | Silver (25k miles) | Gold (50k miles) | Platinum (100k miles) |
| :--- | :--- | :--- | :--- |
| **Tier Bonus Miles** | +25% bonus | +50% bonus | +100% bonus |
| **Priority Check-in & Bag Drop** | Business Class counter | Business Class counter | First Class counter |
| **Lounge Access** | 2 passes per year | Unlimited member + 1 guest | Unlimited member + 2 guests |
| **Extra Baggage Allowance** | +1 piece (23 kg) | +1 piece (32 kg) | +1 piece (32 kg) free |
| **Priority Boarding** | Zone 2 | Zone 1 | Zone 1 (First on board) |
| **Complimentary Seat Selection** | Standard seats | Extra legroom seats | Any seat including bulkhead |
| **Annual Upgrade Vouchers** | 1 one-way voucher | 2 one-way vouchers | 4 one-way vouchers |`,
  },
];


export type PassengerProfile = {
  id: string; name: string; email: string; tier: "Silver" | "Gold" | "Platinum";
  since: string; trips: number; refunds: number; assistance: string[];
  upcoming: { flight: string; route: string; date: string }[];
  previousTickets: number;
};
export const passengerSample: PassengerProfile = {
  id: "pax_1000",
  name: "Elena Rossi",
  email: "elena.rossi@mail.com",
  tier: "Gold",
  since: "2022-04-18",
  trips: 47,
  refunds: 3,
  assistance: ["Vegetarian meal"],
  upcoming: [
    { flight: "SW214", route: "LHR → CDG", date: "2026-07-14" },
    { flight: "SW508", route: "DXB → SIN", date: "2026-08-02" },
  ],
  previousTickets: 6,
};

export type SupportNotification = {
  id: string; title: string; body: string; kind: "ticket" | "priority" | "refund" | "escalation" | "ai" | "reply" | "sla";
  severity: "low" | "medium" | "high" | "critical"; at: string;
};
export const supportNotifications: SupportNotification[] = [
  { id: "sn1", title: "New ticket assigned — TCK-8437", body: "Payment issue reported by Aarav Patel.", kind: "ticket",     severity: "medium",   at: new Date(Date.now() - 4 * 60000).toISOString() },
  { id: "sn2", title: "Urgent: escalated case TCK-8420", body: "Elena Rossi — flight cancellation, VIP passenger.",          kind: "escalation", severity: "critical", at: new Date(Date.now() - 12 * 60000).toISOString() },
  { id: "sn3", title: "Refund approved · RF-6104",   body: "Amount 460 USD processed to Visa •••4821.",                       kind: "refund",     severity: "low",      at: new Date(Date.now() - 22 * 60000).toISOString() },
  { id: "sn4", title: "AI Alert — sentiment dropping", body: "Thread with Miguel Santos flagged as increasingly negative.",   kind: "ai",         severity: "high",     at: new Date(Date.now() - 34 * 60000).toISOString() },
  { id: "sn5", title: "New passenger reply · TCK-8425", body: "Chloé Dubois: 'Thanks, that works — please proceed.'",         kind: "reply",      severity: "low",      at: new Date(Date.now() - 48 * 60000).toISOString() },
  { id: "sn6", title: "SLA breach warning · TCK-8412", body: "First response due in 12 minutes.",                             kind: "sla",        severity: "high",     at: new Date(Date.now() - 60 * 60000).toISOString() },
];

// Chart series
export const ticketVolume = Array.from({ length: 14 }, (_, i) => ({
  d: `${i + 1}`,
  opened: 80 + Math.round(Math.sin(i / 2) * 30 + Math.random() * 20),
  resolved: 60 + Math.round(Math.cos(i / 2) * 25 + Math.random() * 22),
}));
export const csatTrend = Array.from({ length: 12 }, (_, i) => ({
  m: ["J","F","M","A","M","J","J","A","S","O","N","D"][i],
  csat: 84 + Math.round(Math.sin(i / 1.5) * 5 + Math.random() * 3),
}));
export const categoryMix = [
  { name: "Delays",     value: 28, fill: "hsl(220 80% 55%)" },
  { name: "Baggage",    value: 22, fill: "hsl(42 80% 55%)" },
  { name: "Refunds",    value: 18, fill: "hsl(160 60% 45%)" },
  { name: "Payments",   value: 12, fill: "hsl(0 70% 55%)" },
  { name: "Check-in",   value: 10, fill: "hsl(268 60% 60%)" },
  { name: "Other",      value: 10, fill: "hsl(220 15% 55%)" },
];
export const agentPerf = [
  { name: "Amelia",  handled: 128, csat: 96, avg: 3.2 },
  { name: "Rohan",   handled: 112, csat: 92, avg: 3.9 },
  { name: "Sofia",   handled: 104, csat: 94, avg: 3.5 },
  { name: "Kenji",   handled:  98, csat: 91, avg: 4.1 },
  { name: "Lena",    handled:  87, csat: 95, avg: 3.6 },
];
