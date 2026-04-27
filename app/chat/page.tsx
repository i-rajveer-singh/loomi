"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

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
  const [userContext, setUserContext] = useState<Record<string, string>>({});
  const contextRef = useRef<Record<string, string>>({});
  const [inputValue, setInputValue]   = useState("");
  const [loadingPhrase, setLoadingPhrase] = useState(LOADING_PHRASES[0]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load context from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("loomi_context");
      const parsed = raw ? JSON.parse(raw) : {};
      setUserContext(parsed);
      contextRef.current = parsed;
    } catch {
      setUserContext({});
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
          body: { messages, context: contextRef.current },
        }),
      }),
    // transport created once; contextRef.current is read at send-time
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { messages, sendMessage, status, error } = useChat({
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

  const handleSend = async () => {
    const text = (inputValue ?? "").trim();
    if (!text || isLoading) return;
    setInputValue("");
    await sendMessage({ text });
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

