import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { store } from "../store";

export const aiRouter = Router();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });
    } catch (e) {
      console.warn("Failed to initialize Gemini client:", e);
      aiClient = null;
    }
  }
  return aiClient;
}

const AIRLINE_SYSTEM_PROMPT = `You are SkyWay Airlines' primary AI Travel Concierge.
You provide intelligent, helpful, and concise assistance for:
1. Finding flights, comparing fares, and explaining route networks.
2. Explaining baggage allowances:
   - Economy: 1 x 23kg checked bag + 7kg cabin bag.
   - Premium Economy: 2 x 23kg checked bags + 10kg cabin bag.
   - Business: 2 x 32kg checked bags + 12kg cabin bag.
   - First Class: 3 x 32kg checked bags + 15kg cabin bag.
3. Check-in guidelines: Online check-in opens 24 hours prior to departure and closes 90 minutes before international flights.
4. SkyWay Hubs: Delhi (DEL), Mumbai (BOM), Dubai (DXB), London Heathrow (LHR), Paris (CDG), New York (JFK), Tokyo Haneda (HND), Singapore (SIN), Maldives (MLE).
5. Lounge access, seat selection, special assistance, and flight changes.

Tone: Warm, sophisticated, executive, helpful, and polite. Always keep answers scannable and accurate.`;

// POST /api/ai/chat
aiRouter.post("/chat", async (req, res) => {
  const { messages = [], query } = req.body || {};

  const userQuery = query || (messages.length > 0 ? messages[messages.length - 1].content : "");

  if (!userQuery) {
    return res.status(400).json({ success: false, message: "Query or messages required" });
  }

  const client = getGeminiClient();

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: "gemini-3.7-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: `${AIRLINE_SYSTEM_PROMPT}\n\nPassenger asks: ${userQuery}` }
            ]
          }
        ],
      });

      const text = response.text || "I am glad to assist you with your SkyWay journey.";
      return res.json({
        success: true,
        source: "gemini",
        reply: text,
      });
    } catch (err: any) {
      console.warn("Gemini API call failed, falling back to rule engine:", err?.message);
    }
  }

  // Smart fallback response engine
  const q = userQuery.toLowerCase();
  let reply = "";
  let action: any = null;

  if (q.includes("baggage") || q.includes("luggage") || q.includes("allowance")) {
    reply = "Here is SkyWay's standard baggage policy:\n• Economy: 1×23kg checked bag + 7kg cabin bag.\n• Premium Economy: 2×23kg checked bags + 10kg cabin.\n• Business Class: 2×32kg checked bags + 12kg cabin.\n• First Class: 3×32kg checked bags.\n\nYou can purchase additional bags at a discounted pre-flight rate.";
    action = { label: "Manage Baggage", url: "/app/booking/extras" };
  } else if (q.includes("paris") || (q.includes("flight") && q.includes("cdg"))) {
    reply = "We operate daily nonstop Boeing 787 flights to Paris (CDG) starting at ₹42,900 from Delhi (DEL). Flight SW128 departs at 07:40 and lands at 14:20.";
    action = { label: "Book Paris Flight", url: "/app/search/DEL-CDG" };
  } else if (q.includes("london") || q.includes("lhr")) {
    reply = "SkyWay flies nonstop to London Heathrow (LHR) aboard our flagship Airbus A350-1000. Flight SW502 departs Delhi at 10:15 with lie-flat Business Class suites.";
    action = { label: "Book London Flight", url: "/app/search/DEL-LHR" };
  } else if (q.includes("check in") || q.includes("check-in") || q.includes("boarding pass")) {
    reply = "Online check-in opens 24 hours prior to departure. You can select your seat, confirm your baggage, and download your mobile wallet boarding pass in seconds.";
    action = { label: "Start Check-in", url: "/app/check-in/SW9M2P" };
  } else if (q.includes("lounge") || q.includes("food") || q.includes("meal")) {
    reply = "Business and First Class passengers enjoy complimentary access to SkyWay Silver Lining Lounges across all major hubs, featuring chef-curated buffets, private shower suites, and quiet zones.";
    action = { label: "Explore Lounges", url: "/app/loyalty" };
  } else if (q.includes("status") || q.includes("delay") || q.includes("sw128") || q.includes("gate")) {
    reply = "Flight SW128 (Delhi DEL → Paris CDG) is currently **On Time**, scheduled for 07:40 departure from Gate B12, Terminal 3.";
    action = { label: "Track Flight Live", url: "/app/flight-status/SW128" };
  } else {
    reply = `Welcome to SkyWay Airlines! I am your 24/7 AI Travel Concierge. I can help you search flights, manage seat upgrades, check baggage allowances, track live gate status, or arrange special airport assistance. How may I help you today?`;
  }

  res.json({
    success: true,
    source: "rule-engine",
    reply,
    action,
  });
});

// Destination Curated Fallbacks for immediate resilience
const CURATED_DESTINATIONS: Record<string, any> = {
  BOM: {
    destination: {
      city: "Mumbai",
      country: "India",
      code: "BOM",
      tagline: "The City of Dreams & India's Financial Capital",
      timezone: "IST (UTC+5:30)",
      currency: "INR (₹)",
      emergencyNumber: "112",
    },
    weatherOutlook: {
      season: "Monsoon / Coastal Warm",
      tempSummary: "28°C – 32°C (Humid & Breezy)",
      highC: 32,
      lowC: 27,
      condition: "Tropical Coastal Breeze with Occasional Monsoon Showers",
      rainfallAdvice: "High chance of sudden downpours. Carry water-resistant gear and waterproof footwear.",
      uvIndex: "Moderate to High (6-8)",
    },
    packingChecklist: [
      {
        category: "Clothing & Footwear",
        items: [
          { name: "Light breathable cotton or linen shirts", reason: "High coastal humidity year-round", essential: true },
          { name: "Waterproof windbreaker or compact umbrella", reason: "Frequent monsoon showers", essential: true },
          { name: "Comfortable water-resistant walking shoes / sandals", reason: "Puddle protection during city strolls", essential: true },
          { name: "Light evening jacket / shawl", reason: "High air-conditioned malls, restaurants, and lounges", essential: false },
        ],
      },
      {
        category: "Electronics & Tech",
        items: [
          { name: "Type C/D/M 3-pin power adapter", reason: "Standard Indian electrical sockets (230V)", essential: true },
          { name: "Power bank (carry-on ONLY, <20,000mAh)", reason: "Airport safety regulations prohibit power banks in checked luggage", essential: true },
          { name: "Waterproof phone pouch", reason: "Protection during heavy rainfall", essential: false },
        ],
      },
      {
        category: "Health & Documents",
        items: [
          { name: "Government Photo ID / DigiYatra", reason: "Seamless facial recognition entry at BOM T2 / T1", essential: true },
          { name: "Mosquito repellent lotion & hand sanitizer", reason: "Essential for evening outdoor exploration", essential: true },
          { name: "Electrolyte sachets / hydration tablets", reason: "Combating tropical humidity while sightseeing", essential: false },
        ],
      },
      {
        category: "Destination Specials",
        items: [
          { name: "UPI App / contactless payment setup", reason: "Almost all merchants from street stalls to cafes accept UPI / cards", essential: true },
          { name: "Modest attire for temple / heritage visits", reason: "Shoulders and knees covered for Siddhivinayak or Haji Ali", essential: true },
        ],
      },
    ],
    travelTips: [
      { category: "Airport & Transit", tip: "Terminal 2 (T2) at BOM is an architectural marvel housing the Jaya He GVK museum. Leave 2.5 hours before departure during evening peak hours." },
      { category: "Local Transport", tip: "Use Mumbai Metro Line 3 (Aqua Line) or app-cabs (Uber/Ola) for airport transfers to Bandra and South Mumbai. Prepaid black-and-yellow taxis are also right outside arrivals." },
      { category: "Culinary Must-Try", tip: "Don't miss authentic coastal Seafood at Mahesh Lunch Home or Gajalee, Vada Pav at Mithibai, and Bun Maska Irani Chai at Kyani & Co." },
      { category: "Cultural Etiquette", tip: "Remove footwear before entering temples, shrines, and local residences. Tipping 5-10% at restaurants is customary." },
      { category: "Sightseeing Highlight", tip: "Take an evening sunset walk along Marine Drive (Queen's Necklace) or explore the colonial heritage around Fort and Kala Ghoda." },
    ],
    airlineBaggageNotice: {
      cabinAllowance: "1 × 7kg bag (55×35×25 cm) + 1 slim laptop bag / handbag",
      checkedAllowance: "Economy: 1 × 23kg | Business: 2 × 32kg (Gold members receive +10kg free)",
      liquidsRule: "Max 100ml per container in cabin luggage, placed in transparent resealable bag",
      prohibitedItems: ["Power banks in checked bags", "E-cigarettes / vapes", "Loose lithium batteries in hold"],
    },
  },
  DXB: {
    destination: {
      city: "Dubai",
      country: "United Arab Emirates",
      code: "DXB",
      tagline: "The City of Gold, Futuristic Luxury & Desert Wonders",
      timezone: "GST (UTC+4)",
      currency: "AED (United Arab Emirates Dirham)",
      emergencyNumber: "999 (Police) / 998 (Ambulance)",
    },
    weatherOutlook: {
      season: "Sunny & Warm / Air-Conditioned Indoors",
      tempSummary: "32°C – 41°C (Arid Desert Climate)",
      highC: 41,
      lowC: 30,
      condition: "Bright Clear Skies with Intense Sunshine",
      rainfallAdvice: "Virtually zero rainfall. UV protection and hydration are paramount.",
      uvIndex: "Extreme (10-11)",
    },
    packingChecklist: [
      {
        category: "Clothing & Footwear",
        items: [
          { name: "Breathable natural fabric clothing (linen/cotton)", reason: "High outdoor temperatures", essential: true },
          { name: "Light sweater / pashmina", reason: "Malls, metros, and fine-dining venues keep AC very cold (~20°C)", essential: true },
          { name: "UV400 Polarized sunglasses & wide-brim hat", reason: "Intense midday desert sun", essential: true },
          { name: "Smart-casual attire for rooftop lounges", reason: "Strict dress codes at Burj Khalifa, high-end lounges, and clubs", essential: true },
        ],
      },
      {
        category: "Electronics & Tech",
        items: [
          { name: "UK 3-pin Type G plug adapter", reason: "Standard UAE wall sockets (220-240V)", essential: true },
          { name: "High-capacity power bank in cabin luggage", reason: "Full day sightseeing at Dubai Mall & desert safari", essential: true },
          { name: "Camera with dust-proof cover for desert", reason: "Fine sand protection during dune bashing", essential: false },
        ],
      },
      {
        category: "Health & Documents",
        items: [
          { name: "Valid Passport (≥6 months validity) & UAE eVisa", reason: "Mandatory immigration check at DXB T1/T3", essential: true },
          { name: "SPF 50+ broad-spectrum sunscreen", reason: "Essential protection against strong desert UV", essential: true },
          { name: "Prescription medications in original packaging", reason: "UAE has strict regulations on restricted medications", essential: true },
        ],
      },
      {
        category: "Destination Specials",
        items: [
          { name: "International credit/forex card (Zero forex markup)", reason: "Dubai is largely cashless; cards and Apple Pay work everywhere", essential: true },
          { name: "Modest cover-up for Grand Mosque visits", reason: "Abaya / scarf required for female visitors at mosques", essential: false },
        ],
      },
    ],
    travelTips: [
      { category: "Airport & Transit", tip: "Dubai International (DXB) Terminal 3 is connected directly to Dubai Metro Red Line. Trains run every 4 minutes into Downtown and Marina." },
      { category: "Local Transport", tip: "Purchase a Silver Nol Card at DXB metro station for seamless rides on metro, tram, buses, and water taxis. Careem & Dubai Taxi apps are fast and affordable." },
      { category: "Cultural Etiquette", tip: "Dress respectfully in public areas and government buildings. Always ask permission before photographing local residents. Alcohol is served in licensed venues." },
      { category: "Culinary Must-Try", tip: "Sample authentic Middle Eastern Shawarma at Al Mallah, fragrant Mandi at Maraheb, and camel milk gelato at Old Dubai souks." },
      { category: "Sightseeing Highlight", tip: "Book Burj Khalifa At The Top sunset slot in advance, take an Abra boat across Dubai Creek for 1 AED, and visit the Museum of the Future." },
    ],
    airlineBaggageNotice: {
      cabinAllowance: "1 × 7kg cabin bag + 1 personal laptop bag / briefcase",
      checkedAllowance: "Economy: 2 × 23kg | Business: 2 × 32kg bags | First: 3 × 32kg",
      liquidsRule: "100ml liquid limits strictly enforced at DXB transit security gates",
      prohibitedItems: ["Unprescribed pain medications / CBD products", "Power banks in checked bags", "Poppy seeds"],
    },
  },
  LHR: {
    destination: {
      city: "London",
      country: "United Kingdom",
      code: "LHR",
      tagline: "Global Heritage, Royal Royalty & Iconic Culture",
      timezone: "BST / GMT (UTC+1)",
      currency: "GBP (£)",
      emergencyNumber: "999 or 112",
    },
    weatherOutlook: {
      season: "Temperate Maritime",
      tempSummary: "15°C – 23°C (Mild with Variable Cloudiness)",
      highC: 23,
      lowC: 14,
      condition: "Partly Cloudy with Intermittent Light Showers",
      rainfallAdvice: "Always keep a compact umbrella or trench coat handy.",
      uvIndex: "Moderate (4-5)",
    },
    packingChecklist: [
      {
        category: "Clothing & Footwear",
        items: [
          { name: "Layering garments (t-shirts, cardigan, trench coat)", reason: "Rapidly shifting British weather throughout the day", essential: true },
          { name: "Sturdy waterproof walking shoes / boots", reason: "London requires 10,000–18,000 steps daily on historic cobblestones", essential: true },
          { name: "Wind-resistant compact umbrella", reason: "Sudden London drizzle and breezes", essential: true },
          { name: "Smart casual evening outfit", reason: "West End theatre and upscale restaurant dining", essential: false },
        ],
      },
      {
        category: "Electronics & Tech",
        items: [
          { name: "Type G UK 3-pin plug adapter", reason: "Standard UK wall sockets (230V)", essential: true },
          { name: "Contactless bank card / Apple Pay setup", reason: "London Tube and buses are 100% cashless with tap-to-pay", essential: true },
          { name: "E-Reader / noise-cancelling headphones", reason: "Ideal for long flights (DEL→LHR 9h) and tube commutes", essential: false },
        ],
      },
      {
        category: "Health & Documents",
        items: [
          { name: "UK Standard Visitor Visa / eTA & Passport", reason: "Required at UK Border Force e-Gates at Terminal 2/3/5", essential: true },
          { name: "Travel insurance policy card", reason: "Access to private healthcare if required", essential: true },
          { name: "Lip balm & moisturizer", reason: "Dry cabin air and cool outdoor breezes", essential: false },
        ],
      },
      {
        category: "Destination Specials",
        items: [
          { name: "Reusable water bottle", reason: "Refillable for free across London's tap water stations", essential: true },
          { name: "West End theatre pre-bookings", reason: "Popular shows sell out weeks in advance", essential: false },
        ],
      },
    ],
    travelTips: [
      { category: "Airport & Transit", tip: "From Heathrow, the Elizabeth Line takes you into Central London (Paddington / Tottenham Court Rd) in just 30 minutes for £13.30 without high Heathrow Express premiums." },
      { category: "Local Transport", tip: "Simply tap your contactless bank card or phone on yellow readers when entering and exiting the Tube. Daily fare caps automatically apply." },
      { category: "Cultural Etiquette", tip: "Always stand on the RIGHT side of the escalator on the London Underground. Say 'cheers' or 'please/thank you' habitually." },
      { category: "Culinary Must-Try", tip: "Classic Sunday Roast with Yorkshire pudding at a historic pub, Afternoon Tea near Covent Garden, and authentic Borough Market street food." },
      { category: "Sightseeing Highlight", tip: "Most major national museums (British Museum, Natural History, Tate Modern, V&A) offer completely free admission." },
    ],
    airlineBaggageNotice: {
      cabinAllowance: "1 × 7kg cabin bag + 1 personal bag",
      checkedAllowance: "Economy: 2 × 23kg | Business: 2 × 32kg",
      liquidsRule: "100ml liquid limits in clear bag strictly enforced",
      prohibitedItems: ["Meat/dairy products from non-EU countries", "Lithium battery packs in hold luggage"],
    },
  },
  SIN: {
    destination: {
      city: "Singapore",
      country: "Singapore",
      code: "SIN",
      tagline: "The Lion City, Garden in a Metropolis & Culinary Capital",
      timezone: "SGT (UTC+8)",
      currency: "SGD (S$)",
      emergencyNumber: "999 (Police) / 995 (Ambulance)",
    },
    weatherOutlook: {
      season: "Tropical Rainforest",
      tempSummary: "26°C – 32°C (Warm, Humid & Afternoon Showers)",
      highC: 32,
      lowC: 25,
      condition: "Tropical Sun with Brief Afternoon Thunderstorms",
      rainfallAdvice: "Short tropical showers are common between 2 PM and 5 PM. Underpasses and malls provide continuous sheltered walking.",
      uvIndex: "Very High (9-10)",
    },
    packingChecklist: [
      {
        category: "Clothing & Footwear",
        items: [
          { name: "Lightweight ultra-breathable moisture-wicking clothes", reason: "Year-round tropical humidity (75-90%)", essential: true },
          { name: "Cardigan or light hoodie", reason: "Indoor shopping malls, MRT, and cinemas have icy air conditioning", essential: true },
          { name: "Comfortable cushioned walking shoes / slides", reason: "Navigating Gardens by the Bay, Marina Bay, and Sentosa", essential: true },
        ],
      },
      {
        category: "Electronics & Tech",
        items: [
          { name: "Type G UK 3-pin plug adapter", reason: "Standard Singapore wall sockets (230V)", essential: true },
          { name: "Portable mini USB fan", reason: "Instant relief while walking through outdoor botanical gardens", essential: false },
          { name: "Power bank (<20,000mAh in cabin bag)", reason: "Long photo sessions at Jewel Changi and Supertree Grove", essential: true },
        ],
      },
      {
        category: "Health & Documents",
        items: [
          { name: "Singapore Electronic Arrival Card (SGAC)", reason: "Submit online within 3 days prior to arrival for fast automated clearance", essential: true },
          { name: "Hydrating mist & sunscreen", reason: "Sun protection across outdoor attractions", essential: true },
          { name: "Mosquito repellent patch", reason: "Helpful during nature reserve walks in MacRitchie or Botanic Gardens", essential: false },
        ],
      },
      {
        category: "Destination Specials",
        items: [
          { name: "Small cash (SGD 10-20 notes) for Hawker Centres", reason: "Hawkers accept cash or PayNow; credit cards have minimum limits", essential: true },
          { name: "Swimwear for hotel infinity pools", reason: "Rooftop pools are a quintessential Singapore experience", essential: false },
        ],
      },
    ],
    travelTips: [
      { category: "Airport & Transit", tip: "Changi Airport (SIN) is rated #1 globally. Arrive early to explore Jewel Changi's 40-meter Rain Vortex, Canopy Park, and butterfly garden before boarding." },
      { category: "Local Transport", tip: "Simply tap your contactless Visa/Mastercard on the MRT fare gates. The train from Changi to downtown takes only 35 minutes." },
      { category: "Cultural Etiquette", tip: "Chewing gum is strictly prohibited. Don't litter or eat/drink on MRT trains (hefty fines). 'Choping' seats with tissue packets at hawker centres is common practice." },
      { category: "Culinary Must-Try", tip: "Tian Tian Hainanese Chicken Rice at Maxwell Food Centre, Chili Crab with fried mantou at Jumbo Seafood, and Laksa at Katong." },
      { category: "Sightseeing Highlight", tip: "Watch the free Garden Rhapsody light show at Supertree Grove at 19:45 and 20:45 daily." },
    ],
    airlineBaggageNotice: {
      cabinAllowance: "1 × 7kg cabin bag + 1 handbag/briefcase",
      checkedAllowance: "Economy: 1 × 23kg | Business: 2 × 32kg",
      liquidsRule: "100ml liquid limits applied at gate-hold rooms in Changi T1-T3",
      prohibitedItems: ["Chewing gum in commercial quantities", "E-cigarettes & vapes (banned in Singapore)", "Power banks in hold"],
    },
  },
  CDG: {
    destination: {
      city: "Paris",
      country: "France",
      code: "CDG",
      tagline: "The City of Light, Haute Couture & Architectural Romance",
      timezone: "CEST (UTC+2)",
      currency: "EUR (€)",
      emergencyNumber: "112 (European emergency) / 17 (Police)",
    },
    weatherOutlook: {
      season: "Pleasant Summer / Late Spring",
      tempSummary: "18°C – 26°C (Sunny & Balmy)",
      highC: 26,
      lowC: 16,
      condition: "Clear Blue Skies with Mild Evening Breeze",
      rainfallAdvice: "Low precipitation. Occasional brief late-afternoon shower.",
      uvIndex: "Moderate to High (6)",
    },
    packingChecklist: [
      {
        category: "Clothing & Footwear",
        items: [
          { name: "Chic, well-fitted smart casual wardrobe", reason: "Parisians dress elegantly; avoid gymwear in upscale cafes/bistros", essential: true },
          { name: "Broken-in leather sneakers or comfortable flats", reason: "Parisian cobblestones and extensive museum walks", essential: true },
          { name: "Light blazer, denim jacket, or trench", reason: "Evenings along the Seine can get delightfully breezy", essential: true },
          { name: "Silk scarf / lightweight accessory", reason: "Classic Parisian styling that elevates any travel outfit", essential: false },
        ],
      },
      {
        category: "Electronics & Tech",
        items: [
          { name: "Type C/E European round 2-pin plug adapter", reason: "Standard French wall sockets (230V)", essential: true },
          { name: "Offline Google Maps / Citymapper download", reason: "Navigating the Paris Métro network effortlessly", essential: true },
          { name: "Anti-theft crossbody bag or RFID wallet", reason: "Pickpocket prevention near Eiffel Tower, Louvre, and Gare du Nord", essential: true },
        ],
      },
      {
        category: "Health & Documents",
        items: [
          { name: "Schengen Visa & Passport (≥3 months beyond departure)", reason: "Mandatory entry documents for European borders", essential: true },
          { name: "Pre-booked museum timeslot tickets (Louvre / Orsay)", reason: "Walk-in queues can exceed 2.5 hours in peak season", essential: true },
          { name: "Blister prevention tape / Compeed pads", reason: "Crucial for long walking days across Montmartre and Le Marais", essential: false },
        ],
      },
      {
        category: "Destination Specials",
        items: [
          { name: "Reusable tote bag", reason: "French bakeries and markets charge for plastic bags", essential: true },
          { name: "Basic French greeting knowledge (Bonjour, Merci, S'il vous plaît)", reason: "Greeting the shopkeeper with 'Bonjour' is mandatory etiquette", essential: true },
        ],
      },
    ],
    travelTips: [
      { category: "Airport & Transit", tip: "From Paris Charles de Gaulle (CDG), take the RER B train into Châtelet-Les Halles in 35 min (€11.80) or book a flat-rate official taxi (€56 to Right Bank, €65 to Left Bank)." },
      { category: "Local Transport", tip: "Download the 'Île-de-France Mobilités' app to buy Navigo Easy digital metro tickets on your phone for unlimited convenient rides." },
      { category: "Cultural Etiquette", tip: "Always say 'Bonjour Madame/Monsieur' when entering any shop or cafe. Tipping is not required as 'service compris' is included, but rounding up 1-2€ is appreciated." },
      { category: "Culinary Must-Try", tip: "Warm butter croissant at a traditional boulangerie, duck confit with pomme sarladaise at a Latin Quarter bistro, and Berthillon ice cream on Île Saint-Louis." },
      { category: "Sightseeing Highlight", tip: "Watch the Eiffel Tower sparkle for 5 minutes on the hour every hour from dusk until 23:00 from the Trocadéro terrace." },
    ],
    airlineBaggageNotice: {
      cabinAllowance: "1 × 7kg cabin bag + 1 personal item",
      checkedAllowance: "Economy: 1 × 23kg | Business: 2 × 32kg",
      liquidsRule: "100ml liquid containers in transparent 1-liter bag",
      prohibitedItems: ["Counterfeit luxury items (strict French customs fines)", "Power banks in checked bags"],
    },
  },
};

// POST /api/ai/travel-tips
aiRouter.post("/travel-tips", async (req, res) => {
  const {
    destinationCity,
    destinationCode = "BOM",
    originCity = "New Delhi",
    originCode = "DEL",
    travelDate = "15 Jun 2026",
    cabinClass = "Economy",
    tripDuration = "4-7 days",
    purpose = "Leisure",
    customNotes = "",
  } = req.body || {};

  const destKey = (destinationCode || "").toUpperCase().trim();
  const client = getGeminiClient();

  if (client) {
    try {
      const prompt = `You are SkyWay Airlines' Chief AI Travel Advisor & Packing Concierge.
Generate comprehensive, highly tailored, realistic destination advice and packing recommendations for a passenger traveling with SkyWay Airlines.

Passenger & Trip Details:
- Flight Route: ${originCity} (${originCode}) to ${destinationCity || destKey} (${destKey})
- Travel Date / Season: ${travelDate}
- Cabin Class: ${cabinClass}
- Trip Duration: ${tripDuration}
- Purpose of Trip: ${purpose}
${customNotes ? `- Special Passenger Notes / Requests: ${customNotes}` : ""}

Return a strictly valid JSON response matching this schema:
{
  "destination": {
    "city": "string",
    "country": "string",
    "code": "string",
    "tagline": "string",
    "timezone": "string",
    "currency": "string",
    "emergencyNumber": "string"
  },
  "weatherOutlook": {
    "season": "string",
    "tempSummary": "string (e.g. '28°C – 33°C (Sunny & Humid)')",
    "highC": 32,
    "lowC": 26,
    "condition": "string",
    "rainfallAdvice": "string",
    "uvIndex": "string (e.g. 'High (7-8)')"
  },
  "packingChecklist": [
    {
      "category": "Clothing & Footwear" | "Electronics & Tech" | "Health & Documents" | "Destination Specials",
      "items": [
        {
          "name": "string",
          "reason": "string",
          "essential": true | false
        }
      ]
    }
  ],
  "travelTips": [
    {
      "category": "Airport & Transit" | "Local Transport" | "Cultural Etiquette" | "Culinary Must-Try" | "Sightseeing Highlight",
      "tip": "string"
    }
  ],
  "airlineBaggageNotice": {
    "cabinAllowance": "string",
    "checkedAllowance": "string",
    "liquidsRule": "string",
    "prohibitedItems": ["string", "string", "string"]
  }
}

Ensure all tips are practical, specific to ${destinationCity || destKey}, tailored to the season of ${travelDate}, accurate for airline security rules, and helpful for a traveler flying ${cabinClass} class on SkyWay. Return ONLY the raw JSON object without backticks or markdown fences.`;

      const response = await client.models.generateContent({
        model: "gemini-3.7-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        config: {
          responseMimeType: "application/json",
        }
      });

      let parsed: any = null;
      const text = response.text || "";
      try {
        const clean = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
        parsed = JSON.parse(clean);
      } catch (jsonErr) {
        console.warn("Failed to parse Gemini JSON output directly, attempting fallback cleanup:", jsonErr);
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        }
      }

      if (parsed && parsed.destination && parsed.packingChecklist) {
        return res.json({
          success: true,
          source: "gemini-3.7-flash",
          data: parsed,
        });
      }
    } catch (err: any) {
      console.warn("Gemini generation failed for travel tips, falling back to curated intelligence:", err?.message);
    }
  }

  // Fallback to rich curated destination intelligence
  const fallback = CURATED_DESTINATIONS[destKey] || CURATED_DESTINATIONS["BOM"];
  // Customize fallback with incoming params
  const customizedFallback = JSON.parse(JSON.stringify(fallback));
  if (destinationCity && !CURATED_DESTINATIONS[destKey]) {
    customizedFallback.destination.city = destinationCity;
    customizedFallback.destination.code = destKey;
  }
  if (cabinClass.toLowerCase().includes("business")) {
    customizedFallback.airlineBaggageNotice.checkedAllowance = "2 × 32kg bags + Priority Baggage Handling";
    customizedFallback.airlineBaggageNotice.cabinAllowance = "2 × 12kg cabin bags + Executive Briefcase";
  }

  return res.json({
    success: true,
    source: "curated-intelligence",
    data: customizedFallback,
  });
});

