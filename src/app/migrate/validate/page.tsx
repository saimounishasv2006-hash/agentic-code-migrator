"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader,
} from "lucide-react";
import { useMigrationStore } from "@/store/migrationStore";

type ValidationResult = {
  fileName: string;
  passed: boolean;
  score: number;
  issues: string[];
  summary: string;
};

type ValidationResponse = ValidationResult;

/**
 * Displays the validation step of the workflow.
 */
export default function ValidatePage() {
  const router = useRouter();
  const { files, migrationGoal, setPhase, addLog } = useMigrationStore();
  const [rewrittenFiles] = useState<Map<string, string>>(() => {
    if (typeof window === "undefined") {
      return new Map();
    }

    const storedFiles = window.sessionStorage.getItem("rewrittenFiles");
    if (!storedFiles) {
      return new Map();
    }

    try {
      const parsed = JSON.parse(storedFiles) as Record<string, string>;
      return new Map(Object.entries(parsed));
    } catch {
      return new Map();
    }
  });
  const [validationResults, setValidationResults] = useState<
    ValidationResult[]
  >([]);
  const [isValidating, setIsValidating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!migrationGoal) {
      router.push("/migrate/rewrite");
    }
  }, [migrationGoal, router]);

  /**
   * Validates each rewritten file against the original source file.
   */
  const startValidation = async () => {
    if (rewrittenFiles.size === 0) {
      setError(
        "No rewritten files found. Please complete the rewrite step first.",
      );
      return;
    }

    setIsValidating(true);
    setError(null);
    setPhase("validating");
    setValidationResults([]);

    try {
      const entries = Array.from(rewrittenFiles.entries());

      for (let index = 0; index < entries.length; index += 1) {
        setCurrentIndex(index);
        const [fileName, rewrittenCode] = entries[index];
        const originalFile = files.find((file) => file.name === fileName);

        if (!originalFile) {
          addLog(`Skipping ${fileName}; original file was not found.`);
          continue;
        }

        addLog(`Validating ${fileName}.`);

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

        const result = (await response.json()) as ValidationResponse;
        setValidationResults((previousResults) => [...previousResults, result]);

        if (result.passed) {
          addLog(
            `${fileName} passed validation with a score of ${result.score}%.`,
          );
        } else {
          const issueCount = result.issues.length;
          addLog(
            `${fileName} has issues with a score of ${result.score}%. ${issueCount} problem${issueCount === 1 ? "" : "s"}.`,
          );
        }
      }

      addLog("Validation complete.");
      setPhase("done");
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Unknown error";
      setError(message);
      addLog(`Error: ${message}`);
      setPhase("idle");
    } finally {
      setIsValidating(false);
    }
  };

  const passedCount = useMemo(
    () => validationResults.filter((result) => result.passed).length,
    [validationResults],
  );

  const averageScore = useMemo(() => {
    if (validationResults.length === 0) {
      return 0;
    }

    const totalScore = validationResults.reduce(
      (sum, result) => sum + result.score,
      0,
    );
    return Math.round(totalScore / validationResults.length);
  }, [validationResults]);

  const issueCount = useMemo(
    () =>
      validationResults.reduce((sum, result) => sum + result.issues.length, 0),
    [validationResults],
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-bg via-bg to-surface/30 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push("/migrate/rewrite")}
            className="mb-6 flex items-center gap-2 text-text-dim transition-colors hover:text-accent"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div>
            <h1 className="mb-2 text-3xl font-bold text-text">
              Validate Migration
            </h1>
            <p className="text-text-dim">
              Check for errors and incomplete migrations.
            </p>
          </div>
        </motion.div>

        {isValidating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <div className="rounded-xl border border-border bg-surface/60 p-6 backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold text-text">
                  Validating file {currentIndex + 1} of {rewrittenFiles.size}
                </p>
                <span className="font-mono text-sm text-accent">
                  {rewrittenFiles.size > 0
                    ? Math.round(
                        ((currentIndex + 1) / rewrittenFiles.size) * 100,
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-bg">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent to-accent-dim"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${rewrittenFiles.size > 0 ? ((currentIndex + 1) / rewrittenFiles.size) * 100 : 0}%`,
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
            className="mb-6 rounded-xl border border-danger/30 bg-danger/10 p-4"
          >
            <p className="text-sm font-medium text-danger">{error}</p>
          </motion.div>
        )}

        {validationResults.length === 0 && !isValidating ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-border bg-surface/60 p-8 text-center backdrop-blur"
          >
            <p className="mb-6 text-text-dim">
              Validate {rewrittenFiles.size} rewritten file
              {rewrittenFiles.size === 1 ? "" : "s"}?
            </p>
            <motion.button
              onClick={startValidation}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-8 py-4 font-semibold text-white transition-colors hover:bg-accent-dim"
            >
              Start Validation
              <Loader size={16} className="animate-spin" />
            </motion.button>
          </motion.div>
        ) : validationResults.length > 0 ? (
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-surface/60 p-5 backdrop-blur"
              >
                <p className="mb-2 text-xs uppercase tracking-wider font-mono text-text-dim">
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
                className="rounded-xl border border-border bg-surface/60 p-5 backdrop-blur"
              >
                <p className="mb-2 text-xs uppercase tracking-wider font-mono text-text-dim">
                  Avg Score
                </p>
                <p className="text-3xl font-bold text-accent">
                  {averageScore}%
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-border bg-surface/60 p-5 backdrop-blur"
              >
                <p className="mb-2 text-xs uppercase tracking-wider font-mono text-text-dim">
                  Issues Found
                </p>
                <p className="text-3xl font-bold text-warning">{issueCount}</p>
              </motion.div>
            </div>

            <div className="mb-8 space-y-4">
              {validationResults.map((result, index) => (
                <motion.div
                  key={result.fileName}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-xl border p-5 ${
                    result.passed
                      ? "border-success/30 bg-success/10"
                      : "border-warning/30 bg-warning/10"
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {result.passed ? (
                        <CheckCircle2 size={20} className="text-success" />
                      ) : (
                        <AlertCircle size={20} className="text-warning" />
                      )}
                      <div>
                        <p className="font-mono font-medium text-text">
                          {result.fileName}
                        </p>
                        <p className="mt-1 text-xs text-text-dim">
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
                    <div className="mt-3 border-t border-white/10 pt-3">
                      <p className="mb-2 text-xs uppercase tracking-wider font-mono text-text-dim">
                        Issues
                      </p>
                      <ul className="space-y-1">
                        {result.issues.map((issue, issueIndex) => (
                          <li
                            key={`${result.fileName}-${issueIndex}`}
                            className="flex items-start gap-2 text-sm text-text-dim"
                          >
                            <span className="mt-1 text-warning">-</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.button
                onClick={() => router.push("/migrate/export")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-dim"
              >
                Next: Export and Finalize
                <ChevronRight size={16} />
              </motion.button>
            </motion.div>
          </>
        ) : null}
      </div>
    </main>
  );
}
