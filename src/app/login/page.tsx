"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { ArrowRight, GraduationCap, ShieldCheck } from "lucide-react";

// Create a separate component that uses useSearchParams
function LoginContent() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    const buildRoleHref = (role: "admin" | "student") => {
        const params = new URLSearchParams();
        if (searchParams.get("callbackUrl")) {
            params.set("callbackUrl", callbackUrl);
        }

        const query = params.toString();
        return query ? `/login/${role}?${query}` : `/login/${role}`;
    };

    // Redirect if already authenticated
    useEffect(() => {
        if (session) {
            router.push(callbackUrl);
        }
    }, [session, callbackUrl, router]);

    // Show loading state while checking session
    if (status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black px-4">
                <div className="w-12 h-12 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex flex-col justify-center items-center px-4 py-12 text-white">
            <div className="w-full max-w-5xl mx-auto relative">
                <div className="md:grid md:grid-cols-12 gap-8 items-center">
                    <div className="md:col-span-7 mb-8 md:mb-0 text-center md:text-left">
                        <div className="flex justify-center md:justify-start mb-8">
                            <Image
                                src="/images/sensai-logo-dark.svg"
                                alt="SensAI Logo"
                                width={200}
                                height={70}
                                className="w-[160px] md:w-[200px] h-auto"
                                style={{ width: 'auto', height: 'auto' }}
                                priority
                            />
                        </div>

                        <h1 className="text-4xl md:text-5xl font-light leading-tight">
                            One platform.
                            <span className="block text-cyan-300">Two focused workspaces.</span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-300 mt-6 mb-6 max-w-xl">
                            Pick your role first, then continue with Google. Admins and mentors get an intervention control center,
                            while students land in a learning-first experience with coaching and progress guidance.
                        </p>
                    </div>

                    <div className="md:col-span-5">
                        <div className="mx-4 md:mx-0 space-y-3">
                            <Link
                                href={buildRoleHref("admin")}
                                className="group rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-5 py-4 flex items-start justify-between gap-4 hover:bg-cyan-500/15 transition-colors"
                            >
                                <div>
                                    <p className="text-sm uppercase tracking-wide text-cyan-200">Admin / Mentor</p>
                                    <p className="mt-1 text-sm text-slate-200">
                                        Cohort command center, AI intervention insights, risk forecasting.
                                    </p>
                                </div>
                                <div className="inline-flex items-center gap-1 text-cyan-200">
                                    <ShieldCheck size={18} />
                                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </Link>

                            <Link
                                href={buildRoleHref("student")}
                                className="group rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-4 flex items-start justify-between gap-4 hover:bg-emerald-500/15 transition-colors"
                            >
                                <div>
                                    <p className="text-sm uppercase tracking-wide text-emerald-200">Student</p>
                                    <p className="mt-1 text-sm text-slate-200">
                                        Learning tasks, guided nudges, streaks, quests, and growth tracking.
                                    </p>
                                </div>
                                <div className="inline-flex items-center gap-1 text-emerald-200">
                                    <GraduationCap size={18} />
                                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </Link>

                            <div className="px-1 pt-3">
                                <p className="text-xs text-gray-500">
                                    By continuing, you acknowledge that you understand and agree to the{" "}
                                    <Link href="https://hyperverge.notion.site/SensAI-Terms-of-Use-1627e7c237cb80dc9bd2dac685d42f31?pvs=73" className="text-cyan-300 hover:underline">
                                        Terms & Conditions
                                    </Link>{" "}
                                    and{" "}
                                    <Link href="https://hyperverge.notion.site/SensAI-Privacy-Policy-1627e7c237cb80e5babae67e64642f27" className="text-cyan-300 hover:underline">
                                        Privacy Policy
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Main component with Suspense boundary
export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-black px-4">
                <div className="w-12 h-12 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
} 