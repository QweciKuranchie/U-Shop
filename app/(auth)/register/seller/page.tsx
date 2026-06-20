"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { authClient } from "@/lib/auth-client";

type Tier = "STUDENT" | "BUSINESS" | "INDIVIDUAL";
type Step = "tier" | "form" | "otp" | "kyc" | "done";

interface Institution {
  id: string;
  name: string;
  domains: string[];
}

const TIER_INFO: Record<Tier, { emoji: string; title: string; desc: string; commission: string; docLabel: string }> = {
  STUDENT: {
    emoji: "🎓",
    title: "Student Seller",
    desc: "For students at approved Ghanaian institutions. Requires .edu.gh email verification.",
    commission: "5%",
    docLabel: "Upload Student ID Card",
  },
  BUSINESS: {
    emoji: "🏢",
    title: "Business Seller",
    desc: "For registered businesses. Upload your business registration certificate.",
    commission: "8%",
    docLabel: "Upload Business Registration Certificate",
  },
  INDIVIDUAL: {
    emoji: "👤",
    title: "Individual Seller",
    desc: "For individual sellers. Upload a valid Ghana Card or Passport.",
    commission: "8%",
    docLabel: "Upload Ghana Card / Passport",
  },
};

export default function SellerRegisterPage() {
  const [step, setStep] = useState<Step>("tier");
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [handle, setHandle] = useState("");
  const [campus, setCampus] = useState("");
  const [bio, setBio] = useState("");
  const [tagline, setTagline] = useState("");

  // Handle validation
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [checkingHandle, setCheckingHandle] = useState(false);

  // Institutions
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  // OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpLocked, setOtpLocked] = useState(false);
  const [lockoutEndsAt, setLockoutEndsAt] = useState<Date | null>(null);
  const [lockoutCountdown, setLockoutCountdown] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);

  // KYC
  const [kycFiles, setKycFiles] = useState<File[]>([]);
  const [uploadingKyc, setUploadingKyc] = useState(false);
  const [onboardingToken, setOnboardingToken] = useState("");

  // General
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch institutions on mount
  useEffect(() => {
    fetch("/api/seller/institutions")
      .then((r) => r.json())
      .then((data) => setInstitutions(data.institutions || []))
      .catch(() => {});
  }, []);

  // Handle uniqueness check (debounced)
  const checkHandle = useCallback(async (h: string) => {
    if (h.length < 3) {
      setHandleAvailable(null);
      return;
    }
    setCheckingHandle(true);
    try {
      const res = await fetch(`/api/seller/check-handle?handle=${encodeURIComponent(h)}`);
      if (res.ok) {
        const data = await res.json();
        setHandleAvailable(data.available);
      }
    } catch {
      setHandleAvailable(null);
    } finally {
      setCheckingHandle(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (handle.length >= 3) checkHandle(handle);
    }, 500);
    return () => clearTimeout(timer);
  }, [handle, checkHandle]);

  // Lockout countdown timer
  useEffect(() => {
    if (!lockoutEndsAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockoutEndsAt.getTime() - Date.now()) / 1000));
      setLockoutCountdown(remaining);
      if (remaining === 0) {
        setOtpLocked(false);
        setLockoutEndsAt(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutEndsAt]);

  // ── Step 1: Tier Selection ──────────────────────────────────────
  function handleTierSelect(tier: Tier) {
    setSelectedTier(tier);
    setStep("form");
  }

  // ── Step 2: Registration Form Submit ────────────────────────────
  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/seller/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          handle: handle.toLowerCase(),
          storeName,
          tier: selectedTier,
          campus: selectedTier === "STUDENT" ? campus : undefined,
          bio: bio || undefined,
          tagline: tagline || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Registration failed");
        setIsLoading(false);
        return;
      }

      // userId available as data.userId if needed later

      if (data.otpRequired) {
        if (data.onboardingToken) {
          setOnboardingToken(data.onboardingToken);
        }
        setStep("otp");
      } else {
        if (data.onboardingToken) {
          setOnboardingToken(data.onboardingToken);
        }
        setStep("kyc");
      }
    } catch {
      setErrorMsg("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  // ── Step 3: OTP Verification ────────────────────────────────────
  function handleOtpChange(index: number, value: string) {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length !== 6) return;

    setIsLoading(true);
    setOtpError("");

    try {
      const res = await fetch("/api/seller/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpValue }),
      });

      const data = await res.json();

      if (data.verified) {
        try {
          await authClient.signIn.email({
            email,
            password,
            rememberMe: false,
          });
        } catch (err) {
          console.error("Auto-login failed:", err);
        }
        setStep("kyc");
      } else if (data.reason === "OTP_LOCKED") {
        setOtpLocked(true);
        setLockoutEndsAt(new Date(data.lockoutEndsAt));
        setOtpError(data.message);
      } else if (data.reason === "OTP_EXPIRED") {
        setOtpError(data.message);
      } else {
        setAttemptsRemaining(data.attemptsRemaining ?? attemptsRemaining - 1);
        setOtpError(data.message || "Invalid OTP");
        setOtp(["", "", "", "", "", ""]);
      }
    } catch {
      setOtpError("Network error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendOtp() {
    setIsLoading(true);
    setOtpError("");
    try {
      const res = await fetch("/api/seller/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtp(["", "", "", "", "", ""]);
        setOtpLocked(false);
        setLockoutEndsAt(null);
        setLockoutCountdown(0);
        setAttemptsRemaining(3);
        setOtpError("A new OTP code has been sent to your email.");
      } else {
        setOtpError(data.error || "Failed to resend OTP");
      }
    } catch {
      setOtpError("Network error. Failed to resend OTP.");
    } finally {
      setIsLoading(false);
    }
  }

  // ── Step 4: KYC Upload ──────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((f) => {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      return validTypes.includes(f.type) && f.size <= 5 * 1024 * 1024;
    });
    setKycFiles((prev) => [...prev, ...validFiles]);
  }

  function removeFile(index: number) {
    setKycFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleKycUpload() {
    if (kycFiles.length === 0) return;
    setUploadingKyc(true);
    setErrorMsg("");

    try {
      for (const file of kycFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/seller/upload-kyc", {
          method: "POST",
          headers: {
            "x-onboarding-token": onboardingToken || "",
          },
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          setErrorMsg(data.error || "Upload failed");
          setUploadingKyc(false);
          return;
        }

        await res.json(); // consume response
      }

      setStep("done");
    } catch {
      setErrorMsg("Upload failed. Please try again.");
    } finally {
      setUploadingKyc(false);
    }
  }

  // ── Accent colors ──────────────────────────────────────────────
  const accentGradient = "from-brand-purple to-brand-pink";

  const stepIndicator = (
    <div className="flex items-center gap-2 mb-8 justify-center">
      {(["tier", "form", ...(selectedTier === "STUDENT" ? ["otp"] : []), "kyc", "done"] as Step[]).map((s, i) => {
        const steps: Step[] = ["tier", "form", ...(selectedTier === "STUDENT" ? ["otp" as Step] : []), "kyc", "done"];
        const currentIdx = steps.indexOf(step);
        const stepIdx = i;
        const isActive = stepIdx <= currentIdx;

        return (
          <React.Fragment key={s}>
            {i > 0 && (
              <div className={`h-px w-8 ${isActive ? "bg-brand-purple" : "bg-white/10"} transition-colors`} />
            )}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                isActive
                  ? "bg-gradient-to-r from-brand-purple to-brand-pink text-white"
                  : "bg-slate-900 border border-white/10 text-slate-500"
              }`}
            >
              {i + 1}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-purple/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-pink/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg z-10">
        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          <Logo size="lg" lightMode={false} className="mb-3" />
          <p className="text-slate-400 text-sm">Become a Seller</p>
        </div>

        {stepIndicator}

        {/* ── STEP: Tier Selection ──────────────────────────────── */}
        {step === "tier" && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-2xl text-white text-center mb-6">
              Choose Your Seller Tier
            </h2>
            {(Object.keys(TIER_INFO) as Tier[]).map((tier) => {
              const info = TIER_INFO[tier];
              return (
                <button
                  key={tier}
                  onClick={() => handleTierSelect(tier)}
                  className="w-full bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-left hover:border-brand-purple/40 hover:shadow-xl hover:shadow-brand-purple/5 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{info.emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display font-bold text-lg text-white group-hover:text-brand-pink transition">
                          {info.title}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {info.commission} commission
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5 font-light leading-relaxed">
                        {info.desc}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}

            <div className="text-center pt-4">
              <Link href="/login" className="text-xs text-slate-400 hover:text-white transition">
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        )}

        {/* ── STEP: Registration Form ──────────────────────────── */}
        {step === "form" && selectedTier && (
          <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep("tier")} className="text-slate-500 hover:text-white transition text-sm">
                ←
              </button>
              <h2 className="font-display font-bold text-xl text-white">
                {TIER_INFO[selectedTier].emoji} {TIER_INFO[selectedTier].title} Registration
              </h2>
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400 mb-6">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Full Name</label>
                <input
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kofi Mensah"
                  className="w-full bg-slate-950 border border-white/10 focus:border-brand-pink/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all shadow-inner"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  {selectedTier === "STUDENT" ? "Campus Email (.edu.gh)" : "Email Address"}
                </label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder={selectedTier === "STUDENT" ? "student@st.ug.edu.gh" : "you@example.com"}
                  className="w-full bg-slate-950 border border-white/10 focus:border-brand-pink/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all shadow-inner"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password (Min 8 Characters)</label>
                <input
                  type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-white/10 focus:border-brand-pink/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all shadow-inner"
                />
              </div>

              {/* Store Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Store Name</label>
                <input
                  type="text" required value={storeName} onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Gadget Zone"
                  className="w-full bg-slate-950 border border-white/10 focus:border-brand-pink/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all shadow-inner"
                />
              </div>

              {/* Handle */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Store Handle</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">@</span>
                  <input
                    type="text" required value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="gadget-zone"
                    className="w-full bg-slate-950 border border-white/10 focus:border-brand-pink/50 rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all shadow-inner"
                  />
                </div>
                {handle.length >= 3 && (
                  <div className="mt-1.5 text-[10px]">
                    {checkingHandle ? (
                      <span className="text-slate-500">Checking...</span>
                    ) : handleAvailable === true ? (
                      <span className="text-emerald-400">✓ Handle available</span>
                    ) : handleAvailable === false ? (
                      <span className="text-red-400">✕ Handle already taken</span>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Campus (Student only) */}
              {selectedTier === "STUDENT" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Campus</label>
                  <select
                    required value={campus} onChange={(e) => setCampus(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 focus:border-brand-pink/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all shadow-inner appearance-none"
                  >
                    <option value="">Select institution...</option>
                    {institutions.map((inst) => (
                      <option key={inst.id} value={inst.name}>{inst.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tagline */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Tagline (Optional)</label>
                <input
                  type="text" value={tagline} onChange={(e) => setTagline(e.target.value)}
                  placeholder="Quality tech at student prices"
                  className="w-full bg-slate-950 border border-white/10 focus:border-brand-pink/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all shadow-inner"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Bio (Optional)</label>
                <textarea
                  value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                  placeholder="Tell buyers about your store..."
                  className="w-full bg-slate-950 border border-white/10 focus:border-brand-pink/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all shadow-inner resize-none"
                />
              </div>

              <button
                type="submit" disabled={isLoading || handleAvailable === false}
                className={`w-full py-3.5 rounded-xl bg-gradient-to-r ${accentGradient} text-white font-semibold text-sm transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 flex justify-center items-center mt-2`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : selectedTier === "STUDENT" ? (
                  "Continue → Verify Email"
                ) : (
                  "Continue → Upload Documents"
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── STEP: OTP Verification ───────────────────────────── */}
        {step === "otp" && (
          <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h2 className="font-display font-bold text-xl text-white text-center mb-2">
              Verify Your Email
            </h2>
            <p className="text-xs text-slate-400 text-center mb-8 font-light">
              Enter the 6-digit OTP sent to <span className="font-semibold text-white">{email}</span>
            </p>

            {otpError && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400 mb-6 text-center">
                {otpError}
              </div>
            )}

            {otpLocked ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">🔒</div>
                <h3 className="font-display font-bold text-lg text-white mb-2">Account Locked</h3>
                <p className="text-xs text-slate-400 mb-4">Too many failed attempts. Please wait:</p>
                <div className="font-display font-black text-4xl text-brand-pink mb-6">
                  {Math.floor(lockoutCountdown / 60)}:{(lockoutCountdown % 60).toString().padStart(2, "0")}
                </div>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-xs text-brand-purple hover:text-brand-pink transition-colors font-medium underline disabled:opacity-50"
                >
                  {isLoading ? "Resending..." : "Resend OTP Code"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleOtpSubmit}>
                <div className="flex justify-center gap-3 mb-6">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value.replace(/\D/g, ""))}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 bg-slate-950 border border-white/10 focus:border-brand-purple/50 rounded-xl text-center text-lg font-bold text-white focus:outline-none transition-all shadow-inner"
                    />
                  ))}
                </div>

                <div className="text-center text-[10px] text-slate-500 mb-6">
                  {attemptsRemaining} attempt{attemptsRemaining !== 1 ? "s" : ""} remaining
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.join("").length !== 6}
                  className={`w-full py-3.5 rounded-xl bg-gradient-to-r ${accentGradient} text-white font-semibold text-sm transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 flex justify-center items-center mb-4`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Verify OTP"
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-xs text-brand-purple hover:text-brand-pink transition-colors font-medium underline disabled:opacity-50"
                  >
                    {isLoading ? "Resending..." : "Resend OTP Code"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ── STEP: KYC Document Upload ────────────────────────── */}
        {step === "kyc" && selectedTier && (
          <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h2 className="font-display font-bold text-xl text-white text-center mb-2">
              Upload KYC Documents
            </h2>
            <p className="text-xs text-slate-400 text-center mb-8 font-light">
              {TIER_INFO[selectedTier].docLabel}
            </p>

            {errorMsg && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400 mb-6">
                {errorMsg}
              </div>
            )}

            {/* Drop zone */}
            <label className="block w-full border-2 border-dashed border-white/10 hover:border-brand-purple/40 rounded-2xl p-10 text-center cursor-pointer transition-all group mb-6">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📄</div>
              <p className="text-xs text-slate-400 font-light">
                Drag & drop or <span className="text-brand-pink font-semibold">click to browse</span>
              </p>
              <p className="text-[10px] text-slate-600 mt-1">JPEG, PNG, or WEBP · Max 5MB per file</p>
            </label>

            {/* File list */}
            {kycFiles.length > 0 && (
              <div className="space-y-2 mb-6">
                {kycFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg">📎</span>
                      <div className="min-w-0">
                        <p className="text-xs text-white truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="text-xs text-red-400 hover:text-red-300 transition shrink-0 ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleKycUpload}
              disabled={uploadingKyc || kycFiles.length === 0}
              className={`w-full py-3.5 rounded-xl bg-gradient-to-r ${accentGradient} text-white font-semibold text-sm transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 flex justify-center items-center`}
            >
              {uploadingKyc ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                `Upload ${kycFiles.length} Document${kycFiles.length !== 1 ? "s" : ""} & Submit`
              )}
            </button>
          </div>
        )}

        {/* ── STEP: Done ───────────────────────────────────────── */}
        {step === "done" && (
          <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-4xl mx-auto mb-6 animate-bounce">
              🎉
            </div>
            <h2 className="font-display font-bold text-2xl text-white mb-2">Application Submitted!</h2>
            <p className="text-sm text-slate-400 font-light mb-8 leading-relaxed">
              Your seller application is now under review. Our team will verify your documents
              and get back to you within <span className="text-white font-semibold">24–48 hours</span>.
            </p>

            <div className="space-y-3">
              <Link
                href="/seller/application"
                className={`block w-full py-3.5 rounded-xl bg-gradient-to-r ${accentGradient} text-white font-semibold text-sm transition-all duration-300 transform hover:scale-[1.02] shadow-lg`}
              >
                Check Application Status
              </Link>
              <Link
                href="/"
                className="block w-full py-3.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 font-semibold text-sm hover:text-white hover:border-white/20 transition-all"
              >
                Back to Homepage
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
