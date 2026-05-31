import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "olive"
  | "amber"
  | "danger"
  | "muted"
  | "success";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-surface-3 text-text-secondary",
  olive: "bg-olive/20 text-sage border border-olive/30",
  amber: "bg-amber/15 text-amber border border-amber/25",
  danger: "bg-red-900/30 text-red-300 border border-red-800/30",
  muted: "bg-surface-2 text-text-muted",
  success: "bg-moss/30 text-sage border border-moss/40",
};

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
