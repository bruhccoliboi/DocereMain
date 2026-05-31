"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { format, parseISO, differenceInMinutes } from "date-fns";
import {
  Target,
  BookOpen,
  ClipboardList,
  CreditCard,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SessionTimer } from "@/components/studio/session-timer";
import { SessionNoteEditor } from "@/components/session/session-note-editor";
import { useDocereStore } from "@/lib/store";
import { toast } from "sonner";
import {
  computePaymentStatus,
  formatCurrency,
  getLastSessionForLearner,
  getNextSessionForLearner,
  paymentStatusLabel,
} from "@/lib/utils";

function StudioContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const [noteOpen, setNoteOpen] = useState(false);

  const learners = useDocereStore((s) => s.learners);
  const sessions = useDocereStore((s) => s.sessions);
  const sessionNotes = useDocereStore((s) => s.sessionNotes);
  const learningItems = useDocereStore((s) => s.learningItems);
  const billingProfiles = useDocereStore((s) => s.billingProfiles);
  const payments = useDocereStore((s) => s.payments);
  const completeSession = useDocereStore((s) => s.completeSession);

  const todaySessions = sessions
    .filter((s) => {
      const d = parseISO(s.startAt);
      const now = new Date();
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        s.status === "scheduled"
      );
    })
    .sort(
      (a, b) =>
        parseISO(a.startAt).getTime() - parseISO(b.startAt).getTime(),
    );

  const activeSession =
    sessions.find((s) => s.id === sessionId) ?? todaySessions[0];

  if (!activeSession) {
    return (
      <>
        <Header title="Studio Mode" />
        <EmptyState
          icon={<Sparkles className="w-6 h-6" />}
          title="No session selected"
          description="Open Studio Mode from a scheduled session on your dashboard or learner profile."
          action={{
            label: "Go to Today",
            onClick: () => (window.location.href = "/dashboard"),
          }}
          className="py-24"
        />
      </>
    );
  }

  const learner = learners.find((l) => l.id === activeSession.learnerId);
  if (!learner) return null;

  const lastSession = getLastSessionForLearner(sessions, learner.id);
  const lastNote = lastSession
    ? sessionNotes.find((n) => n.sessionId === lastSession.id)
    : undefined;
  const items = learningItems.filter(
    (i) => i.learnerId === learner.id && i.status === "active",
  );
  const billing = billingProfiles.find((b) => b.learnerId === learner.id);
  const payStatus = computePaymentStatus(billing, payments, learner.id);
  const nextSession = getNextSessionForLearner(sessions, learner.id);
  const durationMin = differenceInMinutes(
    parseISO(activeSession.endAt),
    parseISO(activeSession.startAt),
  );

  return (
    <div className="min-h-full bg-bg-graphite">
      <Header
        title="Studio Mode"
        subtitle={format(parseISO(activeSession.startAt), "EEEE, MMMM d · h:mm a")}
      />

      <div className="p-4 max-w-6xl mx-auto">
        <div className="rounded-2xl border border-olive/20 bg-surface-1 overflow-hidden shadow-[0_0_60px_var(--glow-olive)]">
          {/* Learner header */}
          <div className="px-6 py-4 border-b border-[var(--border-subtle)] bg-gradient-to-r from-olive/10 to-transparent flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-widest mb-1">
                Preparing for
              </p>
              <h2 className="font-heading text-2xl font-semibold text-cream">
                {learner.name}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <SessionTimer defaultMinutes={durationMin} />
              <Badge
                variant={
                  payStatus === "paid" || payStatus === "package_active"
                    ? "success"
                    : payStatus === "overdue"
                      ? "danger"
                      : "amber"
                }
              >
                <CreditCard className="w-3 h-3 mr-1" />
                {paymentStatusLabel(payStatus)}
                {billing && (
                  <span className="ml-1 font-mono-data">
                    {formatCurrency(billing.feeAmount, billing.currency)}
                  </span>
                )}
              </Badge>
            </div>
          </div>

          {/* Studio grid - no scroll design intent */}
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-subtle)]">
            <section className="p-5">
              <h3 className="flex items-center gap-2 text-xs font-heading font-semibold text-olive uppercase tracking-wider mb-3">
                <BookOpen className="w-3.5 h-3.5" />
                Last session
              </h3>
              {lastNote ? (
                <div className="space-y-2 text-sm">
                  <p className="text-text-primary leading-relaxed">
                    {lastNote.summary || lastNote.quickNote}
                  </p>
                  {lastNote.progress && (
                    <p className="text-text-secondary">
                      <span className="text-text-muted">Progress:</span>{" "}
                      {lastNote.progress}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-text-muted italic">
                  {lastSession
                    ? "No notes from last session yet."
                    : "First session together."}
                </p>
              )}
            </section>

            <section className="p-5">
              <h3 className="flex items-center gap-2 text-xs font-heading font-semibold text-olive uppercase tracking-wider mb-3">
                <Target className="w-3.5 h-3.5" />
                Goals & learning
              </h3>
              {learner.goals.length > 0 && (
                <ul className="mb-3 space-y-1">
                  {learner.goals.map((g) => (
                    <li key={g} className="text-sm text-cream">
                      {g}
                    </li>
                  ))}
                </ul>
              )}
              {items.length > 0 ? (
                <ul className="space-y-1.5">
                  {items.slice(0, 5).map((item) => (
                    <li
                      key={item.id}
                      className="text-sm text-text-primary flex justify-between"
                    >
                      <span>{item.title}</span>
                      <span className="text-xs text-text-muted">
                        {item.category}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-muted">No active learning items.</p>
              )}
            </section>

            <section className="p-5">
              <h3 className="flex items-center gap-2 text-xs font-heading font-semibold text-olive uppercase tracking-wider mb-3">
                <ClipboardList className="w-3.5 h-3.5" />
                Homework & focus
              </h3>
              {lastNote?.homework ? (
                <p className="text-sm text-text-primary mb-3">
                  <span className="text-amber">Review:</span> {lastNote.homework}
                </p>
              ) : (
                <p className="text-sm text-text-muted mb-3">No homework assigned.</p>
              )}
              <div className="p-3 rounded-lg bg-olive/10 border border-olive/25">
                <p className="text-xs text-olive mb-1">Suggested focus</p>
                <p className="text-sm text-cream font-medium">
                  {lastNote?.nextSessionFocus ||
                    "Build on last session's progress. Check goals and learning items."}
                </p>
              </div>
            </section>
          </div>

          <div className="px-6 py-4 border-t border-[var(--border-subtle)] flex items-center justify-between bg-surface-2/50">
            <p className="text-xs font-mono-data text-text-muted">
              {nextSession
                ? `Next scheduled: ${format(parseISO(nextSession.startAt), "MMM d")}`
                : "No future sessions scheduled"}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/learners/${learner.id}`}>
                <Button variant="outline" size="sm">
                  Full profile
                </Button>
              </Link>
              <Button size="sm" onClick={() => setNoteOpen(true)}>
                Document session
              </Button>
              {activeSession.status === "scheduled" && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    completeSession(activeSession.id, "present");
                    toast.success("Session marked complete");
                  }}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Complete
                </Button>
              )}
            </div>
          </div>
        </div>

        <SessionNoteEditor
          open={noteOpen}
          onClose={() => setNoteOpen(false)}
          session={activeSession}
          learnerName={learner.name}
        />

        {todaySessions.length > 1 && (
          <div className="mt-4 flex gap-2 flex-wrap">
            <span className="text-xs text-text-muted">Other today:</span>
            {todaySessions
              .filter((s) => s.id !== activeSession.id)
              .map((s) => {
                const l = learners.find((x) => x.id === s.learnerId);
                return (
                  <Link
                    key={s.id}
                    href={`/studio?session=${s.id}`}
                    className="text-xs px-2 py-1 rounded bg-surface-2 border border-[var(--border-subtle)] hover:border-olive/30"
                  >
                    {l?.name}
                  </Link>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense>
      <StudioContent />
    </Suspense>
  );
}
