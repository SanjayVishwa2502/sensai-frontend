"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";

export interface BadgeCardData {
  badge_type: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  badge_tier: string;
  earned: boolean;
  earned_at?: string;
}

interface BadgeCardProps {
  badge: BadgeCardData;
  onClick: (badge: BadgeCardData) => void;
}

const tierStyles: Record<string, string> = {
  bronze: "from-amber-800/70 to-amber-950/80 border-amber-600/30",
  silver: "from-slate-500/70 to-slate-800/80 border-slate-400/30",
  gold: "from-yellow-500/70 to-amber-700/80 border-yellow-400/40",
  diamond: "from-cyan-500/70 to-blue-700/80 border-cyan-400/40",
};

export default function BadgeCard({ badge, onClick }: BadgeCardProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;

    const rotateY = (px - 0.5) * 14;
    const rotateX = (0.5 - py) * 10;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const cardTier = tierStyles[badge.badge_tier] || tierStyles.bronze;

  return (
    <div className="[perspective:900px]">
      <motion.button
        type="button"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onClick(badge)}
        className={`relative w-full rounded-2xl border bg-gradient-to-br p-4 text-left transition-shadow ${
          badge.earned
            ? `${cardTier} shadow-lg shadow-black/20`
            : "from-gray-900/80 to-gray-950/90 border-gray-700/60"
        }`}
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        {!badge.earned && (
          <div className="absolute inset-0 rounded-2xl bg-black/45 backdrop-blur-[1px]" />
        )}

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <span className={`text-3xl ${badge.earned ? "" : "grayscale opacity-60"}`}>
              {badge.badge_icon}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              badge.earned
                ? "bg-black/30 text-white"
                : "bg-gray-800/70 text-gray-300"
            }`}>
              {badge.earned ? badge.badge_tier : "Locked"}
            </span>
          </div>

          <p className={`mt-3 text-sm font-semibold ${badge.earned ? "text-white" : "text-gray-300"}`}>
            {badge.badge_name}
          </p>
          <p className={`mt-1 text-xs leading-relaxed ${badge.earned ? "text-white/75" : "text-gray-500"}`}>
            {badge.badge_description}
          </p>

          {!badge.earned && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-400">
              <Lock size={12} />
              Unlock by completing this milestone
            </div>
          )}
        </div>
      </motion.button>
    </div>
  );
}
