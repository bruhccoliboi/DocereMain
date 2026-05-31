"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  GraduationCap,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Today" },
  { href: "/learners", icon: GraduationCap, label: "Students" },
  { href: "/schedule", icon: Calendar, label: "Schedule" },
  { href: "/studio", icon: Sparkles, label: "Studio" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-around h-14 border-t border-[var(--border-subtle)] bg-bg-charcoal/95 backdrop-blur-md">
      {items.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px]",
              active ? "text-olive" : "text-text-muted",
            )}
          >
            <Icon className="w-5 h-5" strokeWidth={1.75} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
