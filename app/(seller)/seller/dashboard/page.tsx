"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/Logo";

// ── Types ─────────────────────────────────────────────────────────
interface ProductItem {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  vendorPrice: string;
  listingPrice: string;
  commissionRate: string;
  imageS3Keys: string[];
  status: "ACTIVE" | "PAUSED" | "SOLD" | "DELETED";
  createdAt: string;
}

interface SellerInfo {
  id: string;
  commissionRate: string;
  tier: string;
  campus: string | null;
  storeName: string;
}

interface UploadingImage {
  file: File;
  preview: string;
  progress: number;
  s3Key?: string;
  error?: string;
}

type DashboardTab = "products" | "orders" | "storefront" | "profile";
type ProductView = "list" | "new" | "edit";

const CATEGORIES = [
  { value: "PHONES", label: "Phones" },
  { value: "LAPTOPS", label: "Laptops" },
  { value: "AUDIO", label: "Audio" },
  { value: "ACCESSORIES", label: "Accessories" },
  { value: "COMPONENTS", label: "Components" },
  { value: "CABLES", label: "Cables" },
  { value: "GAMING", label: "Gaming" },
  { value: "OTHER", label: "Other" },
];

const CONDITIONS = [
  { value: "NEW", label: "Brand New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
];

const S3_BASE_URL = `https://${process.env.NEXT_PUBLIC_S3_PRODUCT_BUCKET || "ushop-product-images-01"}.s3.${process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1"}.amazonaws.com`;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

// ── Helper: client-side gross-up formula ──────────────────────────
function computeGrossUp(vendorPrice: number, commissionRate: number): string {
  if (vendorPrice <= 0 || commissionRate < 0 || commissionRate >= 1) return "0.00";
  const listing = vendorPrice / (1 - commissionRate);
  return listing.toFixed(2);
}

// ══════════════════════════════════════════════════════════════════
export default function SellerDashboard() {
  // ── Data state ──────────────────────────────────────────────────
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [seller, setSeller] = useState<SellerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Navigation state ────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<DashboardTab>("products");
  const [productView, setProductView] = useState<ProductView>("list");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // ── Product form state ──────────────────────────────────────────
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("PHONES");
  const [formCondition, setFormCondition] = useState("GOOD");
  const [formVendorPrice, setFormVendorPrice] = useState("");
  const [formImages, setFormImages] = useState<UploadingImage[]>([]);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Delete state ────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch products ──────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to load products");
        return;
      }
      const data = await res.json();
      setProducts(data.products);
      setSeller(data.seller);
    } catch {
      setError("Network error loading products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── Computed metrics ────────────────────────────────────────────
  const activeCount = products.filter((p) => p.status === "ACTIVE").length;
  const soldCount = products.filter((p) => p.status === "SOLD").length;
  const totalRevenue = products
    .filter((p) => p.status === "SOLD")
    .reduce((sum, p) => sum + Number(p.vendorPrice), 0);

  const commissionRate = seller ? Number(seller.commissionRate) : 0.05;
  const commissionLabel = `${(commissionRate * 100).toFixed(0)}%`;

  // ── Gross-up preview ────────────────────────────────────────────
  const grossUpPrice = formVendorPrice
    ? computeGrossUp(Number(formVendorPrice), commissionRate)
    : "0.00";

  // ── Image handling ──────────────────────────────────────────────
  function handleImageSelect(files: FileList | null) {
    if (!files) return;
    const currentCount = formImages.length;
    const remaining = 5 - currentCount;

    if (remaining <= 0) {
      setFormError("Maximum 5 images allowed");
      return;
    }

    const newImages: UploadingImage[] = [];
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];

      // Validate type
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setFormError(`"${file.name}" is not a supported image type. Use JPEG, PNG, WebP, GIF, or AVIF.`);
        continue;
      }

      // Validate size
      if (file.size > MAX_IMAGE_SIZE) {
        setFormError(`"${file.name}" exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
        continue;
      }

      newImages.push({
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
      });
    }

    setFormImages((prev) => [...prev, ...newImages]);
    if (newImages.length > 0) setFormError("");
  }

  function removeImage(index: number) {
    setFormImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  }

  async function uploadSingleImage(image: UploadingImage, index: number): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", image.file);

    try {
      const xhr = new XMLHttpRequest();
      const promise = new Promise<string | null>((resolve) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setFormImages((prev) => {
              const updated = [...prev];
              if (updated[index]) updated[index].progress = pct;
              return updated;
            });
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            setFormImages((prev) => {
              const updated = [...prev];
              if (updated[index]) {
                updated[index].s3Key = data.key;
                updated[index].progress = 100;
              }
              return updated;
            });
            resolve(data.key);
          } else {
            let errMsg = "Upload failed";
            try { errMsg = JSON.parse(xhr.responseText).error; } catch { /* use default */ }
            setFormImages((prev) => {
              const updated = [...prev];
              if (updated[index]) updated[index].error = errMsg;
              return updated;
            });
            resolve(null);
          }
        });

        xhr.addEventListener("error", () => {
          setFormImages((prev) => {
            const updated = [...prev];
            if (updated[index]) updated[index].error = "Network error";
            return updated;
          });
          resolve(null);
        });
      });

      xhr.open("POST", "/api/products/upload-image");
      xhr.send(formData);
      return await promise;
    } catch {
      return null;
    }
  }

  // ── Form submission ─────────────────────────────────────────────
  async function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setFormSubmitting(true);

    try {
      // Upload images first
      const s3Keys: string[] = [];
      for (let i = 0; i < formImages.length; i++) {
        const img = formImages[i];
        if (img.s3Key) {
          s3Keys.push(img.s3Key);
          continue;
        }
        const key = await uploadSingleImage(img, i);
        if (key) s3Keys.push(key);
        else {
          setFormError("One or more images failed to upload. Please retry.");
          setFormSubmitting(false);
          return;
        }
      }

      const isEditing = productView === "edit" && editingProductId;

      const url = isEditing ? `/api/products/${editingProductId}` : "/api/products";
      const method = isEditing ? "PATCH" : "POST";

      const body: Record<string, unknown> = {
        title: formTitle,
        description: formDescription,
        category: formCategory,
        condition: formCondition,
        vendorPrice: Number(formVendorPrice),
        imageS3Keys: s3Keys,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to save product");
        setFormSubmitting(false);
        return;
      }

      setFormSuccess(isEditing ? "Product updated!" : "Product created!");

      // Reset form
      setTimeout(() => {
        resetForm();
        setProductView("list");
        fetchProducts();
      }, 1500);
    } catch {
      setFormError("An unexpected error occurred");
    } finally {
      setFormSubmitting(false);
    }
  }

  function resetForm() {
    setFormTitle("");
    setFormDescription("");
    setFormCategory("PHONES");
    setFormCondition("GOOD");
    setFormVendorPrice("");
    formImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setFormImages([]);
    setFormError("");
    setFormSuccess("");
    setEditingProductId(null);
  }

  function startEdit(product: ProductItem) {
    setFormTitle(product.title);
    setFormDescription(product.description);
    setFormCategory(product.category);
    setFormCondition(product.condition);
    setFormVendorPrice(product.vendorPrice);
    setFormImages(
      product.imageS3Keys.map((key) => ({
        file: new File([], "existing"),
        preview: `${S3_BASE_URL}/${key}`,
        progress: 100,
        s3Key: key,
      }))
    );
    setEditingProductId(product.id);
    setProductView("edit");
  }

  async function handleDelete(productId: string) {
    if (deletingId) return;
    setDeletingId(productId);

    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete product");
      }
    } catch {
      setError("Network error while deleting");
    } finally {
      setDeletingId(null);
    }
  }

  // ── Drag and drop ───────────────────────────────────────────────
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    handleImageSelect(e.dataTransfer.files);
  }

  // ── Sidebar items ───────────────────────────────────────────────
  const sidebarItems: { key: DashboardTab; icon: string; label: string }[] = [
    { key: "products", icon: "📦", label: "Products" },
    { key: "orders", icon: "🧾", label: "Orders" },
    { key: "storefront", icon: "🏪", label: "Storefront" },
    { key: "profile", icon: "👤", label: "Profile" },
  ];

  // ══════════════════════════════════════════════════════════════════
  // ── RENDER ────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════
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
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setActiveTab(item.key);
                if (item.key === "products") setProductView("list");
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === item.key
                  ? "bg-brand-purple/15 text-white border border-brand-purple/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
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
            {activeTab === "products" ? "Products" : activeTab === "orders" ? "Orders" : activeTab === "storefront" ? "Storefront" : "Profile"}
          </h1>
          <div className="flex items-center gap-3">
            {seller && (
              <Link
                href={`/store/${seller.storeName.toLowerCase().replace(/\s+/g, "")}`}
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
          {/* ── Products Tab ─────────────────────────────────────── */}
          {activeTab === "products" && (
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

              {/* Product List View */}
              {productView === "list" && (
                <section className="bg-slate-900/30 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="font-display font-bold text-2xl">Manage Catalog</h2>
                    <button
                      onClick={() => { resetForm(); setProductView("new"); }}
                      className="bg-brand-purple/15 text-brand-pink hover:bg-brand-purple hover:text-white px-5 py-2.5 rounded-xl text-xs font-semibold border border-brand-purple/30 transition-all duration-200"
                    >
                      + New Product
                    </button>
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-16">
                      <div className="w-8 h-8 border-2 border-brand-purple/30 border-t-brand-pink rounded-full animate-spin" />
                    </div>
                  ) : error ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
                      {error}
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-5xl mb-4">📦</div>
                      <h3 className="font-display font-bold text-lg text-white mb-2">No products yet</h3>
                      <p className="text-xs text-slate-400 mb-6">Start selling by adding your first product listing.</p>
                      <button
                        onClick={() => { resetForm(); setProductView("new"); }}
                        className="bg-gradient-to-r from-brand-purple to-brand-pink text-white px-6 py-3 rounded-xl text-xs font-semibold"
                      >
                        Create Your First Listing
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-[10px] text-slate-500 uppercase tracking-widest">
                            <th className="pb-3 font-semibold">Product</th>
                            <th className="pb-3 font-semibold">Category</th>
                            <th className="pb-3 font-semibold">Condition</th>
                            <th className="pb-3 font-semibold">Your Price</th>
                            <th className="pb-3 font-semibold">Listing Price</th>
                            <th className="pb-3 font-semibold">Status</th>
                            <th className="pb-3 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                          {products.map((item) => {
                            const imageUrl = item.imageS3Keys.length > 0
                              ? `${S3_BASE_URL}/${item.imageS3Keys[0]}`
                              : null;
                            return (
                              <tr key={item.id} className="group hover:bg-white/[0.02]">
                                <td className="py-4 flex items-center space-x-3">
                                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-900 border border-white/10 flex-shrink-0">
                                    {imageUrl ? (
                                      <Image src={imageUrl} alt={item.title} fill className="object-cover" sizes="40px" unoptimized />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">📷</div>
                                    )}
                                  </div>
                                  <span className="font-semibold text-white group-hover:text-brand-pink transition-colors line-clamp-1">
                                    {item.title}
                                  </span>
                                </td>
                                <td className="py-4 text-slate-400 font-light">{item.category}</td>
                                <td className="py-4">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border border-white/10 text-slate-300">
                                    {item.condition.replace("_", " ")}
                                  </span>
                                </td>
                                <td className="py-4 font-semibold text-slate-300">GH₵ {Number(item.vendorPrice).toFixed(2)}</td>
                                <td className="py-4 font-semibold text-brand-pink">GH₵ {Number(item.listingPrice).toFixed(2)}</td>
                                <td className="py-4">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    item.status === "ACTIVE"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : item.status === "SOLD"
                                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                      : item.status === "PAUSED"
                                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                      : "bg-slate-800 text-slate-400"
                                  }`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="py-4 text-right">
                                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => startEdit(item)}
                                      className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10 transition-all"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDelete(item.id)}
                                      disabled={deletingId === item.id}
                                      className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all disabled:opacity-50"
                                    >
                                      {deletingId === item.id ? "..." : "Delete"}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}

              {/* ── Product Form (New / Edit) ──────────────────────── */}
              {(productView === "new" || productView === "edit") && (
                <section className="max-w-3xl mx-auto bg-slate-900/40 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="font-display font-bold text-2xl">
                        {productView === "edit" ? "Edit Product" : "New Product"}
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        {productView === "edit"
                          ? "Update your product listing details."
                          : `List a product. A ${commissionLabel} commission is applied to compute the buyer-facing price.`}
                      </p>
                    </div>
                    <button
                      onClick={() => { resetForm(); setProductView("list"); }}
                      className="text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      ← Back
                    </button>
                  </div>

                  {formSuccess && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 mb-6 flex items-center gap-2">
                      ✓ {formSuccess}
                    </div>
                  )}

                  {formError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400 mb-6">
                      {formError}
                    </div>
                  )}

                  <form onSubmit={handleProductSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Product Title <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={200}
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="e.g. MacBook Air M2 (2023)"
                        className="w-full bg-slate-950 border border-white/5 focus:border-brand-pink/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">{formTitle.length}/200</span>
                    </div>

                    {/* Category + Condition */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                          Category <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full bg-slate-950 border border-white/5 focus:border-brand-pink/50 rounded-xl px-3 py-3 text-sm text-white focus:outline-none cursor-pointer"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                          Condition <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={formCondition}
                          onChange={(e) => setFormCondition(e.target.value)}
                          className="w-full bg-slate-950 border border-white/5 focus:border-brand-pink/50 rounded-xl px-3 py-3 text-sm text-white focus:outline-none cursor-pointer"
                        >
                          {CONDITIONS.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Campus Tag (read-only) */}
                    {seller?.campus && (
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                          Campus Tag
                        </label>
                        <div className="bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-400">
                          📍 {seller.campus}
                        </div>
                      </div>
                    )}

                    {/* Vendor Price + Gross-up Preview */}
                    <div className="grid grid-cols-2 gap-4 items-end">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                          Your Payout Price <span className="text-red-400">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-xs text-slate-500 font-medium">GH₵</span>
                          <input
                            type="number"
                            required
                            min="0.01"
                            step="0.01"
                            value={formVendorPrice}
                            onChange={(e) => setFormVendorPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-slate-950 border border-white/5 focus:border-brand-pink/50 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                      <div className="bg-slate-950 border border-dashed border-brand-pink/30 rounded-xl p-3 flex flex-col gap-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                          Buyers will see
                        </span>
                        <span className="font-display font-black text-xl text-brand-pink">
                          GH₵ {grossUpPrice}
                        </span>
                        <span className="text-[9px] text-slate-500">
                          ({commissionLabel} commission applied)
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Description <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Describe the product condition, included accessories, any defects..."
                        className="w-full bg-slate-950 border border-white/5 focus:border-brand-pink/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    {/* Image Upload Zone */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Product Images <span className="text-slate-500">(max 5, each ≤ 5MB)</span>
                      </label>

                      {/* Drop zone */}
                      <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/10 hover:border-brand-pink/40 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 hover:bg-white/[0.02]"
                      >
                        <div className="text-3xl mb-2">📸</div>
                        <p className="text-xs text-slate-400">
                          Drag & drop images here, or <span className="text-brand-pink font-medium">click to browse</span>
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">JPEG, PNG, WebP, GIF, AVIF</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleImageSelect(e.target.files)}
                          className="hidden"
                        />
                      </div>

                      {/* Image previews */}
                      {formImages.length > 0 && (
                        <div className="grid grid-cols-5 gap-3 mt-4">
                          {formImages.map((img, idx) => (
                            <div key={idx} className="relative group">
                              <div className="aspect-square rounded-xl overflow-hidden bg-slate-900 border border-white/10">
                                <Image
                                  src={img.preview}
                                  alt={`Upload ${idx + 1}`}
                                  fill
                                  className="object-cover"
                                  sizes="120px"
                                  unoptimized
                                />
                                {/* Progress overlay */}
                                {img.progress < 100 && !img.error && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <div className="w-12 h-12 relative">
                                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                        <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                                        <circle
                                          cx="18" cy="18" r="16" fill="none" stroke="#D1148A" strokeWidth="2"
                                          strokeDasharray={`${img.progress} 100`}
                                          strokeLinecap="round"
                                        />
                                      </svg>
                                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">
                                        {img.progress}%
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {img.error && (
                                  <div className="absolute inset-0 bg-red-950/80 flex items-center justify-center p-2">
                                    <span className="text-[9px] text-red-400 text-center">{img.error}</span>
                                  </div>
                                )}
                              </div>
                              {/* Remove button */}
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="w-full py-4 bg-gradient-to-r from-brand-purple to-brand-pink text-white font-semibold text-sm rounded-xl shadow-lg transition duration-200 transform hover:scale-[1.01] flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {formSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>{productView === "edit" ? "Updating..." : "Creating..."}</span>
                        </div>
                      ) : (
                        productView === "edit" ? "Update Product" : "Create Listing"
                      )}
                    </button>
                  </form>
                </section>
              )}
            </>
          )}

          {/* ── Orders Tab (Placeholder) ──────────────────────────── */}
          {activeTab === "orders" && (
            <section className="bg-slate-900/30 border border-white/5 rounded-2xl p-16 text-center backdrop-blur-sm">
              <div className="text-5xl mb-4">🧾</div>
              <h3 className="font-display font-bold text-lg text-white mb-2">Orders</h3>
              <p className="text-xs text-slate-400">Order management is coming in T8. Stay tuned!</p>
            </section>
          )}

          {/* ── Storefront Tab ────────────────────────────────────── */}
          {activeTab === "storefront" && seller && (
            <section className="bg-slate-900/30 border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="font-display font-bold text-lg text-white mb-4">Your Storefront</h3>
              <p className="text-xs text-slate-400 mb-6">
                View your public storefront page that buyers see.
              </p>
              <Link
                href={`/store/${seller.storeName.toLowerCase().replace(/\s+/g, "")}`}
                target="_blank"
                className="inline-block bg-gradient-to-r from-brand-purple to-brand-pink text-white px-6 py-3 rounded-xl text-xs font-semibold"
              >
                Open Storefront ↗
              </Link>
            </section>
          )}

          {/* ── Profile Tab ───────────────────────────────────────── */}
          {activeTab === "profile" && seller && (
            <section className="max-w-2xl mx-auto bg-slate-900/40 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
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
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
