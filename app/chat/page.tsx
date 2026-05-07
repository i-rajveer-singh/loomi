"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useTelemetry } from "../hooks/useTelemetry";

const INITIAL_MESSAGE = "oh hey. i've got your context loaded. what's on your mind right now?";

const LOADING_PHRASES = [
  "contemplating...",
  "loomi's thinking...",
  "let me think gurl...",
  "processing your thoughts...",
  "locking in...",
];

const ease = [0.22, 1, 0.36, 1] as const;

function randomPhrase() {
  return LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)];
}

export default function ChatPage() {
  const [userContext, setUserContext] = useState<Record<string, unknown>>({});
  const contextRef = useRef<Record<string, unknown>>({});
  const telemetryRef = useRef<any>(null);
  const [inputValue, setInputValue]   = useState("");
  const [loadingPhrase, setLoadingPhrase] = useState(LOADING_PHRASES[0]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isContextLoaded, setIsContextLoaded] = useState(false);
  const hasCheckedInterceptRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { handleKeyPress, getAndResetTelemetry } = useTelemetry();

  // Load context from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("loomi_context");
      const parsed = raw ? JSON.parse(raw) : {};
      setUserContext(parsed);
      contextRef.current = parsed;
    } catch {
      setUserContext({});
    } finally {
      setIsContextLoaded(true);
    }
  }, []);

  // Keep contextRef in sync so every request uses the latest context
  useEffect(() => {
    contextRef.current = userContext;
  }, [userContext]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        // inject the latest userContext into every request via the ref
        prepareSendMessagesRequest: ({ messages }) => ({
          body: { messages, context: contextRef.current, telemetry: telemetryRef.current },
        }),
      }),
    // transport created once; contextRef.current is read at send-time
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { messages, sendMessage, status, error, append } = useChat({
    transport,
    onError: (err) => console.error("[loomi/chat] useChat error:", err),
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Pick a fresh random phrase each time loading starts
  useEffect(() => {
    if (isLoading) setLoadingPhrase(randomPhrase());
  }, [isLoading]);

  // Auto-focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  const hasStarted = messages.length > 0;

  // Extract text from last assistant message via parts
  const lastAssistantMessage = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last) return INITIAL_MESSAGE;
    const textPart = last.parts.find((p) => p.type === "text");
    return (textPart as { type: "text"; text: string } | undefined)?.text ?? INITIAL_MESSAGE;
  }, [messages]);

  useEffect(() => {
    if (!isContextLoaded || hasCheckedInterceptRef.current) return;
    hasCheckedInterceptRef.current = true;

    const lastActiveValue = Number(userContext.lastActive);
    if (!Number.isFinite(lastActiveValue)) return;

    const timeSinceActive = Date.now() - lastActiveValue;
    const thresholdMs = 4 * 60 * 60 * 1000;
    const hasGoals = Array.isArray(userContext.actionableGoals) && userContext.actionableGoals.length > 0;

    if (timeSinceActive > thresholdMs && hasGoals) {
      append({ role: "user", content: "[SYSTEM_EVENT: PROACTIVE_PING]" });
    }
  }, [isContextLoaded, userContext, append]);

  const updateLastActive = () => {
    const updatedContext = { ...contextRef.current, lastActive: Date.now() };
    localStorage.setItem("loomi_context", JSON.stringify(updatedContext));
    contextRef.current = updatedContext;
    setUserContext(updatedContext);
  };

  const mergeStringArrays = (existing: unknown, incoming: unknown) => {
    const base = Array.isArray(existing) ? existing : [];
    const add = Array.isArray(incoming) ? incoming : [];
    const combined = [...base, ...add]
      .map((item) => String(item).trim())
      .filter(Boolean);
    return Array.from(new Set(combined));
  };

  const handleEndSession = async () => {
    updateLastActive();
    if (messages.length === 0 || isSummarizing) return;
    setIsSummarizing(true);
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) throw new Error(`summarize failed: ${response.status}`);

      const summary = (await response.json()) as {
        identityStakes?: string[];
        actionableGoals?: string[];
        domainTags?: string[];
      };

      let existingContext: Record<string, unknown> = {};
      try {
        const raw = localStorage.getItem("loomi_context");
        existingContext = raw ? JSON.parse(raw) : {};
      } catch {
        existingContext = {};
      }

      const updatedContext = {
        ...existingContext,
        identityStakes: mergeStringArrays(
          existingContext["identityStakes"],
          summary.identityStakes
        ),
        actionableGoals: mergeStringArrays(
          existingContext["actionableGoals"],
          summary.actionableGoals
        ),
        domainTags: mergeStringArrays(
          existingContext["domainTags"],
          summary.domainTags
        ),
      };

      localStorage.setItem("loomi_context", JSON.stringify(updatedContext));
      setIsSummarizing(false);
      window.location.reload();
      return;
    } catch (err) {
      console.error("[loomi/chat] summarize error:", err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSend = async () => {
    updateLastActive();
    const text = (inputValue ?? "").trim();
    if (!text || isLoading) return;
    setInputValue("");
    telemetryRef.current = getAndResetTelemetry();
    await sendMessage({ text });
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    handleKeyPress(e);
    if (e.key === "Enter") handleSend();
  };

  const statusLabel = isLoading
    ? loadingPhrase
    : hasStarted
    ? "your turn"
    : "hi :D";

  const statusKey = isLoading ? loadingPhrase : hasStarted ? "your-turn" : "hi";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 relative">

      <div className="absolute top-6 right-6">
        <button
          type="button"
          onClick={handleEndSession}
          disabled={isSummarizing || messages.length === 0}
          className="text-xs text-gray-400 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:hover:text-gray-400"
          aria-label="end session"
        >
          {isSummarizing ? "vaulting..." : "end session"}
        </button>
      </div>

      {/* ── Centerpiece ── */}
      <div className="flex flex-col items-center">

        {/* Status label */}
        <AnimatePresence mode="wait">
          <motion.p
            key={statusKey}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.3, ease }}
            className="text-sm text-gray-400 mb-6 tracking-tight"
          >
            {statusLabel}
          </motion.p>
        </AnimatePresence>

        {/* Yellow circle */}
        <motion.div
          animate={
            isLoading
              ? { scale: [1, 1.14, 1], opacity: [1, 0.7, 1] }
              : { scale: [1, 1.05, 1], opacity: [1, 0.8, 1] }
          }
          transition={{
            duration: isLoading ? 0.9 : 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-40 h-40 rounded-full bg-yellow-300"
        />

        {/* Error display */}
        {error && (
          <p className="mt-4 text-sm text-red-500 max-w-sm text-center break-all">
            api error: {error.message}
          </p>
        )}

        {/* AI message */}
        <div className="mt-8 max-w-md text-center min-h-[3.5rem] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {!isLoading && (
              <motion.p
                key={lastAssistantMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease }}
                className="text-xl text-gray-800 tracking-tight leading-snug"
              >
                {lastAssistantMessage}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Input Bar (fixed bottom) ── */}
      <div className="fixed bottom-0 inset-x-0 flex justify-center pb-12 px-6">
        <form
          onSubmit={handleSubmit}
          className="relative w-full max-w-xl flex items-center gap-3"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="say something..."
            className="flex-1 bg-transparent border-b-2 border-gray-200 focus:border-gray-900 py-3 text-base text-gray-900 tracking-tight focus:outline-none transition-colors placeholder:text-gray-300 disabled:opacity-50 caret-yellow-400"
          />
          <button
            type="submit"
            disabled={!(inputValue ?? "").trim() || isLoading}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
              (inputValue ?? "").trim() && !isLoading
                ? "bg-gray-900 text-white hover:bg-black"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
            aria-label="send message"
          >
            <ArrowUp size={18} />
          </button>
        </form>
      </div>

    </div>
  );
}

