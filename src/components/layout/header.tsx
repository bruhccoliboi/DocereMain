"use client";



import { format } from "date-fns";

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {

  const today = format(new Date(), "EEEE, MMMM d");

  return (
    <header className="flex flex-col items-center justify-center gap-1 px-6 py-4 border-b border-[var(--border-subtle)] bg-bg-charcoal/50 backdrop-blur-md sticky top-0 z-20">
      <p className="text-xs text-text-muted font-mono-data">{today}</p>
      <h1 className="font-heading text-xl font-semibold text-text-primary tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-text-secondary">{subtitle}</p>
      )}
    </header>
  );
}
