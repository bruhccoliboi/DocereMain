"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { CommandPaletteProvider } from "@/components/search/command-palette-provider";
import { CloudSyncListener } from "@/components/sync/cloud-sync-listener";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center">
        <div className="w-8 h-8 rounded-lg border-2 border-olive/30 border-t-olive animate-spin" />
      </div>
    );
  }

  return (
    <CommandPaletteProvider>
      <CloudSyncListener />
      {children}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--surface-1)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
          },
        }}
      />
    </CommandPaletteProvider>
  );
}
