"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { Smile, Dumbbell, Zap, Lock } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

const hidden = { opacity: 0, y: 24 };
const visible = { opacity: 1, y: 0 };
const ease = [0.22, 1, 0.36, 1] as const;

const features = [
  {
    icon: Smile,
    label: "the vibe check",
    title: "it reads your mood.",
    description:
      "sometimes you need a therapist to listen, sometimes you need a coach to push you. loomi does both.",
  },
  {
    icon: Dumbbell,
    label: "no more shower comebacks",
    title: "anxiety about a situation or conversation?",
    description: "roleplay it here first before you text them back.",
  },
  {
    icon: Zap,
    label: "zero overwhelm",
    title: "get a lil better every day :)",
    description:
      "loomi suggests micro-tasks based on how you're feeling and helps you grow.",
  },
  {
    icon: Lock,
    label: "your private vault",
    title: "100% private.",
    description:
      "your chats are saved locally on your device, never on our servers.",
  },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className={`${inter.className} min-h-screen bg-white text-gray-900 tracking-tight`}>
      {/* NAV */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 py-5 bg-white/80 backdrop-blur-md">
        <span className="text-xl font-bold select-none">loomi</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/chat")}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-full transition-colors"
          >
            log in
          </button>
          <button
            onClick={() => router.push("/onboarding")}
            className="px-5 py-2 bg-yellow-300 hover:bg-[#FDE047] text-gray-900 font-semibold rounded-full transition-colors"
          >
            sign up
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="flex flex-col items-center justify-center min-h-screen px-6 text-center pt-20">
        <motion.h1
          initial={hidden}
          animate={visible}
          transition={{ duration: 0.7, ease, delay: 0 }}
          className="text-5xl sm:text-6xl font-bold leading-tight max-w-2xl text-gray-900"
        >
          head full? meet loomi.
        </motion.h1>

        <motion.p
          initial={hidden}
          animate={visible}
          transition={{ duration: 0.7, ease, delay: 0.15 }}
          className="mt-6 text-lg text-gray-500 max-w-md leading-relaxed"
        >
          vent when you need a friend. get pushed when you need a coach. your
          private ai space to untangle your mind.
        </motion.p>

        <motion.div
          initial={hidden}
          animate={visible}
          transition={{ duration: 0.7, ease, delay: 0.3 }}
          className="mt-8 flex justify-center"
        >
          <button
            onClick={() => router.push("/onboarding")}
            className="px-7 py-3.5 bg-yellow-300 hover:bg-[#FDE047] text-gray-900 font-semibold rounded-full transition-colors"
          >
            start yapping — it's free
          </button>
        </motion.div>

        <motion.p
          initial={hidden}
          animate={visible}
          transition={{ duration: 0.7, ease, delay: 0.45 }}
          className="mt-6 text-sm text-gray-400"
        >
          loved by overthinkers ;)
        </motion.p>
      </section>

      {/* FEATURES */}
      <section className="px-6 pb-32">
        <motion.h2
          initial={hidden}
          whileInView={visible}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, ease }}
          className="text-3xl font-bold text-center mb-12 text-gray-900"
        >
          all the good stuff
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {features.map(({ icon: Icon, label, title, description }, i) => (
            <motion.div
              key={label}
              initial={hidden}
              whileInView={visible}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease, delay: i * 0.1 }}
              className="bg-gray-50 rounded-3xl p-8 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-yellow-300 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-gray-900" />
                </div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  {label}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">{description}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}