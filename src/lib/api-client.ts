// Helper for communicating with the Express.js Backend API

export async function fetchApi<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const skywayApi = {
  getHealth: () => fetchApi("/api/health"),
  searchFlights: (params: { origin?: string; destination?: string; cabin?: string; date?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchApi(`/api/flights/search?${query}`);
  },
  getFlightStatus: (flightNumber: string) => fetchApi(`/api/flights/status?flightNumber=${flightNumber}`),
  getFlight: (flightNumber: string) => fetchApi(`/api/flights/${flightNumber}`),
  getBookings: (email?: string) => fetchApi(`/api/bookings${email ? `?email=${encodeURIComponent(email)}` : ""}`),
  getBookingByPnr: (pnr: string) => fetchApi(`/api/bookings/${pnr}`),
  createBooking: (data: any) => fetchApi("/api/bookings", { method: "POST", body: JSON.stringify(data) }),
  updateBooking: (pnr: string, updates: any) => fetchApi(`/api/bookings/${pnr}`, { method: "PATCH", body: JSON.stringify(updates) }),
  lookupCheckIn: (pnr: string, lastName?: string) => fetchApi("/api/check-in/lookup", { method: "POST", body: JSON.stringify({ pnr, lastName }) }),
  completeCheckIn: (data: { pnr: string; seat?: string; baggageCount?: number }) =>
    fetchApi("/api/check-in/complete", { method: "POST", body: JSON.stringify(data) }),
  aiChat: (query: string, messages?: any[]) => fetchApi("/api/ai/chat", { method: "POST", body: JSON.stringify({ query, messages }) }),
  getOpsOverview: () => fetchApi("/api/ops/overview"),
  opsCopilot: (query: string) => fetchApi("/api/ops/copilot", { method: "POST", body: JSON.stringify({ query }) }),
  getSupportTickets: (email?: string) => fetchApi(`/api/support/tickets${email ? `?email=${encodeURIComponent(email)}` : ""}`),
  createSupportTicket: (data: any) => fetchApi("/api/support/tickets", { method: "POST", body: JSON.stringify(data) }),
  calcCompensation: (flightDistanceKm: number, delayHours: number, reason?: string) =>
    fetchApi("/api/support/compensation-calc", { method: "POST", body: JSON.stringify({ flightDistanceKm, delayHours, reason }) }),
  getAirports: () => fetchApi("/api/airports"),
  getAirport: (code: string) => fetchApi(`/api/airports/${code}`),
  getAdminMetrics: () => fetchApi("/api/admin/metrics"),
};
