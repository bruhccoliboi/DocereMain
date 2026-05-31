"use client";

import { useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useDocereStore } from "@/lib/store";
import { toast } from "sonner";
import {
  formatFee,
  formatLearnerSchedule,
  getLearnerScheduleSlots,
  getMonthlyFeeSummary,
  getPerClassRate,
  filterLearnersByScheduleDay,
  sortLearners,
  WEEKDAY_NAMES,
  type LearnerSortOption,
} from "@/lib/utils";

const SORT_OPTIONS: { value: LearnerSortOption; label: string }[] = [
  { value: "all", label: "All students" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "location_asc", label: "Location A–Z" },
  { value: "location_desc", label: "Location Z–A" },
  { value: "day_asc", label: "Class day (Mon–Sun)" },
  { value: "day_desc", label: "Class day (Sun–Mon)" },
];

function LearnersContent() {
  const searchParams = useSearchParams();
  const showNew = searchParams.get("new") === "true";

  const learners = useDocereStore((s) => s.learners);
  const billingProfiles = useDocereStore((s) => s.billingProfiles);
  const classLogs = useDocereStore((s) => s.classLogs);
  const recurringRules = useDocereStore((s) => s.recurringRules);
  const sessions = useDocereStore((s) => s.sessions);
  const profile = useDocereStore((s) => s.profile);
  const addLearner = useDocereStore((s) => s.addLearner);
  const setPerClassRate = useDocereStore((s) => s.setPerClassRate);

  const now = new Date();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<LearnerSortOption>("all");
  const [dayFilter, setDayFilter] = useState<number | "all">("all");
  const [showForm, setShowForm] = useState(showNew);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [rate, setRate] = useState("");

  const displayed = useMemo(() => {
    let list = learners.filter((l) =>
      l.name.toLowerCase().includes(search.toLowerCase()),
    );
    list = filterLearnersByScheduleDay(
      list,
      dayFilter,
      recurringRules,
      sessions,
    );
    list = sortLearners(list, sort, recurringRules, sessions);
    return list;
  }, [learners, search, sort, dayFilter, recurringRules, sessions]);

  const handleAdd = () => {
    if (!name.trim()) return;
    const id = addLearner({
      name: name.trim(),
      phone: phone.trim() || undefined,
      location: location.trim() || undefined,
      goals: [],
      notes: "",
      startDate: new Date().toISOString().split("T")[0],
      tags: [],
    });
    const rateNum = parseFloat(rate);
    if (!Number.isNaN(rateNum) && rateNum > 0) {
      setPerClassRate(id, rateNum, profile?.currency ?? "INR");
    }
    setName("");
    setPhone("");
    setLocation("");
    setRate("");
    setShowForm(false);
    toast.success("Learner added");
  };

  const selectClass =
    "h-9 px-3 rounded-lg bg-surface-2 border border-[var(--border-subtle)] text-sm text-text-primary";

  return (
    <>
      <Header title="Students" />

      <div className="p-4 max-w-3xl space-y-4">
        <div className="flex flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-2 border border-[var(--border-subtle)] text-sm"
            />
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>

        <div className="flex flex-row gap-3">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as LearnerSortOption)}
            className={`${selectClass} flex-1`}
            aria-label="Sort learners"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={dayFilter === "all" ? "all" : String(dayFilter)}
            onChange={(e) => {
              const v = e.target.value;
              setDayFilter(v === "all" ? "all" : parseInt(v, 10));
            }}
            className={`${selectClass} flex-1`}
            aria-label="Filter by class day"
          >
            <option value="all">All days</option>
            {WEEKDAY_NAMES.map((label, i) => (
              <option key={label} value={i}>
                {label} batch
              </option>
            ))}
          </select>
        </div>

        {showForm && (
          <Card title="New learner" animate={false}>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              <Input
                label="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <Input
                label="Fee per class"
                type="number"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="312.5"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAdd}>Add</Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {displayed.length === 0 ? (
          <EmptyState
            title={
              learners.length === 0
                ? "No students yet"
                : dayFilter !== "all"
                  ? `No ${WEEKDAY_NAMES[dayFilter as number]} batch`
                  : "No matches"
            }
            action={
              learners.length === 0
                ? { label: "Add student", onClick: () => setShowForm(true) }
                : undefined
            }
          />
        ) : (
          <div className="space-y-8">
            {displayed.map((learner) => {
              const billing = billingProfiles.find(
                (b) => b.learnerId === learner.id,
              );
              const summary = getMonthlyFeeSummary(
                classLogs,
                learner.id,
                now.getMonth(),
                now.getFullYear(),
                billing,
              );
              const currency = billing?.currency ?? profile?.currency ?? "INR";
              const scheduleLabel = formatLearnerSchedule(
                getLearnerScheduleSlots(learner.id, recurringRules, sessions),
              );

              return (
                <Link key={learner.id} href={`/learners/${learner.id}`}>
                  <Card animate={false} className="hover:border-olive/30 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-heading font-semibold text-text-primary truncate">
                          {learner.name}
                        </p>
                        <p className="text-xs text-text-muted truncate">
                          {[
                            learner.location,
                            scheduleLabel,
                            learner.phone,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono-data text-sm text-amber">
                          {formatFee(summary.totalDue, currency)}
                        </p>
                        <p className="text-xs text-text-muted">
                          {summary.classCount} classes ·{" "}
                          {formatFee(getPerClassRate(billing), currency)}/class
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default function LearnersPage() {
  return (
    <Suspense>
      <LearnersContent />
    </Suspense>
  );
}
