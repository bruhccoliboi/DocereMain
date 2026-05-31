"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 p-4 rounded-2xl bg-surface-2 border border-[var(--border-subtle)] text-olive">
          {icon}
        </div>
      )}
      <h3 className="font-heading text-lg font-semibold text-text-primary mb-2">
        {title}
      </h3>
      {description ? (
        <p className="text-sm text-text-muted max-w-sm leading-relaxed">
          {description}
        </p>
      ) : null}
      {action && (
        <Button className="mt-6" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
