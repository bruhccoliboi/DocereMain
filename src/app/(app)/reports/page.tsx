"use client";

import { differenceInMinutes, format, parseISO } from "date-fns";
import { BarChart3, Download } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportsCharts } from "@/components/reports/charts";
import { useDocereStore } from "@/lib/store";
import { formatCurrency, getWeeklySnapshot } from "@/lib/utils";

export default function ReportsPage() {
  const sessions = useDocereStore((s) => s.sessions);
  const payments = useDocereStore((s) => s.payments);
  const makeupObligations = useDocereStore((s) => s.makeupObligations);
  const profile = useDocereStore((s) => s.profile);
  const learners = useDocereStore((s) => s.learners);
  const exportWorkspace = useDocereStore((s) => s.exportWorkspace);

  const weekly = getWeeklySnapshot(sessions, payments);

  const completedSessions = sessions.filter((s) => s.status === "completed");
  const rescheduled = sessions.filter((s) => s.status === "rescheduled");
  const present = completedSessions.filter((s) => s.attendance === "present");
  const attendanceRate =
    completedSessions.length > 0
      ? Math.round((present.length / completedSessions.length) * 100)
      : 0;

  let totalHours = 0;
  for (const s of completedSessions) {
    totalHours += differenceInMinutes(
      parseISO(s.endAt),
      parseISO(s.startAt),
    );
  }
  totalHours = Math.round((totalHours / 60) * 10) / 10;

  const totalRevenue = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const hasData =
    learners.length > 0 || sessions.length > 0 || payments.length > 0;

  const exportCsv = () => {
    const rows = [
      ["Date", "Learner", "Amount", "Method", "Status"],
      ...payments.map((p) => {
        const name = learners.find((l) => l.id === p.learnerId)?.name ?? "";
        return [
          format(parseISO(p.date), "yyyy-MM-dd"),
          name,
          String(p.amount),
          p.method,
          p.status,
        ];
      }),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `docere-payments-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <>
      <Header title="Reports" />

      <div className="p-6 max-w-6xl space-y-6">
        {!hasData ? (
          <EmptyState
            icon={<BarChart3 className="w-6 h-6" />}
            title="No data yet"
            description="Reports appear as you teach, document sessions, and record payments."
          />
        ) : (
          <>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <Download className="w-4 h-4" />
                Export payments CSV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const json = exportWorkspace();
                  const blob = new Blob([json], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "docere-backup.json";
                  a.click();
                }}
              >
                Export full backup
              </Button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Total revenue",
                  value: formatCurrency(totalRevenue, profile?.currency),
                  mono: true,
                },
                { label: "Teaching hours", value: `${totalHours}h`, mono: true },
                { label: "Sessions completed", value: completedSessions.length },
                { label: "Attendance rate", value: `${attendanceRate}%`, mono: true },
              ].map((stat) => (
                <Card key={stat.label} padding="sm" animate={false}>
                  <p className="text-xs text-text-muted mb-1">{stat.label}</p>
                  <p
                    className={`text-xl font-semibold ${stat.mono ? "font-mono-data" : "font-heading"}`}
                  >
                    {stat.value}
                  </p>
                </Card>
              ))}
            </div>

            <ReportsCharts
              sessions={sessions}
              payments={payments}
              currency={profile?.currency}
            />

            <div className="grid md:grid-cols-2 gap-6">
              <Card title="This week" animate={false}>
                <div className="space-y-3">
                  {[
                    ["Sessions completed", weekly.sessionsCompleted],
                    ["Sessions remaining", weekly.sessionsRemaining],
                    ["Teaching hours", weekly.teachingHours],
                    [
                      "Revenue",
                      formatCurrency(weekly.revenueEarned, profile?.currency),
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label as string}
                      className="flex justify-between text-sm py-2 border-b border-[var(--border-subtle)] last:border-0"
                    >
                      <span className="text-text-secondary">{label}</span>
                      <span className="font-mono-data">{value}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Reschedules & makeup" animate={false}>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Rescheduled</span>
                    <span className="font-mono-data">{rescheduled.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Makeup owed</span>
                    <span className="font-mono-data text-amber">
                      {makeupObligations.filter((m) => m.status === "owed").length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Makeup completed</span>
                    <span className="font-mono-data text-sage">
                      {
                        makeupObligations.filter((m) => m.status === "completed")
                          .length
                      }
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  );
}
