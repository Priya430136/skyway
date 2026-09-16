/**
 * SkyWay Airlines - iCalendar (.ics) Generator & Multi-Calendar Integration
 * Generates RFC 5545 compliant .ics files for Apple Calendar, Google Calendar,
 * Outlook, Yahoo, and mobile calendar applications.
 */

export interface CalendarTripData {
  pnr: string;
  flightNumber: string;
  aircraft?: string;
  originCity: string;
  originCode: string;
  originTerminal?: string;
  destinationCity: string;
  destinationCode: string;
  destinationTerminal?: string;
  departureDate: string; // e.g. "15 Jun 2026"
  departureTime: string; // e.g. "06:00 AM" or "22:15"
  arrivalDate?: string;  // e.g. "15 Jun 2026"
  arrivalTime: string;   // e.g. "08:10 AM"
  duration?: string;     // e.g. "2h 10m"
  seat?: string;
  cabinClass?: string;
  meal?: string;
  baggageAllowance?: string;
  status?: string;
  delayNotice?: string;
}

/**
 * Parses diverse human-readable date + time formats into a JS Date object.
 */
export function parseFlightDateTime(dateStr: string, timeStr: string): Date {
  try {
    // Clean up strings
    const cleanDate = dateStr.trim();
    let cleanTime = timeStr.trim();

    // Check if time has "PM" or "AM"
    const isPM = /pm/i.test(cleanTime);
    const isAM = /am/i.test(cleanTime);
    cleanTime = cleanTime.replace(/[^\d:]/g, "");

    const [rawHours, rawMinutes = "00"] = cleanTime.split(":");
    let hours = parseInt(rawHours || "0", 10);
    const minutes = parseInt(rawMinutes || "0", 10);

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    // Handle "15 Jun 2026"
    const parts = cleanDate.split(/[\s,/-]+/);
    if (parts.length >= 3) {
      const monthNames: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
      };

      let day = 1;
      let month = 0;
      let year = 2026;

      // Check which part is year (4 digits)
      const yearIdx = parts.findIndex((p) => /^\d{4}$/.test(p));
      if (yearIdx !== -1) {
        year = parseInt(parts[yearIdx], 10);
        const otherParts = parts.filter((_, idx) => idx !== yearIdx);
        // Find month name
        const monthKey = otherParts.find((p) => monthNames[p.toLowerCase().slice(0, 3)] !== undefined);
        if (monthKey) {
          month = monthNames[monthKey.toLowerCase().slice(0, 3)];
          const dayPart = otherParts.find((p) => p !== monthKey);
          if (dayPart) day = parseInt(dayPart, 10);
        } else {
          day = parseInt(otherParts[0] || "1", 10);
          month = parseInt(otherParts[1] || "1", 10) - 1;
        }
      } else {
        const parsed = new Date(`${cleanDate} ${cleanTime}`);
        if (!isNaN(parsed.getTime())) return parsed;
      }

      const resultDate = new Date(Date.UTC(year, month, day, hours, minutes, 0));
      return resultDate;
    }

    const fallbackDate = new Date(`${cleanDate} ${cleanTime}`);
    if (!isNaN(fallbackDate.getTime())) return fallbackDate;
  } catch (err) {
    console.warn("Date parsing error in calendar-utils:", err);
  }

  // Safe fallback to future date
  return new Date(Date.now() + 86400000 * 3);
}

/**
 * Format a Date into standard UTC iCalendar format: YYYYMMDDTHHMMSSZ
 */
export function formatIcsUtc(date: Date): string {
  const pad = (num: number) => String(num).padStart(2, "0");
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

/**
 * Generates the RFC 5545 `.ics` file content string.
 */
export function generateIcsContent(trip: CalendarTripData): string {
  const startDate = parseFlightDateTime(trip.departureDate, trip.departureTime);
  
  // Calculate end date from arrival or duration (default 2h 30m)
  let endDate: Date;
  if (trip.arrivalDate || trip.arrivalTime) {
    endDate = parseFlightDateTime(
      trip.arrivalDate || trip.departureDate,
      trip.arrivalTime || "09:00"
    );
    // If end is before start, advance 1 day
    if (endDate.getTime() <= startDate.getTime()) {
      endDate = new Date(startDate.getTime() + 2.5 * 60 * 60 * 1000);
    }
  } else {
    endDate = new Date(startDate.getTime() + 2.5 * 60 * 60 * 1000);
  }

  const dtStamp = formatIcsUtc(new Date());
  const dtStart = formatIcsUtc(startDate);
  const dtEnd = formatIcsUtc(endDate);

  const uid = `skyway-${trip.pnr}-${trip.flightNumber}-${dtStart}@skywayairlines.com`;
  const summary = `✈️ SkyWay Flight ${trip.flightNumber}: ${trip.originCode} → ${trip.destinationCode}`;
  
  const originTerminalStr = trip.originTerminal ? ` (${trip.originTerminal})` : "";
  const destTerminalStr = trip.destinationTerminal ? ` (Terminal ${trip.destinationTerminal})` : "";
  const location = `${trip.originCity} Airport [${trip.originCode}]${originTerminalStr} to ${trip.destinationCity} [${trip.destinationCode}]${destTerminalStr}`;

  const descriptionLines = [
    `SkyWay Airlines Flight ${trip.flightNumber}`,
    `PNR / Booking Reference: ${trip.pnr}`,
    `Flight Route: ${trip.originCity} (${trip.originCode}) → ${trip.destinationCity} (${trip.destinationCode})`,
    `Departure: ${trip.departureDate} at ${trip.departureTime}${originTerminalStr}`,
    `Arrival: ${trip.arrivalDate || trip.departureDate} at ${trip.arrivalTime}${destTerminalStr}`,
    `Seat Assignment: ${trip.seat || "Assigned at Check-in"}`,
    `Cabin Class: ${trip.cabinClass || "Economy"}`,
    `Meal Preference: ${trip.meal || "Standard Meal"}`,
    `Baggage Allowance: ${trip.baggageAllowance || "Standard Allowance"}`,
    trip.delayNotice ? `Flight Status Alert: ${trip.delayNotice}` : "",
    "",
    "Important Travel Guidelines:",
    "• Airport Check-in opens 3 hours prior and closes strictly 60 minutes before departure.",
    "• Carry government photo ID and digital boarding pass.",
    "• Cabin luggage limit: 7 kg standard. All power banks must be placed in cabin bags only.",
    `• View full live trip status: https://skywayairlines.com/app/my-trips/${trip.pnr}`,
  ].filter(Boolean);

  const description = descriptionLines.join("\\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SkyWay Airlines//Flight Itinerary Calendar v2.0//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:SkyWay Flight Itinerary",
    "X-WR-TIMEZONE:UTC",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "SEQUENCE:0",
    // 3 hours airport arrival alarm
    "BEGIN:VALARM",
    "TRIGGER:-PT3H",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: SkyWay Flight ${trip.flightNumber} departs in 3 hours. Proceed to ${trip.originCode} airport.`,
    "END:VALARM",
    // 24 hours online check-in alarm
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "ACTION:DISPLAY",
    `DESCRIPTION:SkyWay Online Check-in is now OPEN for flight ${trip.flightNumber} (PNR: ${trip.pnr}).`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return ics;
}

/**
 * Generates an RFC 5545 .ics file containing multiple flight events.
 */
export function generateMultiTripIcsContent(trips: CalendarTripData[]): string {
  const dtStamp = formatIcsUtc(new Date());
  
  const events = trips.map((trip) => {
    const startDate = parseFlightDateTime(trip.departureDate, trip.departureTime);
    let endDate: Date;
    if (trip.arrivalDate || trip.arrivalTime) {
      endDate = parseFlightDateTime(
        trip.arrivalDate || trip.departureDate,
        trip.arrivalTime || "09:00"
      );
      if (endDate.getTime() <= startDate.getTime()) {
        endDate = new Date(startDate.getTime() + 2.5 * 60 * 60 * 1000);
      }
    } else {
      endDate = new Date(startDate.getTime() + 2.5 * 60 * 60 * 1000);
    }

    const dtStart = formatIcsUtc(startDate);
    const dtEnd = formatIcsUtc(endDate);
    const uid = `skyway-${trip.pnr}-${trip.flightNumber}-${dtStart}@skywayairlines.com`;
    const summary = `✈️ SkyWay Flight ${trip.flightNumber}: ${trip.originCode} → ${trip.destinationCode}`;
    const originTerminalStr = trip.originTerminal ? ` (${trip.originTerminal})` : "";
    const destTerminalStr = trip.destinationTerminal ? ` (Terminal ${trip.destinationTerminal})` : "";
    const location = `${trip.originCity} Airport [${trip.originCode}]${originTerminalStr} to ${trip.destinationCity} [${trip.destinationCode}]${destTerminalStr}`;

    const descriptionLines = [
      `SkyWay Airlines Flight ${trip.flightNumber}`,
      `PNR / Booking Reference: ${trip.pnr}`,
      `Flight Route: ${trip.originCity} (${trip.originCode}) → ${trip.destinationCity} (${trip.destinationCode})`,
      `Departure: ${trip.departureDate} at ${trip.departureTime}${originTerminalStr}`,
      `Arrival: ${trip.arrivalDate || trip.departureDate} at ${trip.arrivalTime}${destTerminalStr}`,
      `Seat Assignment: ${trip.seat || "Assigned at Check-in"}`,
      `Cabin Class: ${trip.cabinClass || "Economy"}`,
      `Meal Preference: ${trip.meal || "Standard Meal"}`,
      `Baggage Allowance: ${trip.baggageAllowance || "Standard Allowance"}`,
      trip.delayNotice ? `Flight Status Alert: ${trip.delayNotice}` : "",
      "",
      "Important Travel Guidelines:",
      "• Airport Check-in opens 3 hours prior and closes strictly 60 minutes before departure.",
      "• Carry government photo ID and digital boarding pass.",
      "• Cabin luggage limit: 7 kg standard. All power banks must be placed in cabin bags only.",
      `• View full live trip status: https://skywayairlines.com/app/my-trips/${trip.pnr}`,
    ].filter(Boolean);

    const description = descriptionLines.join("\\n");

    return [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "SEQUENCE:0",
      "BEGIN:VALARM",
      "TRIGGER:-PT3H",
      "ACTION:DISPLAY",
      `DESCRIPTION:Reminder: SkyWay Flight ${trip.flightNumber} departs in 3 hours. Proceed to ${trip.originCode} airport.`,
      "END:VALARM",
      "BEGIN:VALARM",
      "TRIGGER:-PT24H",
      "ACTION:DISPLAY",
      `DESCRIPTION:SkyWay Online Check-in is now OPEN for flight ${trip.flightNumber} (PNR: ${trip.pnr}).`,
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SkyWay Airlines//All Flights Itinerary//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:SkyWay Confirmed Flights",
    "X-WR-TIMEZONE:UTC",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Triggers an immediate browser download of the `.ics` file for a single flight.
 */
export function downloadIcsFile(trip: CalendarTripData): void {
  const icsData = generateIcsContent(trip);
  const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
  const filename = `SkyWay-Flight-${trip.flightNumber}-${trip.destinationCode}-${trip.pnr}.ics`;

  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
}

/**
 * Downloads a combined .ics file for all upcoming trips.
 */
export function downloadAllIcsFiles(trips: CalendarTripData[]): void {
  if (!trips.length) return;
  const icsData = generateMultiTripIcsContent(trips);
  const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
  const filename = `SkyWay-All-Upcoming-Flights.ics`;

  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
}

/**
 * Builds the direct Google Calendar Web link URL.
 */
export function getGoogleCalendarUrl(trip: CalendarTripData): string {
  const startDate = parseFlightDateTime(trip.departureDate, trip.departureTime);
  let endDate = trip.arrivalTime
    ? parseFlightDateTime(trip.arrivalDate || trip.departureDate, trip.arrivalTime)
    : new Date(startDate.getTime() + 2.5 * 60 * 60 * 1000);

  if (endDate.getTime() <= startDate.getTime()) {
    endDate = new Date(startDate.getTime() + 2.5 * 60 * 60 * 1000);
  }

  const dtStart = formatIcsUtc(startDate);
  const dtEnd = formatIcsUtc(endDate);

  const title = `✈️ SkyWay Flight ${trip.flightNumber}: ${trip.originCode} → ${trip.destinationCode}`;
  const location = `${trip.originCity} Airport (${trip.originCode}) to ${trip.destinationCity} (${trip.destinationCode})`;
  const details = [
    `SkyWay Flight ${trip.flightNumber} (PNR: ${trip.pnr})`,
    `Origin: ${trip.originCity} (${trip.originCode}) Terminal ${trip.originTerminal || "T3"}`,
    `Destination: ${trip.destinationCity} (${trip.destinationCode}) Terminal ${trip.destinationTerminal || "T2"}`,
    `Seat: ${trip.seat || "Select at check-in"} | Cabin: ${trip.cabinClass || "Economy"}`,
    `Meal: ${trip.meal || "Standard"} | Baggage: ${trip.baggageAllowance || "Standard"}`,
    trip.delayNotice ? `Flight Status: ${trip.delayNotice}` : "",
    `Trip PNR Link: https://skywayairlines.com/app/my-trips/${trip.pnr}`,
  ].filter(Boolean).join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${dtStart}/${dtEnd}`,
    details: details,
    location: location,
    sprop: "name:SkyWay Airlines",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Builds the Outlook.com / Office 365 web compose link URL.
 */
export function getOutlookCalendarUrl(trip: CalendarTripData): string {
  const startDate = parseFlightDateTime(trip.departureDate, trip.departureTime);
  let endDate = trip.arrivalTime
    ? parseFlightDateTime(trip.arrivalDate || trip.departureDate, trip.arrivalTime)
    : new Date(startDate.getTime() + 2.5 * 60 * 60 * 1000);

  if (endDate.getTime() <= startDate.getTime()) {
    endDate = new Date(startDate.getTime() + 2.5 * 60 * 60 * 1000);
  }

  const title = `✈️ SkyWay Flight ${trip.flightNumber}: ${trip.originCode} → ${trip.destinationCode}`;
  const location = `${trip.originCity} Airport (${trip.originCode}) to ${trip.destinationCity} (${trip.destinationCode})`;
  const body = `SkyWay Airlines Flight ${trip.flightNumber}\\nPNR: ${trip.pnr}\\nSeat: ${trip.seat || "Standard"}\\nCabin: ${trip.cabinClass || "Economy"}`;

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: title,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    body: body,
    location: location,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
