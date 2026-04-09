"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

type SignalAverages = {
    consistency: number;
    depth: number;
    breadth: number;
    challenge: number;
    growth: number;
};

type SignalKey = keyof SignalAverages;

interface HealthGaugeProps {
    score: number;
    signalAverages?: SignalAverages | null;
    totalLearners?: number;
}

const SIGNAL_LABELS: Record<SignalKey, string> = {
    consistency: "Consistency",
    depth: "Depth",
    breadth: "Breadth",
    challenge: "Challenge",
    growth: "Growth",
};

const SIGNAL_KEYS: SignalKey[] = [
    "consistency",
    "depth",
    "breadth",
    "challenge",
    "growth",
];

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
}

function scoreColor(score: number): string {
    if (score < 25) return "#ef4444";
    if (score < 50) return "#f59e0b";
    if (score < 75) return "#22c55e";
    return "#3b82f6";
}

function scoreLabel(score: number): string {
    if (score < 25) return "At risk";
    if (score < 50) return "Needs support";
    if (score < 75) return "Stable";
    return "Thriving";
}

function getSignalMetrics(
    key: SignalKey,
    value: number,
    gaugeColor: string
): { barPercent: number; displayValue: string; barColor: string } {
    if (key === "growth") {
        // Growth is a signed trend in [-1, 1]. Keep it signed in UI so 0 means 0% change.
        const signedPercent = clamp(value * 100, -100, 100);
        return {
            barPercent: clamp(Math.abs(signedPercent), 0, 100),
            displayValue: `${signedPercent > 0 ? "+" : ""}${signedPercent.toFixed(1)}%`,
            barColor:
                signedPercent > 0
                    ? "#22c55e"
                    : signedPercent < 0
                        ? "#ef4444"
                        : "#64748b",
        };
    }

    const percent = clamp(value * 100, 0, 100);
    return {
        barPercent: percent,
        displayValue: `${percent.toFixed(1)}%`,
        barColor: gaugeColor,
    };
}

export default function HealthGauge({
    score,
    signalAverages,
    totalLearners,
}: HealthGaugeProps) {
    const clampedScore = clamp(score, 0, 100);
    const gaugeColor = scoreColor(clampedScore);
    const size = 180;
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - clampedScore / 100);

    const signalRows = useMemo(() => {
        if (!signalAverages) return [];
        return SIGNAL_KEYS.map((key) => {
            const metrics = getSignalMetrics(key, signalAverages[key], gaugeColor);
            return {
                key,
                label: SIGNAL_LABELS[key],
                barPercent: metrics.barPercent,
                displayValue: metrics.displayValue,
                barColor: metrics.barColor,
            };
        });
    }, [gaugeColor, signalAverages]);

    return (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                    <h3 className="text-lg font-light">Engagement health pulse</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Cohort health score based on 5 weighted learning signals
                    </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-black/30 dark:text-gray-300">
                    {totalLearners ?? 0} learners
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                <div className="flex justify-center">
                    <div className="relative" style={{ width: size, height: size }}>
                        <svg width={size} height={size} className="-rotate-90">
                            <circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke="currentColor"
                                strokeWidth={strokeWidth}
                                className="text-gray-200 dark:text-gray-800"
                                fill="transparent"
                            />
                            <motion.circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke={gaugeColor}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                fill="transparent"
                                strokeDasharray={circumference}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset: dashOffset }}
                                transition={{ duration: 1.1, ease: "easeOut" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.span
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="text-4xl font-light"
                            >
                                {clampedScore.toFixed(1)}
                            </motion.span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {scoreLabel(clampedScore)}
                            </span>
                        </div>
                    </div>
                </div>

                <div>
                    {signalRows.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Signal breakdown will appear once learner activity data is available.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {signalRows.map((row) => (
                                <div key={row.key}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-gray-700 dark:text-gray-200">{row.label}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {row.displayValue}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${row.barPercent}%` }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                            className="h-2 rounded-full"
                                            style={{ backgroundColor: row.barColor }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
