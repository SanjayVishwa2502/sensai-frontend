"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Award, Sparkles, X } from "lucide-react";

import BadgeCard, { BadgeCardData } from "@/components/engagement/BadgeCard";

export interface EarnedBadge {
  id: number;
  badge_type: string;
  badge_name: string;
  badge_icon: string;
  badge_tier: string;
  badge_description: string;
  earned_at: string;
}

const BADGE_CATALOG: Array<Omit<BadgeCardData, "earned" | "earned_at">> = [
  {
    badge_type: "streak_7",
    badge_name: "7-Day Blaze",
    badge_icon: "🔥",
    badge_tier: "silver",
    badge_description: "Maintain a 7-day ALM-verified streak.",
  },
  {
    badge_type: "challenge_10",
    badge_name: "Puzzle Master",
    badge_icon: "🧩",
    badge_tier: "gold",
    badge_description: "Solve 10 hard challenge problems.",
  },
  {
    badge_type: "scholar",
    badge_name: "Scholar",
    badge_icon: "📚",
    badge_tier: "silver",
    badge_description: "Complete all learning materials in a course.",
  },
  {
    badge_type: "speed_demon",
    badge_name: "Speed Demon",
    badge_icon: "⚡",
    badge_tier: "bronze",
    badge_description: "Complete 5 tasks in one focused session.",
  },
  {
    badge_type: "early_bird",
    badge_name: "Early Bird",
    badge_icon: "🌅",
    badge_tier: "bronze",
    badge_description: "Start 5 sessions before 8 AM.",
  },
  {
    badge_type: "sniper",
    badge_name: "Sniper",
    badge_icon: "🎯",
    badge_tier: "gold",
    badge_description: "Hit 100% accuracy on 5 quizzes in a row.",
  },
  {
    badge_type: "streak_30",
    badge_name: "Diamond Hands",
    badge_icon: "💎",
    badge_tier: "diamond",
    badge_description: "Maintain a 30-day ALM-verified streak.",
  },
];

function normalize(value: string | undefined): string {
  return String(value || "").trim().toLowerCase();
}

export default function BadgeGallery({ badges }: { badges: EarnedBadge[] }) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeCardData | null>(null);

  const galleryBadges = useMemo(() => {
    const earnedByType = new Map<string, EarnedBadge>();
    const earnedByName = new Map<string, EarnedBadge>();

    badges.forEach((badge) => {
      earnedByType.set(normalize(badge.badge_type), badge);
      earnedByName.set(normalize(badge.badge_name), badge);
    });

    const builtIn = BADGE_CATALOG.map((target) => {
      const match = earnedByType.get(normalize(target.badge_type))
        || earnedByName.get(normalize(target.badge_name));

      return {
        badge_type: target.badge_type,
        badge_name: match?.badge_name || target.badge_name,
        badge_description: match?.badge_description || target.badge_description,
        badge_icon: match?.badge_icon || target.badge_icon,
        badge_tier: match?.badge_tier || target.badge_tier,
        earned: Boolean(match),
        earned_at: match?.earned_at,
      } satisfies BadgeCardData;
    });

    const knownKeys = new Set(
      builtIn.map((badge) => `${normalize(badge.badge_type)}|${normalize(badge.badge_name)}`),
    );

    const extras = badges
      .filter((badge) => {
        const key = `${normalize(badge.badge_type)}|${normalize(badge.badge_name)}`;
        return !knownKeys.has(key);
      })
      .map((badge) => ({
        badge_type: badge.badge_type,
        badge_name: badge.badge_name,
        badge_description: badge.badge_description || "Milestone unlocked.",
        badge_icon: badge.badge_icon || "🏅",
        badge_tier: badge.badge_tier || "bronze",
        earned: true,
        earned_at: badge.earned_at,
      } satisfies BadgeCardData));

    return [...builtIn, ...extras];
  }, [badges]);

  const earnedCount = galleryBadges.filter((badge) => badge.earned).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-sm p-6"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Award size={16} className="text-yellow-400" />
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Badge Gallery</h3>
        </div>
        <span className="text-xs text-gray-500">{earnedCount} / {galleryBadges.length} unlocked</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {galleryBadges.map((badge) => (
          <BadgeCard
            key={`${badge.badge_type}-${badge.badge_name}`}
            badge={badge}
            onClick={setSelectedBadge}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-950 p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedBadge.badge_icon}</span>
                  <div>
                    <p className="text-lg font-semibold text-white">{selectedBadge.badge_name}</p>
                    <p className="text-xs text-gray-400 capitalize">{selectedBadge.badge_tier} tier</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBadge(null)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="mt-4 text-sm text-gray-300 leading-relaxed">
                {selectedBadge.badge_description}
              </p>

              {selectedBadge.earned ? (
                <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                  <div className="flex items-center gap-2 font-medium">
                    <Sparkles size={14} />
                    Badge unlocked
                  </div>
                  {selectedBadge.earned_at && (
                    <p className="mt-1 text-xs text-emerald-300/80">
                      Earned on {new Date(selectedBadge.earned_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-gray-700 bg-gray-900/70 px-3 py-2 text-sm text-gray-400">
                  Complete the milestone requirements to unlock this badge.
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
