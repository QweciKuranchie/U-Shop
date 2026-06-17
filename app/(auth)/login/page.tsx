"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { authClient } from "@/lib/auth-client";
import { getSafeRedirectPath } from "@/lib/redirects";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tabs: "buyer" | "seller" | "rider" | "admin"
  const [activeTab, setActiveTab] = useState<"buyer" | "seller" | "rider" | "admin">("buyer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Check if logout was passed
    const logout = searchParams.get("logout");
    if (logout === "true") {
      authClient.signOut().then(() => {
        router.replace("/login");
      });
      return;
    }

    // Read optional error search param (e.g. unauthorized redirect)
    const error = searchParams.get("error");
    if (error === "unauthorized") {
      setErrorMsg("You do not have permission to access that section. Please log in with the correct role.");
    } else if (error === "email-not-verified") {
      setErrorMsg("Your email address is not verified. Please check your inbox for the verification link.");
    }

    // Check if redirect tab was passed
    const tabParam = searchParams.get("tab");
    if (tabParam === "seller") setActiveTab("seller");
    else if (tabParam === "rider") setActiveTab("rider");
    else if (tabParam === "admin") setActiveTab("admin");
  }, [searchParams, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        if (error.code === "EMAIL_NOT_VERIFIED") {
          setErrorMsg("Your email address is not verified. Please check your inbox for the verification link.");
        } else {
          setErrorMsg(error.message || "Invalid credentials. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      const role = (data?.user as { role?: string } | undefined)?.role;
      const callbackUrl = searchParams.get("callbackUrl");

      setIsLoading(false);

      // Define default destination based on role
      let defaultDestination = "/account";
      if (role === "admin") {
        defaultDestination = "/admin/dashboard";
      } else if (role === "seller") {
        defaultDestination = "/seller/dashboard";
      } else if (role === "rider") {
        defaultDestination = "/rider";
      }

      const safeRedirect = getSafeRedirectPath(callbackUrl, defaultDestination);

      // Check if safeRedirect matches the role restrictions.
      if (safeRedirect.startsWith("/admin") && role !== "admin") {
        router.push("/unauthorized");
      } else if (safeRedirect.startsWith("/seller") && role !== "seller") {
        const isApplicationRedirect = safeRedirect === "/seller/application" || safeRedirect.startsWith("/seller/application/");
        let allowed = false;
        if (isApplicationRedirect) {
          try {
            const res = await fetch("/api/seller/profile");
            if (res.ok) {
              const { profile } = await res.json();
              if (profile && (profile.status.startsWith("PENDING_") || profile.status === "REJECTED")) {
                allowed = true;
              }
            }
          } catch (e) {
            console.error("Failed to fetch seller profile at login", e);
          }
        }
        if (allowed) {
          router.push(safeRedirect);
        } else {
          router.push("/unauthorized");
        }
      } else if (safeRedirect.startsWith("/rider") && role !== "rider") {
        router.push("/unauthorized");
      } else {
        router.push(safeRedirect);
      }
    } catch {
      setErrorMsg("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  // Accent styling based on selected role
  const getThemeConfig = () => {
    switch (activeTab) {
      case "buyer":
        return {
          accent: "from-blue-500 to-indigo-600",
          shadow: "shadow-blue-950/20",
          border: "border-blue-500/20",
          glow: "bg-blue-500/10",
          textColor: "text-blue-400",
        };
      case "seller":
        return {
          accent: "from-brand-purple to-brand-pink",
          shadow: "shadow-brand-purple/20",
          border: "border-brand-purple/20",
          glow: "bg-brand-purple/10",
          textColor: "text-brand-pink",
        };
      case "rider":
        return {
          accent: "from-emerald-500 to-teal-600",
          shadow: "shadow-emerald-950/20",
          border: "border-emerald-500/20",
          glow: "bg-emerald-500/10",
          textColor: "text-emerald-400",
        };
      case "admin":
        return {
          accent: "from-brand-red to-rose-600",
          shadow: "shadow-rose-950/20",
          border: "border-brand-red/20",
          glow: "bg-brand-red/10",
          textColor: "text-brand-red",
        };
    }
  };

  const theme = getThemeConfig();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-purple/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-pink/10 blur-[130px] pointer-events-none" />

      {/* Glow highlight reflecting active tab */}
      <div className={`absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full ${theme.glow} blur-[120px] transition-all duration-500 pointer-events-none`} />

      <div className="w-full max-w-md z-10">
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" lightMode={false} className="mb-3" />
          <p className="text-slate-400 text-sm mt-1">Campus Marketplace System</p>
        </div>

        {/* Login Container (Glassmorphic) */}
        <div className={`w-full bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl transition-all duration-300 ${theme.shadow}`}>

          {/* Tab Selector */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 rounded-2xl mb-6 border border-white/5">
            {(["buyer", "seller", "rider", "admin"] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => {
                  setActiveTab(role);
                  setErrorMsg("");
                }}
                className={`py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-200 ${
                  activeTab === role
                    ? `bg-gradient-to-r ${theme.accent} text-white shadow-md`
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h2 className="font-display font-bold text-2xl text-white">
              Portal Access
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-light">
              Logging in as a <span className={`font-semibold ${theme.textColor}`}>{activeTab}</span> user.
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 bg-brand-red/10 border border-brand-red/30 rounded-2xl text-xs text-brand-red leading-relaxed mb-6">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Campus Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={activeTab === "admin" ? "admin@ushop.com" : "student@ug.edu.gh"}
                className="w-full bg-slate-950 border border-white/10 focus:border-brand-pink/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all duration-200 shadow-inner"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Secret Password
                </label>
                <a href="#" className={`text-xs ${theme.textColor} hover:underline font-medium`}>
                  Forgot Password?
                </a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-white/10 focus:border-brand-pink/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all duration-200 shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl bg-gradient-to-r ${theme.accent} text-white font-semibold text-sm transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 flex justify-center items-center`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                `Launch ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Portal`
              )}
            </button>
          </form>

          {activeTab !== "admin" && (
            <div className="text-center mt-6 pt-6 border-t border-white/5">
              <span className="text-xs text-slate-400 font-light">
                Don&apos;t have an account?{" "}
                <Link href="/register" className={`font-semibold ${theme.textColor} hover:underline`}>
                  Create store/register
                </Link>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </React.Suspense>
  );
}
