import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import Link from "next/link";
import Logo from "@/components/Logo";
import LogoutButton from "./logout-button";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  const user = session!.user;

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
            <Link
              href="/buyer/dashboard"
              className="text-slate-400 hover:text-white transition duration-250"
            >
              Browse Catalog
            </Link>
            <Link
              href="/buyer/dashboard"
              className="text-slate-400 hover:text-white transition duration-250"
            >
              My Orders
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <span className="text-xs bg-slate-900 px-3 py-1 rounded-full border border-brand-pink/30 text-brand-pink font-bold">
              🛍️ Verified Buyer
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-6 py-12 flex-grow w-full z-10 flex flex-col justify-center">
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-sm shadow-2xl space-y-8">
          <div>
            <h1 className="font-display font-black text-3xl text-white">
              Account Profile
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-light">
              Manage your credentials and view account status.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-550 uppercase block font-semibold tracking-wider">
                Full Name
              </span>
              <p className="text-sm font-semibold text-white">{user.name}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-550 uppercase block font-semibold tracking-wider">
                Role Privilege
              </span>
              <p className="text-sm font-semibold text-white capitalize">{user.role}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-550 uppercase block font-semibold tracking-wider">
                Registered Email
              </span>
              <p className="text-sm font-semibold text-white">{user.email}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-550 uppercase block font-semibold tracking-wider">
                Email Status
              </span>
              <p className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Verified
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link
              href="/buyer/dashboard"
              className="text-xs font-semibold text-slate-400 hover:text-white transition duration-200"
            >
              &larr; Back to Shopping
            </Link>

            <LogoutButton />
          </div>
        </div>
      </main>
    </div>
  );
}
