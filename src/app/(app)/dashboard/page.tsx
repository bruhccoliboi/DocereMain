"use client";

import Link from "next/link";
import { differenceInMinutes, format, parseISO, isAfter } from "date-fns";
import {
  Clock,
  FileText,
  CreditCard,
  RefreshCw,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useDocereStore } from "@/lib/store";
import {
  formatCurrency,
  formatSessionTime,
  getOutstandingMakeups,
  getSessionsNeedingNotes,
  getSessionsToday,
  getUpcomingSessions,
  getWeeklySnapshot,
  computePaymentStatus,
} from "@/lib/utils";

export default function DashboardPage() {
  const learners = useDocereStore((s) => s.learners);
  const sessions = useDocereStore((s) => s.sessions);
  const sessionNotes = useDocereStore((s) => s.sessionNotes);
  const payments = useDocereStore((s) => s.payments);
  const billingProfiles = useDocereStore((s) => s.billingProfiles);
  const makeupObligations = useDocereStore((s) => s.makeupObligations);
  const profile = useDocereStore((s) => s.profile);

  const todaySessions = getSessionsToday(sessions);
  const upcoming = getUpcomingSessions(sessions);
  const pendingNotes = getSessionsNeedingNotes(sessions, sessionNotes);
  const makeups = getOutstandingMakeups(makeupObligations);
  const weekly = getWeeklySnapshot(sessions, payments);

  const overduePayments = learners.filter((l) => {
    const billing = billingProfiles.find((b) => b.learnerId === l.id);
    const status = computePaymentStatus(billing, payments, l.id);
    return status === "overdue" || status === "due_soon";
  });

  const getLearnerName = (id: string) =>
    learners.find((l) => l.id === id)?.name ?? "Unknown";

  const now = new Date();

  return (
    <>
      <Header title="Today" />

      <div className="p-6 space-y-6 max-w-6xl">
        {/* Today timeline */}
        <section>
          <Card
            title="Today's sessions"
            subtitle={
              todaySessions.length > 0
                ? `${todaySessions.length} session${todaySessions.length > 1 ? "s" : ""}`
                : undefined
            }
            action={
              <Link
                href="/schedule"
                className="text-xs text-olive hover:text-sage flex items-center gap-1"
              >
                Schedule <ArrowRight className="w-3 h-3" />
              </Link>
            }
          >
            {todaySessions.length === 0 ? (
              <EmptyState
                icon={<Calendar className="w-6 h-6" />}
                title="No sessions today"
                description="Your calendar is clear. Add sessions from the schedule or prepare in Studio Mode."
                action={{
                  label: "Open schedule",
                  onClick: () => (window.location.href = "/schedule"),
                }}
                className="py-8"
              />
            ) : (
              <div className="space-y-3">
                {todaySessions.map((session) => {
                  const start = parseISO(session.startAt);
                  const minsUntil = differenceInMinutes(start, now);
                  const isNow =
                    minsUntil <= 0 &&
                    isAfter(parseISO(session.endAt), now);

                  return (
                    <Link
                      key={session.id}
                      href={`/studio?session=${session.id}`}
                      className="flex items-center gap-4 p-3 rounded-lg bg-surface-2 border border-[var(--border-subtle)] hover:border-olive/30 transition-all group"
                    >
                      <div className="w-12 text-center shrink-0">
                        <p className="font-mono-data text-xs text-olive">
                          {format(start, "HH:mm")}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading text-sm font-medium text-text-primary truncate">
                          {getLearnerName(session.learnerId)}
                        </p>
                        <p className="text-xs text-text-muted font-mono-data">
                          {formatSessionTime(session.startAt, session.endAt)}
                        </p>
                      </div>
                      {isNow ? (
                        <Badge variant="olive">Now</Badge>
                      ) : minsUntil > 0 ? (
                        <span className="text-xs font-mono-data text-amber flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {minsUntil < 60
                            ? `${minsUntil}m`
                            : `${Math.floor(minsUntil / 60)}h ${minsUntil % 60}m`}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming 7 days */}
          <Card title="Upcoming" subtitle="Next 7 days">
            {upcoming.length === 0 ? (
              <p className="text-sm text-text-muted py-4">
                No upcoming sessions scheduled.
              </p>
            ) : (
              <ul className="space-y-2">
                {upcoming.slice(0, 5).map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between text-sm py-2 border-b border-[var(--border-subtle)] last:border-0"
                  >
                    <span className="text-text-primary">
                      {getLearnerName(s.learnerId)}
                    </span>
                    <span className="font-mono-data text-xs text-text-muted">
                      {format(parseISO(s.startAt), "EEE, MMM d · h:mm a")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Weekly snapshot */}
          <Card title="Weekly snapshot">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Completed", value: weekly.sessionsCompleted },
                { label: "Remaining", value: weekly.sessionsRemaining },
                {
                  label: "Teaching hours",
                  value: weekly.teachingHours,
                  mono: true,
                },
                {
                  label: "Revenue",
                  value: formatCurrency(
                    weekly.revenueEarned,
                    profile?.currency,
                  ),
                  mono: true,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-3 rounded-lg bg-surface-2 border border-[var(--border-subtle)]"
                >
                  <p className="text-xs text-text-muted mb-1">{stat.label}</p>
                  <p
                    className={`text-lg font-semibold text-text-primary ${stat.mono ? "font-mono-data" : "font-heading"}`}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card title="Pending notes" padding="sm">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-amber shrink-0" />
              <div>
                <p className="font-mono-data text-2xl font-semibold">
                  {pendingNotes.length}
                </p>
                <p className="text-xs text-text-muted">Need documentation</p>
              </div>
            </div>
            {pendingNotes.length > 0 && (
              <Link
                href={`/learners/${pendingNotes[0].learnerId}`}
                className="mt-3 text-xs text-olive hover:text-sage block"
              >
                Document latest session
              </Link>
            )}
          </Card>

          <Card title="Payments" padding="sm">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-brass shrink-0" />
              <div>
                <p className="font-mono-data text-2xl font-semibold">
                  {overduePayments.length}
                </p>
                <p className="text-xs text-text-muted">Due or overdue</p>
              </div>
            </div>
            <Link
              href="/payments"
              className="mt-3 text-xs text-olive hover:text-sage block"
            >
              View payments
            </Link>
          </Card>

          <Card title="Makeup lessons" padding="sm">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-sage shrink-0" />
              <div>
                <p className="font-mono-data text-2xl font-semibold">
                  {makeups.length}
                </p>
                <p className="text-xs text-text-muted">Outstanding</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
