"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  addWeeks,
  setDay,
  setHours,
  setMinutes,
  parseISO,
  isSameMinute,
} from "date-fns";
import type {
  BillingProfile,
  ClassLog,
  ClassMissReason,
  DocereState,
  EducatorProfile,
  Learner,
  LearningItem,
  MakeupObligation,
  Payment,
  RecurringRule,
  SessionNote,
  TeachingFormat,
  TeachingSession,
} from "./types";
import { generateId } from "./utils";

interface DocereActions {
  completeOnboarding: (data: {
    educatorType: string;
    customEducatorType?: string;
    teachingFormat: TeachingFormat;
    currency?: string;
    learningStructureLabels?: EducatorProfile["learningStructureLabels"];
  }) => void;
  hydrateFromCloud: (state: Partial<DocereState>) => void;
  addLearner: (learner: Omit<Learner, "id" | "createdAt" | "updatedAt">) => string;
  updateLearner: (id: string, data: Partial<Learner>) => void;
  deleteLearner: (id: string) => void;
  setBillingProfile: (profile: BillingProfile) => void;
  setPerClassRate: (learnerId: string, rate: number, currency?: string) => void;
  setClassLogEntry: (
    learnerId: string,
    date: string,
    entry:
      | { status: "conducted" }
      | { status: "missed"; missReason: ClassMissReason }
      | null,
  ) => void;
  addSession: (session: Omit<TeachingSession, "id" | "createdAt">) => string;
  updateSession: (id: string, data: Partial<TeachingSession>) => void;
  deleteSession: (id: string) => void;
  moveSession: (id: string, newStartAt: string, newEndAt: string) => void;
  duplicateSession: (sessionId: string, offsetDays?: number) => string;
  rescheduleSession: (
    sessionId: string,
    newStart: string,
    newEnd: string,
    reason: MakeupObligation["reason"],
  ) => string;
  completeSession: (
    sessionId: string,
    attendance: TeachingSession["attendance"],
  ) => void;
  addSessionNote: (note: Omit<SessionNote, "id" | "createdAt">) => string;
  updateSessionNote: (id: string, data: Partial<SessionNote>) => void;
  deleteSessionNote: (id: string) => void;
  addPayment: (payment: Omit<Payment, "id" | "createdAt">) => string;
  addLearningItem: (
    item: Omit<LearningItem, "id" | "createdAt">,
  ) => string;
  updateLearningItem: (id: string, data: Partial<LearningItem>) => void;
  deleteLearningItem: (id: string) => void;
  addRecurringRule: (rule: Omit<RecurringRule, "id">) => string;
  updateRecurringRule: (id: string, data: Partial<RecurringRule>) => void;
  generateRecurringSessions: (weeksAhead?: number, onlyRuleId?: string) => number;
  fulfillMakeup: (obligationId: string, replacementSessionId: string) => void;
  forfeitMakeup: (obligationId: string) => void;
  decrementPackageSession: (learnerId: string) => void;
  exportWorkspace: () => string;
  importWorkspace: (json: string) => boolean;
  resetWorkspace: () => void;
  markSynced: () => void;
  lastSyncedAt: string | null;
}

const emptyState: DocereState = {
  profile: null,
  learners: [],
  sessions: [],
  sessionNotes: [],
  payments: [],
  billingProfiles: [],
  learningItems: [],
  makeupObligations: [],
  recurringRules: [],
  classLogs: [],
};

export const useDocereStore = create<DocereState & DocereActions & { lastSyncedAt: string | null }>()(
  persist(
    (set, get) => ({
      ...emptyState,
      lastSyncedAt: null,

      markSynced: () => set({ lastSyncedAt: new Date().toISOString() }),

      hydrateFromCloud: (state) => {
        set((s) => ({
          ...s,
          ...state,
          lastSyncedAt: new Date().toISOString(),
        }));
      },

      completeOnboarding: (data) => {
        const profile: EducatorProfile = {
          id: generateId(),
          educatorType: data.educatorType,
          customEducatorType: data.customEducatorType,
          teachingFormat: data.teachingFormat,
          onboardingCompleted: true,
          currency: data.currency ?? "INR",
          defaultPaymentMethods: ["UPI", "Cash", "Bank Transfer", "Card"],
          learningStructureLabels: data.learningStructureLabels ?? {
            items: "Learning items",
            categories: "Categories",
          },
          createdAt: new Date().toISOString(),
        };
        set({ profile });
      },

      addLearner: (learner) => {
        const id = generateId();
        const now = new Date().toISOString();
        const entry: Learner = {
          ...learner,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ learners: [...s.learners, entry] }));
        return id;
      },

      updateLearner: (id, data) => {
        set((s) => ({
          learners: s.learners.map((l) =>
            l.id === id
              ? { ...l, ...data, updatedAt: new Date().toISOString() }
              : l,
          ),
        }));
      },

      deleteLearner: (id) => {
        set((s) => ({
          learners: s.learners.filter((l) => l.id !== id),
          sessions: s.sessions.filter((sess) => sess.learnerId !== id),
          sessionNotes: s.sessionNotes.filter((n) => n.learnerId !== id),
          payments: s.payments.filter((p) => p.learnerId !== id),
          billingProfiles: s.billingProfiles.filter(
            (b) => b.learnerId !== id,
          ),
          learningItems: s.learningItems.filter((i) => i.learnerId !== id),
          makeupObligations: s.makeupObligations.filter(
            (m) => m.learnerId !== id,
          ),
          recurringRules: s.recurringRules.filter((r) => r.learnerId !== id),
          classLogs: s.classLogs.filter((c) => c.learnerId !== id),
        }));
      },

      setBillingProfile: (profile) => {
        set((s) => {
          const existing = s.billingProfiles.filter(
            (b) => b.learnerId !== profile.learnerId,
          );
          return { billingProfiles: [...existing, profile] };
        });
      },

      setPerClassRate: (learnerId, rate, currency) => {
        const profile = get().profile;
        get().setBillingProfile({
          learnerId,
          model: "per_session",
          feeAmount: rate,
          currency: currency ?? profile?.currency ?? "INR",
          notes: "",
          makeupPolicyStudentMiss: "makeup_required",
          makeupPolicyTeacherMiss: "makeup_required",
        });
      },

      setClassLogEntry: (learnerId, date, entry) => {
        const without = get().classLogs.filter(
          (c) => !(c.learnerId === learnerId && c.date === date),
        );
        if (!entry) {
          set({ classLogs: without });
          return;
        }
        const existing = get().classLogs.find(
          (c) => c.learnerId === learnerId && c.date === date,
        );
        const log: ClassLog = {
          id: existing?.id ?? generateId(),
          learnerId,
          date,
          status: entry.status,
          missReason:
            entry.status === "missed" ? entry.missReason : undefined,
        };
        set({ classLogs: [...without, log] });
      },

      addSession: (session) => {
        const id = generateId();
        const entry: TeachingSession = {
          ...session,
          id,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ sessions: [...s.sessions, entry] }));
        return id;
      },

      updateSession: (id, data) => {
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === id ? { ...sess, ...data } : sess,
          ),
        }));
      },

      deleteSession: (id) => {
        set((s) => ({
          sessions: s.sessions
            .filter((sess) => sess.id !== id)
            .map((sess) => ({
              ...sess,
              rescheduledFromId:
                sess.rescheduledFromId === id
                  ? undefined
                  : sess.rescheduledFromId,
              rescheduledToId:
                sess.rescheduledToId === id ? undefined : sess.rescheduledToId,
            })),
          sessionNotes: s.sessionNotes.filter((n) => n.sessionId !== id),
          makeupObligations: s.makeupObligations.filter(
            (m) =>
              m.originalSessionId !== id && m.replacementSessionId !== id,
          ),
        }));
      },

      moveSession: (id, newStartAt, newEndAt) => {
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === id
              ? { ...sess, startAt: newStartAt, endAt: newEndAt }
              : sess,
          ),
        }));
      },

      duplicateSession: (sessionId, offsetDays = 7) => {
        const original = get().sessions.find((s) => s.id === sessionId);
        if (!original) return "";
        const start = parseISO(original.startAt);
        const end = parseISO(original.endAt);
        start.setDate(start.getDate() + offsetDays);
        end.setDate(end.getDate() + offsetDays);
        return get().addSession({
          learnerId: original.learnerId,
          learnerIds: original.learnerIds,
          title: original.title,
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          status: "scheduled",
          attendance: "scheduled",
          isGroup: original.isGroup,
          location: original.location,
          recurringRuleId: original.recurringRuleId,
        });
      },

      rescheduleSession: (sessionId, newStart, newEnd, reason) => {
        const state = get();
        const original = state.sessions.find((s) => s.id === sessionId);
        if (!original) return "";

        const newId = generateId();
        const obligationId = generateId();

        const replacement: TeachingSession = {
          id: newId,
          learnerId: original.learnerId,
          learnerIds: original.learnerIds,
          title: original.title,
          startAt: newStart,
          endAt: newEnd,
          status: "scheduled",
          attendance: "scheduled",
          isGroup: original.isGroup,
          rescheduledFromId: sessionId,
          makeupObligationId: obligationId,
          createdAt: new Date().toISOString(),
        };

        const obligation: MakeupObligation = {
          id: obligationId,
          learnerId: original.learnerId,
          originalSessionId: sessionId,
          replacementSessionId: newId,
          reason,
          status: "owed",
          notes: "",
          createdAt: new Date().toISOString(),
        };

        set((s) => ({
          sessions: [
            ...s.sessions.map((sess) =>
              sess.id === sessionId
                ? {
                    ...sess,
                    status: "rescheduled" as const,
                    attendance: "rescheduled" as const,
                    rescheduledToId: newId,
                  }
                : sess,
            ),
            replacement,
          ],
          makeupObligations: [...s.makeupObligations, obligation],
        }));

        return newId;
      },

      completeSession: (sessionId, attendance) => {
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? { ...sess, status: "completed", attendance }
              : sess,
          ),
        }));

        const session = get().sessions.find((s) => s.id === sessionId);
        if (!session) return;

        if (attendance === "present") {
          const billing = get().billingProfiles.find(
            (b) => b.learnerId === session.learnerId,
          );
          if (billing?.model === "package") {
            get().decrementPackageSession(session.learnerId);
          }
        }

        if (attendance === "absent") {
          const billing = get().billingProfiles.find(
            (b) => b.learnerId === session.learnerId,
          );
          if (billing?.makeupPolicyStudentMiss === "makeup_required") {
            const obligation: MakeupObligation = {
              id: generateId(),
              learnerId: session.learnerId,
              originalSessionId: sessionId,
              reason: "student_miss",
              status: "owed",
              notes: "Student absent",
              createdAt: new Date().toISOString(),
            };
            set((s) => ({
              makeupObligations: [...s.makeupObligations, obligation],
            }));
          }
        }
      },

      addSessionNote: (note) => {
        const id = generateId();
        const entry: SessionNote = {
          ...note,
          id,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ sessionNotes: [...s.sessionNotes, entry] }));
        return id;
      },

      updateSessionNote: (id, data) => {
        set((s) => ({
          sessionNotes: s.sessionNotes.map((n) =>
            n.id === id ? { ...n, ...data } : n,
          ),
        }));
      },

      deleteSessionNote: (id) => {
        set((s) => ({
          sessionNotes: s.sessionNotes.filter((n) => n.id !== id),
        }));
      },

      addPayment: (payment) => {
        const id = generateId();
        const entry: Payment = {
          ...payment,
          id,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ payments: [...s.payments, entry] }));
        return id;
      },

      addLearningItem: (item) => {
        const id = generateId();
        const entry: LearningItem = {
          ...item,
          id,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ learningItems: [...s.learningItems, entry] }));
        return id;
      },

      updateLearningItem: (id, data) => {
        set((s) => ({
          learningItems: s.learningItems.map((i) =>
            i.id === id ? { ...i, ...data } : i,
          ),
        }));
      },

      deleteLearningItem: (id) => {
        set((s) => ({
          learningItems: s.learningItems.filter((i) => i.id !== id),
        }));
      },

      addRecurringRule: (rule) => {
        const id = generateId();
        set((s) => ({
          recurringRules: [...s.recurringRules, { ...rule, id }],
        }));
        return id;
      },

      updateRecurringRule: (id, data) => {
        set((s) => ({
          recurringRules: s.recurringRules.map((r) =>
            r.id === id ? { ...r, ...data } : r,
          ),
        }));
      },

      generateRecurringSessions: (weeksAhead = 8, onlyRuleId?: string) => {
        let created = 0;
        const now = new Date();

        const rules = get().recurringRules.filter(
          (r) => r.active && (!onlyRuleId || r.id === onlyRuleId),
        );

        for (const rule of rules) {
          const [h, m] = rule.startTime.split(":").map(Number);

          for (let w = 0; w < weeksAhead; w++) {
            const weekBase = addWeeks(now, w);
            let slot = setDay(weekBase, rule.dayOfWeek, { weekStartsOn: 1 });
            slot = setMinutes(setHours(slot, h), m);
            if (slot < now) continue;

            const exists = get().sessions.some(
              (s) =>
                s.learnerId === rule.learnerId &&
                isSameMinute(parseISO(s.startAt), slot),
            );
            if (exists) continue;

            const end = new Date(slot);
            end.setMinutes(end.getMinutes() + rule.durationMinutes);

            get().addSession({
              learnerId: rule.learnerId,
              title: rule.title,
              startAt: slot.toISOString(),
              endAt: end.toISOString(),
              status: "scheduled",
              attendance: "scheduled",
              isGroup: rule.isGroup,
              recurringRuleId: rule.id,
            });
            created++;
          }
        }
        return created;
      },

      fulfillMakeup: (obligationId, replacementSessionId) => {
        set((s) => ({
          makeupObligations: s.makeupObligations.map((o) =>
            o.id === obligationId
              ? {
                  ...o,
                  status: "completed",
                  replacementSessionId,
                  completedAt: new Date().toISOString(),
                }
              : o,
          ),
        }));
      },

      forfeitMakeup: (obligationId) => {
        set((s) => ({
          makeupObligations: s.makeupObligations.map((o) =>
            o.id === obligationId ? { ...o, status: "forfeited" } : o,
          ),
        }));
      },

      decrementPackageSession: (learnerId) => {
        set((s) => ({
          billingProfiles: s.billingProfiles.map((b) => {
            if (b.learnerId !== learnerId || b.model !== "package") return b;
            const remaining = Math.max(
              0,
              (b.packageSessionsRemaining ?? 0) - 1,
            );
            return { ...b, packageSessionsRemaining: remaining };
          }),
        }));
      },

      exportWorkspace: () => {
        const s = get();
        const payload: DocereState = {
          profile: s.profile,
          learners: s.learners,
          sessions: s.sessions,
          sessionNotes: s.sessionNotes,
          payments: s.payments,
          billingProfiles: s.billingProfiles,
          learningItems: s.learningItems,
          makeupObligations: s.makeupObligations,
          recurringRules: s.recurringRules,
          classLogs: s.classLogs,
        };
        return JSON.stringify(payload, null, 2);
      },

      importWorkspace: (json) => {
        try {
          const data = JSON.parse(json) as DocereState;
          if (!data || typeof data !== "object") return false;
          set({ ...emptyState, ...data, lastSyncedAt: null });
          return true;
        } catch {
          return false;
        }
      },

      resetWorkspace: () => set({ ...emptyState, lastSyncedAt: null }),
    }),
    {
      name: "docere-workspace",
      version: 4,
      migrate: (persisted, version) => {
        const state = persisted as DocereState & {
          lastSyncedAt?: string | null;
          classLogs?: (ClassLog & { status?: ClassLog["status"] })[];
        };
        let classLogs = (state.classLogs ?? []).map((log) => ({
          ...log,
          status: log.status ?? ("conducted" as const),
        }));
        if (version < 3) {
          classLogs = classLogs ?? [];
        }
        return { ...state, classLogs, lastSyncedAt: null };
      },
    },
  ),
);
