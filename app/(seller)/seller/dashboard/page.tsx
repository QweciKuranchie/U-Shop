"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSeller } from "../SellerContext";

export default function SellerDashboardPage() {
  const { seller, products, loading, error } = useSeller();
  const [activeTab, setActiveTab] = useState<"orders" | "storefront" | "profile">("orders");

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-8 h-8 border-2 border-brand-purple/30 border-t-brand-pink rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
        {error}
      </div>
    );
  }

  const activeCount = products.filter((p) => p.status === "ACTIVE").length;
  const soldCount = products.filter((p) => p.status === "SOLD").length;
  const totalRevenue = products
    .filter((p) => p.status === "SOLD")
    .reduce((sum, p) => sum + Number(p.vendorPrice), 0);

  const commissionRate = seller ? Number(seller.commissionRate) : 0.05;
  const commissionLabel = `${(commissionRate * 100).toFixed(0)}%`;

  const tabItems = [
    { key: "orders" as const, icon: "🧾", label: "Orders" },
    { key: "storefront" as const, icon: "🏪", label: "Storefront" },
    { key: "profile" as const, icon: "👤", label: "Profile" },
  ];

  return (
    <>
      {/* KPI Panel */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: "Vendor Revenue", value: `GH₵ ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: "border-brand-purple/20" },
          { label: "Active Listings", value: activeCount, color: "border-brand-pink/20" },
          { label: "Total Sold", value: soldCount, color: "border-white/5" },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className={`bg-slate-900/40 border ${kpi.color} rounded-2xl p-6 backdrop-blur-sm shadow-xl`}
          >
            <span className="text-[10px] text-slate-500 uppercase block tracking-wider font-semibold mb-2">
              {kpi.label}
            </span>
            <p className="font-display font-black text-3xl text-white">{kpi.value}</p>
          </div>
        ))}
      </section>

      {/* Tab Switcher & Inner Sections */}
      <section className="bg-slate-900/30 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex border-b border-white/5 mb-6">
          {tabItems.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                activeTab === tab.key
                  ? "border-brand-pink text-white"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === "orders" && (
          <div className="py-8 text-center">
            <div className="text-5xl mb-4">🧾</div>
            <h3 className="font-display font-bold text-lg text-white mb-2">Orders</h3>
            <p className="text-xs text-slate-400">Order management is coming in T8. Stay tuned!</p>
          </div>
        )}

        {activeTab === "storefront" && seller && (
          <div className="p-4">
            <h3 className="font-display font-bold text-lg text-white mb-4">Your Storefront</h3>
            <p className="text-xs text-slate-400 mb-6">
              View your public storefront page that buyers see.
            </p>
            <Link
              href={`/store/${seller.handle}`}
              target="_blank"
              className="inline-block bg-gradient-to-r from-brand-purple to-brand-pink text-white px-6 py-3 rounded-xl text-xs font-semibold shadow-lg hover:scale-[1.02] transition-transform duration-200"
            >
              Open Storefront ↗
            </Link>
          </div>
        )}

        {activeTab === "profile" && seller && (
          <div className="max-w-2xl p-4">
            <h3 className="font-display font-bold text-2xl mb-6">Seller Profile</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-3 border-b border-white/5">
                <span className="text-slate-400">Store Name</span>
                <span className="font-semibold">{seller.storeName}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/5">
                <span className="text-slate-400">Tier</span>
                <span className="font-semibold">{seller.tier}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/5">
                <span className="text-slate-400">Commission Rate</span>
                <span className="font-semibold text-brand-pink">{commissionLabel}</span>
              </div>
              {seller.campus && (
                <div className="flex justify-between py-3 border-b border-white/5">
                  <span className="text-slate-400">Campus</span>
                  <span className="font-semibold">📍 {seller.campus}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
