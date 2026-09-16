import { getDb } from "./index";
import { airports, flights, bookings, supportTickets } from "./schema";

export async function seedDatabase() {
  const db = getDb();
  console.log("🌱 Starting SkyWay Airlines database seed...");

  try {
    // 1. Seed Airports
    await db.insert(airports).values([
      { code: "DEL", name: "Indira Gandhi International", city: "Delhi", country: "India", latitude: "28.556200", longitude: "77.100000", timezone: "Asia/Kolkata", activeRunways: ["11/29", "10/28"] },
      { code: "BOM", name: "Chhatrapati Shivaji Maharaj", city: "Mumbai", country: "India", latitude: "19.089600", longitude: "72.865600", timezone: "Asia/Kolkata", activeRunways: ["09/27", "14/32"] },
      { code: "DXB", name: "Dubai International Airport", city: "Dubai", country: "UAE", latitude: "25.253200", longitude: "55.365700", timezone: "Asia/Dubai", activeRunways: ["12L/30R", "12R/30L"] },
      { code: "LHR", name: "London Heathrow", city: "London", country: "United Kingdom", latitude: "51.470000", longitude: "-0.454300", timezone: "Europe/London", activeRunways: ["09L/27R", "09R/27L"] },
      { code: "JFK", name: "John F. Kennedy International", city: "New York", country: "United States", latitude: "40.641300", longitude: "-73.778100", timezone: "America/New_York", activeRunways: ["04L/22R", "13R/31L"] },
      { code: "CDG", name: "Charles de Gaulle Airport", city: "Paris", country: "France", latitude: "49.009700", longitude: "2.547900", timezone: "Europe/Paris", activeRunways: ["08L/26R", "09L/27R"] },
      { code: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "Singapore", latitude: "1.364400", longitude: "103.991500", timezone: "Asia/Singapore", activeRunways: ["02L/20R", "02C/20C"] },
      { code: "HND", name: "Tokyo Haneda Airport", city: "Tokyo", country: "Japan", latitude: "35.549400", longitude: "139.779800", timezone: "Asia/Tokyo", activeRunways: ["16R/34L", "05/23"] },
      { code: "MLE", name: "Velana International Airport", city: "Maldives", country: "Maldives", latitude: "4.191800", longitude: "73.529100", timezone: "Indian/Maldives", activeRunways: ["18/36"] },
    ]).onConflictDoNothing();

    // 2. Seed Flights
    await db.insert(flights).values([
      {
        flightNumber: "SW128",
        originCode: "DEL",
        destinationCode: "CDG",
        departureTime: "07:40",
        arrivalTime: "14:20",
        duration: "8h 40m",
        aircraft: "Boeing 787-9 Dreamliner",
        status: "On Time",
        gate: "B12",
        terminal: "T3",
        priceEconomy: 42900,
        pricePremium: 68500,
        priceBusiness: 145000,
        priceFirst: 290000,
        seatsEconomyAvailable: 42,
        seatsPremiumAvailable: 14,
        seatsBusinessAvailable: 8,
        seatsFirstAvailable: 2,
        onTimePct: 94,
        baggageCarousel: "Carousel 4",
      },
      {
        flightNumber: "SW502",
        originCode: "DEL",
        destinationCode: "LHR",
        departureTime: "10:15",
        arrivalTime: "15:35",
        duration: "9h 20m",
        aircraft: "Airbus A350-1000",
        status: "Boarding",
        gate: "A4",
        terminal: "T3",
        priceEconomy: 48900,
        pricePremium: 79200,
        priceBusiness: 168000,
        priceFirst: 320000,
        seatsEconomyAvailable: 18,
        seatsPremiumAvailable: 6,
        seatsBusinessAvailable: 3,
        seatsFirstAvailable: 1,
        onTimePct: 91,
        baggageCarousel: "Carousel 7",
      },
      {
        flightNumber: "SW811",
        originCode: "DEL",
        destinationCode: "JFK",
        departureTime: "02:20",
        arrivalTime: "09:00",
        duration: "16h 40m",
        aircraft: "Boeing 777-300ER",
        status: "Scheduled",
        gate: "C19",
        terminal: "T3",
        priceEconomy: 64500,
        pricePremium: 98000,
        priceBusiness: 215000,
        priceFirst: 410000,
        seatsEconomyAvailable: 85,
        seatsPremiumAvailable: 22,
        seatsBusinessAvailable: 12,
        seatsFirstAvailable: 4,
        onTimePct: 88,
        baggageCarousel: "Carousel 11",
      },
    ]).onConflictDoNothing();

    // 3. Seed Sample Bookings
    await db.insert(bookings).values([
      {
        pnr: "SW9M2P",
        flightNumber: "SW128",
        passengerName: "Priya Sehrawat",
        passengerEmail: "sehrawatpriya430@gmail.com",
        passengerPhone: "+91 98765 43210",
        cabinClass: "Business",
        seatNumber: "3A",
        isCheckedIn: true,
        boardingPassId: "BP-SW128-3A-9M2P",
        baggageCount: 2,
        specialAssistance: "None",
        mealPreference: "Asian Vegetarian",
        totalPaid: 145000,
        currency: "INR",
        bookingDate: "2026-08-15",
        status: "CHECKED_IN",
      },
    ]).onConflictDoNothing();

    // 4. Seed Support Tickets
    await db.insert(supportTickets).values([
      {
        id: "TCK-8921",
        passengerEmail: "sehrawatpriya430@gmail.com",
        passengerName: "Priya Sehrawat",
        pnr: "SW9M2P",
        category: "Special Assistance",
        subject: "Lounge access confirmation & boarding gate assistance",
        status: "Resolved",
        priority: "Medium",
        messages: [
          {
            sender: "passenger",
            senderName: "Priya Sehrawat",
            text: "Hi, I have booked Business class on SW128. Is lounge access available at Terminal 3 Delhi?",
            timestamp: "2026-08-20T10:30:00Z",
          },
          {
            sender: "agent",
            senderName: "SkyWay Concierge Team",
            text: "Hello Priya, yes! You have complimentary access to the SkyWay Silver Lining Lounge at T3 (Mezzanine Level near Gate B10).",
            timestamp: "2026-08-20T10:35:00Z",
          },
        ],
      },
    ]).onConflictDoNothing();

    console.log("✅ Seed completed successfully.");
  } catch (error) {
    console.error("❌ Seed failed:", error);
  }
}
