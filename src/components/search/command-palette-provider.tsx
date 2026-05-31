"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { CommandPalette } from "./command-palette";

interface CommandPaletteContextValue {
  setOpen: (open: boolean) => void;
  openPalette: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null,
);

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const openPalette = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <CommandPaletteContext.Provider value={{ setOpen, openPalette }}>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used within provider");
  return { open: ctx.openPalette, setOpen: ctx.setOpen };
}
