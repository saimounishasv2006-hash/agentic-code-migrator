import { NextRequest, NextResponse } from "next/server";

type ValidateRequestBody = {
  fileName?: string;
  rewrittenCode?: string;
  originalCode?: string;
  migrationGoal?: string;
};

type ValidationResult = {
  fileName: string;
  passed: boolean;
  score: number;
  issues: string[];
  summary: string;
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
      `Ollama connection failed. Make sure Ollama is running. ${message}`,
    );
  }
}

/**
 * Handles validation requests for rewritten files.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as ValidateRequestBody;
    const fileName = body.fileName;
    const rewrittenCode = body.rewrittenCode;
    const originalCode = body.originalCode;
    const migrationGoal = body.migrationGoal ?? "";

    if (!fileName || !rewrittenCode || !originalCode) {
      return NextResponse.json(
        { error: "Missing fileName, rewrittenCode, or originalCode" },
        { status: 400 },
      );
    }

    const prompt = `Validate this migrated code. Migration goal: "${migrationGoal}"

Original:
\`\`\`
${originalCode.slice(0, 300)}
\`\`\`

Rewritten:
\`\`\`
${rewrittenCode.slice(0, 300)}
\`\`\`

Check for:
1. Syntax errors
2. Missing imports
3. Incomplete migration (leftover old patterns)
4. Breaking changes

Respond only with JSON (no markdown):
{
  "fileName": "${fileName}",
  "passed": true|false,
  "score": 0-100,
  "issues": ["issue1", "issue2"],
  "summary": "brief assessment"
}`;

    const responseText = await callOllama(prompt);
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Failed to parse validation as JSON");
    }

    const validation = JSON.parse(jsonMatch[0]) as ValidationResult;
    return NextResponse.json(validation);
  } catch (error) {
    console.error("Validation request failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Validation failed",
      },
      { status: 500 },
    );
  }
}
