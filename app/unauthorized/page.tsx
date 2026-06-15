import Link from "next/link";
import Logo from "@/components/Logo";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans relative overflow-hidden items-center justify-center p-6">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-red/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-purple/10 blur-[130px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md shadow-2xl flex flex-col items-center text-center space-y-6 z-10">
        <Link href="/" className="mb-2">
          <Logo size="md" lightMode={false} />
        </Link>

        {/* Warning Icon */}
        <div className="w-20 h-20 rounded-full bg-brand-red/10 border border-brand-red/25 flex items-center justify-center text-brand-red text-4xl animate-pulse">
          🛡️
        </div>

        <div className="space-y-2">
          <h1 className="font-display font-black text-3xl tracking-tight text-white">
            Access Denied
          </h1>
          <p className="text-slate-400 text-sm font-light leading-relaxed">
            Your account does not have the permissions required to view this page. If you believe this is an error, please log in with a different account.
          </p>
        </div>

        <div className="w-full pt-4 border-t border-white/5 flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full py-3 bg-gradient-to-r from-brand-red to-brand-purple text-white font-semibold text-sm rounded-xl shadow-lg transition duration-200 text-center hover:opacity-90"
          >
            Sign In with Another Account
          </Link>
          
          <Link
            href="/"
            className="w-full py-2.5 bg-slate-950 border border-white/5 text-slate-400 hover:text-white font-medium text-sm rounded-xl text-center transition"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
