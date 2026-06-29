"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Loader } from "lucide-react";
import { AnalysisResults } from "@/components/AnalysisResults";
import { AnalysisResult, useMigrationStore } from "@/store/migrationStore";

type AnalyzeResponse = AnalysisResult;

/**
 * Displays the analysis step of the migration workflow.
 */
export default function MigratePage() {
  const router = useRouter();
  const {
    files,
    migrationGoal,
    analysisResult,
    setPhase,
    setAnalysisResult,
    addLog,
    agentLog,
  } = useMigrationStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (files.length === 0) {
      router.push("/");
    }
  }, [files.length, router]);

  /**
   * Sends files to the analysis API and stores the result.
   */
  const runAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setPhase("analyzing");
    addLog("Starting code analysis.");

    try {
      addLog(`Analyzing ${files.length} files.`);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files, migrationGoal }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = (await response.json()) as AnalyzeResponse;
      addLog(`Found ${data.totalFiles} files.`);
      addLog(`Detected ${data.codePatterns.length} patterns.`);
      addLog(`Complexity: ${data.overallComplexity}.`);

      setAnalysisResult(data);
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Unknown error";
      setError(message);
      addLog(`Error: ${message}`);
    } finally {
      setPhase("idle");
      setIsAnalyzing(false);
    }
  };

  const handleNext = () => {
    router.push("/migrate/plan");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-bg via-bg to-surface/30 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push("/")}
            className="mb-6 flex items-center gap-2 text-text-dim transition-colors hover:text-accent"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div>
            <h1 className="mb-2 text-3xl font-bold text-text">Code Analysis</h1>
            <p className="text-text-dim">
              Migration goal:{" "}
              <span className="text-accent">{migrationGoal.slice(0, 50)}</span>
              {migrationGoal.length > 50 ? "..." : ""}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="h-fit rounded-xl border border-border bg-surface/60 p-4 backdrop-blur lg:col-span-1 sticky top-8"
          >
            <p className="mb-3 text-xs uppercase tracking-wider font-mono text-text-dim">
              Agent Log
            </p>
            <div className="max-h-64 space-y-1.5 overflow-y-auto font-mono text-xs">
              {agentLog.length === 0 ? (
                <p className="text-text-dim/50">Waiting to analyze...</p>
              ) : (
                agentLog.map((logEntry, index) => (
                  <motion.p
                    key={`${index}-${logEntry}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-text-dim"
                  >
                    <span className="text-accent">&gt;</span> {logEntry}
                  </motion.p>
                ))
              )}
              {isAnalyzing && (
                <motion.p
                  animate={{ opacity: [0.5, 1] }}
                  className="text-accent"
                >
                  <Loader size={12} className="mr-1 inline animate-spin" />
                  Processing...
                </motion.p>
              )}
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

            {!analysisResult ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-border bg-surface/60 p-8 text-center backdrop-blur"
              >
                <p className="mb-6 text-text-dim">
                  Ready to analyze {files.length} file
                  {files.length === 1 ? "" : "s"}?
                </p>
                <motion.button
                  onClick={runAnalyze}
                  disabled={isAnalyzing}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Start Analysis
                      <ChevronRight size={16} />
                    </>
                  )}
                </motion.button>
              </motion.div>
            ) : (
              <>
                <AnalysisResults result={analysisResult} />

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-8 flex gap-4"
                >
                  <button
                    onClick={() => {
                      setAnalysisResult(null);
                      void runAnalyze();
                    }}
                    className="flex-1 rounded-lg border border-border px-6 py-3 font-medium text-text transition-colors hover:border-accent hover:text-accent"
                  >
                    Re-analyze
                  </button>
                  <motion.button
                    onClick={handleNext}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-dim"
                  >
                    Next: Plan Migration
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
