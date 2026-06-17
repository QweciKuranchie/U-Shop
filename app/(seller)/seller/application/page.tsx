"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

interface ProfileData {
  storeName: string;
  handle: string;
  tier: string;
  status: string;
  rejectionReason: string | null;
  campus: string | null;
  createdAt: string;
}

export default function SellerApplicationPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Resubmission state
  const [showResubmit, setShowResubmit] = useState(false);
  const [kycFiles, setKycFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [resubmitError, setResubmitError] = useState("");
  const [resubmitSuccess, setResubmitSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/seller/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch {
      console.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  }

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

  async function handleResubmit() {
    if (kycFiles.length === 0) return;
    setUploading(true);
    setResubmitError("");

    try {
      // Upload each file first
      const uploadedKeys: string[] = [];
      for (const file of kycFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/seller/upload-kyc", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          setResubmitError(data.error || "Upload failed");
          setUploading(false);
          return;
        }

        const data = await res.json();
        uploadedKeys.push(data.s3Key);
      }

      // Then resubmit
      const res = await fetch("/api/seller/resubmit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kycDocKeys: uploadedKeys }),
      });

      if (res.ok) {
        setResubmitSuccess(true);
        setShowResubmit(false);
        setKycFiles([]);
        // Refresh profile
        fetchProfile();
      } else {
        const data = await res.json();
        setResubmitError(data.error || "Resubmission failed");
      }
    } catch {
      setResubmitError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-purple/30 border-t-brand-purple rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">No seller profile found.</p>
      </div>
    );
  }

  const isPending = profile.status.startsWith("PENDING_");
  const isRejected = profile.status === "REJECTED";
  const isActive = profile.status === "ACTIVE";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-purple/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-pink/10 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-lg z-10">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" lightMode={false} className="mb-3" />
          <p className="text-slate-400 text-sm">Seller Application</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Store Info Header */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center text-xl font-black text-white">
              {profile.storeName.charAt(0)}
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-white">{profile.storeName}</h2>
              <span className="text-xs text-slate-500">@{profile.handle}</span>
            </div>
          </div>

          {/* ── PENDING STATUS ────────────────────────────────── */}
          {isPending && (
            <div className="text-center py-6">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-amber-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                <div className="absolute inset-3 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <span className="text-2xl">⏳</span>
                </div>
              </div>
              <h3 className="font-display font-bold text-xl text-white mb-2">Under Review</h3>
              <p className="text-sm text-slate-400 font-light mb-6 leading-relaxed">
                Your application is being reviewed by our team. This typically takes
                <span className="text-white font-semibold"> 24–48 hours</span>.
              </p>
              <div className="bg-slate-950/60 border border-white/5 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Tier</span>
                    <span className="text-xs text-white">{profile.tier}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Applied</span>
                    <span className="text-xs text-white">
                      {new Date(profile.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── REJECTED STATUS ───────────────────────────────── */}
          {isRejected && !resubmitSuccess && (
            <div className="py-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-3xl mx-auto mb-4">
                  ✕
                </div>
                <h3 className="font-display font-bold text-xl text-white mb-2">Application Rejected</h3>
              </div>

              {/* Rejection reason */}
              {profile.rejectionReason && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 mb-6">
                  <span className="text-[10px] text-red-400 uppercase font-bold block mb-2">Reason for Rejection</span>
                  <p className="text-sm text-slate-300 font-light leading-relaxed">{profile.rejectionReason}</p>
                </div>
              )}

              {/* Resubmit CTA */}
              {!showResubmit ? (
                <button
                  onClick={() => setShowResubmit(true)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-semibold text-sm transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                >
                  Fix & Resubmit Documents
                </button>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-display font-bold text-sm text-white">Upload New Documents</h4>

                  {resubmitError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
                      {resubmitError}
                    </div>
                  )}

                  {/* Drop zone */}
                  <label className="block w-full border-2 border-dashed border-white/10 hover:border-brand-purple/40 rounded-2xl p-8 text-center cursor-pointer transition-all group">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">📄</div>
                    <p className="text-xs text-slate-400">
                      <span className="text-brand-pink font-semibold">Click to browse</span> or drag files here
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">JPEG, PNG, or WEBP · Max 5MB</p>
                  </label>

                  {/* File list */}
                  {kycFiles.length > 0 && (
                    <div className="space-y-2">
                      {kycFiles.map((file, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-sm">📎</span>
                            <div className="min-w-0">
                              <p className="text-xs text-white truncate">{file.name}</p>
                              <p className="text-[10px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button onClick={() => removeFile(i)} className="text-xs text-red-400 hover:text-red-300 transition ml-2">
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleResubmit}
                      disabled={uploading || kycFiles.length === 0}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-semibold text-xs transition-all disabled:opacity-50 flex justify-center items-center"
                    >
                      {uploading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Resubmit"
                      )}
                    </button>
                    <button
                      onClick={() => { setShowResubmit(false); setKycFiles([]); setResubmitError(""); }}
                      className="py-3 px-5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── RESUBMIT SUCCESS ──────────────────────────────── */}
          {resubmitSuccess && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-3xl mx-auto mb-4 animate-bounce">
                ✓
              </div>
              <h3 className="font-display font-bold text-xl text-white mb-2">Resubmitted!</h3>
              <p className="text-sm text-slate-400 font-light">
                Your documents have been resubmitted. Our team will review them shortly.
              </p>
            </div>
          )}

          {/* ── ACTIVE STATUS ─────────────────────────────────── */}
          {isActive && (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-4xl mx-auto mb-6 animate-bounce">
                🎉
              </div>
              <h3 className="font-display font-bold text-2xl text-white mb-2">You&apos;re Approved!</h3>
              <p className="text-sm text-slate-400 font-light mb-8 leading-relaxed">
                Your store is live. Start adding products and making sales!
              </p>

              <div className="space-y-3">
                <Link
                  href={`/store/${profile.handle}`}
                  className="block w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-semibold text-sm transition-all hover:scale-[1.02] shadow-lg"
                >
                  Visit Your Store →
                </Link>
                <Link
                  href="/seller/dashboard"
                  className="block w-full py-3.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 font-semibold text-sm hover:text-white hover:border-white/20 transition-all"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
