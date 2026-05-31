"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useDocereStore } from "@/lib/store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const profile = useDocereStore((s) => s.profile);

  useEffect(() => {
    if (!profile?.onboardingCompleted && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [profile, pathname, router]);

  if (!profile?.onboardingCompleted && pathname !== "/onboarding") {
    return null;
  }

  if (pathname === "/onboarding") {
    return <>{children}</>;
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-bg-deep">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
