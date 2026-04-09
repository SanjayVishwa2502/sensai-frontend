"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Flame, Trophy, Users } from "lucide-react";
import HealthGauge from "@/components/engagement/HealthGauge";

type ClusterKey = "thriving" | "coasting" | "declining" | "at_risk";
type LeaderboardDimension = "xp" | "consistency" | "challenge" | "most_improved";

interface CohortHealthDistribution {
    cohort_id: number;
    distribution: Record<ClusterKey, number>;
    average_score?: number;
    total_learners?: number;
    signal_averages?: {
        consistency: number;
        depth: number;
        breadth: number;
        challenge: number;
        growth: number;
    };
}

interface ClusterLearner {
    user_id: number;
    name: string;
    composite_score: number;
    consistency_score?: number;
    depth_score?: number;
    breadth_score?: number;
    challenge_score?: number;
    growth_score?: number;
}

interface CohortClustersResponse {
    cohort_id: number;
    clusters: Record<ClusterKey, ClusterLearner[]>;
}

interface AtRiskLearner {
    user_id: number;
    name: string;
    cluster: string;
    composite_score: number;
    risk_score: number;
}

interface HeatmapCell {
    date: string;
    alm_seconds: number;
    tasks_completed: number;
    intensity: number;
}

interface HeatmapRow {
    user_id: number;
    name: string;
    total_alm_seconds: number;
    cells: HeatmapCell[];
}

interface HeatmapResponse {
    cohort_id: number;
    days: number;
    date_labels: string[];
    rows: HeatmapRow[];
}

interface EngagementLeaderboardEntry {
    user_id: number;
    cohort_id: number;
    rank: number;
    name: string | null;
    value: number;
    dimension: LeaderboardDimension;
    trend_delta?: number | null;
}

const EMPTY_CLUSTERS: Record<ClusterKey, ClusterLearner[]> = {
    thriving: [],
    coasting: [],
    declining: [],
    at_risk: [],
};

const CLUSTER_STYLE: Record<
    ClusterKey,
    { label: string; barColorClass: string; badgeClass: string }
> = {
    thriving: {
        label: "Thriving",
        barColorClass: "bg-emerald-500",
        badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    },
    coasting: {
        label: "Coasting",
        barColorClass: "bg-sky-500",
        badgeClass: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
    },
    declining: {
        label: "Declining",
        barColorClass: "bg-amber-500",
        badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    },
    at_risk: {
        label: "At risk",
        barColorClass: "bg-rose-500",
        badgeClass: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
    },
};

const DIMENSION_OPTIONS: Array<{ value: LeaderboardDimension; label: string }> = [
    { value: "xp", label: "XP" },
    { value: "consistency", label: "Consistency" },
    { value: "challenge", label: "Challenge" },
    { value: "most_improved", label: "Most improved" },
];

function intensityClass(level: number): string {
    if (level >= 4) return "bg-emerald-600 dark:bg-emerald-500";
    if (level === 3) return "bg-emerald-400 dark:bg-emerald-400";
    if (level === 2) return "bg-amber-400 dark:bg-amber-400";
    if (level === 1) return "bg-amber-200 dark:bg-amber-300";
    return "bg-gray-100 dark:bg-gray-800";
}

function formatDimensionValue(value: number, dimension: LeaderboardDimension): string {
    if (dimension === "xp") {
        return Math.round(value).toString();
    }
    return `${value.toFixed(1)}%`;
}

export default function CohortEngagementDashboard({ cohortId }: { cohortId: string }) {
    const [distribution, setDistribution] = useState<CohortHealthDistribution | null>(null);
    const [clusters, setClusters] = useState<Record<ClusterKey, ClusterLearner[]>>(EMPTY_CLUSTERS);
    const [atRiskLearners, setAtRiskLearners] = useState<AtRiskLearner[]>([]);
    const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null);
    const [leaderboard, setLeaderboard] = useState<EngagementLeaderboardEntry[]>([]);
    const [dimension, setDimension] = useState<LeaderboardDimension>("xp");

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshingLeaderboard, setIsRefreshingLeaderboard] = useState(false);
    const [baseError, setBaseError] = useState<string | null>(null);
    const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    const fetchJson = useCallback(
        async <T,>(path: string): Promise<T> => {
            if (!baseUrl) {
                throw new Error("Backend URL is not configured.");
            }

            const response = await fetch(`${baseUrl}${path}`);
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
            return response.json() as Promise<T>;
        },
        [baseUrl]
    );

    const fetchDashboardData = useCallback(async () => {
        if (!cohortId) return;

        setIsLoading(true);
        setBaseError(null);

        try {
            const [healthData, clusterData, atRiskData, heatmapData] = await Promise.all([
                fetchJson<CohortHealthDistribution>(`/engagement/cohort/${cohortId}/health`),
                fetchJson<CohortClustersResponse>(`/engagement/cohort/${cohortId}/clusters`),
                fetchJson<{ cohort_id: number; learners: AtRiskLearner[] }>(
                    `/engagement/cohort/${cohortId}/at-risk`
                ),
                fetchJson<HeatmapResponse>(`/engagement/cohort/${cohortId}/heatmap?days=7`),
            ]);

            setDistribution(healthData);
            setClusters({ ...EMPTY_CLUSTERS, ...(clusterData.clusters || {}) });
            setAtRiskLearners(atRiskData.learners || []);
            setHeatmap(heatmapData);
        } catch (error) {
            console.error("Error loading engagement dashboard:", error);
            setBaseError("Unable to load engagement intelligence right now.");
        } finally {
            setIsLoading(false);
        }
    }, [cohortId, fetchJson]);

    const fetchLeaderboard = useCallback(
        async (nextDimension: LeaderboardDimension) => {
            if (!cohortId) return;

            setIsRefreshingLeaderboard(true);
            setLeaderboardError(null);

            try {
                const leaderboardData = await fetchJson<EngagementLeaderboardEntry[]>(
                    `/engagement/leaderboard/${cohortId}?dimension=${nextDimension}`
                );
                setLeaderboard(leaderboardData || []);
            } catch (error) {
                console.error("Error loading engagement leaderboard:", error);
                setLeaderboard([]);
                setLeaderboardError("Unable to load leaderboard values.");
            } finally {
                setIsRefreshingLeaderboard(false);
            }
        },
        [cohortId, fetchJson]
    );

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useEffect(() => {
        fetchLeaderboard(dimension);
    }, [dimension, fetchLeaderboard]);

    const totalLearners = useMemo(() => {
        if (distribution?.total_learners !== undefined) {
            return distribution.total_learners;
        }

        return (Object.keys(clusters) as ClusterKey[]).reduce(
            (sum, key) => sum + (clusters[key]?.length || 0),
            0
        );
    }, [clusters, distribution?.total_learners]);

    const averageScore = distribution?.average_score ?? 0;
    const thrivingCount = distribution?.distribution?.thriving ?? clusters.thriving.length;
    const atRiskCount = distribution?.distribution?.at_risk ?? atRiskLearners.length;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="w-10 h-10 border-t-2 border-b-2 border-black dark:border-white rounded-full animate-spin" />
            </div>
        );
    }

    if (baseError) {
        return (
            <div className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 p-6">
                <p className="text-rose-700 dark:text-rose-300 mb-3">{baseError}</p>
                <button
                    onClick={fetchDashboardData}
                    className="px-4 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2">
                    <HealthGauge
                        score={averageScore}
                        signalAverages={distribution?.signal_averages}
                        totalLearners={totalLearners}
                    />
                </div>

                <div className="space-y-4">
                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] p-5">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Thriving learners</p>
                        <div className="flex items-center gap-2">
                            <Trophy size={18} className="text-amber-500" />
                            <p className="text-3xl font-light">{thrivingCount}</p>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] p-5">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">At-risk signals</p>
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={18} className="text-rose-500" />
                            <p className="text-3xl font-light">{atRiskCount}</p>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] p-5">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total cohort learners</p>
                        <div className="flex items-center gap-2">
                            <Users size={18} className="text-sky-500" />
                            <p className="text-3xl font-light">{totalLearners}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] p-5">
                <h3 className="text-lg font-light mb-4">Behavioral cluster distribution</h3>
                {totalLearners === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No learners found for this cohort yet.</p>
                ) : (
                    <div className="space-y-3">
                        {(Object.keys(CLUSTER_STYLE) as ClusterKey[]).map((key) => {
                            const count = distribution?.distribution?.[key] ?? clusters[key]?.length ?? 0;
                            const percentage = totalLearners > 0 ? (count / totalLearners) * 100 : 0;
                            return (
                                <div key={key}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${CLUSTER_STYLE[key].badgeClass}`}
                                        >
                                            {CLUSTER_STYLE[key].label}
                                        </span>
                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                            {count} learner{count === 1 ? "" : "s"}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-2 ${CLUSTER_STYLE[key].barColorClass}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-light">At-risk learners</h3>
                        <Flame size={18} className="text-rose-500" />
                    </div>

                    {atRiskLearners.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No active at-risk signals right now.</p>
                    ) : (
                        <div className="space-y-2">
                            {atRiskLearners.slice(0, 8).map((learner) => (
                                <div
                                    key={learner.user_id}
                                    className="flex items-center justify-between rounded-md px-3 py-2 bg-gray-50 dark:bg-black/30"
                                >
                                    <div>
                                        <p className="text-sm font-medium">{learner.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {learner.cluster.replace("_", " ")}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Risk</p>
                                        <p className="text-sm font-medium text-rose-600 dark:text-rose-300">
                                            {learner.risk_score.toFixed(1)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-light">Engagement leaderboard</h3>
                        <select
                            value={dimension}
                            onChange={(event) => setDimension(event.target.value as LeaderboardDimension)}
                            className="px-3 py-1.5 rounded-md text-sm bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-gray-700"
                        >
                            {DIMENSION_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {isRefreshingLeaderboard ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 border-t-2 border-b-2 border-gray-600 dark:border-gray-300 rounded-full animate-spin" />
                        </div>
                    ) : leaderboardError ? (
                        <p className="text-sm text-rose-600 dark:text-rose-300">{leaderboardError}</p>
                    ) : leaderboard.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No leaderboard entries available.</p>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {leaderboard.slice(0, 8).map((entry) => {
                                const trend = entry.trend_delta ?? 0;
                                return (
                                    <div
                                        key={`${entry.user_id}-${entry.dimension}`}
                                        className="flex items-center justify-between py-2"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 text-sm text-gray-500 dark:text-gray-400">#{entry.rank}</span>
                                            <span className="text-sm font-medium">{entry.name || `User ${entry.user_id}`}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">
                                                {formatDimensionValue(entry.value, dimension)}
                                            </p>
                                            <p
                                                className={`text-xs ${
                                                    trend > 0
                                                        ? "text-emerald-600 dark:text-emerald-300"
                                                        : trend < 0
                                                            ? "text-rose-600 dark:text-rose-300"
                                                            : "text-gray-500 dark:text-gray-400"
                                                }`}
                                            >
                                                {trend > 0 ? "+" : ""}
                                                {trend.toFixed(1)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] p-5">
                <h3 className="text-lg font-light mb-4">Cohort activity heatmap</h3>
                {!heatmap || heatmap.rows.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity data available.</p>
                ) : (
                    <div className="space-y-3 overflow-x-auto">
                        <div className="flex min-w-[720px] items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <div className="w-40" />
                            {heatmap.date_labels.map((label) => (
                                <div key={label} className="w-4 text-center">
                                    {label.slice(5)}
                                </div>
                            ))}
                        </div>

                        {heatmap.rows.slice(0, 12).map((row) => (
                            <div key={row.user_id} className="flex min-w-[720px] items-center gap-3">
                                <div className="w-40 truncate text-sm text-gray-700 dark:text-gray-300">
                                    {row.name}
                                </div>
                                <div className="flex gap-1">
                                    {row.cells.map((cell) => (
                                        <div
                                            key={`${row.user_id}-${cell.date}`}
                                            className={`h-4 w-4 rounded-sm ${intensityClass(cell.intensity)}`}
                                            title={`${row.name}: ${cell.alm_seconds}s ALM, ${cell.tasks_completed} tasks on ${cell.date}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
