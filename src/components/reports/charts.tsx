"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { format, parseISO, eachWeekOfInterval, subWeeks } from "date-fns";
import type { Payment, TeachingSession } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface ChartsProps {
  sessions: TeachingSession[];
  payments: Payment[];
  currency?: string;
}

export function RevenueChart({ payments, currency }: { payments: Payment[]; currency?: string }) {
  const weeks = eachWeekOfInterval({
    start: subWeeks(new Date(), 11),
    end: new Date(),
  }, { weekStartsOn: 1 });

  const data = weeks.map((weekStart) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const revenue = payments
      .filter((p) => {
        const d = parseISO(p.date);
        return d >= weekStart && d < weekEnd && p.status === "paid";
      })
      .reduce((s, p) => s + p.amount, 0);
    return {
      week: format(weekStart, "MMM d"),
      revenue,
    };
  });

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6b7c5e" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#6b7c5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="week" tick={{ fill: "#7a766e", fontSize: 10 }} />
          <YAxis tick={{ fill: "#7a766e", fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              background: "#1a1a18",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
            }}
            formatter={(v) => [
              formatCurrency(Number(v ?? 0), currency),
              "Revenue",
            ]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#6b7c5e"
            fill="url(#revGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SessionsChart({ sessions }: { sessions: TeachingSession[] }) {
  const weeks = eachWeekOfInterval({
    start: subWeeks(new Date(), 7),
    end: new Date(),
  }, { weekStartsOn: 1 });

  const data = weeks.map((weekStart) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const completed = sessions.filter((s) => {
      if (s.status !== "completed") return false;
      const d = parseISO(s.startAt);
      return d >= weekStart && d < weekEnd;
    }).length;
    const scheduled = sessions.filter((s) => {
      if (s.status !== "scheduled") return false;
      const d = parseISO(s.startAt);
      return d >= weekStart && d < weekEnd;
    }).length;
    return {
      week: format(weekStart, "MMM d"),
      completed,
      scheduled,
    };
  });

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="week" tick={{ fill: "#7a766e", fontSize: 10 }} />
          <YAxis tick={{ fill: "#7a766e", fontSize: 10 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "#1a1a18",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
            }}
          />
          <Bar dataKey="completed" fill="#6b7c5e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="scheduled" fill="#a69060" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReportsCharts({ sessions, payments, currency }: ChartsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-surface-1">
        <h3 className="font-heading text-sm font-semibold mb-4">Revenue (12 weeks)</h3>
        <RevenueChart payments={payments} currency={currency} />
      </div>
      <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-surface-1">
        <h3 className="font-heading text-sm font-semibold mb-4">Sessions (8 weeks)</h3>
        <SessionsChart sessions={sessions} />
      </div>
    </div>
  );
}
