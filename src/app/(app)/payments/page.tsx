"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  addMonths,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useDocereStore } from "@/lib/store";
import {
  buildMonthlyPaymentReports,
  formatFee,
  getLastPaymentForLearner,
  getMonthlyFeeSummary,
  getTotalPaidInMonth,
  syncPaymentsViewToCalendarMonth,
} from "@/lib/utils";

function PaymentsContent() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("learner");

  const learners = useDocereStore((s) => s.learners);
  const payments = useDocereStore((s) => s.payments);
  const billingProfiles = useDocereStore((s) => s.billingProfiles);
  const classLogs = useDocereStore((s) => s.classLogs);
  const profile = useDocereStore((s) => s.profile);

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  const now = startOfMonth(new Date());
  const isCurrentMonth = isSameMonth(viewMonth, now);

  useEffect(() => {
    syncPaymentsViewToCalendarMonth(setViewMonth);
    const onVisible = () => syncPaymentsViewToCalendarMonth(setViewMonth);
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const month = viewMonth.getMonth();
  const year = viewMonth.getFullYear();
  const monthLabel = format(viewMonth, "MMMM yyyy");

  const monthlyReports = useMemo(
    () =>
      buildMonthlyPaymentReports(
        learners,
        classLogs,
        payments,
        billingProfiles,
        profile?.currency ?? "INR",
      ),
    [learners, classLogs, payments, billingProfiles, profile?.currency],
  );

  const monthPayments = useMemo(
    () =>
      [...payments]
        .filter((p) => {
          const d = parseISO(p.date);
          return (
            (p.billingMonth === month && p.billingYear === year) ||
            (p.billingMonth === undefined &&
              d.getMonth() === month &&
              d.getFullYear() === year)
          );
        })
        .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()),
    [payments, month, year],
  );

  return (
    <>
      <Header title="Payments" />

      <div className="p-6 max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMonth((m) => startOfMonth(subMonths(m, 1)))}
              className="p-2 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-heading font-semibold text-text-primary min-w-[140px] text-center">
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth((m) => startOfMonth(addMonths(m, 1)))}
              className="p-2 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {!isCurrentMonth && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMonth(now)}
            >
              Current month
            </Button>
          )}
        </div>

        {learners.length === 0 ? (
          <EmptyState title="No learners yet" />
        ) : (
          <>
            <Card
              title={isCurrentMonth ? "This month" : monthLabel}
              animate={false}
            >
              <ul className="space-y-3">
                {learners.map((l) => {
                  const billing = billingProfiles.find(
                    (b) => b.learnerId === l.id,
                  );
                  const summary = getMonthlyFeeSummary(
                    classLogs,
                    l.id,
                    month,
                    year,
                    billing,
                  );
                  const currency =
                    billing?.currency ?? profile?.currency ?? "INR";
                  const totalPaid = getTotalPaidInMonth(
                    payments,
                    l.id,
                    month,
                    year,
                  );
                  const balance = summary.totalDue - totalPaid;
                  const last = getLastPaymentForLearner(payments, l.id);

                  return (
                    <li
                      key={l.id}
                      className={`flex items-center justify-between py-3 border-b border-[var(--border-subtle)] last:border-0 ${
                        highlightId === l.id
                          ? "bg-olive/5 -mx-2 px-2 rounded-lg"
                          : ""
                      }`}
                    >
                      <div>
                        <Link
                          href={`/learners/${l.id}`}
                          className="text-sm font-medium text-text-primary hover:text-olive"
                        >
                          {l.name}
                        </Link>
                        <p className="text-xs text-text-muted mt-0.5">
                          {summary.classCount} classes ·{" "}
                          {formatFee(summary.ratePerClass, currency)}/class
                        </p>
                        {totalPaid > 0 && (
                          <p className="text-xs font-mono-data text-sage">
                            Paid {formatFee(totalPaid, currency)}
                            {balance > 0.001 &&
                              ` · Due ${formatFee(balance, currency)}`}
                          </p>
                        )}
                        {last && totalPaid === 0 && (
                          <p className="text-xs font-mono-data text-text-muted">
                            Last paid {formatFee(last.amount, currency)} ·{" "}
                            {format(parseISO(last.date), "MMM d")}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-mono-data text-amber">
                          {formatFee(summary.totalDue, currency)}
                        </p>
                        {balance <= 0.001 && summary.totalDue > 0 && (
                          <p className="text-xs text-sage">Settled</p>
                        )}
                        <Link
                          href={`/learners/${l.id}`}
                          className="text-xs text-olive hover:text-sage"
                        >
                          Open
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>

            <Card title={`Payments · ${monthLabel}`} animate={false}>
              {monthPayments.length === 0 ? (
                <p className="text-sm text-text-muted">
                  No payments recorded for this month
                </p>
              ) : (
                <ul className="space-y-2">
                  {monthPayments.map((p) => {
                    const name =
                      learners.find((l) => l.id === p.learnerId)?.name ?? "—";
                    return (
                      <li
                        key={p.id}
                        className="flex justify-between text-sm py-2 border-b border-[var(--border-subtle)] last:border-0"
                      >
                        <span>
                          {name}
                          <span className="block text-xs text-text-muted">
                            {format(parseISO(p.date), "MMM d, yyyy")}
                            {p.notes ? ` · ${p.notes}` : ""}
                          </span>
                        </span>
                        <span className="font-mono-data text-amber">
                          {formatFee(p.amount, p.currency)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card title="Monthly reports" animate={false}>
              {monthlyReports.length === 0 ? (
                <p className="text-sm text-text-muted">
                  Reports appear once you mark classes or record payments
                </p>
              ) : (
                <ul className="space-y-2">
                  {monthlyReports.map((report) => {
                    const key = `${report.year}-${report.month}`;
                    const isViewing =
                      report.month === month && report.year === year;
                    const open = expandedReport === key || isViewing;

                    return (
                      <li
                        key={key}
                        className="border border-[var(--border-subtle)] rounded-lg overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedReport(open ? null : key)
                          }
                          className="w-full flex items-center justify-between gap-4 px-3 py-3 text-left hover:bg-surface-2/50 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {report.label}
                              {isViewing && (
                                <span className="ml-2 text-xs text-olive">
                                  viewing
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">
                              {report.learners.length} learner
                              {report.learners.length !== 1 ? "s" : ""} ·{" "}
                              {report.learners.reduce(
                                (s, r) => s + r.classCount,
                                0,
                              )}{" "}
                              classes
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-mono-data text-sm text-amber">
                              {formatFee(
                                report.totalDue,
                                profile?.currency ?? "INR",
                              )}
                            </p>
                            <p className="text-xs text-text-muted">
                              Paid{" "}
                              {formatFee(
                                report.totalPaid,
                                profile?.currency ?? "INR",
                              )}
                              {report.totalBalance > 0.001 && (
                                <span className="text-amber">
                                  {" "}
                                  · Due{" "}
                                  {formatFee(
                                    report.totalBalance,
                                    profile?.currency ?? "INR",
                                  )}
                                </span>
                              )}
                            </p>
                          </div>
                        </button>
                        {open && (
                          <ul className="border-t border-[var(--border-subtle)] bg-surface-2/30">
                            {report.learners.map((row) => (
                              <li
                                key={row.learnerId}
                                className="flex justify-between gap-4 px-3 py-2.5 text-sm border-b border-[var(--border-subtle)] last:border-0"
                              >
                                <div>
                                  <Link
                                    href={`/learners/${row.learnerId}`}
                                    className="text-text-primary hover:text-olive"
                                  >
                                    {row.learnerName}
                                  </Link>
                                  <p className="text-xs text-text-muted">
                                    {row.classCount} ×{" "}
                                    {formatFee(row.ratePerClass, row.currency)}
                                  </p>
                                </div>
                                <div className="text-right font-mono-data text-xs">
                                  <p className="text-amber">
                                    {formatFee(row.totalDue, row.currency)}
                                  </p>
                                  <p className="text-sage">
                                    {formatFee(row.totalPaid, row.currency)}{" "}
                                    paid
                                  </p>
                                </div>
                              </li>
                            ))}
                            <li className="px-3 py-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setViewMonth(
                                    new Date(report.year, report.month, 1),
                                  )
                                }
                              >
                                Open {report.label}
                              </Button>
                            </li>
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            {monthlyReports.length > 0 && !expandedReport && (
              <p className="text-xs text-text-muted text-center">
                Tap a month in Monthly reports to see per-learner breakdown
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense>
      <PaymentsContent />
    </Suspense>
  );
}
