"use client";

import { motion } from "framer-motion";
import { AlertCircle, Gauge, ShieldAlert, TrendingUp } from "lucide-react";

export interface RiskForecastLearner {
  user_id: number;
  name: string;
  dropoff_probability: number;
  confidence: number;
  risk_level: "green" | "yellow" | "red";
  reasons: string[];
  recommended_action: string;
}

export interface RiskForecastData {
  cohort_id: number;
  horizon_days: number;
  predicted_active_learners: number;
  total_learners: number;
  forecast: RiskForecastLearner[];
}

interface RiskForecastPanelProps {
  data: RiskForecastData;
}

function riskColor(level: RiskForecastLearner["risk_level"]): string {
  if (level === "red") return "bg-red-500";
  if (level === "yellow") return "bg-amber-500";
  return "bg-emerald-500";
}

function riskText(level: RiskForecastLearner["risk_level"]): string {
  if (level === "red") return "text-red-300";
  if (level === "yellow") return "text-amber-300";
  return "text-emerald-300";
}

export default function RiskForecastPanel({ data }: RiskForecastPanelProps) {
  const top = data.forecast.slice(0, 5);
  const activeRate = data.total_learners > 0
    ? Math.round((data.predicted_active_learners / data.total_learners) * 100)
    : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      className="rounded-2xl border border-gray-700/60 bg-gradient-to-br from-slate-900/75 via-gray-950/75 to-gray-900/70 p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gauge size={16} className="text-cyan-300" />
          <h3 className="text-sm font-medium text-gray-200 uppercase tracking-wider">Drop-Off Forecast</h3>
        </div>
        <span className="text-xs text-gray-500">Next {data.horizon_days} days</span>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-cyan-300/80">Predicted Active</p>
          <p className="mt-1 text-xl font-bold text-cyan-100">{data.predicted_active_learners}</p>
        </div>
        <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/10 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-indigo-300/80">Total Learners</p>
          <p className="mt-1 text-xl font-bold text-indigo-100">{data.total_learners}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-emerald-300/80">Projected Retention</p>
          <p className="mt-1 text-xl font-bold text-emerald-100">{activeRate}%</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {top.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-700 px-3 py-5 text-sm text-gray-500">
            Forecast data is not available yet.
          </div>
        ) : (
          top.map((learner, index) => (
            <motion.div
              key={learner.user_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + (index * 0.05) }}
              className="rounded-lg border border-gray-700/60 bg-gray-900/60 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-100">{learner.name}</p>
                  <p className={`text-xs uppercase tracking-wide ${riskText(learner.risk_level)}`}>
                    {learner.risk_level} risk
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-100">{Math.round(learner.dropoff_probability)}%</p>
                  <p className="text-[11px] text-gray-500">confidence {Math.round(learner.confidence * 100)}%</p>
                </div>
              </div>

              <div className="mt-2 h-2 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className={`h-2 ${riskColor(learner.risk_level)}`}
                  style={{ width: `${Math.max(2, Math.min(100, learner.dropoff_probability))}%` }}
                />
              </div>

              <div className="mt-2 flex items-start gap-2 text-xs text-gray-300">
                <AlertCircle size={12} className="mt-0.5 text-gray-500" />
                <span>{learner.reasons[0] || learner.recommended_action}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {data.forecast.some((learner) => learner.risk_level === "red") && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 flex items-start gap-2">
          <ShieldAlert size={13} className="mt-0.5" />
          Prioritize mentor intervention for red-risk learners in the next 24 hours.
        </div>
      )}

      <div className="mt-3 text-[11px] text-gray-500 flex items-center gap-1">
        <TrendingUp size={11} />
        Forecast combines consistency, depth, challenge, growth trend, and inactivity signals.
      </div>
    </motion.section>
  );
}
