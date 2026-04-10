"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Zap,
  Target,
  TrendingUp,
  Shield,
  Trophy,
  AlertTriangle,
  Users,
  Activity,
  ChevronRight,
  RefreshCw,
  Eye,
  BarChart3,
  SlidersHorizontal,
} from "lucide-react";
import BadgeGallery, {
  EarnedBadge,
} from "@/components/engagement/BadgeGallery";
import InterventionTimeline, {
  InterventionTimelineEvent,
} from "@/components/engagement/InterventionTimeline";
import CelebrationModal, {
  CelebrationPayload,
} from "@/components/engagement/CelebrationModal";
import InsightCard, {
  EngagementInsightItem,
} from "@/components/engagement/InsightCard";
import RiskForecastPanel, {
  RiskForecastData,
} from "@/components/engagement/RiskForecastPanel";
import SuccessSound from "@/components/SuccessSound";
import ModuleCompletionSound from "@/components/ModuleCompletionSound";

// ============ Types ============

export type EngagementRole = "admin" | "learner";

interface StreakData {
  streak_count: number;
  tier: string;
  alm_today_seconds: number;
  alm_target_seconds: number;
  active_days: string[];
  weekend_grace_used: boolean;
  weekend_grace_days_used?: number;
  base_tier?: string;
  tier_gate_passed?: boolean;
  consistency_score?: number;
  challenge_attempted_recently?: boolean;
  tasks_attempted_today?: number;
  qualifies_today?: boolean;
}

interface XPData {
  total_xp: number;
  level: number;
  current_level_xp: number;
  xp_to_next_level: number;
  recent_gains: Array<{
    xp_amount: number;
    source_type: string;
    source_id?: number;
    created_at?: string;
    multiplier_applied: number;
  }>;
}

interface Quest {
  id: number;
  quest_type: string;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  xp_reward: number;
  status: string;
}

interface HealthScore {
  consistency_score: number;
  depth_score: number;
  breadth_score: number;
  challenge_score: number;
  growth_score: number;
  composite_score: number;
  cluster: string;
}

interface ClusterData {
  clusters: {
    thriving: Array<{ user_id: number; name: string; composite_score: number }>;
    coasting: Array<{ user_id: number; name: string; composite_score: number }>;
    declining: Array<{ user_id: number; name: string; composite_score: number }>;
    at_risk: Array<{ user_id: number; name: string; composite_score: number }>;
  };
}

interface CohortHealthDist {
  distribution: { thriving: number; coasting: number; declining: number; at_risk: number };
}

interface AtRiskData {
  learners: Array<{ user_id: number; name: string; composite_score: number; risk_level: string }>;
}

interface InsightsData {
  cohort_id: number;
  generated_at: string;
  source: "llm" | "heuristic";
  insights: EngagementInsightItem[];
}

type InsightSeverityFilter = "all" | EngagementInsightItem["severity"];

interface LeaderboardEntry {
  user_id: number;
  rank: number;
  name: string;
  value: number;
  dimension: string;
}

interface Nudge {
  id: number;
  title: string;
  content: string;
  nudge_type: string;
  status: string;
}

interface HeatmapData {
  rows: Array<{
    user_id: number;
    name: string;
    days?: Record<string, number>;
    cells?: Array<{
      date: string;
      alm_seconds?: number;
      total_alm_seconds?: number;
      intensity?: number;
      tasks_completed?: number;
    }>;
  }>;
  date_range?: {
    start: string;
    end: string;
  };
  date_labels?: string[];
}

interface TimelineResponse {
  user_id: number;
  cohort_id: number;
  events: InterventionTimelineEvent[];
}

// ============ API helpers ============

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

// =============================================
//            LEARNER-ONLY COMPONENTS
// =============================================

function StreakCard({ data }: { data: StreakData }) {
  const tierConfig: Record<string, { color: string; glow: string; label: string; emoji: string }> = {
    warm: { color: "from-orange-400 to-amber-500", glow: "shadow-orange-500/20", label: "Warm", emoji: "🔥" },
    hot: { color: "from-red-500 to-orange-500", glow: "shadow-red-500/30", label: "Hot", emoji: "🔥🔥" },
    blazing: { color: "from-red-600 to-pink-500", glow: "shadow-red-600/40", label: "Blazing", emoji: "🔥🔥🔥" },
    diamond: { color: "from-cyan-400 to-blue-500", glow: "shadow-cyan-500/40", label: "Diamond", emoji: "💎" },
  };
  const tier = tierConfig[data.tier] || tierConfig.warm;
  const almProgress = Math.min(data.alm_today_seconds / data.alm_target_seconds, 1);
  const tasksAttemptedToday = data.tasks_attempted_today ?? 0;
  const consistencyPercent = Math.round((data.consistency_score ?? 0) * 100);
  const challengeAttemptedRecently = Boolean(data.challenge_attempted_recently);
  const qualifiesToday =
    data.qualifies_today ??
    (data.alm_today_seconds >= data.alm_target_seconds && tasksAttemptedToday > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${tier.color} ${tier.glow} shadow-lg p-6`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-white/70 text-xs uppercase tracking-wider font-medium">Learning Streak</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-bold text-white">{data.streak_count}</span>
            <span className="text-white/80 text-lg">days</span>
          </div>
        </div>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-3xl"
        >
          {tier.emoji}
        </motion.div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-white/70 mb-1">
          <span>Today&apos;s ALM</span>
          <span>{Math.floor(data.alm_today_seconds / 60)}m / {Math.floor(data.alm_target_seconds / 60)}m</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${almProgress * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-2 rounded-full bg-white/90"
          />
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex justify-between text-xs text-white/70">
          <span>Task attempts today</span>
          <span>{tasksAttemptedToday}</span>
        </div>
        <div className="flex justify-between text-xs text-white/70">
          <span>Consistency (14d)</span>
          <span>{consistencyPercent}%</span>
        </div>
        <div className="flex justify-between text-xs text-white/70">
          <span>Challenge activity (7d)</span>
          <span>{challengeAttemptedRecently ? "Yes" : "No"}</span>
        </div>
      </div>

      <div className="mt-2 text-[11px] text-white/70">
        {qualifiesToday
          ? "Today meets streak criteria."
          : "Need 15+ ALM and at least 1 task attempt today."}
      </div>

      {data.weekend_grace_used && (
        <div className="mt-1 text-[11px] text-white/60">
          Weekend grace used ({data.weekend_grace_days_used ?? 1} weekend day)
        </div>
      )}

      <div className="mt-3 flex items-center gap-1.5">
        <Shield size={12} className="text-white/60" />
        <span className="text-xs text-white/60">
          {tier.label} Tier • ALM + task-attempt verified
        </span>
      </div>
    </motion.div>
  );
}

function XPCard({ data }: { data: XPData }) {
  const totalXP = Number(data.total_xp ?? 0);
  const level = Number(data.level ?? 1);
  const currentLevelXP = Number(data.current_level_xp ?? 0);
  const xpToNextLevel = Number(data.xp_to_next_level ?? 0);
  const progress = xpToNextLevel > 0
    ? Math.min(currentLevelXP / xpToNextLevel, 1) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/50 to-indigo-950/50 backdrop-blur-sm p-6"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-purple-300/70 text-xs uppercase tracking-wider font-medium">Experience</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold text-purple-200">{totalXP.toLocaleString()}</span>
            <span className="text-purple-300/60 text-sm">XP</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-purple-500/20 px-3 py-1.5 rounded-full">
          <Zap size={14} className="text-purple-400" />
          <span className="text-sm font-bold text-purple-300">Lv {level}</span>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-purple-300/50 mb-1">
          <span>Level Progress</span>
          <span>{currentLevelXP} / {xpToNextLevel}</span>
        </div>
        <div className="w-full bg-purple-900/40 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
          />
        </div>
      </div>
    </motion.div>
  );
}

function QuestPanel({ quests }: { quests: Quest[] }) {
  if (quests.length === 0) return null;

  const questIcons: Record<string, string> = {
    challenge_seeker: "🎯",
    deep_diver: "🌊",
    comeback_king: "👑",
    versatile_learner: "🎨",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 to-slate-950/40 backdrop-blur-sm p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Target size={16} className="text-blue-400" />
        <h3 className="text-sm font-medium text-blue-300 uppercase tracking-wider">Active Quests</h3>
      </div>
      <div className="space-y-3">
        {quests.map((quest) => {
          const progress = quest.target_value > 0
            ? Math.min(quest.current_value / quest.target_value, 1) : 0;
          return (
            <div key={quest.id} className="bg-blue-900/20 rounded-xl p-4 border border-blue-800/30">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{questIcons[quest.quest_type] || "⚡"}</span>
                  <div>
                    <p className="text-sm font-medium text-blue-100">{quest.title}</p>
                    <p className="text-xs text-blue-300/50 mt-0.5">{quest.description}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">
                  +{quest.xp_reward} XP
                </span>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-blue-300/40 mb-1">
                  <span>{quest.current_value} / {quest.target_value}</span>
                  <span>{Math.round(progress * 100)}%</span>
                </div>
                <div className="w-full bg-blue-900/40 rounded-full h-1.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 1 }}
                    className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function HealthGauge({ data }: { data: HealthScore }) {
  const score = Math.round(Number(data.composite_score ?? 0));
  const cluster = typeof data.cluster === "string" ? data.cluster : "coasting";
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = score / 100;
  const strokeDashoffset = circumference * (1 - progress);

  const getColor = (s: number) => {
    if (s >= 70) return "#22C55E";
    if (s >= 40) return "#F59E0B";
    if (s >= 20) return "#F97316";
    return "#EF4444";
  };

  const clusterColors: Record<string, string> = {
    thriving: "text-green-400",
    coasting: "text-amber-400",
    declining: "text-orange-400",
    at_risk: "text-red-400",
  };

  const subScores = [
    { label: "Consistency", value: Number(data.consistency_score ?? 0) },
    { label: "Depth", value: Number(data.depth_score ?? 0) },
    { label: "Breadth", value: Number(data.breadth_score ?? 0) },
    { label: "Challenge", value: Number(data.challenge_score ?? 0) },
    { label: "Growth", value: Number(data.growth_score ?? 0) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-sm p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-gray-400" />
        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Engagement Health</h3>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative" style={{ width: 140, height: 140 }}>
          <svg width="140" height="140" className="-rotate-90">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#1f2937" strokeWidth="8" />
            <motion.circle
              cx="70" cy="70" r={radius} fill="none"
              stroke={getColor(score)}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white">{score}</span>
            <span className={`text-xs font-medium capitalize ${clusterColors[cluster] || "text-gray-400"}`}>
              {cluster.replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {subScores.map((sub) => (
            <div key={sub.label} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-20 truncate">{sub.label}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(sub.value, 0) * 100}%` }}
                  transition={{ duration: 1 }}
                  className="h-1.5 rounded-full"
                  style={{ backgroundColor: getColor(sub.value * 100) }}
                />
              </div>
              <span className="text-xs text-gray-500 w-8 text-right">{Math.round(sub.value * 100)}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function NudgeBanner({ nudges }: { nudges: Nudge[] | Nudge | null | undefined }) {
  const [visible, setVisible] = useState(true);
  const normalizedNudges = Array.isArray(nudges)
    ? nudges
    : nudges && typeof nudges === "object"
      ? [nudges]
      : [];

  const nudge = normalizedNudges.find((item) => item && (item.title || item.content));
  if (!visible || !nudge) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 p-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle size={18} className="text-blue-400" />
        <div>
          <p className="text-sm font-medium text-blue-200">{nudge.title || "Smart Nudge"}</p>
          <p className="text-xs text-blue-300/60">{nudge.content || "Keep your momentum going."}</p>
        </div>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
      >
        View <ChevronRight size={12} />
      </button>
    </motion.div>
  );
}

// =============================================
//            ADMIN-ONLY COMPONENTS
// =============================================

function CohortHealthOverview({ dist }: { dist: CohortHealthDist }) {
  const total = Object.values(dist.distribution).reduce((a, b) => a + b, 0);
  const segments = [
    { key: "thriving", label: "Thriving", count: dist.distribution.thriving, color: "bg-green-500", textColor: "text-green-400" },
    { key: "coasting", label: "Coasting", count: dist.distribution.coasting, color: "bg-amber-500", textColor: "text-amber-400" },
    { key: "declining", label: "Declining", count: dist.distribution.declining, color: "bg-orange-500", textColor: "text-orange-400" },
    { key: "at_risk", label: "At Risk", count: dist.distribution.at_risk, color: "bg-red-500", textColor: "text-red-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-sm p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={16} className="text-blue-400" />
        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Cohort Health Overview</h3>
      </div>

      {/* Stacked bar */}
      <div className="w-full h-4 rounded-full overflow-hidden flex bg-gray-800 mb-4">
        {segments.map((seg) => (
          <motion.div
            key={seg.key}
            initial={{ width: 0 }}
            animate={{ width: total > 0 ? `${(seg.count / total) * 100}%` : "0%" }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full ${seg.color}`}
            title={`${seg.label}: ${seg.count}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {segments.map((seg) => (
          <div key={seg.key} className="text-center">
            <span className={`text-2xl font-bold ${seg.textColor}`}>{seg.count}</span>
            <p className="text-xs text-gray-500 mt-0.5">{seg.label}</p>
            <p className="text-xs text-gray-600">
              {total > 0 ? Math.round((seg.count / total) * 100) : 0}%
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ClusterCards({ data }: { data: ClusterData }) {
  const configs = [
    { key: "thriving" as const, label: "Thriving", color: "from-green-500/20 to-green-600/5 border-green-500/30", text: "text-green-400", icon: "🟢" },
    { key: "coasting" as const, label: "Coasting", color: "from-amber-500/20 to-amber-600/5 border-amber-500/30", text: "text-amber-400", icon: "🟡" },
    { key: "declining" as const, label: "Declining", color: "from-orange-500/20 to-orange-600/5 border-orange-500/30", text: "text-orange-400", icon: "🟠" },
    { key: "at_risk" as const, label: "At Risk", color: "from-red-500/20 to-red-600/5 border-red-500/30", text: "text-red-400", icon: "🔴" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-sm p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Users size={16} className="text-gray-400" />
        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Behavioral Clusters</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {configs.map(({ key, label, color, text, icon }) => {
          const users = data.clusters[key] || [];
          return (
            <motion.div
              key={key}
              whileHover={{ scale: 1.02 }}
              className={`rounded-xl bg-gradient-to-br ${color} border p-4 cursor-pointer transition-all`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span>{icon}</span>
                <span className={`text-sm font-medium ${text}`}>{label}</span>
              </div>
              <span className={`text-2xl font-bold ${text}`}>{users.length}</span>
              <p className="text-xs text-gray-500 mt-1">learners</p>
              {users.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {users.slice(0, 3).map((u) => (
                    <p key={u.user_id} className="text-xs text-gray-400 truncate">
                      {u.name || `User ${u.user_id}`} — {u.composite_score}
                    </p>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function AtRiskPanel({ data }: { data: AtRiskData }) {
  if (data.learners.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-950/20 to-gray-950/40 backdrop-blur-sm p-6"
      >
        <div className="flex items-center gap-2 mb-2">
          <Shield size={16} className="text-green-400" />
          <h3 className="text-sm font-medium text-green-300 uppercase tracking-wider">At-Risk Learners</h3>
        </div>
        <p className="text-green-300/60 text-sm">No at-risk learners detected. Your cohort is healthy!</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/20 to-gray-950/40 backdrop-blur-sm p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={16} className="text-red-400" />
        <h3 className="text-sm font-medium text-red-300 uppercase tracking-wider">
          At-Risk Learners ({data.learners.length})
        </h3>
      </div>
      <div className="space-y-2">
        {data.learners.map((learner) => (
          <div
            key={learner.user_id}
            className="flex items-center justify-between bg-red-900/10 border border-red-800/20 rounded-lg px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${learner.risk_level === "high" ? "bg-red-500 animate-pulse" : "bg-orange-500"}`} />
              <span className="text-sm text-gray-300">{learner.name || `Learner ${learner.user_id}`}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-red-400/70">Score: {learner.composite_score}</span>
              <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${
                learner.risk_level === "high"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-orange-500/20 text-orange-400"
              }`}>
                {learner.risk_level}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function CohortHeatmap({ data }: { data: HeatmapData }) {
  if (!data.rows || data.rows.length === 0) return null;

  const dates: string[] = (() => {
    if (Array.isArray(data.date_labels) && data.date_labels.length > 0) {
      return data.date_labels;
    }

    if (data.date_range?.start && data.date_range?.end) {
      const generated: string[] = [];
      const start = new Date(data.date_range.start);
      const end = new Date(data.date_range.end);

      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          generated.push(d.toISOString().split("T")[0]);
        }
      }

      if (generated.length > 0) {
        return generated;
      }
    }

    const inferredDates = new Set<string>();
    for (const row of data.rows) {
      if (row.days && typeof row.days === "object") {
        Object.keys(row.days).forEach((day) => inferredDates.add(day));
      }
      if (Array.isArray(row.cells)) {
        row.cells.forEach((cell) => {
          if (cell?.date) inferredDates.add(cell.date);
        });
      }
    }

    return Array.from(inferredDates).sort();
  })();

  if (dates.length === 0) {
    return null;
  }

  const getIntensity = (seconds: number) => {
    if (seconds <= 0) return "bg-gray-800";
    if (seconds < 300) return "bg-green-900/60";
    if (seconds < 900) return "bg-green-700/60";
    if (seconds < 1800) return "bg-green-500/70";
    return "bg-green-400/80";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-sm p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-green-400" />
        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Cohort Activity Heatmap</h3>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          <div className="flex gap-1 mb-1 ml-24">
            {dates.map((d) => (
              <div key={d} className="w-6 text-center">
                <span className="text-[9px] text-gray-600">{new Date(d).getDate()}</span>
              </div>
            ))}
          </div>

          {data.rows.map((row) => (
            <div key={row.user_id} className="flex items-center gap-1 mb-1">
              <span className="text-xs text-gray-500 w-24 truncate pr-2 text-right">
                {row.name || `User ${row.user_id}`}
              </span>
              {(() => {
                const rowDays: Record<string, number> = row.days && typeof row.days === "object"
                  ? row.days
                  : (Array.isArray(row.cells)
                    ? row.cells.reduce<Record<string, number>>((acc, cell) => {
                        if (!cell?.date) return acc;
                        const seconds = Number(cell.alm_seconds ?? cell.total_alm_seconds ?? 0);
                        acc[cell.date] = Number.isFinite(seconds) ? seconds : 0;
                        return acc;
                      }, {})
                    : {});

                return dates.map((d) => {
                  const seconds = rowDays[d] || 0;
                  return (
                    <div
                      key={d}
                      title={`${row.name || `User ${row.user_id}`}: ${Math.round(seconds / 60)}m on ${d}`}
                      className={`w-6 h-6 rounded-sm ${getIntensity(seconds)} transition-colors hover:ring-1 hover:ring-white/30 cursor-pointer`}
                    />
                  );
                });
              })()}
            </div>
          ))}

          <div className="flex items-center gap-2 mt-3 ml-24">
            <span className="text-xs text-gray-600">Less</span>
            <div className="w-4 h-4 rounded-sm bg-gray-800" />
            <div className="w-4 h-4 rounded-sm bg-green-900/60" />
            <div className="w-4 h-4 rounded-sm bg-green-700/60" />
            <div className="w-4 h-4 rounded-sm bg-green-500/70" />
            <div className="w-4 h-4 rounded-sm bg-green-400/80" />
            <span className="text-xs text-gray-600">More</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================
//            SHARED COMPONENTS
// =============================================

function SmartLeaderboard({ entries, cohortId }: { entries: LeaderboardEntry[]; cohortId: string }) {
  const [dimension, setDimension] = useState<string>("xp");
  const [localEntries, setLocalEntries] = useState(entries);
  const [loading, setLoading] = useState(false);

  const dimensions = [
    { key: "xp", label: "XP", icon: Zap },
    { key: "consistency", label: "Consistency", icon: Activity },
    { key: "challenge", label: "Challenge", icon: Target },
    { key: "most_improved", label: "Improved", icon: TrendingUp },
  ];

  const switchDimension = useCallback(async (dim: string) => {
    setDimension(dim);
    setLoading(true);
    try {
      const data = await fetchJSON<LeaderboardEntry[]>(`/engagement/leaderboard/${cohortId}?dimension=${dim}`);
      setLocalEntries(data);
    } catch { /* keep current */ }
    setLoading(false);
  }, [cohortId]);

  useEffect(() => { setLocalEntries(entries); }, [entries]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-sm p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={16} className="text-yellow-400" />
        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Smart Leaderboard</h3>
      </div>

      <div className="flex gap-1 mb-4 bg-gray-800/50 rounded-lg p-1">
        {dimensions.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => switchDimension(key)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs transition-all ${
              dimension === key
                ? "bg-gray-700 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <RefreshCw size={20} className="animate-spin text-gray-500" />
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {localEntries.map((entry) => (
              <motion.div
                key={`${entry.user_id}-${entry.dimension}`}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 bg-gray-800/30 rounded-lg px-4 py-2.5"
              >
                <span className={`text-sm font-bold w-6 ${
                  entry.rank === 1 ? "text-yellow-400" : entry.rank === 2 ? "text-gray-300" : entry.rank === 3 ? "text-orange-400" : "text-gray-500"
                }`}>
                  #{entry.rank}
                </span>
                <span className="flex-1 text-sm text-gray-300 truncate">
                  {entry.name || `Learner ${entry.user_id}`}
                </span>
                <span className="text-sm font-bold text-white">
                  {dimension === "xp" ? `${entry.value.toLocaleString()} XP` : `${Math.round(entry.value)}%`}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// =============================================
//            MAIN DASHBOARD
// =============================================

interface EngagementDashboardProps {
  userId: string | number;
  cohortId: string | number;
  /** Role determines which panels are shown. Set by auth — immutable once rendered. */
  role: EngagementRole;
  /** Optional rendering mode for narrow sidebars. */
  layout?: "default" | "sidebar";
}

export default function EngagementDashboard({
  userId,
  cohortId,
  role,
  layout = "default",
}: EngagementDashboardProps) {
  // ---- Learner data ----
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [xp, setXP] = useState<XPData | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [health, setHealth] = useState<HealthScore | null>(null);
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [nudges, setNudges] = useState<Nudge[]>([]);

  // ---- Admin data ----
  const [cohortHealth, setCohortHealth] = useState<CohortHealthDist | null>(null);
  const [clusters, setClusters] = useState<ClusterData | null>(null);
  const [atRisk, setAtRisk] = useState<AtRiskData | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
  const [forecast, setForecast] = useState<RiskForecastData | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [timeline, setTimeline] = useState<TimelineResponse | null>(null);
  const [selectedTimelineUserId, setSelectedTimelineUserId] = useState<number | null>(null);
  const [forecastHorizonDays, setForecastHorizonDays] = useState<number>(7);
  const [insightSeverityFilter, setInsightSeverityFilter] = useState<InsightSeverityFilter>("all");
  const [insightCardLimit, setInsightCardLimit] = useState<number>(3);
  const [adminAiLoading, setAdminAiLoading] = useState(false);

  // ---- Shared ----
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- Celebration engine ----
  const [celebration, setCelebration] = useState<CelebrationPayload | null>(null);
  const [playSuccessSound, setPlaySuccessSound] = useState(false);
  const [playModuleCompletionSound, setPlayModuleCompletionSound] = useState(false);

  const hasCelebrationBaseline = useRef(false);
  const previousTierRef = useRef<string | null>(null);
  const previousLevelRef = useRef<number | null>(null);
  const previousBadgeSignatureRef = useRef<string>("");
  const previousQuestGainSignatureRef = useRef<string>("");
  const previousTaskGainSignatureRef = useRef<string>("");
  const seenNudgeIdsRef = useRef<Set<number>>(new Set());

  const triggerSuccessSound = useCallback(() => {
    setPlaySuccessSound(true);
    setTimeout(() => setPlaySuccessSound(false), 350);
  }, []);

  const triggerModuleVictorySound = useCallback(() => {
    setPlayModuleCompletionSound(true);
    setTimeout(() => setPlayModuleCompletionSound(false), 1800);
  }, []);

  const triggerCelebrationConfetti = useCallback((mode: "light" | "full") => {
    if (mode === "light") {
      confetti({
        particleCount: 55,
        spread: 45,
        startVelocity: 35,
        origin: { y: 0.7 },
      });
      return;
    }

    confetti({
      particleCount: 150,
      spread: 80,
      startVelocity: 50,
      origin: { y: 0.65 },
    });
    confetti({
      particleCount: 70,
      spread: 100,
      startVelocity: 35,
      angle: 60,
      origin: { x: 0.1, y: 0.75 },
    });
    confetti({
      particleCount: 70,
      spread: 100,
      startVelocity: 35,
      angle: 120,
      origin: { x: 0.9, y: 0.75 },
    });
  }, []);

  const timelineCandidates = useMemo(() => {
    const candidates = new Map<number, string>();

    for (const learner of atRisk?.learners ?? []) {
      if (learner?.user_id) {
        candidates.set(Number(learner.user_id), learner.name || `Learner ${learner.user_id}`);
      }
    }

    if (clusters?.clusters) {
      Object.values(clusters.clusters).forEach((clusterUsers) => {
        (clusterUsers || []).forEach((user) => {
          if (user?.user_id) {
            candidates.set(Number(user.user_id), user.name || `Learner ${user.user_id}`);
          }
        });
      });
    }

    const fallbackUserId = Number(userId);
    if (candidates.size === 0 && Number.isFinite(fallbackUserId) && fallbackUserId > 0) {
      candidates.set(fallbackUserId, `User ${fallbackUserId}`);
    }

    return Array.from(candidates.entries()).map(([id, name]) => ({ user_id: id, name }));
  }, [atRisk, clusters, userId]);

  const selectedTimelineLearner = timelineCandidates.find(
    (candidate) => candidate.user_id === selectedTimelineUserId,
  );

  const insightCounts = useMemo(() => {
    const items = insights?.insights ?? [];

    return {
      all: items.length,
      info: items.filter((item) => item.severity === "info").length,
      warning: items.filter((item) => item.severity === "warning").length,
      critical: items.filter((item) => item.severity === "critical").length,
    };
  }, [insights]);

  const visibleInsights = useMemo(() => {
    const items = insights?.insights ?? [];
    const filtered = insightSeverityFilter === "all"
      ? items
      : items.filter((item) => item.severity === insightSeverityFilter);

    return filtered.slice(0, insightCardLimit);
  }, [insights, insightSeverityFilter, insightCardLimit]);

  const loadAdminIntelligence = useCallback(async () => {
    if (role !== "admin" || !cohortId) {
      return;
    }

    setAdminAiLoading(true);

    const [forecastResult, insightsResult] = await Promise.allSettled([
      fetchJSON<RiskForecastData>(`/engagement/cohort/${cohortId}/forecast?horizon_days=${forecastHorizonDays}`),
      fetchJSON<InsightsData>(`/engagement/cohort/${cohortId}/insights`),
    ]);

    if (forecastResult.status === "fulfilled") {
      const data = forecastResult.value;
      setForecast(data && typeof data === "object" ? data : null);
    }

    if (insightsResult.status === "fulfilled") {
      const data = insightsResult.value;
      setInsights(data && typeof data === "object" ? data : null);
    }

    setAdminAiLoading(false);
  }, [cohortId, forecastHorizonDays, role]);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const promises: Promise<unknown>[] = [];

        if (role === "learner") {
          // Learner-specific data
          promises.push(
            fetchJSON<StreakData>(`/engagement/streaks/${userId}?cohort_id=${cohortId}`)
              .then((data) => setStreak(data && typeof data === "object" ? data : null))
              .catch(() => {}),
            fetchJSON<XPData>(`/engagement/xp/${userId}?cohort_id=${cohortId}`)
              .then((data) => setXP(data && typeof data === "object" ? data : null))
              .catch(() => {}),
            fetchJSON<Quest[]>(`/engagement/quests/${userId}?cohort_id=${cohortId}`)
              .then((data) => setQuests(Array.isArray(data) ? data : []))
              .catch(() => {}),
            fetchJSON<HealthScore>(`/engagement/health/${userId}?cohort_id=${cohortId}`)
              .then((data) => setHealth(data && typeof data === "object" ? data : null))
              .catch(() => {}),
            fetchJSON<EarnedBadge[]>(`/engagement/badges/${userId}`)
              .then((data) => setBadges(Array.isArray(data) ? data : []))
              .catch(() => {}),
            fetchJSON<Nudge[] | Nudge>(`/engagement/nudges/${userId}`)
              .then((data) => {
                if (Array.isArray(data)) {
                  setNudges(data);
                  return;
                }
                if (data && typeof data === "object") {
                  setNudges([data]);
                  return;
                }
                setNudges([]);
              })
              .catch(() => {}),
          );
        } else {
          // Admin-specific data
          promises.push(
            fetchJSON<CohortHealthDist>(`/engagement/cohort/${cohortId}/health`)
              .then((data) => setCohortHealth(data && typeof data === "object" ? data : null))
              .catch(() => {}),
            fetchJSON<ClusterData>(`/engagement/cohort/${cohortId}/clusters`)
              .then((data) => setClusters(data && typeof data === "object" ? data : null))
              .catch(() => {}),
            fetchJSON<AtRiskData>(`/engagement/cohort/${cohortId}/at-risk`)
              .then((data) => setAtRisk(data && typeof data === "object" ? data : null))
              .catch(() => {}),
            fetchJSON<HeatmapData>(`/engagement/cohort/${cohortId}/heatmap?days=14`)
              .then((data) => setHeatmap(data && typeof data === "object" ? data : null))
              .catch(() => {}),
          );
        }

        // Shared: leaderboard
        promises.push(
          fetchJSON<LeaderboardEntry[]>(`/engagement/leaderboard/${cohortId}?dimension=xp`)
            .then((data) => setLeaderboard(Array.isArray(data) ? data : []))
            .catch(() => {}),
        );

        await Promise.all(promises);
      } catch (err) {
        console.error("Failed to load engagement data:", err);
      }
      setLoading(false);
    }

    if (userId && cohortId) {
      loadAll();
    }
  }, [userId, cohortId, role]);

  useEffect(() => {
    if (role !== "admin" || !cohortId) {
      return;
    }

    void loadAdminIntelligence();
  }, [role, cohortId, loadAdminIntelligence]);

  useEffect(() => {
    if (role !== "learner" || !userId) {
      return;
    }

    let cancelled = false;

    const pollNudges = async () => {
      try {
        const data = await fetchJSON<Nudge[] | Nudge>(`/engagement/nudges/${userId}`);
        if (cancelled) return;

        const normalized = Array.isArray(data)
          ? data
          : data && typeof data === "object"
            ? [data]
            : [];

        setNudges(normalized);

        for (const nudge of normalized) {
          if (!nudge?.id) continue;
          if (seenNudgeIdsRef.current.has(nudge.id)) continue;

          const status = String(nudge.status || "").toLowerCase();
          if (status === "pending" || status === "sent") {
            seenNudgeIdsRef.current.add(nudge.id);
            void fetch(`${API_BASE}/engagement/nudges/${nudge.id}/status`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "seen" }),
            });
          }
        }
      } catch {
        // Keep previous nudge state on transient failures.
      }
    };

    void pollNudges();
    const intervalId = window.setInterval(() => {
      void pollNudges();
    }, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [role, userId]);

  useEffect(() => {
    if (role !== "admin") {
      setSelectedTimelineUserId(null);
      setTimeline(null);
      return;
    }

    if (timelineCandidates.length === 0) {
      setSelectedTimelineUserId(null);
      setTimeline(null);
      return;
    }

    const exists = timelineCandidates.some((candidate) => candidate.user_id === selectedTimelineUserId);
    if (!exists) {
      setSelectedTimelineUserId(timelineCandidates[0].user_id);
    }
  }, [role, timelineCandidates, selectedTimelineUserId]);

  useEffect(() => {
    if (role !== "admin" || !selectedTimelineUserId || !cohortId) {
      return;
    }

    fetchJSON<TimelineResponse>(
      `/engagement/user/${selectedTimelineUserId}/timeline?cohort_id=${cohortId}`,
    )
      .then((data) => setTimeline(data && typeof data === "object" ? data : null))
      .catch(() => setTimeline(null));
  }, [role, selectedTimelineUserId, cohortId]);

  useEffect(() => {
    if (role !== "learner") {
      hasCelebrationBaseline.current = false;
      return;
    }

    const currentTier = streak?.tier ?? null;
    const currentLevel = Number.isFinite(Number(xp?.level)) ? Number(xp?.level) : null;
    const latestBadge = badges[0];

    const currentBadgeSignature = latestBadge
      ? `${latestBadge.badge_type}|${latestBadge.earned_at}`
      : "";

    const questGain = xp?.recent_gains?.find((gain) => gain.source_type === "quest_completion");
    const taskGain = xp?.recent_gains?.find((gain) => gain.source_type === "task_completion");

    const questGainSignature = questGain
      ? `${questGain.source_type}|${questGain.source_id ?? "na"}|${questGain.created_at ?? "na"}|${questGain.xp_amount}`
      : "";
    const taskGainSignature = taskGain
      ? `${taskGain.source_type}|${taskGain.source_id ?? "na"}|${taskGain.created_at ?? "na"}|${taskGain.xp_amount}`
      : "";

    if (!hasCelebrationBaseline.current) {
      previousTierRef.current = currentTier;
      previousLevelRef.current = currentLevel;
      previousBadgeSignatureRef.current = currentBadgeSignature;
      previousQuestGainSignatureRef.current = questGainSignature;
      previousTaskGainSignatureRef.current = taskGainSignature;
      hasCelebrationBaseline.current = true;
      return;
    }

    const tierRank: Record<string, number> = {
      warm: 1,
      hot: 2,
      blazing: 3,
      diamond: 4,
    };

    let showedModalCelebration = false;

    if (questGainSignature && questGainSignature !== previousQuestGainSignatureRef.current && questGain) {
      setCelebration({
        kind: "quest",
        title: "Quest Complete",
        message: "You finished a quest milestone. Momentum compounds fast.",
        emoji: "🏆",
        xpAwarded: Number(questGain.xp_amount ?? 0),
        highlight: "Challenge accepted. Reward unlocked.",
      });
      triggerCelebrationConfetti("full");
      triggerModuleVictorySound();
      showedModalCelebration = true;
    } else if (
      currentTier
      && previousTierRef.current
      && currentTier !== previousTierRef.current
      && (tierRank[currentTier] ?? 0) > (tierRank[previousTierRef.current] ?? 0)
    ) {
      setCelebration({
        kind: "streak",
        title: "Streak Tier Up",
        message: `You moved from ${previousTierRef.current} to ${currentTier}. Keep the ALM fire alive.`,
        emoji: "🔥",
        highlight: "Consistency + challenge attempts are paying off.",
      });
      triggerCelebrationConfetti("full");
      triggerSuccessSound();
      showedModalCelebration = true;
    } else if (
      currentLevel
      && previousLevelRef.current
      && currentLevel > previousLevelRef.current
    ) {
      setCelebration({
        kind: "level",
        title: `Level ${currentLevel} Unlocked`,
        message: "Your XP growth triggered a level transition.",
        emoji: "⚡",
        highlight: "New level. New challenge ceiling.",
      });
      triggerCelebrationConfetti("full");
      triggerModuleVictorySound();
      showedModalCelebration = true;
    } else if (
      currentBadgeSignature
      && currentBadgeSignature !== previousBadgeSignatureRef.current
      && latestBadge
    ) {
      setCelebration({
        kind: "badge",
        title: "Badge Earned",
        message: latestBadge.badge_description || "A new achievement badge is now in your gallery.",
        emoji: latestBadge.badge_icon || "🏅",
        highlight: `${latestBadge.badge_name} (${latestBadge.badge_tier})`,
      });
      triggerCelebrationConfetti("full");
      triggerSuccessSound();
      showedModalCelebration = true;
    }

    if (!showedModalCelebration && taskGainSignature && taskGainSignature !== previousTaskGainSignatureRef.current) {
      triggerCelebrationConfetti("light");
      triggerSuccessSound();
    }

    previousTierRef.current = currentTier;
    previousLevelRef.current = currentLevel;
    previousBadgeSignatureRef.current = currentBadgeSignature;
    previousQuestGainSignatureRef.current = questGainSignature;
    previousTaskGainSignatureRef.current = taskGainSignature;
  }, [
    role,
    streak,
    xp,
    badges,
    triggerCelebrationConfetti,
    triggerModuleVictorySound,
    triggerSuccessSound,
  ]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <RefreshCw size={24} className="animate-spin text-gray-500" />
      </div>
    );
  }

  const isLearnerSidebar = role === "learner" && layout === "sidebar";
  const quickStats = [
    {
      label: "Streak",
      value: `${streak?.streak_count ?? 0} days`,
      accent: "text-orange-300",
    },
    {
      label: "XP",
      value: `${Number(xp?.total_xp ?? 0).toLocaleString()} XP`,
      accent: "text-purple-300",
    },
    {
      label: "Level",
      value: `Lv ${Number(xp?.level ?? 1)}`,
      accent: "text-indigo-300",
    },
    {
      label: "Health",
      value: `${Math.round(Number(health?.composite_score ?? 0))}/100`,
      accent: "text-emerald-300",
    },
  ];

  return (
    <div className={isLearnerSidebar ? "space-y-4" : "space-y-6"}>
      {/* Header — role badge (read-only, cannot be changed) */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className={`${isLearnerSidebar ? "text-xl" : "text-2xl"} font-bold text-white flex items-center gap-2`}>
            <Flame size={24} className="text-orange-400" />
            Engagement Engine
          </h2>
          <p className={`${isLearnerSidebar ? "text-xs" : "text-sm"} text-gray-500 mt-1`}>
            {role === "admin"
              ? "Cohort-level intelligence — monitor, intervene, improve"
              : "Your learning progress — powered by ALM"}
          </p>
        </div>

        {/* Role indicator (read-only, not a toggle) */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          role === "admin"
            ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
            : "bg-green-500/15 text-green-400 border border-green-500/30"
        }`}>
          {role === "admin" ? <BarChart3 size={14} /> : <Eye size={14} />}
          {role === "admin" ? "Admin / Mentor" : "Learner"}
        </div>
      </div>

      {/* ═══ LEARNER VIEW ═══ */}
      {role === "learner" && (
        <AnimatePresence mode="wait">
          <motion.div
            key="learner-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={isLearnerSidebar ? "space-y-4" : "space-y-6"}
          >
            {/* Nudge Banner */}
            <NudgeBanner nudges={nudges} />

            {isLearnerSidebar ? (
              <>
                <section className="rounded-2xl border border-gray-700/60 bg-gradient-to-br from-gray-900/70 to-gray-950/75 p-4">
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-3">Today at a glance</p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickStats.map((item) => (
                      <div key={item.label} className="rounded-xl border border-gray-700/70 bg-black/20 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">{item.label}</p>
                        <p className={`text-sm font-semibold ${item.accent}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {streak && <StreakCard data={streak} />}
                {xp && <XPCard data={xp} />}
                {health && <HealthGauge data={health} />}
                <QuestPanel quests={quests} />
                <BadgeGallery badges={badges} />
                <SmartLeaderboard entries={leaderboard} cohortId={String(cohortId)} />
              </>
            ) : (
              <>
                {/* Streak + XP */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {streak && <StreakCard data={streak} />}
                  {xp && <XPCard data={xp} />}
                </div>

                {/* Quests + Health */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <QuestPanel quests={quests} />
                  {health && <HealthGauge data={health} />}
                </div>

                {/* Leaderboard + Badges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SmartLeaderboard entries={leaderboard} cohortId={String(cohortId)} />
                  <BadgeGallery badges={badges} />
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ═══ ADMIN VIEW ═══ */}
      {role === "admin" && (
        <AnimatePresence mode="wait">
          <motion.div
            key="admin-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Cohort Health Overview */}
            {cohortHealth && <CohortHealthOverview dist={cohortHealth} />}

            {/* Forecast + AI Insights */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {forecast ? (
                <RiskForecastPanel data={forecast} />
              ) : (
                <div className="rounded-2xl border border-gray-700/60 bg-gradient-to-br from-gray-900/70 to-gray-950/75 p-5 text-sm text-gray-400 flex items-center justify-center min-h-[220px]">
                  {adminAiLoading
                    ? "Loading forecast..."
                    : "No forecast available yet. Try refreshing AI signals."}
                </div>
              )}

              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26 }}
                className="rounded-2xl border border-gray-700/60 bg-gradient-to-br from-gray-900/70 to-gray-950/75 p-5"
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-sm font-medium text-gray-200 uppercase tracking-wider">
                    AI Engagement Insights
                  </p>
                  <span className="text-[11px] text-gray-500 uppercase tracking-wide">
                    {insights?.source === "llm" ? "LLM" : "Heuristic"}
                  </span>
                </div>

                <div className="rounded-xl border border-gray-700/70 bg-black/25 p-3 mb-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400">
                    <SlidersHorizontal size={13} />
                    AI Controls
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className="text-xs text-gray-400">
                      Forecast Window
                      <select
                        value={forecastHorizonDays}
                        onChange={(event) => setForecastHorizonDays(Number(event.target.value))}
                        className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900/70 px-2.5 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        <option value={7}>7 days</option>
                        <option value={14}>14 days</option>
                        <option value={21}>21 days</option>
                      </select>
                    </label>

                    <label className="text-xs text-gray-400">
                      Show Cards
                      <select
                        value={insightCardLimit}
                        onChange={(event) => setInsightCardLimit(Number(event.target.value))}
                        className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900/70 px-2.5 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        <option value={3}>Top 3</option>
                        <option value={5}>Top 5</option>
                        <option value={8}>Top 8</option>
                      </select>
                    </label>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => void loadAdminIntelligence()}
                        disabled={adminAiLoading}
                        className="w-full rounded-lg border border-cyan-500/35 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {adminAiLoading ? "Refreshing..." : "Refresh AI"}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {([
                      { key: "all", label: "All", count: insightCounts.all },
                      { key: "critical", label: "Critical", count: insightCounts.critical },
                      { key: "warning", label: "Warning", count: insightCounts.warning },
                      { key: "info", label: "Info", count: insightCounts.info },
                    ] as const).map((chip) => {
                      const active = insightSeverityFilter === chip.key;

                      return (
                        <button
                          key={chip.key}
                          type="button"
                          onClick={() => setInsightSeverityFilter(chip.key)}
                          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                            active
                              ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-100"
                              : "border-gray-700 bg-gray-900/60 text-gray-300 hover:bg-gray-800"
                          }`}
                        >
                          {chip.label} ({chip.count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {visibleInsights.length > 0 ? (
                  <div className="space-y-3 max-h-[480px] overflow-auto pr-1">
                    {visibleInsights.map((insight, index) => (
                      <InsightCard
                        key={`${insight.title}-${index}`}
                        insight={insight}
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-700 p-4 text-sm text-gray-400">
                    No insights match the current filter.
                  </div>
                )}
              </motion.section>
            </div>

            {/* Clusters + At-Risk */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clusters && <ClusterCards data={clusters} />}
              {atRisk && <AtRiskPanel data={atRisk} />}
            </div>

            {/* Heatmap */}
            {heatmap && <CohortHeatmap data={heatmap} />}

            {/* Intervention Timeline */}
            {timelineCandidates.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Select learner for intervention audit
                  </p>
                  <select
                    value={selectedTimelineUserId ?? timelineCandidates[0]?.user_id}
                    onChange={(event) => setSelectedTimelineUserId(Number(event.target.value))}
                    className="bg-gray-900/70 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {timelineCandidates.map((candidate) => (
                      <option key={candidate.user_id} value={candidate.user_id}>
                        {candidate.name}
                      </option>
                    ))}
                  </select>
                </div>
                <InterventionTimeline
                  events={timeline?.events ?? []}
                  learnerLabel={selectedTimelineLearner?.name}
                />
              </div>
            )}

            {/* Leaderboard (admin can see who's on top / who's improving) */}
            <SmartLeaderboard entries={leaderboard} cohortId={String(cohortId)} />
          </motion.div>
        </AnimatePresence>
      )}

      <SuccessSound play={playSuccessSound} />
      <ModuleCompletionSound play={playModuleCompletionSound} />

      <AnimatePresence>
        {celebration && (
          <CelebrationModal
            celebration={celebration}
            onClose={() => setCelebration(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
