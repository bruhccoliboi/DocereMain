export type TeachingFormat = "one-on-one" | "group" | "both";

export type AttendanceStatus =
  | "present"
  | "absent"
  | "cancelled"
  | "rescheduled"
  | "scheduled";

export type PaymentStatus =
  | "paid"
  | "due_soon"
  | "overdue"
  | "partial"
  | "package_active"
  | "package_expired";

export type BillingModel =
  | "monthly"
  | "per_session"
  | "package"
  | "group"
  | "custom";

export type SessionStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled";

export type MakeupPolicyStudentMiss = "forfeit" | "makeup_required";
export type MakeupPolicyTeacherMiss = "makeup_required" | "none";

export interface EducatorProfile {
  id: string;
  educatorType: string;
  customEducatorType?: string;
  teachingFormat: TeachingFormat;
  onboardingCompleted: boolean;
  currency: string;
  defaultPaymentMethods: string[];
  learningStructureLabels: {
    items: string;
    categories: string;
  };
  createdAt: string;
}

export interface Learner {
  id: string;
  name: string;
  location?: string;
  photoUrl?: string;
  email?: string;
  phone?: string;
  goals: string[];
  notes: string;
  startDate: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type ClassLogStatus = "conducted" | "missed";

export type ClassMissReason =
  | "rescheduled"
  | "student_unwell"
  | "out_of_station"
  | "instructor_unavailable";

/** Per-date class outcome for monthly billing and attendance */
export interface ClassLog {
  id: string;
  learnerId: string;
  date: string;
  status: ClassLogStatus;
  missReason?: ClassMissReason;
}

export interface BillingProfile {
  learnerId: string;
  model: BillingModel;
  feeAmount: number;
  currency: string;
  dueDayOfMonth?: number;
  paymentFrequency?: string;
  paymentMethod?: string;
  notes: string;
  packageSessionsTotal?: number;
  packageSessionsRemaining?: number;
  packageExpiresAt?: string;
  customRules?: string;
  makeupPolicyStudentMiss: MakeupPolicyStudentMiss;
  makeupPolicyTeacherMiss: MakeupPolicyTeacherMiss;
  makeupPolicyCustom?: string;
}

export interface LearningItem {
  id: string;
  learnerId: string;
  title: string;
  category: string;
  status: "active" | "completed" | "paused";
  notes: string;
  createdAt: string;
}

export interface TeachingSession {
  id: string;
  learnerId: string;
  learnerIds?: string[];
  title: string;
  startAt: string;
  endAt: string;
  status: SessionStatus;
  attendance: AttendanceStatus;
  isGroup: boolean;
  recurringRuleId?: string;
  rescheduledFromId?: string;
  rescheduledToId?: string;
  makeupObligationId?: string;
  location?: string;
  createdAt: string;
}

export interface SessionNote {
  id: string;
  sessionId: string;
  learnerId: string;
  quickNote: string;
  detailedNote: string;
  voiceNoteUrl?: string;
  voiceTranscript?: string;
  summary: string;
  progress: string;
  homework: string;
  nextSessionFocus: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  learnerId: string;
  amount: number;
  currency: string;
  date: string;
  method: string;
  status: PaymentStatus;
  notes: string;
  /** Calendar month this payment applies to (0–11) */
  billingMonth?: number;
  /** Calendar year this payment applies to */
  billingYear?: number;
  classCount?: number;
  ratePerClass?: number;
  createdAt: string;
}

export interface MakeupObligation {
  id: string;
  learnerId: string;
  originalSessionId: string;
  replacementSessionId?: string;
  reason: "student_miss" | "teacher_miss" | "custom";
  status: "owed" | "completed" | "forfeited";
  notes: string;
  createdAt: string;
  completedAt?: string;
}

export interface RecurringRule {
  id: string;
  learnerId: string;
  title: string;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
  isGroup: boolean;
  active: boolean;
}

export interface DocereState {
  profile: EducatorProfile | null;
  learners: Learner[];
  sessions: TeachingSession[];
  sessionNotes: SessionNote[];
  payments: Payment[];
  billingProfiles: BillingProfile[];
  learningItems: LearningItem[];
  makeupObligations: MakeupObligation[];
  recurringRules: RecurringRule[];
  classLogs: ClassLog[];
}
