"use client";

import { useEffect } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { subscribeStoreSync, syncNow } from "@/lib/sync/cloud-sync";

export function CloudSyncListener() {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    if (!supabase) return;

    let unsubscribe: (() => void) | undefined;

    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      syncNow(user.id).catch(() => {});
      unsubscribe = subscribeStoreSync(user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (unsubscribe) unsubscribe();
      if (session?.user) {
        syncNow(session.user.id).catch(() => {});
        unsubscribe = subscribeStoreSync(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
      unsubscribe?.();
    };
  }, []);

  return null;
}
