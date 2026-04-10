export type EngagementEventType =
    | "active_time"
    | "task_attempt"
    | "task_complete"
    | "quest_progress"
    | "badge_earned"
    | "page_focus"
    | "page_blur";

export interface EngagementEventPayload {
    event_type: EngagementEventType;
    event_data?: Record<string, unknown>;
    task_id?: number;
    question_id?: number;
    cohort_id?: number;
    course_id?: number;
    active_seconds?: number;
    occurred_at?: string;
}

export interface RecordEngagementEventsRequest {
    user_id: string | number;
    session_id: string;
    cohort_id?: number;
    course_id?: number;
    events: EngagementEventPayload[];
}

export interface UserALMSummaryResponse {
    user_id?: number;
    cohort_id?: number;
    daily_alm_seconds?: Record<string, number>;
    total_alm_seconds?: number;
}

export interface StreakResponse {
    user_id: number;
    cohort_id?: number;
    streak_count: number;
    tier: string;
    active_days: string[];
    alm_today_seconds: number;
    alm_target_seconds: number;
}

export interface XPResponse {
    user_id: number;
    cohort_id: number;
    total_xp: number;
    level: number;
    current_level_xp: number;
    xp_to_next_level: number;
    active_multipliers: Record<string, number>;
    recent_gains: Array<{
        xp_amount: number;
        source_type: string;
        source_id?: number;
        multiplier_applied: number;
        multiplier_type?: string;
        created_at?: string;
    }>;
}

export interface QuestResponse {
    id: number;
    user_id: number;
    cohort_id: number;
    quest_type: string;
    title: string;
    description?: string;
    target_value: number;
    current_value: number;
    xp_reward: number;
    status: string;
    expires_at?: string;
    completed_at?: string;
    created_at?: string;
}

export interface NudgeResponse {
    id: number;
    user_id: number;
    cohort_id: number;
    nudge_type: string;
    trigger_pattern: string;
    title: string;
    content: string;
    action_url?: string;
    status: string;
    sent_at?: string;
    seen_at?: string;
    acted_at?: string;
    created_at?: string;
}

export interface EngagementHealthResponse {
    user_id: number;
    cohort_id: number;
    consistency_score: number;
    depth_score: number;
    breadth_score: number;
    challenge_score: number;
    growth_score: number;
    composite_score: number;
    cluster: string;
}

export interface LeaderboardEntry {
    user_id: number;
    cohort_id: number;
    rank: number;
    name?: string;
    value: number;
    dimension: string;
    trend_delta?: number;
}

export interface RiskForecastResponse {
    cohort_id: number;
    horizon_days: number;
    predicted_active_learners: number;
    total_learners: number;
    forecast: Array<{
        user_id: number;
        name: string;
        dropoff_probability: number;
        confidence: number;
        risk_level: "green" | "yellow" | "red";
        reasons: string[];
        recommended_action: string;
    }>;
}

export interface CohortInsightsResponse {
    cohort_id: number;
    generated_at: string;
    source: "llm" | "heuristic";
    insights: Array<{
        title: string;
        insight: string;
        severity: "info" | "warning" | "critical";
        suggested_action: string;
    }>;
}

async function getJSON<T>(path: string): Promise<T> {
    const response = await fetch(`${getBackendUrl()}${path}`);
    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
}

async function postJSON<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${getBackendUrl()}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
}

function getBackendUrl(): string {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
        throw new Error("NEXT_PUBLIC_BACKEND_URL is not configured");
    }

    return backendUrl;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
            searchParams.set(key, String(value));
        }
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
}

export async function postEngagementEvents(
    body: RecordEngagementEventsRequest,
): Promise<Record<string, unknown>> {
    const response = await fetch(`${getBackendUrl()}/engagement/events`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(`Failed to post engagement events: ${response.status}`);
    }

    return response.json();
}

export async function getALM(
    userId: string | number,
    options: {
        cohortId?: string | number;
        days?: number;
    } = {},
): Promise<UserALMSummaryResponse> {
    const query = buildQuery({
        cohort_id: options.cohortId,
        days: options.days ?? 7,
    });

    const response = await fetch(`${getBackendUrl()}/engagement/alm/${userId}${query}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch ALM summary: ${response.status}`);
    }

    return response.json();
}

export async function getStreak(
    userId: string | number,
    cohortId?: string | number,
): Promise<StreakResponse> {
    const query = buildQuery({ cohort_id: cohortId });
    return getJSON<StreakResponse>(`/engagement/streaks/${userId}${query}`);
}

export async function getXP(
    userId: string | number,
    cohortId: string | number,
): Promise<XPResponse> {
    const query = buildQuery({ cohort_id: cohortId });
    return getJSON<XPResponse>(`/engagement/xp/${userId}${query}`);
}

export async function awardXP(
    userId: string | number,
    body: {
        cohort_id: number;
        source_type: "task_completion" | "quest_completion" | "streak_bonus" | "badge_earned";
        base_xp: number;
        source_id?: number;
        source_metadata?: Record<string, unknown>;
    },
): Promise<Record<string, unknown>> {
    return postJSON<Record<string, unknown>>(`/engagement/xp/${userId}/award`, body);
}

export async function getQuests(
    userId: string | number,
    cohortId: string | number,
): Promise<QuestResponse[]> {
    const query = buildQuery({ cohort_id: cohortId });
    return getJSON<QuestResponse[]>(`/engagement/quests/${userId}${query}`);
}

export async function updateQuestProgress(
    questId: string | number,
    increment = 1,
): Promise<Record<string, unknown>> {
    return postJSON<Record<string, unknown>>(`/engagement/quests/${questId}/progress`, { increment });
}

export async function getNudges(userId: string | number): Promise<NudgeResponse[]> {
    return getJSON<NudgeResponse[]>(`/engagement/nudges/${userId}`);
}

export async function updateNudgeStatus(
    nudgeId: string | number,
    status: "seen" | "acted_upon" | "ignored" | "expired" | "sent" | "pending",
): Promise<Record<string, unknown>> {
    return postJSON<Record<string, unknown>>(`/engagement/nudges/${nudgeId}/status`, { status });
}

export async function getEngagementHealth(
    userId: string | number,
    cohortId: string | number,
): Promise<EngagementHealthResponse> {
    const query = buildQuery({ cohort_id: cohortId });
    return getJSON<EngagementHealthResponse>(`/engagement/health/${userId}${query}`);
}

export async function getCohortClusters(cohortId: string | number): Promise<Record<string, unknown>> {
    return getJSON<Record<string, unknown>>(`/engagement/cohort/${cohortId}/clusters`);
}

export async function getAtRiskLearners(cohortId: string | number): Promise<Record<string, unknown>> {
    return getJSON<Record<string, unknown>>(`/engagement/cohort/${cohortId}/at-risk`);
}

export async function getLeaderboard(
    cohortId: string | number,
    dimension: "xp" | "consistency" | "challenge" | "most_improved" = "xp",
): Promise<LeaderboardEntry[]> {
    const query = buildQuery({ dimension });
    return getJSON<LeaderboardEntry[]>(`/engagement/leaderboard/${cohortId}${query}`);
}

export async function getHeatmap(
    cohortId: string | number,
    days = 14,
): Promise<Record<string, unknown>> {
    const query = buildQuery({ days });
    return getJSON<Record<string, unknown>>(`/engagement/cohort/${cohortId}/heatmap${query}`);
}

export async function getBadges(userId: string | number): Promise<Record<string, unknown>[]> {
    return getJSON<Record<string, unknown>[]>(`/engagement/badges/${userId}`);
}

export async function getInterventionTimeline(
    userId: string | number,
    cohortId: string | number,
): Promise<Record<string, unknown>> {
    const query = buildQuery({ cohort_id: cohortId });
    return getJSON<Record<string, unknown>>(`/engagement/user/${userId}/timeline${query}`);
}

export async function getForecast(
    cohortId: string | number,
    horizonDays = 7,
): Promise<RiskForecastResponse> {
    const query = buildQuery({ horizon_days: horizonDays });
    return getJSON<RiskForecastResponse>(`/engagement/cohort/${cohortId}/forecast${query}`);
}

export async function getInsights(
    cohortId: string | number,
): Promise<CohortInsightsResponse> {
    return getJSON<CohortInsightsResponse>(`/engagement/cohort/${cohortId}/insights`);
}
