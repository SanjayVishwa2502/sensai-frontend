"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { ArrowLeft, ArrowRight, GraduationCap, ShieldCheck } from "lucide-react";

const ADMIN_LOGIN_PASSCODE = "100000";

type LoginRole = "admin" | "student";

const roleConfig: Record<LoginRole, {
  title: string;
  subtitle: string;
  accent: string;
  cardClass: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  fallbackCallback: string;
}> = {
  admin: {
    title: "Admin / Mentor Access",
    subtitle: "Open the intervention command center and cohort intelligence workspace.",
    accent: "text-cyan-300",
    cardClass: "border-cyan-400/30 bg-cyan-500/10",
    icon: ShieldCheck,
    fallbackCallback: "/access/admin",
  },
  student: {
    title: "Student Access",
    subtitle: "Open your learning workspace with quests, nudges, and progress coaching.",
    accent: "text-emerald-300",
    cardClass: "border-emerald-400/30 bg-emerald-500/10",
    icon: GraduationCap,
    fallbackCallback: "/access/student",
  },
};

function getRole(value: string | undefined): LoginRole | null {
  if (value === "admin" || value === "student") {
    return value;
  }
  return null;
}

function normalizeCallbackPath(rawValue: string | null): string | null {
  if (!rawValue) {
    return null;
  }

  let decodedValue = rawValue;
  try {
    decodedValue = decodeURIComponent(rawValue);
  } catch {
    decodedValue = rawValue;
  }

  try {
    const parsed = new URL(decodedValue, "https://sensai.local");
    const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return normalized.startsWith("/") ? normalized : null;
  } catch {
    return null;
  }
}

function shouldUseRoleFallback(path: string | null): boolean {
  if (!path) {
    return true;
  }

  const normalizedPath = path.toLowerCase();
  return normalizedPath === "/" || normalizedPath.startsWith("/login") || normalizedPath.startsWith("/access");
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function LoginRoleContent() {
  const params = useParams<{ role: string }>();
  const rawRole = typeof params?.role === "string" ? params.role.toLowerCase() : undefined;
  const role = getRole(rawRole);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [adminPasscode, setAdminPasscode] = useState("");
  const [adminPassError, setAdminPassError] = useState("");

  const queryCallbackUrl = searchParams.get("callbackUrl") || undefined;
  const normalizedCallbackPath = useMemo(
    () => normalizeCallbackPath(queryCallbackUrl || null),
    [queryCallbackUrl],
  );

  const callbackUrl = useMemo(() => {
    if (role && !shouldUseRoleFallback(normalizedCallbackPath)) {
      return normalizedCallbackPath as string;
    }

    if (role) {
      return roleConfig[role].fallbackCallback;
    }

    if (normalizedCallbackPath) {
      return normalizedCallbackPath;
    }

    return "/";
  }, [normalizedCallbackPath, role]);

  const roleSelectionHref = useMemo(() => {
    if (!queryCallbackUrl) {
      return "/login";
    }

    const params = new URLSearchParams();
    params.set("callbackUrl", queryCallbackUrl);
    return `/login?${params.toString()}`;
  }, [queryCallbackUrl]);

  const switchRoleHref = useMemo(() => {
    if (!role) {
      return roleSelectionHref;
    }

    const nextRole: LoginRole = role === "admin" ? "student" : "admin";
    const params = new URLSearchParams();

    if (queryCallbackUrl) {
      params.set("callbackUrl", queryCallbackUrl);
    }

    const query = params.toString();
    return query ? `/login/${nextRole}?${query}` : `/login/${nextRole}`;
  }, [role, roleSelectionHref, queryCallbackUrl]);

  useEffect(() => {
    if (!role) {
      router.replace(roleSelectionHref);
      return;
    }

    if (session) {
      router.push(callbackUrl);
    }
  }, [session, callbackUrl, role, router, roleSelectionHref]);

  const handleGoogleLogin = () => {
    if (!role) {
      return;
    }

    if (role === "admin" && adminPasscode.trim() !== ADMIN_LOGIN_PASSCODE) {
      setAdminPassError("Invalid admin passcode");
      return;
    }

    setAdminPassError("");

    signIn("google", { callbackUrl });
  };

  if (status === "loading" || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-white" />
      </div>
    );
  }

  const selectedRole = roleConfig[role];
  const RoleIcon = selectedRole.icon;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_15%,#164e63_0%,#020617_45%,#000000_100%)] px-4 py-12 text-white">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href={roleSelectionHref}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90 transition-colors hover:bg-white/15"
          >
            <ArrowLeft size={14} />
            Change role
          </Link>

          <Link
            href={switchRoleHref}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-transparent px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
          >
            Switch to {role === "admin" ? "Student" : "Admin"}
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className={`rounded-3xl border p-6 md:p-8 ${selectedRole.cardClass}`}>
          <div className="grid gap-8 md:grid-cols-12 md:items-center">
            <div className="md:col-span-7">
              <Image
                src="/images/sensai-logo-dark.svg"
                alt="SensAI Logo"
                width={200}
                height={70}
                className="h-auto w-[160px] md:w-[200px]"
                style={{ width: "auto", height: "auto" }}
                priority
              />

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3 py-1 text-xs uppercase tracking-wide text-white/80">
                <RoleIcon size={13} className={selectedRole.accent} />
                Role-first login
              </div>

              <h1 className="mt-4 text-3xl font-semibold md:text-4xl">{selectedRole.title}</h1>
              <p className="mt-3 max-w-xl text-sm text-slate-200 md:text-base">{selectedRole.subtitle}</p>
            </div>

            <div className="md:col-span-5">
              {role === "admin" && (
                <div className="mb-3">
                  <label htmlFor="admin-passcode" className="mb-2 block text-xs text-slate-200">
                    Admin passcode
                  </label>
                  <input
                    id="admin-passcode"
                    type="password"
                    value={adminPasscode}
                    onChange={(event) => {
                      setAdminPasscode(event.target.value);
                      if (adminPassError) {
                        setAdminPassError("");
                      }
                    }}
                    placeholder="Enter admin passcode"
                    className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-400 focus:border-cyan-400"
                  />
                  {adminPassError && (
                    <p className="mt-1.5 text-xs text-rose-300">{adminPassError}</p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex w-full cursor-pointer items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-3 text-black transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <p className="mt-4 text-xs text-slate-300">
                You will be redirected to the {role === "admin" ? "Admin/Mentor" : "Student"} workspace after authentication.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-5 text-xs text-gray-500">
          By continuing, you acknowledge that you understand and agree to the{" "}
          <Link
            href="https://hyperverge.notion.site/SensAI-Terms-of-Use-1627e7c237cb80dc9bd2dac685d42f31?pvs=73"
            className="text-cyan-300 hover:underline"
          >
            Terms & Conditions
          </Link>{" "}
          and{" "}
          <Link
            href="https://hyperverge.notion.site/SensAI-Privacy-Policy-1627e7c237cb80e5babae67e64642f27"
            className="text-cyan-300 hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default function RoleLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black px-4">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-white" />
        </div>
      }
    >
      <LoginRoleContent />
    </Suspense>
  );
}
