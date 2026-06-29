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
    throw new Error(
      `Ollama connection failed at ${OLLAMA_API}. Make sure Ollama is running.`,
    );
  }
}

function cleanJSON(jsonString: string): string {
  // Remove single-line comments (// ...)
  let cleaned = jsonString.replace(/\/\/.*$/gm, "");

  // Remove multi-line comments (/* ... */)
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");

  // Remove trailing commas before } and ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, " ");

  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    const { analysis, migrationGoal } = await req.json();

    if (!analysis) {
      return NextResponse.json(
        { error: "No analysis provided" },
        { status: 400 },
      );
    }

    const filesList = analysis.filesAnalyzed
      .map((f: any) => `- ${f.name} (${f.lines} lines, ${f.complexity})`)
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
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("Ollama response:", responseText);
      throw new Error("Failed to find JSON in response");
    }

    // Clean the JSON before parsing
    const cleanedJSON = cleanJSON(jsonMatch[0]);

    let plan;
    try {
      plan = JSON.parse(cleanedJSON);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Cleaned JSON:", cleanedJSON);
      throw new Error("Failed to parse plan as valid JSON");
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Plan error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Plan generation failed",
      },
      { status: 500 },
    );
  }
}
