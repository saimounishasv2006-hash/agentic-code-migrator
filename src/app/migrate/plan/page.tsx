"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useMigrationStore } from "@/store/migrationStore";
import { PlanStepper } from "@/components/PlanStepper";
import { ChevronRight, ArrowLeft, Loader } from "lucide-react";

export default function PlanPage() {
  const router = useRouter();
  const {
    analysisResult,
    migrationGoal,
    migrationPlan,
    setMigrationPlan,
    setPhase,
    addLog,
  } = useMigrationStore();
  const [isPlanning, setIsPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisResult) router.push("/migrate");
  }, [analysisResult, router]);

  const runPlan = async () => {
    setIsPlanning(true);
    setError(null);
    setPhase("planning");
    addLog("Generating migration plan...");

    try {
      addLog("Analyzing file dependencies...");

      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis: analysisResult,
          migrationGoal,
        }),
      });

      if (!response.ok) {
        throw new Error(`Plan failed: ${response.statusText}`);
      }

      const data = await response.json();
      addLog(`✓ Created ${data.totalSteps} migration steps`);
      addLog("✓ Plan ready for execution");

      setMigrationPlan(data);
      setPhase("idle");
      setIsPlanning(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      addLog(`✗ Error: ${msg}`);
      setPhase("idle");
      setIsPlanning(false);
    }
  };

  const handleNext = () => {
    // Phase 4 (Rewrite) coming next
    router.push("/migrate/rewrite");
  };

  if (!analysisResult) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-bg via-bg to-surface/30 px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push("/migrate")}
            className="flex items-center gap-2 text-text-dim hover:text-accent transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div>
            <h1 className="text-3xl font-bold text-text mb-2">
              Migration Plan
            </h1>
            <p className="text-text-dim">
              Ordered steps for:{" "}
              <span className="text-accent">{migrationGoal.slice(0, 50)}</span>
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Info Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 space-y-4"
          >
            <div className="bg-surface/60 border border-border rounded-xl p-4 backdrop-blur h-fit sticky top-8">
              <p className="text-text-dim text-xs uppercase font-mono tracking-wider mb-3">
                Analysis Summary
              </p>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-text-dim text-xs">Files</p>
                  <p className="text-text font-semibold">
                    {analysisResult.totalFiles}
                  </p>
                </div>
                <div>
                  <p className="text-text-dim text-xs">Complexity</p>
                  <p className="text-accent font-semibold uppercase">
                    {analysisResult.overallComplexity}
                  </p>
                </div>
                <div>
                  <p className="text-text-dim text-xs">Effort</p>
                  <p className="text-text-dim">
                    {analysisResult.estimatedEffort}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-danger/10 border border-danger/30 rounded-xl p-4 mb-6"
              >
                <p className="text-danger text-sm font-medium">{error}</p>
              </motion.div>
            )}

            {!migrationPlan ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-surface/60 border border-border rounded-xl p-8 backdrop-blur text-center"
              >
                <p className="text-text-dim mb-6">
                  Ready to generate a migration plan?
                </p>
                <motion.button
                  onClick={runPlan}
                  disabled={isPlanning}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-dim text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlanning ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Generating Plan...
                    </>
                  ) : (
                    <>
                      Generate Plan
                      <ChevronRight size={16} />
                    </>
                  )}
                </motion.button>
              </motion.div>
            ) : (
              <>
                <PlanStepper plan={migrationPlan} />

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="flex gap-4 mt-8"
                >
                  <button
                    onClick={() => {
                      setMigrationPlan(null);
                      runPlan();
                    }}
                    className="flex-1 px-6 py-3 border border-border text-text rounded-lg hover:border-accent hover:text-accent transition-colors font-medium"
                  >
                    Regenerate Plan
                  </button>
                  <motion.button
                    onClick={handleNext}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-dim text-white rounded-lg font-semibold transition-colors"
                  >
                    Next: Rewrite Code
                    <ChevronRight size={16} />
                  </motion.button>
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
