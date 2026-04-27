"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingData {
  name: string;
  gender: string;
  age: string;
  acquisition: string;
  relationship: string;
  support: string;
  motivation: string;
  faith: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_QUESTION_STEPS = 11; // steps 0-10; step 11 = loader

const slideVariants = {
  enter: { opacity: 0, x: 32 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -32 },
};

const transition = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const };

// ─── Sub-components ───────────────────────────────────────────────────────────

function OptionButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-full border font-medium text-sm transition-all ${
        selected
          ? "bg-gray-900 text-white border-gray-900"
          : "bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}

function ProgressHeader({
  step,
  onBack,
}: {
  step: number;
  onBack: () => void;
}) {
  const progressPct = Math.min((step / TOTAL_QUESTION_STEPS) * 100, 100);

  return (
    <div className="w-full max-w-md mx-auto pt-8 pb-6 px-6">
      <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mb-5">
        <motion.div
          className="h-full bg-gray-900 rounded-full"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
      {step > 0 && (
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors"
          aria-label="go back"
        >
          <ArrowLeft size={20} />
        </button>
      )}
    </div>
  );
}

function ContinueFooter({
  label = "continue",
  disabled,
  onClick,
}: {
  label?: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="w-full max-w-md mx-auto px-6 pb-10 pt-4">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-4 rounded-full font-semibold text-base transition-all ${
          disabled
            ? "bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed"
            : "bg-gray-900 text-white hover:bg-black"
        }`}
      >
        {label}
      </button>
    </div>
  );
}

// ─── Loading Ring ─────────────────────────────────────────────────────────────

function LoadingRing() {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  return (
    <motion.div
      key="loader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-screen gap-8"
    >
      <div className="relative w-36 h-36">
        {/* Track */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#F3F4F6"
            strokeWidth="6"
          />
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#FDE047"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 3, ease: "easeInOut" }}
          />
        </svg>
        {/* Pulsing center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-14 h-14 bg-yellow-300 rounded-full"
            animate={{ scale: [1, 1.12, 1], opacity: [1, 0.75, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
      <p className="text-gray-400 font-medium tracking-tight">calibrating loomi...</p>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: "",
    gender: "",
    age: "",
    acquisition: "",
    relationship: "",
    support: "",
    motivation: "",
    faith: "",
  });

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => setMounted(true), []);

  // Focus name input when arriving at step 1
  useEffect(() => {
    if (step === 1) setTimeout(() => inputRef.current?.focus(), 350);
  }, [step]);

  // On loading step — save & navigate
  useEffect(() => {
    if (step === 11) {
      const timer = setTimeout(() => {
        localStorage.setItem("loomi_context", JSON.stringify(data));
        router.push("/chat");
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [step, data, router]);

  if (!mounted) return null;

  const set = <K extends keyof OnboardingData>(key: K, value: string) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  // ── Determine if footer continue should be enabled ──
  const canContinue = (): boolean => {
    switch (step) {
      case 0:  return true;
      case 1:  return data.name.trim().length > 0;
      case 2:  return !!data.gender;
      case 3:  return !!data.age;
      case 4:  return !!data.acquisition;
      case 5:  return !!data.relationship;
      case 6:  return true;
      case 7:  return !!data.support;
      case 8:  return !!data.motivation;
      case 9:  return true;
      case 10: return !!data.faith;
      default: return false;
    }
  };

  const showHeader = step > 0 && step < 11;
  const showFooter = step < 11;

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Header */}
      {showHeader && <ProgressHeader step={step} onBack={back} />}

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 11 ? (
            <LoadingRing key="loader" />
          ) : (
            <motion.div
              key={`step-${step}`}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="w-full max-w-md mx-auto px-6 flex flex-col gap-6"
            >
              {/* ── Step 0: Welcome ── */}
              {step === 0 && (
                <>
                  <p className="text-2xl font-semibold leading-snug tracking-tight text-gray-900 max-w-xs">
                    hi friend. welcome to loomi.
                  </p>
                  <p className="text-gray-500 leading-relaxed text-base">
                    we built this for you to loom the cluttered yarn of your
                    thoughts and help you think clearer + be better :)
                  </p>
                </>
              )}

              {/* ── Step 1: Name ── */}
              {step === 1 && (
                <>
                  <h1 className="text-2xl font-bold tracking-tight">what's your name?</h1>
                  <input
                    ref={inputRef}
                    type="text"
                    value={data.name}
                    onChange={(e) => set("name", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && data.name.trim() && next()}
                    placeholder="type here..."
                    className="w-full bg-transparent border-b-2 border-gray-200 py-3 text-xl focus:outline-none focus:border-gray-900 transition-colors placeholder:text-gray-300 caret-yellow-400"
                  />
                </>
              )}

              {/* ── Step 2: Gender ── */}
              {step === 2 && (
                <>
                  <h1 className="text-2xl font-bold tracking-tight">how do you identify?</h1>
                  <div className="flex flex-col gap-2.5">
                    {["female", "male", "non-binary", "gay", "lesbian", "bi", "transgender", "other"].map((o) => (
                      <OptionButton key={o} label={o} selected={data.gender === o} onClick={() => set("gender", o)} />
                    ))}
                  </div>
                </>
              )}

              {/* ── Step 3: Age ── */}
              {step === 3 && (
                <>
                  <h1 className="text-2xl font-bold tracking-tight">how many years young are you?</h1>
                  <div className="flex flex-col gap-2.5">
                    {["under 18", "18-24", "25-34", "35+", "prefer not to say"].map((o) => (
                      <OptionButton key={o} label={o} selected={data.age === o} onClick={() => set("age", o)} />
                    ))}
                  </div>
                </>
              )}

              {/* ── Step 4: Acquisition ── */}
              {step === 4 && (
                <>
                  <h1 className="text-2xl font-bold tracking-tight">how did you hear about loomi?</h1>
                  <div className="flex flex-col gap-2.5">
                    {["a friend", "my teacher", "i just know every cool thing", "other"].map((o) => (
                      <OptionButton key={o} label={o} selected={data.acquisition === o} onClick={() => set("acquisition", o)} />
                    ))}
                  </div>
                </>
              )}

              {/* ── Step 5: Relationship ── */}
              {step === 5 && (
                <>
                  <h1 className="text-2xl font-bold tracking-tight">relationship status?</h1>
                  <div className="flex flex-col gap-2.5">
                    {["single", "situationship", "in a relationship", "complicated", "married", "widowed", "can't say"].map((o) => (
                      <OptionButton key={o} label={o} selected={data.relationship === o} onClick={() => set("relationship", o)} />
                    ))}
                  </div>
                </>
              )}

              {/* ── Step 6: Interstitial 1 ── */}
              {step === 6 && (
                <>
                  <h1 className="text-2xl font-bold tracking-tight leading-snug">
                    how is this different from talking to chatgpt?
                  </h1>
                  <p className="text-gray-500 leading-relaxed text-base">
                    loomi is trained on psychological frameworks of real therapists,
                    wellness and growth professionals &amp; their executive function
                    strategies to actually help you grow, not just chat.
                  </p>
                </>
              )}

              {/* ── Step 7: CRGA Support ── */}
              {step === 7 && (
                <>
                  <h1 className="text-2xl font-bold tracking-tight">what are you most looking for support with?</h1>
                  <div className="flex flex-col gap-2.5">
                    {["anxiety", "beating procrastination", "setting boundaries", "lonliness", "just venting", "other"].map((o) => (
                      <OptionButton key={o} label={o} selected={data.support === o} onClick={() => set("support", o)} />
                    ))}
                  </div>
                </>
              )}

              {/* ── Step 8: Motivation ── */}
              {step === 8 && (
                <>
                  <h1 className="text-2xl font-bold tracking-tight">what brings you to loomi?</h1>
                  <div className="flex flex-col gap-2.5">
                    {["unlock insights about myself", "process my emotions", "get things done", "just wanna talk ^_^"].map((o) => (
                      <OptionButton key={o} label={o} selected={data.motivation === o} onClick={() => set("motivation", o)} />
                    ))}
                  </div>
                </>
              )}

              {/* ── Step 9: Interstitial 2 ── */}
              {step === 9 && (
                <>
                  <h1 className="text-2xl font-bold tracking-tight leading-snug">
                    loomi remembers everything.
                  </h1>
                  <p className="text-gray-500 leading-relaxed text-base">
                    your private vault. everything is stored securely on your local
                    device, never on our servers.
                  </p>
                </>
              )}

              {/* ── Step 10: Faith ── */}
              {step === 10 && (
                <>
                  <h1 className="text-2xl font-bold tracking-tight">what is your faith or spiritual practice?</h1>
                  <div className="flex flex-col gap-2.5">
                    {["spiritual but not religious", "christianity", "hinduism", "islam", "sikhism", "buddhism", "atheist/agnostic", "other"].map((o) => (
                      <OptionButton key={o} label={o} selected={data.faith === o} onClick={() => set("faith", o)} />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {showFooter && (
        <ContinueFooter
          label={step === 0 ? "start" : "continue"}
          disabled={!canContinue()}
          onClick={next}
        />
      )}
    </div>
  );
}

