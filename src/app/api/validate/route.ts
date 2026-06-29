import { NextRequest, NextResponse } from "next/server";

const OLLAMA_API = process.env.OLLAMA_API || "http://localhost:11434";
const MODEL = "codellama:7b";

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
    throw new Error(`Ollama connection failed. Make sure Ollama is running.`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { fileName, rewrittenCode, originalCode, migrationGoal } =
      await req.json();

    if (!fileName || !rewrittenCode) {
      return NextResponse.json(
        { error: "Missing fileName or rewrittenCode" },
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

Respond ONLY with JSON (no markdown):
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
      console.error("Ollama response:", responseText);
      throw new Error("Failed to parse validation as JSON");
    }

    const validation = JSON.parse(jsonMatch[0]);
    return NextResponse.json(validation);
  } catch (error) {
    console.error("Validate error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Validation failed",
      },
      { status: 500 },
    );
  }
}
