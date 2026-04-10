"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useRef } from "react";
import { ArrowRight, ArrowRightLeft, Building2, GraduationCap } from "lucide-react";

import { useCourses, useSchools } from "@/lib/api";

export default function StudentAccessPage() {
  const router = useRouter();
  const { status } = useSession();
  const { courses, isLoading: isCoursesLoading } = useCourses({ refreshIntervalMs: 10000 });
  const { schools, isLoading: isSchoolsLoading } = useSchools({ refreshIntervalMs: 10000 });
  const hasRedirectedRef = useRef(false);

  const learnerCourse = useMemo(
    () =>
      courses.find((course) => {
        const role = (course.role || "").toLowerCase();
        return role !== "admin" && role !== "mentor";
      }),
    [courses],
  );

  const hasLearnerAccess = Boolean(learnerCourse);
  const fallbackSchool = useMemo(
    () => schools.find((school) => Boolean(school.slug)),
    [schools],
  );
  const hasSchoolMembership = Boolean(fallbackSchool);

  const learnerTarget = useMemo(() => {
    if (learnerCourse?.org?.slug) {
      return `/school/${learnerCourse.org.slug}`;
    }
    if (fallbackSchool?.slug) {
      return `/school/${fallbackSchool.slug}`;
    }
    return "/";
  }, [fallbackSchool?.slug, learnerCourse]);

  const isLoading = status === "loading" || isCoursesLoading || isSchoolsLoading;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login/student");
      return;
    }

    if (status !== "authenticated" || isLoading || hasRedirectedRef.current) {
      return;
    }

    if (hasLearnerAccess || hasSchoolMembership) {
      hasRedirectedRef.current = true;
      router.replace(learnerTarget);
    }
  }, [hasLearnerAccess, hasSchoolMembership, isLoading, learnerTarget, router, status]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-white" />
      </div>
    );
  }

  if (hasLearnerAccess || hasSchoolMembership) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-5 text-center">
          <p className="text-sm text-emerald-100">Preparing your student workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#14532d_0%,#052e16_40%,#000000_100%)] px-4 py-12 text-white">
      <section className="mx-auto w-full max-w-2xl rounded-3xl border border-emerald-400/30 bg-black/45 p-6 md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs uppercase tracking-wide text-emerald-200">
          <GraduationCap size={12} />
          Student access ready
        </div>

        <h1 className="mt-4 text-2xl font-semibold md:text-3xl">No enrolled learner cohorts found yet</h1>
        <p className="mt-3 text-sm text-slate-200 md:text-base">
          Your account is authenticated, but we could not find a learner enrollment for your profile yet.
          Ask your admin for a cohort invite link or wait for your cohort assignment to appear.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {fallbackSchool?.slug && (
            <Link
              href={`/school/${fallbackSchool.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-500/25"
            >
              <Building2 size={14} />
              Open your school
            </Link>
          )}
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-500/25"
          >
            Go to Home
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/access/admin"
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-cyan-500/15 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/25"
          >
            <ArrowRightLeft size={14} />
            Switch to Admin
          </Link>
        </div>
      </section>
    </main>
  );
}
