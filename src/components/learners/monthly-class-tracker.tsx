"use client";

import { useEffect, useRef, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClassLog, ClassMissReason } from "@/lib/types";
import { CLASS_MISS_REASON_LABELS, cn } from "@/lib/utils";

const MISS_REASONS: ClassMissReason[] = [
  "rescheduled",
  "student_unwell",
  "out_of_station",
  "instructor_unavailable",
];

const MISS_SHORT: Record<ClassMissReason, string> = {
  rescheduled: "Resched.",
  student_unwell: "Unwell",
  out_of_station: "Away",
  instructor_unavailable: "Unavailable",
};

interface MonthlyClassTrackerProps {
  month: Date;
  onMonthChange: (date: Date) => void;
  logsByDate: Map<string, ClassLog>;
  onSetConducted: (dateStr: string) => void;
  onSetMissed: (dateStr: string, reason: ClassMissReason) => void;
  onClearDate: (dateStr: string) => void;
}

export function MonthlyClassTracker({
  month,
  onMonthChange,
  logsByDate,
  onSetConducted,
  onSetMissed,
  onClearDate,
}: MonthlyClassTrackerProps) {
  const [menuDate, setMenuDate] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  const startPad = (start.getDay() + 6) % 7;
  const today = new Date();

  useEffect(() => {
    if (!menuDate) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuDate(null);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuDate]);

  const closeMenu = () => setMenuDate(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))
          }
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-heading text-sm font-semibold">
          {format(month, "MMMM yyyy")}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))
          }
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div
            key={`${d}-${i}`}
            className="text-center text-[10px] text-text-muted font-mono-data py-1"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 relative">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const log = logsByDate.get(dateStr);
          const conducted = log?.status === "conducted";
          const missed = log?.status === "missed";
          const isToday = isSameDay(day, today);
          const inMonth = isSameMonth(day, month);
          const menuOpen = menuDate === dateStr;

          return (
            <div key={dateStr} className="relative">
              <button
                type="button"
                title={
                  missed && log.missReason
                    ? CLASS_MISS_REASON_LABELS[log.missReason]
                    : conducted
                      ? "Class held"
                      : "Tap to log class"
                }
                onClick={() => setMenuDate(menuOpen ? null : dateStr)}
                className={cn(
                  "w-full aspect-square rounded-lg text-xs font-mono-data flex flex-col items-center justify-center gap-0.5 border transition-all px-0.5",
                  inMonth ? "bg-surface-2" : "opacity-30",
                  conducted &&
                    "border-olive bg-olive/25 text-cream",
                  missed &&
                    "border-amber/60 bg-amber/10 text-amber",
                  !conducted &&
                    !missed &&
                    "border-[var(--border-subtle)] hover:border-olive/40",
                  isToday && !conducted && !missed && "ring-1 ring-olive/50",
                  menuOpen && "ring-2 ring-olive/60",
                )}
              >
                <span>{format(day, "d")}</span>
                {conducted && (
                  <Check className="w-3 h-3 text-olive" strokeWidth={3} />
                )}
                {missed && (
                  <>
                    <X className="w-3 h-3" strokeWidth={2.5} />
                    {log.missReason && (
                      <span className="text-[8px] leading-none truncate max-w-full opacity-90">
                        {MISS_SHORT[log.missReason]}
                      </span>
                    )}
                  </>
                )}
              </button>

              {menuOpen && (
                <div
                  ref={menuRef}
                  className="absolute z-20 left-1/2 -translate-x-1/2 top-full mt-1 w-[min(12rem,calc(100vw-3rem))] rounded-lg border border-[var(--border-strong)] bg-surface-1 shadow-xl p-1.5"
                >
                  <p className="text-[10px] text-text-muted px-2 py-1 font-heading">
                    {format(day, "EEE, MMM d")}
                  </p>
                  <button
                    type="button"
                    className="w-full text-left text-xs px-2 py-2 rounded-md hover:bg-olive/15 text-text-primary"
                    onClick={() => {
                      onSetConducted(dateStr);
                      closeMenu();
                    }}
                  >
                    Class held
                  </button>
                  <p className="text-[10px] text-text-muted px-2 pt-1.5 pb-0.5">
                    Did not happen
                  </p>
                  {MISS_REASONS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      className="w-full text-left text-xs px-2 py-2 rounded-md hover:bg-amber/10 text-text-secondary hover:text-text-primary"
                      onClick={() => {
                        onSetMissed(dateStr, reason);
                        closeMenu();
                      }}
                    >
                      {CLASS_MISS_REASON_LABELS[reason]}
                    </button>
                  ))}
                  {log && (
                    <button
                      type="button"
                      className="w-full text-left text-xs px-2 py-2 mt-1 rounded-md border-t border-[var(--border-subtle)] text-text-muted hover:text-text-primary"
                      onClick={() => {
                        onClearDate(dateStr);
                        closeMenu();
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mt-4 text-[10px] text-text-muted">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded border border-olive bg-olive/25" />
          Held
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded border border-amber/60 bg-amber/10" />
          Did not happen
        </span>
      </div>
    </div>
  );
}
