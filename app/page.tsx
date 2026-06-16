import React from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { prisma } from "@/lib/prisma";

// ── Fetch featured products from DB ───────────────────────────────
async function getFeaturedProducts() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      title: true,
      listingPrice: true,
      category: true,
      condition: true,
      imageS3Keys: true,
      seller: {
        select: {
          storeName: true,
          handle: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  return products;
}

async function getActiveCategories() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: { category: true },
    distinct: ["category"],
  });
  return products.map((p) => p.category);
}

async function getActiveSellers() {
  const sellers = await prisma.sellerProfile.findMany({
    where: { status: "ACTIVE" },
    select: {
      handle: true,
      storeName: true,
      tagline: true,
      campus: true,
      tier: true,
      _count: { select: { products: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  });
  return sellers;
}

const CATEGORY_META: Record<string, { emoji: string; label: string; color: string }> = {
  PHONES: { emoji: "📱", label: "Phones", color: "from-blue-500/20 to-blue-600/5" },
  LAPTOPS: { emoji: "💻", label: "Laptops", color: "from-purple-500/20 to-purple-600/5" },
  AUDIO: { emoji: "🎧", label: "Audio", color: "from-pink-500/20 to-pink-600/5" },
  ACCESSORIES: { emoji: "⌚", label: "Accessories", color: "from-amber-500/20 to-amber-600/5" },
  COMPONENTS: { emoji: "🔧", label: "Components", color: "from-emerald-500/20 to-emerald-600/5" },
  CABLES: { emoji: "🔌", label: "Cables", color: "from-cyan-500/20 to-cyan-600/5" },
  GAMING: { emoji: "🎮", label: "Gaming", color: "from-red-500/20 to-red-600/5" },
  OTHER: { emoji: "📦", label: "Other", color: "from-slate-500/20 to-slate-600/5" },
};

const CONDITION_LABELS: Record<string, string> = {
  NEW: "New",
  LIKE_NEW: "Like New",
  GOOD: "Good",
  FAIR: "Fair",
};

export default async function Home() {
  const [products, categories, sellers] = await Promise.all([
    getFeaturedProducts(),
    getActiveCategories(),
    getActiveSellers(),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans relative overflow-hidden">
      {/* ── Background Ambient Glows ─────────────────────────────── */}
      <div className="fixed top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-brand-purple/15 blur-[160px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-pink/10 blur-[160px] pointer-events-none" />
      <div className="fixed top-[50%] left-[50%] w-[30%] h-[30%] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />

      {/* ── Sticky Navigation ────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center group">
            <Logo size="md" lightMode={false} />
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#categories" className="text-xs font-medium text-slate-400 hover:text-white transition">Categories</a>
            <a href="#products" className="text-xs font-medium text-slate-400 hover:text-white transition">Products</a>
            <a href="#sellers" className="text-xs font-medium text-slate-400 hover:text-white transition">Sellers</a>
            <Link href="/register/seller" className="text-xs font-medium text-brand-pink hover:text-white transition">Sell on U-Shop</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-md text-xs font-semibold transition-all duration-200"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white text-xs font-semibold hover:opacity-90 transition-all duration-200 shadow-lg shadow-brand-purple/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className="relative py-20 md:py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-purple/10 border border-brand-purple/25 text-brand-pink text-[10px] font-bold uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-pink animate-pulse" />
              Campus Marketplace
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400">
                Buy & Sell
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple via-brand-pink to-[#ff3b8b]">
                Campus Tech
              </span>
            </h1>

            <p className="text-base md:text-lg text-slate-400 max-w-xl mb-10 leading-relaxed font-light">
              The trusted marketplace for Ghanaian university students.
              Buy verified second-hand electronics, sell your gear, and get same-day campus delivery.
            </p>

            {/* Search Bar */}
            <div className="flex gap-3 max-w-lg">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder='Search "MacBook Pro", "AirPods"...'
                  className="w-full bg-slate-900/60 border border-white/10 focus:border-brand-purple/40 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all backdrop-blur-md"
                  readOnly
                />
              </div>
              <button className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-brand-purple/20">
                Search
              </button>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-6 mt-10">
              <div>
                <span className="font-display font-black text-2xl text-white">{products.length}+</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Active Listings</span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <span className="font-display font-black text-2xl text-white">{sellers.length}+</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Verified Sellers</span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <span className="font-display font-black text-2xl text-white">4</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Campuses</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category Grid ────────────────────────────────────────── */}
      <section id="categories" className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-[10px] font-bold text-brand-pink uppercase tracking-widest">Browse</span>
              <h2 className="font-display font-black text-3xl text-white mt-1">Shop by Category</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {Object.entries(CATEGORY_META).map(([key, meta]) => {
              const isActive = categories.includes(key as typeof categories[number]);
              return (
                <button
                  key={key}
                  className={`group relative p-5 rounded-2xl border border-white/5 bg-gradient-to-b ${meta.color} backdrop-blur-md flex flex-col items-center gap-2 transition-all duration-300 hover:border-white/15 hover:scale-[1.03] hover:shadow-xl ${!isActive ? "opacity-40" : ""}`}
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{meta.emoji}</span>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Featured Products ────────────────────────────────────── */}
      <section id="products" className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-[10px] font-bold text-brand-pink uppercase tracking-widest">Marketplace</span>
              <h2 className="font-display font-black text-3xl text-white mt-1">Latest Listings</h2>
            </div>
            <Link
              href="/products"
              className="text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1"
            >
              View All <span>→</span>
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="bg-slate-900/30 border border-dashed border-white/10 rounded-2xl p-20 text-center">
              <div className="text-4xl mb-4">🏪</div>
              <h3 className="font-display font-bold text-lg text-white mb-2">No products yet</h3>
              <p className="text-sm text-slate-500 font-light mb-6">Be the first to list on U-Shop!</p>
              <Link
                href="/register/seller"
                className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white text-sm font-semibold shadow-lg"
              >
                Start Selling
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="group bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden hover:border-brand-purple/30 hover:shadow-2xl hover:shadow-brand-purple/5 transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Product Image Placeholder */}
                  <div className="relative h-44 bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center overflow-hidden">
                    <div className="text-4xl opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-500">
                      {CATEGORY_META[product.category]?.emoji || "📦"}
                    </div>
                    {/* Condition badge */}
                    <div className="absolute top-3 left-3">
                      <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-slate-950/80 border border-white/10 text-slate-300 uppercase tracking-wider backdrop-blur-md">
                        {CONDITION_LABELS[product.condition] || product.condition}
                      </span>
                    </div>
                    {/* Category badge */}
                    <div className="absolute top-3 right-3">
                      <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-brand-purple/20 border border-brand-purple/20 text-brand-pink uppercase tracking-wider backdrop-blur-md">
                        {CATEGORY_META[product.category]?.label || product.category}
                      </span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-md bg-gradient-to-br from-brand-purple/40 to-brand-pink/40 flex items-center justify-center text-[8px] font-black text-white">
                        {product.seller.storeName.charAt(0)}
                      </div>
                      <Link
                        href={`/store/${product.seller.handle}`}
                        className="text-[10px] text-slate-500 hover:text-brand-pink transition font-medium"
                      >
                        {product.seller.storeName}
                      </Link>
                    </div>

                    <h3 className="font-display font-bold text-sm text-white line-clamp-2 mb-3 group-hover:text-brand-pink transition-colors min-h-[2.5rem]">
                      {product.title}
                    </h3>

                    <div className="flex items-end justify-between pt-3 border-t border-white/5">
                      <div>
                        <span className="text-[9px] text-slate-600 uppercase block mb-0.5">Price</span>
                        <span className="font-display font-black text-lg text-white">
                          GH₵ {Number(product.listingPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <button className="px-3 py-1.5 rounded-lg bg-brand-purple/10 text-brand-pink text-[10px] font-bold hover:bg-brand-purple hover:text-white transition-all border border-brand-purple/20">
                        View →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Active Sellers ───────────────────────────────────────── */}
      {sellers.length > 0 && (
        <section id="sellers" className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-[10px] font-bold text-brand-pink uppercase tracking-widest">Community</span>
                <h2 className="font-display font-black text-3xl text-white mt-1">Top Sellers</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {sellers.map((seller) => (
                <Link
                  key={seller.handle}
                  href={`/store/${seller.handle}`}
                  className="group bg-slate-900/40 border border-white/5 rounded-2xl p-6 hover:border-brand-purple/30 hover:shadow-xl hover:shadow-brand-purple/5 transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Seller Avatar */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center text-2xl font-black text-white mb-4 group-hover:scale-105 transition-transform shadow-lg">
                    {seller.storeName.charAt(0)}
                  </div>

                  <h3 className="font-display font-bold text-base text-white group-hover:text-brand-pink transition mb-1">
                    {seller.storeName}
                  </h3>
                  <span className="text-[10px] text-slate-500 block mb-2">@{seller.handle}</span>

                  {seller.tagline && (
                    <p className="text-xs text-slate-400 font-light leading-relaxed line-clamp-2 mb-4">
                      {seller.tagline}
                    </p>
                  )}

                  <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                    {seller.campus && (
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">📍 {seller.campus}</span>
                    )}
                    <span className="text-[10px] text-slate-500">
                      {seller._count.products} listing{seller._count.products !== 1 ? "s" : ""}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Section ──────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-brand-purple/20 via-slate-900/60 to-brand-pink/10 border border-white/5 rounded-3xl p-12 md:p-16 text-center backdrop-blur-md overflow-hidden">
            {/* Inner glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[40%] rounded-full bg-brand-purple/20 blur-[80px] pointer-events-none" />

            <div className="relative z-10">
              <h2 className="font-display font-black text-3xl md:text-4xl text-white mb-4">
                Ready to start selling?
              </h2>
              <p className="text-sm md:text-base text-slate-400 font-light max-w-lg mx-auto mb-8 leading-relaxed">
                Join hundreds of campus sellers. List your products, reach buyers across universities,
                and earn with just 5% commission.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register/seller"
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-semibold text-sm hover:opacity-90 transition shadow-xl shadow-brand-purple/20 hover:scale-[1.02]"
                >
                  Register as Seller →
                </Link>
                <Link
                  href="/register"
                  className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white font-semibold text-sm transition hover:bg-white/10"
                >
                  Create Buyer Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Badges ─────────────────────────────────────────── */}
      <section className="py-12 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: "🔒", title: "Secure Payments", desc: "Paystack-powered mobile money & card" },
            { icon: "🚀", title: "Same-Day Delivery", desc: "Campus rider network for fast drops" },
            { icon: "✅", title: "Verified Sellers", desc: "KYC-verified with student ID checks" },
            { icon: "💬", title: "Zero Contact Leak", desc: "No seller phone numbers exposed" },
          ].map((item, idx) => (
            <div key={idx} className="text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <h4 className="font-display font-bold text-xs text-white mb-1">{item.title}</h4>
              <p className="text-[10px] text-slate-500 font-light leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <Logo size="sm" lightMode={false} />
            <span className="text-xs text-slate-500">© 2026 U-Shop Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/register/seller" className="text-xs text-slate-500 hover:text-brand-pink transition font-medium">Sell on U-Shop</Link>
            <a href="#" className="text-xs text-slate-500 hover:text-brand-pink transition font-medium">Terms</a>
            <a href="#" className="text-xs text-slate-500 hover:text-brand-pink transition font-medium">Privacy</a>
            <a href="#" className="text-xs text-slate-500 hover:text-brand-pink transition font-medium">Help</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
