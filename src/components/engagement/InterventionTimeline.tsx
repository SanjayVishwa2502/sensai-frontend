"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Eye,
  Flame,
  Target,
  TrendingUp,
} from "lucide-react";

export interface InterventionTimelineEvent {
  event_id: string;
  event_type: string;
  timestamp: string;
  title: string;
  description: string;
  status?: string;
  score_before?: number;
  score_after?: number;
  score_delta?: number;
  cluster_before?: string;
  cluster_after?: string;
  badge_tier?: string;
}

interface InterventionTimelineProps {
  events: InterventionTimelineEvent[];
  learnerLabel?: string;
}

function formatTimestamp(timestamp: string): string {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return timestamp;
  }
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getEventMeta(eventType: string): {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  chipClass: string;
  label: string;
} {
  switch (eventType) {
    case "nudge_sent":
      return {
        icon: AlertTriangle,
        chipClass: "bg-blue-500/15 text-blue-300 border-blue-500/30",
        label: "Nudge Sent",
      };
    case "nudge_seen":
      return {
        icon: Eye,
        chipClass: "bg-slate-500/15 text-slate-300 border-slate-500/30",
        label: "Nudge Seen",
      };
    case "nudge_acted":
      return {
        icon: CheckCircle2,
        chipClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        label: "Nudge Acted",
      };
    case "quest_assigned":
      return {
        icon: Target,
        chipClass: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
        label: "Quest Assigned",
      };
    case "quest_completed":
      return {
        icon: Flame,
        chipClass: "bg-orange-500/15 text-orange-300 border-orange-500/30",
        label: "Quest Completed",
      };
    case "badge_earned":
      return {
        icon: Award,
        chipClass: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
        label: "Badge Earned",
      };
    case "engagement_delta":
      return {
        icon: TrendingUp,
        chipClass: "bg-violet-500/15 text-violet-300 border-violet-500/30",
        label: "Score Shift",
      };
    default:
      return {
        icon: TrendingUp,
        chipClass: "bg-gray-500/15 text-gray-300 border-gray-500/30",
        label: "Intervention",
      };
  }
}

export default function InterventionTimeline({
  events,
  learnerLabel,
}: InterventionTimelineProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28 }}
      className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-sm p-6"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">
            Intervention Timeline
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {learnerLabel ? `Mentor audit trail for ${learnerLabel}` : "Mentor audit trail for interventions"}
          </p>
        </div>
        <span className="text-xs text-gray-500">{events.length} events</span>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/30 px-4 py-6 text-sm text-gray-500">
          No intervention events yet for the selected learner.
        </div>
      ) : (
        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-max items-start gap-5 pr-3">
            {events.map((event, index) => {
              const { icon: Icon, chipClass, label } = getEventMeta(event.event_type);
              return (
                <div key={event.event_id} className="relative w-64 shrink-0">
                  {index < events.length - 1 && (
                    <div className="absolute left-[calc(100%+0.5rem)] top-6 h-px w-4 bg-gray-700/80" />
                  )}

                  <motion.div
                    whileHover={{ y: -3, scale: 1.01 }}
                    className="rounded-xl border border-gray-700/60 bg-gray-900/60 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${chipClass}`}>
                        <Icon size={12} />
                        {label}
                      </span>
                      <span className="text-[10px] text-gray-500">{formatTimestamp(event.timestamp)}</span>
                    </div>

                    <p className="mt-2 text-sm font-medium text-gray-100">{event.title}</p>
                    <p className="mt-1 text-xs text-gray-400 leading-relaxed">{event.description}</p>

                    {typeof event.score_delta === "number" && (
                      <div className="mt-2 rounded-lg border border-violet-500/20 bg-violet-500/10 px-2 py-1 text-[11px] text-violet-200">
                        Score delta: {event.score_delta >= 0 ? "+" : ""}{event.score_delta.toFixed(1)}
                      </div>
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
