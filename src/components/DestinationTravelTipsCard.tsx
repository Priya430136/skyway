import React, { useState, useEffect, useCallback, useId } from "react";
import {
  Sparkles,
  CloudRain,
  Sun,
  Wind,
  Luggage,
  CheckSquare,
  Square,
  Compass,
  MapPin,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Thermometer,
  Zap,
  Shirt,
  Plug,
  FileCheck,
  Plane,
  HeartHandshake,
  Utensils,
  Landmark,
  Train,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface DestinationData {
  city: string;
  country: string;
  code: string;
  tagline: string;
  timezone: string;
  currency: string;
  emergencyNumber: string;
}

export interface WeatherOutlook {
  season: string;
  tempSummary: string;
  highC: number;
  lowC: number;
  condition: string;
  rainfallAdvice: string;
  uvIndex: string;
}

export interface PackingItem {
  id?: string;
  name: string;
  reason: string;
  essential: boolean;
  packed?: boolean;
}

export interface PackingCategory {
  category: string;
  items: PackingItem[];
}

export interface TravelTip {
  category: string;
  tip: string;
}

export interface AirlineBaggageNotice {
  cabinAllowance: string;
  checkedAllowance: string;
  liquidsRule: string;
  prohibitedItems: string[];
}

export interface TravelTipsResponse {
  destination: DestinationData;
  weatherOutlook: WeatherOutlook;
  packingChecklist: PackingCategory[];
  travelTips: TravelTip[];
  airlineBaggageNotice: AirlineBaggageNotice;
}

export interface DestinationTravelTipsCardProps {
  upcomingFlights?: Array<{
    pnr: string;
    flightNumber: string;
    originCity: string;
    originCode: string;
    destinationCity: string;
    destinationCode: string;
    departureDate: string;
    cabinClass: string;
  }>;
  initialDestinationCode?: string;
  initialDestinationCity?: string;
  className?: string;
}

// Built-in rich destination knowledge base for instant resilience
const CURATED_DESTINATIONS: Record<string, TravelTipsResponse> = {
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
      season: "Tropical Coastal Breeze",
      tempSummary: "28°C – 33°C (Warm & Humid)",
      highC: 33,
      lowC: 27,
      condition: "Coastal sunshine with gentle sea breeze",
      rainfallAdvice: "Occasional brief coastal showers; light waterproof jacket recommended.",
      uvIndex: "High (7-8)",
    },
    packingChecklist: [
      {
        category: "Clothing & Footwear",
        items: [
          { name: "Light breathable cotton or linen shirts", reason: "High coastal humidity year-round", essential: true },
          { name: "Comfortable leather sneakers or walking sandals", reason: "Exploring Marine Drive, Colaba, and Fort heritage quarter", essential: true },
          { name: "Light blazer or cardigan", reason: "Over-cooled restaurants, five-star lounges, and cabs", essential: false },
          { name: "Compact travel umbrella / rain shell", reason: "Sudden coastal passing showers", essential: true },
        ],
      },
      {
        category: "Electronics & Tech",
        items: [
          { name: "Type C/D 3-pin power adapter (230V)", reason: "Standard Indian electrical sockets", essential: true },
          { name: "Power bank (Carry-on only, <20,000mAh)", reason: "Airline security strictly prohibits power banks in checked baggage", essential: true },
          { name: "Noise-cancelling headphones", reason: "Peaceful commute across vibrant city streets and local taxis", essential: false },
        ],
      },
      {
        category: "Health & Documents",
        items: [
          { name: "Government ID / Passport / e-Boarding Pass", reason: "Mandatory for airport security entry at BOM Terminal 2", essential: true },
          { name: "Electrolyte hydration tablets & sunscreen (SPF 50+)", reason: "Prevent dehydration during outdoor walking tours", essential: true },
          { name: "Hand sanitizer & wet wipes", reason: "Convenient for street food hopping in Bandra and Chowpatty", essential: false },
        ],
      },
      {
        category: "Destination Specials",
        items: [
          { name: "M-Indicator or Chalo App download", reason: "Best mobile apps for local suburban rail and metro transit", essential: true },
          { name: "Small cash denominations (₹100/₹200/₹500)", reason: "Accepted universally alongside UPI QR payments", essential: true },
        ],
      },
    ],
    travelTips: [
      { category: "Airport & Transit", tip: "Mumbai T2 is 40–60 mins from South Mumbai via the scenic Bandra-Worli Sea Link. Pre-paid airport cabs (Meru/Uber) operate from Level P4." },
      { category: "Local Transport", tip: "The newly opened Aqua Line 3 metro connects CSMI Airport directly to BKC and South Mumbai in air-conditioned comfort." },
      { category: "Cultural Etiquette", tip: "Remove footwear before entering places of worship. Dress respectfully when visiting historic temples and religious heritage sites." },
      { category: "Culinary Must-Try", tip: "Fresh vada pav at Shivaji Park, buttery pav bhaji at Sardar Refreshments, and coastal butter garlic crab at Trishna or Mahesh Lunch Home." },
      { category: "Sightseeing Highlight", tip: "Sunset promenade along Marine Drive ('Queen's Necklace') followed by heritage architecture walks in Kala Ghoda." },
    ],
    airlineBaggageNotice: {
      cabinAllowance: "1 × 7kg cabin bag + 1 personal item (laptop bag/purse)",
      checkedAllowance: "Economy: 1 × 23kg | Business: 2 × 32kg",
      liquidsRule: "Max 100ml per container in a clear 1-liter bag for security",
      prohibitedItems: ["Power banks in checked luggage", "Loose lithium-ion batteries", "E-cigarettes / Vapes (Strictly banned in India)"],
    },
  },

  DEL: {
    destination: {
      city: "New Delhi",
      country: "India",
      code: "DEL",
      tagline: "Heart of India & Historic Capital of Monuments",
      timezone: "IST (UTC+5:30)",
      currency: "INR (₹)",
      emergencyNumber: "112",
    },
    weatherOutlook: {
      season: "Sunny & Warm",
      tempSummary: "26°C – 36°C (Bright & Dry)",
      highC: 36,
      lowC: 25,
      condition: "Clear skies and abundant sunshine",
      rainfallAdvice: "Very low rainfall expected. Focus on sun and heat protection.",
      uvIndex: "Very High (8-9)",
    },
    packingChecklist: [
      {
        category: "Clothing & Footwear",
        items: [
          { name: "Breathable natural fabric shirts & trousers", reason: "Warm daytime temperatures", essential: true },
          { name: "Comfortable cushioned walking shoes", reason: "Expansive grounds at Red Fort, Qutub Minar, and Humayun's Tomb", essential: true },
          { name: "Light scarf or dupatta", reason: "Head covering required when entering Gurudwara Bangla Sahib or Jama Masjid", essential: true },
        ],
      },
      {
        category: "Electronics & Tech",
        items: [
          { name: "Type C/D power adapter", reason: "Standard Indian sockets (230V)", essential: true },
          { name: "High-capacity power bank (<20,000mAh)", reason: "Carry-on only; essential for full-day sightseeing", essential: true },
        ],
      },
      {
        category: "Health & Documents",
        items: [
          { name: "Valid Photo ID / Passport & SkyWay boarding pass", reason: "Entry checkpoint verification at DEL Terminal 3", essential: true },
          { name: "High-SPF sunscreen, sunglasses & wide-brim hat", reason: "Sun protection during monument explorations", essential: true },
          { name: "Personal prescription medications with doctor note", reason: "Smoother airport security verification", essential: true },
        ],
      },
      {
        category: "Destination Specials",
        items: [
          { name: "Delhi Metro Smart Card / DMRC App", reason: "World-class metro avoiding congested traffic arteries", essential: true },
        ],
      },
    ],
    travelTips: [
      { category: "Airport & Transit", tip: "Take the high-speed Delhi Airport Express Metro from T3 to New Delhi Station in just 19 minutes (₹60)." },
      { category: "Local Transport", tip: "Delhi Metro is the cleanest, fastest transit network in the National Capital Region. Ride in air-conditioned comfort." },
      { category: "Cultural Etiquette", tip: "Dress modestly covering shoulders and knees when visiting religious monuments." },
      { category: "Culinary Must-Try", tip: "Authentic butter chicken and dal makhani at Pandara Road, chole bhature at Sita Ram Diwan Chand, and street snacks in Old Delhi." },
      { category: "Sightseeing Highlight", tip: "Sunrise at Humayun's Tomb gardens and an evening stroll around India Gate and Kartavya Path." },
    ],
    airlineBaggageNotice: {
      cabinAllowance: "1 × 7kg cabin bag + 1 personal laptop bag",
      checkedAllowance: "Economy: 1 × 23kg | Business: 2 × 32kg",
      liquidsRule: "100ml liquid container limit in hand luggage",
      prohibitedItems: ["E-cigarettes (prohibited by DGCA)", "Power banks in checked bags", "Sharp metallic objects"],
    },
  },

  DXB: {
    destination: {
      city: "Dubai",
      country: "United Arab Emirates",
      code: "DXB",
      tagline: "The City of Gold, Innovation & Global Luxury",
      timezone: "GST (UTC+4)",
      currency: "AED (د.إ)",
      emergencyNumber: "999 (Police) / 998 (Ambulance)",
    },
    weatherOutlook: {
      season: "Sunny & Warm",
      tempSummary: "30°C – 38°C (Desert Sunshine)",
      highC: 38,
      lowC: 28,
      condition: "Clear azure skies with sunny desert radiance",
      rainfallAdvice: "Negligible rain expected. Maximize indoor hydration.",
      uvIndex: "Extreme (9-10)",
    },
    packingChecklist: [
      {
        category: "Clothing & Footwear",
        items: [
          { name: "Smart casual resortwear & lightweight fabrics", reason: "Dubai's upscale dining and air-conditioned luxury shopping malls", essential: true },
          { name: "Modest attire for heritage districts & mosques", reason: "Covering knees and shoulders is required at Grand Mosque and Old Souks", essential: true },
          { name: "Designer sunglasses with UV400 protection", reason: "Intense daytime desert reflection", essential: true },
          { name: "Light linen jacket or pashmina", reason: "Malls and indoor attractions maintain low air-conditioned temperatures", essential: false },
        ],
      },
      {
        category: "Electronics & Tech",
        items: [
          { name: "Type G UK-style 3-pin rectangular plug adapter", reason: "UAE standard wall outlets (220-240V)", essential: true },
          { name: "Fast charging portable battery (Carry-on only)", reason: "For photography at Burj Khalifa, Museum of the Future & Miracle Garden", essential: true },
        ],
      },
      {
        category: "Health & Documents",
        items: [
          { name: "Passport with ≥6 months validity & UAE Visa copy", reason: "Mandatory entry documents for UAE immigration", essential: true },
          { name: "Hydrating face mist & SPF 50+ mineral sunscreen", reason: "Desert heat skin protection", essential: true },
        ],
      },
      {
        category: "Destination Specials",
        items: [
          { name: "Nol Silver Card", reason: "Universal contactless transit card for Dubai Metro, Tram, and Water Bus", essential: true },
        ],
      },
    ],
    travelTips: [
      { category: "Airport & Transit", tip: "Dubai International (DXB) Terminal 1 & 3 are directly connected to the Red Metro line. Red line trains reach Downtown Dubai in 22 mins." },
      { category: "Local Transport", tip: "Careem and Uber are widely available, or flag official beige Dubai RTA taxis which accept credit cards and Apple Pay." },
      { category: "Cultural Etiquette", tip: "Respect local traditions: modest dress in public government buildings and religious sites; ask permission before photographing people." },
      { category: "Culinary Must-Try", tip: "Emirati machboos, freshly grilled sea bass at Bu Qtair near Jumeirah beach, and pistachio kunafa in Deira." },
      { category: "Sightseeing Highlight", tip: "Observation deck at Burj Khalifa Level 148, evening Dubai Fountain show, and sunset desert safari." },
    ],
    airlineBaggageNotice: {
      cabinAllowance: "1 × 7kg cabin bag + 1 slim briefcase/handbag",
      checkedAllowance: "Economy: 1 × 23kg | Business: 2 × 32kg",
      liquidsRule: "100ml containers placed in a 1L resealable clear pouch",
      prohibitedItems: ["Poppy seeds (strictly banned by UAE customs)", "CBD/Cannabis derivatives", "Drones without GCAA permit"],
    },
  },

  LHR: {
    destination: {
      city: "London",
      country: "United Kingdom",
      code: "LHR",
      tagline: "Historic Royalty, World-Class Arts & Vibrant Culture",
      timezone: "BST (UTC+1)",
      currency: "GBP (£)",
      emergencyNumber: "999 or 112",
    },
    weatherOutlook: {
      season: "Mild Maritime",
      tempSummary: "15°C – 22°C (Pleasantly Temperate)",
      highC: 22,
      lowC: 13,
      condition: "Partly cloudy with intermittent sunshine",
      rainfallAdvice: "Occasional passing drizzle; pack a compact windproof umbrella.",
      uvIndex: "Moderate (4-5)",
    },
    packingChecklist: [
      {
        category: "Clothing & Footwear",
        items: [
          { name: "Layered clothing (trench coat, sweaters, tees)", reason: "London weather changes quickly between sun and breezy showers", essential: true },
          { name: "Comfortable waterproof walking shoes / boots", reason: "Extensive walking across London's historic cobblestones and parks", essential: true },
          { name: "Smart casual evening outfit", reason: "West End theatre and fine dining dress codes", essential: false },
        ],
      },
      {
        category: "Electronics & Tech",
        items: [
          { name: "Type G UK 3-pin fused rectangular plug adapter", reason: "Standard UK electrical wall sockets (230V)", essential: true },
          { name: "Contactless Credit Card / Apple Pay setup", reason: "London Underground and buses are 100% cashless", essential: true },
        ],
      },
      {
        category: "Health & Documents",
        items: [
          { name: "Passport & UK Standard Visitor Visa / ETA", reason: "Required for UK Border Force e-Gates at LHR", essential: true },
          { name: "Travel insurance policy card", reason: "Medical coverage documentation", essential: true },
        ],
      },
      {
        category: "Destination Specials",
        items: [
          { name: "Citymapper App download", reason: "The gold standard for navigating the London Tube and bus routes", essential: true },
        ],
      },
    ],
    travelTips: [
      { category: "Airport & Transit", tip: "Elizabeth Line connects Heathrow directly to Central London (Paddington/Tottenham Court Rd) in 35 mins without express surcharges." },
      { category: "Local Transport", tip: "Simply tap your contactless bank card or smartphone on the yellow reader at any Tube gate; fares automatically cap daily." },
      { category: "Cultural Etiquette", tip: "Always stand on the right on Tube escalators and leave the left for walking." },
      { category: "Culinary Must-Try", tip: "Traditional afternoon tea at Fortnum & Mason, Sunday roast with Yorkshire pudding, and Borough Market gourmet food stalls." },
      { category: "Sightseeing Highlight", tip: "The British Museum (free entry), Tower Bridge glass walkway, and a stroll through Hyde Park." },
    ],
    airlineBaggageNotice: {
      cabinAllowance: "1 × 7kg cabin bag + 1 personal accessory",
      checkedAllowance: "Economy: 1 × 23kg | Business: 2 × 32kg",
      liquidsRule: "All liquids in containers ≤100ml in a clear plastic bag",
      prohibitedItems: ["Sharp scissors/blades >6cm", "Power banks in hold baggage", "Uncertified meat/dairy products from non-EU countries"],
    },
  },

  CDG: {
    destination: {
      city: "Paris",
      country: "France",
      code: "CDG",
      tagline: "The City of Light, Haute Couture & Gastronomy",
      timezone: "CEST (UTC+2)",
      currency: "EUR (€)",
      emergencyNumber: "112 (European Emergency) / 15 (SAMU)",
    },
    weatherOutlook: {
      season: "Pleasant Summer",
      tempSummary: "18°C – 26°C (Mild & Sunny)",
      highC: 26,
      lowC: 15,
      condition: "Clear skies with gentle afternoon breeze",
      rainfallAdvice: "Low probability of showers; light jacket handy for evening strolls along the Seine.",
      uvIndex: "Moderate to High (5-6)",
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

  JFK: {
    destination: {
      city: "New York City",
      country: "United States",
      code: "JFK",
      tagline: "The Empire City, Global Hub of Finance & Theater",
      timezone: "EDT (UTC-4)",
      currency: "USD ($)",
      emergencyNumber: "911",
    },
    weatherOutlook: {
      season: "Sunny & Energetic",
      tempSummary: "22°C – 29°C (Vibrant & Warm)",
      highC: 29,
      lowC: 19,
      condition: "Clear sunshine with skyscraper reflections",
      rainfallAdvice: "Occasional brief summer thunderstorms; carry light rain shell.",
      uvIndex: "High (7-8)",
    },
    packingChecklist: [
      {
        category: "Clothing & Footwear",
        items: [
          { name: "Comfortable high-support athletic walking shoes", reason: "NYC travelers easily average 15,000–20,000 steps per day", essential: true },
          { name: "Versatile stylish casual wear", reason: "Day-to-night transitions from Central Park to Broadway shows", essential: true },
          { name: "Light jacket / layer", reason: "Heavily air-conditioned subway cars and museums", essential: false },
        ],
      },
      {
        category: "Electronics & Tech",
        items: [
          { name: "Type A/B US 2/3-pin plug adapter (110-120V)", reason: "Standard US electrical sockets", essential: true },
          { name: "Heavy duty power bank", reason: "Navigation, photos, and OMNY contactless subway taps", essential: true },
        ],
      },
      {
        category: "Health & Documents",
        items: [
          { name: "Passport with approved ESTA or US B1/B2 Visa", reason: "Mandatory for US CBP entry processing", essential: true },
          { name: "Credit card with zero foreign transaction fees", reason: "NYC is virtually 100% cashless across all merchants", essential: true },
        ],
      },
      {
        category: "Destination Specials",
        items: [
          { name: "OMNY Contactless Transit Ready", reason: "Tap any credit card or Apple Pay directly at NYC subway turnstiles", essential: true },
        ],
      },
    ],
    travelTips: [
      { category: "Airport & Transit", tip: "From JFK, take the AirTrain to Jamaica Station ($8.50) then transfer to the Long Island Rail Road (LIRR) to Grand Central / Penn Station in 20 minutes." },
      { category: "Local Transport", tip: "OMNY automatic fare capping provides free unlimited rides after 12 taps in a 7-day period." },
      { category: "Cultural Etiquette", tip: "Standard restaurant tipping in New York is 18%–22% for full table service." },
      { category: "Culinary Must-Try", tip: "Classic NYC bagel with lox & schmear at Russ & Daughters, thin-crust pizza in Brooklyn, and pastrami on rye at Katz's Delicatessen." },
      { category: "Sightseeing Highlight", tip: "Walk the High Line elevated park to Hudson Yards, visit the Summit One Vanderbilt glass deck, and catch a Broadway show." },
    ],
    airlineBaggageNotice: {
      cabinAllowance: "1 × 7kg cabin bag + 1 personal bag",
      checkedAllowance: "Economy: 1 × 23kg | Business: 2 × 32kg",
      liquidsRule: "TSA 3-1-1 liquids rule (3.4oz / 100ml max per container)",
      prohibitedItems: ["Fresh fruits and agricultural products without USDA declaration", "Power banks in checked bags"],
    },
  },
};

// Smart dynamic fallback generator for any custom destination entered by user
function generateCustomDestinationIntelligence(city: string, code: string, cabin: string, style: string, duration: string): TravelTipsResponse {
  const cleanCity = city.trim() || "Destination";
  const cleanCode = (code.trim() || cleanCity.slice(0, 3)).toUpperCase();

  return {
    destination: {
      city: cleanCity,
      country: "International Hub",
      code: cleanCode,
      tagline: `Experience the vibrant culture and memorable landmarks of ${cleanCity}`,
      timezone: "Local Time (GMT)",
      currency: "Local Currency / Major Cards Accepted",
      emergencyNumber: "112 / 911",
    },
    weatherOutlook: {
      season: "Pleasant Travel Weather",
      tempSummary: "22°C – 28°C (Comfortable & Sunny)",
      highC: 28,
      lowC: 19,
      condition: "Clear skies with light pleasant breeze",
      rainfallAdvice: "Favorable conditions; carry a compact umbrella for peace of mind.",
      uvIndex: "Moderate (5-6)",
    },
    packingChecklist: [
      {
        category: "Clothing & Footwear",
        items: [
          { name: `Versatile ${style.toLowerCase()} wardrobe & breathable layers`, reason: `Tailored for your ${duration} stay in ${cleanCity}`, essential: true },
          { name: "Comfortable cushioned walking shoes", reason: `Navigating landmarks, city center, and transit hubs in ${cleanCity}`, essential: true },
          { name: "Light evening jacket or blazer", reason: "Air-conditioned fine dining, lounges, and evening strolls", essential: false },
          { name: "Smart casual dinner attire", reason: "Upscale dining and evening entertainment", essential: false },
        ],
      },
      {
        category: "Electronics & Tech",
        items: [
          { name: "Universal international travel power adapter", reason: "Compatible with all international wall socket variants", essential: true },
          { name: "High-capacity power bank (<20,000mAh)", reason: "Airport security mandate: Keep strictly in carry-on baggage", essential: true },
          { name: "Noise-cancelling headphones", reason: "Comfortable in-flight entertainment and travel relaxation", essential: false },
        ],
      },
      {
        category: "Health & Documents",
        items: [
          { name: "Valid Passport, Visas & SkyWay Boarding Pass", reason: `Mandatory international travel documents for ${cleanCity}`, essential: true },
          { name: "Travel insurance card & emergency contacts", reason: "Comprehensive medical and travel protection", essential: true },
          { name: "Personal medication with prescriptions", reason: "Clear airport customs verification", essential: true },
          { name: "SPF 50+ sunscreen & lip balm", reason: "Daily outdoor skin hydration and UV protection", essential: false },
        ],
      },
      {
        category: "Destination Specials",
        items: [
          { name: "Local offline maps & transit guide downloaded", reason: `Effortless navigation across ${cleanCity}`, essential: true },
          { name: "Contactless payment card with zero FX fees", reason: "Accepted seamlessly across shops, restaurants, and transit", essential: true },
        ],
      },
    ],
    travelTips: [
      { category: "Airport & Transit", tip: `SkyWay flights land at premier terminals in ${cleanCity}. Follow airport signage for licensed metered taxis or express rail links.` },
      { category: "Local Transport", tip: `Download local transit apps or purchase a rechargeable city transit pass for quick contactless rides across ${cleanCity}.` },
      { category: "Cultural Etiquette", tip: "A polite greeting in the local language is warmly appreciated by locals and hospitality staff." },
      { category: "Culinary Must-Try", tip: `Ask locals for authentic neighborhood bistros and historic food markets in ${cleanCity} to taste authentic regional specialties.` },
      { category: "Sightseeing Highlight", tip: `Book prime attraction tickets in advance online to skip peak queuing times at ${cleanCity}'s top heritage spots.` },
    ],
    airlineBaggageNotice: {
      cabinAllowance: cabin.toLowerCase().includes("business") ? "2 × 12kg cabin bags + 1 personal briefcase" : "1 × 7kg cabin bag + 1 personal accessory",
      checkedAllowance: cabin.toLowerCase().includes("business") ? "2 × 32kg checked bags (Priority baggage)" : "1 × 23kg checked bag (Economy standard)",
      liquidsRule: "100ml per container in a transparent 1-liter zip-lock bag",
      prohibitedItems: ["Power banks in checked bags", "Loose lithium batteries", "Flammable aerosols"],
    },
  };
}

export function DestinationTravelTipsCard({
  upcomingFlights = [
    {
      pnr: "SW8X4K",
      flightNumber: "SW-204",
      originCity: "New Delhi",
      originCode: "DEL",
      destinationCity: "Mumbai",
      destinationCode: "BOM",
      departureDate: "15 Jun 2026",
      cabinClass: "Economy",
    },
    {
      pnr: "SW9M2P",
      flightNumber: "SW-811",
      originCity: "Mumbai",
      originCode: "BOM",
      destinationCity: "Dubai",
      destinationCode: "DXB",
      departureDate: "28 Jun 2026",
      cabinClass: "Business",
    },
  ],
  initialDestinationCode = "BOM",
  initialDestinationCity = "Mumbai",
  className,
}: DestinationTravelTipsCardProps) {
  const compId = useId();

  // Selected Flight / Destination State
  const [selectedFlightIndex, setSelectedFlightIndex] = useState<number>(0);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customCity, setCustomCity] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [purpose, setPurpose] = useState<string>("Leisure");
  const [tripDuration, setTripDuration] = useState<string>("4-7 days");
  const [customNotes, setCustomNotes] = useState<string>("");

  // Loading & Data State
  const [isLoading, setIsLoading] = useState(false);
  const [aiSource, setAiSource] = useState<string>("SkyWay Curated Guide");

  const currentFlight = !isCustomMode && upcomingFlights[selectedFlightIndex] ? upcomingFlights[selectedFlightIndex] : null;

  // Active target destination info
  const activeDestCode = isCustomMode ? (customCode.toUpperCase() || "BOM") : (currentFlight?.destinationCode || initialDestinationCode);
  const activeDestCity = isCustomMode ? (customCity || "Mumbai") : (currentFlight?.destinationCity || initialDestinationCity);
  const activeOriginCity = currentFlight?.originCity || "New Delhi";
  const activeOriginCode = currentFlight?.originCode || "DEL";
  const activeDate = currentFlight?.departureDate || "15 Jun 2026";
  const activeCabin = currentFlight?.cabinClass || "Economy";

  // Initial tips data resolved immediately from curated dataset
  const [tipsData, setTipsData] = useState<TravelTipsResponse>(() => {
    const key = (activeDestCode || "BOM").toUpperCase();
    return CURATED_DESTINATIONS[key] || generateCustomDestinationIntelligence(activeDestCity, activeDestCode, activeCabin, purpose, tripDuration);
  });

  const [packedMap, setPackedMap] = useState<Record<string, boolean>>({});
  const [customAddedItems, setCustomAddedItems] = useState<PackingItem[]>([]);
  const [newCustomItemText, setNewCustomItemText] = useState("");
  const [copied, setCopied] = useState(false);

  // Fetch travel tips from server with graceful silent fallback
  const fetchTravelTips = useCallback(
    async (targetCity?: string, targetCode?: string, explicitUserTrigger = false) => {
      const destCity = targetCity || activeDestCity;
      const destCode = (targetCode || activeDestCode || "BOM").toUpperCase();

      // Immediately set curated data to avoid blank loading states
      const cached = CURATED_DESTINATIONS[destCode] || generateCustomDestinationIntelligence(destCity, destCode, activeCabin, purpose, tripDuration);
      setTipsData(cached);

      setIsLoading(true);
      try {
        const response = await fetch("/api/ai/travel-tips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destinationCity: destCity,
            destinationCode: destCode,
            originCity: activeOriginCity,
            originCode: activeOriginCode,
            travelDate: activeDate,
            cabinClass: activeCabin,
            tripDuration,
            purpose,
            customNotes,
          }),
        });

        if (response.ok) {
          const res = await response.json();
          if (res.success && res.data) {
            setTipsData(res.data);
            setAiSource(res.source === "gemini-3.7-flash" ? "Live Gemini 3.7 AI" : "SkyWay Intelligence");
            if (explicitUserTrigger) {
              toast.success(`Generated tailored AI travel guide for ${destCity}!`);
            }
            return;
          }
        }
      } catch {
        // Silently use cached/curated intelligence without annoying toasts
      } finally {
        setIsLoading(false);
      }

      setAiSource("SkyWay Curated Intelligence");
      if (explicitUserTrigger) {
        toast.info(`Loaded curated destination intelligence for ${destCity}.`);
      }
    },
    [
      activeDestCity,
      activeDestCode,
      activeOriginCity,
      activeOriginCode,
      activeDate,
      activeCabin,
      tripDuration,
      purpose,
      customNotes,
    ]
  );

  // Update curated guide when selected flight or destination changes
  useEffect(() => {
    const destCode = (activeDestCode || "BOM").toUpperCase();
    const resolved = CURATED_DESTINATIONS[destCode] || generateCustomDestinationIntelligence(activeDestCity, destCode, activeCabin, purpose, tripDuration);
    setTipsData(resolved);
  }, [activeDestCode, activeDestCity, activeCabin, purpose, tripDuration]);

  // Toggle item packed without triggering any network calls
  const togglePacked = (itemName: string) => {
    setPackedMap((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  // Add custom user item
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomItemText.trim()) return;
    const newItem: PackingItem = {
      name: newCustomItemText.trim(),
      reason: "User personal essential",
      essential: true,
      packed: false,
    };
    setCustomAddedItems((prev) => [...prev, newItem]);
    setPackedMap((prev) => ({ ...prev, [newItem.name]: false }));
    setNewCustomItemText("");
    toast.success(`Added "${newItem.name}" to your packing checklist.`);
  };

  // Remove custom item
  const removeCustomItem = (name: string) => {
    setCustomAddedItems((prev) => prev.filter((i) => i.name !== name));
  };

  // Checklist stats
  const allItems: PackingItem[] = [
    ...(tipsData?.packingChecklist?.flatMap((cat) => cat.items) || []),
    ...customAddedItems,
  ];
  const totalItemsCount = allItems.length;
  const packedItemsCount = allItems.filter((item) => packedMap[item.name]).length;
  const packingProgressPercent = totalItemsCount > 0 ? Math.round((packedItemsCount / totalItemsCount) * 100) : 0;

  // Copy checklist to clipboard
  const handleCopyChecklist = () => {
    if (!tipsData) return;
    const lines = [
      `✈️ SkyWay AI Packing List for ${tipsData.destination.city} (${tipsData.destination.code})`,
      `📅 Travel Date: ${activeDate} | Purpose: ${purpose}`,
      `🌤️ Weather: ${tipsData.weatherOutlook.tempSummary} - ${tipsData.weatherOutlook.condition}`,
      "",
      "--- PACKING CHECKLIST ---",
    ];

    tipsData.packingChecklist?.forEach((cat) => {
      lines.push(`\n[${cat.category}]`);
      cat.items.forEach((it) => {
        const checkMark = packedMap[it.name] ? "[x]" : "[ ]";
        lines.push(`${checkMark} ${it.name} (${it.reason})`);
      });
    });

    if (customAddedItems.length > 0) {
      lines.push("\n[Personal Additions]");
      customAddedItems.forEach((it) => {
        const checkMark = packedMap[it.name] ? "[x]" : "[ ]";
        lines.push(`${checkMark} ${it.name}`);
      });
    }

    lines.push("\n--- LOCAL TIPS ---");
    tipsData.travelTips?.forEach((t) => {
      lines.push(`• ${t.category}: ${t.tip}`);
    });

    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    toast.success("Packing checklist & travel tips copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const getCategoryIcon = (category: string) => {
    if (category.includes("Clothing") || category.includes("Footwear")) return Shirt;
    if (category.includes("Electronics") || category.includes("Tech")) return Plug;
    if (category.includes("Health") || category.includes("Documents")) return FileCheck;
    return Sparkles;
  };

  return (
    <div
      id={`travel-tips-${compId}`}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
        className
      )}
    >
      {/* 1. Header Banner & Destination Quick Selector */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-6 py-6 text-white sm:px-8">
        {/* Subtle decorative glows */}
        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 h-36 w-36 rounded-full bg-emerald-500/15 blur-2xl" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-400/20 px-3 py-1 text-xs font-bold tracking-wide text-blue-200 ring-1 ring-blue-400/30">
                <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
                SkyWay AI Travel Concierge
              </span>
              <Badge variant="outline" className="border-emerald-400/40 bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                {aiSource}
              </Badge>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchTravelTips(undefined, undefined, true)}
              disabled={isLoading}
              className="h-8 rounded-xl border-white/20 bg-white/10 text-xs font-bold text-white backdrop-blur-sm hover:bg-white/20"
            >
              <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", isLoading && "animate-spin")} />
              {isLoading ? "Consulting AI..." : "Refresh Insights"}
            </Button>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                Destination Intelligence & Smart Packing Guide
              </h2>
              <p className="mt-1 text-xs text-blue-200 sm:text-sm">
                Real-time weather forecast, tailored wardrobe essentials, airline security regulations, and local customs
              </p>
            </div>

            {/* Destination Selector Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-black/30 p-1.5 backdrop-blur-md">
              {upcomingFlights.map((flight, idx) => (
                <button
                  key={flight.pnr}
                  type="button"
                  onClick={() => {
                    setIsCustomMode(false);
                    setSelectedFlightIndex(idx);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
                    !isCustomMode && selectedFlightIndex === idx
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Plane className="h-3.5 w-3.5" />
                  <span>{flight.destinationCity} ({flight.destinationCode})</span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className={cn(
                  "flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
                  isCustomMode
                    ? "bg-amber-400 text-slate-950 shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                )}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Custom City</span>
              </button>
            </div>
          </div>

          {/* Custom Destination Search Bar if Custom Mode is Active */}
          {isCustomMode && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-md">
              <div className="flex-1 min-w-[180px]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Destination City</label>
                <Input
                  placeholder="e.g. Tokyo, London, Singapore, Paris, New York..."
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  className="mt-1 h-9 border-white/20 bg-black/40 text-xs text-white placeholder:text-slate-400"
                />
              </div>
              <div className="w-24">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Airport Code</label>
                <Input
                  placeholder="e.g. HND"
                  maxLength={3}
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  className="mt-1 h-9 border-white/20 bg-black/40 font-mono text-xs uppercase text-white placeholder:text-slate-400"
                />
              </div>
              <div className="self-end">
                <Button
                  onClick={() => fetchTravelTips(customCity, customCode, true)}
                  disabled={isLoading || !customCity}
                  className="h-9 rounded-xl bg-amber-400 text-xs font-bold text-slate-950 hover:bg-amber-300"
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Generate AI Advice
                </Button>
              </div>
            </div>
          )}

          {/* Trip Purpose & Duration Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-300">Travel Style:</span>
              {["Leisure", "Business", "Adventure", "Family", "Relaxed"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPurpose(p)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all",
                    purpose === p
                      ? "bg-white text-slate-900 shadow-sm"
                      : "bg-white/10 text-slate-300 hover:bg-white/20"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-300">Duration:</span>
              {["Weekend (2-3d)", "4-7 days", "10+ days"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setTripDuration(d)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all",
                    tripDuration === d
                      ? "bg-amber-400 text-slate-950 font-black"
                      : "bg-white/10 text-slate-300 hover:bg-white/20"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Destination Snapshot & Weather Live Card */}
      {tipsData && (
        <div className="border-b border-slate-100 bg-slate-50/70 p-6 dark:border-slate-800 dark:bg-slate-850/40 sm:p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Destination Info & Tagline (5 cols) */}
            <div className="space-y-3 lg:col-span-5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 font-bold text-white text-xs">
                  <MapPin className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {tipsData.destination.city}, {tipsData.destination.country}
                  </h3>
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                    IATA: {tipsData.destination.code} &bull; {tipsData.destination.timezone}
                  </span>
                </div>
              </div>

              <p className="text-xs italic text-slate-600 dark:text-slate-400">
                &ldquo;{tipsData.destination.tagline}&rdquo;
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Local Currency</span>
                  <p className="mt-0.5 font-bold text-slate-800 dark:text-slate-200">{tipsData.destination.currency}</p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Emergency Phone</span>
                  <p className="mt-0.5 font-bold text-slate-800 dark:text-slate-200">{tipsData.destination.emergencyNumber}</p>
                </div>
              </div>
            </div>

            {/* Right: Weather Forecast Summary (7 cols) */}
            <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-7">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Weather Outlook & Seasonal Forecast
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  {tipsData.weatherOutlook.season}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                    <Thermometer className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Temperature</span>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                      {tipsData.weatherOutlook.tempSummary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                    <CloudRain className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Precipitation</span>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                      {tipsData.weatherOutlook.rainfallAdvice.slice(0, 32)}...
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                    <Sun className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">UV Index</span>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                      {tipsData.weatherOutlook.uvIndex}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-blue-50/50 p-2.5 text-xs text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
                <span className="font-bold">Forecast: </span>
                {tipsData.weatherOutlook.condition} &bull; {tipsData.weatherOutlook.rainfallAdvice}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Interactive Smart Packing Checklist */}
      <div className="space-y-6 p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
                <Luggage className="h-4 w-4" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                Personalized Packing Checklist
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Custom-tailored for {activeCabin} Class traveling to {tipsData?.destination.city} ({purpose} &bull; {tripDuration})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-40 sm:w-48">
              <div className="mb-1 flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-500">Packed:</span>
                <span className="text-blue-600 dark:text-blue-400">{packedItemsCount} of {totalItemsCount} ({packingProgressPercent}%)</span>
              </div>
              <Progress value={packingProgressPercent} className="h-2 bg-slate-100 dark:bg-slate-800" />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyChecklist}
              className="h-8 rounded-xl text-xs font-semibold"
            >
              {copied ? <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy List"}
            </Button>
          </div>
        </div>

        {/* Packing Checklist Categories Grid */}
        {tipsData?.packingChecklist && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {tipsData.packingChecklist.map((category) => {
              const CategoryIcon = getCategoryIcon(category.category);
              return (
                <div
                  key={category.category}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                        <CategoryIcon className="h-4 w-4" />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        {category.category}
                      </h4>
                    </div>

                    <div className="mt-3 space-y-2.5">
                      {category.items.map((item) => {
                        const isPacked = !!packedMap[item.name];
                        return (
                          <div
                            key={item.name}
                            onClick={() => togglePacked(item.name)}
                            className={cn(
                              "group flex cursor-pointer items-start gap-3 rounded-xl p-2.5 transition-all text-xs",
                              isPacked
                                ? "bg-emerald-50/60 text-slate-500 line-through dark:bg-emerald-950/20"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200"
                            )}
                          >
                            <button
                              type="button"
                              className="mt-0.5 text-blue-600 dark:text-blue-400 shrink-0"
                            >
                              {isPacked ? (
                                <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Square className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                              )}
                            </button>

                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className={cn("font-semibold", isPacked && "font-normal")}>
                                  {item.name}
                                </span>
                                {item.essential && (
                                  <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                    Must-Have
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                {item.reason}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Custom User Additions Card */}
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-850/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Personal Packing Additions
                    </h4>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {customAddedItems.length} added
                  </Badge>
                </div>

                <div className="mt-3 space-y-2">
                  {customAddedItems.length === 0 ? (
                    <p className="py-4 text-center text-xs text-slate-400 italic">
                      No custom items added yet. Add items like prescription meds, favorite snacks, or baby gear below.
                    </p>
                  ) : (
                    customAddedItems.map((item) => {
                      const isPacked = !!packedMap[item.name];
                      return (
                        <div
                          key={item.name}
                          className="flex items-center justify-between rounded-xl bg-white p-2 text-xs shadow-sm dark:bg-slate-900"
                        >
                          <div
                            onClick={() => togglePacked(item.name)}
                            className="flex cursor-pointer items-center gap-2 flex-1"
                          >
                            {isPacked ? (
                              <CheckSquare className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-400" />
                            )}
                            <span className={cn(isPacked && "line-through text-slate-400")}>
                              {item.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCustomItem(item.name)}
                            className="text-slate-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Add Custom Item Form */}
              <form onSubmit={handleAddCustomItem} className="mt-4 flex gap-2 pt-2">
                <Input
                  placeholder="e.g. Noise-cancelling earbuds, GoPro..."
                  value={newCustomItemText}
                  onChange={(e) => setNewCustomItemText(e.target.value)}
                  className="h-9 text-xs"
                />
                <Button type="submit" size="sm" className="h-9 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* 4. Local Customs, Transit & Culinary Insider Tips */}
        {tipsData?.travelTips && tipsData.travelTips.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 font-bold">
                <Compass className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Curated Local Insights & Airport Wayfinding
                </h3>
                <p className="text-xs text-slate-500">
                  Essential transit routes, dining recommendations, and cultural etiquette for {tipsData.destination.city}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tipsData.travelTips.map((tip, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-850/40 text-xs space-y-1.5"
                >
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-[11px] uppercase tracking-wider">
                    {tip.category}
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {tip.tip}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. SkyWay Airline Security & Baggage Regulations Notice */}
        {tipsData?.airlineBaggageNotice && (
          <div className="rounded-2xl border border-blue-200/80 bg-blue-50/50 p-5 dark:border-blue-900/40 dark:bg-blue-950/20 text-xs">
            <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200">
              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>SkyWay Flight & Security Compliance Notice</span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3 text-slate-700 dark:text-slate-300">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">Cabin Allowance:</span>
                <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                  {tipsData.airlineBaggageNotice.cabinAllowance}
                </p>
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">Checked Allowance:</span>
                <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                  {tipsData.airlineBaggageNotice.checkedAllowance}
                </p>
              </div>
              <div>
                <span className="font-bold text-red-600 dark:text-red-400">Hold Luggage Ban:</span>
                <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                  {tipsData.airlineBaggageNotice.prohibitedItems?.join(", ")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DestinationTravelTipsCard;
