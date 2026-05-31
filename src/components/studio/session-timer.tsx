"use client";

import { useEffect, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SessionTimerProps {
  defaultMinutes?: number;
  className?: string;
}

export function SessionTimer({ defaultMinutes = 60, className }: SessionTimerProps) {
  const [seconds, setSeconds] = useState(defaultMinutes * 60);
  const [running, setRunning] = useState(false);
  const [initial] = useState(defaultMinutes * 60);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const progress = 1 - seconds / initial;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="var(--surface-3)"
            strokeWidth="2"
          />
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="var(--olive)"
            strokeWidth="2"
            strokeDasharray={`${progress * 100} 100`}
            pathLength="100"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono-data text-sm text-cream">
          {m}:{s.toString().padStart(2, "0")}
        </span>
      </div>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setRunning((r) => !r)}
        >
          {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setRunning(false);
            setSeconds(initial);
          }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
