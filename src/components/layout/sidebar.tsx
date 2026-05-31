"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  BarChart3,
  Sparkles,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Today", icon: LayoutDashboard },
  { href: "/learners", label: "Students", icon: GraduationCap },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-[var(--border-subtle)] bg-bg-charcoal/80 backdrop-blur-sm h-full">
      <div className="p-5 border-b border-[var(--border-subtle)]">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-olive/20 border border-olive/40 flex items-center justify-center">
            <span className="font-heading text-sm font-bold text-olive">D</span>
          </div>
          <div>
            <span className="font-heading text-sm font-semibold text-text-primary tracking-tight block">
              Docere
            </span>
            <span className="text-[10px] text-text-muted uppercase tracking-widest">
              Teacher&apos;s Journal
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                active
                  ? "bg-olive/15 text-cream border border-olive/25"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-2",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span className="font-heading font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[var(--border-subtle)] space-y-0.5">
        <Link
          href="/studio"
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
            pathname.startsWith("/studio")
              ? "bg-amber/10 text-amber border border-amber/20"
              : "text-text-secondary hover:text-amber hover:bg-surface-2",
          )}
        >
          <Sparkles className="w-4 h-4" strokeWidth={1.75} />
          <span className="font-heading font-medium">Studio Mode</span>
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-all"
        >
          <Settings className="w-4 h-4" strokeWidth={1.75} />
          <span className="font-heading font-medium">Settings</span>
        </Link>
      </div>
    </aside>
  );
}
