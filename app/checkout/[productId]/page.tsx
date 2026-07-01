"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { QueryClient, QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

interface DeliveryZone {
  id: string;
  name: string;
  flatFee: string;
}

interface DeliveryAddress {
  id: string;
  type: "CAMPUS" | "HOME";
  zoneId: string;
  addressText: string;
  landmark?: string;
  recipientPhone: string;
  zone: DeliveryZone;
  isDefault: boolean;
}

interface Product {
  id: string;
  title: string;
  listingPrice: string;
  imageS3Keys: string[];
}

function CheckoutPageContent() {
  const { productId } = useParams() as { productId: string };
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();

  // Redirect if not logged in
  useEffect(() => {
    if (!sessionPending && !session) {
      router.push(`/login?callbackUrl=/checkout/${productId}`);
    }
  }, [session, sessionPending, productId, router]);

  // Form states
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isAddingAddress, setIsAddingAddress] = useState<boolean>(false);
  const [addressType, setAddressType] = useState<"CAMPUS" | "HOME">("CAMPUS");
  const [zoneId, setZoneId] = useState<string>("");
  const [addressText, setAddressText] = useState<string>("");
  const [landmark, setLandmark] = useState<string>("");
  const [recipientPhone, setRecipientPhone] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"PAYSTACK" | "CASH_ON_DELIVERY">("PAYSTACK");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Queries
  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: ["product", productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) throw new Error("Failed to load product");
      const data = await res.json();
      return data.product;
    },
  });

  const { data: addresses = [], refetch: refetchAddresses, isLoading: addressesLoading } = useQuery<DeliveryAddress[]>({
    queryKey: ["addresses"],
    queryFn: async () => {
      const res = await fetch("/api/addresses");
      if (!res.ok) throw new Error("Failed to load addresses");
      const data = await res.json();
      return data.addresses;
    },
    enabled: !!session,
  });

  const { data: zones = [] } = useQuery<DeliveryZone[]>({
    queryKey: ["zones"],
    queryFn: async () => {
      const res = await fetch("/api/delivery-zones");
      if (!res.ok) throw new Error("Failed to load zones");
      const data = await res.json();
      return data.zones;
    },
  });

  // Calculate pricing values
  const listingPriceNum = product ? parseFloat(product.listingPrice) : 0;
  
  // Find selected delivery fee
  let deliveryFeeNum = 0;
  if (isAddingAddress) {
    const activeZone = zones.find((z) => z.id === zoneId);
    if (activeZone) {
      deliveryFeeNum = parseFloat(activeZone.flatFee);
    }
  } else {
    const activeAddress = addresses.find((a) => a.id === selectedAddressId);
    if (activeAddress) {
      deliveryFeeNum = parseFloat(activeAddress.zone.flatFee);
    }
  }

  const checkoutPriceNum = listingPriceNum + deliveryFeeNum;

  // Paystack Fee = (1.95% * checkoutPrice) + 0.50 GHS
  const paystackFeeNum = paymentMethod === "PAYSTACK" && checkoutPriceNum > 0
    ? (checkoutPriceNum * 0.0195) + 0.50
    : 0;

  const totalDueNum = checkoutPriceNum + paystackFeeNum;

  // Format strings
  const listingPriceStr = listingPriceNum.toFixed(2);
  const deliveryFeeStr = deliveryFeeNum.toFixed(2);
  const checkoutPriceStr = checkoutPriceNum.toFixed(2);
  const paystackFeeStr = paystackFeeNum.toFixed(2);
  const totalDueStr = totalDueNum.toFixed(2);

  // Auto select default address
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId && !isAddingAddress) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses, selectedAddressId, isAddingAddress]);

  // Mutations
  const createAddressMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: addressType,
          zoneId,
          addressText,
          landmark: landmark || undefined,
          recipientPhone,
          isDefault: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save address");
      }
      const data = await res.json();
      return data.address;
    },
  });

  const handleCheckout = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      let finalAddressId = selectedAddressId;

      // Persist address inline if adding a new one
      if (isAddingAddress) {
        if (!zoneId) throw new Error("Please select a delivery zone");
        if (!addressText.trim()) throw new Error("Please enter your address");
        if (!recipientPhone.trim()) throw new Error("Please enter a recipient phone number");

        const savedAddr = await createAddressMutation.mutateAsync();
        finalAddressId = savedAddr.id;
        await refetchAddresses();
        setIsAddingAddress(false);
        setSelectedAddressId(savedAddr.id);
      }

      if (!finalAddressId) {
        throw new Error("Please select or add a delivery address");
      }

      if (paymentMethod === "CASH_ON_DELIVERY") {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: productId,
            deliveryAddressId: finalAddressId,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to place order");
        }

        const data = await res.json();
        router.push(`/orders/${data.orderId}/confirmation`);
      } else {
        // Pay with Paystack Pop
        const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_KEY;
        if (!paystackKey) {
          throw new Error("Paystack public key is not configured.");
        }

        const userEmail = session?.user?.email;
        if (!userEmail) {
          throw new Error("User email is missing.");
        }

        // @ts-expect-error window.PaystackPop is loaded dynamically
        if (typeof window.PaystackPop === "undefined") {
          throw new Error("Paystack is loading, please try again in a moment.");
        }

        const randomRef = "pay_" + Math.random().toString(36).substring(2, 15);

        // @ts-expect-error window.PaystackPop is loaded dynamically
        const handler = window.PaystackPop.setup({
          key: paystackKey,
          email: userEmail,
          amount: Math.round(totalDueNum * 100),
          currency: "GHS",
          ref: randomRef,
          metadata: {
            productId: productId,
            buyerId: session.user.id,
            deliveryAddressId: finalAddressId,
          },
          callback: function(response: { reference: string }) {
            // Check status of payment loop
            pollPaymentStatus(response.reference);
          },
          onClose: function() {
            setIsSubmitting(false);
          },
        });

        handler.openIframe();
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  const pollPaymentStatus = (reference: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/orders/check-payment?reference=${reference}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "success") {
          clearInterval(interval);
          router.push(`/orders/${data.orderId}/confirmation`);
        } else if (data.status === "refunded") {
          clearInterval(interval);
          setErrorMessage(data.message || "Item already sold — refund started");
          setIsSubmitting(false);
        }
      } catch (e) {
        console.error("Polling payment status error:", e);
      }

      if (attempts > 30) {
        clearInterval(interval);
        setErrorMessage("Payment verification timeout. Please check your account orders page.");
        setIsSubmitting(false);
      }
    }, 2000);
  };

  if (sessionPending || productLoading || addressesLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-t-pink-500 border-white/10 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs font-light">Loading checkout details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="font-display font-bold text-2xl mb-2">Product Not Found</h2>
        <Link href="/products" className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-xs font-semibold hover:bg-white/10 transition">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const s3Bucket = process.env.NEXT_PUBLIC_S3_BUCKET || "u-shop-product-images";
  const s3Region = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1";
  const s3BaseUrl = `https://${s3Bucket}.s3.${s3Region}.amazonaws.com`;
  const productImageUrl = product.imageS3Keys?.length > 0 ? `${s3BaseUrl}/${product.imageS3Keys[0]}` : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Script for Paystack */}
      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />

      {/* Header */}
      <div className="border-b border-white/5 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-display font-black text-lg tracking-wider bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            U-SHOP
          </Link>
          <div className="text-slate-400 text-xs font-light">Secure Checkout</div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Left column: Address Selector, Form, and Payment Options */}
        <div className="md:col-span-3 space-y-6">
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-xs text-red-400">
              {errorMessage}
            </div>
          )}

          {/* Delivery Address Box */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-display font-bold text-sm text-white mb-4">1. Delivery Address</h3>

            {!isAddingAddress && (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition ${
                      selectedAddressId === addr.id
                        ? "border-pink-500 bg-pink-500/5"
                        : "border-white/5 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery_address"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 accent-pink-500"
                    />
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded text-[10px]">
                          {addr.type}
                        </span>
                        <span className="font-semibold text-slate-300">{addr.zone.name}</span>
                      </div>
                      <p className="text-slate-400 leading-relaxed">{addr.addressText}</p>
                      {addr.landmark && (
                        <p className="text-slate-500 text-[11px] font-light">
                          Landmark: {addr.landmark}
                        </p>
                      )}
                      <p className="text-slate-500 text-[11px] font-light">
                        Recipient: {addr.recipientPhone}
                      </p>
                    </div>
                  </label>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setIsAddingAddress(true);
                    setSelectedAddressId("");
                  }}
                  className="w-full py-3 rounded-xl border border-dashed border-white/10 hover:border-pink-500 hover:bg-pink-500/5 text-xs text-pink-500 transition font-semibold"
                >
                  + Add new address
                </button>
              </div>
            )}

            {isAddingAddress && (
              <div className="space-y-4">
                {/* Expand in place form */}
                <div className="flex bg-white/5 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAddressType("CAMPUS")}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                      addressType === "CAMPUS" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Campus
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddressType("HOME")}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                      addressType === "HOME" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Home
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px]">Delivery Zone</label>
                  <select
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-pink-500 transition"
                  >
                    <option value="">Select delivery zone</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} (GHS {parseFloat(z.flatFee).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px]">Full Address Text</label>
                  <textarea
                    value={addressText}
                    onChange={(e) => setAddressText(e.target.value)}
                    placeholder="Hostel, Room Number, Block, Street Name..."
                    rows={2}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-pink-500 transition resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px]">Landmark (Optional)</label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Near the main gate, opposite block C..."
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-pink-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px]">Recipient Phone Number</label>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="e.g. +233 24 000 0000"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-pink-500 transition"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingAddress(false);
                      setZoneId("");
                      setAddressText("");
                      setLandmark("");
                      setRecipientPhone("");
                    }}
                    className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-xs hover:bg-white/10 transition font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!zoneId || !addressText || !recipientPhone}
                    onClick={() => {
                      // We will keep isAddingAddress true so the summary fee stays updated, and save on checkout button
                      setIsAddingAddress(false);
                      // Form selected address string summary
                      setSelectedAddressId("new-address-pending");
                    }}
                    className="flex-1 py-3 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-xl text-xs transition font-semibold"
                  >
                    Use Address
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-display font-bold text-sm text-white mb-4">2. Payment Method</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("PAYSTACK")}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition ${
                  paymentMethod === "PAYSTACK"
                    ? "border-pink-500 bg-pink-500/5 text-white"
                    : "border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                }`}
              >
                <span className="text-xl">💳</span>
                <span className="text-xs font-semibold">Paystack (MoMo & Card)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition ${
                  paymentMethod === "CASH_ON_DELIVERY"
                    ? "border-pink-500 bg-pink-500/5 text-white"
                    : "border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                }`}
              >
                <span className="text-xl">💵</span>
                <span className="text-xs font-semibold">Cash on Delivery</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Sticky Checkout Pricing & Summary Card */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6 sticky top-24">
            <div className="flex gap-4">
              {productImageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={productImageUrl}
                  alt={product.title}
                  className="w-16 h-16 rounded-lg object-cover bg-slate-900 border border-white/10"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-slate-900 flex items-center justify-center border border-white/10 text-slate-700">
                  🖼️
                </div>
              )}
              <div className="text-xs space-y-1">
                <h4 className="font-semibold text-white line-clamp-2">{product.title}</h4>
                <div className="text-pink-500 font-bold">GHS {listingPriceStr}</div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 space-y-3">
              {/* 5-line price breakdown */}
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-light">Product Price</span>
                <span className="text-slate-300">GHS {listingPriceStr}</span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-light">Delivery Fee</span>
                <span className="text-slate-300">GHS {deliveryFeeStr}</span>
              </div>

              <div className="flex justify-between text-xs font-semibold border-t border-dashed border-white/5 pt-3">
                <span className="text-slate-300">Checkout Price</span>
                <span className="text-slate-200">GHS {checkoutPriceStr}</span>
              </div>

              <div className="flex justify-between text-xs group relative">
                <span className="text-slate-400 font-light flex items-center gap-1 cursor-pointer">
                  Paystack Fee ℹ️
                  <span className="absolute bottom-6 left-0 bg-slate-900 border border-white/10 text-slate-300 text-[10px] p-2 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition duration-200 w-48 z-10 font-normal leading-normal shadow-xl">
                    Charged by Paystack. U-Shop does not retain this.
                  </span>
                </span>
                <span className="text-slate-300">GHS {paystackFeeStr}</span>
              </div>

              <div className="flex justify-between items-center text-sm font-bold border-t border-white/10 pt-4 text-white">
                <span>TOTAL DUE</span>
                <span className="text-pink-500 font-display text-base">GHS {totalDueStr}</span>
              </div>
            </div>

            {/* Action buttons */}
            <button
              type="button"
              disabled={isSubmitting || (!selectedAddressId && !isAddingAddress)}
              onClick={handleCheckout}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold transition duration-300 flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  Processing Order...
                </>
              ) : paymentMethod === "PAYSTACK" ? (
                `Pay with Paystack`
              ) : (
                `Cash on Delivery`
              )}
            </button>

            {(!selectedAddressId && !isAddingAddress) && (
              <p className="text-[10px] text-center text-red-400 font-light">
                Please select or add a delivery address to complete your order.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <CheckoutPageContent />
    </QueryClientProvider>
  );
}
