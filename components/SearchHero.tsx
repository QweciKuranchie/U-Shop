"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchHero() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-3 max-w-lg w-full">
      <div className="flex-1 relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder='Search "MacBook Pro", "AirPods"...'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-slate-900/60 border border-white/10 focus:border-brand-purple/40 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all backdrop-blur-md"
        />
      </div>
      <button
        type="submit"
        className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-brand-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-transform"
      >
        Search
      </button>
    </form>
  );
}
