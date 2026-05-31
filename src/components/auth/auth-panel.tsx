"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { syncNow } from "@/lib/sync/cloud-sync";
import { toast } from "sonner";
import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { useDocereStore } from "@/lib/store";

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const lastSyncedAt = useDocereStore((s) => s.lastSyncedAt);

  const configured = isSupabaseConfigured();

  const checkUser = async () => {
    const supabase = createClient();
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    setUser(data.user ? { id: data.user.id, email: data.user.email } : null);
  };

  useEffect(() => {
    checkUser();
  }, []);

  if (!configured) {
    return (
      <Card title="Cloud sync" animate={false}>
        <div className="flex items-start gap-3">
          <CloudOff className="w-5 h-5 text-text-muted shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-text-secondary">
              Add Supabase credentials to enable cloud backup and multi-device sync.
            </p>
            <p className="text-xs text-text-muted mt-2">
              Data remains in your browser until then.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const signIn = async () => {
    const supabase = createClient();
    if (!supabase) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await checkUser();
    toast.success("Signed in");
  };

  const signUp = async () => {
    const supabase = createClient();
    if (!supabase) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Check your email to confirm");
  };

  const signOut = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    toast.success("Signed out");
  };

  const sync = async () => {
    if (!user) return;
    setLoading(true);
    const result = await syncNow(user.id);
    setLoading(false);
    toast.success(`Sync complete: ${result}`);
  };

  if (user) {
    return (
      <Card title="Cloud sync" animate={false}>
        <div className="flex items-center gap-2 mb-4">
          <Cloud className="w-5 h-5 text-olive" />
          <div>
            <p className="text-sm text-text-primary">{user.email}</p>
            <p className="text-xs text-text-muted font-mono-data">
              {lastSyncedAt
                ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}`
                : "Not synced yet"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={sync} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sync now"}
          </Button>
          <Button size="sm" variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Cloud account" subtitle="Backup and sync across devices" animate={false}>
      <div className="space-y-3">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex gap-2">
          <Button onClick={signIn} disabled={loading}>
            Sign in
          </Button>
          <Button variant="outline" onClick={signUp} disabled={loading}>
            Sign up
          </Button>
        </div>
      </div>
    </Card>
  );
}
