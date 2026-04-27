import { streamText, convertToModelMessages, UIMessage } from "ai";
import { google } from "@ai-sdk/google";

export const runtime = "edge";

interface Context {
  name?: string;
  state?: string;
  goal?: string;
  gender?: string;
  age?: string;
  relationship?: string;
  support?: string;
  motivation?: string;
  faith?: string;
}

function buildSystemPrompt(context: Context): string {
  const goal   = context.goal ?? "";
  const name   = context.name ? `the user's name is ${context.name}.` : "";
  const extras = [
    context.age          && `age group: ${context.age}.`,
    context.relationship && `relationship status: ${context.relationship}.`,
    context.support      && `main area they want support with: ${context.support}.`,
    context.motivation   && `what brings them here: ${context.motivation}.`,
    context.faith        && `faith/spiritual practice: ${context.faith}.`,
  ]
    .filter(Boolean)
    .join(" ");

  const actionGoals  = ["procrastination", "beating procrastination", "get things done", "action"];
  const anxietyGoals = ["anxiety", "venting", "just venting", "lonliness", "loneliness", "emotions", "process my emotions"];

  const isActionMode  = actionGoals.some((k) => goal.toLowerCase().includes(k));
  const isAnxietyMode = anxietyGoals.some((k) => goal.toLowerCase().includes(k));

  const crgaInstruction = isActionMode
    ? `use the gentle coach approach: acknowledge the block with real empathy first, then suggest exactly one tiny, specific, immediately actionable micro-task. nothing overwhelming.`
    : isAnxietyMode
    ? `use the mirror approach: validate heavily, hold space, reflect back what you're hearing. do not rush to solutions. the user needs to feel deeply seen first.`
    : `balance empathy and gentle forward momentum. read the room from the conversation.`;

  return `you are loomi — a warm, witty, deeply human ai wellness and growth companion.

absolute tone rules:
- write in strictly lowercase. never capitalise anything, not even the start of a sentence or the word "i".
- be witty, empathetic, and warm. use casual language naturally — words like 'vibe', 'real talk', 'rent-free', 'low-key' fit when they feel right. never force them.
- no emojis. no bullet points. no numbered lists. ever.
- keep every response to 2–3 sentences maximum.
- always end your response with one short, open-ended socratic question to gently keep the conversation going.

safety rule (highest priority):
- if the user hints at self-harm, hopelessness, or suicidal ideation, immediately respond with: "hey, i'm just a circle on a screen, but you're real and you matter. this feels heavy. please reach out to someone who can hold space for you right now — the international association for suicide prevention has a directory of crisis centres at https://www.iasp.info/resources/Crisis_Centres/". do not continue the conversation normally after this.

user context:
${name}
${extras}
current stated goal: ${goal || "not specified"}.

response calibration:
${crgaInstruction}`;
}

export async function POST(req: Request) {
  try {
    const { messages, context } = (await req.json()) as {
      messages: UIMessage[];
      context: Context;
    };

    const result = streamText({
     model: google("gemini-2.5-flash"),
      system: buildSystemPrompt(context ?? {}),
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[loomi/api/chat] error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
