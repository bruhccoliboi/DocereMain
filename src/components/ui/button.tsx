"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-olive text-bg-deep hover:bg-sage border border-olive/30 shadow-[0_0_20px_var(--glow-olive)]",
  secondary:
    "bg-surface-2 text-text-primary hover:bg-surface-3 border border-[var(--border-subtle)]",
  ghost: "text-text-secondary hover:text-text-primary hover:bg-surface-2",
  outline:
    "border border-[var(--border-strong)] text-text-primary hover:border-olive/50 hover:bg-surface-2",
  danger: "bg-red-900/40 text-red-200 hover:bg-red-900/60 border border-red-800/40",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-sm gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200",
        "disabled:opacity-40 disabled:pointer-events-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);
Button.displayName = "Button";
