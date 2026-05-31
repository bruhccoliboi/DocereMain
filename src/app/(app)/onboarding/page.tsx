"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useDocereStore } from "@/lib/store";
import type { TeachingFormat } from "@/lib/types";
import { addHours, setHours, setMinutes } from "date-fns";

const EDUCATOR_TYPES = [
  "Music Teacher",
  "Academic Tutor",
  "Language Teacher",
  "Coach",
  "Art Teacher",
  "Fitness Instructor",
  "Other",
];

const LEARNING_PRESETS: Record<string, { items: string; categories: string }> = {
  "Music Teacher": { items: "Songs & pieces", categories: "Techniques" },
  "Academic Tutor": { items: "Topics", categories: "Concepts" },
  "Language Teacher": { items: "Vocabulary", categories: "Grammar" },
  Coach: { items: "Skills", categories: "Drills" },
  "Art Teacher": { items: "Projects", categories: "Mediums" },
  "Fitness Instructor": { items: "Exercises", categories: "Programs" },
  Other: { items: "Learning items", categories: "Categories" },
};

export default function OnboardingPage() {
  const router = useRouter();
  const completeOnboarding = useDocereStore((s) => s.completeOnboarding);
  const addLearner = useDocereStore((s) => s.addLearner);
  const addSession = useDocereStore((s) => s.addSession);
  const setBillingProfile = useDocereStore((s) => s.setBillingProfile);

  const [step, setStep] = useState(0);
  const [educatorType, setEducatorType] = useState("");
  const [customType, setCustomType] = useState("");
  const [teachingFormat, setTeachingFormat] = useState<TeachingFormat>("one-on-one");
  const [learnerName, setLearnerName] = useState("");
  const [scheduleDay, setScheduleDay] = useState("1");
  const [scheduleTime, setScheduleTime] = useState("16:00");
  const [billingModel, setBillingModel] = useState<
    "monthly" | "per_session" | "package" | "skip"
  >("skip");
  const [feeAmount, setFeeAmount] = useState("4000");

  const totalSteps = 5;

  const finish = (skipRest = false) => {
    const type = educatorType === "Other" ? customType || "Educator" : educatorType;
    const labels = LEARNING_PRESETS[educatorType] ?? LEARNING_PRESETS.Other;

    completeOnboarding({
      educatorType: type,
      customEducatorType: educatorType === "Other" ? customType : undefined,
      teachingFormat,
      currency: "INR",
      learningStructureLabels: labels,
    });

    if (!skipRest && learnerName.trim()) {
      const learnerId = addLearner({
        name: learnerName.trim(),
        goals: [],
        notes: "",
        startDate: new Date().toISOString().split("T")[0],
        tags: [],
      });

      if (step >= 3 || scheduleTime) {
        const [h, m] = scheduleTime.split(":").map(Number);
        const start = setMinutes(setHours(new Date(), h), m);
        const dayOffset = parseInt(scheduleDay, 10);
        start.setDate(start.getDate() + ((dayOffset - start.getDay() + 7) % 7));
        const end = addHours(start, 1);

        addSession({
          learnerId,
          title: `Session with ${learnerName.trim()}`,
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          status: "scheduled",
          attendance: "scheduled",
          isGroup: teachingFormat !== "one-on-one",
        });
      }

      if (billingModel !== "skip") {
        setBillingProfile({
          learnerId,
          model: billingModel,
          feeAmount: parseFloat(feeAmount) || 0,
          currency: "INR",
          notes: "",
          makeupPolicyStudentMiss: "makeup_required",
          makeupPolicyTeacherMiss: "makeup_required",
          ...(billingModel === "package"
            ? {
                packageSessionsTotal: 8,
                packageSessionsRemaining: 8,
              }
            : {}),
        });
      }
    }

    router.replace("/dashboard");
  };

  const next = () => {
    if (step === totalSteps - 1) {
      finish();
      return;
    }
    setStep((s) => s + 1);
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono-data text-text-muted">
              Step {step + 1} of {totalSteps}
            </span>
            <button
              onClick={() => finish(true)}
              className="text-xs text-text-muted hover:text-olive transition-colors"
            >
              Skip setup
            </button>
          </div>
          <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
            <motion.div
              className="h-full bg-olive rounded-full"
              initial={false}
              animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && (
              <Card animate={false} padding="lg">
                <h2 className="font-heading text-xl font-semibold mb-2">
                  What kind of educator are you?
                </h2>
                <p className="text-sm text-text-muted mb-6">
                  Docere adapts to your teaching style. No music-only assumptions.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {EDUCATOR_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setEducatorType(type)}
                      className={`px-3 py-2.5 rounded-lg text-sm text-left border transition-all ${
                        educatorType === type
                          ? "border-olive/50 bg-olive/15 text-cream"
                          : "border-[var(--border-subtle)] bg-surface-2 text-text-secondary hover:border-olive/30"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {educatorType === "Other" && (
                  <div className="mt-4">
                    <Input
                      label="Your specialty"
                      placeholder="e.g. Dance instructor"
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                    />
                  </div>
                )}
              </Card>
            )}

            {step === 1 && (
              <Card animate={false} padding="lg">
                <h2 className="font-heading text-xl font-semibold mb-2">
                  Teaching format
                </h2>
                <p className="text-sm text-text-muted mb-6">
                  How do you usually teach?
                </p>
                <div className="space-y-2">
                  {(
                    [
                      ["one-on-one", "One-on-One"],
                      ["group", "Group Sessions"],
                      ["both", "Both"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setTeachingFormat(value)}
                      className={`w-full px-4 py-3 rounded-lg text-sm text-left border transition-all ${
                        teachingFormat === value
                          ? "border-olive/50 bg-olive/15 text-cream"
                          : "border-[var(--border-subtle)] bg-surface-2 text-text-secondary"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {step === 2 && (
              <Card animate={false} padding="lg">
                <h2 className="font-heading text-xl font-semibold mb-2">
                  Add your first learner
                </h2>
                <p className="text-sm text-text-muted mb-6">
                  Optional. You can add learners anytime from the Learners page.
                </p>
                <Input
                  label="Learner name"
                  placeholder="e.g. Priya Sharma"
                  value={learnerName}
                  onChange={(e) => setLearnerName(e.target.value)}
                />
              </Card>
            )}

            {step === 3 && (
              <Card animate={false} padding="lg">
                <h2 className="font-heading text-xl font-semibold mb-2">
                  Create a schedule
                </h2>
                <p className="text-sm text-text-muted mb-6">
                  Optional. Set a recurring time or skip and build later.
                </p>
                {learnerName ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-text-secondary block mb-1.5">
                        Day of week
                      </label>
                      <select
                        value={scheduleDay}
                        onChange={(e) => setScheduleDay(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg bg-surface-2 border border-[var(--border-subtle)] text-sm"
                      >
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                          (d, i) => (
                            <option key={d} value={i}>
                              {d}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                    <Input
                      label="Time"
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-text-muted italic">
                    Add a learner in the previous step to schedule, or skip.
                  </p>
                )}
              </Card>
            )}

            {step === 4 && (
              <Card animate={false} padding="lg">
                <h2 className="font-heading text-xl font-semibold mb-2">
                  Configure billing
                </h2>
                <p className="text-sm text-text-muted mb-6">
                  Optional. Highly configurable per learner later.
                </p>
                <div className="space-y-2 mb-4">
                  {(
                    [
                      ["monthly", "monthly"],
                      ["per_session", "Per session"],
                      ["skip", "Skip for now"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setBillingModel(value)}
                      className={`w-full px-4 py-3 rounded-lg text-sm text-left border transition-all ${
                        billingModel === value
                          ? "border-olive/50 bg-olive/15 text-cream"
                          : "border-[var(--border-subtle)] bg-surface-2 text-text-secondary"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {billingModel !== "skip" && (
                  <Input
                    label="Fee amount (INR)"
                    type="number"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                  />
                )}
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            onClick={back}
            disabled={step === 0}
            className={step === 0 ? "invisible" : ""}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            onClick={next}
            disabled={step === 0 && !educatorType}
          >
            {step === totalSteps - 1 ? (
              <>
                <Check className="w-4 h-4" />
                Open workspace
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
