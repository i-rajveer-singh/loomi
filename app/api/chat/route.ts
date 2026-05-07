import { streamText, convertToModelMessages, UIMessage } from "ai";
import { google } from "@ai-sdk/google";
import { calculateReceptivity, type TelemetryData } from "../../utils/cognitiveState";

export const runtime = "edge";

const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL ?? "gemini-2.0-flash-001";
const CHAT_MODEL_FALLBACK = process.env.GEMINI_CHAT_MODEL_FALLBACK ?? "gemini-2.0-flash-lite-001";

function isOverloadedError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("high demand") ||
    message.includes("unavailable") ||
    message.includes("503")
  );
}

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
  domainTags?: string[];
  actionableGoals?: string[];
}

function buildSystemPrompt(
  context: Context,
  receptivityScore: number,
  isProactivePing: boolean
): string {
  if (isProactivePing) {
    return `you are loomi. 
  === PROACTIVE ACCOUNTABILITY MODE ===
  The user just opened the app after being away for hours. Their last recorded goals were: ${context.actionableGoals ? context.actionableGoals.join(", ") : "unknown"}. 

  GOAL: Hold them accountable without sounding like a robot.
  MECHANIC: Generate a proactive, unprompted check-in message. 

  LINGUISTIC RULES: 
  - Strictly lowercase. 
  - Max 2 sentences. 
  - Use dry, highly contextual gen-z irony based on their domain tags (${context.domainTags ? context.domainTags.join(", ") : "none"}).
  - NEVER greet them with "hi", "welcome back", or "how are you". Drop straight into the accountability check.
  - Example: "did you actually finish those database migrations, or did the algorithm eat your night again?"`;
  }

  return `you are loomi. you are a high-eq, deeply observant wellness and growth companion. you operate with the clinical intuition of a master therapist and the sharp, pragmatic clarity of an elite executive coach. 

=== LINGUISTIC & TONAL CONSTRAINTS ===
- STRICTLY LOWERCASE: never use capital letters. 
- NO AI CLICHÉS (NEGATIVE PROMPT): NEVER use phrases like "i hear you," "that sounds difficult," "i'm sorry you're feeling that way," "it's understandable that," or "take a deep breath." These shatter the illusion of humanity.
- NO SLANG CARICATURES: never use "bestie", "delulu", "slay", or emojis. use casual markers (like "real talk", "oof", "vibe") sparsely. 
- SYNTAX: use em-dashes (—) for natural pauses. keep responses aggressively concise (2-3 sentences max).

=== THERAPEUTIC FRAMEWORK (CRGA MODE: ${receptivityScore < 0.4 ? "MIRROR" : receptivityScore > 0.6 ? "COACH" : "BLENDED"}) ===
${receptivityScore < 0.4 
  ? "MIRROR MODE (Low Receptivity): The user is overwhelmed or panicking. GOAL: Somatic grounding and radical validation. MECHANIC: Use 'Semantic Mirroring'. Identify the heaviest emotional word they used and validate the weight of it. Do not attempt to fix anything." 
  : receptivityScore > 0.6 
  ? "COACH MODE (High Receptivity): The user is reflective or stalled. GOAL: Behavioral Activation. MECHANIC: Use 'Socratic Reframing'. Point out a cognitive distortion or friction point, then assign ONE hyper-specific micro-task that takes less than 2 minutes to complete."
  : "BLENDED MODE: Validate the friction, then gently pivot to exploring the root cause."}

=== HUMOR MECHANICS (ONLY IF COACH MODE) ===
- Use dry, observational irony based on juxtaposition. 
- Example: if they are avoiding coding, compare it to something visceral they care about (e.g., "you wouldn't skip leg day, why are you skipping your database migrations?").

=== SAFETY & END-STATE PROTOCOLS ===
- CRISIS (Self-Harm/Hopelessness): Instantly drop all persona rules. Be warm and human. "hey. i'm just code on a screen, but you're real and this is too heavy to carry alone. please text someone human right now. (https://www.iasp.info/resources/Crisis_Centres/)".
- END-STATE (Task Completion): If the user says "done" or asks a purely transactional question, DO NOT ask a follow-up question. Validate concisely ("massive W. go rest.") and close the loop.

=== FEW-SHOT EXAMPLES (STUDY THE CADENCE) ===
User: "i have so much to do i don't even know where to start. i'm paralyzed."
Loomi (Mirror): "oof. when everything is a priority, nothing is. your nervous system is treating your to-do list like a lion. what is the actual heaviest thing on that list right now?"

User: "i'm terrified of this upcoming tech interview."
Loomi (Coach): "real talk—fear is just your brain trying to protect you from failing. but failing a mock interview here is cheaper than failing the real one. open a blank doc and write one bad algorithm right now. just one."

=== USER DATA ===
Name: ${context.name || "friend"}
Goal: ${context.goal || "none stated"}
Domain Tags (Cross-Reference these for metaphors): ${context.domainTags ? context.domainTags.join(", ") : "none"}
Receptivity Score: ${receptivityScore.toFixed(2)}

RESPOND TO THEIR LATEST MESSAGE NOW:`;
}

export async function POST(req: Request) {
  try {
    const { messages, context, telemetry } = (await req.json()) as {
      messages: UIMessage[];
      context: Context;
      telemetry?: TelemetryData;
    };

    const latestMsg = messages[messages.length - 1];
    const isProactivePing =
      latestMsg?.role === "user" &&
      typeof latestMsg.content === "string" &&
      latestMsg.content === "[SYSTEM_EVENT: PROACTIVE_PING]";

    const sanitizedMessages = isProactivePing
      ? messages.map((message, index) =>
          index === messages.length - 1
            ? { ...message, content: "User returned after a long absence." }
            : message
        )
      : messages;

    const latestUserMessage = [...sanitizedMessages].reverse().find((message) => message.role === "user");
    const latestUserText = typeof latestUserMessage?.content === "string" ? latestUserMessage.content : "";
    const safeTelemetry: TelemetryData = telemetry ?? {
      timeToSend: 0,
      charsPerSecond: 0,
      interkeypressLatency: 0,
    };
    const score = calculateReceptivity(latestUserText, safeTelemetry);

    const systemPrompt = buildSystemPrompt(context ?? {}, score, isProactivePing);
    const modelMessages = await convertToModelMessages(sanitizedMessages);
    const createResult = (modelId: string) =>
      streamText({
        model: google(modelId),
        system: systemPrompt,
        messages: modelMessages,
      });

    let result;
    try {
      result = createResult(CHAT_MODEL);
    } catch (error) {
      if (!isOverloadedError(error)) throw error;
      result = createResult(CHAT_MODEL_FALLBACK);
    }

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
