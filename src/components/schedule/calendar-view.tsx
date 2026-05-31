"use client";

import { useMemo, useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isSameMonth,
  setHours,
  setMinutes,
  differenceInMinutes,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDocereStore } from "@/lib/store";
import type { TeachingSession } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const HOUR_START = 7;
const HOUR_END = 22;
const HOURS = Array.from(
  { length: HOUR_END - HOUR_START },
  (_, i) => HOUR_START + i,
);

type CalView = "day" | "week" | "month";

interface CalendarViewProps {
  onSessionClick?: (session: TeachingSession) => void;
  onSlotClick?: (date: Date) => void;
}

function SessionBlock({
  session,
  learnerName,
  compact,
}: {
  session: TeachingSession;
  learnerName: string;
  compact?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: session.id,
    data: { session },
  });

  const start = parseISO(session.startAt);
  const end = parseISO(session.endAt);
  const durationMin = Math.max(
    30,
    differenceInMinutes(end, start),
  );
  const height = (durationMin / 60) * 48;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ height: compact ? undefined : `${height}px`, minHeight: 28 }}
      className={cn(
        "rounded-md px-2 py-1 text-xs border cursor-grab active:cursor-grabbing overflow-hidden",
        "bg-olive/20 border-olive/40 text-cream hover:bg-olive/30 transition-colors",
        isDragging && "opacity-40",
        session.status === "completed" && "opacity-60 border-sage/30",
        session.status === "rescheduled" && "border-amber/40 bg-amber/10",
      )}
    >
      <p className="font-heading font-medium truncate">{learnerName}</p>
      {!compact && (
        <p className="font-mono-data text-[10px] text-text-muted">
          {format(start, "h:mm")} – {format(end, "h:mm a")}
        </p>
      )}
    </div>
  );
}

function TimeSlotDrop({
  day,
  hour,
  minute,
  children,
}: {
  day: Date;
  hour: number;
  minute: number;
  children?: React.ReactNode;
}) {
  const id = `slot-${format(day, "yyyy-MM-dd")}-${hour}-${minute}`;
  const { setNodeRef, isOver } = useDroppable({ id, data: { day, hour, minute } });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-b border-[var(--border-subtle)]/50 min-h-[24px] relative",
        isOver && "bg-olive/15 ring-1 ring-inset ring-olive/40",
      )}
    >
      {children}
    </div>
  );
}

export function CalendarView({ onSessionClick, onSlotClick }: CalendarViewProps) {
  const [view, setView] = useState<CalView>("day");
  const [cursor, setCursor] = useState(new Date());
  const [activeSession, setActiveSession] = useState<TeachingSession | null>(
    null,
  );

  const sessions = useDocereStore((s) => s.sessions);
  const learners = useDocereStore((s) => s.learners);
  const moveSession = useDocereStore((s) => s.moveSession);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const getName = useCallback(
    (id: string) => learners.find((l) => l.id === id)?.name ?? "?",
    [learners],
  );

  const weekStart = startOfWeek(cursor, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(cursor, { weekStartsOn: 1 }),
  });

  const displayDays = useMemo(() => {
    if (view === "day") return [cursor];
    if (view === "week") return weekDays;
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [view, cursor, weekDays]);

  const sessionsForDay = (day: Date) =>
    sessions.filter((s) => {
      if (s.status === "cancelled") return false;
      return isSameDay(parseISO(s.startAt), day);
    });

  const handleDragStart = (e: DragStartEvent) => {
    const s = e.active.data.current?.session as TeachingSession | undefined;
    if (s) setActiveSession(s);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveSession(null);
    const session = e.active.data.current?.session as TeachingSession | undefined;
    const over = e.over;
    if (!session || !over) return;

    const data = over.data.current as
      | { day: Date; hour: number; minute: number }
      | undefined;
    if (!data) return;

    const duration = differenceInMinutes(
      parseISO(session.endAt),
      parseISO(session.startAt),
    );
    const newStart = setMinutes(
      setHours(new Date(data.day), data.hour),
      data.minute,
    );
    const newEnd = new Date(newStart);
    newEnd.setMinutes(newEnd.getMinutes() + duration);

    moveSession(session.id, newStart.toISOString(), newEnd.toISOString());
  };

  const navigate = (dir: -1 | 1) => {
    if (view === "day") setCursor((d) => addDays(d, dir));
    else if (view === "week") setCursor((d) => (dir > 0 ? addWeeks(d, 1) : subWeeks(d, 1)));
    else setCursor((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="font-heading text-sm font-semibold min-w-[160px] text-center">
            {view === "month"
              ? format(cursor, "MMMM yyyy")
              : view === "week"
                ? `${format(weekDays[0], "MMM d")} – ${format(weekDays[6], "MMM d, yyyy")}`
                : format(cursor, "EEEE, MMMM d")}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>
            Today
          </Button>
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-surface-2 border border-[var(--border-subtle)]">
          {(["day", "week", "month"] as CalView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-heading capitalize",
                view === v
                  ? "bg-olive/20 text-cream"
                  : "text-text-muted hover:text-text-primary",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {view === "month" ? (
          <div className="grid grid-cols-7 gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div
                key={d}
                className="text-center text-[10px] text-text-muted py-1 font-heading"
              >
                {d}
              </div>
            ))}
            {displayDays.map((day) => {
              const daySessions = sessionsForDay(day);
              const inMonth = isSameMonth(day, cursor);
              const today = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => onSlotClick?.(day)}
                  className={cn(
                    "min-h-[88px] p-1.5 rounded-lg border cursor-pointer transition-colors",
                    inMonth ? "bg-surface-1" : "bg-surface-2/30 opacity-50",
                    today ? "border-olive/50" : "border-[var(--border-subtle)]",
                    "hover:border-olive/30",
                  )}
                >
                  <p
                    className={cn(
                      "text-xs font-mono-data mb-1",
                      today ? "text-olive" : "text-text-muted",
                    )}
                  >
                    {format(day, "d")}
                  </p>
                  {daySessions.slice(0, 3).map((s) => (
                    <button
                      key={s.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSessionClick?.(s);
                      }}
                      className="w-full text-left truncate text-[10px] px-1 py-0.5 rounded bg-olive/20 text-cream mb-0.5"
                    >
                      {getName(s.learnerId)}
                    </button>
                  ))}
                  {daySessions.length > 3 && (
                    <p className="text-[10px] text-text-muted">
                      +{daySessions.length - 3} more
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]"
            style={{
              gridTemplateColumns: `48px repeat(${displayDays.length}, minmax(100px, 1fr))`,
            }}
          >
            <div
              className="grid min-w-[600px]"
              style={{
                gridTemplateColumns: `48px repeat(${displayDays.length}, minmax(100px, 1fr))`,
              }}
            >
              <div className="border-r border-[var(--border-subtle)] bg-surface-2/50" />
              {displayDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "text-center py-2 border-b border-r border-[var(--border-subtle)] text-xs font-heading",
                    isSameDay(day, new Date()) && "bg-olive/10 text-olive",
                  )}
                >
                  <p className="text-text-muted">{format(day, "EEE")}</p>
                  <p className="font-mono-data">{format(day, "d")}</p>
                </div>
              ))}

              {HOURS.map((hour) => (
                <div key={hour} className="contents">
                  <div className="border-r border-[var(--border-subtle)] px-1 py-6 text-[10px] font-mono-data text-text-muted text-right">
                    {format(setHours(new Date(), hour), "ha")}
                  </div>
                  {displayDays.map((day) => {
                    const daySessions = sessionsForDay(day);
                    const sessionsForHalfHour = (minute: number) =>
                      daySessions.filter((s) => {
                        const d = parseISO(s.startAt);
                        if (d.getHours() !== hour) return false;
                        return minute === 0
                          ? d.getMinutes() < 30
                          : d.getMinutes() >= 30;
                      });

                    const renderSlot = (minute: number) => {
                      const slotSessions = sessionsForHalfHour(minute);
                      return (
                        <TimeSlotDrop day={day} hour={hour} minute={minute}>
                          <div className="space-y-0.5 min-h-[24px]">
                            {slotSessions.map((s) => (
                              <div
                                key={s.id}
                                className="relative group"
                                onClick={() => onSessionClick?.(s)}
                                onKeyDown={() => {}}
                                role="presentation"
                              >
                                <SessionBlock
                                  session={s}
                                  learnerName={getName(s.learnerId)}
                                  compact
                                />
                              </div>
                            ))}
                          </div>
                        </TimeSlotDrop>
                      );
                    };

                    return (
                      <div
                        key={`${day}-${hour}`}
                        className="border-r border-[var(--border-subtle)] relative"
                      >
                        {renderSlot(0)}
                        {renderSlot(30)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        <DragOverlay>
          {activeSession ? (
            <div className="rounded-md px-3 py-2 bg-olive border border-olive text-cream text-sm shadow-xl">
              {getName(activeSession.learnerId)}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
