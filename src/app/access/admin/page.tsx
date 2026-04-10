"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useRef } from "react";
import { ArrowRightLeft, ShieldAlert, ShieldCheck } from "lucide-react";

import { useCourses, useSchools } from "@/lib/api";

export default function AdminAccessPage() {
  const router = useRouter();
  const { status } = useSession();
  const { courses, isLoading: isCoursesLoading } = useCourses();
  const { schools, isLoading: isSchoolsLoading } = useSchools();
  const hasRedirectedRef = useRef(false);

  const adminSchoolId = useMemo(() => {
    const schoolWithAdminRole = schools.find((school) => {
      const role = (school.role || "").toLowerCase();
      return role === "owner" || role === "admin";
    });

    if (schoolWithAdminRole?.id) {
      return String(schoolWithAdminRole.id);
    }

    const adminCourse = courses.find((course) => {
      const role = (course.role || "").toLowerCase();
      return role === "admin";
    });

    if (adminCourse?.org_id) {
      return String(adminCourse.org_id);
    }

    return null;
  }, [courses, schools]);

  const isLoading = status === "loading" || isCoursesLoading || isSchoolsLoading;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login/admin");
      return;
    }

    if (status !== "authenticated" || isLoading || hasRedirectedRef.current) {
      return;
    }

    if (adminSchoolId) {
      hasRedirectedRef.current = true;
      router.replace(`/school/admin/${adminSchoolId}`);
    }
  }, [adminSchoolId, isLoading, router, status]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-white" />
      </div>
    );
  }

  if (adminSchoolId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-6 py-5 text-center">
          <p className="text-sm text-cyan-100">Preparing your admin command center...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#164e63_0%,#020617_45%,#000000_100%)] px-4 py-12 text-white">
      <section className="mx-auto w-full max-w-2xl rounded-3xl border border-red-400/30 bg-black/45 p-6 md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-red-400/40 bg-red-500/15 px-3 py-1 text-xs uppercase tracking-wide text-red-200">
          <ShieldAlert size={12} />
          Admin access unavailable
        </div>

        <h1 className="mt-4 text-2xl font-semibold md:text-3xl">No admin or owner permissions found</h1>
        <p className="mt-3 text-sm text-slate-200 md:text-base">
          Your account is authenticated, but this workspace does not currently include an admin role in any school.
          You can continue as a student or return to role selection.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/access/student"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-500/25"
          >
            <ArrowRightLeft size={14} />
            Continue as Student
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-cyan-500/15 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/25"
          >
            <ShieldCheck size={14} />
            Change Role
          </Link>
        </div>
      </section>
    </main>
  );
}
