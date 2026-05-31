"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  animate?: boolean;
  padding?: "sm" | "md" | "lg";
}

const paddingMap = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({
  children,
  className,
  title,
  subtitle,
  action,
  animate = true,
  padding = "md",
}: CardProps) {
  const content = (
    <div
      className={cn(
        "rounded-xl border border-[var(--border-subtle)] bg-surface-1",
        "shadow-[var(--shadow-soft)]",
        paddingMap[padding],
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && (
              <h3 className="font-heading text-sm font-semibold text-text-primary tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {content}
    </motion.div>
  );
}
