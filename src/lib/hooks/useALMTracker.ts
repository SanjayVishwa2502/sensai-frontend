import { useEffect, useMemo, useRef } from "react";

import {
    EngagementEventPayload,
    postEngagementEvents,
} from "@/lib/engagement-api";

interface UseALMTrackerConfig {
    userId?: string | number;
    cohortId?: string | number;
    courseId?: string | number;
    taskId?: string | number | null;
    enabled?: boolean;
    flushIntervalMs?: number;
}

function createSessionId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function toOptionalNumber(value?: string | number | null): number | undefined {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

export function useALMTracker({
    userId,
    cohortId,
    courseId,
    taskId,
    enabled = true,
    flushIntervalMs = 30000,
}: UseALMTrackerConfig): void {
    const sessionIdRef = useRef<string>(createSessionId());
    const queueRef = useRef<EngagementEventPayload[]>([]);
    const lastActivityAtRef = useRef<number>(Date.now());

    const numericCohortId = useMemo(() => toOptionalNumber(cohortId), [cohortId]);
    const numericCourseId = useMemo(() => toOptionalNumber(courseId), [courseId]);
    const numericTaskId = useMemo(() => toOptionalNumber(taskId), [taskId]);

    useEffect(() => {
        if (!enabled || !userId || typeof window === "undefined") {
            return;
        }

        let isFlushing = false;

        const pushEvent = (event: EngagementEventPayload) => {
            queueRef.current.push(event);

            // Keep queue bounded to avoid memory growth if network is unstable.
            if (queueRef.current.length > 400) {
                queueRef.current = queueRef.current.slice(-400);
            }
        };

        const flushEvents = async () => {
            if (isFlushing || queueRef.current.length === 0) {
                return;
            }

            isFlushing = true;
            const batch = [...queueRef.current];

            try {
                await postEngagementEvents({
                    user_id: userId,
                    session_id: sessionIdRef.current,
                    cohort_id: numericCohortId,
                    course_id: numericCourseId,
                    events: batch,
                });
                queueRef.current = queueRef.current.slice(batch.length);
            } catch (error) {
                console.error("Failed to flush ALM events:", error);
            } finally {
                isFlushing = false;
            }
        };

        const handleActivity = (source: string) => {
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - lastActivityAtRef.current) / 1000);
            const boundedActiveSeconds = Math.min(Math.max(elapsedSeconds, 0), 30);
            lastActivityAtRef.current = now;

            if (boundedActiveSeconds > 0) {
                pushEvent({
                    event_type: "active_time",
                    active_seconds: boundedActiveSeconds,
                    event_data: {
                        source,
                    },
                    task_id: numericTaskId,
                    cohort_id: numericCohortId,
                    course_id: numericCourseId,
                    occurred_at: new Date(now).toISOString(),
                });
            }
        };

        const handleVisibilityChange = () => {
            const eventType = document.visibilityState === "hidden" ? "page_blur" : "page_focus";
            const now = Date.now();
            lastActivityAtRef.current = now;

            pushEvent({
                event_type: eventType,
                task_id: numericTaskId,
                cohort_id: numericCohortId,
                course_id: numericCourseId,
                occurred_at: new Date(now).toISOString(),
            });

            if (eventType === "page_blur") {
                void flushEvents();
            }
        };

        const activitySources: Array<[keyof WindowEventMap, string]> = [
            ["mousemove", "mousemove"],
            ["keydown", "keydown"],
            ["scroll", "scroll"],
            ["click", "click"],
            ["touchstart", "touchstart"],
        ];

        const registeredWindowListeners: Array<[keyof WindowEventMap, EventListener]> = [];

        for (const [eventName, source] of activitySources) {
            const listener: EventListener = () => handleActivity(source);
            window.addEventListener(eventName, listener, { passive: true });
            registeredWindowListeners.push([eventName, listener]);
        }

        document.addEventListener("visibilitychange", handleVisibilityChange);

        const intervalId = window.setInterval(() => {
            void flushEvents();
        }, flushIntervalMs);

        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener("visibilitychange", handleVisibilityChange);

            for (const [eventName, listener] of registeredWindowListeners) {
                window.removeEventListener(eventName, listener);
            }

            void flushEvents();
        };
    }, [
        enabled,
        userId,
        numericCohortId,
        numericCourseId,
        numericTaskId,
        flushIntervalMs,
    ]);
}
