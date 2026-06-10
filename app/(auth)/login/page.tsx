import React from "react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
        <p className="text-slate-400 text-sm mb-6">Sign in to your U-Shop account</p>
        <div className="space-y-4">
          <button className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200">
            Sign In with Email
          </button>
        </div>
      </div>
    </div>
  );
}
