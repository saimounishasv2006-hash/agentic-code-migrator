"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useMigrationStore } from "@/store/migrationStore";
import { AnalysisResults } from "@/components/AnalysisResults";
import { ChevronRight, ArrowLeft, Loader } from "lucide-react";

export default function MigratePage() {
  const router = useRouter();
  const {
    files,
    migrationGoal,
    phase,
    analysisResult,
    setPhase,
    setAnalysisResult,
    addLog,
  } = useMigrationStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!files.length) router.push("/");
  }, [files, router]);

  const runAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setPhase("analyzing");
    addLog("Starting code analysis...");

    try {
      addLog(`Analyzing ${files.length} files`);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files, migrationGoal }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      addLog(`✓ Found ${data.totalFiles} files`);
      addLog(`✓ Detected ${data.codePatterns.length} patterns`);
      addLog(`✓ Complexity: ${data.overallComplexity}`);

      setAnalysisResult(data);
      setPhase("idle");
      setIsAnalyzing(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      addLog(`✗ Error: ${msg}`);
      setPhase("idle");
      setIsAnalyzing(false);
    }
  };

  const handleNext = () => {
    // Phase 3 coming next
    router.push("/migrate/plan");
  };

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
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-text-dim hover:text-accent transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div>
            <h1 className="text-3xl font-bold text-text mb-2">Code Analysis</h1>
            <p className="text-text-dim">
              Migration goal:{" "}
              <span className="text-accent">{migrationGoal.slice(0, 50)}</span>
              {migrationGoal.length > 50 ? "..." : ""}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Agent Log Terminal */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 bg-surface/60 border border-border rounded-xl p-4 backdrop-blur h-fit sticky top-8"
          >
            <p className="text-text-dim text-xs uppercase font-mono tracking-wider mb-3">
              Agent Log
            </p>
            <div className="space-y-1.5 text-xs font-mono max-h-64 overflow-y-auto">
              {useMigrationStore.getState().agentLog.length === 0 ? (
                <p className="text-text-dim/50">Waiting to analyze...</p>
              ) : (
                useMigrationStore.getState().agentLog.map((log, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-text-dim"
                  >
                    <span className="text-accent">&gt;</span> {log}
                  </motion.p>
                ))
              )}
              {isAnalyzing && (
                <motion.p
                  animate={{ opacity: [0.5, 1] }}
                  className="text-accent"
                >
                  <Loader size={12} className="inline mr-1 animate-spin" />
                  Processing...
                </motion.p>
              )}
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

            {!analysisResult ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-surface/60 border border-border rounded-xl p-8 backdrop-blur text-center"
              >
                <p className="text-text-dim mb-6">
                  Ready to analyze {files.length} file
                  {files.length > 1 ? "s" : ""}?
                </p>
                <motion.button
                  onClick={runAnalyze}
                  disabled={isAnalyzing}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-dim text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="flex gap-4 mt-8"
                >
                  <button
                    onClick={() => {
                      setAnalysisResult(null);
                      runAnalyze();
                    }}
                    className="flex-1 px-6 py-3 border border-border text-text rounded-lg hover:border-accent hover:text-accent transition-colors font-medium"
                  >
                    Re-analyze
                  </button>
                  <motion.button
                    onClick={handleNext}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-dim text-white rounded-lg font-semibold transition-colors"
                  >
                    Next: Plan Migration
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
