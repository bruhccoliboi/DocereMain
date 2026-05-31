"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceRecorder, VoiceNotePlayer } from "./voice-recorder";
import { enrichNoteFromTranscript } from "@/lib/notes-ai";
import { useDocereStore } from "@/lib/store";
import type { TeachingSession } from "@/lib/types";
import { toast } from "sonner";

interface SessionNoteEditorProps {
  open: boolean;
  onClose: () => void;
  session: TeachingSession;
  learnerName: string;
  existingNoteId?: string;
}

export function SessionNoteEditor({
  open,
  onClose,
  session,
  learnerName,
  existingNoteId,
}: SessionNoteEditorProps) {
  const profile = useDocereStore((s) => s.profile);
  const sessionNotes = useDocereStore((s) => s.sessionNotes);
  const addSessionNote = useDocereStore((s) => s.addSessionNote);
  const updateSessionNote = useDocereStore((s) => s.updateSessionNote);
  const completeSession = useDocereStore((s) => s.completeSession);

  const existing = existingNoteId
    ? sessionNotes.find((n) => n.id === existingNoteId)
    : sessionNotes.find((n) => n.sessionId === session.id);

  const [quickNote, setQuickNote] = useState(existing?.quickNote ?? "");
  const [detailedNote, setDetailedNote] = useState(existing?.detailedNote ?? "");
  const [summary, setSummary] = useState(existing?.summary ?? "");
  const [progress, setProgress] = useState(existing?.progress ?? "");
  const [homework, setHomework] = useState(existing?.homework ?? "");
  const [nextFocus, setNextFocus] = useState(existing?.nextSessionFocus ?? "");
  const [voiceUrl, setVoiceUrl] = useState(existing?.voiceNoteUrl ?? "");
  const [transcript, setTranscript] = useState(existing?.voiceTranscript ?? "");
  const [enriching, setEnriching] = useState(false);
  const [tab, setTab] = useState<"quick" | "detailed" | "structured">("quick");

  const handleTranscript = async (text: string, blob?: Blob) => {
    setTranscript(text);
    setQuickNote((q) => (q ? `${q}\n${text}` : text));
    if (blob) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") setVoiceUrl(reader.result);
      };
      reader.readAsDataURL(blob);
    }
    setEnriching(true);
    try {
      const enriched = await enrichNoteFromTranscript(
        text,
        profile?.educatorType,
      );
      setSummary(enriched.summary);
      setProgress(enriched.progress);
      setHomework(enriched.homework);
      setNextFocus(enriched.nextSessionFocus);
      setDetailedNote(enriched.detailedNote);
      setTab("structured");
      toast.success("Notes structured from voice");
    } catch {
      toast.error("Could not enrich notes");
    } finally {
      setEnriching(false);
    }
  };

  const enrichManual = async () => {
    const source = detailedNote || quickNote;
    if (!source.trim()) return;
    setEnriching(true);
    try {
      const enriched = await enrichNoteFromTranscript(
        source,
        profile?.educatorType,
      );
      setSummary(enriched.summary);
      setProgress(enriched.progress);
      setHomework(enriched.homework);
      setNextFocus(enriched.nextSessionFocus);
      setTab("structured");
      toast.success("Notes structured");
    } finally {
      setEnriching(false);
    }
  };

  const save = () => {
    const payload = {
      sessionId: session.id,
      learnerId: session.learnerId,
      quickNote,
      detailedNote,
      summary,
      progress,
      homework,
      nextSessionFocus: nextFocus,
      voiceNoteUrl: voiceUrl || undefined,
      voiceTranscript: transcript || undefined,
    };

    if (existing) {
      updateSessionNote(existing.id, payload);
      toast.success("Note updated");
    } else {
      addSessionNote(payload);
      toast.success("Note saved to timeline");
    }

    if (session.status !== "completed") {
      completeSession(session.id, "present");
    }
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[var(--border-strong)] bg-surface-1 shadow-2xl"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] bg-surface-1/95 backdrop-blur">
            <div>
              <p className="text-xs text-text-muted">Session note</p>
              <h2 className="font-heading text-lg font-semibold">{learnerName}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-2 text-text-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            <VoiceRecorder onTranscript={handleTranscript} />
            {voiceUrl && <VoiceNotePlayer url={voiceUrl} />}

            <div className="flex gap-1 p-1 rounded-lg bg-surface-2 border border-[var(--border-subtle)]">
              {(["quick", "detailed", "structured"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-heading capitalize transition-all ${
                    tab === t
                      ? "bg-olive/20 text-cream"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === "quick" && (
              <textarea
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                placeholder="Quick notes from today's session..."
                className="w-full min-h-[140px] p-3 rounded-lg bg-surface-2 border border-[var(--border-subtle)] text-sm resize-y"
              />
            )}

            {tab === "detailed" && (
              <textarea
                value={detailedNote}
                onChange={(e) => setDetailedNote(e.target.value)}
                placeholder="Detailed session documentation..."
                className="w-full min-h-[180px] p-3 rounded-lg bg-surface-2 border border-[var(--border-subtle)] text-sm resize-y"
              />
            )}

            {tab === "structured" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-olive font-medium block mb-1.5">
                    Summary
                  </label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full min-h-[60px] p-3 rounded-lg bg-surface-2 border border-[var(--border-subtle)] text-sm resize-y"
                  />
                </div>
                <div>
                  <label className="text-xs text-olive font-medium block mb-1.5">
                    Progress
                  </label>
                  <textarea
                    value={progress}
                    onChange={(e) => setProgress(e.target.value)}
                    className="w-full min-h-[60px] p-3 rounded-lg bg-surface-2 border border-[var(--border-subtle)] text-sm resize-y"
                  />
                </div>
                <div>
                  <label className="text-xs text-olive font-medium block mb-1.5">
                    Homework
                  </label>
                  <textarea
                    value={homework}
                    onChange={(e) => setHomework(e.target.value)}
                    className="w-full min-h-[60px] p-3 rounded-lg bg-surface-2 border border-[var(--border-subtle)] text-sm resize-y"
                  />
                </div>
                <div>
                  <label className="text-xs text-olive font-medium block mb-1.5">
                    Next session focus
                  </label>
                  <textarea
                    value={nextFocus}
                    onChange={(e) => setNextFocus(e.target.value)}
                    className="w-full min-h-[60px] p-3 rounded-lg bg-surface-2 border border-[var(--border-subtle)] text-sm resize-y"
                  />
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={enrichManual}
              disabled={enriching}
            >
              {enriching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Structure with AI
            </Button>
          </div>

          <div className="sticky bottom-0 flex gap-2 p-5 border-t border-[var(--border-subtle)] bg-surface-1">
            <Button onClick={save} className="flex-1">
              <Save className="w-4 h-4" />
              Save to timeline
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
