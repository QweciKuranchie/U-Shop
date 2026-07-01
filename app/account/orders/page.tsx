"use client";

import React from "react";
import Link from "next/link";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";

const queryClient = new QueryClient();

interface Order {
  id: string;
  reference: string;
  status: string;
  paymentMethod: string;
  totalCharged: string;
  createdAt: string;
  product: {
    title: string;
    imageS3Keys: string[];
  };
}

function BuyerOrdersContent() {
  const { data: session, isPending: sessionPending } = useSession();

  const { data: orders = [], isLoading, error } = useQuery<Order[]>({
    queryKey: ["buyer-orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      return data.orders;
    },
    enabled: !!session,
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PAID: { label: "Paid", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
      PENDING_COD: { label: "Pending COD", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
      IN_TRANSIT: { label: "In Transit", className: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
      DELIVERED: { label: "Delivered", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
      COMPLETED: { label: "Completed", className: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
      CANCELLED: { label: "Cancelled", className: "bg-red-500/10 text-red-400 border-red-500/20" },
      DISPUTED: { label: "Disputed", className: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
    };

    const config = statusConfig[status] || { label: status, className: "bg-white/10 text-white border-white/20" };

    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (sessionPending || isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-t-pink-500 border-white/10 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="font-display font-bold text-2xl mb-2">Access Denied</h2>
        <p className="text-xs text-slate-400 mb-6">Please log in to view your orders.</p>
        <Link href="/login" className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-xs font-semibold hover:bg-white/10 transition">
          Log In
        </Link>
      </div>
    );
  }

  const s3Bucket = process.env.NEXT_PUBLIC_S3_BUCKET || "u-shop-product-images";
  const s3Region = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1";
  const s3BaseUrl = `https://${s3Bucket}.s3.${s3Region}.amazonaws.com`;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Header */}
      <div className="border-b border-white/5 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-display font-black text-lg tracking-wider bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            U-SHOP
          </Link>
          <Link href="/products" className="text-slate-400 text-xs hover:text-white transition">
            Browse Marketplace
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-xl text-white">My Orders</h2>
          <span className="text-[11px] text-slate-400">{orders.length} orders total</span>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-xs text-red-400">
            Failed to load orders. Please try again later.
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl py-20 text-center space-y-4">
            <div className="text-5xl">📦</div>
            <h3 className="font-display font-bold text-base text-white">No orders yet</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto font-light">
              You haven&apos;t placed any orders yet. Visit the marketplace to find campus deals!
            </p>
            <Link href="/products" className="inline-block bg-pink-500 hover:bg-pink-600 px-6 py-3 rounded-xl text-xs font-bold transition">
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => {
              const imgUrl = o.product.imageS3Keys?.length > 0 ? `${s3BaseUrl}/${o.product.imageS3Keys[0]}` : null;
              return (
                <div key={o.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex gap-4">
                    {imgUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={imgUrl}
                        alt={o.product.title}
                        className="w-16 h-16 rounded-xl object-cover bg-slate-900 border border-white/5"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-900 flex items-center justify-center border border-white/5 text-slate-700 text-lg">
                        🖼️
                      </div>
                    )}
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 font-medium">{o.reference}</span>
                        {getStatusBadge(o.status)}
                      </div>
                      <h4 className="font-semibold text-white text-sm line-clamp-1">{o.product.title}</h4>
                      <p className="text-[11px] text-slate-500 font-light">
                        Ordered on {new Date(o.createdAt).toLocaleDateString()} · Method: {o.paymentMethod === "PAYSTACK" ? "Paystack" : "COD"}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t border-white/5 sm:border-t-0 pt-3 sm:pt-0">
                    <div className="text-slate-400 text-xs sm:mb-2">
                      Total: <strong className="text-white">GHS {parseFloat(o.totalCharged).toFixed(2)}</strong>
                    </div>
                    <Link
                      href={`/account/orders/${o.id}`}
                      className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-[11px] font-semibold hover:bg-white/10 transition"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BuyerOrders() {
  return (
    <QueryClientProvider client={queryClient}>
      <BuyerOrdersContent />
    </QueryClientProvider>
  );
}
