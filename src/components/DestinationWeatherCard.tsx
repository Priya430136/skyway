import React, { useState, useMemo } from "react";
import {
  Sun,
  CloudSun,
  CloudRain,
  CloudLightning,
  Cloud,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  Compass,
  Umbrella,
  Sunrise,
  Sunset,
  RefreshCw,
  Plane,
  Calendar,
  Clock,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  MapPin,
  CheckCircle2,
  Waves,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface DayForecast {
  dayName: string;
  dateStr: string;
  condition: string;
  conditionIcon: "sun" | "cloud-sun" | "cloud-rain" | "cloud-lightning" | "cloud" | "wind";
  tempHighC: number;
  tempLowC: number;
  precipChance: number; // percentage 0-100
  humidity: number; // percentage
  windSpeedKmh: number;
  windDirection: string;
  uvIndex: number;
  uvDescription: string;
  summary: string;
  hourly: Array<{
    time: string;
    tempC: number;
    icon: "sun" | "cloud-sun" | "cloud-rain" | "cloud-lightning" | "cloud";
    pop: number; // probability of precipitation
  }>;
  travelAdvice: string;
}

export interface DestinationWeatherDetail {
  city: string;
  country: string;
  airportCode: string;
  airportName: string;
  timezone: string;
  currentTempC: number;
  feelsLikeC: number;
  condition: string;
  conditionIcon: "sun" | "cloud-sun" | "cloud-rain" | "cloud-lightning" | "cloud" | "wind";
  highC: number;
  lowC: number;
  humidity: number;
  windKmh: number;
  windDir: string;
  visibilityKm: number;
  pressureHpa: number;
  uvIndex: number;
  aqi: number;
  aqiStatus: "Good" | "Moderate" | "Unhealthy for Sensitive Groups";
  sunrise: string;
  sunset: string;
  flightArrivalNotice: string;
  metarCode: string;
  forecast3Day: DayForecast[];
  packingSuggestions: Array<{
    item: string;
    reason: string;
    icon: string;
  }>;
}

export interface UpcomingTripForWeather {
  pnr: string;
  flightNumber: string;
  originCity: string;
  originCode: string;
  destinationCity: string;
  destinationCode: string;
  destinationTerminal?: string;
  departureDate: string;
  arrivalDate: string;
  arrivalTime: string;
  cabinClass?: string;
}

const DESTINATION_WEATHER_DB: Record<string, DestinationWeatherDetail> = {
  BOM: {
    city: "Mumbai",
    country: "India",
    airportCode: "BOM",
    airportName: "Chhatrapati Shivaji Maharaj International (T1/T2)",
    timezone: "IST (UTC+5:30)",
    currentTempC: 31,
    feelsLikeC: 36,
    condition: "Partly Cloudy with Coastal Breeze",
    conditionIcon: "cloud-sun",
    highC: 33,
    lowC: 27,
    humidity: 78,
    windKmh: 18,
    windDir: "WSW 240°",
    visibilityKm: 8,
    pressureHpa: 1009,
    uvIndex: 8,
    aqi: 68,
    aqiStatus: "Moderate",
    sunrise: "06:04 AM",
    sunset: "07:18 PM",
    flightArrivalNotice: "Smooth approach expected over Arabian Sea corridor. Light coastal crosswinds on Runway 27.",
    metarCode: "VABB 150600Z 24010KT 8000 FEW025 SCT080 31/26 Q1009 NOSIG",
    forecast3Day: [
      {
        dayName: "Day 1 (Arrival)",
        dateStr: "15 Jun 2026",
        condition: "Scattered Clouds & Humid",
        conditionIcon: "cloud-sun",
        tempHighC: 33,
        tempLowC: 27,
        precipChance: 25,
        humidity: 78,
        windSpeedKmh: 18,
        windDirection: "WSW",
        uvIndex: 8,
        uvDescription: "Very High",
        summary: "Warm and tropical with coastal sea breezes picking up by afternoon.",
        travelAdvice: "Breathable cotton clothing recommended; stay hydrated during transit.",
        hourly: [
          { time: "08:00 AM", tempC: 28, icon: "cloud-sun", pop: 10 },
          { time: "11:00 AM", tempC: 32, icon: "sun", pop: 15 },
          { time: "02:00 PM", tempC: 33, icon: "cloud-sun", pop: 25 },
          { time: "05:00 PM", tempC: 31, icon: "cloud-sun", pop: 20 },
          { time: "08:00 PM", tempC: 29, icon: "cloud", pop: 15 },
          { time: "11:00 PM", tempC: 27, icon: "cloud", pop: 10 },
        ],
      },
      {
        dayName: "Day 2",
        dateStr: "16 Jun 2026",
        condition: "Passing Monsoon Showers",
        conditionIcon: "cloud-rain",
        tempHighC: 31,
        tempLowC: 26,
        precipChance: 65,
        humidity: 85,
        windSpeedKmh: 24,
        windDirection: "SW",
        uvIndex: 6,
        uvDescription: "High",
        summary: "Intermittent afternoon drizzle and fresh maritime breeze.",
        travelAdvice: "Keep a compact umbrella in your daypack; expect brief road traffic slow-downs.",
        hourly: [
          { time: "08:00 AM", tempC: 27, icon: "cloud-sun", pop: 30 },
          { time: "11:00 AM", tempC: 30, icon: "cloud-rain", pop: 60 },
          { time: "02:00 PM", tempC: 31, icon: "cloud-rain", pop: 70 },
          { time: "05:00 PM", tempC: 29, icon: "cloud-rain", pop: 65 },
          { time: "08:00 PM", tempC: 28, icon: "cloud", pop: 40 },
          { time: "11:00 PM", tempC: 26, icon: "cloud", pop: 25 },
        ],
      },
      {
        dayName: "Day 3",
        dateStr: "17 Jun 2026",
        condition: "Isolated Thunderstorm",
        conditionIcon: "cloud-lightning",
        tempHighC: 30,
        tempLowC: 25,
        precipChance: 75,
        humidity: 88,
        windSpeedKmh: 28,
        windDirection: "SSW",
        uvIndex: 5,
        uvDescription: "Moderate",
        summary: "Breezy conditions with gusty afternoon showers near South Mumbai & suburbs.",
        travelAdvice: "Waterproof footwear and rain-cover for electronics recommended.",
        hourly: [
          { time: "08:00 AM", tempC: 26, icon: "cloud", pop: 45 },
          { time: "11:00 AM", tempC: 29, icon: "cloud-rain", pop: 70 },
          { time: "02:00 PM", tempC: 30, icon: "cloud-lightning", pop: 80 },
          { time: "05:00 PM", tempC: 28, icon: "cloud-rain", pop: 75 },
          { time: "08:00 PM", tempC: 27, icon: "cloud", pop: 50 },
          { time: "11:00 PM", tempC: 25, icon: "cloud", pop: 35 },
        ],
      },
    ],
    packingSuggestions: [
      { item: "Compact travel umbrella", reason: "65% rain probability on Day 2 & 3", icon: "☂️" },
      { item: "Breathable linen / cotton shirts", reason: "78% humidity during afternoon", icon: "👕" },
      { item: "UV 400 Sunglasses & Sunscreen", reason: "UV index reaches 8 at noon", icon: "🕶️" },
      { item: "Water-resistant phone pouch", reason: "Monsoon coastal splashes", icon: "📱" },
    ],
  },
  DXB: {
    city: "Dubai",
    country: "United Arab Emirates",
    airportCode: "DXB",
    airportName: "Dubai International Airport (T1/T2/T3)",
    timezone: "GST (UTC+4:00)",
    currentTempC: 38,
    feelsLikeC: 43,
    condition: "Sunny & Clear Skies",
    conditionIcon: "sun",
    highC: 41,
    lowC: 30,
    humidity: 42,
    windKmh: 14,
    windDir: "NNW 330°",
    visibilityKm: 10,
    pressureHpa: 1006,
    uvIndex: 11,
    aqi: 54,
    aqiStatus: "Moderate",
    sunrise: "05:32 AM",
    sunset: "07:11 PM",
    flightArrivalNotice: "Clear desert visibility on approach. Standard runway visual conditions at DXB Terminal 3.",
    metarCode: "OMDB 281600Z 33008KT CAVOK 38/20 Q1006 NOSIG",
    forecast3Day: [
      {
        dayName: "Day 1 (Arrival)",
        dateStr: "29 Jun 2026",
        condition: "Hot & Sunny",
        conditionIcon: "sun",
        tempHighC: 41,
        tempLowC: 30,
        precipChance: 0,
        humidity: 40,
        windSpeedKmh: 14,
        windDirection: "NNW",
        uvIndex: 11,
        uvDescription: "Extreme",
        summary: "Intense daytime sun with dry desert heat; pleasant climate-controlled indoor shopping and dining.",
        travelAdvice: "Stay indoors during peak 12:00–16:00 heat; keep high SPF sunscreen handy.",
        hourly: [
          { time: "08:00 AM", tempC: 32, icon: "sun", pop: 0 },
          { time: "11:00 AM", tempC: 38, icon: "sun", pop: 0 },
          { time: "02:00 PM", tempC: 41, icon: "sun", pop: 0 },
          { time: "05:00 PM", tempC: 39, icon: "sun", pop: 0 },
          { time: "08:00 PM", tempC: 34, icon: "sun", pop: 0 },
          { time: "11:00 PM", tempC: 31, icon: "sun", pop: 0 },
        ],
      },
      {
        dayName: "Day 2",
        dateStr: "30 Jun 2026",
        condition: "Clear & Breezy",
        conditionIcon: "wind",
        tempHighC: 40,
        tempLowC: 29,
        precipChance: 0,
        humidity: 45,
        windSpeedKmh: 20,
        windDirection: "NW",
        uvIndex: 11,
        uvDescription: "Extreme",
        summary: "Warm offshore breeze with clear evening starlight along Jumeirah Beach.",
        travelAdvice: "Light jacket for air-conditioned malls and airport lounges.",
        hourly: [
          { time: "08:00 AM", tempC: 31, icon: "sun", pop: 0 },
          { time: "11:00 AM", tempC: 37, icon: "sun", pop: 0 },
          { time: "02:00 PM", tempC: 40, icon: "sun", pop: 0 },
          { time: "05:00 PM", tempC: 38, icon: "wind", pop: 0 },
          { time: "08:00 PM", tempC: 33, icon: "sun", pop: 0 },
          { time: "11:00 PM", tempC: 30, icon: "sun", pop: 0 },
        ],
      },
      {
        dayName: "Day 3",
        dateStr: "01 Jul 2026",
        condition: "Sunny with Light Haze",
        conditionIcon: "sun",
        tempHighC: 42,
        tempLowC: 31,
        precipChance: 0,
        humidity: 38,
        windSpeedKmh: 12,
        windDirection: "NE",
        uvIndex: 11,
        uvDescription: "Extreme",
        summary: "Dry desert heat with minimal cloud cover.",
        travelAdvice: "Hydration tablets and polarized sunglasses recommended.",
        hourly: [
          { time: "08:00 AM", tempC: 33, icon: "sun", pop: 0 },
          { time: "11:00 AM", tempC: 39, icon: "sun", pop: 0 },
          { time: "02:00 PM", tempC: 42, icon: "sun", pop: 0 },
          { time: "05:00 PM", tempC: 40, icon: "sun", pop: 0 },
          { time: "08:00 PM", tempC: 35, icon: "sun", pop: 0 },
          { time: "11:00 PM", tempC: 32, icon: "sun", pop: 0 },
        ],
      },
    ],
    packingSuggestions: [
      { item: "SPF 50+ Sunscreen & Lip Balm", reason: "UV index reaches 11 (Extreme)", icon: "🧴" },
      { item: "Polarized UV Sunglasses", reason: "Bright desert reflective glare", icon: "🕶️" },
      { item: "Light cardigan / blazer", reason: "Strong indoor AC (20°C inside)", icon: "🧥" },
      { item: "Insulated water flask", reason: "Keep hydration cold all day", icon: "🧊" },
    ],
  },
  DEL: {
    city: "New Delhi",
    country: "India",
    airportCode: "DEL",
    airportName: "Indira Gandhi International Airport (T1/T2/T3)",
    timezone: "IST (UTC+5:30)",
    currentTempC: 36,
    feelsLikeC: 40,
    condition: "Mostly Sunny & Warm",
    conditionIcon: "sun",
    highC: 39,
    lowC: 28,
    humidity: 55,
    windKmh: 12,
    windDir: "WNW 290°",
    visibilityKm: 6,
    pressureHpa: 1004,
    uvIndex: 9,
    aqi: 112,
    aqiStatus: "Unhealthy for Sensitive Groups",
    sunrise: "05:23 AM",
    sunset: "07:22 PM",
    flightArrivalNotice: "CAT I/II ILS operational. Normal traffic sequencing on Runways 28/29.",
    metarCode: "VIDP 150600Z 29007KT 6000 HZ NSC 36/22 Q1004 NOSIG",
    forecast3Day: [
      {
        dayName: "Day 1 (Arrival)",
        dateStr: "15 Jun 2026",
        condition: "Sunny with Haze",
        conditionIcon: "sun",
        tempHighC: 39,
        tempLowC: 28,
        precipChance: 10,
        humidity: 52,
        windSpeedKmh: 12,
        windDirection: "WNW",
        uvIndex: 9,
        uvDescription: "Very High",
        summary: "Warm summer conditions across the National Capital Region.",
        travelAdvice: "Wear light sun protection and carry drinking water.",
        hourly: [
          { time: "08:00 AM", tempC: 30, icon: "sun", pop: 5 },
          { time: "11:00 AM", tempC: 36, icon: "sun", pop: 5 },
          { time: "02:00 PM", tempC: 39, icon: "sun", pop: 10 },
          { time: "05:00 PM", tempC: 37, icon: "sun", pop: 10 },
          { time: "08:00 PM", tempC: 33, icon: "sun", pop: 5 },
          { time: "11:00 PM", tempC: 30, icon: "sun", pop: 5 },
        ],
      },
      {
        dayName: "Day 2",
        dateStr: "16 Jun 2026",
        condition: "Partly Cloudy & Breezy",
        conditionIcon: "cloud-sun",
        tempHighC: 38,
        tempLowC: 27,
        precipChance: 20,
        humidity: 58,
        windSpeedKmh: 16,
        windDirection: "NW",
        uvIndex: 9,
        uvDescription: "Very High",
        summary: "Passing clouds offering intermittent sun shade.",
        travelAdvice: "Comfortable walking shoes for heritage monuments.",
        hourly: [
          { time: "08:00 AM", tempC: 29, icon: "cloud-sun", pop: 10 },
          { time: "11:00 AM", tempC: 35, icon: "cloud-sun", pop: 15 },
          { time: "02:00 PM", tempC: 38, icon: "cloud-sun", pop: 20 },
          { time: "05:00 PM", tempC: 36, icon: "cloud-sun", pop: 20 },
          { time: "08:00 PM", tempC: 32, icon: "cloud", pop: 15 },
          { time: "11:00 PM", tempC: 29, icon: "cloud", pop: 10 },
        ],
      },
      {
        dayName: "Day 3",
        dateStr: "17 Jun 2026",
        condition: "Evening Dust Storm / Thunder",
        conditionIcon: "wind",
        tempHighC: 37,
        tempLowC: 26,
        precipChance: 35,
        humidity: 62,
        windSpeedKmh: 30,
        windDirection: "W",
        uvIndex: 8,
        uvDescription: "Very High",
        summary: "Pre-monsoon gusty winds and brief evening showers.",
        travelAdvice: "Keep eye protection for dusty evening breezes.",
        hourly: [
          { time: "08:00 AM", tempC: 28, icon: "sun", pop: 10 },
          { time: "11:00 AM", tempC: 34, icon: "sun", pop: 15 },
          { time: "02:00 PM", tempC: 37, icon: "cloud-sun", pop: 25 },
          { time: "05:00 PM", tempC: 35, icon: "wind", pop: 40 },
          { time: "08:00 PM", tempC: 30, icon: "cloud-rain", pop: 45 },
          { time: "11:00 PM", tempC: 27, icon: "cloud", pop: 30 },
        ],
      },
    ],
    packingSuggestions: [
      { item: "Lightweight summer cottons", reason: "39°C daytime highs", icon: "👕" },
      { item: "Anti-pollution face mask", reason: "AQI around 112 (Hazy)", icon: "😷" },
      { item: "Hat / Cap and Sunscreen", reason: "High UV index exposure", icon: "🧢" },
      { item: "Electrolyte hydration packs", reason: "Combats dry summer heat", icon: "💧" },
    ],
  },
  LHR: {
    city: "London",
    country: "United Kingdom",
    airportCode: "LHR",
    airportName: "Heathrow Airport (T2/T3/T4/T5)",
    timezone: "BST (UTC+1:00)",
    currentTempC: 21,
    feelsLikeC: 21,
    condition: "Scattered Clouds & Gentle Breeze",
    conditionIcon: "cloud-sun",
    highC: 23,
    lowC: 14,
    humidity: 62,
    windKmh: 15,
    windDir: "W 260°",
    visibilityKm: 10,
    pressureHpa: 1016,
    uvIndex: 5,
    aqi: 28,
    aqiStatus: "Good",
    sunrise: "04:43 AM",
    sunset: "09:21 PM",
    flightArrivalNotice: "Excellent arrival visibility. Standard westerly flow on Runway 27L.",
    metarCode: "EGLL 150600Z 26009KT 9999 FEW040 21/13 Q1016 NOSIG",
    forecast3Day: [
      {
        dayName: "Day 1 (Arrival)",
        dateStr: "15 Jun 2026",
        condition: "Pleasant & Partly Sunny",
        conditionIcon: "cloud-sun",
        tempHighC: 23,
        tempLowC: 14,
        precipChance: 15,
        humidity: 60,
        windSpeedKmh: 15,
        windDirection: "W",
        uvIndex: 5,
        uvDescription: "Moderate",
        summary: "Crisp summer weather with mild sunshine and light westerly breezes.",
        travelAdvice: "Layering is key — comfortable light jacket for mornings and evenings.",
        hourly: [
          { time: "08:00 AM", tempC: 16, icon: "cloud-sun", pop: 10 },
          { time: "11:00 AM", tempC: 20, icon: "sun", pop: 10 },
          { time: "02:00 PM", tempC: 23, icon: "cloud-sun", pop: 15 },
          { time: "05:00 PM", tempC: 21, icon: "cloud-sun", pop: 15 },
          { time: "08:00 PM", tempC: 18, icon: "sun", pop: 10 },
          { time: "11:00 PM", tempC: 15, icon: "cloud", pop: 5 },
        ],
      },
      {
        dayName: "Day 2",
        dateStr: "16 Jun 2026",
        condition: "Light Passing Drizzle",
        conditionIcon: "cloud-rain",
        tempHighC: 20,
        tempLowC: 13,
        precipChance: 45,
        humidity: 72,
        windSpeedKmh: 18,
        windDirection: "SW",
        uvIndex: 4,
        uvDescription: "Moderate",
        summary: "Overcast skies with intermittent light British summer drizzle.",
        travelAdvice: "Carry a pocket umbrella or waterproof trench coat.",
        hourly: [
          { time: "08:00 AM", tempC: 14, icon: "cloud", pop: 30 },
          { time: "11:00 AM", tempC: 18, icon: "cloud-rain", pop: 45 },
          { time: "02:00 PM", tempC: 20, icon: "cloud-rain", pop: 50 },
          { time: "05:00 PM", tempC: 19, icon: "cloud-rain", pop: 40 },
          { time: "08:00 PM", tempC: 16, icon: "cloud", pop: 25 },
          { time: "11:00 PM", tempC: 14, icon: "cloud", pop: 15 },
        ],
      },
      {
        dayName: "Day 3",
        dateStr: "17 Jun 2026",
        condition: "Bright & Clear",
        conditionIcon: "sun",
        tempHighC: 24,
        tempLowC: 15,
        precipChance: 10,
        humidity: 55,
        windSpeedKmh: 12,
        windDirection: "NW",
        uvIndex: 6,
        uvDescription: "High",
        summary: "Warm sunny afternoon ideal for city walks and parks.",
        travelAdvice: "Comfortable sneakers and light outerwear.",
        hourly: [
          { time: "08:00 AM", tempC: 16, icon: "sun", pop: 5 },
          { time: "11:00 AM", tempC: 21, icon: "sun", pop: 5 },
          { time: "02:00 PM", tempC: 24, icon: "sun", pop: 10 },
          { time: "05:00 PM", tempC: 22, icon: "sun", pop: 10 },
          { time: "08:00 PM", tempC: 19, icon: "sun", pop: 5 },
          { time: "11:00 PM", tempC: 16, icon: "cloud", pop: 5 },
        ],
      },
    ],
    packingSuggestions: [
      { item: "Windproof folding umbrella", reason: "45% chance of drizzle on Day 2", icon: "☂️" },
      { item: "Light jacket / Trench coat", reason: "Cool evenings down to 13°C", icon: "🧥" },
      { item: "Comfortable walking shoes", reason: "Ideal for walking around London", icon: "👟" },
      { item: "UK 3-pin plug adapter (Type G)", reason: "Local power outlets", icon: "🔌" },
    ],
  },
};

export interface DestinationWeatherCardProps {
  upcomingTrips?: UpcomingTripForWeather[];
  defaultSelectedTripIndex?: number;
  className?: string;
}

export function DestinationWeatherCard({
  upcomingTrips = [
    {
      pnr: "SW8X4K",
      flightNumber: "SW-204",
      originCity: "New Delhi",
      originCode: "DEL",
      destinationCity: "Mumbai",
      destinationCode: "BOM",
      destinationTerminal: "T1",
      departureDate: "15 Jun 2026",
      arrivalDate: "15 Jun 2026",
      arrivalTime: "08:10 AM",
      cabinClass: "Economy",
    },
    {
      pnr: "SW9M2P",
      flightNumber: "SW-811",
      originCity: "Mumbai",
      originCode: "BOM",
      destinationCity: "Dubai",
      destinationCode: "DXB",
      destinationTerminal: "T3",
      departureDate: "28 Jun 2026",
      arrivalDate: "29 Jun 2026",
      arrivalTime: "00:40 AM",
      cabinClass: "Business",
    },
  ],
  defaultSelectedTripIndex = 0,
  className,
}: DestinationWeatherCardProps) {
  const [selectedTripIndex, setSelectedTripIndex] = useState<number>(defaultSelectedTripIndex);
  const [useFahrenheit, setUseFahrenheit] = useState<boolean>(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showMetar, setShowMetar] = useState<boolean>(false);

  const currentTrip = upcomingTrips[selectedTripIndex] || upcomingTrips[0];
  const destCode = currentTrip?.destinationCode || "BOM";

  // Lookup weather data fallback
  const weatherData: DestinationWeatherDetail = useMemo(() => {
    return (
      DESTINATION_WEATHER_DB[destCode] ||
      DESTINATION_WEATHER_DB.BOM
    );
  }, [destCode]);

  const activeDayForecast = weatherData.forecast3Day[selectedDayIndex] || weatherData.forecast3Day[0];

  const formatTemp = (c: number) => {
    if (useFahrenheit) {
      return `${Math.round((c * 9) / 5 + 32)}°F`;
    }
    return `${c}°C`;
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success(`Weather synced for ${weatherData.city} (${weatherData.airportCode})`, {
        description: "Latest aviation telemetry and 3-day meteorological forecast updated.",
      });
    }, 600);
  };

  const renderWeatherIcon = (iconName: string, classNameStr: string = "h-6 w-6") => {
    switch (iconName) {
      case "sun":
        return <Sun className={cn(classNameStr, "text-amber-500")} />;
      case "cloud-sun":
        return <CloudSun className={cn(classNameStr, "text-amber-500")} />;
      case "cloud-rain":
        return <CloudRain className={cn(classNameStr, "text-blue-500")} />;
      case "cloud-lightning":
        return <CloudLightning className={cn(classNameStr, "text-purple-500")} />;
      case "wind":
        return <Wind className={cn(classNameStr, "text-teal-500")} />;
      default:
        return <Cloud className={cn(classNameStr, "text-slate-400")} />;
    }
  };

  // Temperature trend calculations for the mini visualization
  const allTemps = weatherData.forecast3Day.flatMap((d) => [d.tempHighC, d.tempLowC]);
  const minTempAll = Math.min(...allTemps) - 2;
  const maxTempAll = Math.max(...allTemps) + 2;
  const tempSpan = maxTempAll - minTempAll || 1;

  return (
    <div
      id="destination-weather-card"
      className={cn(
        "overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md",
        className
      )}
    >
      {/* Top Header Banner with Destination Context */}
      <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-r from-sky-50 via-blue-50/50 to-indigo-50/70 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600 font-bold text-white shadow-sm text-[11px] px-2.5 py-0.5">
                Next Upcoming Destination Weather
              </Badge>
              {upcomingTrips.length > 1 && (
                <div className="flex items-center rounded-xl bg-white/80 p-0.5 text-xs font-semibold shadow-xs border border-blue-200/60">
                  {upcomingTrips.map((t, idx) => (
                    <button
                      key={t.pnr}
                      type="button"
                      onClick={() => {
                        setSelectedTripIndex(idx);
                        setSelectedDayIndex(0);
                      }}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-xs transition-colors",
                        selectedTripIndex === idx
                          ? "bg-blue-600 font-bold text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      {t.destinationCode} ({t.flightNumber})
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-baseline gap-3 pt-1">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600 shrink-0" />
                {weatherData.city}, {weatherData.country}
              </h3>
              <span className="font-mono text-sm font-extrabold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                {weatherData.airportCode}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
              <span>Arrival Flight: <strong className="text-slate-800 font-mono">{currentTrip.flightNumber}</strong></span>
              <span>&bull;</span>
              <span>Landing: <strong className="text-slate-800">{currentTrip.arrivalDate} at {currentTrip.arrivalTime}</strong></span>
              <span>&bull;</span>
              <span className="text-slate-400">{weatherData.timezone}</span>
            </p>
          </div>

          {/* Unit Toggle & Refresh Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setUseFahrenheit(false)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-bold transition-colors",
                  !useFahrenheit
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                °C
              </button>
              <button
                type="button"
                onClick={() => setUseFahrenheit(true)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-bold transition-colors",
                  useFahrenheit
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                °F
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
              title="Refresh live weather feed"
            >
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1 text-slate-500", isRefreshing && "animate-spin text-blue-600")} />
              Sync
            </Button>
          </div>
        </div>

        {/* Live Flight & Runway Weather Notice */}
        <div className="mt-3.5 flex items-center gap-2 rounded-xl bg-white/90 px-3.5 py-2 text-xs font-medium text-slate-700 border border-blue-100 shadow-2xs">
          <Plane className="h-4 w-4 text-blue-600 shrink-0" />
          <span className="line-clamp-1">{weatherData.flightArrivalNotice}</span>
          <button
            type="button"
            onClick={() => setShowMetar(!showMetar)}
            className="ml-auto shrink-0 text-[11px] font-bold text-blue-600 hover:underline"
          >
            {showMetar ? "Hide METAR" : "METAR / TAF"}
          </button>
        </div>

        {/* METAR Code Box (collapsible) */}
        {showMetar && (
          <div className="mt-2 rounded-xl bg-slate-900 p-3 font-mono text-xs text-emerald-400 shadow-inner">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Aviation METAR Telemetry:</div>
            {weatherData.metarCode}
          </div>
        )}
      </div>

      {/* Main Weather Content Body */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* CURRENT SNAPSHOT + ATMOSPHERIC GAUGES */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 items-center">
          {/* Main Temperature & Condition Block (5 cols) */}
          <div className="md:col-span-5 flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-amber-50 border border-amber-200/60 shadow-inner">
              {renderWeatherIcon(weatherData.conditionIcon, "h-11 w-11")}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                  {formatTemp(weatherData.currentTempC)}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Feels {formatTemp(weatherData.feelsLikeC)}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                {weatherData.condition}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                High {formatTemp(weatherData.highC)} &bull; Low {formatTemp(weatherData.lowC)}
              </div>
            </div>
          </div>

          {/* Quick Metrics Strip (7 cols) */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-medium mb-1">
                <Droplets className="h-3.5 w-3.5 text-blue-500" />
                <span>Humidity</span>
              </div>
              <span className="font-mono text-base font-extrabold text-slate-800">{weatherData.humidity}%</span>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-medium mb-1">
                <Wind className="h-3.5 w-3.5 text-teal-500" />
                <span>Wind</span>
              </div>
              <span className="font-mono text-base font-extrabold text-slate-800">{weatherData.windKmh} km/h</span>
              <div className="text-[10px] text-slate-400 truncate">{weatherData.windDir}</div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-medium mb-1">
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                <span>UV Index</span>
              </div>
              <span className="font-mono text-base font-extrabold text-amber-700">{weatherData.uvIndex}</span>
              <div className="text-[10px] font-semibold text-amber-600">High</div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-medium mb-1">
                <Gauge className="h-3.5 w-3.5 text-emerald-500" />
                <span>AQI Air</span>
              </div>
              <span className="font-mono text-base font-extrabold text-emerald-700">{weatherData.aqi}</span>
              <div className="text-[10px] font-semibold text-emerald-600 truncate">{weatherData.aqiStatus}</div>
            </div>
          </div>
        </div>

        {/* 3-DAY TREND VISUALIZATION STRIP */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                3-Day Meteorological Trend & Forecast
              </h4>
              <p className="text-xs text-slate-500">
                Click any day to examine hourly thermal curves and tailored packing advisory
              </p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
              Arrival: {currentTrip.arrivalDate}
            </span>
          </div>

          {/* 3-Day Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {weatherData.forecast3Day.map((day, idx) => {
              const isSelected = selectedDayIndex === idx;

              // Calculate relative bar position for high/low visual bar
              const leftPercent = Math.max(0, ((day.tempLowC - minTempAll) / tempSpan) * 100);
              const rightPercent = Math.min(100, ((day.tempHighC - minTempAll) / tempSpan) * 100);
              const barWidth = Math.max(12, rightPercent - leftPercent);

              return (
                <button
                  key={day.dayName}
                  type="button"
                  onClick={() => setSelectedDayIndex(idx)}
                  className={cn(
                    "text-left rounded-2xl p-4 transition-all duration-200 border relative",
                    isSelected
                      ? "border-blue-500 bg-white shadow-md ring-2 ring-blue-500/20"
                      : "border-slate-200/80 bg-white/70 hover:bg-white hover:border-slate-300"
                  )}
                >
                  {/* Top indicator ribbon */}
                  {isSelected && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-blue-600 rounded-t-2xl" />
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        {day.dayName}
                        {idx === 0 && (
                          <span className="rounded-full bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.2 font-extrabold">
                            Touchdown
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-medium text-slate-500">{day.dateStr}</div>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
                      {renderWeatherIcon(day.conditionIcon, "h-5 w-5")}
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-xs font-bold text-slate-800 line-clamp-1">
                      {day.condition}
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-mono text-xl font-black text-slate-900">
                        {formatTemp(day.tempHighC)}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-400">
                        / {formatTemp(day.tempLowC)}
                      </span>
                      <span className="ml-auto font-mono text-[11px] font-semibold text-blue-600 flex items-center gap-0.5">
                        <Droplets className="h-3 w-3" />
                        {day.precipChance}% rain
                      </span>
                    </div>
                  </div>

                  {/* Visual Temperature Range Bar */}
                  <div className="mt-3 space-y-1">
                    <div className="h-2 w-full rounded-full bg-slate-100 relative overflow-hidden">
                      <div
                        className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-blue-400 via-amber-400 to-rose-400"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${barWidth}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span>{formatTemp(minTempAll)}</span>
                      <span>{formatTemp(maxTempAll)}</span>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-500 line-clamp-1">
                    {day.summary}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ACTIVE DAY DETAILED HOURLY CURVE & CONDITIONS */}
          <div className="mt-4 rounded-2xl bg-white p-4 border border-slate-200/80 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  {activeDayForecast.dayName} Hourly Progression ({activeDayForecast.dateStr})
                </span>
                <span className="text-xs text-slate-500 ml-2 font-medium">
                  {activeDayForecast.summary}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Sunrise className="h-3.5 w-3.5 text-amber-500" />
                  {weatherData.sunrise}
                </span>
                <span className="flex items-center gap-1">
                  <Sunset className="h-3.5 w-3.5 text-orange-500" />
                  {weatherData.sunset}
                </span>
              </div>
            </div>

            {/* Hourly Snapshots Horizontal Bar */}
            <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
              {activeDayForecast.hourly.map((h) => (
                <div
                  key={h.time}
                  className="flex flex-col items-center justify-center rounded-xl bg-slate-50/70 p-2.5 text-center border border-slate-100 hover:bg-slate-100/70 transition-colors"
                >
                  <span className="text-[11px] font-semibold text-slate-500">{h.time}</span>
                  <div className="my-1.5">
                    {renderWeatherIcon(h.icon, "h-5 w-5")}
                  </div>
                  <span className="font-mono text-sm font-black text-slate-800">
                    {formatTemp(h.tempC)}
                  </span>
                  {h.pop > 0 && (
                    <span className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5 mt-0.5">
                      <Droplets className="h-2.5 w-2.5" />
                      {h.pop}%
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Travel & Packing Advice for the Selected Day */}
            <div className="mt-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl bg-blue-50/70 px-4 py-2.5 border border-blue-100">
              <div className="flex items-center gap-2.5 text-xs text-blue-900">
                <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                <span>
                  <strong className="font-extrabold">Meteorological Advice: </strong>
                  {activeDayForecast.travelAdvice}
                </span>
              </div>
              <span className="shrink-0 text-[11px] font-bold text-blue-700 bg-white/80 px-2 py-0.5 rounded-md border border-blue-200">
                UV: {activeDayForecast.uvDescription} ({activeDayForecast.uvIndex}/12)
              </span>
            </div>
          </div>
        </div>

        {/* SMART PACKING RECOMMENDATIONS BASED ON FORECAST */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Umbrella className="h-3.5 w-3.5 text-blue-600" />
              Tailored Packing Recommendations For {weatherData.city}
            </h4>
            <span className="text-[11px] font-semibold text-slate-400">
              Based on 3-day forecast outlook
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {weatherData.packingSuggestions.map((pack) => (
              <div
                key={pack.item}
                className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs transition-colors hover:bg-slate-50"
              >
                <span className="text-lg shrink-0">{pack.icon}</span>
                <div>
                  <div className="font-bold text-slate-800">{pack.item}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{pack.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
