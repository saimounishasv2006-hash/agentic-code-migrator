"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Loader } from "lucide-react";
import { PlanStepper } from "@/components/PlanStepper";
import { MigrationPlan, useMigrationStore } from "@/store/migrationStore";

type PlanResponse = MigrationPlan;

/**
 * Displays the migration plan step of the workflow.
 */
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
    if (!analysisResult) {
      router.push("/migrate");
    }
  }, [analysisResult, router]);

  /**
   * Sends the analysis result to the plan API and stores the response.
   */
  const runPlan = async () => {
    if (!analysisResult) {
      return;
    }

    setIsPlanning(true);
    setError(null);
    setPhase("planning");
    addLog("Generating migration plan.");

    try {
      addLog("Analyzing file dependencies.");

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

      const data = (await response.json()) as PlanResponse;
      addLog(`Created ${data.totalSteps} migration steps.`);
      addLog("Plan ready for execution.");

      setMigrationPlan(data);
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Unknown error";
      setError(message);
      addLog(`Error: ${message}`);
    } finally {
      setPhase("idle");
      setIsPlanning(false);
    }
  };

  const handleNext = () => {
    router.push("/migrate/rewrite");
  };

  if (!analysisResult) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-bg via-bg to-surface/30 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push("/migrate")}
            className="mb-6 flex items-center gap-2 text-text-dim transition-colors hover:text-accent"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div>
            <h1 className="mb-2 text-3xl font-bold text-text">
              Migration Plan
            </h1>
            <p className="text-text-dim">
              Ordered steps for:{" "}
              <span className="text-accent">{migrationGoal.slice(0, 50)}</span>
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4 lg:col-span-1"
          >
            <div className="h-fit rounded-xl border border-border bg-surface/60 p-4 backdrop-blur sticky top-8">
              <p className="mb-3 text-xs uppercase tracking-wider font-mono text-text-dim">
                Analysis Summary
              </p>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-text-dim">Files</p>
                  <p className="font-semibold text-text">
                    {analysisResult.totalFiles}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-dim">Complexity</p>
                  <p className="font-semibold uppercase text-accent">
                    {analysisResult.overallComplexity}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-dim">Effort</p>
                  <p className="text-text-dim">
                    {analysisResult.estimatedEffort}
                  </p>
                </div>
              </div>
            </div>
          </motion.aside>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 rounded-xl border border-danger/30 bg-danger/10 p-4"
              >
                <p className="text-sm font-medium text-danger">{error}</p>
              </motion.div>
            )}

            {!migrationPlan ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-border bg-surface/60 p-8 text-center backdrop-blur"
              >
                <p className="mb-6 text-text-dim">
                  Ready to generate a migration plan?
                </p>
                <motion.button
                  onClick={runPlan}
                  disabled={isPlanning}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPlanning ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Generating plan...
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
                  className="mt-8 flex gap-4"
                >
                  <button
                    onClick={() => {
                      setMigrationPlan(null);
                      void runPlan();
                    }}
                    className="flex-1 rounded-lg border border-border px-6 py-3 font-medium text-text transition-colors hover:border-accent hover:text-accent"
                  >
                    Regenerate plan
                  </button>
                  <motion.button
                    onClick={handleNext}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-dim"
                  >
                    Next: Rewrite code
                    <ChevronRight size={16} />
                  </motion.button>
                </motion.div>
              </>
            )}
          </motion.section>
        </div>
      </div>
    </main>
  );
}
