import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 md:p-12 relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-purple/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-pink/15 blur-[130px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-brand-red/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center z-10 w-full max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-pink flex items-center justify-center font-display font-black text-xl shadow-lg shadow-brand-purple/30">
            U
          </div>
          <span className="font-display font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
            U-<span className="text-brand-pink">Shop</span>
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-md text-sm font-semibold transition duration-300 transform hover:scale-[1.02] shadow-lg"
          >
            Sign In
          </Link>
          <Link
            href="/login?tab=register"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white text-sm font-semibold hover:opacity-90 transition duration-300 transform hover:scale-[1.02] shadow-lg shadow-brand-purple/20"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="my-auto py-16 flex flex-col items-center text-center z-10 max-w-4xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-brand-purple/10 border border-brand-purple/30 text-brand-pink text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-sm animate-pulse">
          <span>🚀 Smart Campus Marketplace</span>
        </div>

        <h1 className="font-display text-5xl md:text-8xl font-black tracking-tight mb-6 leading-[1.05] text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-300">
          The Ultimate Campus <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple via-brand-pink to-[#ff3b8b]">
            Marketplace
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed font-light">
          U-Shop bridges the gap between campus buyers, sellers, and delivery riders.
          Fast transactions, reliable deliveries, and tailored specifically for your university.
        </p>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl mt-4">
          {[
            {
              role: "Buyer Portal",
              desc: "Browse products, order items, and get fast delivery.",
              link: "/buyer/dashboard",
              color: "hover:border-blue-500/40 hover:shadow-blue-500/5",
              glow: "group-hover:bg-blue-500/10",
              btnColor: "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white"
            },
            {
              role: "Seller Hub",
              desc: "Create store, post listings, and track your campus earnings.",
              link: "/seller/dashboard",
              color: "hover:border-brand-purple/40 hover:shadow-brand-purple/5",
              glow: "group-hover:bg-brand-purple/10",
              btnColor: "bg-brand-purple/10 text-brand-pink group-hover:bg-brand-purple group-hover:text-white"
            },
            {
              role: "Rider Panel",
              desc: "Earn money delivering packages across campus zones.",
              link: "/rider",
              color: "hover:border-emerald-500/40 hover:shadow-emerald-500/5",
              glow: "group-hover:bg-emerald-500/10",
              btnColor: "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white"
            },
            {
              role: "Admin Control",
              desc: "Verify KYC, manage riders, and monitor commissions.",
              link: "/admin/dashboard",
              color: "hover:border-brand-red/40 hover:shadow-brand-red/5",
              glow: "group-hover:bg-brand-red/10",
              btnColor: "bg-brand-red/10 text-brand-red group-hover:bg-brand-red group-hover:text-white"
            }
          ].map((item, idx) => (
            <Link
              key={idx}
              href={item.link}
              className={`group relative p-8 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md flex flex-col justify-between items-start text-left transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl ${item.color}`}
            >
              <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100 blur-xl ${item.glow}`} />
              <div className="relative z-10 w-full">
                <h3 className="font-display font-extrabold text-xl text-white mb-2 group-hover:text-brand-pink transition-colors duration-200">
                  {item.role}
                </h3>
                <p className="text-sm text-slate-400 font-light leading-relaxed mb-6">
                  {item.desc}
                </p>
              </div>
              <div className={`relative z-10 w-full py-2.5 rounded-xl text-center text-xs font-semibold transition-all duration-300 ${item.btnColor}`}>
                Enter Portal &rarr;
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto pt-8 border-t border-white/5 w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 z-10">
        <div className="flex items-center space-x-2">
          <span>© 2026 U-Shop Inc. All rights reserved.</span>
        </div>
        <div className="flex space-x-6 mt-4 md:mt-0 font-medium">
          <a href="#" className="hover:text-brand-pink transition duration-200">Terms</a>
          <a href="#" className="hover:text-brand-pink transition duration-200">Privacy</a>
          <a href="#" className="hover:text-brand-pink transition duration-200">Help Center</a>
        </div>
      </footer>
    </main>
  );
}
