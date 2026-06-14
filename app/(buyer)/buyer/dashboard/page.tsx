"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/components/Logo";

// Mock Product data based on schema seeding
const MOCK_PRODUCTS = [
  {
    id: "p1",
    title: "iPhone 13 Pro (128GB)",
    description: "Sierra Blue, excellent battery health (92%), clean body with minor screen scratch. Comes with case.",
    category: "PHONES",
    condition: "GOOD",
    vendorPrice: 6500.0,
    listingPrice: 6825.0, // 5% markup
    image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=400&q=80",
    sellerName: "Gadget Hub Legon",
    campus: "Legon Main",
  },
  {
    id: "p2",
    title: "MacBook Air M1 (2020)",
    description: "8GB RAM, 256GB SSD, Space Gray. Battery cycle count 110. Includes original USB-C brick.",
    category: "LAPTOPS",
    condition: "LIKE_NEW",
    vendorPrice: 8000.0,
    listingPrice: 8400.0, // 5% markup
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80",
    sellerName: "Dorm Deals GH",
    campus: "Legon Main",
  },
  {
    id: "p3",
    title: "Sony WH-1000XM4 Headphones",
    description: "Active noise-canceling headphones, silver color. Lightly used for 3 months. Impeccable sound.",
    category: "AUDIO",
    condition: "LIKE_NEW",
    vendorPrice: 2200.0,
    listingPrice: 2310.0, // 5% markup
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80",
    sellerName: "AudioVerse Ghana",
    campus: "Korle-Bu",
  },
  {
    id: "p4",
    title: "Anker PowerCore 24K",
    description: "140W fast charging power bank. Perfect for power outages. Can charge laptop and phone simultaneously.",
    category: "ACCESSORIES",
    condition: "GOOD",
    vendorPrice: 950.0,
    listingPrice: 997.5, // 5% markup
    image: "https://images.unsplash.com/photo-1609592424109-dd776cb2b3c2?auto=format&fit=crop&w=400&q=80",
    sellerName: "Gadget Hub Legon",
    campus: "Accra City",
  },
  {
    id: "p5",
    title: "Logitech MX Master 3S Mouse",
    description: "Ergonomic wireless mouse, pale gray. Silent clicks, 8K DPI tracking. Used for 1 month.",
    category: "ACCESSORIES",
    condition: "LIKE_NEW",
    vendorPrice: 850.0,
    listingPrice: 892.5, // 5% markup
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=400&q=80",
    sellerName: "Dorm Deals GH",
    campus: "Legon Main",
  },
  {
    id: "p6",
    title: "Keychron K2 Mechanical Keyboard",
    description: "Gateron Brown switches, RGB backlight, aluminum frame. Wireless Bluetooth/Wired.",
    category: "GAMING",
    condition: "FAIR",
    vendorPrice: 700.0,
    listingPrice: 735.0, // 5% markup
    image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=400&q=80",
    sellerName: "AudioVerse Ghana",
    campus: "Korle-Bu",
  }
];

const MOCK_ORDERS = [
  {
    id: "ord-1",
    reference: "USH-20260613-748291",
    productTitle: "iPhone 13 Pro (128GB)",
    price: 6825.0,
    status: "READY_FOR_PICKUP",
    riderName: "Kojo Mensah",
    riderPhone: "+233 24 123 4567",
    deliveryFee: 25.0,
  },
  {
    id: "ord-2",
    reference: "USH-20260611-394851",
    productTitle: "Sony WH-1000XM4 Headphones",
    price: 2310.0,
    status: "DELIVERED",
    riderName: "Ama Serwaa",
    riderPhone: "+233 27 987 6543",
    deliveryFee: 20.0,
  }
];

export default function BuyerDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCampus, setSelectedCampus] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<typeof MOCK_PRODUCTS>([]);
  const [activeTab, setActiveTab] = useState<"browse" | "orders">("browse");
  
  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "MOBILE_MONEY" | "CASH_ON_DELIVERY">("MOBILE_MONEY");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Filters
  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((product) => {
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCampus = selectedCampus === "All" || product.campus === selectedCampus;
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      return matchesSearch && matchesCampus && matchesCategory;
    });
  }, [searchQuery, selectedCampus, selectedCategory]);

  const addToCart = (product: typeof MOCK_PRODUCTS[0]) => {
    if (cart.some((item) => item.id === product.id)) return;
    setCart([...cart, product]);
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.listingPrice, 0);
  }, [cart]);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setCheckoutSuccess(true);
      setCart([]);
      setTimeout(() => {
        setCheckoutSuccess(false);
        setShowCheckoutModal(false);
        setActiveTab("orders");
      }, 1500);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-purple/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-pink/10 blur-[130px] pointer-events-none" />

      {/* Nav */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center group">
            <Logo size="md" lightMode={false} />
          </Link>

          <nav className="flex space-x-6 text-sm font-medium">
            <button
              onClick={() => setActiveTab("browse")}
              className={`pb-1 border-b-2 transition-all ${
                activeTab === "browse" ? "border-brand-pink text-white" : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Browse Catalog
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`pb-1 border-b-2 transition-all ${
                activeTab === "orders" ? "border-brand-pink text-white" : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              My Orders
            </button>
          </nav>

          <div className="flex items-center space-x-4">
            <Link
              href="/login?logout=true"
              className="text-xs font-semibold text-slate-400 hover:text-white transition duration-200"
            >
              Logout
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-grow w-full z-10">
        
        {activeTab === "browse" ? (
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Catalog (Left/Main Side) */}
            <div className="flex-grow lg:w-2/3">
              
              {/* Filter / Search Bar Bar */}
              <div className="p-6 bg-slate-900/40 border border-white/5 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 items-center justify-between backdrop-blur-sm">
                
                {/* Search */}
                <div className="relative w-full md:w-1/3">
                  <input
                    type="text"
                    placeholder="Search campus deals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 focus:border-brand-pink/50 rounded-xl px-4 py-2.5 text-sm placeholder-slate-600 focus:outline-none transition-colors duration-200"
                  />
                </div>

                {/* Campus Filter */}
                <div className="flex items-center space-x-2 w-full md:w-auto">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Campus:</span>
                  <select
                    value={selectedCampus}
                    onChange={(e) => setSelectedCampus(e.target.value)}
                    className="bg-slate-950 border border-white/5 focus:border-brand-pink/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Campuses</option>
                    <option value="Legon Main">Legon Main</option>
                    <option value="Accra City">Accra City</option>
                    <option value="Korle-Bu">Korle-Bu</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div className="flex items-center space-x-2 w-full md:w-auto">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Category:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-slate-950 border border-white/5 focus:border-brand-pink/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    <option value="PHONES">Phones</option>
                    <option value="LAPTOPS">Laptops</option>
                    <option value="AUDIO">Audio</option>
                    <option value="ACCESSORIES">Accessories</option>
                    <option value="GAMING">Gaming</option>
                  </select>
                </div>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group bg-slate-900/30 border border-white/5 rounded-2xl overflow-hidden hover:border-brand-purple/40 hover:shadow-xl hover:shadow-brand-purple/5 transition-all duration-300 transform hover:-translate-y-1"
                  >
                    {/* Image */}
                    <div className="relative h-44 bg-slate-950 w-full overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-w-768px) 100vw, 33vw"
                        unoptimized
                      />
                      <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-bold tracking-wider text-brand-pink uppercase">
                        {product.condition.replace("_", " ")}
                      </div>
                      <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 text-[10px] font-medium text-slate-400">
                        📍 {product.campus}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1 block">
                        {product.category}
                      </span>
                      <h3 className="font-display font-bold text-lg text-white line-clamp-1 mb-1.5">
                        {product.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-4 font-light leading-relaxed">
                        {product.description}
                      </p>
                      
                      <div className="flex items-end justify-between pt-2 border-t border-white/5">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block leading-none mb-1">List Price</span>
                          <span className="font-display font-black text-xl text-white">
                            GH₵ {product.listingPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          className="bg-brand-purple/15 text-brand-pink hover:bg-brand-purple hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold border border-brand-purple/30 hover:border-transparent transition-all duration-200"
                        >
                          Add +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredProducts.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-500 font-light">
                    No products matched your search filters.
                  </div>
                )}
              </div>
            </div>

            {/* Shopping Cart Sidebar (Right Side) */}
            <div className="w-full lg:w-1/3">
              <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 sticky top-28 backdrop-blur-md shadow-2xl">
                <h3 className="font-display font-bold text-xl mb-4 flex items-center justify-between">
                  <span>Shopping Cart</span>
                  <span className="bg-brand-pink/20 text-brand-pink text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {cart.length}
                  </span>
                </h3>

                {cart.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 font-light text-sm">
                    Your cart is empty. Add products to get started.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="max-h-60 overflow-y-auto pr-1 space-y-3">
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center bg-slate-950/60 p-3 rounded-xl border border-white/5"
                        >
                          <div className="pr-4">
                            <h4 className="text-xs font-bold text-white line-clamp-1">{item.title}</h4>
                            <p className="text-[10px] text-brand-pink mt-0.5">
                              GH₵ {item.listingPrice.toFixed(2)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-500 hover:text-brand-red text-xs p-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-2">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Items Subtotal</span>
                        <span>GH₵ {cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Estimated Delivery Fee</span>
                        <span>GH₵ 20.00</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-dashed border-white/5">
                        <span>Total Checkout</span>
                        <span className="text-brand-pink">
                          GH₵ {(cartTotal + 20.00).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowCheckoutModal(true)}
                      className="w-full mt-4 py-3 bg-gradient-to-r from-brand-purple to-brand-pink text-white font-semibold text-xs rounded-xl shadow-lg transition duration-200 transform hover:scale-[1.01]"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* My Orders Tab */
          <div className="space-y-6 max-w-4xl mx-auto">
            <h2 className="font-display font-bold text-3xl mb-6">My Purchases</h2>
            
            {MOCK_ORDERS.map((order) => (
              <div
                key={order.id}
                className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/5 mb-4 gap-2">
                  <div>
                    <span className="text-xs text-slate-500">Order Reference</span>
                    <h3 className="font-display font-bold text-lg text-white">{order.reference}</h3>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-slate-500">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      order.status === "READY_FOR_PICKUP" 
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Product</span>
                    <p className="text-sm font-semibold text-white">{order.productTitle}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Amount Paid</span>
                    <p className="text-sm font-semibold text-brand-pink">
                      GH₵ {(order.price + order.deliveryFee).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Rider Assigned</span>
                    <p className="text-sm font-semibold text-white">{order.riderName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{order.riderPhone}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => !isSubmitting && setShowCheckoutModal(false)}
          />

          {/* Modal Container */}
          <div className="relative bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl z-10">
            {checkoutSuccess ? (
              <div className="py-8 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-3xl mb-4 animate-bounce">
                  ✓
                </div>
                <h3 className="font-display font-bold text-2xl text-white mb-2">Order Confirmed!</h3>
                <p className="text-slate-400 text-sm font-light">Redirecting to order list...</p>
              </div>
            ) : (
              <form onSubmit={handleCheckout} className="space-y-6">
                <div>
                  <h3 className="font-display font-bold text-2xl text-white">Complete Checkout</h3>
                  <p className="text-xs text-slate-400 mt-1">Specify payment method and destination contacts.</p>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Payment Option
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: "MOBILE_MONEY", name: "MoMo" },
                      { type: "CARD", name: "Card" },
                      { type: "CASH_ON_DELIVERY", name: "COD" },
                    ].map((opt) => (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => setPaymentMethod(opt.type as "CARD" | "MOBILE_MONEY" | "CASH_ON_DELIVERY")}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                          paymentMethod === opt.type
                            ? "bg-brand-pink/20 border-brand-pink text-white"
                            : "bg-slate-950 border-white/5 text-slate-400"
                        }`}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Mobile Wallet Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 054 123 4567"
                    className="w-full bg-slate-950 border border-white/5 focus:border-brand-pink/50 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                  />
                </div>

                <div className="pt-4 border-t border-white/5">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-gradient-to-r from-brand-purple to-brand-pink text-white font-semibold text-sm rounded-xl shadow-lg transition duration-200 flex justify-center items-center"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      `Pay GH₵ ${(cartTotal + 20.00).toFixed(2)}`
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setShowCheckoutModal(false)}
                    className="w-full mt-3 py-2.5 text-xs text-slate-400 hover:text-white font-medium transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
