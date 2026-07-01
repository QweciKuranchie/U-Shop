"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";

const queryClient = new QueryClient();

interface OrderDetail {
  id: string;
  reference: string;
  status: string;
  paymentMethod: string;
  paystackReference?: string;
  vendorPrice: string;
  commissionRate: string;
  listingPrice: string;
  deliveryFee: string;
  checkoutPrice: string;
  paystackFee: string;
  totalCharged: string;
  createdAt: string;
  paidAt?: string;
  deliveredAt?: string;
  product: {
    id: string;
    title: string;
    imageS3Keys: string[];
    seller: {
      storeName: string;
      handle: string;
      campus: string;
      tier: string;
    };
  };
  deliveryAddress: {
    addressText: string;
    landmark?: string;
    recipientPhone: string;
    zone: {
      name: string;
    };
  };
  rider?: {
    name: string;
    phone: string | null;
  } | null;
}

function BuyerOrderDetailContent() {
  const { id } = useParams() as { id: string };
  const { data: session, isPending: sessionPending } = useSession();

  const { data: order, isLoading, error } = useQuery<OrderDetail>({
    queryKey: ["buyer-order-detail", id],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) throw new Error("Order not found or access denied");
      const data = await res.json();
      return data.order;
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
          <p className="text-slate-400 text-xs">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="font-display font-bold text-2xl mb-2">Access Denied</h2>
        <p className="text-slate-400 text-xs mb-6">Please log in to view this order.</p>
        <Link href="/login" className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-xs font-semibold hover:bg-white/10 transition">
          Log In
        </Link>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="font-display font-bold text-2xl mb-2">Order Not Found</h2>
        <p className="text-slate-400 text-xs mb-6">
          This order may not exist or you do not have permission to view it.
        </p>
        <Link href="/account/orders" className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-xs font-semibold hover:bg-white/10 transition">
          My Orders
        </Link>
      </div>
    );
  }

  const s3Bucket = process.env.NEXT_PUBLIC_S3_BUCKET || "u-shop-product-images";
  const s3Region = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1";
  const s3BaseUrl = `https://${s3Bucket}.s3.${s3Region}.amazonaws.com`;
  const productImageUrl = order.product.imageS3Keys?.length > 0 ? `${s3BaseUrl}/${order.product.imageS3Keys[0]}` : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Header */}
      <div className="border-b border-white/5 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/account/orders" className="text-slate-400 text-xs hover:text-white transition flex items-center gap-1">
            ← Back to Orders
          </Link>
          <div className="text-slate-400 text-[10px] font-mono">{order.reference}</div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-8 space-y-6">
        {/* Main Status Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-slate-400 text-[11px] font-light">Order Status</p>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-lg text-white">Fulfillment</h2>
              {getStatusBadge(order.status)}
            </div>
          </div>
          <Link
            href="mailto:support@ushopgh.com?subject=U-Shop%20Order%20Help"
            className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-white/10 transition text-pink-500"
          >
            Contact Admin
          </Link>
        </div>

        {/* Rider details (only shown when IN_TRANSIT) */}
        {order.rider && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h3 className="font-display font-bold text-xs text-slate-400 uppercase tracking-wider">Assigned Rider</h3>
            <div className="text-xs space-y-2 font-light">
              <div className="flex justify-between">
                <span className="text-slate-400">Name</span>
                <span className="text-white font-medium">{order.rider.name}</span>
              </div>
              {order.status === "IN_TRANSIT" && order.rider.phone ? (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Phone</span>
                  <a href={`tel:${order.rider.phone}`} className="text-pink-500 font-mono font-semibold hover:underline">
                    {order.rider.phone}
                  </a>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 font-light italic mt-1">
                  Rider contact is hidden until delivery is in transit.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Product & Storefront */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-4">
          {productImageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={productImageUrl}
              alt={order.product.title}
              className="w-16 h-16 rounded-xl object-cover bg-slate-900 border border-white/5"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-slate-900 flex items-center justify-center border border-white/5 text-slate-700 text-lg">
              🖼️
            </div>
          )}
          <div className="text-xs space-y-1">
            <h3 className="font-semibold text-white text-sm line-clamp-1">{order.product.title}</h3>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>Sold by:</span>
              <span className="text-white font-medium">{order.product.seller.storeName}</span>
              <span className="text-slate-500 bg-white/10 px-1.5 py-0.5 rounded text-[9px] uppercase">
                {order.product.seller.tier}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Details */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
          <h3 className="font-display font-bold text-xs text-slate-400 uppercase tracking-wider">Delivery Details</h3>
          <div className="text-xs space-y-2 font-light">
            <div className="flex justify-between">
              <span className="text-slate-400">Zone</span>
              <span className="text-white font-medium">{order.deliveryAddress.zone.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Address</span>
              <span className="text-white text-right max-w-sm">{order.deliveryAddress.addressText}</span>
            </div>
            {order.deliveryAddress.landmark && (
              <div className="flex justify-between">
                <span className="text-slate-400">Landmark</span>
                <span className="text-white">{order.deliveryAddress.landmark}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Recipient Phone</span>
              <span className="text-white font-mono">{order.deliveryAddress.recipientPhone}</span>
            </div>
          </div>
        </div>

        {/* Pricing breakdown */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
          <h3 className="font-display font-bold text-xs text-slate-400 uppercase tracking-wider">Pricing Details</h3>
          <div className="space-y-3 text-xs font-light">
            <div className="flex justify-between">
              <span className="text-slate-400">Product Price</span>
              <span className="text-slate-300">GHS {parseFloat(order.listingPrice).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Delivery Fee</span>
              <span className="text-slate-300">GHS {parseFloat(order.deliveryFee).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-dashed border-white/5 pt-3">
              <span className="text-slate-300">Checkout Price</span>
              <span className="text-slate-200">GHS {parseFloat(order.checkoutPrice).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Paystack Fee</span>
              <span className="text-slate-300">GHS {parseFloat(order.paystackFee).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold border-t border-white/10 pt-4 text-white">
              <span>Total Charged</span>
              <span className="text-pink-500 text-base font-display">GHS {parseFloat(order.totalCharged).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuyerOrderDetail() {
  return (
    <QueryClientProvider client={queryClient}>
      <BuyerOrderDetailContent />
    </QueryClientProvider>
  );
}
