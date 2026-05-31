"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format, setHours, setMinutes, addMinutes } from "date-fns";
import { Plus, Repeat } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarView } from "@/components/schedule/calendar-view";
import { SessionNoteEditor } from "@/components/session/session-note-editor";
import { useDocereStore } from "@/lib/store";
import type { TeachingSession } from "@/lib/types";
import { toast } from "sonner";

function ScheduleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedLearner = searchParams.get("learner");

  const learners = useDocereStore((s) => s.learners);
  const addSession = useDocereStore((s) => s.addSession);
  const addRecurringRule = useDocereStore((s) => s.addRecurringRule);
  const generateRecurringSessions = useDocereStore((s) => s.generateRecurringSessions);
  const completeSession = useDocereStore((s) => s.completeSession);
  const rescheduleSession = useDocereStore((s) => s.rescheduleSession);
  const deleteSession = useDocereStore((s) => s.deleteSession);

  const [showForm, setShowForm] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [learnerId, setLearnerId] = useState(preselectedLearner ?? "");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState("16:00");
  const [duration, setDuration] = useState("60");
  const [recurDay, setRecurDay] = useState("1");
  const [recurTime, setRecurTime] = useState("16:00");
  const [selectedSession, setSelectedSession] = useState<TeachingSession | null>(null);
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [sessionDetail, setSessionDetail] = useState<TeachingSession | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const getLearnerName = (id: string) =>
    learners.find((l) => l.id === id)?.name ?? "Unknown";

  const createSession = () => {
    if (!learnerId || !date) return;
    const [h, m] = time.split(":").map(Number);
    const start = setMinutes(setHours(new Date(`${date}T00:00:00`), h), m);
    const end = addMinutes(start, parseInt(duration, 10) || 60);

    addSession({
      learnerId,
      title: `Session with ${getLearnerName(learnerId)}`,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      status: "scheduled",
      attendance: "scheduled",
      isGroup: false,
    });
    setShowForm(false);
    toast.success("Session scheduled");
  };

  const createRecurring = () => {
    if (!learnerId) return;
    const day = parseInt(recurDay, 10);
    const existing = useDocereStore
      .getState()
      .recurringRules.find(
        (r) =>
          r.active &&
          r.learnerId === learnerId &&
          r.dayOfWeek === day &&
          r.startTime === recurTime,
      );
    if (existing) {
      const count = generateRecurringSessions(12, existing.id);
      setShowRecurring(false);
      toast.success(
        count > 0 ? `${count} sessions added` : "Schedule already up to date",
      );
      return;
    }
    const ruleId = addRecurringRule({
      learnerId,
      title: `Weekly with ${getLearnerName(learnerId)}`,
      dayOfWeek: day,
      startTime: recurTime,
      durationMinutes: parseInt(duration, 10) || 60,
      isGroup: false,
      active: true,
    });
    const count = generateRecurringSessions(12, ruleId);
    setShowRecurring(false);
    toast.success(
      count > 0 ? `${count} sessions scheduled` : "Nothing new to add",
    );
  };

  const onSlotClick = (day: Date) => {
    setDate(format(day, "yyyy-MM-dd"));
    setShowForm(true);
  };

  const onSessionClick = (session: TeachingSession) => {
    setConfirmDelete(false);
    setSessionDetail(session);
  };

  const handleDeleteSession = () => {
    if (!sessionDetail) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteSession(sessionDetail.id);
    setSessionDetail(null);
    setConfirmDelete(false);
    toast.success("Session deleted");
  };

  return (
    <>
      <Header title="Schedule" />

      <div className="p-6 max-w-[1400px] space-y-6">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowForm(true)} disabled={learners.length === 0}>
            <Plus className="w-4 h-4" />
            New session
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowRecurring(true)}
            disabled={learners.length === 0}
          >
            <Repeat className="w-4 h-4" />
            Recurring
          </Button>
        </div>

        {showForm && (
          <Card title="Schedule session" animate={false}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-text-secondary block mb-1.5">
                  Learner
                </label>
                <select
                  value={learnerId}
                  onChange={(e) => setLearnerId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-surface-2 border border-[var(--border-subtle)] text-sm"
                >
                  <option value="">Select learner</option>
                  {learners.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <Input label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              <Input
                label="Duration (min)"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={createSession}>Create</Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {showRecurring && (
          <Card title="Recurring schedule" animate={false}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-text-secondary block mb-1.5">
                  Learner
                </label>
                <select
                  value={learnerId}
                  onChange={(e) => setLearnerId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-surface-2 border border-[var(--border-subtle)] text-sm"
                >
                  <option value="">Select</option>
                  {learners.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1.5">
                  Day
                </label>
                <select
                  value={recurDay}
                  onChange={(e) => setRecurDay(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-surface-2 border border-[var(--border-subtle)] text-sm"
                >
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <Input label="Time" type="time" value={recurTime} onChange={(e) => setRecurTime(e.target.value)} />
              <Input
                label="Duration (min)"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={createRecurring}>Create & generate 12 weeks</Button>
              <Button variant="ghost" onClick={() => setShowRecurring(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {sessionDetail && (
          <Card title={getLearnerName(sessionDetail.learnerId)} animate={false}>
            <p className="text-sm font-mono-data text-text-muted mb-4">
              {format(new Date(sessionDetail.startAt), "PPpp")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setSelectedSession(sessionDetail);
                  setNoteEditorOpen(true);
                }}
              >
                Document session
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => router.push(`/studio?session=${sessionDetail.id}`)}
              >
                Studio Mode
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => completeSession(sessionDetail.id, "present")}
              >
                Mark present
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  rescheduleSession(
                    sessionDetail.id,
                    addMinutes(new Date(sessionDetail.startAt), 60 * 24).toISOString(),
                    addMinutes(new Date(sessionDetail.endAt), 60 * 24).toISOString(),
                    "teacher_miss",
                  )
                }
              >
                Reschedule +1 day
              </Button>
              <Button
                size="sm"
                variant={confirmDelete ? "danger" : "ghost"}
                onClick={handleDeleteSession}
              >
                {confirmDelete ? "Confirm delete" : "Delete"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSessionDetail(null);
                  setConfirmDelete(false);
                }}
              >
                Close
              </Button>
            </div>
          </Card>
        )}

        <CalendarView onSessionClick={onSessionClick} onSlotClick={onSlotClick} />
      </div>

      {selectedSession && (
        <SessionNoteEditor
          open={noteEditorOpen}
          onClose={() => {
            setNoteEditorOpen(false);
            setSelectedSession(null);
            setSessionDetail(null);
          }}
          session={selectedSession}
          learnerName={getLearnerName(selectedSession.learnerId)}
        />
      )}
    </>
  );
}

export default function SchedulePage() {
  return (
    <Suspense>
      <ScheduleContent />
    </Suspense>
  );
}
