import { NextRequest, NextResponse } from "next/server";

type SourceFile = {
  name: string;
  content: string;
};

type FileAnalysis = {
  name: string;
  language: string;
  complexity: "low" | "medium" | "high";
  lines: number;
  keyPatterns: string[];
};

type AnalyzeRequestBody = {
  files?: SourceFile[];
  migrationGoal?: string;
};

type AnalysisResponse = {
  totalFiles: number;
  codePatterns: string[];
  filesAnalyzed: FileAnalysis[];
  overallComplexity: "low" | "medium" | "high";
  estimatedEffort: string;
};

type OllamaResponse = {
  response?: string;
};

const OLLAMA_API = process.env.OLLAMA_API || "http://localhost:11434";
const MODEL = "codellama:7b";

/**
 * Sends a prompt to Ollama and returns the generated response text.
 */
async function callOllama(prompt: string): Promise<string> {
  try {
    const response = await fetch(`${OLLAMA_API}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Ollama request failed with ${response.status}: ${errorText || response.statusText}`,
      );
    }

    const data = (await response.json()) as OllamaResponse;
    return data.response ?? "";
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `Ollama connection failed at ${OLLAMA_API}. Make sure Ollama is running. ${message}`,
    );
  }
}

/**
 * Extracts the first JSON object from model output.
 */
function extractJson(responseText: string): string | null {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return null;
  }

  let cleaned = jsonMatch[0].replace(/\/\/.*$/gm, "");
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");
  cleaned = cleaned.replace(/\s+/g, " ");
  return cleaned;
}

/**
 * Handles codebase analysis requests.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as AnalyzeRequestBody;
    const files = Array.isArray(body.files) ? body.files : [];
    const migrationGoal = body.migrationGoal ?? "";

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const fileSummary = files
      .map((file) => {
        const lines = file.content.split("\n").length;
        const imports = (file.content.match(/import |require\(/g) ?? []).length;
        const functions = (
          file.content.match(/function |const \w+ = \(|=>/g) ?? []
        ).length;
        return `- ${file.name}: ${lines} lines, ${imports} imports, ${functions} functions`;
      })
      .join("\n");

    const prompt = `Analyze this codebase for migration. Goal: "${migrationGoal}"

Files:
${fileSummary}

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "totalFiles": ${files.length},
  "codePatterns": ["pattern1", "pattern2", "pattern3"],
  "filesAnalyzed": [
${files
  .map((file) => {
    const lines = file.content.split("\n").length;
    const language = file.name.match(/\.(ts|tsx)$/)
      ? "typescript"
      : file.name.match(/\.jsx?$/)
        ? "javascript"
        : file.name.match(/\.json$/)
          ? "json"
          : "other";

    let complexity: "low" | "medium" | "high" = "low";
    if (lines > 300) {
      complexity = "high";
    } else if (lines > 100) {
      complexity = "medium";
    }

    const hasClasses = /class \w+/.test(file.content);
    const hasHooks = /useState|useEffect|useContext/.test(file.content);
    const hasAsync = /async |await /.test(file.content);

    const patterns: string[] = [];
    if (hasClasses) patterns.push("class-components");
    if (hasHooks) patterns.push("react-hooks");
    if (hasAsync) patterns.push("async-await");

    return `    {
      "name": "${file.name}",
      "language": "${language}",
      "complexity": "${complexity}",
      "lines": ${lines},
      "keyPatterns": [${patterns.map((pattern) => `"${pattern}"`).join(", ")}]
    }`;
  })
  .join(",\n")}
  ],
  "overallComplexity": "medium",
  "estimatedEffort": "1-2 days"
}`;

    const responseText = await callOllama(prompt);
    const cleanedJson = extractJson(responseText);

    if (!cleanedJson) {
      throw new Error("Failed to parse Ollama response as JSON");
    }

    const analysis = JSON.parse(cleanedJson) as AnalysisResponse;
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analyze request failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Analysis failed",
      },
      { status: 500 },
    );
  }
}
