"use client";

import { Search, Command } from "lucide-react";
import { useCommandPalette } from "@/components/search/command-palette-provider";
import { format } from "date-fns";

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const { open } = useCommandPalette();
  const today = format(new Date(), "EEEE, MMMM d");

  return (
    <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-[var(--border-subtle)] bg-bg-charcoal/50 backdrop-blur-md sticky top-0 z-20">
      <div>
        <p className="text-xs text-text-muted font-mono-data mb-0.5">{today}</p>
        <h1 className="font-heading text-xl font-semibold text-text-primary tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>
        )}
      </div>

      <button
        onClick={open}
        className="flex items-center gap-2 h-9 px-3 rounded-lg bg-surface-2 border border-[var(--border-subtle)] text-text-secondary hover:text-text-primary hover:border-olive/30 transition-all text-sm min-w-[200px]"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-3 text-[10px] font-mono-data text-text-muted border border-[var(--border-subtle)]">
          <Command className="w-2.5 h-2.5" />K
        </kbd>
      </button>
    </header>
  );
}
