"use client";

import { motion } from "framer-motion";
import { Sparkles, Trophy, X } from "lucide-react";

export interface CelebrationPayload {
  kind: "quest" | "streak" | "level" | "badge";
  title: string;
  message: string;
  emoji: string;
  xpAwarded?: number;
  highlight?: string;
}

interface CelebrationModalProps {
  celebration: CelebrationPayload | null;
  onClose: () => void;
}

const kindStyles: Record<CelebrationPayload["kind"], string> = {
  quest: "from-blue-600/20 via-indigo-500/20 to-purple-500/20 border-blue-400/30",
  streak: "from-orange-600/25 via-amber-500/20 to-yellow-400/20 border-orange-400/30",
  level: "from-purple-600/25 via-fuchsia-500/20 to-cyan-400/20 border-purple-400/30",
  badge: "from-emerald-600/20 via-teal-500/20 to-cyan-400/20 border-emerald-400/30",
};

export default function CelebrationModal({
  celebration,
  onClose,
}: CelebrationModalProps) {
  if (!celebration) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 22 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 14 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        onClick={(event) => event.stopPropagation()}
        className={`w-full max-w-lg rounded-3xl border bg-gradient-to-br ${kindStyles[celebration.kind]} backdrop-blur-md p-7 shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/90">
            <Sparkles size={12} />
            Celebration
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
            aria-label="Close celebration"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-6 text-center">
          <motion.div
            initial={{ scale: 0.6, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 14 }}
            className="text-6xl"
          >
            {celebration.emoji}
          </motion.div>

          <h3 className="mt-4 text-2xl font-bold text-white">{celebration.title}</h3>
          <p className="mt-2 text-sm text-white/80 leading-relaxed">{celebration.message}</p>

          {typeof celebration.xpAwarded === "number" && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/15 px-4 py-2 text-sm font-semibold text-yellow-200">
              <Trophy size={14} />
              +{celebration.xpAwarded} XP
            </div>
          )}

          {celebration.highlight && (
            <p className="mt-3 text-xs text-white/70">{celebration.highlight}</p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-white text-black font-semibold py-2.5 hover:bg-gray-200 transition-colors"
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}
