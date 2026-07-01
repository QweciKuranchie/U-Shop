"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/Logo";
import { useSession } from "@/lib/auth-client";

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
  NEW: "Brand New",
  LIKE_NEW: "Like New",
  GOOD: "Good",
  FAIR: "Fair",
};

const TIER_LABELS: Record<string, string> = {
  STUDENT: "🎓 Student Seller",
  INDIVIDUAL: "👤 Individual Seller",
  BUSINESS: "🏢 Business Seller",
};

interface ProductData {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  listingPrice: string;
  imageS3Keys: string[];
  seller: {
    storeName: string;
    handle: string;
    campus: string;
    tier: string;
  };
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [product, setProduct] = useState<ProductData | null>(null);
  const [s3BaseUrl, setS3BaseUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchProductDetail() {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Product not found");
          } else {
            setError("Failed to load product details");
          }
          return;
        }
        const data = await res.json();
        setProduct(data.product);
        // Build s3BaseUrl dynamically
        const bucket = process.env.NEXT_PUBLIC_S3_PRODUCT_BUCKET || "ushop-product-images-01";
        const region = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1";
        setS3BaseUrl(`https://${bucket}.s3.${region}.amazonaws.com`);
      } catch {
        setError("Network error loading product details");
      } finally {
        setLoading(false);
      }
    }
    fetchProductDetail();
  }, [id]);

  const handleBuyNow = () => {
    if (!product) return;
    if (!session?.user) {
      // Redirect to login page and callback to this product page
      router.push(`/login?callbackUrl=${encodeURIComponent(`/products/${product.id}`)}`);
    } else {
      // Redirect to checkout page
      router.push(`/checkout?productId=${product.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-purple/30 border-t-brand-pink rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="font-display font-bold text-2xl mb-2">{error || "Product not found"}</h2>
        <p className="text-xs text-slate-400 mb-6 max-w-sm">
          This product may have been sold, deleted, or doesn&apos;t exist.
        </p>
        <Link href="/products" className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-xs font-semibold hover:bg-white/10 transition">
          Browse Marketplace
        </Link>
      </div>
    );
  }

  const imageKeys = product.imageS3Keys || [];
  const activeImageUrl = imageKeys.length > 0 ? `${s3BaseUrl}/${imageKeys[activeImageIdx]}` : null;

  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans relative overflow-hidden flex flex-col">
      {/* Background Ambient Glows */}
      <div className="fixed top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-brand-purple/10 blur-[160px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-pink/10 blur-[160px] pointer-events-none z-0" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center group">
            <Logo size="md" lightMode={false} />
          </Link>
          <Link href="/products" className="text-xs font-medium text-slate-400 hover:text-white transition">
            ← Browse Catalog
          </Link>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-grow max-w-6xl w-full mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-12 z-10 relative">
        {/* Left Column: Image Gallery/Carousel */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-3xl bg-slate-900 border border-white/5 overflow-hidden flex items-center justify-center">
            {activeImageUrl ? (
              <Image
                src={activeImageUrl}
                alt={product.title}
                fill
                className="object-cover"
                unoptimized
                priority
              />
            ) : (
              <div className="text-6xl opacity-20">
                {CATEGORY_META[product.category]?.emoji || "📦"}
              </div>
            )}

            {/* Carousel navigation arrows */}
            {imageKeys.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIdx((prev) => (prev === 0 ? imageKeys.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/80 border border-white/10 flex items-center justify-center hover:bg-slate-900 transition"
                >
                  ‹
                </button>
                <button
                  onClick={() => setActiveImageIdx((prev) => (prev === imageKeys.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/80 border border-white/10 flex items-center justify-center hover:bg-slate-900 transition"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {imageKeys.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {imageKeys.map((key, idx) => (
                <button
                  key={key}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 bg-slate-900 flex-shrink-0 transition-all ${
                    idx === activeImageIdx ? "border-brand-pink scale-[1.03]" : "border-white/5 opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={`${s3BaseUrl}/${key}`} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product details */}
        <div className="flex flex-col space-y-6">
          <div className="space-y-3">
            {/* Category and Condition Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-brand-purple/20 border border-brand-purple/30 text-brand-pink uppercase tracking-wider backdrop-blur-md">
                {CATEGORY_META[product.category]?.emoji} {CATEGORY_META[product.category]?.label || product.category}
              </span>
              <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-slate-900 border border-white/10 text-slate-300 uppercase tracking-wider backdrop-blur-md">
                {CONDITION_LABELS[product.condition] || product.condition}
              </span>
              <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-slate-900 border border-white/10 text-slate-400 backdrop-blur-md">
                📍 {product.seller.campus}
              </span>
            </div>

            <h1 className="font-display font-black text-3xl text-white tracking-tight leading-tight">
              {product.title}
            </h1>
          </div>

          {/* Pricing Section with Tooltip */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 backdrop-blur-md flex items-center justify-between relative">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">
                Listing Price
              </span>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-2xl text-brand-pink">
                  GH₵ {Number(product.listingPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                {/* Tooltip trigger button */}
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip(!showTooltip)}
                  className="text-slate-500 hover:text-slate-300 text-xs w-4.5 h-4.5 rounded-full border border-slate-700 flex items-center justify-center font-serif font-bold cursor-help transition-all"
                >
                  i
                </button>
              </div>
            </div>

            {/* Tooltip Popup */}
            {showTooltip && (
              <div className="absolute left-6 bottom-full mb-3 w-64 bg-slate-950 border border-white/10 rounded-xl p-3 shadow-2xl z-30 text-[10px] text-slate-400 leading-relaxed transition-all">
                <div className="font-semibold text-white mb-1">Price Transparency</div>
                Price includes the low seller commission and U-Shop payment security guarantee. Same-day delivery fee is calculated at checkout based on your campus location.
              </div>
            )}
          </div>

          {/* Seller Storefront Detail (Zero contact info) */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center text-lg font-black text-white shadow-lg">
                {product.seller.storeName.charAt(0).toUpperCase()}
              </div>
              <div>
                <Link
                  href={`/store/${product.seller.handle}`}
                  className="font-display font-bold text-sm text-white hover:text-brand-pink transition block"
                >
                  {product.seller.storeName}
                </Link>
                <span className="text-[9px] text-slate-500 block mt-0.5">
                  {TIER_LABELS[product.seller.tier]}
                </span>
              </div>
            </div>
            <Link
              href={`/store/${product.seller.handle}`}
              className="text-[10px] font-bold text-brand-pink hover:text-white transition border border-brand-purple/20 px-3 py-1.5 rounded-lg bg-brand-purple/5"
            >
              View Store →
            </Link>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-display font-bold text-xs uppercase tracking-widest text-slate-400">
              Description
            </h3>
            <p className="text-sm text-slate-300 font-light leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          {/* Purchase Actions (Strictly Zero Contact CTA) */}
          <div className="pt-6 border-t border-white/5">
            <button
              onClick={handleBuyNow}
              className="w-full bg-gradient-to-r from-brand-purple to-brand-pink text-white py-4 rounded-2xl font-bold text-sm hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition shadow-lg shadow-brand-purple/20"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
