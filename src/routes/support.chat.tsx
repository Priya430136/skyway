import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  Send, Paperclip, Smile, Sparkles, User, Plane, CheckCheck, Clock,
  Search, Shield, Gift, RefreshCw, X, ChevronRight, PhoneCall, AlertCircle,
  FileText, ExternalLink, ThumbsUp, Tag, Plus, MessageSquare, Check,
} from "lucide-react";
import { toast } from "sonner";
import { SupportTopbar } from "@/components/support/SupportTopbar";
import { chatThreads as initialThreads, chatHistory as defaultHistory, type ChatMessage } from "@/lib/support/mock";

export const Route = createFileRoute("/support/chat")({ component: ChatPage });

type ThreadData = {
  id: string;
  ticketId: string;
  passenger: string;
  passengerEmail: string;
  passengerTier: "Silver" | "Gold" | "Platinum" | "Standard";
  flight: string;
  route: string;
  seat: string;
  pnr: string;
  category: string;
  online: boolean;
  unread: number;
  updatedAt: string;
  sentiment: "positive" | "neutral" | "negative";
  messages: ChatMessage[];
  aiSuggestions: { id: string; title: string; text: string; actionTag?: string }[];
};

const INITIAL_THREADS_DATA: ThreadData[] = [
  {
    id: "chat_100",
    ticketId: "TCK-8420",
    passenger: "Elena Rossi",
    passengerEmail: "elena.rossi@mail.com",
    passengerTier: "Gold",
    flight: "SW841",
    route: "LHR → CDG",
    seat: "4A (Business)",
    pnr: "SW08419",
    category: "Flight Delay & Cancellation",
    online: true,
    unread: 1,
    updatedAt: new Date(Date.now() - 2 * 60000).toISOString(),
    sentiment: "negative",
    messages: [
      { id: "m1", role: "passenger", body: "Hi, my flight SW841 was cancelled and I need help rebooking as soon as possible. I have a critical meeting in Paris tonight.", at: new Date(Date.now() - 26 * 60000).toISOString(), read: true },
      { id: "m2", role: "ai", body: "Suggested reply: acknowledge cancellation, apologize, offer next 2 available flights (SW846 @ 08:15 or SW849 @ 14:20) and complimentary meal voucher.", at: new Date(Date.now() - 25 * 60000).toISOString() },
      { id: "m3", role: "agent", body: "Hello Ms. Rossi — I am truly sorry about the cancellation. I've reserved a priority seat for you on SW846 departing tomorrow at 08:15. Would this work for your schedule?", at: new Date(Date.now() - 22 * 60000).toISOString(), read: true },
      { id: "m4", role: "passenger", body: "SW846 works. Can I also get a hotel room and meal voucher for tonight near Heathrow?", at: new Date(Date.now() - 4 * 60000).toISOString(), read: false },
    ],
    aiSuggestions: [
      { id: "s1", title: "Approve Hotel & €25 Meal Voucher", text: "I have arranged a complimentary stay at the Sofitel London Heathrow and issued a €25 meal voucher to your digital boarding pass. A confirmation email has been sent.", actionTag: "Duty of Care" },
      { id: "s2", title: "Confirm SW846 Seat & Boarding Pass", text: "Your seat 4A on SW846 tomorrow is confirmed. Digital boarding pass is ready in your SkyWay app with priority fast-track security included.", actionTag: "Rebooking" },
      { id: "s3", title: "Offer 5,000 Goodwill Miles", text: "As a valued Gold member, I have also credited 5,000 complimentary goodwill miles to your SkyWay Rewards balance for this disruption.", actionTag: "Loyalty Bonus" },
    ],
  },
  {
    id: "chat_101",
    ticketId: "TCK-8421",
    passenger: "Michael O'Brien",
    passengerEmail: "michael.obrien@mail.com",
    passengerTier: "Platinum",
    flight: "SW214",
    route: "DEL → SIN",
    seat: "2K (First)",
    pnr: "SW91823",
    category: "Lost Baggage",
    online: true,
    unread: 2,
    updatedAt: new Date(Date.now() - 8 * 60000).toISOString(),
    sentiment: "negative",
    messages: [
      { id: "m20", role: "passenger", body: "Hello! My black Rimowa suitcase with tag SW-BAG-9921 did not arrive on the carousel at Changi Airport.", at: new Date(Date.now() - 40 * 60000).toISOString(), read: true },
      { id: "m21", role: "agent", body: "Good day Mr. O'Brien. I've pulled up your PIR report #SIN-SW-4910. The bag was misrouted at Delhi and is already loaded onto flight SW216 arriving in Singapore at 19:40 tonight.", at: new Date(Date.now() - 30 * 60000).toISOString(), read: true },
      { id: "m22", role: "passenger", body: "Thank you for locating it. Can it be couriered directly to the Marina Bay Sands Hotel?", at: new Date(Date.now() - 8 * 60000).toISOString(), read: false },
    ],
    aiSuggestions: [
      { id: "s4", title: "Confirm Direct Hotel Courier", text: "Yes, absolutely! We will dispatch a priority courier directly to Marina Bay Sands front desk upon flight arrival at 20:30 tonight. Driver will call your phone.", actionTag: "Baggage Courier" },
      { id: "s5", title: "Issue $150 Emergency Toiletries Allowance", text: "I have authorized an immediate $150 emergency incidental expense credit to your registered card for essential toiletries and clothing.", actionTag: "Baggage Allowance" },
    ],
  },
  {
    id: "chat_102",
    ticketId: "TCK-8422",
    passenger: "Aiko Sato",
    passengerEmail: "aiko.sato@mail.com",
    passengerTier: "Silver",
    flight: "SW508",
    route: "DXB → SIN",
    seat: "18C (Economy Flex)",
    pnr: "SW55120",
    category: "Special Assistance",
    online: false,
    unread: 0,
    updatedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    sentiment: "positive",
    messages: [
      { id: "m30", role: "passenger", body: "Could you confirm if wheelchair assistance (WCHR) is arranged for my elderly mother on flight SW508?", at: new Date(Date.now() - 60 * 60000).toISOString(), read: true },
      { id: "m31", role: "agent", body: "Yes Ms. Sato, wheelchair assistance has been confirmed with Dubai Ground Services (WCHR code SSR WCHR-01). A representative will meet her at Check-in Desk 12.", at: new Date(Date.now() - 45 * 60000).toISOString(), read: true },
    ],
    aiSuggestions: [
      { id: "s6", title: "Add Meet & Assist Confirmation", text: "I've also alerted the cabin crew to ensure smooth disembarkation at Singapore Changi.", actionTag: "Special Assistance" },
    ],
  },
  {
    id: "chat_103",
    ticketId: "TCK-8423",
    passenger: "Jonas Weber",
    passengerEmail: "jonas.weber@mail.com",
    passengerTier: "Standard",
    flight: "SW612",
    route: "FRA → BOM",
    seat: "24D (Economy)",
    pnr: "SW10492",
    category: "Seat Upgrade & Meal",
    online: true,
    unread: 1,
    updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    sentiment: "neutral",
    messages: [
      { id: "m40", role: "passenger", body: "Can I upgrade my seat to Extra Legroom row 14 and verify my gluten-free meal request?", at: new Date(Date.now() - 15 * 60000).toISOString(), read: false },
    ],
    aiSuggestions: [
      { id: "s7", title: "Confirm Seat 14C & Special Meal", text: "I have assigned seat 14C with 34-inch extra legroom and locked in your Gluten-Free Special Meal (GFML) request.", actionTag: "Ancillary Services" },
    ],
  },
  {
    id: "chat_104",
    ticketId: "TCK-8424",
    passenger: "Priya Nair",
    passengerEmail: "priya.nair@mail.com",
    passengerTier: "Platinum",
    flight: "SW733",
    route: "SIN → SYD",
    seat: "3B (Business)",
    pnr: "SW48291",
    category: "Payment & Invoice",
    online: true,
    unread: 0,
    updatedAt: new Date(Date.now() - 55 * 60000).toISOString(),
    sentiment: "positive",
    messages: [
      { id: "m50", role: "passenger", body: "Please send the official GST tax invoice for booking SW48291 for company reimbursement.", at: new Date(Date.now() - 55 * 60000).toISOString(), read: true },
      { id: "m51", role: "agent", body: "Certainly Ms. Nair! The GST invoice #INV-2026-9912 has been sent to your email priya.nair@mail.com.", at: new Date(Date.now() - 50 * 60000).toISOString(), read: true },
    ],
    aiSuggestions: [
      { id: "s8", title: "Resend Tax Invoice PDF", text: "I've re-dispatched the PDF tax invoice to your registered email address.", actionTag: "Invoice" },
    ],
  },
];

const EMOJIS = ["👍", "✈️", "🎫", "🧳", "🙏", "⏳", "✅", "📞", "🏨", "❤️"];

export function ChatPage() {
  const [threads, setThreads] = useState<ThreadData[]>(INITIAL_THREADS_DATA);
  const [activeId, setActiveId] = useState<string>(INITIAL_THREADS_DATA[0].id);
  const [text, setText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "vip" | "online">("all");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [showPassengerDrawer, setShowPassengerDrawer] = useState(true);
  const [isNewThreadOpen, setIsNewThreadOpen] = useState(false);

  // New Live Thread Form state
  const [newPaxName, setNewPaxName] = useState("");
  const [newPaxEmail, setNewPaxEmail] = useState("");
  const [newPaxTier, setNewPaxTier] = useState<"Silver" | "Gold" | "Platinum" | "Standard">("Gold");
  const [newFlight, setNewFlight] = useState("SW841");
  const [newRoute, setNewRoute] = useState("LHR → CDG");
  const [newSeat, setNewSeat] = useState("3A (Business)");
  const [newPnr, setNewPnr] = useState("SW08419");
  const [newCategory, setNewCategory] = useState("Flight Delay & Cancellation");
  const [newChannel, setNewChannel] = useState("SkyWay Mobile App");
  const [newInitialMsg, setNewInitialMsg] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetThreadForm = () => {
    setNewPaxName("");
    setNewPaxEmail("");
    setNewPaxTier("Gold");
    setNewFlight("SW841");
    setNewRoute("LHR → CDG");
    setNewSeat("3A (Business)");
    setNewPnr(`SW${Math.floor(10000 + Math.random() * 90000)}`);
    setNewCategory("Flight Delay & Cancellation");
    setNewChannel("SkyWay Mobile App");
    setNewInitialMsg("Hello, I need immediate assistance regarding my booking.");
  };

  const handleOpenNewThread = () => {
    resetThreadForm();
    setIsNewThreadOpen(true);
  };

  const handleApplyChatScenario = (scenario: {
    name: string;
    tier: "Silver" | "Gold" | "Platinum" | "Standard";
    flight: string;
    route: string;
    seat: string;
    category: string;
    msg: string;
  }) => {
    setNewPaxName(scenario.name);
    setNewPaxEmail(`${scenario.name.toLowerCase().replace(/[^a-z]+/g, ".")}@mail.com`);
    setNewPaxTier(scenario.tier);
    setNewFlight(scenario.flight);
    setNewRoute(scenario.route);
    setNewSeat(scenario.seat);
    setNewPnr(`SW${Math.floor(10000 + Math.random() * 90000)}`);
    setNewCategory(scenario.category);
    setNewInitialMsg(scenario.msg);
    toast.info(`Loaded scenario for ${scenario.name}`);
  };

  const handleCreateNewThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaxName.trim()) {
      toast.error("Please provide the passenger name.");
      return;
    }

    const threadId = `chat_${Date.now()}`;
    const ticketId = `TCK-${8460 + Math.floor(Math.random() * 1000)}`;
    const email = newPaxEmail.trim() || `${newPaxName.toLowerCase().replace(/[^a-z]+/g, ".")}@mail.com`;
    const initialPassengerMsg = newInitialMsg.trim() || "Hello, I am connected to live support.";

    // Generate intelligent AI Suggestions tailored to the category
    let dynamicAiSuggestions: ThreadData["aiSuggestions"] = [
      { id: `s_${Date.now()}_1`, title: "Acknowledge & Verify PNR", text: `Hello ${newPaxName} — thank you for reaching SkyWay Premium Support. I have retrieved your booking ${newPnr}. How may I best assist you today?`, actionTag: "Greeting" },
      { id: `s_${Date.now()}_2`, title: "Credit 3,000 Goodwill Miles", text: `I have credited 3,000 complimentary goodwill miles to your ${newPaxTier} account for this inconvenience.`, actionTag: "Loyalty Bonus" },
    ];

    if (newCategory.includes("Delay") || newCategory.includes("Cancellation")) {
      dynamicAiSuggestions = [
        { id: `s_${Date.now()}_1`, title: "Offer Immediate Next Rebooking + Hotel", text: `I have reserved a priority seat for you on the next available flight departing in 3 hours, and issued a complimentary airport hotel voucher to your SkyWay wallet.`, actionTag: "Rebooking" },
        { id: `s_${Date.now()}_2`, title: "Issue €25 Meal Voucher", text: `A €25 meal voucher QR code has been generated and pushed to your mobile boarding pass.`, actionTag: "Duty of Care" },
        { id: `s_${Date.now()}_3`, title: "File EU261 Delay Compensation Claim", text: `Your EU261 €400 compensation claim #CLM-${Math.floor(10000 + Math.random() * 90000)} has been initiated for direct bank transfer.`, actionTag: "Compensation" },
      ];
    } else if (newCategory.includes("Baggage")) {
      dynamicAiSuggestions = [
        { id: `s_${Date.now()}_1`, title: "Dispatch Direct VIP Baggage Courier", text: `Your bag was located on incoming flight and will be delivered by dedicated courier directly to your destination hotel tonight.`, actionTag: "Baggage Courier" },
        { id: `s_${Date.now()}_2`, title: "Authorize $150 Incidental Expense Credit", text: `I have approved an immediate $150 emergency expense reimbursement for essential clothing and toiletries.`, actionTag: "Allowance" },
      ];
    } else if (newCategory.includes("Special") || newCategory.includes("Assistance")) {
      dynamicAiSuggestions = [
        { id: `s_${Date.now()}_1`, title: "Confirm Wheelchair & Gate Escort", text: `Wheelchair assistance (SSR WCHR) is confirmed with ground handling. A representative will meet you with priority escort at the gate.`, actionTag: "Special Assistance" },
        { id: `s_${Date.now()}_2`, title: "Alert Purser & Cabin Crew", text: `The in-flight cabin team has been briefed for personalized assistance during boarding and transit.`, actionTag: "Cabin Care" },
      ];
    } else if (newCategory.includes("Upgrade") || newCategory.includes("Meal")) {
      dynamicAiSuggestions = [
        { id: `s_${Date.now()}_1`, title: "Confirm Extra Legroom / Business Seat", text: `I have assigned you seat ${newSeat} with extra legroom and priority boarding privileges.`, actionTag: "Seat Upgrade" },
        { id: `s_${Date.now()}_2`, title: "Lock Special Dietary Meal Request", text: `Your requested special meal preference is locked in with catering for all upcoming flight segments.`, actionTag: "Catering" },
      ];
    }

    const newThreadObj: ThreadData = {
      id: threadId,
      ticketId,
      passenger: newPaxName.trim(),
      passengerEmail: email,
      passengerTier: newPaxTier,
      flight: newFlight,
      route: newRoute,
      seat: newSeat,
      pnr: newPnr,
      category: newCategory,
      online: true,
      unread: 0,
      updatedAt: new Date().toISOString(),
      sentiment: newCategory.includes("Delay") || newCategory.includes("Baggage") ? "negative" : "neutral",
      messages: [
        {
          id: `msg_init_${Date.now()}`,
          role: "passenger",
          body: initialPassengerMsg,
          at: new Date().toISOString(),
          read: true,
        },
        {
          id: `msg_sys_${Date.now()}`,
          role: "ai",
          body: `Passenger joined session via ${newChannel}. Tier: ${newPaxTier} | PNR: ${newPnr} | Flight: ${newFlight} (${newRoute}). AI Copilot loaded relevant SOPs.`,
          at: new Date(Date.now() + 1000).toISOString(),
        },
      ],
      aiSuggestions: dynamicAiSuggestions,
    };

    setThreads((prev) => [newThreadObj, ...prev]);
    setActiveId(threadId);
    setIsNewThreadOpen(false);
    toast.success(`Live chat thread opened for ${newPaxName}!`, {
      description: `Connected on ${newChannel} for flight ${newFlight}.`,
    });
  };

  const activeThread = useMemo(() => {
    return threads.find((t) => t.id === activeId) || threads[0];
  }, [threads, activeId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages?.length, isTyping]);

  // Filtered threads list
  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      const matchSearch =
        searchQuery === "" ||
        t.passenger.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.flight.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.pnr.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (filterTab === "unread") return t.unread > 0;
      if (filterTab === "vip") return t.passengerTier === "Gold" || t.passengerTier === "Platinum";
      if (filterTab === "online") return t.online;
      return true;
    });
  }, [threads, searchQuery, filterTab]);

  // Switch active thread & mark unread as 0
  const handleSelectThread = (id: string) => {
    setActiveId(id);
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, unread: 0 } : t))
    );
  };

  // Send message
  const handleSendMessage = (contentToSend?: string) => {
    const messageContent = (contentToSend || text).trim();
    if (!messageContent && !attachedFile) return;

    let fullBody = messageContent;
    if (attachedFile) {
      fullBody += `\n📎 [Attachment: ${attachedFile}]`;
    }

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "agent",
      body: fullBody,
      at: new Date().toISOString(),
      read: true,
    };

    // Update active thread
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThread.id) {
          return {
            ...t,
            updatedAt: new Date().toISOString(),
            messages: [...t.messages, newMsg],
          };
        }
        return t;
      })
    );

    setText("");
    setAttachedFile(null);
    setShowEmojiPicker(false);
    toast.success("Message sent to passenger.");

    // Simulate realistic passenger auto-response after 1.8 seconds
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const passengerReplies: Record<string, string[]> = {
        "chat_100": [
          "Thank you so much! That makes things much easier. Will the meal voucher show directly in my SkyWay app wallet?",
          "Received the confirmation! I truly appreciate your prompt help with the Sofitel booking.",
        ],
        "chat_101": [
          "Perfect, thank you! The concierge at Marina Bay Sands is briefed to receive it on my behalf.",
          "Understood. Thanks for keeping me updated on the baggage status.",
        ],
        "chat_102": [
          "Thank you, that gives our family huge peace of mind. Have a wonderful day!",
        ],
        "chat_103": [
          "Awesome, 14C is ideal. Looking forward to the flight!",
        ],
        "chat_104": [
          "Got the PDF in my inbox, thank you for the swift turnaround.",
        ],
      };

      const replies = passengerReplies[activeThread.id] || [
        "Thank you for the update! Please let me know if there's any further action needed from my side.",
      ];
      const autoReplyText = replies[Math.floor(Math.random() * replies.length)];

      const paxMsg: ChatMessage = {
        id: `pax_${Date.now()}`,
        role: "passenger",
        body: autoReplyText,
        at: new Date().toISOString(),
        read: true,
      };

      setThreads((prev) =>
        prev.map((t) => {
          if (t.id === activeThread.id) {
            return {
              ...t,
              updatedAt: new Date().toISOString(),
              messages: [...t.messages, paxMsg],
            };
          }
          return t;
        })
      );
    }, 1800);
  };

  // Quick Action Buttons
  const handleIssueMealVoucher = () => {
    const voucherMsg = "✅ [SYSTEM GENERATED] €25 / $30 Airport Meal Voucher voucher #MV-2026-9812 issued to passenger digital wallet.";
    handleSendMessage(voucherMsg);
    toast.success("Issued €25 Airport Meal Voucher.");
  };

  const handleIssueGoodwillMiles = () => {
    const milesMsg = "✨ [LOYALTY CREDIT] 5,000 SkyWay Rewards Goodwill Miles credited to passenger account.";
    handleSendMessage(milesMsg);
    toast.success("Credited 5,000 Goodwill Miles to account.");
  };

  const handleRebookFlight = () => {
    const rebookMsg = `✈️ [REBOOKING CONFIRMATION] Passenger confirmed on alternate flight SW846 departing tomorrow 08:15. E-ticket updated.`;
    handleSendMessage(rebookMsg);
    toast.success("Flight rebooking confirmed.");
  };

  const handleResolveChat = () => {
    toast.success(`Chat session for ${activeThread.passenger} marked as RESOLVED.`);
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              messages: [
                ...t.messages,
                {
                  id: `sys_${Date.now()}`,
                  role: "ai",
                  body: `Chat resolved by Support Agent at ${new Date().toLocaleTimeString()}. Case summary logged to Ticket ${t.ticketId}.`,
                  at: new Date().toISOString(),
                },
              ],
            }
          : t
      )
    );
  };

  const handleTransferToSupervisor = () => {
    toast.info(`Transferring ${activeThread.passenger} to Senior OCC Supervisor desk.`);
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              messages: [
                ...t.messages,
                {
                  id: `sys_${Date.now()}`,
                  role: "ai",
                  body: `⚠️ Transferred to Senior Operations Specialist (OCC Desk). Priority queue assigned.`,
                  at: new Date().toISOString(),
                },
              ],
            }
          : t
      )
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file.name);
      toast.info(`Attached file: ${file.name}`);
    }
  };

  return (
    <>
      <SupportTopbar
        crumbs={[{ label: "Support", to: "/support" }, { label: "Live Chat Console" }]}
        action={{
          label: "New Live Thread",
          onClick: handleOpenNewThread,
        }}
      />

      <main className="flex flex-1 min-h-0 gap-4 p-4 lg:p-6 overflow-hidden">
        {/* Left Sidebar: Threads List */}
        <aside className="w-80 shrink-0 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {/* Header & Search */}
          <div className="border-b border-border p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-sky-accent" />
                <span className="text-sm font-semibold">Active Channels</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                  {threads.filter((t) => t.online).length} Live
                </span>
                <button
                  type="button"
                  onClick={handleOpenNewThread}
                  title="Open New Live Thread"
                  className="grid h-6 w-6 place-items-center rounded-md bg-sky-dark text-white hover:opacity-90 transition shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search passenger, flight, PNR…"
                className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-xs outline-none focus:border-sky-accent focus:ring-1 focus:ring-sky-accent/30"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1">
              {(["all", "unread", "vip", "online"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`flex-1 rounded-md py-1 text-[11px] font-medium capitalize transition-colors ${
                    filterTab === tab
                      ? "bg-sky-dark text-white font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Threads Scrollable List */}
          <ul className="flex-1 overflow-y-auto divide-y divide-border/50">
            {filteredThreads.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No active conversations matching filter.
              </div>
            ) : (
              filteredThreads.map((t) => {
                const isSelected = activeId === t.id;
                const lastMsg = t.messages[t.messages.length - 1];

                return (
                  <li key={t.id}>
                    <button
                      onClick={() => handleSelectThread(t.id)}
                      className={`w-full p-3 text-left transition-colors flex items-start gap-3 hover:bg-muted/50 ${
                        isSelected ? "bg-muted/80 border-l-4 border-l-sky-accent" : ""
                      }`}
                    >
                      <div className="relative shrink-0 mt-0.5">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-sky-dark text-xs font-semibold text-sky-gold">
                          {t.passenger.slice(0, 2).toUpperCase()}
                        </div>
                        {t.online && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500 animate-pulse" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-xs font-semibold text-foreground flex items-center gap-1.5">
                            {t.passenger}
                            {t.passengerTier === "Platinum" && (
                              <span className="rounded bg-purple-500/15 px-1 py-0.2 text-[9px] font-bold text-purple-600">VIP</span>
                            )}
                            {t.passengerTier === "Gold" && (
                              <span className="rounded bg-amber-500/15 px-1 py-0.2 text-[9px] font-bold text-amber-600">GOLD</span>
                            )}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {new Date(t.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        <div className="mt-0.5 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="font-mono text-[10px] text-sky-accent">{t.flight} · {t.route}</span>
                          {t.unread > 0 && (
                            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-sky-accent px-1 text-[10px] font-bold text-white">
                              {t.unread}
                            </span>
                          )}
                        </div>

                        <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                          {lastMsg ? lastMsg.body : "New thread initiated..."}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </aside>

        {/* Center: Live Chat Window */}
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {/* Active Chat Topbar */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-sky-dark font-display text-sm font-bold text-sky-gold">
                  {activeThread.passenger.slice(0, 2).toUpperCase()}
                </div>
                {activeThread.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-sm">{activeThread.passenger}</h2>
                  <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                    {activeThread.ticketId}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">PNR: {activeThread.pnr}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="text-sky-accent font-medium">{activeThread.flight} ({activeThread.route})</span>
                  <span>·</span>
                  <span>Seat {activeThread.seat}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live on mobile app
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleResolveChat}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                title="Mark ticket & chat as resolved"
              >
                <Check className="h-3.5 w-3.5" /> Resolve
              </button>

              <button
                type="button"
                onClick={handleTransferToSupervisor}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                title="Transfer to Senior OCC Supervisor"
              >
                <PhoneCall className="h-3.5 w-3.5" /> Transfer
              </button>

              <button
                type="button"
                onClick={() => setShowPassengerDrawer((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  showPassengerDrawer ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <User className="h-3.5 w-3.5" /> 360 View
              </button>
            </div>
          </div>

          {/* AI Suggestions Pill Bar */}
          {activeThread.aiSuggestions && activeThread.aiSuggestions.length > 0 && (
            <div className="border-b border-border/80 bg-sky-accent/5 p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-accent">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI Copilot Smart Recommendations</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Click to insert reply</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {activeThread.aiSuggestions.map((sug) => (
                  <button
                    key={sug.id}
                    onClick={() => {
                      setText(sug.text);
                      toast.info(`Loaded AI recommendation: "${sug.title}"`);
                    }}
                    className="group inline-flex items-center gap-1.5 rounded-lg border border-sky-accent/30 bg-card px-2.5 py-1.5 text-left text-xs hover:border-sky-accent hover:bg-sky-accent/10 transition-all shadow-xs"
                  >
                    <span className="font-medium text-sky-accent group-hover:text-foreground">{sug.title}</span>
                    {sug.actionTag && (
                      <span className="rounded bg-sky-accent/20 px-1 py-0.2 text-[9px] font-semibold text-sky-accent">
                        {sug.actionTag}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 space-y-3.5 overflow-y-auto p-4 bg-muted/10">
            {activeThread.messages.map((m) => {
              if (m.role === "ai") {
                return (
                  <div key={m.id} className="mx-auto max-w-xl rounded-xl border border-sky-accent/30 bg-card p-3 shadow-xs">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-sky-accent">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" /> AI Policy Co-pilot
                      </div>
                      <span className="text-[10px] text-muted-foreground">{new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p className="mt-1 text-xs text-foreground/90 leading-relaxed">{m.body}</p>
                  </div>
                );
              }

              const isAgent = m.role === "agent";
              return (
                <div key={m.id} className={`flex ${isAgent ? "justify-end" : "justify-start"}`}>
                  <div className={`flex max-w-lg items-end gap-2 ${isAgent ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                      isAgent ? "bg-sky-dark text-white" : "bg-sky-accent/20 text-sky-accent"
                    }`}>
                      {isAgent ? "YOU" : activeThread.passenger.slice(0, 2).toUpperCase()}
                    </div>

                    <div className={`rounded-2xl px-4 py-2.5 text-sm shadow-xs leading-relaxed ${
                      isAgent
                        ? "bg-sky-dark text-white rounded-br-xs"
                        : "bg-card border border-border text-foreground rounded-bl-xs"
                    }`}>
                      <p className="whitespace-pre-line">{m.body}</p>
                      <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                        isAgent ? "text-white/60" : "text-muted-foreground"
                      }`}>
                        <span>{new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {isAgent && <CheckCheck className="h-3 w-3 text-sky-gold" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse pl-9">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
                </div>
                <span>{activeThread.passenger} is typing…</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          />

          {/* Composer */}
          <div className="border-t border-border p-3 bg-card">
            {attachedFile && (
              <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-sky-accent/40 bg-sky-accent/10 px-2.5 py-1 text-xs text-sky-accent">
                <FileText className="h-3.5 w-3.5" />
                <span>{attachedFile}</span>
                <button onClick={() => setAttachedFile(null)} className="rounded p-0.5 hover:bg-sky-accent/20">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {showEmojiPicker && (
              <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-border bg-background p-1.5 shadow-md">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setText((prev) => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="grid h-7 w-7 place-items-center rounded hover:bg-muted text-base"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Attach voucher or e-ticket"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Add quick emoji reaction"
                >
                  <Smile className="h-4 w-4" />
                </button>
              </div>

              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type reply to passenger (Enter to send)…"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-sky-accent focus:ring-1 focus:ring-sky-accent/30"
              />

              <button
                type="submit"
                disabled={!text.trim() && !attachedFile}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                <Send className="h-3.5 w-3.5" /> Send
              </button>
            </form>
          </div>
        </section>

        {/* Right: Passenger 360 Quick Drawer */}
        {showPassengerDrawer && (
          <aside className="hidden xl:flex w-80 shrink-0 flex-col overflow-y-auto rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <User className="h-4 w-4 text-sky-accent" />
                <span>Passenger 360</span>
              </div>
              <span className="rounded-full bg-sky-accent/15 px-2 py-0.5 text-[10px] font-bold text-sky-accent">
                {activeThread.passengerTier} Tier
              </span>
            </div>

            {/* Profile Overview */}
            <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2 text-xs">
              <div className="font-semibold text-foreground text-sm">{activeThread.passenger}</div>
              <div className="text-muted-foreground">{activeThread.passengerEmail}</div>
              <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px]">
                <span className="text-muted-foreground">Rewards Miles:</span>
                <span className="font-semibold text-sky-gold">48,250 PTS</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Lifetime Trips:</span>
                <span className="font-semibold">34 Flights</span>
              </div>
            </div>

            {/* Flight Context */}
            <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sky-accent">{activeThread.flight}</span>
                <span className="font-mono text-[10px] text-muted-foreground">PNR: {activeThread.pnr}</span>
              </div>
              <div className="text-sm font-medium">{activeThread.route}</div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Seat: {activeThread.seat}</span>
                <span className="text-emerald-500 font-medium">Baggage: 2 Pcs Loaded</span>
              </div>
            </div>

            {/* One-Click Operations Actions */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                One-Click Quick Actions
              </div>

              <button
                type="button"
                onClick={handleIssueMealVoucher}
                className="w-full flex items-center justify-between rounded-lg border border-border bg-background p-2 text-xs font-medium hover:border-sky-accent hover:bg-sky-accent/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Gift className="h-3.5 w-3.5 text-amber-500" />
                  <span>Issue €25 Meal Voucher</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              <button
                type="button"
                onClick={handleIssueGoodwillMiles}
                className="w-full flex items-center justify-between rounded-lg border border-border bg-background p-2 text-xs font-medium hover:border-sky-accent hover:bg-sky-accent/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                  <span>Add 5,000 Goodwill Miles</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              <button
                type="button"
                onClick={handleRebookFlight}
                className="w-full flex items-center justify-between rounded-lg border border-border bg-background p-2 text-xs font-medium hover:border-sky-accent hover:bg-sky-accent/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Plane className="h-3.5 w-3.5 text-sky-accent" />
                  <span>Rebook Alternate Flight</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </aside>
        )}
      </main>

      {/* New Live Thread Modal */}
      {isNewThreadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-dark text-sky-gold">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Initiate New Live Chat Thread</h2>
                  <p className="text-xs text-muted-foreground">Start real-time passenger interaction session with AI Copilot</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewThreadOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Launch Scenarios */}
            <div className="border-b border-border bg-muted/15 px-6 py-2.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                <Sparkles className="h-3.5 w-3.5 text-sky-accent" />
                <span className="font-semibold text-foreground">Launch Preset Scenario:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    name: "Elena Rossi",
                    tier: "Gold" as const,
                    flight: "SW841",
                    route: "LHR → CDG",
                    seat: "4A (Business)",
                    category: "Flight Delay & Cancellation",
                    msg: "Hi, my flight SW841 was cancelled and I need emergency hotel accommodation and morning rebooking.",
                  },
                  {
                    name: "Michael O'Brien",
                    tier: "Platinum" as const,
                    flight: "SW214",
                    route: "DEL → SIN",
                    seat: "2K (First)",
                    category: "Lost Baggage",
                    msg: "Hello! My black Rimowa suitcase with PIR tag SW-BAG-9921 did not arrive at Singapore Changi.",
                  },
                  {
                    name: "Aiko Sato",
                    tier: "Silver" as const,
                    flight: "SW508",
                    route: "DXB → SIN",
                    seat: "18C (Economy Flex)",
                    category: "Special Assistance",
                    msg: "Could you please confirm if wheelchair assistance (WCHR) is arranged for my mother at Dubai?",
                  },
                  {
                    name: "David Clark",
                    tier: "Platinum" as const,
                    flight: "SW902",
                    route: "JFK → LHR",
                    seat: "1A (First Suite)",
                    category: "Seat Upgrade & Meal",
                    msg: "I would like to confirm my First Suite upgrade and reserve the lobster thermidor meal.",
                  },
                ].map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => handleApplyChatScenario(s)}
                    className="rounded-md border border-border/80 bg-background px-2.5 py-1 text-[11px] hover:border-sky-accent hover:bg-sky-500/10 hover:text-sky-500 transition-colors"
                  >
                    {s.name} ({s.flight})
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateNewThread} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Passenger Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      required
                      value={newPaxName}
                      onChange={(e) => setNewPaxName(e.target.value)}
                      placeholder="e.g. Elena Rossi"
                      className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs outline-none focus:border-sky-accent focus:ring-1 focus:ring-sky-accent/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={newPaxEmail}
                    onChange={(e) => setNewPaxEmail(e.target.value)}
                    placeholder="e.g. elena.rossi@mail.com"
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent focus:ring-1 focus:ring-sky-accent/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">SkyWay Member Tier</label>
                  <select
                    value={newPaxTier}
                    onChange={(e) => setNewPaxTier(e.target.value as any)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  >
                    <option value="Platinum">Platinum (VIP Priority)</option>
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Flight Number</label>
                  <select
                    value={newFlight}
                    onChange={(e) => setNewFlight(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs font-mono outline-none focus:border-sky-accent"
                  >
                    {["SW101", "SW214", "SW508", "SW612", "SW733", "SW841", "SW902", "SW118"].map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Flight Route</label>
                  <input
                    value={newRoute}
                    onChange={(e) => setNewRoute(e.target.value)}
                    placeholder="e.g. LHR → CDG"
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent focus:ring-1 focus:ring-sky-accent/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Assigned Seat</label>
                  <input
                    value={newSeat}
                    onChange={(e) => setNewSeat(e.target.value)}
                    placeholder="e.g. 4A (Business)"
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent focus:ring-1 focus:ring-sky-accent/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">PNR Reference</label>
                  <input
                    value={newPnr}
                    onChange={(e) => setNewPnr(e.target.value)}
                    placeholder="e.g. SW08419"
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs uppercase font-mono outline-none focus:border-sky-accent focus:ring-1 focus:ring-sky-accent/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Contact Channel</label>
                  <select
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                  >
                    <option value="SkyWay Mobile App">SkyWay Mobile App</option>
                    <option value="Web Live Chat">Web Live Chat</option>
                    <option value="WhatsApp VIP Priority">WhatsApp VIP Priority</option>
                    <option value="Airport Lounge Kiosk">Airport Lounge Kiosk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Support Topic / Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs outline-none focus:border-sky-accent"
                >
                  <option value="Flight Delay & Cancellation">Flight Delay & Cancellation (Rebooking / Duty of Care)</option>
                  <option value="Lost Baggage">Lost Baggage & PIR Tracking</option>
                  <option value="Special Assistance">Special Assistance & Accessibility (WCHR)</option>
                  <option value="Seat Upgrade & Meal">Seat Upgrade & Special Catering</option>
                  <option value="Payment & Invoice">Payment, Invoice & Billing</option>
                  <option value="Emergency Disruption">Emergency Disruption Management</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Passenger Opening Message</label>
                <textarea
                  rows={3}
                  value={newInitialMsg}
                  onChange={(e) => setNewInitialMsg(e.target.value)}
                  placeholder="Initial question or issue description from the passenger..."
                  className="w-full rounded-lg border border-border bg-background p-3 text-xs outline-none focus:border-sky-accent focus:ring-1 focus:ring-sky-accent/30"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsNewThreadOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-dark px-5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition"
                >
                  <MessageSquare className="h-4 w-4" /> Start Live Thread
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
