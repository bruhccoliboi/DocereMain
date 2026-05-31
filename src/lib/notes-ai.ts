/** Structured note fields extracted from transcript or free text */

export interface EnrichedNoteFields {
  summary: string;
  progress: string;
  homework: string;
  nextSessionFocus: string;
  detailedNote: string;
}

const HOMEWORK_PATTERNS = [
  /homework[:\s]+([^.!?\n]+)/i,
  /practice[:\s]+([^.!?\n]+)/i,
  /assign(?:ed)?[:\s]+([^.!?\n]+)/i,
  /work on[:\s]+([^.!?\n]+)/i,
];

const NEXT_PATTERNS = [
  /next (?:session|time|lesson)[:\s]+([^.!?\n]+)/i,
  /focus on[:\s]+([^.!?\n]+)/i,
  /we(?:'ll| will) (?:work on|cover|start)[:\s]+([^.!?\n]+)/i,
];

const PROGRESS_PATTERNS = [
  /improved?\s+([^.!?\n]+)/i,
  /progress(?:ed)?\s+(?:on|with|in)\s+([^.!?\n]+)/i,
  /getting better at\s+([^.!?\n]+)/i,
  /mastered?\s+([^.!?\n]+)/i,
];

function extractFirst(patterns: RegExp[], text: string): string {
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return "";
}

function firstSentences(text: string, count: number): string {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.slice(0, count).join(" ");
}

/** Client-side enrichment when no API key is available */
export function enrichNoteLocally(transcript: string): EnrichedNoteFields {
  const trimmed = transcript.trim();
  if (!trimmed) {
    return {
      summary: "",
      progress: "",
      homework: "",
      nextSessionFocus: "",
      detailedNote: "",
    };
  }

  const homework = extractFirst(HOMEWORK_PATTERNS, trimmed);
  const nextSessionFocus = extractFirst(NEXT_PATTERNS, trimmed);
  let progress = extractFirst(PROGRESS_PATTERNS, trimmed);

  if (!progress && /improv|better|consistent|progress|master/i.test(trimmed)) {
    progress = firstSentences(trimmed, 1);
  }

  const summary =
    trimmed.length <= 160 ? trimmed : firstSentences(trimmed, 2);

  return {
    summary,
    progress,
    homework,
    nextSessionFocus,
    detailedNote: trimmed,
  };
}

export async function enrichNoteFromTranscript(
  transcript: string,
  educatorType?: string,
): Promise<EnrichedNoteFields> {
  const trimmed = transcript.trim();
  if (!trimmed) return enrichNoteLocally("");

  try {
    const res = await fetch("/api/notes/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: trimmed, educatorType }),
    });

    if (res.ok) {
      const data = (await res.json()) as EnrichedNoteFields;
      return data;
    }
  } catch {
    /* fall through */
  }

  return enrichNoteLocally(trimmed);
}
