"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/Logo";

interface PendingSeller {
  id: string;
  storeName: string;
  handle: string;
  ownerName: string;
  email: string;
  campus: string;
  studentIdKey: string; // S3 key simulation
  studentIdUrl: string; // Mock visual image
}

interface OrderAssignment {
  id: string;
  reference: string;
  productTitle: string;
  listingPrice: number;
  buyerName: string;
  buyerCampus: string;
  assignedRiderId: string;
}

const INITIAL_SELLERS: PendingSeller[] = [
  {
    id: "sel-101",
    storeName: "Campus Kicks",
    handle: "campuskicks",
    ownerName: "Emmanuel Osei",
    email: "eosei001@st.ug.edu.gh",
    campus: "Legon Main",
    studentIdKey: "kyc/sel-101/id_card.jpg",
    studentIdUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80", // mock portrait student ID card
  },
  {
    id: "sel-102",
    storeName: "Elite Apparel",
    handle: "eliteapparel",
    ownerName: "Sarah Mensah",
    email: "smensah002@st.ug.edu.gh",
    campus: "Accra City Campus",
    studentIdKey: "kyc/sel-102/id_card.jpg",
    studentIdUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
  }
];

const INITIAL_ORDERS: OrderAssignment[] = [
  {
    id: "ord-201",
    reference: "USH-20260613-284918",
    productTitle: "iPhone 13 Pro (128GB)",
    listingPrice: 6825.0,
    buyerName: "John Doe",
    buyerCampus: "Legon Main (Limann Hall)",
    assignedRiderId: "",
  },
  {
    id: "ord-202",
    reference: "USH-20260613-992281",
    productTitle: "Sony WH-1000XM4 Headphones",
    listingPrice: 2310.0,
    buyerName: "Bob Johnson",
    buyerCampus: "Legon Main (Volta Hall)",
    assignedRiderId: "",
  }
];

const RIDERS = [
  { id: "rider-1", name: "Kojo Mensah (Zone: Legon Main)" },
  { id: "rider-2", name: "Ama Serwaa (Zone: Accra City)" },
  { id: "rider-3", name: "David Tetteh (Zone: Korle-Bu)" }
];

export default function AdminDashboard() {
  const [pendingSellers, setPendingSellers] = useState<PendingSeller[]>(INITIAL_SELLERS);
  const [selectedSeller, setSelectedSeller] = useState<PendingSeller | null>(null);
  
  const [orders, setOrders] = useState<OrderAssignment[]>(INITIAL_ORDERS);
  const [activeTab, setActiveTab] = useState<"kyc" | "dispatch">("kyc");
  
  // Rejection reason state
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isProcessingKYC, setIsProcessingKYC] = useState(false);

  // Stats (simulated)
  const [stats, setStats] = useState({
    gmv: 17535.0,
    commission: 876.75, // 5% average
    activeSellersCount: 14,
  });

  const handleKycApproval = (sellerId: string, approved: boolean) => {
    setIsProcessingKYC(true);
    setTimeout(() => {
      setPendingSellers(pendingSellers.filter((s) => s.id !== sellerId));
      setSelectedSeller(null);
      setShowRejectForm(false);
      setRejectionReason("");
      setIsProcessingKYC(false);

      if (approved) {
        setStats((prev) => ({
          ...prev,
          activeSellersCount: prev.activeSellersCount + 1,
        }));
      }
    }, 800);
  };

  const handleAssignRider = (orderId: string, riderId: string) => {
    if (!riderId) return;
    setOrders(
      orders.map((ord) =>
        ord.id === orderId ? { ...ord, assignedRiderId: riderId } : ord
      )
    );
  };

  const handleConfirmDispatch = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || !order.assignedRiderId) return;

    // Simulate dispatch completion
    setTimeout(() => {
      setOrders(orders.filter((o) => o.id !== orderId));
      // Add to GMV/Commission stats
      setStats((prev) => ({
        ...prev,
        gmv: prev.gmv + order.listingPrice,
        commission: prev.commission + (order.listingPrice * 0.05),
      }));
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-red/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-purple/10 blur-[130px] pointer-events-none" />

      {/* Nav */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center group">
            <Logo size="md" lightMode={false} />
          </Link>

          <nav className="flex space-x-6 text-sm font-medium">
            <button
              onClick={() => setActiveTab("kyc")}
              className={`pb-1 border-b-2 transition-all ${
                activeTab === "kyc" ? "border-brand-red text-white" : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Seller KYC Approvals
            </button>
            <button
              onClick={() => setActiveTab("dispatch")}
              className={`pb-1 border-b-2 transition-all ${
                activeTab === "dispatch" ? "border-brand-red text-white" : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Rider Dispatch Board
            </button>
          </nav>

          <div className="flex items-center space-x-4">
            <span className="text-xs bg-slate-900 px-3 py-1 rounded-full border border-brand-red/30 text-brand-red font-bold animate-pulse">
              🛡️ System Administrator
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-grow w-full z-10">
        
        {/* KPI Panel */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: "Total Platform GMV", value: `GH₵ ${stats.gmv.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: "border-brand-purple/20" },
            { label: "Commissions Captured (5%)", value: `GH₵ ${stats.commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: "border-brand-pink/20" },
            { label: "Verified Merchant Accounts", value: stats.activeSellersCount, color: "border-brand-red/20" },
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

        {activeTab === "kyc" ? (
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* KYC Pending Queue (Left Side) */}
            <div className="flex-grow lg:w-2/3">
              <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <h2 className="font-display font-bold text-2xl mb-6">KYC Registration Queue</h2>

                <div className="space-y-4">
                  {pendingSellers.map((seller) => (
                    <div
                      key={seller.id}
                      onClick={() => {
                        setSelectedSeller(seller);
                        setShowRejectForm(false);
                      }}
                      className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        selectedSeller?.id === seller.id
                          ? "bg-slate-900 border-brand-red/50 shadow-lg shadow-rose-950/10"
                          : "bg-slate-950/40 border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2 mb-1.5">
                          <span className="text-xs bg-brand-purple/10 text-brand-pink px-2.5 py-0.5 rounded-lg border border-brand-purple/20 font-bold">
                            @{seller.handle}
                          </span>
                          <span className="text-xs text-slate-500">📍 {seller.campus}</span>
                        </div>
                        <h3 className="font-display font-bold text-lg text-white">{seller.storeName}</h3>
                        <p className="text-xs text-slate-400 font-light mt-0.5">
                          Owner: {seller.ownerName} ({seller.email})
                        </p>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4">
                        <span className="text-[10px] bg-slate-900 border border-white/10 px-2 py-1 rounded text-slate-400">
                          {seller.studentIdKey.split("/").pop()}
                        </span>
                        <span className="text-slate-500 text-sm font-semibold">&rarr;</span>
                      </div>
                    </div>
                  ))}

                  {pendingSellers.length === 0 && (
                    <div className="py-12 text-center text-slate-500 font-light">
                      KYC verification queue is empty. Good job!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Document Viewer & Verification (Right Side) */}
            <div className="w-full lg:w-1/3">
              {selectedSeller ? (
                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 sticky top-28 backdrop-blur-md shadow-2xl space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">Document Audit log</span>
                      <button
                        onClick={() => setSelectedSeller(null)}
                        className="text-slate-500 hover:text-white text-xs font-semibold"
                      >
                        Close ✕
                      </button>
                    </div>
                    <h3 className="font-display font-bold text-xl">{selectedSeller.storeName}</h3>
                  </div>

                  {/* S3 Document Viewer Simulator */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      S3 Asset: {selectedSeller.studentIdKey}
                    </label>
                    <div className="relative h-48 bg-slate-950 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center">
                      <Image
                        src={selectedSeller.studentIdUrl}
                        alt="Student ID Card"
                        fill
                        className="object-cover"
                        sizes="300px"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] hover:backdrop-blur-none transition-all duration-300 flex items-end p-3">
                        <span className="text-[9px] bg-slate-950/80 px-2 py-0.5 rounded border border-white/10 text-slate-300 font-bold uppercase">
                          Verify student status
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Actions */}
                  {showRejectForm ? (
                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Reason for KYC Rejection
                      </label>
                      <textarea
                        rows={2}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="ID details blurry, expired, invalid domain..."
                        className="w-full bg-slate-950 border border-white/10 focus:border-brand-red/50 rounded-xl px-4 py-2 text-xs text-white focus:outline-none resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={isProcessingKYC}
                          onClick={() => handleKycApproval(selectedSeller.id, false)}
                          className="flex-grow py-2 bg-brand-red text-white text-xs font-bold rounded-lg hover:opacity-90 transition"
                        >
                          Confirm Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowRejectForm(false)}
                          className="px-3 py-2 bg-slate-950 text-slate-400 text-xs rounded-lg hover:text-white transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                      <button
                        onClick={() => handleKycApproval(selectedSeller.id, true)}
                        disabled={isProcessingKYC}
                        className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg transition duration-200 flex justify-center items-center"
                      >
                        {isProcessingKYC ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          "Approve Merchant"
                        )}
                      </button>
                      <button
                        onClick={() => setShowRejectForm(true)}
                        disabled={isProcessingKYC}
                        className="py-3 bg-brand-red/10 border border-brand-red/30 text-brand-red hover:bg-brand-red hover:text-white font-semibold text-xs rounded-xl transition duration-200 flex justify-center items-center"
                      >
                        Reject KYC
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-900/30 border border-dashed border-white/10 rounded-2xl p-8 text-center text-slate-500 text-sm font-light sticky top-28">
                  Select a pending registration from the queue to view S3 student ID documents, audit records, and confirm verification status.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Rider Dispatch Board Tab */
          <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="font-display font-bold text-2xl mb-6 font-display">Rider Dispatch Allocations</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-slate-500 uppercase tracking-widest">
                    <th className="pb-3 font-semibold">Order</th>
                    <th className="pb-3 font-semibold">Item</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Destination</th>
                    <th className="pb-3 font-semibold">Select Rider</th>
                    <th className="pb-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="group hover:bg-white/[0.01]">
                      <td className="py-4 font-semibold text-white">{ord.reference}</td>
                      <td className="py-4 text-slate-300 font-light">{ord.productTitle}</td>
                      <td className="py-4 font-semibold text-brand-pink">
                        GH₵ {ord.listingPrice.toFixed(2)}
                      </td>
                      <td className="py-4 text-slate-400">
                        <span className="font-semibold text-white block">{ord.buyerName}</span>
                        <span className="text-xs">{ord.buyerCampus}</span>
                      </td>
                      <td className="py-4">
                        <select
                          value={ord.assignedRiderId}
                          onChange={(e) => handleAssignRider(ord.id, e.target.value)}
                          className="bg-slate-950 border border-white/5 focus:border-brand-red/50 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                        >
                          <option value="">Unassigned</option>
                          {RIDERS.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4">
                        <button
                          onClick={() => handleConfirmDispatch(ord.id)}
                          disabled={!ord.assignedRiderId}
                          className="bg-brand-red/10 text-brand-red hover:bg-brand-red hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-brand-red/30 hover:border-transparent transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Dispatch &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}

                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 font-light">
                        All orders are currently dispatched. Good job!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
