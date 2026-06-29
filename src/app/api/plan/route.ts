import { NextRequest, NextResponse } from "next/server";

type AnalysisFile = {
  name: string;
  lines: number;
  complexity: string;
};

type PlanAnalysis = {
  filesAnalyzed: AnalysisFile[];
  codePatterns: string[];
  overallComplexity: string;
};

type PlanRequestBody = {
  analysis?: PlanAnalysis;
  migrationGoal?: string;
};

type MigrationPlanResponse = {
  steps: Array<{
    stepNumber: number;
    title: string;
    description: string;
    affectedFiles: string[];
    changes: string[];
    reasoning: string;
    estimatedTime: string;
  }>;
  totalSteps: number;
  overallStrategy: string;
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
 * Handles migration plan generation requests.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as PlanRequestBody;
    const analysis = body.analysis;
    const migrationGoal = body.migrationGoal ?? "";

    if (!analysis || !Array.isArray(analysis.filesAnalyzed)) {
      return NextResponse.json(
        { error: "No analysis provided" },
        { status: 400 },
      );
    }

    const filesList = analysis.filesAnalyzed
      .map((file) => `- ${file.name} (${file.lines} lines, ${file.complexity})`)
      .join("\n");

    const prompt = `Create a migration plan for: "${migrationGoal}"

Analysis Summary:
- Files: ${filesList}
- Patterns: ${analysis.codePatterns.join(", ")}
- Complexity: ${analysis.overallComplexity}

Create an ordered migration plan. Respond ONLY with valid JSON (no comments, no markdown):
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step title",
      "description": "What to do",
      "affectedFiles": ["file1.js", "file2.js"],
      "changes": ["Change 1: description", "Change 2: description"],
      "reasoning": "Why this order matters",
      "estimatedTime": "15 mins"
    }
  ],
  "totalSteps": 3,
  "overallStrategy": "Brief description of the approach"
}`;

    const responseText = await callOllama(prompt);
    const cleanedJson = extractJson(responseText);

    if (!cleanedJson) {
      throw new Error("Failed to find JSON in response");
    }

    let plan: MigrationPlanResponse;
    try {
      plan = JSON.parse(cleanedJson) as MigrationPlanResponse;
    } catch {
      throw new Error("Failed to parse plan as valid JSON");
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Plan request failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Plan generation failed",
      },
      { status: 500 },
    );
  }
}
