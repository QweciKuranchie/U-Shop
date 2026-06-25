"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { SellerProvider, useSeller } from "./SellerContext";

function SellerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { seller } = useSeller();

  const isApplicationPage = pathname === "/seller/application" || pathname.startsWith("/seller/application/");

  if (isApplicationPage) {
    return <>{children}</>;
  }

  const sidebarItems = [
    { href: "/seller/dashboard", icon: "📊", label: "Dashboard" },
    { href: "/seller/products", icon: "📦", label: "Products" },
  ];

  const commissionRate = seller ? Number(seller.commissionRate) : 0.05;
  const commissionLabel = `${(commissionRate * 100).toFixed(0)}%`;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex font-sans relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-purple/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-pink/10 blur-[130px] pointer-events-none" />

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="w-64 min-h-screen bg-slate-900/60 backdrop-blur-md border-r border-white/5 flex flex-col z-20">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex items-center group">
            <Logo size="md" lightMode={false} />
          </Link>
          {seller && (
            <div className="mt-3">
              <p className="text-xs text-slate-400 font-medium truncate">{seller.storeName}</p>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                {seller.tier} · {commissionLabel} fee
              </span>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || (item.href === "/seller/products" && pathname.startsWith("/seller/products"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-brand-purple/15 text-white border border-brand-purple/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom link */}
        <div className="p-4 border-t border-white/5">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Back to U-Shop
          </Link>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col z-10">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-white/5 py-4 px-8 flex justify-between items-center">
          <h1 className="font-display font-bold text-xl">
            {pathname.startsWith("/seller/products") ? "Products" : "Dashboard"}
          </h1>
          <div className="flex items-center gap-3">
            {seller && (
              <Link
                href={`/store/${seller.handle}`}
                className="text-xs text-slate-400 hover:text-white transition-colors"
                target="_blank"
              >
                View Storefront ↗
              </Link>
            )}
            <span className="text-xs bg-slate-900 px-3 py-1 rounded-full border border-white/5 text-slate-400">
              Seller Portal
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function SellerLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SellerProvider>
      <SellerShell>{children}</SellerShell>
    </SellerProvider>
  );
}
