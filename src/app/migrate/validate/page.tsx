"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useMigrationStore } from "@/store/migrationStore";
import {
  ArrowLeft,
  Loader,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

type ValidationResult = {
  fileName: string;
  passed: boolean;
  score: number;
  issues: string[];
  summary: string;
};

export default function ValidatePage() {
  const router = useRouter();
  const { files, migrationGoal, setPhase, addLog } = useMigrationStore();
  const [rewrittenFiles, setRewrittenFiles] = useState
    Map<string, string>
  >(new Map());
  const [validationResults, setValidationResults] = useState
    ValidationResult[]
  >([]);
  const [isValidating, setIsValidating] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Get rewritten files from sessionStorage or previous page
  useEffect(() => {
    const stored = sessionStorage.getItem("rewrittenFiles");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRewrittenFiles(new Map(Object.entries(parsed)));
      } catch (err) {
        console.error("Failed to parse stored files:", err);
      }
    }
  }, []);

  const startValidation = async () => {
    if (rewrittenFiles.size === 0) {
      setError("No rewritten files found. Please complete Phase 4 first.");
      return;
    }

    setIsValidating(true);
    setError(null);
    setPhase("validating");
    setValidationResults([]);

    try {
      const entries = Array.from(rewrittenFiles.entries());

      for (let i = 0; i < entries.length; i++) {
        setCurrentIdx(i);
        const [fileName, rewrittenCode] = entries[i];
        const originalFile = files.find((f) => f.name === fileName);

        if (!originalFile) {
          addLog(`⚠ Skipping ${fileName} (original not found)`);
          continue;
        }

        addLog(`Validating ${fileName}...`);

        const response = await fetch("/api/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName,
            rewrittenCode,
            originalCode: originalFile.content,
            migrationGoal,
          }),
        });

        if (!response.ok) {
          throw new Error(`Validation failed for ${fileName}`);
        }

        const result = await response.json();
        setValidationResults((prev) => [...prev, result]);

        if (result.passed) {
          addLog(`✓ ${fileName} passed validation (${result.score}%)`);
        } else {
          addLog(
            `⚠ ${fileName} has issues (${result.score}%) — ${result.issues.length} problem${result.issues.length > 1 ? "s" : ""}`
          );
        }
      }

      addLog("✓ Validation complete!");
      setPhase("idle");
      setIsValidating(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      addLog(`✗ Error: ${msg}`);
      setPhase("idle");
      setIsValidating(false);
    }
  };

  const passedCount = validationResults.filter((r) => r.passed).length;
  const avgScore = Math.round(
    validationResults.reduce((sum, r) => sum + r.score, 0) /
      Math.max(validationResults.length, 1)
  );

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
            onClick={() => router.push("/migrate/rewrite")}
            className="flex items-center gap-2 text-text-dim hover:text-accent transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div>
            <h1 className="text-3xl font-bold text-text mb-2">
              Validate Migration
            </h1>
            <p className="text-text-dim">
              Check for errors and incomplete migrations
            </p>
          </div>
        </motion.div>

        {/* Progress */}
        {isValidating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <div className="bg-surface/60 border border-border rounded-xl p-6 backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <p className="text-text font-semibold">
                  Validating file {currentIdx + 1} of {rewrittenFiles.size}
                </p>
                <span className="text-accent font-mono text-sm">
                  {Math.round((currentIdx / rewrittenFiles.size) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent to-accent-dim"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(currentIdx / rewrittenFiles.size) * 100}%`,
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-danger/10 border border-danger/30 rounded-xl p-4 mb-6"
          >
            <p className="text-danger text-sm font-medium">{error}</p>
          </motion.div>
        )}

        {validationResults.length === 0 && !isValidating ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface/60 border border-border rounded-xl p-8 backdrop-blur text-center"
          >
            <p className="text-text-dim mb-6">
              Validate {rewrittenFiles.size} rewritten files?
            </p>
            <motion.button
              onClick={startValidation}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent-dim text-white rounded-lg font-semibold transition-colors"
            >
              Start Validation
              <Loader size={16} className="animate-spin" />
            </motion.button>
          </motion.div>
        ) : validationResults.length > 0 ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface/60 border border-border rounded-xl p-5 backdrop-blur"
              >
                <p className="text-text-dim text-xs uppercase font-mono tracking-wider mb-2">
                  Passed
                </p>
                <p className="text-3xl font-bold text-success">
                  {passedCount}/{validationResults.length}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-surface/60 border border-border rounded-xl p-5 backdrop-blur"
              >
                <p className="text-text-dim text-xs uppercase font-mono tracking-wider mb-2">
                  Avg Score
                </p>
                <p className="text-3xl font-bold text-accent">{avgScore}%</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-surface/60 border border-border rounded-xl p-5 backdrop-blur"
              >
                <p className="text-text-dim text-xs uppercase font-mono tracking-wider mb-2">
                  Issues Found
                </p>
                <p className="text-3xl font-bold text-warning">
                  {validationResults.reduce((sum, r) => sum + r.issues.length, 0)}
                </p>
              </motion.div>
            </div>

            {/* Results */}
            <div className="space-y-4 mb-8">
              {validationResults.map((result, idx) => (
                <motion.div
                  key={result.fileName}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`border rounded-xl p-5 ${
                    result.passed
                      ? "bg-success/10 border-success/30"
                      : "bg-warning/10 border-warning/30"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {result.passed ? (
                        <CheckCircle2 size={20} className="text-success" />
                      ) : (
                        <AlertCircle size={20} className="text-warning" />
                      )}
                      <div>
                        <p className="font-mono text-text font-medium">
                          {result.fileName}
                        </p>
                        <p className="text-text-dim text-xs mt-1">
                          {result.summary}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-accent">
                        {result.score}%
                      </p>
                      <p className="text-xs text-text-dim">Score</p>
                    </div>
                  </div>

                  {result.issues.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-text-dim font-mono uppercase tracking-wider mb-2">
                        Issues
                      </p>
                      <ul className="space-y-1">
                        {result.issues.map((issue, i) => (
                          <li
                            key={i}
                            className="text-sm text-text-dim flex items-start gap-2"
                          >
                            <span className="text-warning mt-1">•</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Next Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.button
                onClick={() => router.push("/migrate/export")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-dim text-white rounded-lg font-semibold transition-colors"
              >
                Next: Export & GitHub Prep
                <ChevronRight size={16} />
              </motion.button>
            </motion.div>
          </>
        ) : null}
      </div>
    </main>
  );
}