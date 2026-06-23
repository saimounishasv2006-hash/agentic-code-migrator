"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMigrationStore } from "@/store/migrationStore";
import { Zap } from "lucide-react";

export default function MigratePage() {
  const router = useRouter();
  const { files, migrationGoal } = useMigrationStore();

  useEffect(() => {
    if (!files.length) router.push("/");
  }, [files, router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center mx-auto">
          <Zap size={20} className="text-accent" />
        </div>
        <p className="text-text font-medium">
          {files.length} files · {migrationGoal.slice(0, 60)}...
        </p>
        <p className="text-text-dim text-sm">
          Phase 2 coming next — Analyze Agent
        </p>
      </div>
    </main>
  );
}
