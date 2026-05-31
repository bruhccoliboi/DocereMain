"use client";

import { createClient } from "@/lib/supabase/client";
import type { DocereState } from "@/lib/types";
import { useDocereStore } from "@/lib/store";

export async function pullFromCloud(userId: string): Promise<Partial<DocereState> | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("workspace_snapshots")
    .select("payload, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data?.payload) return null;
  return data.payload as Partial<DocereState>;
}

export async function pushToCloud(
  userId: string,
  state: DocereState,
): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;

  const { error } = await supabase.from("workspace_snapshots").upsert(
    {
      user_id: userId,
      payload: state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  return !error;
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleCloudSync(userId: string, delayMs = 2000) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    const store = useDocereStore.getState();
    const payload = extractDocereState(store);
    const ok = await pushToCloud(userId, payload);
    if (ok) store.markSynced();
  }, delayMs);
}

function extractDocereState(
  store: ReturnType<typeof useDocereStore.getState>,
): DocereState {
  return {
    profile: store.profile,
    learners: store.learners,
    sessions: store.sessions,
    sessionNotes: store.sessionNotes,
    payments: store.payments,
    billingProfiles: store.billingProfiles,
    learningItems: store.learningItems,
    makeupObligations: store.makeupObligations,
    recurringRules: store.recurringRules,
    classLogs: store.classLogs,
  };
}

export async function syncNow(userId: string): Promise<"pushed" | "pulled" | "none"> {
  const remote = await pullFromCloud(userId);
  const local = useDocereStore.getState();

  if (!remote) {
    await pushToCloud(userId, extractDocereState(local));
    local.markSynced();
    return "pushed";
  }

  const remoteTime = (remote as { _updatedAt?: string })._updatedAt;
  const localTime = local.lastSyncedAt;

  if (!localTime || (remoteTime && remoteTime > localTime)) {
    useDocereStore.getState().hydrateFromCloud(remote);
    return "pulled";
  }

  await pushToCloud(userId, extractDocereState(local));
  local.markSynced();
  return "pushed";
}

export function subscribeStoreSync(userId: string) {
  return useDocereStore.subscribe(() => {
    scheduleCloudSync(userId);
  });
}
