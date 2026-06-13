"use client";

import React, { useState } from "react";
import Link from "next/link";

interface DeliveryJob {
  id: string;
  reference: string;
  productTitle: string;
  listingPrice: number;
  deliveryFee: number;
  sellerName: string;
  sellerPhone: string;
  sellerCampus: string;
  buyerName: string;
  buyerPhone: string;
  buyerCampus: string;
  status: "READY_FOR_PICKUP" | "IN_TRANSIT" | "DELIVERED";
  otpCode: string; // The correct OTP for verification
}

const INITIAL_JOBS: DeliveryJob[] = [
  {
    id: "job-1",
    reference: "USH-20260613-748291",
    productTitle: "iPhone 13 Pro (128GB)",
    listingPrice: 6825.0,
    deliveryFee: 25.0,
    sellerName: "Gadget Hub Legon",
    sellerPhone: "+233 24 999 8888",
    sellerCampus: "Legon Main (Sarbah Hall)",
    buyerName: "John Doe",
    buyerPhone: "+233 20 555 4444",
    buyerCampus: "Legon Main (Limann Hall)",
    status: "READY_FOR_PICKUP",
    otpCode: "4829",
  },
  {
    id: "job-2",
    reference: "USH-20260613-918274",
    productTitle: "MacBook Air M1 (2020)",
    listingPrice: 8400.0,
    deliveryFee: 30.0,
    sellerName: "Dorm Deals GH",
    sellerPhone: "+233 27 666 5555",
    sellerCampus: "Legon Main (Pentagon Hostel)",
    buyerName: "Alice Smith",
    buyerPhone: "+233 55 222 1111",
    buyerCampus: "Accra City Campus",
    status: "IN_TRANSIT",
    otpCode: "1928",
  },
  {
    id: "job-3",
    reference: "USH-20260611-394851",
    productTitle: "Sony WH-1000XM4 Headphones",
    listingPrice: 2310.0,
    deliveryFee: 20.0,
    sellerName: "AudioVerse Ghana",
    sellerPhone: "+233 24 111 2222",
    sellerCampus: "Korle-Bu Campus",
    buyerName: "Bob Johnson",
    buyerPhone: "+233 24 444 3333",
    buyerCampus: "Legon Main (Volta Hall)",
    status: "DELIVERED",
    otpCode: "7711",
  }
];

export default function RiderDashboard() {
  const [jobs, setJobs] = useState<DeliveryJob[]>(INITIAL_JOBS);
  const [selectedJob, setSelectedJob] = useState<DeliveryJob | null>(null);
  
  // OTP Verification State
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Transition Job State (Pickup / Set in Transit)
  const handleTransitToggle = (jobId: string) => {
    setJobs(
      jobs.map((job) =>
        job.id === jobId ? { ...job, status: "IN_TRANSIT" } : job
      )
    );
    if (selectedJob && selectedJob.id === jobId) {
      setSelectedJob({ ...selectedJob, status: "IN_TRANSIT" });
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    setIsVerifying(true);
    setOtpError("");

    setTimeout(() => {
      setIsVerifying(false);
      if (otpInput === selectedJob.otpCode) {
        setOtpSuccess(true);
        setJobs(
          jobs.map((job) =>
            job.id === selectedJob.id ? { ...job, status: "DELIVERED" } : job
          )
        );
        setTimeout(() => {
          setOtpSuccess(false);
          setOtpInput("");
          setSelectedJob(null);
        }, 1500);
      } else {
        setOtpError("Invalid verification OTP. Please try again.");
      }
    }, 1000);
  };

  // Stats
  const activeJobs = jobs.filter((j) => j.status !== "DELIVERED");
  const completedCount = jobs.filter((j) => j.status === "DELIVERED").length;
  const earnings = jobs
    .filter((j) => j.status === "DELIVERED")
    .reduce((sum, j) => sum + j.deliveryFee, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-purple/10 blur-[130px] pointer-events-none" />

      {/* Nav */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-pink flex items-center justify-center font-display font-black text-lg shadow-lg shadow-brand-purple/20">
              U
            </div>
            <span className="font-display font-black text-xl tracking-tight">
              U-<span className="text-brand-pink">Shop</span>
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <span className="text-xs bg-slate-900 px-3 py-1 rounded-full border border-white/5 text-emerald-400 font-bold">
              🟢 Active Rider Shift
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-grow w-full z-10">
        
        {/* KPI Panel */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: "My Delivery Earnings", value: `GH₵ ${earnings.toFixed(2)}`, color: "border-emerald-500/20" },
            { label: "Pending Dispatches", value: activeJobs.length, color: "border-brand-purple/20" },
            { label: "Completed Deliveries", value: completedCount, color: "border-white/5" },
          ].map((kpi, idx) => (
            <div
              key={idx}
              className={`bg-slate-900/40 border ${kpi.color} rounded-2xl p-6 backdrop-blur-sm shadow-xl`}
            >
              <span className="text-[10px] text-slate-500 uppercase block tracking-wider font-semibold mb-2">
                {kpi.label}
              </span>
              <p className="font-display font-black text-3xl text-white">
                {kpi.value}
              </p>
            </div>
          ))}
        </section>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Dispatches List (Left Side) */}
          <div className="flex-grow lg:w-2/3">
            <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="font-display font-bold text-2xl mb-6">Active Jobs</h2>
              
              <div className="space-y-4">
                {activeJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => {
                      setSelectedJob(job);
                      setOtpError("");
                      setOtpSuccess(false);
                      setOtpInput("");
                    }}
                    className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      selectedJob?.id === job.id
                        ? "bg-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-950/10"
                        : "bg-slate-950/40 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-500">{job.reference}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          job.status === "READY_FOR_PICKUP"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}>
                          {job.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h4 className="font-display font-bold text-base text-white">{job.productTitle}</h4>
                      <p className="text-xs text-slate-400 font-light">
                        🚚 {job.sellerCampus} &rarr; {job.buyerCampus}
                      </p>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Payout</span>
                        <span className="font-bold text-emerald-400">GH₵ {job.deliveryFee.toFixed(2)}</span>
                      </div>
                      <span className="text-slate-500 text-sm font-semibold">&rarr;</span>
                    </div>
                  </div>
                ))}

                {activeJobs.length === 0 && (
                  <div className="py-12 text-center text-slate-500 font-light">
                    No active dispatches available. You are clear!
                  </div>
                )}
              </div>

              {/* Delivery History */}
              <h3 className="font-display font-bold text-xl mt-10 mb-4">Shift History</h3>
              <div className="space-y-3">
                {jobs.filter((j) => j.status === "DELIVERED").map((job) => (
                  <div
                    key={job.id}
                    className="p-4 bg-slate-950/20 border border-white/5 rounded-xl flex items-center justify-between text-xs text-slate-400"
                  >
                    <div>
                      <span className="font-semibold text-slate-300">{job.productTitle}</span>
                      <span className="mx-2 text-slate-600">|</span>
                      <span>Ref: {job.reference}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-emerald-400 font-bold">GH₵ {job.deliveryFee.toFixed(2)}</span>
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[8px]">
                        Delivered
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Job Details & Action Panel (Right Side) */}
          <div className="w-full lg:w-1/3">
            {selectedJob ? (
              <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 sticky top-28 backdrop-blur-md shadow-2xl space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">{selectedJob.reference}</span>
                    <button
                      onClick={() => setSelectedJob(null)}
                      className="text-slate-500 hover:text-white text-xs font-semibold"
                    >
                      Close ✕
                    </button>
                  </div>
                  <h3 className="font-display font-bold text-xl">{selectedJob.productTitle}</h3>
                </div>

                {/* Seller Info */}
                <div className="p-4 bg-slate-950/60 border border-white/5 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-brand-pink font-bold uppercase tracking-wider">Pickup (Seller)</span>
                    <span className="text-[10px] text-slate-400 font-light">📍 {selectedJob.sellerCampus}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-semibold">{selectedJob.sellerName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{selectedJob.sellerPhone}</p>
                    </div>
                    <a
                      href={`tel:${selectedJob.sellerPhone}`}
                      className="p-2 bg-brand-purple/10 border border-brand-purple/20 text-brand-pink rounded-lg hover:bg-brand-purple hover:text-white transition text-xs font-semibold"
                    >
                      Call Seller
                    </a>
                  </div>
                </div>

                {/* Buyer Info */}
                <div className="p-4 bg-slate-950/60 border border-white/5 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Dropoff (Buyer)</span>
                    <span className="text-[10px] text-slate-400 font-light">📍 {selectedJob.buyerCampus}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-semibold">{selectedJob.buyerName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{selectedJob.buyerPhone}</p>
                    </div>
                    <a
                      href={`https://wa.me/${selectedJob.buyerPhone.replace(/\s+/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white transition text-xs font-semibold"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>

                {/* Action Trigger */}
                {selectedJob.status === "READY_FOR_PICKUP" ? (
                  <button
                    onClick={() => handleTransitToggle(selectedJob.id)}
                    className="w-full py-3.5 bg-gradient-to-r from-brand-purple to-brand-pink text-white font-semibold text-xs rounded-xl shadow-lg transition duration-200"
                  >
                    Confirm Package Pickup
                  </button>
                ) : (
                  /* OTP Delivery Verification Form */
                  <form onSubmit={handleVerifyOtp} className="space-y-4 pt-2 border-t border-white/5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Enter 4-Digit Buyer OTP (Mock: {selectedJob.otpCode})
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        required
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        placeholder="••••"
                        className="w-full bg-slate-950 border border-white/10 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-center text-lg tracking-widest text-white focus:outline-none transition-colors"
                      />
                    </div>

                    {otpError && (
                      <p className="text-[10px] text-brand-red text-center font-semibold animate-shake">
                        {otpError}
                      </p>
                    )}

                    {otpSuccess ? (
                      <div className="py-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 text-center font-bold">
                        ✓ Delivery Confirmed!
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={isVerifying}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg transition duration-200 flex justify-center items-center"
                      >
                        {isVerifying ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          "Verify and Complete Delivery"
                        )}
                      </button>
                    )}
                  </form>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/30 border border-dashed border-white/10 rounded-2xl p-8 text-center text-slate-500 text-sm font-light sticky top-28">
                Select an active job card to view pickup instructions, contact details, and input buyer delivery verification OTP.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
