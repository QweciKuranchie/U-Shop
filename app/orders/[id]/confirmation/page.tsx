"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";

const queryClient = new QueryClient();

interface OrderDetail {
  id: string;
  reference: string;
  status: string;
  paymentMethod: string;
  listingPrice: string;
  deliveryFee: string;
  checkoutPrice: string;
  paystackFee: string;
  totalCharged: string;
  product: {
    title: string;
  };
  deliveryAddress: {
    addressText: string;
    landmark?: string;
    recipientPhone: string;
    zone: {
      name: string;
    };
  };
}

function OrderConfirmationContent() {
  const { id } = useParams() as { id: string };

  const { data: order, isLoading, error } = useQuery<OrderDetail>({
    queryKey: ["order-confirm", id],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) throw new Error("Order not found");
      const data = await res.json();
      return data.order;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-t-pink-500 border-white/10 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs">Loading order confirmation...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="font-display font-bold text-2xl mb-2">Order Not Found</h2>
        <Link href="/products" className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-xs font-semibold hover:bg-white/10 transition">
          Back to Browse
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Header */}
      <div className="border-b border-white/5 bg-slate-950/60 backdrop-blur-xl">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-display font-black text-lg tracking-wider bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            U-SHOP
          </Link>
          <Link href="/account/orders" className="text-slate-400 text-xs hover:text-white transition">
            My Orders
          </Link>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-12 space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-3xl animate-bounce">
            ✓
          </div>
          <h2 className="font-display font-bold text-2xl text-white">Order Confirmed!</h2>
          <p className="text-xs text-slate-400 font-light">
            Thank you for your purchase. Your order reference is <strong className="text-white font-mono">{order.reference}</strong>.
          </p>
        </div>

        {/* Product Details */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="font-display font-bold text-xs text-slate-400 uppercase tracking-wider">Item Details</h3>
          <div className="flex justify-between items-center text-xs">
            <span className="text-white font-semibold">{order.product.title}</span>
            <span className="text-slate-400">Payment: {order.paymentMethod === "PAYSTACK" ? "Paystack" : "Cash on Delivery"}</span>
          </div>
        </div>

        {/* Address snapshot */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="font-display font-bold text-xs text-slate-400 uppercase tracking-wider">Delivery Details</h3>
          <div className="text-xs space-y-2 font-light">
            <div className="flex justify-between">
              <span className="text-slate-400">Zone</span>
              <span className="text-white font-medium">{order.deliveryAddress.zone.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Address</span>
              <span className="text-white text-right max-w-xs">{order.deliveryAddress.addressText}</span>
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
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="font-display font-bold text-xs text-slate-400 uppercase tracking-wider">Price Breakdown</h3>
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
              <span>Total Paid</span>
              <span className="text-pink-500 text-base font-display">GHS {parseFloat(order.totalCharged).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Link href="/products" className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-bold text-center transition">
            Continue Shopping
          </Link>
          <Link href="/account/orders" className="flex-1 py-4 bg-pink-500 hover:bg-pink-600 rounded-xl text-xs font-bold text-center transition">
            View My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmation() {
  return (
    <QueryClientProvider client={queryClient}>
      <OrderConfirmationContent />
    </QueryClientProvider>
  );
}
