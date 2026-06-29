import { NextRequest, NextResponse } from "next/server";

type MigrateRequestBody = {
  fileName?: string;
  fileContent?: string;
  migrationGoal?: string;
  context?: string;
};

type MigrateResponseBody = {
  fileName: string;
  originalFileName: string;
  originalCode: string;
  rewrittenCode: string;
  success: true;
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
        temperature: 0.5,
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
 * Returns a migrated file name when the migration targets TypeScript.
 */
function getNewFileName(
  originalFileName: string,
  migrationGoal: string,
): string {
  const lowerGoal = migrationGoal.toLowerCase();
  const isTypeScriptMigration =
    lowerGoal.includes("typescript") || lowerGoal.includes("to ts");

  if (isTypeScriptMigration) {
    if (originalFileName.endsWith(".js")) {
      return originalFileName.replace(/\.js$/, ".ts");
    }

    if (originalFileName.endsWith(".jsx")) {
      return originalFileName.replace(/\.jsx$/, ".tsx");
    }

    if (originalFileName.endsWith(".mjs")) {
      return originalFileName.replace(/\.mjs$/, ".mts");
    }

    if (originalFileName.endsWith(".cjs")) {
      return originalFileName.replace(/\.cjs$/, ".cts");
    }
  }

  return originalFileName;
}

/**
 * Handles single-file rewrite requests.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as MigrateRequestBody;
    const fileName = body.fileName;
    const fileContent = body.fileContent;
    const migrationGoal = body.migrationGoal ?? "";
    const context = body.context ?? "";

    if (!fileName || !fileContent) {
      return NextResponse.json(
        { error: "Missing fileName or fileContent" },
        { status: 400 },
      );
    }

    const newFileName = getNewFileName(fileName, migrationGoal);

    const prompt = `Rewrite this file for: "${migrationGoal}"

File: ${fileName}
\`\`\`
${fileContent}
\`\`\`

Context: ${context}

Output only the rewritten code, without explanations or markdown.`;

    const rewrittenCode = await callOllama(prompt);

    const response: MigrateResponseBody = {
      fileName: newFileName,
      originalFileName: fileName,
      originalCode: fileContent,
      rewrittenCode,
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Rewrite request failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Rewrite failed",
      },
      { status: 500 },
    );
  }
}
