"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Info, Lightbulb, Siren, Sparkles } from "lucide-react";

export interface EngagementInsightItem {
  title: string;
  insight: string;
  severity: "info" | "warning" | "critical";
  suggested_action: string;
}

interface InsightCardProps {
  insight: EngagementInsightItem;
  index: number;
}

const severityStyles: Record<
  EngagementInsightItem["severity"],
  { border: string; chip: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  info: {
    border: "border-cyan-500/30",
    chip: "bg-cyan-500/15 text-cyan-200 border-cyan-400/30",
    icon: Info,
  },
  warning: {
    border: "border-amber-500/35",
    chip: "bg-amber-500/15 text-amber-200 border-amber-400/30",
    icon: AlertTriangle,
  },
  critical: {
    border: "border-red-500/40",
    chip: "bg-red-500/15 text-red-200 border-red-400/30",
    icon: Siren,
  },
};

export default function InsightCard({ insight, index }: InsightCardProps) {
  const style = severityStyles[insight.severity] || severityStyles.info;
  const Icon = style.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + (index * 0.06) }}
      className={`rounded-2xl border ${style.border} bg-gradient-to-br from-gray-900/80 to-gray-950/80 p-5`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${style.chip}`}>
          <Icon size={12} />
          {insight.severity}
        </div>
        <Sparkles size={13} className="text-gray-500" />
      </div>

      <h4 className="mt-3 text-sm font-semibold text-gray-100">{insight.title}</h4>
      <p className="mt-2 text-sm text-gray-300 leading-relaxed">{insight.insight}</p>

      <div className="mt-4 rounded-lg border border-gray-700/70 bg-gray-900/80 p-3">
        <div className="flex items-start gap-2">
          <Lightbulb size={13} className="text-emerald-300 mt-0.5" />
          <p className="text-xs text-gray-200 leading-relaxed">{insight.suggested_action}</p>
        </div>
      </div>
    </motion.article>
  );
}
