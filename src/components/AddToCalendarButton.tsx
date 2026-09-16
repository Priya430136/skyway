import React, { useState } from "react";
import {
  Calendar,
  Download,
  ExternalLink,
  ChevronDown,
  Check,
  Smartphone,
  Globe,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CalendarTripData,
  downloadIcsFile,
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
} from "@/lib/calendar-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddToCalendarButtonProps {
  trip: CalendarTripData;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showDropdown?: boolean;
}

export function AddToCalendarButton({
  trip,
  variant = "outline",
  size = "sm",
  className,
  showDropdown = true,
}: AddToCalendarButtonProps) {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownloadIcs = (calendarName = "Apple / Outlook / iCal") => {
    try {
      downloadIcsFile(trip);
      setDownloaded(true);
      toast.success(`Downloaded .ics file for Flight ${trip.flightNumber}`, {
        description: `Import this file into ${calendarName} to sync flight alerts & boarding alarms.`,
      });
      setTimeout(() => setDownloaded(false), 2500);
    } catch (err) {
      console.error("Failed to download .ics:", err);
      toast.error("Failed to generate calendar file. Please try again.");
    }
  };

  const handleOpenGoogleCalendar = () => {
    const url = getGoogleCalendarUrl(trip);
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success(`Opening Google Calendar for Flight ${trip.flightNumber}`);
  };

  const handleOpenOutlookCalendar = () => {
    const url = getOutlookCalendarUrl(trip);
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success(`Opening Outlook Calendar for Flight ${trip.flightNumber}`);
  };

  if (!showDropdown) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => handleDownloadIcs()}
        className={cn("rounded-xl text-xs font-semibold gap-1.5", className)}
      >
        {downloaded ? (
          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        )}
        <span>{downloaded ? "Added to Calendar" : "Add to Calendar"}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          className={cn(
            "rounded-xl text-xs font-semibold gap-1.5 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:hover:bg-slate-800/80 transition-all",
            className
          )}
        >
          {downloaded ? (
            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          )}
          <span>Add to Calendar</span>
          <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 p-1.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <DropdownMenuLabel className="px-3 py-2 text-xs font-black text-slate-800 dark:text-slate-200">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Sync Flight Itinerary</span>
          </div>
          <p className="text-[10px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Includes flight times, terminal, seat & 3h airport alarms
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Apple Calendar / iCal (.ics) */}
        <DropdownMenuItem
          onClick={() => handleDownloadIcs("Apple Calendar")}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs cursor-pointer focus:bg-blue-50 dark:focus:bg-slate-800"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold shrink-0">
            <Smartphone className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
              <span>Apple Calendar (.ics)</span>
              <Download className="h-3 w-3 opacity-60" />
            </div>
            <p className="text-[10px] text-slate-500">iPhone, iPad & Mac Native Sync</p>
          </div>
        </DropdownMenuItem>

        {/* Google Calendar Web */}
        <DropdownMenuItem
          onClick={handleOpenGoogleCalendar}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs cursor-pointer focus:bg-blue-50 dark:focus:bg-slate-800"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold shrink-0">
            <Globe className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
              <span>Google Calendar</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </div>
            <p className="text-[10px] text-slate-500">Add directly in web browser</p>
          </div>
        </DropdownMenuItem>

        {/* Outlook Calendar Web */}
        <DropdownMenuItem
          onClick={handleOpenOutlookCalendar}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs cursor-pointer focus:bg-blue-50 dark:focus:bg-slate-800"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
              <span>Outlook & Office 365</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </div>
            <p className="text-[10px] text-slate-500">Microsoft Calendar web link</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Universal .ics Download */}
        <DropdownMenuItem
          onClick={() => handleDownloadIcs("Universal Calendar")}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs cursor-pointer focus:bg-blue-50 dark:focus:bg-slate-800"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
            <Download className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-slate-900 dark:text-slate-100">
              Download iCalendar File (.ics)
            </div>
            <p className="text-[10px] text-slate-500">Universal RFC 5545 format</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default AddToCalendarButton;
