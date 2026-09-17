import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(8000),
});

const SYSTEM_PROMPT = `You are the SkyWay Airlines AI Operations Copilot — an intelligent digital operations manager embedded in the airline's Operations Control Center (OCC).

Audience: OCC Flight Controllers, Dispatchers, and Airline Executives.
Tone & Style: Direct, data-driven, decisive, executive-ready.
Formatting: Use markdown headings, bullet points, clean markdown tables, and highlighted risk metrics.
Include: Summary, Supporting Ops Data, Recovery Recommendations, and Confidence score (0–100%).
Airline Fleet & Network: Boeing 787-9 Dreamliners, Airbus A350-1000, A320neo fleet. Hubs: DEL, BOM, DXB, LHR, CDG, JFK, SIN, HND.`;

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch {
      aiClient = null;
    }
  }
  return aiClient;
}

function generateOfflineOpsResponse(userQuery: string): string {
  const q = userQuery.toLowerCase();

  // Cancelled flights
  if (q.includes("cancel") || q.includes("cancellation")) {
    return `### 🚫 SkyWay Network Cancellation Status & Recovery Actions

**Summary:** 3 flights cancelled today (0.6% cancellation rate), well within the 1.0% operational ceiling.

| Flight | Route | Aircraft | Reason | Pax Affected | Recovery Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SW309** | CDG → FRA | A320neo (SW-A012) | Hydraulic valve failure | 164 pax | 92% rebooked on SW315 / Lufthansa |
| **SW811** | DEL → BOM | B787-9 (SW-B004) | Severe fog DEL runway 28 | 278 pax | Accommodated on morning extra section SW811D |
| **SW602** | SIN → SYD | A350-1000 (SW-A009) | Crew flight time limitation | 290 pax | Hotel vouchers issued + Qantas code-share |

#### 🛠️ OCC Action Directives:
1. **Re-accommodation:** 84% of affected passengers confirmed on departures within 4 hours.
2. **Aircraft SW-A012:** Tech team dispatched at CDG Gate E14, return to service scheduled for 18:30 UTC.
3. **Compensation Matrix:** Automated EU261 & DGCA notifications triggered for eligible ticket holders.

*Confidence: 98% | Risk Level: Controlled*`;
  }

  // Crew shortages or waiting for crew
  if (q.includes("crew") || q.includes("pilot") || q.includes("attendant") || q.includes("duty")) {
    return `### 👨‍✈️ SkyWay Crew Operations & Roster Integrity

**Summary:** 2 flights currently flagged for tight crew rotation; 1 standby crew mobilized at Frankfurt (FRA).

| Flight | Route | Crew Base | Duty Status | Risk Factor | Action Taken |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SW508** | FRA → BOM | FRA | Flight Duty Limit in 45m | High (68%) | Standby Captain C-8821 dispatched |
| **SW732** | LHR → JFK | LHR | Rest period compliant | Low (15%) | Operating normal roster |
| **SW110** | DEL → DXB | DEL | Reserve crew available | Minimal | Standby in DEL OCC ready room |

#### 📋 Dispatch Roster Actions:
- **Standby Reserve Mobilization:** Frankfurt crew control has assigned standby Captain C-8821 and FO F-4029 to SW508.
- **Flight Duty Period (FDP) Compliance:** 100% legal under EASA & FAA Part 117 limits.
- **Hotel & Transport:** Pre-arranged for long-haul crews landing at JFK and SIN.

*Confidence: 94% | Status: Nominal*`;
  }

  // Aircraft maintenance / AOG
  if (q.includes("maint") || q.includes("aircraft") || q.includes("fleet") || q.includes("wrench") || q.includes("tech") || q.includes("aog")) {
    return `### 🔧 SkyWay Fleet Health & Technical Maintenance Brief

**Summary:** 142 of 148 aircraft in active service (95.9% availability). 6 aircraft in maintenance.

| Tail No. | Type | Location | Status | Issue / Check | Est. Release |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SW-A012** | A320neo | CDG | AOG (Hangar 2) | Hydraulic valve swap | 18:30 UTC |
| **SW-B002** | B787-9 | LHR | Scheduled | C-Check Phase 4 | Tomorrow 06:00 |
| **SW-A003** | A320neo | DEL | Standby Ready | Backup aircraft assigned | Immediate |
| **SW-A008** | A350-1000 | SIN | Routine | Tire & brake assembly | 14:00 UTC |

#### 🛡️ Operations Recommendations:
1. SW-A003 positioned as hot-spare for European/Middle-East narrowbody disruptions.
2. Fuel efficiency telemetry indicates optimal cruise performance across the B787-9 Dreamliner fleet (+1.4% fuel savings vs planned).

*Confidence: 97% | Engineering Status: Green*`;
  }

  // Passengers affected & rebooking
  if (q.includes("passenger") || q.includes("pax") || q.includes("rebook") || q.includes("compensation") || q.includes("eu261")) {
    return `### 👥 Passenger Disruption & Re-accommodation Telemetry

**Summary:** 1,240 passengers impacted today across 4 delayed and 3 cancelled sectors. 

#### Passenger Impact Breakdown:
- **Connecting Passengers:** 298 pax (at-risk connections at LHR, FRA, DXB)
- **VIP / Frequent Flyers:** 74 Elite & Platinum tier members
- **Special Assistance (PRM):** 37 passengers requiring wheelchair/escort services
- **Rebooked Successfully:** 1,082 pax (87.2% first-pass automated resolution)

#### 💰 Financial Exposure:
- **Estimated Compensation (EU261 / Standard):** $184,200
- **Hotel & Meal Vouchers Issued:** 245 vouchers ($24,500)
- **AI Automated Savings vs Manual Rebooking:** +$62,800 saved via optimized partner routing.

*Recommendation:* Prioritize gate-to-gate escort for VIP passengers on SW732 connecting to domestic JFK services.`;
  }

  // Routes with most delays
  if (q.includes("route") || q.includes("corridor") || q.includes("sector")) {
    return `### 🌐 SkyWay Route Performance & Delay Corridors

**Top 5 Disrupted Routes (Last 24 Hours):**

| Route Corridor | Flights | Avg Delay | Primary Bottleneck | AI Optimization |
| :--- | :--- | :--- | :--- | :--- |
| **LHR ↔ JFK** | 8 | +38 min | North Atlantic Track holding | Reroute via Track Delta (−18m) |
| **DXB ↔ HKG** | 6 | +45 min | South China Sea FIR congestion | Southern detour waypoint (−22m) |
| **AMS ↔ SIN** | 4 | +28 min | Inbound slot delays Amsterdam | Speed adjustment Mach .85 |
| **CDG ↔ BOM** | 4 | +18 min | Ground turnaround Paris | Fast-track baggage team |
| **DEL ↔ LHR** | 6 | +12 min | Normal flow | On Schedule |

*Insight:* Oceanic tracks across the North Atlantic are seeing 15% higher tailwinds on eastbound flights, recovering up to 20 minutes on return legs.`;
  }

  // Performance / 7-day average / OTP
  if (q.includes("performance") || q.includes("average") || q.includes("otp") || q.includes("kpi")) {
    return `### 📈 SkyWay Operational Performance vs. 7-Day Baseline

| Metric | Today | 7-Day Avg | Delta | Operational Target |
| :--- | :--- | :--- | :--- | :--- |
| **On-Time Performance (A15)** | **84.2%** | 82.4% | 🟢 +1.8% | 85.0% |
| **Completion Rate** | **99.4%** | 99.1% | 🟢 +0.3% | 99.0% |
| **Avg Turnaround Time** | **44 min** | 47 min | 🟢 −3 min | 45 min |
| **Passenger Load Factor** | **88.6%** | 87.2% | 🟢 +1.4% | 85.0% |
| **Fuel Burn Accuracy** | **99.1%** | 98.8% | 🟢 +0.3% | 98.5% |

**Executive Summary:** Today's performance exhibits strong operational resilience. Faster turnaround times at London Heathrow and Delhi hubs contributed directly to the +1.8% gain in On-Time Performance.`;
  }

  // Specific flight query
  if (q.includes("sw732") || q.includes("sw 732")) {
    return `### ✈️ Deep Dive: Flight SW732 (LHR → JFK)
- **Aircraft:** Boeing 787-9 (Tail: SW-B002)
- **Current Status:** En Route · ETA 17:15 UTC (+48 min delay)
- **Passengers:** 264 on board (28 Business, 236 Economy) · 18 connecting pax
- **Root Cause:** Convective activity over New York TMA holding arrival flow
- **AI Recommendation:** Request priority arrival slot via approach vector. Deploy express ground transfer team at JFK Terminal 4 for domestic connections.`;
  }

  if (q.includes("sw220") || q.includes("sw 220")) {
    return `### ✈️ Deep Dive: Flight SW220 (AMS → SIN)
- **Aircraft:** Airbus A350-1000 (Tail: SW-A008)
- **Current Status:** Boarding at AMS Gate D08 · Scheduled Dep 11:30 UTC (+35 min delay)
- **Passengers:** 198 on board · 42 connecting onward to Sydney (SYD)
- **Root Cause:** Late inbound aircraft from Zurich due to morning ground fog
- **AI Recommendation:** Increase cruise speed to Mach .85 over Arabian airspace to make up 16 minutes in flight.`;
  }

  if (q.includes("sw1225") || q.includes("sw 1225")) {
    return `### ✈️ Deep Dive: Flight SW1225 (DXB → HKG)
- **Aircraft:** Boeing 787-9 (Tail: SW-B005)
- **Current Status:** Taxied for Departure · +65 min delay
- **Passengers:** 312 on board · 6 VIPs in First Class
- **Root Cause:** Air traffic flow management restriction over Bay of Bengal
- **AI Recommendation:** Re-route via southern waypoint to bypass holding fix at HKG. VIP lounge escort arranged at Hong Kong.`;
  }

  if (q.includes("delay") || q.includes("delayed")) {
    return `### 🛫 SkyWay Flight Delay Status & Impact Analysis

**Summary:** 4 active flights experiencing delays across the network due to weather flow control and maintenance turnarounds.

| Flight | Route | Delay | Primary Cause | Pax Impact | Est. Recovery |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SW732** | LHR → JFK | +48 min | Convective Weather / ATC slot | 264 pax | 16:40 UTC |
| **SW220** | AMS → SIN | +35 min | Late inbound aircraft | 198 pax | 19:15 UTC |
| **SW1225** | DXB → HKG | +65 min | Airspace congestion FIR | 312 pax | 21:30 UTC |
| **SW508** | FRA → BOM | +25 min | Ground handling & refueling | 240 pax | 14:10 UTC |

#### 🛡️ Recommended OCC Actions:
1. **SW732 (LHR → JFK):** Coordinate priority departure slot with NATS. Notify 18 connecting passengers for onward domestic JFK connections.
2. **SW1225 (DXB → HKG):** Request alternate routing via southern waypoint to shave 18 minutes of holding time.
3. **Crew Compliance:** All operating crews remain within standard Flight Duty Period (FDP) limits.

*Confidence: 96% | Risk Level: Moderate*`;
  }

  if (q.includes("report") || q.includes("executive") || q.includes("summary")) {
    return `### 📊 SkyWay Airlines Daily Operations Briefing

**Reporting Window:** 00:00 – 12:00 UTC | **Network Status:** High Efficiency

#### Key Performance Indicators (KPIs)
- **On-Time Performance (A15):** 84.2% *(+1.8% vs 7-day baseline)*
- **Completion Factor:** 99.4% *(1 minor regional cancellation due to fog)*
- **Fleet In-Service:** 142 of 148 active aircraft *(6 scheduled heavy checks)*
- **Average Turnaround Time:** 44 minutes *(Target: 45 min)*
- **Passenger Load Factor:** 88.6% across 214 operated sectors

#### Regional Network Highlights
- **Middle East & Europe (DXB / LHR / CDG):** Smooth operations. Minor runway congestion at LHR T5 resulting in 8–12 min taxi delays.
- **Asia-Pacific (SIN / HND):** Clear weather, 100% on-time departures.
- **North America (JFK):** Afternoon storm front monitoring initiated.

*Recommendation:* Maintain current slot swaps at LHR and pre-position standby crew at FRA base.`;
  }

  if (q.includes("congest") || q.includes("airport") || q.includes("busy") || q.includes("gate")) {
    return `### 🏢 SkyWay Hub & Airport Congestion Report

| Airport Hub | Code | Alert Status | Gate Utilization | Inbound Queue | Weather |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **London Heathrow** | LHR | 🟡 Amber | 92% (High) | 6 aircraft | Overcast, 12 kt wind |
| **New York JFK** | JFK | 🟡 Amber | 86% | 4 aircraft | Pre-frontal gusts |
| **Dubai International**| DXB | 🟢 Green | 78% | 2 aircraft | Clear, 38°C |
| **Delhi Indira Gandhi**| DEL | 🟢 Green | 81% | 3 aircraft | Clear, Good Vis |
| **Frankfurt** | FRA | 🟢 Green | 74% | 1 aircraft | Light rain |

*Key Takeaway:* LHR Terminal 2 & 4 experiencing minor pushback delays. Dedicated SkyWay express gates B12–B18 operating smoothly.`;
  }

  if (q.includes("risk") || q.includes("predict") || q.includes("disruption")) {
    return `### ⚡ Predictive Disruption Intelligence (Next 4 Hours)

**Risk Evaluation Matrix:**

1. **SW732 (LHR → JFK) — Risk Score: 74% (High)**
   - *Reason:* Expected convective squall line crossing Long Island at arrival window.
   - *Mitigation:* File 4,500 kg extra contingency fuel; designate BOS and PHL as primary alternates.

2. **SW508 (FRA → BOM) — Risk Score: 52% (Moderate)**
   - *Reason:* Inbound crew rotation tight at 38 minutes.
   - *Mitigation:* Dispatch standby First Officer team from FRA crew lounge.

*Overall Network Risk:* Low-to-Moderate. Expected OTP impact is under 1.5%.`;
  }

  return `### ✈️ SkyWay AI Operations Copilot Active

**Network Overview:**
- **Active Flights in Air:** 48 aircraft
- **Scheduled Today:** 312 departures
- **System OTP:** 84.2%
- **OCC Incident Level:** Normal / Routine Flow

How may I assist your dispatch team? You can query:
- *"Show all delayed flights and passenger connections"*
- *"Generate daily executive operations report"*
- *"Show cancelled flights and crew status"*
- *"Which aircraft require maintenance?"*
- *"Check airport congestion and gate availability at LHR/DEL"*`;
}

export const askCopilot = createServerFn({ method: "POST" })
  .validator((data) =>
    z.object({
      messages: z.array(MessageSchema).min(1).max(30),
    }).parse(data),
  )
  .handler(async ({ data }) => {
    const lastUserMessage = [...data.messages].reverse().find((m) => m.role === "user")?.content || "";
    const client = getGeminiClient();

    if (client) {
      try {
        const response = await client.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            { role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\nUser Question:\n${lastUserMessage}` }] },
          ],
        });

        const reply = response.text;
        if (reply && reply.trim().length > 0) {
          return { content: reply };
        }
      } catch (err) {
        console.warn("Gemini Copilot API error, falling back to operations intelligence engine:", err);
      }
    }

    // High-fidelity fallback
    return { content: generateOfflineOpsResponse(lastUserMessage) };
  });

