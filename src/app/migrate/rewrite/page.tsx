"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useMigrationStore } from "@/store/migrationStore";
import { ArrowLeft, Loader, Download, Check, X } from "lucide-react";

type RewriteResult = {
  fileName: string;
  originalFileName: string;
  originalCode: string;
  rewrittenCode: string;
  success: boolean;
  error?: string;
};

export default function RewritePage() {
  const router = useRouter();
  const { files, migrationPlan, migrationGoal, setPhase, addLog } =
    useMigrationStore();
  const [currentFileIdx, setCurrentFileIdx] = useState(0);
  const [results, setResults] = useState<RewriteResult[]>([]);
  const [isRewriting, setIsRewriting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!migrationPlan) router.push("/migrate/plan");
  }, [migrationPlan, router]);

  const startRewrite = async () => {
    setIsRewriting(true);
    setError(null);
    setPhase("migrating");

    try {
      for (let i = 0; i < files.length; i++) {
        setCurrentFileIdx(i);
        const file = files[i];
        addLog(`Rewriting ${file.name}...`);

        // Get affected step info for context
        const affectedSteps = migrationPlan?.steps.filter((s) =>
          s.affectedFiles.includes(file.name),
        );
        const context = affectedSteps
          ?.map((s) => `${s.title}: ${s.description}`)
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

        const result = await response.json();
        setResults((prev) => [...prev, result]);

        // Store in sessionStorage for next phases
        const stored = JSON.parse(
          sessionStorage.getItem("rewrittenFiles") || "{}",
        );
        stored[result.fileName] = result.rewrittenCode;
        sessionStorage.setItem("rewrittenFiles", JSON.stringify(stored));

        addLog(
          `✓ Rewritten ${file.name}${
            result.fileName !== file.name ? ` → ${result.fileName}` : ""
          }`,
        );
      }

      addLog("✓ All files rewritten!");
      setPhase("done");
      setIsRewriting(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      addLog(`✗ Error: ${msg}`);
      setPhase("idle");
      setIsRewriting(false);
    }
  };

  const downloadFile = (result: RewriteResult) => {
    const element = document.createElement("a");
    const file = new Blob([result.rewrittenCode], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = result.fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadAllFiles = () => {
    results.forEach((result) => {
      const element = document.createElement("a");
      const file = new Blob([result.rewrittenCode], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = result.fileName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    });
  };

  if (!migrationPlan) {
    return null;
  }

  const progress = Math.round((results.length / files.length) * 100);

  return (
    <main className="min-h-screen bg-gradient-to-b from-bg via-bg to-surface/30 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push("/migrate/plan")}
            className="flex items-center gap-2 text-text-dim hover:text-accent transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div>
            <h1 className="text-3xl font-bold text-text mb-2">Rewrite Code</h1>
            <p className="text-text-dim">
              Migrating{" "}
              <span className="text-accent">{files.length} files</span>
            </p>
          </div>
        </motion.div>

        {/* Progress */}
        {isRewriting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <div className="bg-surface/60 border border-border rounded-xl p-6 backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <p className="text-text font-semibold">
                  Rewriting file {currentFileIdx + 1} of {files.length}
                </p>
                <span className="text-accent font-mono text-sm">
                  {progress}%
                </span>
              </div>
              <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent to-accent-dim"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-text-dim text-xs mt-3">
                {files[currentFileIdx]?.name}
              </p>
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

        {results.length === 0 && !isRewriting ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface/60 border border-border rounded-xl p-8 backdrop-blur text-center"
          >
            <p className="text-text-dim mb-6">
              Ready to rewrite {files.length} files?
            </p>
            <motion.button
              onClick={startRewrite}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent-dim text-white rounded-lg font-semibold transition-colors"
            >
              Start Rewriting
              <Loader size={16} />
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {results.map((result, idx) => (
              <motion.div
                key={result.fileName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`border rounded-xl p-5 ${
                  result.success
                    ? "bg-success/10 border-success/30"
                    : "bg-danger/10 border-danger/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {result.success ? (
                      <Check size={20} className="text-success flex-shrink-0" />
                    ) : (
                      <X size={20} className="text-danger flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-text font-medium">
                          {result.originalFileName}
                        </span>
                        {result.fileName !== result.originalFileName && (
                          <>
                            <span className="text-text-dim">→</span>
                            <span className="font-mono text-accent font-medium">
                              {result.fileName}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-text-dim text-xs mt-1">
                        {result.rewrittenCode.length} bytes
                      </p>
                    </div>
                  </div>
                  {result.success && (
                    <motion.button
                      onClick={() => downloadFile(result)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 hover:bg-success/20 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Download size={16} className="text-success" />
                    </motion.button>
                  )}
                </div>
                {result.error && (
                  <p className="text-danger text-sm mt-2">{result.error}</p>
                )}
              </motion.div>
            ))}

            {results.length === files.length && !isRewriting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex gap-4 mt-8"
              >
                <button
                  onClick={() => {
                    setResults([]);
                    setCurrentFileIdx(0);
                  }}
                  className="flex-1 px-6 py-3 border border-border text-text rounded-lg hover:border-accent hover:text-accent transition-colors font-medium"
                >
                  Start Over
                </button>
                <motion.button
                  onClick={downloadAllFiles}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-dim text-white rounded-lg font-semibold transition-colors"
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
