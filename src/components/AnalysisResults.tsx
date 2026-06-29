"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, TrendingUp, Zap } from "lucide-react";
import { AnalysisResult } from "@/store/migrationStore";

const complexityColors = {
  low: "text-success",
  medium: "text-warning",
  high: "text-danger",
};

const complexityBg = {
  low: "bg-success/10 border-success/30",
  medium: "bg-warning/10 border-warning/30",
  high: "bg-danger/10 border-danger/30",
};

type AnalysisResultsProps = {
  result: AnalysisResult;
};

/**
 * Renders summary cards and file analysis results.
 */
export function AnalysisResults({ result }: AnalysisResultsProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          variants={item}
          className="bg-surface/60 border border-border rounded-xl p-5 backdrop-blur"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-text-dim text-xs uppercase font-mono tracking-wider mb-2">
                Files Analyzed
              </p>
              <p className="text-3xl font-bold text-text">
                {result.totalFiles}
              </p>
            </div>
            <Zap size={20} className="text-accent" />
          </div>
          <p className="text-text-dim text-xs">Ready for migration</p>
        </motion.div>

        <motion.div
          variants={item}
          className="bg-surface/60 border border-border rounded-xl p-5 backdrop-blur"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-text-dim text-xs uppercase font-mono tracking-wider mb-2">
                Complexity
              </p>
              <p
                className={`text-2xl font-bold uppercase tracking-wider ${
                  complexityColors[result.overallComplexity]
                }`}
              >
                {result.overallComplexity}
              </p>
            </div>
            <TrendingUp size={20} className="text-accent" />
          </div>
          <p className="text-text-dim text-xs">Overall project scope</p>
        </motion.div>

        <motion.div
          variants={item}
          className="bg-surface/60 border border-border rounded-xl p-5 backdrop-blur"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-text-dim text-xs uppercase font-mono tracking-wider mb-2">
                Effort
              </p>
              <p className="text-lg font-semibold text-accent">
                {result.estimatedEffort}
              </p>
            </div>
            <CheckCircle size={20} className="text-success" />
          </div>
          <p className="text-text-dim text-xs">Estimated time</p>
        </motion.div>
      </div>

      <motion.div
        variants={item}
        className="bg-surface/60 border border-border rounded-xl p-6 backdrop-blur"
      >
        <h3 className="text-text font-semibold mb-4 flex items-center gap-2">
          <AlertCircle size={18} className="text-accent" />
          Code Patterns Detected
        </h3>
        <div className="flex flex-wrap gap-2">
          {result.codePatterns.map((pattern, i) => (
            <motion.div
              key={pattern}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="px-3 py-1.5 bg-accent/10 border border-accent/30 rounded-full text-accent text-xs font-mono"
            >
              {pattern}
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item}>
        <h3 className="text-text font-semibold mb-4">File Analysis</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {result.filesAnalyzed.map((file, idx) => (
            <motion.div
              key={file.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + idx * 0.05 }}
              className={`border rounded-lg p-4 ${complexityBg[file.complexity]}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono text-sm text-text font-medium">
                    {file.name}
                  </p>
                  <p className="text-xs text-text-dim mt-1">
                    {file.lines} lines - {file.language}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold uppercase px-2 py-1 rounded ${complexityColors[file.complexity]}`}
                >
                  {file.complexity}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {file.keyPatterns.slice(0, 3).map((pat) => (
                  <span
                    key={pat}
                    className="text-xs px-2 py-0.5 rounded bg-white/5 text-text-dim"
                  >
                    {pat}
                  </span>
                ))}
                {file.keyPatterns.length > 3 && (
                  <span className="text-xs px-2 py-0.5 text-text-dim">
                    +{file.keyPatterns.length - 3} more
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
