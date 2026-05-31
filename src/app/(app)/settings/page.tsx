"use client";

import { useRef, useState } from "react";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthPanel } from "@/components/auth/auth-panel";
import { useDocereStore } from "@/lib/store";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export default function SettingsPage() {
  const profile = useDocereStore((s) => s.profile);
  const resetWorkspace = useDocereStore((s) => s.resetWorkspace);
  const completeOnboarding = useDocereStore((s) => s.completeOnboarding);
  const importWorkspace = useDocereStore((s) => s.importWorkspace);
  const lastSyncedAt = useDocereStore((s) => s.lastSyncedAt);
  const importRef = useRef<HTMLInputElement>(null);

  const [itemsLabel, setItemsLabel] = useState(
    profile?.learningStructureLabels.items ?? "Learning items",
  );
  const [categoriesLabel, setCategoriesLabel] = useState(
    profile?.learningStructureLabels.categories ?? "Categories",
  );
  const [confirmReset, setConfirmReset] = useState(false);

  const saveLabels = () => {
    if (!profile) return;
    completeOnboarding({
      educatorType: profile.educatorType,
      teachingFormat: profile.teachingFormat,
      currency: profile.currency,
      learningStructureLabels: {
        items: itemsLabel,
        categories: categoriesLabel,
      },
    });
    toast.success("Labels saved");
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    resetWorkspace();
    window.location.href = "/welcome";
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const ok = importWorkspace(reader.result);
        if (ok) toast.success("Workspace imported");
        else toast.error("Invalid backup file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <Header title="Settings" />

      <div className="p-6 max-w-lg space-y-6">
        <AuthPanel />

        <Card title="Profile" animate={false}>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-muted">Educator type</dt>
              <dd className="text-text-primary font-medium">
                {profile?.educatorType}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Format</dt>
              <dd className="text-text-primary capitalize">
                {profile?.teachingFormat?.replace("-", " ")}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Currency</dt>
              <dd className="font-mono-data text-text-primary">
                {profile?.currency}
              </dd>
            </div>
            {lastSyncedAt && (
              <div className="flex justify-between">
                <dt className="text-text-muted">Last cloud sync</dt>
                <dd className="font-mono-data text-xs">
                  {new Date(lastSyncedAt).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        <Card title="Learning structure" animate={false}>
          <div className="space-y-4">
            <Input
              label="Items label"
              value={itemsLabel}
              onChange={(e) => setItemsLabel(e.target.value)}
              hint="e.g. Songs, Topics, Vocabulary"
            />
            <Input
              label="Categories label"
              value={categoriesLabel}
              onChange={(e) => setCategoriesLabel(e.target.value)}
              hint="e.g. Techniques, Concepts, Grammar"
            />
            <Button variant="secondary" onClick={saveLabels}>
              Save labels
            </Button>
          </div>
        </Card>

        <Card title="Backup & restore" animate={false}>
          <p className="text-sm text-text-muted mb-4">
            Import a JSON backup exported from Reports or another device.
          </p>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImport}
          />
          <Button variant="outline" onClick={() => importRef.current?.click()}>
            <Upload className="w-4 h-4" />
            Import backup
          </Button>
        </Card>

        <Card title="Danger zone" animate={false}>
          <Button
            variant={confirmReset ? "danger" : "outline"}
            onClick={handleReset}
          >
            {confirmReset ? "Confirm: erase all data" : "Reset workspace"}
          </Button>
          {confirmReset && (
            <p className="text-xs text-red-300 mt-2">
              This permanently deletes all learners, sessions, and payments.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
