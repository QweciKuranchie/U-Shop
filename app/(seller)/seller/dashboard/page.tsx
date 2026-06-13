"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface ListingItem {
  id: string;
  title: string;
  category: string;
  condition: string;
  vendorPrice: number;
  listingPrice: number;
  status: "ACTIVE" | "SOLD" | "PAUSED";
  image: string;
}

const INITIAL_LISTINGS: ListingItem[] = [
  {
    id: "lst-1",
    title: "MacBook Air M1 (2020)",
    category: "LAPTOPS",
    condition: "LIKE_NEW",
    vendorPrice: 8000.0,
    listingPrice: 8400.0,
    status: "ACTIVE",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "lst-2",
    title: "Logitech MX Master 3S Mouse",
    category: "ACCESSORIES",
    condition: "LIKE_NEW",
    vendorPrice: 850.0,
    listingPrice: 892.5,
    status: "ACTIVE",
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "lst-3",
    title: "Dell 27-inch 4K Monitor",
    category: "COMPONENTS",
    condition: "GOOD",
    vendorPrice: 3200.0,
    listingPrice: 3360.0,
    status: "SOLD",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=150&q=80",
  }
];

export default function SellerDashboard() {
  const [listings, setListings] = useState<ListingItem[]>(INITIAL_LISTINGS);
  const [activeSubTab, setActiveSubTab] = useState<"listings" | "store" | "add-product">("listings");
  
  // Store customization state
  const [storeName, setStoreName] = useState("Dorm Deals GH");
  const [storeHandle, setStoreHandle] = useState("dormdeals");
  const [bio, setBio] = useState("Providing the best gadget deals directly to dorm rooms in Legon Main campus. Fast delivery, trusted quality.");
  const [whatsapp, setWhatsapp] = useState("+233 24 999 8888");
  const [showStoreSaved, setShowStoreSaved] = useState(false);

  // New product form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("PHONES");
  const [newCondition, setNewCondition] = useState("GOOD");
  const [newVendorPrice, setNewVendorPrice] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Auto-calculated Listing Price (with 5% markup)
  const computedListingPrice = newVendorPrice
    ? parseFloat(newVendorPrice) * 1.05
    : 0.0;

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    setShowStoreSaved(true);
    setTimeout(() => setShowStoreSaved(false), 2000);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newVendorPrice) return;
    setIsAdding(true);

    setTimeout(() => {
      const vPrice = parseFloat(newVendorPrice);
      const newListing: ListingItem = {
        id: `lst-${Date.now()}`,
        title: newTitle,
        category: newCategory,
        condition: newCondition,
        vendorPrice: vPrice,
        listingPrice: vPrice * 1.05,
        status: "ACTIVE",
        image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=150&q=80", // default smart watch placeholder
      };

      setListings([newListing, ...listings]);
      setIsAdding(false);
      
      // Reset form
      setNewTitle("");
      setNewDesc("");
      setNewVendorPrice("");
      
      // Switch back to listings view
      setActiveSubTab("listings");
    }, 1000);
  };

  // Metrics
  const activeCount = listings.filter((l) => l.status === "ACTIVE").length;
  const soldCount = listings.filter((l) => l.status === "SOLD").length;
  const totalRevenue = listings
    .filter((l) => l.status === "SOLD")
    .reduce((sum, l) => sum + l.vendorPrice, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-purple/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-pink/10 blur-[130px] pointer-events-none" />

      {/* Nav */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-pink flex items-center justify-center font-display font-black text-lg shadow-lg shadow-brand-purple/20">
              U
            </div>
            <span className="font-display font-black text-xl tracking-tight">
              U-<span className="text-brand-pink">Shop</span>
            </span>
          </Link>

          <nav className="flex space-x-6 text-sm font-medium">
            <button
              onClick={() => setActiveSubTab("listings")}
              className={`pb-1 border-b-2 transition-all ${
                activeSubTab === "listings" ? "border-brand-pink text-white" : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              My Listings
            </button>
            <button
              onClick={() => setActiveSubTab("store")}
              className={`pb-1 border-b-2 transition-all ${
                activeSubTab === "store" ? "border-brand-pink text-white" : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Store Profile
            </button>
            <button
              onClick={() => setActiveSubTab("add-product")}
              className={`pb-1 border-b-2 transition-all ${
                activeSubTab === "add-product" ? "border-brand-pink text-white" : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Add Product
            </button>
          </nav>

          <div className="flex items-center space-x-4">
            <span className="text-xs bg-slate-900 px-3 py-1 rounded-full border border-white/5 text-slate-400">
              Seller Portal
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-grow w-full z-10">
        
        {/* KPI Panel */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: "My Vendor Revenue", value: `GH₵ ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: "border-brand-purple/20" },
            { label: "Active Shop Listings", value: activeCount, color: "border-brand-pink/20" },
            { label: "Total Sold Items", value: soldCount, color: "border-white/5" },
          ].map((kpi, idx) => (
            <div
              key={idx}
              className={`bg-slate-900/40 border ${kpi.color} rounded-2xl p-6 backdrop-blur-sm shadow-xl`}
            >
              <span className="text-[10px] text-slate-500 uppercase block tracking-wider font-semibold mb-2">
                {kpi.label}
              </span>
              <p className="font-display font-black text-3xl text-white">
                {kpi.value}
              </p>
            </div>
          ))}
        </section>

        {activeSubTab === "listings" && (
          <section className="bg-slate-900/30 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display font-bold text-2xl">Manage Catalog</h2>
              <button
                onClick={() => setActiveSubTab("add-product")}
                className="bg-brand-purple/15 text-brand-pink hover:bg-brand-purple hover:text-white px-4 py-2 rounded-xl text-xs font-semibold border border-brand-purple/30 transition-all duration-200"
              >
                + Add New Listing
              </button>
            </div>

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
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {listings.map((item) => (
                    <tr key={item.id} className="group hover:bg-white/[0.01]">
                      <td className="py-4 flex items-center space-x-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-950 border border-white/10 flex-shrink-0">
                          <Image src={item.image} alt={item.title} fill className="object-cover" sizes="40px" unoptimized />
                        </div>
                        <span className="font-semibold text-white group-hover:text-brand-pink transition-colors">
                          {item.title}
                        </span>
                      </td>
                      <td className="py-4 text-slate-400 font-light">{item.category}</td>
                      <td className="py-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border border-white/10 text-slate-300">
                          {item.condition}
                        </span>
                      </td>
                      <td className="py-4 font-semibold text-slate-300">GH₵ {item.vendorPrice.toFixed(2)}</td>
                      <td className="py-4 font-semibold text-brand-pink">GH₵ {item.listingPrice.toFixed(2)}</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : item.status === "SOLD"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-slate-800 text-slate-400"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeSubTab === "store" && (
          <section className="max-w-2xl mx-auto bg-slate-900/40 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
            <div className="mb-6">
              <h2 className="font-display font-bold text-2xl">Store Customization</h2>
              <p className="text-xs text-slate-400 mt-1">Update your storefront identity which is displayed to student buyers.</p>
            </div>

            {showStoreSaved && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 mb-6 flex items-center">
                ✓ Store settings saved successfully!
              </div>
            )}

            <form onSubmit={handleSaveStore} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Store Name</label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 focus:border-brand-pink/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Store Handle</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs text-slate-500">@</span>
                    <input
                      type="text"
                      required
                      value={storeHandle}
                      onChange={(e) => setStoreHandle(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 focus:border-brand-pink/50 rounded-xl pl-7 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">WhatsApp Contact (Admin Use Only)</label>
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 focus:border-brand-pink/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Store Bio / Tagline</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 focus:border-brand-pink/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-brand-purple to-brand-pink text-white font-semibold text-xs rounded-xl shadow-lg transition duration-200 transform hover:scale-[1.01]"
              >
                Save Profile Configuration
              </button>
            </form>
          </section>
        )}

        {activeSubTab === "add-product" && (
          <section className="max-w-2xl mx-auto bg-slate-900/40 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
            <div className="mb-6">
              <h2 className="font-display font-bold text-2xl">Add New Product</h2>
              <p className="text-xs text-slate-400 mt-1">List a product in the U-Shop catalog. Pricing includes a mandatory 5% fee markup.</p>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Product Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Beats Studio Buds"
                  className="w-full bg-slate-950 border border-white/5 focus:border-brand-pink/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 focus:border-brand-pink/50 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none cursor-pointer"
                  >
                    <option value="PHONES">Phones</option>
                    <option value="LAPTOPS">Laptops</option>
                    <option value="AUDIO">Audio</option>
                    <option value="ACCESSORIES">Accessories</option>
                    <option value="GAMING">Gaming</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Condition</label>
                  <select
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 focus:border-brand-pink/50 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none cursor-pointer"
                  >
                    <option value="LIKE_NEW">Like New</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Your Payout Price (Vendor Price)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs text-slate-500">GH₵</span>
                    <input
                      type="number"
                      required
                      value={newVendorPrice}
                      onChange={(e) => setNewVendorPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-950 border border-white/5 focus:border-brand-pink/50 rounded-xl pl-12 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="bg-slate-950 border border-dashed border-white/10 rounded-xl p-3 h-[42px] flex justify-between items-center text-xs">
                  <span className="text-slate-500">Listing Price (5% markup):</span>
                  <span className="font-bold text-brand-pink">
                    GH₵ {computedListingPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Product Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detail condition flaws, contents, custom attributes..."
                  className="w-full bg-slate-950 border border-white/5 focus:border-brand-pink/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isAdding}
                className="w-full py-3.5 bg-gradient-to-r from-brand-purple to-brand-pink text-white font-semibold text-xs rounded-xl shadow-lg transition duration-200 transform hover:scale-[1.01] flex justify-center items-center"
              >
                {isAdding ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Create Listing"
                )}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
