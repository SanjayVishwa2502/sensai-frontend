"use client";

import React, { useState } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, GraduationCap, ArrowLeft, ShieldCheck, LogOut } from "lucide-react";
import EngagementDashboard, { EngagementRole } from "@/components/engagement/EngagementDashboard";

function DemoContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") || "1";
  const cohortId = searchParams.get("cohortId") || "1";

  // Role is selected at "login" — once chosen, it's locked
  const [selectedRole, setSelectedRole] = useState<EngagementRole | null>(null);

  // ═══ ROLE SELECTION GATE (simulated login) ═══
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-lg w-full"
        >
          {/* App Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Sens<span className="text-orange-400">AI</span>
            </h1>
            <p className="text-gray-500 text-sm mt-2">Engagement Engine Demo</p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl border border-gray-800 bg-gray-950/80 backdrop-blur-md p-8">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck size={20} className="text-orange-400" />
              <h2 className="text-lg font-medium text-white">Select your role to continue</h2>
            </div>
            <p className="text-sm text-gray-500 mb-8">
              In the actual app, your role is determined by your login credentials.
              Admin/mentors and learners see completely different dashboards.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Admin Card */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRole("admin")}
                className="group relative rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-950/40 to-gray-950/60 p-6 text-left cursor-pointer transition-all hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/10"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <BarChart3 size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-blue-200">Admin / Mentor</h3>
                    <p className="text-xs text-blue-400/50">Cohort management</p>
                  </div>
                </div>
                <ul className="space-y-1.5 mt-4">
                  <li className="text-xs text-gray-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-blue-400" /> Cohort health distribution
                  </li>
                  <li className="text-xs text-gray-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-blue-400" /> Behavioral cluster analysis
                  </li>
                  <li className="text-xs text-gray-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-blue-400" /> At-risk learner alerts
                  </li>
                  <li className="text-xs text-gray-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-blue-400" /> Activity heatmap
                  </li>
                  <li className="text-xs text-gray-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-blue-400" /> Multi-dimensional leaderboard
                  </li>
                </ul>
                <div className="mt-4 text-xs text-blue-400 group-hover:text-blue-300 transition-colors">
                  Enter as Admin →
                </div>
              </motion.button>

              {/* Learner Card */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRole("learner")}
                className="group relative rounded-xl border border-green-500/30 bg-gradient-to-br from-green-950/40 to-gray-950/60 p-6 text-left cursor-pointer transition-all hover:border-green-400/50 hover:shadow-lg hover:shadow-green-500/10"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <GraduationCap size={20} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-green-200">Learner</h3>
                    <p className="text-xs text-green-400/50">Personal progress</p>
                  </div>
                </div>
                <ul className="space-y-1.5 mt-4">
                  <li className="text-xs text-gray-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-green-400" /> ALM-verified streak
                  </li>
                  <li className="text-xs text-gray-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-green-400" /> XP & level progression
                  </li>
                  <li className="text-xs text-gray-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-green-400" /> Personalized quests
                  </li>
                  <li className="text-xs text-gray-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-green-400" /> Engagement health score
                  </li>
                  <li className="text-xs text-gray-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-green-400" /> Badges & smart nudges
                  </li>
                </ul>
                <div className="mt-4 text-xs text-green-400 group-hover:text-green-300 transition-colors">
                  Enter as Learner →
                </div>
              </motion.button>
            </div>
          </div>

          <p className="text-center text-gray-700 text-xs mt-6">
            User ID: {userId} • Cohort ID: {cohortId}
          </p>
        </motion.div>
      </div>
    );
  }

  // ═══ DASHBOARD (role is now locked) ═══
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top bar showing logged-in state */}
      <div className={`border-b px-6 py-3 flex items-center justify-between ${
        selectedRole === "admin"
          ? "bg-blue-950/30 border-blue-500/20"
          : "bg-green-950/30 border-green-500/20"
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-white tracking-tight">
            Sens<span className="text-orange-400">AI</span>
          </span>
          <span className="text-gray-600">|</span>
          <div className={`flex items-center gap-1.5 text-sm font-medium ${
            selectedRole === "admin" ? "text-blue-400" : "text-green-400"
          }`}>
            {selectedRole === "admin" ? <BarChart3 size={14} /> : <GraduationCap size={14} />}
            Logged in as {selectedRole === "admin" ? "Admin / Mentor" : "Learner"}
          </div>
        </div>
        <button
          onClick={() => setSelectedRole(null)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-800/50"
        >
          <LogOut size={12} />
          Sign Out
        </button>
      </div>

      {/* Dashboard content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedRole}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <EngagementDashboard
              userId={userId}
              cohortId={cohortId}
              role={selectedRole}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function EngagementDemoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-gray-500">
          Loading...
        </div>
      }
    >
      <DemoContent />
    </Suspense>
  );
}
