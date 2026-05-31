import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  addDays,
  differenceInMinutes,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import type {
  AttendanceStatus,
  BillingModel,
  BillingProfile,
  ClassLog,
  ClassMissReason,
  Learner,
  MakeupObligation,
  Payment,
  PaymentStatus,
  RecurringRule,
  SessionNote,
  TeachingSession,
} from "./types";

export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const WEEKDAY_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export interface LearnerScheduleSlot {
  dayOfWeek: number;
  startTime: string;
}

export type LearnerSortOption =
  | "all"
  | "name_asc"
  | "name_desc"
  | "location_asc"
  | "location_desc"
  | "day_asc"
  | "day_desc";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function formatSessionTime(startAt: string, endAt: string): string {
  const start = parseISO(startAt);
  const end = parseISO(endAt);
  return `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`;
}

export function formatDate(iso: string, pattern = "MMM d, yyyy"): string {
  return format(parseISO(iso), pattern);
}

export function formatCurrency(
  amount: number,
  currency = "INR",
  options?: { fractionDigits?: number },
): string {
  const digits = options?.fractionDigits ?? 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

/** Per-class and line-item amounts — preserves decimals (e.g. ₹312.50) */
export function formatFee(amount: number, currency = "INR"): string {
  const hasFraction = Math.abs(amount % 1) > 1e-9;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getSessionsToday(sessions: TeachingSession[]): TeachingSession[] {
  const now = new Date();
  return sessions
    .filter((s) => isSameDay(parseISO(s.startAt), now))
    .filter((s) => s.status !== "cancelled")
    .sort(
      (a, b) =>
        parseISO(a.startAt).getTime() - parseISO(b.startAt).getTime(),
    );
}

export function getUpcomingSessions(
  sessions: TeachingSession[],
  days = 7,
): TeachingSession[] {
  const now = startOfDay(new Date());
  const end = addDays(now, days);
  return sessions
    .filter((s) => {
      const start = parseISO(s.startAt);
      return (
        (isAfter(start, now) || isSameDay(start, now)) &&
        isBefore(start, end) &&
        s.status !== "cancelled"
      );
    })
    .sort(
      (a, b) =>
        parseISO(a.startAt).getTime() - parseISO(b.startAt).getTime(),
    );
}

export function getSessionsNeedingNotes(
  sessions: TeachingSession[],
  notes: SessionNote[],
): TeachingSession[] {
  const notedIds = new Set(notes.map((n) => n.sessionId));
  return sessions
    .filter(
      (s) =>
        s.status === "completed" &&
        s.attendance === "present" &&
        !notedIds.has(s.id),
    )
    .sort(
      (a, b) =>
        parseISO(b.startAt).getTime() - parseISO(a.startAt).getTime(),
    );
}

export function getOutstandingMakeups(
  obligations: MakeupObligation[],
): MakeupObligation[] {
  return obligations.filter((o) => o.status === "owed");
}

export function computePaymentStatus(
  billing: BillingProfile | undefined,
  payments: Payment[],
  learnerId: string,
): PaymentStatus {
  if (!billing) return "due_soon";

  if (billing.model === "package") {
    const remaining = billing.packageSessionsRemaining ?? 0;
    if (remaining <= 0) return "package_expired";
    if (billing.packageExpiresAt) {
      if (isBefore(parseISO(billing.packageExpiresAt), new Date())) {
        return "package_expired";
      }
    }
    return "package_active";
  }

  const learnerPayments = payments
    .filter((p) => p.learnerId === learnerId)
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  const lastPayment = learnerPayments[0];
  const now = new Date();

  if (!lastPayment) return "overdue";

  const daysSince = differenceInMinutes(now, parseISO(lastPayment.date)) / (60 * 24);

  if (billing.model === "monthly") {
    if (daysSince > 35) return "overdue";
    if (daysSince > 28) return "due_soon";
    return "paid";
  }

  return lastPayment.status === "paid" ? "paid" : "due_soon";
}

export function getWeeklySnapshot(
  sessions: TeachingSession[],
  payments: Payment[],
  weekStart?: Date,
) {
  const start = weekStart ?? startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(start, { weekStartsOn: 1 });

  const weekSessions = sessions.filter((s) => {
    const d = parseISO(s.startAt);
    return isWithinInterval(d, { start, end });
  });

  const completed = weekSessions.filter((s) => s.status === "completed");
  const remaining = weekSessions.filter(
    (s) => s.status === "scheduled" && isAfter(parseISO(s.startAt), new Date()),
  );

  let teachingMinutes = 0;
  for (const s of completed) {
    teachingMinutes += differenceInMinutes(
      parseISO(s.endAt),
      parseISO(s.startAt),
    );
  }

  const revenue = payments
    .filter((p) => {
      const d = parseISO(p.date);
      return isWithinInterval(d, { start, end }) && p.status === "paid";
    })
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    sessionsCompleted: completed.length,
    sessionsRemaining: remaining.length,
    teachingHours: Math.round((teachingMinutes / 60) * 10) / 10,
    revenueEarned: revenue,
  };
}

export function getLearnerAttendanceRate(
  sessions: TeachingSession[],
  learnerId: string,
): number {
  const relevant = sessions.filter(
    (s) =>
      s.learnerId === learnerId &&
      s.status === "completed" &&
      s.attendance !== "rescheduled",
  );
  if (relevant.length === 0) return 0;
  const present = relevant.filter((s) => s.attendance === "present").length;
  return Math.round((present / relevant.length) * 100);
}

export function getNextSessionForLearner(
  sessions: TeachingSession[],
  learnerId: string,
): TeachingSession | undefined {
  const now = new Date();
  return sessions
    .filter(
      (s) =>
        s.learnerId === learnerId &&
        s.status === "scheduled" &&
        isAfter(parseISO(s.startAt), now),
    )
    .sort(
      (a, b) =>
        parseISO(a.startAt).getTime() - parseISO(b.startAt).getTime(),
    )[0];
}

export function getLastSessionForLearner(
  sessions: TeachingSession[],
  learnerId: string,
): TeachingSession | undefined {
  const now = new Date();
  return sessions
    .filter(
      (s) =>
        s.learnerId === learnerId &&
        (s.status === "completed" || isBefore(parseISO(s.startAt), now)),
    )
    .sort(
      (a, b) =>
        parseISO(b.startAt).getTime() - parseISO(a.startAt).getTime(),
    )[0];
}

export function searchDocere(
  query: string,
  data: {
    learners: Learner[];
    sessions: TeachingSession[];
    notes: SessionNote[];
    payments: Payment[];
    learningItems: { id: string; learnerId: string; title: string; category: string }[];
  },
) {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  type Result = {
    type: string;
    id: string;
    title: string;
    subtitle: string;
    href: string;
  };

  const results: Result[] = [];

  for (const l of data.learners) {
    if (
      l.name.toLowerCase().includes(q) ||
      l.tags.some((t) => t.toLowerCase().includes(q))
    ) {
      results.push({
        type: "learner",
        id: l.id,
        title: l.name,
        subtitle: l.tags.join(", ") || "Learner",
        href: `/learners/${l.id}`,
      });
    }
  }

  for (const n of data.notes) {
    const text = `${n.quickNote} ${n.detailedNote} ${n.summary}`.toLowerCase();
    if (text.includes(q)) {
      results.push({
        type: "note",
        id: n.id,
        title: n.summary || n.quickNote || "Session note",
        subtitle: formatDate(n.createdAt),
        href: `/learners/${n.learnerId}`,
      });
    }
  }

  for (const item of data.learningItems) {
    if (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    ) {
      results.push({
        type: "learning",
        id: item.id,
        title: item.title,
        subtitle: item.category,
        href: `/learners/${item.learnerId}`,
      });
    }
  }

  for (const s of data.sessions) {
    const learner = data.learners.find((l) => l.id === s.learnerId);
    const label = `${learner?.name ?? ""} ${s.title}`.toLowerCase();
    if (label.includes(q)) {
      results.push({
        type: "session",
        id: s.id,
        title: learner?.name ?? s.title,
        subtitle: formatDate(s.startAt, "MMM d, h:mm a"),
        href: `/studio?session=${s.id}`,
      });
    }
  }

  for (const p of data.payments) {
    const learner = data.learners.find((l) => l.id === p.learnerId);
    if (
      learner?.name.toLowerCase().includes(q) ||
      p.method.toLowerCase().includes(q) ||
      String(p.amount).includes(q)
    ) {
      results.push({
        type: "payment",
        id: p.id,
        title: `${formatCurrency(p.amount, p.currency)} from ${learner?.name ?? "?"}`,
        subtitle: formatDate(p.date),
        href: "/payments",
      });
    }
  }

  for (const l of data.learners) {
    for (const g of l.goals) {
      if (g.toLowerCase().includes(q)) {
        results.push({
          type: "goal",
          id: `${l.id}-${g}`,
          title: g,
          subtitle: `Goal for ${l.name}`,
          href: `/learners/${l.id}`,
        });
      }
    }
  }

  return results.slice(0, 16);
}

export function attendanceLabel(status: AttendanceStatus): string {
  const map: Record<AttendanceStatus, string> = {
    present: "Present",
    absent: "Absent",
    cancelled: "Cancelled",
    rescheduled: "Rescheduled",
    scheduled: "Scheduled",
  };
  return map[status];
}

/** Scheduled class days (0=Sun … 6=Sat) from recurring rules, else upcoming sessions */
export function getLearnerScheduleDays(
  learnerId: string,
  recurringRules: RecurringRule[],
  sessions: TeachingSession[],
): number[] {
  const days = new Set<number>();

  for (const rule of recurringRules) {
    if (rule.learnerId === learnerId && rule.active) {
      days.add(rule.dayOfWeek);
    }
  }

  if (days.size === 0) {
    const now = new Date();
    for (const session of sessions) {
      if (session.learnerId !== learnerId) continue;
      if (session.status === "cancelled" || session.status === "rescheduled") {
        continue;
      }
      const start = parseISO(session.startAt);
      if (session.status === "scheduled" && isBefore(start, now)) continue;
      days.add(start.getDay());
    }
  }

  return Array.from(days).sort((a, b) => weekdaySortKey(a) - weekdaySortKey(b));
}

/** Monday-first order for batch sorting (Mon=1 … Sun=7) */
export function weekdaySortKey(day: number): number {
  return day === 0 ? 7 : day;
}

export function formatScheduleDays(days: number[]): string {
  if (days.length === 0) return "";
  return days.map((d) => WEEKDAY_NAMES[d]).join(", ");
}

export function formatScheduleTime(startTime: string): string {
  const [h, m] = startTime.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return startTime;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return format(d, "h:mm a");
}

/** Day + time slots from recurring rules, or upcoming sessions if none */
export function getLearnerScheduleSlots(
  learnerId: string,
  recurringRules: RecurringRule[],
  sessions: TeachingSession[],
): LearnerScheduleSlot[] {
  const slots: LearnerScheduleSlot[] = [];
  const seen = new Set<string>();

  for (const rule of recurringRules) {
    if (rule.learnerId !== learnerId || !rule.active) continue;
    const key = `${rule.dayOfWeek}-${rule.startTime}`;
    if (seen.has(key)) continue;
    seen.add(key);
    slots.push({ dayOfWeek: rule.dayOfWeek, startTime: rule.startTime });
  }

  if (slots.length === 0) {
    const now = new Date();
    for (const session of sessions) {
      if (session.learnerId !== learnerId) continue;
      if (session.status === "cancelled" || session.status === "rescheduled") {
        continue;
      }
      const start = parseISO(session.startAt);
      if (session.status === "scheduled" && isBefore(start, now)) continue;
      const startTime = format(start, "HH:mm");
      const key = `${start.getDay()}-${startTime}`;
      if (seen.has(key)) continue;
      seen.add(key);
      slots.push({ dayOfWeek: start.getDay(), startTime });
    }
  }

  return slots.sort((a, b) => {
    const dayDiff = weekdaySortKey(a.dayOfWeek) - weekdaySortKey(b.dayOfWeek);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });
}

/** e.g. "Mon, Wed 4:00 PM" or "Mon 4:00 PM, Wed 5:30 PM" */
export function formatLearnerSchedule(slots: LearnerScheduleSlot[]): string {
  if (slots.length === 0) return "";

  const uniqueTimes = new Set(slots.map((s) => s.startTime));
  if (uniqueTimes.size === 1) {
    const time = formatScheduleTime(slots[0].startTime);
    const days = slots.map((s) => WEEKDAY_SHORT[s.dayOfWeek]).join(", ");
    return `${days} ${time}`;
  }

  return slots
    .map((s) => `${WEEKDAY_SHORT[s.dayOfWeek]} ${formatScheduleTime(s.startTime)}`)
    .join(", ");
}

export function sortLearners(
  learners: Learner[],
  sort: LearnerSortOption,
  recurringRules: RecurringRule[],
  sessions: TeachingSession[],
): Learner[] {
  const primaryDay = (learnerId: string) => {
    const days = getLearnerScheduleDays(learnerId, recurringRules, sessions);
    return days.length > 0 ? weekdaySortKey(days[0]) : 99;
  };

  if (sort === "all") {
    return [...learners];
  }

  return [...learners].sort((a, b) => {
    switch (sort) {
      case "name_asc":
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      case "name_desc":
        return b.name.localeCompare(a.name, undefined, { sensitivity: "base" });
      case "location_asc": {
        const loc = (a.location ?? "").localeCompare(b.location ?? "", undefined, {
          sensitivity: "base",
        });
        return loc !== 0 ? loc : a.name.localeCompare(b.name);
      }
      case "location_desc": {
        const loc = (b.location ?? "").localeCompare(a.location ?? "", undefined, {
          sensitivity: "base",
        });
        return loc !== 0 ? loc : a.name.localeCompare(b.name);
      }
      case "day_asc": {
        const diff = primaryDay(a.id) - primaryDay(b.id);
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
      }
      case "day_desc": {
        const diff = primaryDay(b.id) - primaryDay(a.id);
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
      }
      default:
        return 0;
    }
  });
}

export function filterLearnersByScheduleDay(
  learners: Learner[],
  dayFilter: number | "all",
  recurringRules: RecurringRule[],
  sessions: TeachingSession[],
): Learner[] {
  if (dayFilter === "all") return learners;
  return learners.filter((learner) =>
    getLearnerScheduleDays(learner.id, recurringRules, sessions).includes(dayFilter),
  );
}

export function billingModelLabel(model: BillingModel): string {
  const map: Record<BillingModel, string> = {
    monthly: "monthly",
    per_session: "Per session",
    package: "Package",
    group: "Group",
    custom: "Custom",
  };
  return map[model];
}

export function getPerClassRate(billing?: BillingProfile): number {
  if (!billing) return 0;
  return billing.feeAmount;
}

export function getLastPaymentForLearner(
  payments: Payment[],
  learnerId: string,
): Payment | undefined {
  return payments
    .filter((p) => p.learnerId === learnerId)
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())[0];
}

export const CLASS_MISS_REASON_LABELS: Record<ClassMissReason, string> = {
  rescheduled: "Rescheduled",
  student_unwell: "Student not keeping well",
  out_of_station: "Out of station",
  instructor_unavailable: "Instructor unavailable",
};

export function isClassLogConducted(log: ClassLog): boolean {
  return log.status === "conducted";
}

export function getClassLogsInMonth(
  classLogs: ClassLog[],
  learnerId: string,
  month: number,
  year: number,
): ClassLog[] {
  return classLogs
    .filter((c) => {
      if (c.learnerId !== learnerId) return false;
      const d = parseISO(c.date);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
}

export function getConductedClassesInMonth(
  classLogs: ClassLog[],
  learnerId: string,
  month: number,
  year: number,
): ClassLog[] {
  return getClassLogsInMonth(classLogs, learnerId, month, year).filter(
    isClassLogConducted,
  );
}

export function getMissedClassesInMonth(
  classLogs: ClassLog[],
  learnerId: string,
  month: number,
  year: number,
): ClassLog[] {
  return getClassLogsInMonth(classLogs, learnerId, month, year).filter(
    (c) => c.status === "missed",
  );
}

export function getMonthlyFeeSummary(
  classLogs: ClassLog[],
  learnerId: string,
  month: number,
  year: number,
  billing?: BillingProfile,
) {
  const conducted = getConductedClassesInMonth(
    classLogs,
    learnerId,
    month,
    year,
  );
  const rate = getPerClassRate(billing);
  const classCount = conducted.length;
  const totalDue = classCount * rate;

  return {
    classCount,
    ratePerClass: rate,
    totalDue,
    conductedDates: conducted.map((c) => c.date),
  };
}

export function getPaymentBillingPeriod(payment: Payment): {
  month: number;
  year: number;
} {
  if (
    payment.billingMonth !== undefined &&
    payment.billingYear !== undefined
  ) {
    return { month: payment.billingMonth, year: payment.billingYear };
  }
  const d = parseISO(payment.date);
  return { month: d.getMonth(), year: d.getFullYear() };
}

export function getPaymentsForLearnerInMonth(
  payments: Payment[],
  learnerId: string,
  month: number,
  year: number,
): Payment[] {
  return payments.filter((p) => {
    if (p.learnerId !== learnerId) return false;
    const period = getPaymentBillingPeriod(p);
    return period.month === month && period.year === year;
  });
}

export function getTotalPaidInMonth(
  payments: Payment[],
  learnerId: string,
  month: number,
  year: number,
): number {
  return getPaymentsForLearnerInMonth(payments, learnerId, month, year).reduce(
    (sum, p) => sum + p.amount,
    0,
  );
}

export interface LearnerMonthBilling {
  learnerId: string;
  learnerName: string;
  classCount: number;
  ratePerClass: number;
  totalDue: number;
  totalPaid: number;
  balance: number;
  currency: string;
}

export interface MonthlyPaymentReport {
  month: number;
  year: number;
  label: string;
  learners: LearnerMonthBilling[];
  totalDue: number;
  totalPaid: number;
  totalBalance: number;
}

function collectBillingMonths(
  classLogs: ClassLog[],
  payments: Payment[],
): { month: number; year: number }[] {
  const keys = new Set<string>();

  for (const log of classLogs) {
    const d = parseISO(log.date);
    keys.add(`${d.getFullYear()}-${d.getMonth()}`);
  }
  for (const payment of payments) {
    const period = getPaymentBillingPeriod(payment);
    keys.add(`${period.year}-${period.month}`);
  }

  return Array.from(keys)
    .map((k) => {
      const [year, month] = k.split("-").map(Number);
      return { month, year };
    })
    .sort((a, b) =>
      b.year !== a.year ? b.year - a.year : b.month - a.month,
    );
}

export function buildMonthlyPaymentReports(
  learners: Learner[],
  classLogs: ClassLog[],
  payments: Payment[],
  billingProfiles: BillingProfile[],
  defaultCurrency = "INR",
): MonthlyPaymentReport[] {
  const months = collectBillingMonths(classLogs, payments);

  return months.map(({ month, year }) => {
    const learnerRows: LearnerMonthBilling[] = learners.map((learner) => {
      const billing = billingProfiles.find(
        (b) => b.learnerId === learner.id,
      );
      const summary = getMonthlyFeeSummary(
        classLogs,
        learner.id,
        month,
        year,
        billing,
      );
      const currency = billing?.currency ?? defaultCurrency;
      const totalPaid = getTotalPaidInMonth(
        payments,
        learner.id,
        month,
        year,
      );

      return {
        learnerId: learner.id,
        learnerName: learner.name,
        classCount: summary.classCount,
        ratePerClass: summary.ratePerClass,
        totalDue: summary.totalDue,
        totalPaid,
        balance: summary.totalDue - totalPaid,
        currency,
      };
    });

    const active = learnerRows.filter(
      (r) => r.classCount > 0 || r.totalPaid > 0,
    );

    const totalDue = active.reduce((s, r) => s + r.totalDue, 0);
    const totalPaid = active.reduce((s, r) => s + r.totalPaid, 0);

    return {
      month,
      year,
      label: format(new Date(year, month, 1), "MMMM yyyy"),
      learners: active,
      totalDue,
      totalPaid,
      totalBalance: totalDue - totalPaid,
    };
  });
}

export const PAYMENTS_CALENDAR_MONTH_KEY = "docere-payments-calendar-month";

export function syncPaymentsViewToCalendarMonth(
  setViewMonth: (d: Date) => void,
): void {
  if (typeof window === "undefined") return;
  const calendarKey = format(new Date(), "yyyy-MM");
  const stored = localStorage.getItem(PAYMENTS_CALENDAR_MONTH_KEY);
  if (stored !== calendarKey) {
    setViewMonth(startOfMonth(new Date()));
    localStorage.setItem(PAYMENTS_CALENDAR_MONTH_KEY, calendarKey);
  }
}

export function paymentStatusLabel(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    paid: "Paid",
    due_soon: "Due soon",
    overdue: "Overdue",
    partial: "Partial",
    package_active: "Package active",
    package_expired: "Package expired",
  };
  return map[status];
}
