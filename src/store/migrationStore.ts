import { create } from "zustand";

export type ComplexityLevel = "low" | "medium" | "high";

export type MigrationStep = {
  stepNumber: number;
  title: string;
  description: string;
  affectedFiles: string[];
  changes: string[];
  reasoning: string;
  estimatedTime: string;
};

export type FileAnalysis = {
  name: string;
  language: string;
  complexity: ComplexityLevel;
  lines: number;
  keyPatterns: string[];
};

export type MigrationPlan = {
  steps: MigrationStep[];
  totalSteps: number;
  overallStrategy: string;
};

export type UploadedFile = {
  name: string;
  content: string;
  path: string;
};

export type AnalysisResult = {
  totalFiles: number;
  codePatterns: string[];
  filesAnalyzed: FileAnalysis[];
  overallComplexity: ComplexityLevel;
  estimatedEffort: string;
};

export type AgentPhase =
  | "idle"
  | "analyzing"
  | "planning"
  | "migrating"
  | "validating"
  | "done";

type MigrationStore = {
  files: UploadedFile[];
  migrationGoal: string;
  phase: AgentPhase;
  analysisResult: AnalysisResult | null;
  migrationPlan: MigrationPlan | null;
  agentLog: string[];
  setFiles: (files: UploadedFile[]) => void;
  setMigrationGoal: (goal: string) => void;
  setPhase: (phase: AgentPhase) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  setMigrationPlan: (plan: MigrationPlan | null) => void;
  addLog: (message: string) => void;
  reset: () => void;
};

/**
 * Returns a timestamp for log entries.
 */
function getLogTimestamp(): string {
  return new Date().toLocaleTimeString();
}

export const useMigrationStore = create<MigrationStore>((set) => ({
  files: [],
  migrationGoal: "",
  phase: "idle",
  analysisResult: null,
  migrationPlan: null,
  agentLog: [],
  setFiles: (files) => set({ files }),
  setMigrationGoal: (goal) => set({ migrationGoal: goal }),
  setPhase: (phase) => set({ phase }),
  setAnalysisResult: (result) => set({ analysisResult: result }),
  setMigrationPlan: (plan) => set({ migrationPlan: plan }),
  addLog: (message) =>
    set((state) => ({
      agentLog: [...state.agentLog, `[${getLogTimestamp()}] ${message}`],
    })),
  reset: () =>
    set({
      files: [],
      migrationGoal: "",
      phase: "idle",
      analysisResult: null,
      migrationPlan: null,
      agentLog: [],
    }),
}));
