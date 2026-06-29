import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { fileName, fileContent, migrationGoal, context } = await req.json();

    if (!fileName || !fileContent) {
      return NextResponse.json(
        { error: "Missing fileName or fileContent" },
        { status: 400 },
      );
    }

    const prompt = `You are a code migration expert. Rewrite the following file to: "${migrationGoal}"

File: ${fileName}
\`\`\`
${fileContent}
\`\`\`

Context: ${context}

Output ONLY the rewritten code, no explanations, no markdown fences. Just the pure code.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const rewrittenCode =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({
      fileName,
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
