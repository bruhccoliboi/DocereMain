"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  onTranscript: (text: string, audioBlob?: Blob) => void;
  onRecordingChange?: (recording: boolean) => void;
  className?: string;
}

export function VoiceRecorder({
  onTranscript,
  onRecordingChange,
  className,
}: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(true);
  const finalRef = useRef("");
  const recognitionRef = useRef<{ stop: () => void; start: () => void } | null>(
    null,
  );
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const w = window as Window & {
      SpeechRecognition?: new () => SpeechRecognition;
      webkitSpeechRecognition?: new () => SpeechRecognition;
    };
    setSupported(
      Boolean(
        w.SpeechRecognition ||
          w.webkitSpeechRecognition ||
          navigator.mediaDevices,
      ),
    );
  }, []);

  const stopAll = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (mediaRef.current?.state === "recording") {
      mediaRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setRecording(false);
    onRecordingChange?.(false);
  }, [onRecordingChange]);

  const start = useCallback(async () => {
    finalRef.current = "";
    setInterim("");
    chunksRef.current = [];

    const w = window as Window & {
      SpeechRecognition?: new () => SpeechRecognition;
      webkitSpeechRecognition?: new () => SpeechRecognition;
    };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;

    if (SR) {
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-IN";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let chunk = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalRef.current += t + " ";
          } else {
            chunk += t;
          }
        }
        setInterim((finalRef.current + chunk).trim());
      };

      recognitionRef.current = recognition;
      recognition.start();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const text = (finalRef.current || interim).trim();
        if (text || blob.size > 0) {
          onTranscript(text, blob.size > 0 ? blob : undefined);
        }
      };
      mediaRef.current = recorder;
      recorder.start();
    } catch {
      /* speech-only */
    }

    setRecording(true);
    onRecordingChange?.(true);
  }, [interim, onRecordingChange, onTranscript]);

  const toggle = () => {
    if (recording) {
      const text = (finalRef.current || interim).trim();
      stopAll();
      if (text) onTranscript(text);
    } else {
      start();
    }
  };

  if (!supported) {
    return (
      <p className="text-xs text-text-muted">
        Voice recording is not supported in this browser.
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={recording ? "danger" : "outline"}
          size="sm"
          onClick={toggle}
        >
          {recording ? (
            <>
              <Square className="w-3.5 h-3.5" />
              Stop recording
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" />
              Voice note
            </>
          )}
        </Button>
        {recording && (
          <span className="flex items-center gap-2 text-xs text-amber">
            <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
            Listening...
          </span>
        )}
      </div>
      {(interim || recording) && (
        <div className="p-3 rounded-lg bg-surface-2 border border-[var(--border-subtle)] text-sm text-text-secondary italic min-h-[48px]">
          {interim || "Speak now..."}
        </div>
      )}
    </div>
  );
}

export function VoiceNotePlayer({ url }: { url: string }) {
  return (
    <audio
      controls
      src={url}
      className="w-full h-9 opacity-80"
      preload="metadata"
    />
  );
}
