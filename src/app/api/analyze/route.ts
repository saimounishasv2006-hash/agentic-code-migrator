import { NextRequest, NextResponse } from "next/server";

const OLLAMA_API = process.env.OLLAMA_API || "http://localhost:11434";
const MODEL = "codellama:7b"; // Changed from qwen2.5:1.5b

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
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || "";
  } catch (error) {
    throw new Error(
      `Ollama connection failed at ${OLLAMA_API}. Make sure Ollama is running: ollama serve`,
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { files, migrationGoal } = await req.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Build file summary (analyze, don't paste entire content)
    const fileSummary = files
      .map((f: { name: string; content: string }) => {
        const lines = f.content.split("\n").length;
        const imports = (f.content.match(/import |require\(/g) || []).length;
        const functions = (
          f.content.match(/function |const \w+ = \(|=>/g) || []
        ).length;
        return `- ${f.name}: ${lines} lines, ${imports} imports, ${functions} functions`;
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
  .map((f: { name: string; content: string }) => {
    const lines = f.content.split("\n").length;
    const lang = f.name.match(/\.(ts|tsx)$/)
      ? "typescript"
      : f.name.match(/\.jsx?$/)
        ? "javascript"
        : f.name.match(/\.json$/)
          ? "json"
          : "other";

    let complexity: "low" | "medium" | "high" = "low";
    if (lines > 300) complexity = "high";
    else if (lines > 100) complexity = "medium";

    const hasClasses = /class \w+/.test(f.content);
    const hasHooks = /useState|useEffect|useContext/.test(f.content);
    const hasAsync = /async |await /.test(f.content);

    const patterns = [];
    if (hasClasses) patterns.push("class-components");
    if (hasHooks) patterns.push("react-hooks");
    if (hasAsync) patterns.push("async-await");

    return `    {
      "name": "${f.name}",
      "language": "${lang}",
      "complexity": "${complexity}",
      "lines": ${lines},
      "keyPatterns": [${patterns.map((p) => `"${p}"`).join(", ")}]
    }`;
  })
  .join(",\n")}
  ],
  "overallComplexity": "medium",
  "estimatedEffort": "1-2 days"
}`;

    const responseText = await callOllama(prompt);

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Ollama response:", responseText);
      throw new Error("Failed to parse Ollama response as JSON");
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Analysis failed",
      },
      { status: 500 },
    );
  }
}
