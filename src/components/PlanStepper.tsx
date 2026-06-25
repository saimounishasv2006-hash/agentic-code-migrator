"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight, Clock, FileCode2 } from "lucide-react";
import { MigrationPlan, MigrationStep } from "@/store/migrationStore";
import { useState } from "react";

export function PlanStepper({ plan }: { plan: MigrationPlan }) {
  const [expandedStep, setExpandedStep] = useState<number | null>(0);

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
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Strategy Overview */}
      <motion.div
        variants={item}
        className="bg-surface/60 border border-border rounded-xl p-6 backdrop-blur"
      >
        <h3 className="text-text font-semibold mb-3 flex items-center gap-2">
          <ChevronRight size={18} className="text-accent" />
          Migration Strategy
        </h3>
        <p className="text-text-dim text-sm leading-relaxed">
          {plan.overallStrategy}
        </p>
      </motion.div>

      {/* Steps */}
      <div className="space-y-3">
        <p className="text-text-dim text-xs uppercase font-mono tracking-wider">
          {plan.totalSteps} Steps
        </p>

        {plan.steps.map((step, idx) => (
          <motion.div
            key={step.stepNumber}
            variants={item}
            onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}
            className="cursor-pointer"
          >
            <motion.div
              className={`border rounded-xl p-5 transition-all ${
                expandedStep === idx
                  ? "bg-accent/10 border-accent"
                  : "bg-surface/60 border-border hover:border-accent/50"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    <motion.div
                      animate={{
                        scale: expandedStep === idx ? 1.2 : 1,
                      }}
                      className="w-8 h-8 rounded-full bg-accent/20 border border-accent flex items-center justify-center text-accent font-semibold text-sm"
                    >
                      {step.stepNumber}
                    </motion.div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-text font-semibold mb-1">
                      {step.title}
                    </h4>
                    <p className="text-text-dim text-sm line-clamp-2">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Time Badge */}
                <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg/60 border border-border/30">
                  <Clock size={12} className="text-text-dim" />
                  <span className="text-xs text-text-dim font-mono">
                    {step.estimatedTime}
                  </span>
                </div>
              </div>

              {/* Expanded Content */}
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{
                  opacity: expandedStep === idx ? 1 : 0,
                  height: expandedStep === idx ? "auto" : 0,
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-border/30 space-y-4">
                  {/* Affected Files */}
                  <div>
                    <p className="text-text-dim text-xs uppercase font-mono tracking-wider mb-2">
                      Affected Files
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {step.affectedFiles.map((file) => (
                        <div
                          key={file}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg/60 border border-border/30"
                        >
                          <FileCode2 size={12} className="text-accent" />
                          <span className="font-mono text-xs text-text-dim">
                            {file}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Changes */}
                  <div>
                    <p className="text-text-dim text-xs uppercase font-mono tracking-wider mb-2">
                      Changes
                    </p>
                    <ul className="space-y-1.5">
                      {step.changes.map((change, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.05 }}
                          className="flex items-start gap-2 text-sm text-text-dim"
                        >
                          <span className="text-accent mt-1">→</span>
                          <span>{change}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* Reasoning */}
                  <div>
                    <p className="text-text-dim text-xs uppercase font-mono tracking-wider mb-2">
                      Why This Order
                    </p>
                    <p className="text-sm text-text-dim bg-bg/40 rounded-lg p-3">
                      {step.reasoning}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
