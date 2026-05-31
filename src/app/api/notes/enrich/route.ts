import { NextResponse } from "next/server";
import { enrichNoteLocally, type EnrichedNoteFields } from "@/lib/notes-ai";

export async function POST(request: Request) {
  const body = await request.json();
  const transcript = String(body.transcript ?? "").trim();
  const educatorType = String(body.educatorType ?? "educator");

  if (!transcript) {
    return NextResponse.json(enrichNoteLocally(""));
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(enrichNoteLocally(transcript));
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You help ${educatorType}s document teaching sessions. Extract structured fields from session notes or transcripts. Respond ONLY with valid JSON: {"summary":"","progress":"","homework":"","nextSessionFocus":"","detailedNote":""}. Keep each field concise. detailedNote preserves the full substance.`,
          },
          {
            role: "user",
            content: transcript,
          },
        ],
      }),
    });

    if (!res.ok) {
      return NextResponse.json(enrichNoteLocally(transcript));
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(enrichNoteLocally(transcript));
    }

    const parsed = JSON.parse(content) as EnrichedNoteFields;
    return NextResponse.json({
      summary: parsed.summary ?? "",
      progress: parsed.progress ?? "",
      homework: parsed.homework ?? "",
      nextSessionFocus: parsed.nextSessionFocus ?? "",
      detailedNote: parsed.detailedNote ?? transcript,
    });
  } catch {
    return NextResponse.json(enrichNoteLocally(transcript));
  }
}
