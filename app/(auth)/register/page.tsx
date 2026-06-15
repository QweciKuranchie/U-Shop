"use client";

import React, { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (error) {
        setErrorMsg(error.message || "Registration failed. Please try again.");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-purple/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-pink/10 blur-[130px] pointer-events-none" />

      {/* Glow highlight */}
      <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" lightMode={false} className="mb-3" />
          <p className="text-slate-400 text-sm mt-1">Campus Marketplace System</p>
        </div>

        {/* Register Container (Glassmorphic) */}
        <div className="w-full bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl shadow-blue-950/20 transition-all duration-300">
          {success ? (
            <div className="py-6 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/25 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-3xl mx-auto animate-bounce">
                ✓
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-bold text-2xl text-white">Verify Your Email</h3>
                <p className="text-slate-400 text-sm font-light leading-relaxed">
                  We have sent a verification link to <span className="font-semibold text-white">{email}</span>.
                  Please check your inbox and click the link to activate your account before logging in.
                </p>
              </div>
              <div className="pt-6 border-t border-white/5">
                <Link
                  href="/login"
                  className="inline-block w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-sm rounded-xl shadow-lg transition duration-200"
                >
                  Go to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="font-display font-bold text-2xl text-white">
                  Buyer Registration
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-light">
                  Create an account to browse deals and shop from campus vendors.
                </p>
              </div>

              {errorMsg && (
                <div className="p-4 bg-brand-red/10 border border-brand-red/30 rounded-2xl text-xs text-brand-red leading-relaxed mb-6">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-950 border border-white/10 focus:border-brand-pink/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-650 focus:outline-none transition-all duration-200 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Campus Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@ug.edu.gh"
                    className="w-full bg-slate-950 border border-white/10 focus:border-brand-pink/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-650 focus:outline-none transition-all duration-200 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Password (Min 8 Characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-white/10 focus:border-brand-pink/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-650 focus:outline-none transition-all duration-200 shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-sm transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 flex justify-center items-center"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Register Buyer Account"
                  )}
                </button>
              </form>

              <div className="text-center mt-6 pt-6 border-t border-white/5">
                <span className="text-xs text-slate-400 font-light">
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-blue-400 hover:underline">
                    Sign In
                  </Link>
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
