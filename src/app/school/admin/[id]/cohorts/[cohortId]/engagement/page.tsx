"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Radar, Sparkles, TrendingUp } from "lucide-react";

import EngagementDashboard from "@/components/engagement/EngagementDashboard";
import { useAuth } from "@/lib/auth";

export default function CohortEngagementPage() {
  const params = useParams<{ id: string; cohortId: string }>();
  const { user } = useAuth();

  const schoolId = String(params?.id || "");
  const cohortId = String(params?.cohortId || "");
  const userId = String(user?.id || "");

  return (
    <main className="min-h-screen relative overflow-hidden bg-[radial-gradient(circle_at_10%_20%,#0f172a_0%,#030712_48%,#000000_100%)] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 -left-24 w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 w-[28rem] h-[28rem] rounded-full bg-emerald-500/15 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link
            href={`/school/admin/${schoolId}/cohorts/${cohortId}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90 hover:bg-white/15 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Cohort
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-wide text-cyan-200">
            <Sparkles size={12} />
            Engagement Command Center
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 rounded-3xl border border-white/10 bg-black/30 backdrop-blur-md p-6 md:p-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                Cohort Engagement Intelligence
              </h1>
              <p className="mt-3 text-sm md:text-base text-gray-300 max-w-3xl">
                Real-time pulse, predictive risk, and intervention insights in one visual surface.
                Use this page during demos to narrate learner momentum, risks, and corrective actions.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/10 p-3">
                <div className="text-xs uppercase tracking-wide text-cyan-200/80">Live Signals</div>
                <div className="mt-2 text-lg font-semibold text-cyan-100 inline-flex items-center gap-1">
                  <Radar size={16} />
                  Active
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-3">
                <div className="text-xs uppercase tracking-wide text-emerald-200/80">Forecast</div>
                <div className="mt-2 text-lg font-semibold text-emerald-100 inline-flex items-center gap-1">
                  <TrendingUp size={16} />
                  7-Day
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-black/30 backdrop-blur-md p-5 md:p-7">
          <EngagementDashboard
            userId={userId}
            cohortId={cohortId}
            role="admin"
          />
        </section>
      </div>
    </main>
  );
}
