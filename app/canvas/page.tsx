"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

const gridVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function MindCanvas() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [identityStakes, setIdentityStakes] = useState<string[]>([]);
  const [domainTags, setDomainTags] = useState<string[]>([]);
  const [actionableGoals, setActionableGoals] = useState<string[]>([]);
  const [completedGoals, setCompletedGoals] = useState<boolean[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("loomi_context");
      const parsed = raw ? JSON.parse(raw) : {};

      const stakes = Array.isArray(parsed.identityStakes) ? parsed.identityStakes : [];
      const tags = Array.isArray(parsed.domainTags) ? parsed.domainTags : [];
      const goals = Array.isArray(parsed.actionableGoals) ? parsed.actionableGoals : [];

      setName(typeof parsed.name === "string" ? parsed.name : "");
      setIdentityStakes(stakes.map((item: unknown) => String(item)));
      setDomainTags(tags.map((item: unknown) => String(item)));
      setActionableGoals(goals.map((item: unknown) => String(item)));
      setCompletedGoals(goals.map(() => false));
    } catch {
      setName("");
      setIdentityStakes([]);
      setDomainTags([]);
      setActionableGoals([]);
      setCompletedGoals([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const handleToggleGoal = (index: number) => {
    setCompletedGoals((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const handleBurnData = () => {
    localStorage.removeItem("loomi_context");
    router.push("/");
  };

  const displayName = (name || "your").toLowerCase();

  return (
    <div className="min-h-screen bg-white text-gray-900 px-6 py-12 md:py-24 max-w-5xl mx-auto tracking-tight">
      <div className="flex items-center justify-between gap-6">
        <Link
          href="/chat"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          back
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold">mapping {displayName}'s mind.</h1>
      </div>

      <motion.div
        className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={gridVariants}
        initial="hidden"
        animate={isLoaded ? "show" : "hidden"}
      >
        <motion.div
          className="bg-gray-50 border border-gray-100 rounded-3xl p-6"
          variants={cardVariants}
        >
          <h2 className="text-sm font-semibold text-gray-900 mb-4">the weights</h2>
          {identityStakes.length === 0 ? (
            <p className="text-gray-500 leading-relaxed">no heavy weights detected.</p>
          ) : (
            identityStakes.map((item, index) => (
              <p key={`${item}-${index}`} className="text-gray-500 leading-relaxed mb-4">
                {item.toLowerCase()}
              </p>
            ))
          )}
        </motion.div>

        <motion.div
          className="bg-gray-50 border border-gray-100 rounded-3xl p-6"
          variants={cardVariants}
        >
          <h2 className="text-sm font-semibold text-gray-900 mb-4">the arenas</h2>
          {domainTags.length === 0 ? (
            <p className="text-gray-500 leading-relaxed">no arenas tagged yet.</p>
          ) : (
            domainTags.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="inline-block px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium mr-2 mb-2 text-gray-700"
              >
                {tag.toLowerCase()}
              </span>
            ))
          )}
        </motion.div>

        <motion.div
          className="bg-yellow-50 border border-yellow-100 rounded-3xl p-6"
          variants={cardVariants}
        >
          <h2 className="text-sm font-semibold text-gray-900 mb-4">the next move</h2>
          {actionableGoals.length === 0 ? (
            <p className="text-gray-500 leading-relaxed">no next moves saved.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {actionableGoals.map((goal, index) => {
                const isDone = Boolean(completedGoals[index]);
                return (
                  <button
                    key={`${goal}-${index}`}
                    type="button"
                    onClick={() => handleToggleGoal(index)}
                    className="flex items-start gap-3 text-left"
                    aria-pressed={isDone}
                  >
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold mt-0.5 transition-colors ${
                        isDone
                          ? "bg-gray-900 border-gray-900 text-white"
                          : "border-gray-300 text-gray-300"
                      }`}
                    >
                      {isDone ? "x" : ""}
                    </span>
                    <span className={isDone ? "line-through text-gray-400" : "text-gray-700"}>
                      {goal.toLowerCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>

      <div className="mt-16 flex justify-center">
        <button
          type="button"
          onClick={handleBurnData}
          className="text-red-500 hover:text-red-600 text-sm font-medium px-6 py-3 rounded-full hover:bg-red-50 transition-colors"
        >
          burn my data
        </button>
      </div>
    </div>
  );
}
