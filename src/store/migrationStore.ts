import { create } from "zustand";

export type UploadedFile = {
  name: string;
  content: string;
  path: string;
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
  setFiles: (files: UploadedFile[]) => void;
  setMigrationGoal: (goal: string) => void;
  setPhase: (phase: AgentPhase) => void;
  reset: () => void;
};

export const useMigrationStore = create<MigrationStore>((set) => ({
  files: [],
  migrationGoal: "",
  phase: "idle",
  setFiles: (files) => set({ files }),
  setMigrationGoal: (goal) => set({ migrationGoal: goal }),
  setPhase: (phase) => set({ phase }),
  reset: () => set({ files: [], migrationGoal: "", phase: "idle" }),
}));
