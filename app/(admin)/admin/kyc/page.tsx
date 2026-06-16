"use client";

import React, { useState, useEffect } from "react";
import Logo from "@/components/Logo";
import Link from "next/link";

interface SellerApplication {
  id: string;
  storeName: string;
  handle: string;
  tier: string;
  campus: string | null;
  status: string;
  kycDocKeys: string[];
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    email: string;
  };
}

export default function AdminKYCPage() {
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [docUrls, setDocUrls] = useState<Record<string, string>>({});
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ id: string; msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    try {
      const res = await fetch("/api/kyc/list");
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch {
      console.error("Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  }

  async function handleViewDocument(s3Key: string) {
    if (docUrls[s3Key]) return; // Already loaded
    setLoadingDoc(s3Key);
    try {
      const res = await fetch("/api/kyc/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ s3Key }),
      });
      if (res.ok) {
        const { url } = await res.json();
        setDocUrls((prev) => ({ ...prev, [s3Key]: url }));
      }
    } catch {
      console.error("Failed to get presigned URL");
    } finally {
      setLoadingDoc(null);
    }
  }

  async function handleApprove(sellerProfileId: string) {
    setActionLoading(sellerProfileId);
    try {
      const res = await fetch("/api/kyc/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerProfileId }),
      });
      if (res.ok) {
        setActionMessage({ id: sellerProfileId, msg: "Seller approved!", type: "success" });
        setApplications((prev) => prev.filter((a) => a.id !== sellerProfileId));
      } else {
        const data = await res.json();
        setActionMessage({ id: sellerProfileId, msg: data.error || "Failed to approve", type: "error" });
      }
    } catch {
      setActionMessage({ id: sellerProfileId, msg: "Network error", type: "error" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(sellerProfileId: string) {
    if (!rejectReason.trim()) return;
    setActionLoading(sellerProfileId);
    try {
      const res = await fetch("/api/kyc/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerProfileId, reason: rejectReason }),
      });
      if (res.ok) {
        setActionMessage({ id: sellerProfileId, msg: "Seller rejected", type: "success" });
        setApplications((prev) => prev.filter((a) => a.id !== sellerProfileId));
        setRejectingId(null);
        setRejectReason("");
      } else {
        const data = await res.json();
        setActionMessage({ id: sellerProfileId, msg: data.error || "Failed to reject", type: "error" });
      }
    } catch {
      setActionMessage({ id: sellerProfileId, msg: "Network error", type: "error" });
    } finally {
      setActionLoading(null);
    }
  }

  const tierBadge: Record<string, { label: string; color: string }> = {
    STUDENT: { label: "Student", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    BUSINESS: { label: "Business", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    INDIVIDUAL: { label: "Individual", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  };

  const isResubmission = (app: SellerApplication) => {
    return app.updatedAt !== app.createdAt && app.status.startsWith("PENDING_");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Logo size="md" lightMode={false} />
            </Link>
            <div className="h-5 w-px bg-white/10" />
            <h1 className="font-display font-bold text-lg">KYC Review Queue</h1>
          </div>
          <Link href="/admin/dashboard" className="text-xs text-slate-400 hover:text-white transition">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Stats */}
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl px-5 py-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pending</span>
            <span className="font-display font-black text-2xl text-white">{applications.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-purple/30 border-t-brand-purple rounded-full animate-spin" />
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-slate-900/30 border border-dashed border-white/10 rounded-2xl p-16 text-center">
            <div className="text-4xl mb-4">✅</div>
            <p className="text-slate-400 font-light">No pending applications. All caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all"
              >
                {/* Row Header */}
                <button
                  onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                  className="w-full p-5 flex items-center justify-between gap-4 text-left"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple/30 to-brand-pink/30 flex items-center justify-center text-lg font-black shrink-0">
                      {app.storeName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-bold text-white truncate">{app.storeName}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tierBadge[app.tier]?.color || ""}`}>
                          {tierBadge[app.tier]?.label || app.tier}
                        </span>
                        {isResubmission(app) && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            Resubmission
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span>@{app.handle}</span>
                        <span>{app.user.email}</span>
                        {app.campus && <span>📍 {app.campus}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-slate-500">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                    <svg
                      className={`w-4 h-4 text-slate-500 transition-transform ${expandedId === app.id ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded Panel */}
                {expandedId === app.id && (
                  <div className="px-5 pb-5 pt-0 border-t border-white/5">
                    {/* Action feedback */}
                    {actionMessage?.id === app.id && (
                      <div className={`p-3 rounded-xl text-xs mb-4 ${actionMessage.type === "success" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
                        {actionMessage.msg}
                      </div>
                    )}

                    {/* Applicant Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 mt-4">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Applicant</span>
                        <span className="text-sm text-white">{app.user.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Email</span>
                        <span className="text-sm text-white">{app.user.email}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Tier</span>
                        <span className="text-sm text-white">{app.tier}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Applied</span>
                        <span className="text-sm text-white">
                          {new Date(app.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* KYC Documents */}
                    <div className="mb-6">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                        KYC Documents ({app.kycDocKeys.length})
                      </h4>
                      <div className="space-y-3">
                        {app.kycDocKeys.map((key, idx) => (
                          <div key={key} className="bg-slate-950/60 border border-white/5 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-slate-400 font-mono truncate">
                                Document {idx + 1}: {key.split("/").pop()}
                              </span>
                              <button
                                onClick={() => handleViewDocument(key)}
                                disabled={loadingDoc === key}
                                className="text-[10px] font-bold text-brand-pink hover:text-white transition px-3 py-1 bg-brand-pink/10 rounded-lg border border-brand-pink/20 disabled:opacity-50"
                              >
                                {loadingDoc === key ? "Loading..." : docUrls[key] ? "Loaded ✓" : "View Document"}
                              </button>
                            </div>
                            {docUrls[key] && (
                              <div className="mt-3 rounded-xl overflow-hidden border border-white/5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={docUrls[key]}
                                  alt={`KYC Document ${idx + 1}`}
                                  className="w-full max-h-96 object-contain bg-slate-900"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                      <button
                        onClick={() => handleApprove(app.id)}
                        disabled={actionLoading === app.id}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition disabled:opacity-50"
                      >
                        {actionLoading === app.id ? "Processing..." : "✓ Approve Seller"}
                      </button>

                      {rejectingId === app.id ? (
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            placeholder="Rejection reason..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50"
                          />
                          <button
                            onClick={() => handleReject(app.id)}
                            disabled={!rejectReason.trim() || actionLoading === app.id}
                            className="py-2 px-4 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl transition disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => { setRejectingId(null); setRejectReason(""); }}
                            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRejectingId(app.id)}
                          className="flex-1 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-semibold text-xs rounded-xl border border-red-600/30 transition"
                        >
                          ✕ Reject
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
