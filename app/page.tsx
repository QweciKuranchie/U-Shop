import React from "react";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950 text-white flex flex-col justify-between p-6 md:p-12 relative overflow-hidden">
      {/* Background Glow effects */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-pink-600/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center z-10 w-full max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <Image
            src="/logo.png"
            alt="U-Shop Logo"
            width={150}
            height={50}
            priority
            className="h-10 w-auto object-contain"
          />
        </div>
        <div>
          <span className="bg-white/10 hover:bg-white/15 backdrop-blur-md text-sm font-semibold px-4 py-2 rounded-full border border-white/10 transition duration-300 cursor-pointer">
            Coming Soon
          </span>
        </div>
      </header>

      {/* Hero Content */}
      <div className="my-auto py-12 flex flex-col items-center text-center z-10 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-pink-200 leading-tight">
          The Ultimate Campus <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">
            Marketplace
          </span>
        </h1>
        <p className="text-lg md:text-xl text-purple-200/80 max-w-2xl mb-10 leading-relaxed font-light">
          U-Shop bridges the gap between campus buyers, sellers, and delivery riders.
          Fast, reliable, and tailored specifically for your university experience.
        </p>

        {/* Portals Preview Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mt-4">
          {[
            { role: "Buyer", desc: "Browse products", color: "from-blue-500/20 to-indigo-500/20 border-blue-500/30" },
            { role: "Seller", desc: "Manage your store", color: "from-purple-500/20 to-pink-500/20 border-purple-500/30" },
            { role: "Admin", desc: "Oversee operations", color: "from-amber-500/20 to-red-500/20 border-amber-500/30" },
            { role: "Rider", desc: "Deliver orders", color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30" },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl border bg-gradient-to-b ${item.color} backdrop-blur-sm flex flex-col items-center justify-center transition duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-950/20`}
            >
              <h3 className="font-semibold text-lg text-white">{item.role}</h3>
              <p className="text-xs text-purple-300/70 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-6 border-t border-white/5 w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-purple-300/50 z-10">
        <p>© 2026 U-Shop. All rights reserved.</p>
        <p className="mt-2 md:mt-0">Built with Next.js 15 & Tailwind CSS</p>
      </footer>
    </main>
  );
}
