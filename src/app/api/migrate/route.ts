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
        temperature: 0.5,
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

function getNewFileName(
  originalFileName: string,
  migrationGoal: string,
): string {
  const lowerGoal = migrationGoal.toLowerCase();
  const isTypeScriptMigration =
    lowerGoal.includes("typescript") || lowerGoal.includes("to ts");

  if (isTypeScriptMigration) {
    // .js → .ts
    if (originalFileName.endsWith(".js")) {
      return originalFileName.replace(/\.js$/, ".ts");
    }
    // .jsx → .tsx
    if (originalFileName.endsWith(".jsx")) {
      return originalFileName.replace(/\.jsx$/, ".tsx");
    }
    // .mjs → .mts
    if (originalFileName.endsWith(".mjs")) {
      return originalFileName.replace(/\.mjs$/, ".mts");
    }
    // .cjs → .cts
    if (originalFileName.endsWith(".cjs")) {
      return originalFileName.replace(/\.cjs$/, ".cts");
    }
  }

  return originalFileName;
}

export async function POST(req: NextRequest) {
  try {
    const { fileName, fileContent, migrationGoal, context } = await req.json();

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

Output ONLY the rewritten code, no explanations, no markdown.`;

    const rewrittenCode = await callOllama(prompt);

    return NextResponse.json({
      fileName: newFileName,
      originalFileName: fileName,
      originalCode: fileContent,
      rewrittenCode,
      success: true,
    });
  } catch (error) {
    console.error("Migrate error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Rewrite failed",
      },
      { status: 500 },
    );
  }
}
