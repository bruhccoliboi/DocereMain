"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  FileText,
  Calendar,
  CreditCard,
  Target,
  RefreshCw,
} from "lucide-react";
import { useDocereStore } from "@/lib/store";
import { searchDocere } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeIcons: Record<string, React.ElementType> = {
  learner: GraduationCap,
  note: FileText,
  session: Calendar,
  payment: CreditCard,
  learning: Target,
  goal: Target,
  reschedule: RefreshCw,
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const learners = useDocereStore((s) => s.learners);
  const sessions = useDocereStore((s) => s.sessions);
  const sessionNotes = useDocereStore((s) => s.sessionNotes);
  const payments = useDocereStore((s) => s.payments);
  const learningItems = useDocereStore((s) => s.learningItems);

  const results = searchDocere(query, {
    learners,
    sessions,
    notes: sessionNotes,
    payments,
    learningItems,
  });

  const navigate = useCallback(
    (href: string) => {
      onOpenChange(false);
      setQuery("");
      router.push(href);
    },
    [router, onOpenChange],
  );

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[15%] -translate-x-1/2 w-full max-w-xl z-50 px-4"
          >
            <Command
              className="rounded-xl border border-[var(--border-strong)] bg-surface-1 shadow-2xl overflow-hidden"
              shouldFilter={false}
            >
              <div className="flex items-center gap-3 px-4 border-b border-[var(--border-subtle)]">
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search learners, notes, sessions..."
                  className="flex-1 h-12 bg-transparent text-sm text-text-primary placeholder:text-text-muted"
                  autoFocus
                />
              </div>
              <Command.List className="max-h-80 overflow-y-auto p-2">
                {query && results.length === 0 && (
                  <Command.Empty className="py-8 text-center text-sm text-text-muted">
                    No results found
                  </Command.Empty>
                )}
                {!query && (
                  <div className="p-2 space-y-1">
                      {[
                        { label: "Today", href: "/dashboard" },
                        { label: "Add learner", href: "/learners?new=true" },
                        { label: "Schedule", href: "/schedule" },
                        { label: "Studio", href: "/studio" },
                      ].map((item) => (
                        <Command.Item
                          key={item.href}
                          value={item.label}
                          onSelect={() => navigate(item.href)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary cursor-pointer data-[selected=true]:bg-olive/15 data-[selected=true]:text-cream"
                        >
                          {item.label}
                        </Command.Item>
                      ))}
                  </div>
                )}
                {results.map((r) => {
                  const Icon = typeIcons[r.type] ?? FileText;
                  return (
                    <Command.Item
                      key={`${r.type}-${r.id}`}
                      value={`${r.title} ${r.subtitle}`}
                      onSelect={() => navigate(r.href)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer data-[selected=true]:bg-olive/15"
                    >
                      <Icon className="w-4 h-4 text-olive shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">{r.title}</p>
                        <p className="text-xs text-text-muted truncate">{r.subtitle}</p>
                      </div>
                    </Command.Item>
                  );
                })}
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
