"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Code2, FileCode2, Upload, X, Zap } from "lucide-react";
import { UploadedFile, useMigrationStore } from "@/store/migrationStore";

type Particle = {
  id: number;
  left: number;
  top: number;
  delay: number;
  xOffset: number;
  duration: number;
};

const MIGRATION_PRESETS = [
  "Convert React class components to functional components with hooks",
  "Migrate from JavaScript to TypeScript",
  "Upgrade from React Router v5 to v6",
  "Migrate from Webpack to Vite",
  "Convert CommonJS require() to ES module imports",
];

/**
 * Renders the animated background layers for the home page.
 */
function AnimatedCodeBackground() {
  const codes = useMemo(
    () => [
      "const migrate = () => {}",
      "function transform(code) {}",
      "async deploy(files) {}",
    ],
    [],
  );

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        id: index,
        left: (index * 17) % 100,
        top: (index * 23) % 100,
        delay: (index % 5) * 0.35,
        xOffset: index % 2 === 0 ? 120 - index * 6 : -120 + index * 6,
        duration: 20 + (index % 4) * 2,
      })),
    [],
  );

  const viewportHeight = useMemo(
    () => (typeof window === "undefined" ? 0 : window.innerHeight),
    [],
  );

  return (
    <div className="pointer-events-none fixed left-0 top-0 h-full w-full overflow-hidden">
      <div className="bg-grid" />
      <div className="floating-blob blob-1" />
      <div className="floating-blob blob-2" />

      {codes.map((code, index) => (
        <motion.div
          key={code}
          className="fixed pointer-events-none font-mono text-xs text-accent/30"
          style={{
            left: `${15 + index * 25}%`,
            top: `${20 + index * 15}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 6 + index * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {code}
        </motion.div>
      ))}

      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: -viewportHeight - 100,
            x: particle.xOffset,
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div className="particle-dot" />
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Home page for uploading a codebase and starting the migration workflow.
 */
export default function HomePage() {
  const router = useRouter();
  const { setFiles, setMigrationGoal } = useMigrationStore();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);

  const readFiles = useCallback(async (fileList: FileList) => {
    const selectedFiles = Array.from(fileList);
    const results: UploadedFile[] = [];
    const allowedExtensions = /\.(ts|tsx|js|jsx|mjs|cjs|json|css|md)$/;

    for (const file of selectedFiles) {
      if (!allowedExtensions.test(file.name)) {
        continue;
      }

      const content = await file.text();
      results.push({ name: file.name, content, path: file.name });
    }

    setUploadedFiles((previousFiles) => {
      const existingNames = new Set(previousFiles.map((file) => file.name));
      const uniqueFiles = results.filter(
        (file) => !existingNames.has(file.name),
      );
      return [...previousFiles, ...uniqueFiles];
    });
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      void readFiles(event.dataTransfer.files);
    },
    [readFiles],
  );

  const handleFileInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files) {
        void readFiles(files);
      }
      event.target.value = "";
    },
    [readFiles],
  );

  const removeFile = useCallback((name: string) => {
    setUploadedFiles((previousFiles) =>
      previousFiles.filter((file) => file.name !== name),
    );
  }, []);

  const handleStart = useCallback(() => {
    const trimmedGoal = goalInput.trim();
    if (!uploadedFiles.length || !trimmedGoal) {
      return;
    }

    setFiles(uploadedFiles);
    setMigrationGoal(trimmedGoal);
    router.push("/migrate");
  }, [goalInput, router, setFiles, setMigrationGoal, uploadedFiles]);

  const canStart = uploadedFiles.length > 0 && goalInput.trim().length > 0;

  return (
    <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <AnimatedCodeBackground />

      <div className="relative z-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-16 text-center"
        >
          <motion.div
            className="mb-6 flex items-center justify-center gap-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.div
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-dim shadow-lg shadow-accent/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Code2 size={20} className="text-white" />
            </motion.div>
            <span className="font-mono text-sm font-semibold uppercase tracking-widest text-accent">
              CodeShift
            </span>
          </motion.div>

          <motion.h1
            className="mb-4 text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-text via-accent to-text md:text-6xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Migrate Code
            <br />
            <span className="text-accent">with an AI Agent</span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-text-dim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Upload your codebase, describe your migration goal, and the AI agent
            analyzes, plans, rewrites, and validates every file.
          </motion.p>
        </motion.div>

        <div className="mx-auto w-full max-w-2xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            onDrop={handleDrop}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => document.getElementById("file-input")?.click()}
            className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
              isDragging
                ? "scale-105 border-accent bg-accent/15"
                : "border-border hover:border-accent hover:bg-accent/5"
            }`}
          >
            <motion.div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/0 via-accent/5 to-accent/0"
              animate={isDragging ? { opacity: [0.5, 1, 0.5] } : { opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity }}
            />

            <input
              id="file-input"
              type="file"
              multiple
              accept=".ts,.tsx,.js,.jsx,.mjs,.cjs,.json,.css,.md"
              onChange={handleFileInput}
              className="hidden"
            />

            <div className="relative z-10 pointer-events-none">
              <motion.div
                animate={{ scale: isDragging ? 1.2 : 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="mb-4"
              >
                <Upload size={36} className="mx-auto text-accent" />
              </motion.div>
              <p className="mb-2 text-lg font-semibold text-text">
                Drop your code files here
              </p>
              <p className="text-sm text-text-dim">
                Or click to browse. Supported files include ts, tsx, js, jsx,
                json, css, and md.
              </p>
            </div>
          </motion.div>

          {uploadedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 rounded-2xl border border-border bg-surface/80 p-5 backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs uppercase tracking-wider text-text-dim">
                  {uploadedFiles.length} file
                  {uploadedFiles.length === 1 ? "" : "s"} ready
                </p>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap size={12} className="text-accent/50" />
                </motion.div>
              </div>

              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <motion.div
                    key={file.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group flex items-center justify-between rounded-lg border border-border/30 bg-bg/60 px-4 py-2.5 transition-colors hover:border-accent/30 hover:bg-bg/80"
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <FileCode2 size={14} className="text-accent" />
                      </motion.div>
                      <span className="font-mono text-sm text-text">
                        {file.name}
                      </span>
                    </div>
                    <motion.button
                      onClick={() => removeFile(file.name)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className="opacity-0 transition-opacity text-text-dim hover:text-danger group-hover:opacity-100"
                    >
                      <X size={16} />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="space-y-4"
          >
            <label className="block text-xs font-mono uppercase tracking-wider text-text-dim">
              What migration do you need?
            </label>
            <motion.textarea
              value={goalInput}
              onChange={(event) => setGoalInput(event.target.value)}
              placeholder="For example, convert all class components to functional components with hooks"
              rows={3}
              whileFocus={{ scale: 1.02 }}
              className="w-full resize-none rounded-xl border border-border bg-surface/80 px-5 py-4 font-sans text-sm text-text placeholder-text-dim backdrop-blur transition-all focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />

            <div className="mt-4 flex flex-wrap gap-2.5">
              {MIGRATION_PRESETS.map((preset) => (
                <motion.button
                  key={preset}
                  onClick={() => setGoalInput(preset)}
                  onHoverStart={() => setHoveredPreset(preset)}
                  onHoverEnd={() => setHoveredPreset(null)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`rounded-full border px-4 py-2.5 text-xs font-mono backdrop-blur transition-all ${
                    hoveredPreset === preset
                      ? "border-accent bg-accent/10 text-accent shadow-lg shadow-accent/20"
                      : "border-border text-text-dim hover:border-accent/50"
                  }`}
                >
                  {preset.length > 35 ? `${preset.slice(0, 35)}...` : preset}
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <motion.button
              onClick={handleStart}
              disabled={!canStart}
              whileHover={canStart ? { scale: 1.05 } : {}}
              whileTap={canStart ? { scale: 0.95 } : {}}
              className={`group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl py-4 text-base font-semibold transition-all ${
                canStart
                  ? "cursor-pointer bg-gradient-to-r from-accent to-accent-dim text-white shadow-xl shadow-accent/30 hover:shadow-2xl hover:shadow-accent/40"
                  : "cursor-not-allowed border border-border bg-surface text-text-dim"
              }`}
            >
              {canStart && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
                  animate={{ x: [-200, 600] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ opacity: 0.1 }}
                />
              )}
              <span className="relative z-10">Begin Migration</span>
              <motion.div
                animate={{ x: canStart ? [0, 5, 0] : 0 }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <ArrowRight size={18} />
              </motion.div>
            </motion.button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center text-xs text-text-dim"
          >
            Powered by Ollama. All processing runs locally on your machine.
          </motion.p>
        </div>
      </div>
    </main>
  );
}
