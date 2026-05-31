"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDocereStore } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();
  const profile = useDocereStore((s) => s.profile);

  useEffect(() => {
    if (profile?.onboardingCompleted) {
      router.replace("/dashboard");
    } else {
      router.replace("/welcome");
    }
  }, [profile, router]);

  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center">
      <div className="w-8 h-8 rounded-lg border-2 border-olive/30 border-t-olive animate-spin" />
    </div>
  );
}
