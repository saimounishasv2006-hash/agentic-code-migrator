"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, FileCode2, Zap, ArrowRight, X, Code2 } from "lucide-react";
import { useMigrationStore, UploadedFile } from "@/store/migrationStore";

const MIGRATION_PRESETS = [
  "Convert React class components to functional components with hooks",
  "Migrate from JavaScript to TypeScript",
  "Upgrade from React Router v5 to v6",
  "Migrate from Webpack to Vite",
  "Convert CommonJS require() to ES module imports",
];

const FloatingParticles = () => {
  type Particle = { id: number; left: number; top: number; delay: number };
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 2,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
          }}
          animate={{
            y: -window.innerHeight - 100,
            x: (Math.random() - 0.5) * 200,
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 20 + Math.random() * 10,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div className="particle-dot" />
        </motion.div>
      ))}
    </>
  );
};

const AnimatedCodeBackground = () => {
  const codes = [
    "const migrate = () => {}",
    "function transform(code) {}",
    "async deploy(files) {}",
  ];

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
      {/* Animated grid */}
      <div className="bg-grid" />

      {/* Floating blobs */}
      <div className="floating-blob blob-1" />
      <div className="floating-blob blob-2" />

      {/* Floating code snippets */}
      {codes.map((code, i) => (
        <motion.div
          key={i}
          className="fixed font-mono text-xs text-accent/30 pointer-events-none"
          style={{
            left: `${15 + i * 25}%`,
            top: `${20 + i * 15}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 6 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {code}
        </motion.div>
      ))}

      {/* Floating particles */}
      <FloatingParticles />
    </div>
  );
};

export default function HomePage() {
  const router = useRouter();
  const { setFiles, setMigrationGoal } = useMigrationStore();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);

  const readFiles = useCallback(async (fileList: FileList) => {
    console.log("Files received:", fileList.length);
    const results: UploadedFile[] = [];
    for (const file of Array.from(fileList)) {
      console.log("Processing file:", file.name);
      if (file.name.match(/\.(ts|tsx|js|jsx|mjs|cjs|json|css|md)$/)) {
        console.log("File matches pattern:", file.name);
        const content = await file.text();
        results.push({ name: file.name, content, path: file.name });
      } else {
        console.log("File skipped (wrong extension):", file.name);
      }
    }
    console.log("Total files to add:", results.length);
    setUploadedFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      const filtered = results.filter((f) => !names.has(f.name));
      console.log("Adding to state:", filtered.length);
      return [...prev, ...filtered];
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      readFiles(e.dataTransfer.files);
    },
    [readFiles],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) readFiles(e.target.files);
  };

  const removeFile = (name: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const handleStart = () => {
    if (!uploadedFiles.length || !goalInput.trim()) return;
    setFiles(uploadedFiles);
    setMigrationGoal(goalInput.trim());
    router.push("/migrate");
  };

  const canStart = uploadedFiles.length > 0 && goalInput.trim().length > 0;

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6 py-16 z-10">
      <AnimatedCodeBackground />

      {/* Content wrapper */}
      <div className="relative z-20 w-full">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <motion.div
            className="flex items-center justify-center gap-3 mb-6"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.div
              className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-accent-dim flex items-center justify-center shadow-lg shadow-accent/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Code2 size={20} className="text-white" />
            </motion.div>
            <span className="font-mono text-sm text-accent font-semibold tracking-widest uppercase">
              CodeShift
            </span>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-text via-accent to-text mb-4 tracking-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Migrate Code
            <br />
            <span className="text-accent">with an AI Agent</span>
          </motion.h1>

          <motion.p
            className="text-text-dim text-lg max-w-lg mx-auto mt-6 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Upload your codebase, describe your migration goal — the AI agent
            analyzes, plans, rewrites, and validates every file.
          </motion.p>
        </motion.div>

        {/* Main Content Container */}
        <div className="w-full max-w-2xl mx-auto space-y-6">
          {/* Drop Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => document.getElementById("file-input")?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer group overflow-hidden ${
              isDragging
                ? "border-accent bg-accent/15 scale-105"
                : "border-border hover:border-accent hover:bg-accent/5"
            }`}
          >
            {/* Animated background for drop zone */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-accent/0 via-accent/5 to-accent/0 pointer-events-none"
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
              <p className="text-text font-semibold text-lg mb-2">
                Drop your code files here
              </p>
              <p className="text-text-dim text-sm">
                or click to browse — supports .ts .tsx .js .jsx .json .css .md
              </p>
            </div>
          </motion.div>

          {/* Uploaded files with staggered animation */}
          {uploadedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface/80 backdrop-blur border border-border rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-text-dim text-xs font-mono uppercase tracking-wider">
                  📁 {uploadedFiles.length} file
                  {uploadedFiles.length > 1 ? "s" : ""} ready
                </p>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap size={12} className="text-accent/50" />
                </motion.div>
              </div>

              <div className="space-y-2">
                {uploadedFiles.map((f, idx) => (
                  <motion.div
                    key={f.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between py-2.5 px-4 rounded-lg bg-bg/60 hover:bg-bg/80 transition-colors group border border-border/30 hover:border-accent/30"
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <FileCode2 size={14} className="text-accent" />
                      </motion.div>
                      <span className="font-mono text-sm text-text">
                        {f.name}
                      </span>
                    </div>
                    <motion.button
                      onClick={() => removeFile(f.name)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-text-dim hover:text-danger"
                    >
                      <X size={16} />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Migration Goal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="space-y-4"
          >
            <label className="text-text-dim text-xs font-mono uppercase tracking-wider block">
              ✨ What migration do you need?
            </label>
            <motion.textarea
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="E.g., 'Convert all class components to functional components with hooks'"
              rows={3}
              whileFocus={{ scale: 1.02 }}
              className="w-full bg-surface/80 border border-border rounded-xl px-5 py-4 text-sm text-text placeholder-text-dim focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none font-sans transition-all backdrop-blur"
            />

            {/* Preset Pills with interactive animation */}
            <div className="flex flex-wrap gap-2.5 mt-4">
              {MIGRATION_PRESETS.map((preset) => (
                <motion.button
                  key={preset}
                  onClick={() => setGoalInput(preset)}
                  onHoverStart={() => setHoveredPreset(preset)}
                  onHoverEnd={() => setHoveredPreset(null)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`text-xs px-4 py-2.5 rounded-full border transition-all font-mono backdrop-blur ${
                    hoveredPreset === preset
                      ? "border-accent bg-accent/10 text-accent shadow-lg shadow-accent/20"
                      : "border-border text-text-dim hover:border-accent/50"
                  }`}
                >
                  {preset.length > 35 ? preset.slice(0, 35) + "…" : preset}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Start Button with dynamic glow */}
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
              className={`relative w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold text-base transition-all overflow-hidden group ${
                canStart
                  ? "bg-gradient-to-r from-accent to-accent-dim text-white shadow-xl shadow-accent/30 cursor-pointer hover:shadow-2xl hover:shadow-accent/40"
                  : "bg-surface text-text-dim cursor-not-allowed border border-border"
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

          {/* Info Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-text-dim text-xs mt-8"
          >
            Powered by Ollama • All processing runs locally on your machine
          </motion.p>
        </div>
      </div>
    </main>
  );
}
