import { generateObject, type UIMessage } from "ai";
import { z } from "zod";
import { google } from "@ai-sdk/google";

export const runtime = "edge";

const schema = z.object({
  identityStakes: z
    .array(z.string())
    .describe("Core internal pressures or identities the user is trying to protect or build."),
  actionableGoals: z
    .array(z.string())
    .describe("Specific, tiny micro-tasks assigned or agreed upon during the session."),
  domainTags: z
    .array(z.string())
    .describe("Categories of life discussed, e.g., CS_Career, Gym_Fitness, Relationships."),
});

function messageToText(message: UIMessage): string {
  if (typeof message.content === "string") return message.content;
  const parts = Array.isArray(message.parts) ? message.parts : [];
  const textParts = parts
    .map((part) => (part && part.type === "text" ? String(part.text ?? "") : ""))
    .filter(Boolean);
  if (textParts.length > 0) return textParts.join(" ");
  return "";
}

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages: UIMessage[] };

    const transcript = (messages ?? [])
      .map((message) => `${message.role}: ${messageToText(message)}`)
      .join("\n");

    const result = await generateObject({
      model: google("gemini-2.5-flash"),
      schema,
      system:
        "you are an expert clinical psychologist analyzing a chat transcript. extract only what is explicitly supported by the user's words. do not invent facts or add assumptions. return empty arrays when no evidence exists.",
      prompt: transcript,
    });

    return Response.json(result.object);
  } catch (error) {
    console.error("[loomi/api/summarize] error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
