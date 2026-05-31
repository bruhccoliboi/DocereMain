"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full h-9 px-3 rounded-lg text-sm",
            "bg-surface-2 border border-[var(--border-subtle)]",
            "text-text-primary placeholder:text-text-muted",
            "focus:outline-none focus:border-olive/50 focus:ring-1 focus:ring-olive/30",
            "transition-colors font-body",
            className,
          )}
          {...props}
        />
        {hint && <p className="text-xs text-text-muted">{hint}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";
