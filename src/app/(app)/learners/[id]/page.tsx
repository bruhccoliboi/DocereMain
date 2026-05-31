"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MonthlyClassTracker } from "@/components/learners/monthly-class-tracker";
import { useDocereStore } from "@/lib/store";
import { toast } from "sonner";
import {
  formatFee,
  formatLearnerSchedule,
  getLastPaymentForLearner,
  getLearnerScheduleSlots,
  getMissedClassesInMonth,
  getMonthlyFeeSummary,
  getTotalPaidInMonth,
} from "@/lib/utils";
import type { ClassMissReason } from "@/lib/types";

export default function LearnerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const learner = useDocereStore((s) => s.learners.find((l) => l.id === id));
  const payments = useDocereStore((s) => s.payments);
  const billingProfiles = useDocereStore((s) => s.billingProfiles);
  const recurringRules = useDocereStore((s) => s.recurringRules);
  const sessions = useDocereStore((s) => s.sessions);
  const classLogs = useDocereStore((s) => s.classLogs);
  const profile = useDocereStore((s) => s.profile);
  const updateLearner = useDocereStore((s) => s.updateLearner);
  const setPerClassRate = useDocereStore((s) => s.setPerClassRate);
  const setClassLogEntry = useDocereStore((s) => s.setClassLogEntry);
  const addPayment = useDocereStore((s) => s.addPayment);
  const deleteLearner = useDocereStore((s) => s.deleteLearner);

  const [month, setMonth] = useState(() => new Date());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [rate, setRate] = useState("");

  const logsByDate = useMemo(() => {
    const map = new Map<string, (typeof classLogs)[0]>();
    for (const log of classLogs) {
      if (log.learnerId !== id) continue;
      const d = parseISO(log.date);
      if (
        d.getMonth() === month.getMonth() &&
        d.getFullYear() === month.getFullYear()
      ) {
        map.set(log.date, log);
      }
    }
    return map;
  }, [classLogs, id, month]);

  if (!learner) {
    return (
      <div className="p-6 text-center">
        <p className="text-text-muted">Not found</p>
        <Link href="/learners" className="text-olive text-sm mt-2 inline-block">
          Back
        </Link>
      </div>
    );
  }

  const billing = billingProfiles.find((b) => b.learnerId === id);
  const currency = billing?.currency ?? profile?.currency ?? "INR";
  const summary = getMonthlyFeeSummary(
    classLogs,
    id,
    month.getMonth(),
    month.getFullYear(),
    billing,
  );
  const lastPayment = getLastPaymentForLearner(payments, id);
  const paidThisMonth = getTotalPaidInMonth(
    payments,
    id,
    month.getMonth(),
    month.getFullYear(),
  );
  const balanceThisMonth = summary.totalDue - paidThisMonth;
  const missedCount = getMissedClassesInMonth(
    classLogs,
    id,
    month.getMonth(),
    month.getFullYear(),
  ).length;
  const scheduleLabel = formatLearnerSchedule(
    getLearnerScheduleSlots(id, recurringRules, sessions),
  );

  const startEdit = () => {
    setName(learner.name);
    setPhone(learner.phone ?? "");
    setLocation(learner.location ?? "");
    setRate(String(billing?.feeAmount ?? ""));
    setEditing(true);
  };

  const saveEdit = () => {
    updateLearner(id, {
      name: name.trim() || learner.name,
      phone: phone.trim() || undefined,
      location: location.trim() || undefined,
    });
    const rateNum = parseFloat(rate);
    if (!Number.isNaN(rateNum) && rateNum >= 0) {
      setPerClassRate(id, rateNum, currency);
    }
    setEditing(false);
    toast.success("Saved");
  };

  const recordPayment = () => {
    if (summary.totalDue <= 0) {
      toast.error("No classes to bill this month");
      return;
    }
    const amountDue = balanceThisMonth > 0.001 ? balanceThisMonth : summary.totalDue;
    addPayment({
      learnerId: id,
      amount: amountDue,
      currency,
      date: new Date().toISOString(),
      method: "Cash",
      status: "paid",
      notes: `${summary.classCount} classes · ${format(month, "MMMM yyyy")}`,
      billingMonth: month.getMonth(),
      billingYear: month.getFullYear(),
      classCount: summary.classCount,
      ratePerClass: summary.ratePerClass,
    });
    toast.success("Payment recorded");
  };

  return (
    <>
      <div className="px-6 pt-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-olive"
        >
          <ArrowLeft className="w-4 h-4" />
          Learners
        </button>
      </div>

      <Header title={learner.name} />

      <div className="p-6 max-w-2xl space-y-6">
        <Card animate={false}>
          {editing ? (
            <div className="space-y-4">
              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <Input
                label="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="Fee per class"
                type="number"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={saveEdit}>Save</Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">Location</dt>
                  <dd className="text-text-primary text-right">
                    {learner.location || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">Class schedule</dt>
                  <dd className="text-text-primary text-right">
                    {scheduleLabel || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">Phone</dt>
                  <dd className="font-mono-data text-text-primary">
                    {learner.phone || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">Fee per class</dt>
                  <dd className="font-mono-data text-amber">
                    {summary.ratePerClass > 0
                      ? formatFee(summary.ratePerClass, currency)
                      : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">Last paid</dt>
                  <dd className="font-mono-data text-text-primary text-right">
                    {lastPayment ? (
                      <>
                        {formatFee(lastPayment.amount, lastPayment.currency)}
                        <span className="block text-xs text-text-muted font-body">
                          {format(parseISO(lastPayment.date), "MMM d, yyyy")}
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
              </dl>
              <Button variant="outline" size="sm" className="mt-4" onClick={startEdit}>
                Edit
              </Button>
            </>
          )}
        </Card>

        <Card title="Classes this month" animate={false}>
          <MonthlyClassTracker
            month={month}
            onMonthChange={setMonth}
            logsByDate={logsByDate}
            onSetConducted={(dateStr) =>
              setClassLogEntry(id, dateStr, { status: "conducted" })
            }
            onSetMissed={(dateStr, reason: ClassMissReason) =>
              setClassLogEntry(id, dateStr, { status: "missed", missReason: reason })
            }
            onClearDate={(dateStr) => setClassLogEntry(id, dateStr, null)}
          />
        </Card>

        <Card title={`${format(month, "MMMM")} summary`} animate={false}>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Classes held</span>
              <span className="font-mono-data text-text-primary">
                {summary.classCount}
              </span>
            </div>
            {missedCount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Did not happen</span>
                <span className="font-mono-data text-amber">{missedCount}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Rate per class</span>
              <span className="font-mono-data text-text-primary">
                {formatFee(summary.ratePerClass, currency)}
              </span>
            </div>
            {paidThisMonth > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Paid this month</span>
                <span className="font-mono-data text-sage">
                  {formatFee(paidThisMonth, currency)}
                </span>
              </div>
            )}
            <div className="pt-3 border-t border-[var(--border-subtle)] flex justify-between items-baseline">
              <span className="font-heading font-semibold">
                {balanceThisMonth > 0.001 ? "Balance due" : "Total due"}
              </span>
              <span className="font-mono-data text-xl text-amber">
                {summary.classCount} × {formatFee(summary.ratePerClass, currency)}{" "}
                = {formatFee(
                  balanceThisMonth > 0.001 ? balanceThisMonth : summary.totalDue,
                  currency,
                )}
              </span>
            </div>
            <Button
              className="w-full"
              onClick={recordPayment}
              disabled={
                balanceThisMonth <= 0.001 ||
                summary.totalDue <= 0 ||
                summary.ratePerClass <= 0
              }
            >
              Record payment
            </Button>
          </div>
        </Card>

        <Button
          variant={confirmDelete ? "danger" : "outline"}
          onClick={() => {
            if (!confirmDelete) {
              setConfirmDelete(true);
              return;
            }
            deleteLearner(id);
            router.replace("/learners");
          }}
        >
          {confirmDelete ? "Confirm delete" : "Delete"}
        </Button>
        {confirmDelete && (
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="ml-3 text-sm text-text-muted"
          >
            Cancel
          </button>
        )}
      </div>
    </>
  );
}
