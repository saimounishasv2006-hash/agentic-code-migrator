"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Download, Loader, X } from "lucide-react";
import { useMigrationStore } from "@/store/migrationStore";

type RewriteResult = {
  fileName: string;
  originalFileName: string;
  originalCode: string;
  rewrittenCode: string;
  success: boolean;
  error?: string;
};

type RewriteResponse = RewriteResult;

/**
 * Displays the rewrite step of the workflow.
 */
export default function RewritePage() {
  const router = useRouter();
  const { files, migrationPlan, migrationGoal, setPhase, addLog } =
    useMigrationStore();
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [results, setResults] = useState<RewriteResult[]>([]);
  const [isRewriting, setIsRewriting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!migrationPlan) {
      router.push("/migrate/plan");
    }
  }, [migrationPlan, router]);

  /**
   * Rewrites each file in sequence and persists the generated output.
   */
  const startRewrite = async () => {
    if (!migrationPlan) {
      return;
    }

    setIsRewriting(true);
    setError(null);
    setPhase("migrating");
    setResults([]);

    try {
      for (let index = 0; index < files.length; index += 1) {
        setCurrentFileIndex(index);
        const file = files[index];
        addLog(`Rewriting ${file.name}.`);

        const affectedSteps = migrationPlan.steps.filter((step) =>
          step.affectedFiles.includes(file.name),
        );
        const context = affectedSteps
          .map((step) => `${step.title}: ${step.description}`)
          .join(" | ");

        const response = await fetch("/api/migrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileContent: file.content,
            migrationGoal,
            context,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to rewrite ${file.name}`);
        }

        const result = (await response.json()) as RewriteResponse;
        setResults((previousResults) => [...previousResults, result]);

        const storedFiles = JSON.parse(
          sessionStorage.getItem("rewrittenFiles") ?? "{}",
        );
        storedFiles[result.fileName] = result.rewrittenCode;
        sessionStorage.setItem("rewrittenFiles", JSON.stringify(storedFiles));

        const renameNote =
          result.fileName !== file.name ? ` to ${result.fileName}` : "";
        addLog(`Rewritten ${file.name}${renameNote}.`);
      }

      addLog("All files rewritten.");
      setPhase("done");
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Unknown error";
      setError(message);
      addLog(`Error: ${message}`);
      setPhase("idle");
    } finally {
      setIsRewriting(false);
    }
  };

  const downloadFile = (result: RewriteResult) => {
    const link = document.createElement("a");
    const fileBlob = new Blob([result.rewrittenCode], { type: "text/plain" });
    const url = URL.createObjectURL(fileBlob);

    link.href = url;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAllFiles = () => {
    results.forEach((result) => {
      downloadFile(result);
    });
  };

  if (!migrationPlan) {
    return null;
  }

  const progress =
    files.length > 0 ? Math.round((results.length / files.length) * 100) : 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-bg via-bg to-surface/30 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push("/migrate/plan")}
            className="mb-6 flex items-center gap-2 text-text-dim transition-colors hover:text-accent"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div>
            <h1 className="mb-2 text-3xl font-bold text-text">Rewrite Code</h1>
            <p className="text-text-dim">
              Migrating{" "}
              <span className="text-accent">{files.length} files</span>
            </p>
          </div>
        </motion.div>

        {isRewriting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <div className="rounded-xl border border-border bg-surface/60 p-6 backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold text-text">
                  Rewriting file {currentFileIndex + 1} of {files.length}
                </p>
                <span className="font-mono text-sm text-accent">
                  {progress}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-bg">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent to-accent-dim"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="mt-3 text-xs text-text-dim">
                {files[currentFileIndex]?.name}
              </p>
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

        {results.length === 0 && !isRewriting ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-border bg-surface/60 p-8 text-center backdrop-blur"
          >
            <p className="mb-6 text-text-dim">
              Ready to rewrite {files.length} files?
            </p>
            <motion.button
              onClick={startRewrite}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-8 py-4 font-semibold text-white transition-colors hover:bg-accent-dim"
            >
              Start Rewriting
              <Loader size={16} />
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {results.map((result, index) => (
              <motion.div
                key={result.fileName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`rounded-xl border p-5 ${
                  result.success
                    ? "border-success/30 bg-success/10"
                    : "border-danger/30 bg-danger/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-1 items-center gap-3">
                    {result.success ? (
                      <Check size={20} className="flex-shrink-0 text-success" />
                    ) : (
                      <X size={20} className="flex-shrink-0 text-danger" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-text">
                          {result.originalFileName}
                        </span>
                        {result.fileName !== result.originalFileName && (
                          <>
                            <span className="text-text-dim">to</span>
                            <span className="font-mono font-medium text-accent">
                              {result.fileName}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-text-dim">
                        {result.rewrittenCode.length} bytes
                      </p>
                    </div>
                  </div>
                  {result.success && (
                    <motion.button
                      onClick={() => downloadFile(result)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="flex-shrink-0 rounded-lg p-2 transition-colors hover:bg-success/20"
                    >
                      <Download size={16} className="text-success" />
                    </motion.button>
                  )}
                </div>
                {result.error && (
                  <p className="mt-2 text-sm text-danger">{result.error}</p>
                )}
              </motion.div>
            ))}

            {results.length === files.length && !isRewriting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 flex gap-4"
              >
                <button
                  onClick={() => {
                    setResults([]);
                    setCurrentFileIndex(0);
                  }}
                  className="flex-1 rounded-lg border border-border px-6 py-3 font-medium text-text transition-colors hover:border-accent hover:text-accent"
                >
                  Start Over
                </button>
                <motion.button
                  onClick={downloadAllFiles}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-dim"
                >
                  <Download size={16} />
                  Download All
                </motion.button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
