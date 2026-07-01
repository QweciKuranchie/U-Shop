"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/Logo";

// Enums and Metadata
const CATEGORIES = [
  { value: "PHONES", label: "Phones", emoji: "📱" },
  { value: "LAPTOPS", label: "Laptops", emoji: "💻" },
  { value: "AUDIO", label: "Audio", emoji: "🎧" },
  { value: "ACCESSORIES", label: "Accessories", emoji: "⌚" },
  { value: "COMPONENTS", label: "Components", emoji: "🔧" },
  { value: "CABLES", label: "Cables", emoji: "🔌" },
  { value: "GAMING", label: "Gaming", emoji: "🎮" },
  { value: "OTHER", label: "Other", emoji: "📦" },
];

const CONDITIONS = [
  { value: "NEW", label: "Brand New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
];

const CAMPUSES = [
  "University of Ghana",
  "Ghana Communication Technology University",
  "University of Professional Studies, Accra",
  "Accra Technical University",
];

const TIERS = [
  { value: "STUDENT", label: "🎓 Student Seller" },
  { value: "INDIVIDUAL", label: "👤 Individual Seller" },
  { value: "BUSINESS", label: "🏢 Business Seller" },
];

const CATEGORY_META: Record<string, { emoji: string; label: string }> = {
  PHONES: { emoji: "📱", label: "Phones" },
  LAPTOPS: { emoji: "💻", label: "Laptops" },
  AUDIO: { emoji: "🎧", label: "Audio" },
  ACCESSORIES: { emoji: "⌚", label: "Accessories" },
  COMPONENTS: { emoji: "🔧", label: "Components" },
  CABLES: { emoji: "🔌", label: "Cables" },
  GAMING: { emoji: "🎮", label: "Gaming" },
  OTHER: { emoji: "📦", label: "Other" },
};

const CONDITION_LABELS: Record<string, string> = {
  NEW: "New",
  LIKE_NEW: "Like New",
  GOOD: "Good",
  FAIR: "Fair",
};

interface ProductItem {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  listingPrice: string;
  imageS3Keys: string[];
  seller: {
    handle: string;
    storeName: string;
    campus: string;
    tier: string;
  };
}

// Global query client initializer
export default function ProductsSearchPage() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SearchPageContent />
    </QueryClientProvider>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Route state
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const condition = searchParams.get("condition") || "";
  const campus = searchParams.get("campus") || "";
  const sellerTier = searchParams.get("sellerTier") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  // Local Form state for instant search/price range without pushing URL on every keystroke
  const [searchInput, setSearchInput] = useState(q);
  const [minPriceInput, setMinPriceInput] = useState(minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice);

  // Fetch products
  const { data, isLoading, error } = useQuery<{ products: ProductItem[]; s3BaseUrl: string }>({
    queryKey: ["products", { q, category, condition, minPrice, maxPrice, campus, sellerTier, page }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      if (condition) params.set("condition", condition);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (campus) params.set("campus", campus);
      if (sellerTier) params.set("sellerTier", sellerTier);
      params.set("page", String(page));
      params.set("pageSize", "20");

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  const products = data?.products || [];
  const s3BaseUrl = data?.s3BaseUrl || "";

  // Helper to push updates to query parameters
  const updateFilters = (newFilters: Record<string, string | number | undefined | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    Object.entries(newFilters).forEach(([key, val]) => {
      if (val === undefined || val === null || val === "") {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(val));
      }
    });
    // Reset page to 1 on filter change, unless we are updating the page parameter itself
    if (!newFilters.hasOwnProperty("page")) {
      nextParams.delete("page");
    }
    router.push(`/products?${nextParams.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchInput });
  };

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ minPrice: minPriceInput, maxPrice: maxPriceInput });
  };

  const clearAllFilters = () => {
    setSearchInput("");
    setMinPriceInput("");
    setMaxPriceInput("");
    router.push("/products");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans relative overflow-hidden flex flex-col">
      {/* Background Ambient Glows */}
      <div className="fixed top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-brand-purple/15 blur-[160px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-pink/10 blur-[160px] pointer-events-none z-0" />

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex justify-between w-full md:w-auto items-center">
            <Link href="/" className="flex items-center group">
              <Logo size="md" lightMode={false} />
            </Link>
          </div>

          {/* Search bar inside header */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:max-w-lg">
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder='Search campus listings...'
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 focus:border-brand-purple/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all backdrop-blur-md"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white text-xs font-semibold hover:opacity-90 transition shadow-lg shadow-brand-purple/20"
            >
              Search
            </button>
          </form>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Catalog Layout ──────────────────────────────────── */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col md:flex-row gap-8 z-10 relative">
        {/* Left Sidebar: Filters */}
        <aside className="w-full md:w-64 flex-shrink-0 space-y-6">
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">Filters</h3>
              {(q || category || condition || campus || sellerTier || minPrice || maxPrice) && (
                <button
                  onClick={clearAllFilters}
                  className="text-[10px] text-brand-pink hover:text-white transition font-bold"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => updateFilters({ category: e.target.value })}
                className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Campus Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                Campus Location
              </label>
              <select
                value={campus}
                onChange={(e) => updateFilters({ campus: e.target.value })}
                className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="">All Campuses</option>
                {CAMPUSES.map((c) => (
                  <option key={c} value={c}>
                    📍 {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                Condition
              </label>
              <select
                value={condition}
                onChange={(e) => updateFilters({ condition: e.target.value })}
                className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="">All Conditions</option>
                {CONDITIONS.map((cond) => (
                  <option key={cond.value} value={cond.value}>
                    {cond.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range Filter */}
            <form onSubmit={handlePriceSubmit} className="space-y-3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Price (GH₵)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none placeholder-slate-700"
                />
                <span className="text-slate-600 text-xs">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none placeholder-slate-700"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold transition"
              >
                Apply Range
              </button>
            </form>

            {/* Seller Tier Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                Seller Type
              </label>
              <select
                value={sellerTier}
                onChange={(e) => updateFilters({ sellerTier: e.target.value })}
                className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="">All Sellers</option>
                {TIERS.map((tier) => (
                  <option key={tier.value} value={tier.value}>
                    {tier.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* Right Section: Catalog Grid & Search Summary */}
        <section className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-black text-2xl text-white">
                {q ? `Search results for "${q}"` : "Discover Products"}
              </h2>
              {products.length > 0 && (
                <p className="text-xs text-slate-500 mt-1 font-light">
                  Showing {products.length} product{products.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          {/* Load State */}
          {isLoading ? (
            <div className="flex justify-center py-32">
              <div className="w-8 h-8 border-2 border-brand-purple/30 border-t-brand-pink rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-xs text-red-400">
              An error occurred while loading products. Please try again.
            </div>
          ) : products.length === 0 ? (
            <div className="bg-slate-900/20 border border-dashed border-white/10 rounded-2xl py-24 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-display font-bold text-lg text-white mb-2">No listings found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-light leading-relaxed">
                We couldn&apos;t find any active listings matching your query or selected filters. Try broadening your criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((product) => {
                const imageKeys = product.imageS3Keys as string[] || [];
                const imageUrl = imageKeys.length > 0 ? `${s3BaseUrl}/${imageKeys[0]}` : null;
                const tierLabels: Record<string, string> = {
                  STUDENT: "Student",
                  BUSINESS: "Business",
                  INDIVIDUAL: "Individual",
                };

                return (
                  <div
                    key={product.id}
                    className="group bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden hover:border-brand-purple/30 hover:shadow-2xl hover:shadow-brand-purple/5 transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Product Image */}
                    <div className="relative h-44 bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center overflow-hidden">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={product.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          unoptimized
                        />
                      ) : (
                        <div className="text-4xl opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-500">
                          {CATEGORY_META[product.category]?.emoji || "📦"}
                        </div>
                      )}
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
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-md bg-gradient-to-br from-brand-purple/40 to-brand-pink/40 flex items-center justify-center text-[7px] font-black text-white">
                            {product.seller.storeName.charAt(0)}
                          </div>
                          <Link
                            href={`/store/${product.seller.handle}`}
                            className="text-[9px] text-slate-500 hover:text-brand-pink transition font-medium"
                          >
                            {product.seller.storeName}
                          </Link>
                        </div>
                        <span className="text-[8px] bg-slate-950 border border-white/10 text-slate-400 px-1.5 py-0.5 rounded font-medium">
                          {tierLabels[product.seller.tier]}
                        </span>
                      </div>

                      <h3 className="font-display font-bold text-sm text-white line-clamp-2 mb-3 group-hover:text-brand-pink transition-colors min-h-[2.5rem]">
                        <Link href={`/products/${product.id}`}>{product.title}</Link>
                      </h3>

                      <div className="flex items-center gap-1 text-[9px] text-slate-500 mb-4 font-light">
                        <span>📍</span>
                        <span className="line-clamp-1">{product.seller.campus}</span>
                      </div>

                      <div className="flex items-end justify-between pt-3 border-t border-white/5 mt-auto">
                        <div>
                          <span className="text-[9px] text-slate-600 uppercase block mb-0.5">Price</span>
                          <span className="font-display font-black text-lg text-white">
                            GH₵ {Number(product.listingPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <Link
                          href={`/products/${product.id}`}
                          className="px-3 py-1.5 rounded-lg bg-brand-purple/10 text-brand-pink text-[10px] font-bold hover:bg-brand-purple hover:text-white transition-all border border-brand-purple/20"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Pagination ────────────────────────────────────────── */}
          {products.length > 0 && (
            <div className="flex justify-between items-center pt-8 border-t border-white/5">
              <button
                onClick={() => updateFilters({ page: page - 1 })}
                disabled={page <= 1}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 rounded-xl text-xs font-semibold transition disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <span className="text-xs text-slate-500 font-light">
                Page <span className="font-semibold text-slate-300">{page}</span>
              </span>
              <button
                onClick={() => updateFilters({ page: page + 1 })}
                disabled={products.length < 20}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 rounded-xl text-xs font-semibold transition disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
