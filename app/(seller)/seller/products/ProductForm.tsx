"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSeller } from "../SellerContext";

interface UploadingImage {
  file: File;
  preview: string;
  progress: number;
  s3Key?: string;
  error?: string;
}

export interface ProductItem {
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

interface ProductFormProps {
  product?: ProductItem;
}

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

function computeGrossUp(vendorPrice: number, commissionRate: number): string {
  if (vendorPrice <= 0 || commissionRate < 0 || commissionRate >= 1) return "0.00";
  const listing = vendorPrice / (1 - commissionRate);
  return listing.toFixed(2);
}

export default function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const { seller, fetchData } = useSeller();

  const [formTitle, setFormTitle] = useState(product?.title || "");
  const [formDescription, setFormDescription] = useState(product?.description || "");
  const [formCategory, setFormCategory] = useState(product?.category || "PHONES");
  const [formCondition, setFormCondition] = useState(product?.condition || "GOOD");
  const [formVendorPrice, setFormVendorPrice] = useState(product?.vendorPrice || "");
  const [formImages, setFormImages] = useState<UploadingImage[]>(
    product?.imageS3Keys.map((key) => ({
      file: new File([], "existing"),
      preview: `${S3_BASE_URL}/${key}`,
      progress: 100,
      s3Key: key,
    })) || []
  );
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const commissionRate = seller ? Number(seller.commissionRate) : 0.05;
  const commissionLabel = `${(commissionRate * 100).toFixed(0)}%`;

  const grossUpPrice = formVendorPrice
    ? computeGrossUp(Number(formVendorPrice), commissionRate)
    : "0.00";

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

      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setFormError(`"${file.name}" is not a supported image type. Use JPEG, PNG, WebP, GIF, or AVIF.`);
        continue;
      }

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

  async function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setFormSubmitting(true);

    try {
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

      const isEditing = !!product;
      const url = isEditing ? `/api/products/${product.id}` : "/api/products";
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

      setTimeout(() => {
        fetchData();
        router.push("/seller/products");
      }, 1500);
    } catch {
      setFormError("An unexpected error occurred");
    } finally {
      setFormSubmitting(false);
    }
  }

  return (
    <section className="max-w-3xl mx-auto bg-slate-900/40 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display font-bold text-2xl">
            {product ? "Edit Product" : "New Product"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {product
              ? "Update your product listing details."
              : `List a product. A ${commissionLabel} commission is applied to compute the buyer-facing price.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/seller/products")}
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

        {/* Campus Tag */}
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

          <div
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleImageSelect(e.dataTransfer.files); }}
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
              <span>{product ? "Updating..." : "Creating..."}</span>
            </div>
          ) : (
            product ? "Update Product" : "Create Listing"
          )}
        </button>
      </form>
    </section>
  );
}
