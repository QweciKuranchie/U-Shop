"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSeller } from "../SellerContext";

const S3_BASE_URL = `https://${process.env.NEXT_PUBLIC_S3_PRODUCT_BUCKET || "ushop-product-images-01"}.s3.${process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1"}.amazonaws.com`;

export default function ProductsListPage() {
  const router = useRouter();
  const { products, loading, error, setProducts, setError } = useSeller();
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-8 h-8 border-2 border-brand-purple/30 border-t-brand-pink rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <section className="bg-slate-900/30 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display font-bold text-2xl">Manage Catalog</h2>
        <Link
          href="/seller/products/new"
          className="bg-brand-purple/15 text-brand-pink hover:bg-brand-purple hover:text-white px-5 py-2.5 rounded-xl text-xs font-semibold border border-brand-purple/30 transition-all duration-200"
        >
          + New Product
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 mb-4">
          {error}
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="font-display font-bold text-lg text-white mb-2">No products yet</h3>
          <p className="text-xs text-slate-400 mb-6">Start selling by adding your first product listing.</p>
          <Link
            href="/seller/products/new"
            className="inline-block bg-gradient-to-r from-brand-purple to-brand-pink text-white px-6 py-3 rounded-xl text-xs font-semibold"
          >
            Create Your First Listing
          </Link>
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
                const isSold = item.status === "SOLD";

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
                      {/* Hide edit and delete actions for sold items */}
                      {!isSold && (
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => router.push(`/seller/products/${item.id}/edit`)}
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
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
