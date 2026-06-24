import { create } from "zustand";

export type UploadedFile = {
  name: string;
  content: string;
  path: string;
};

export type AnalysisResult = {
  totalFiles: number;
  codePatterns: string[];
  filesAnalyzed: Array<{
    name: string;
    language: string;
    complexity: "low" | "medium" | "high";
    lines: number;
    keyPatterns: string[];
  }>;
  overallComplexity: "low" | "medium" | "high";
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
  agentLog: string[];
  setFiles: (files: UploadedFile[]) => void;
  setMigrationGoal: (goal: string) => void;
  setPhase: (phase: AgentPhase) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  addLog: (message: string) => void;
  reset: () => void;
};

export const useMigrationStore = create<MigrationStore>((set) => ({
  files: [],
  migrationGoal: "",
  phase: "idle",
  analysisResult: null,
  agentLog: [],
  setFiles: (files) => set({ files }),
  setMigrationGoal: (goal) => set({ migrationGoal: goal }),
  setPhase: (phase) => set({ phase }),
  setAnalysisResult: (result) => set({ analysisResult: result }),
  addLog: (message) =>
    set((state) => ({
      agentLog: [
        ...state.agentLog,
        `[${new Date().toLocaleTimeString()}] ${message}`,
      ],
    })),
  reset: () =>
    set({
      files: [],
      migrationGoal: "",
      phase: "idle",
      analysisResult: null,
      agentLog: [],
    }),
}));
