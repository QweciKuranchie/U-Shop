"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/login");
          },
        },
      });
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="px-4 py-2 bg-brand-red/10 border border-brand-red/30 text-brand-red hover:bg-brand-red hover:text-white text-xs font-semibold rounded-xl transition duration-200"
    >
      {isLoggingOut ? "Signing out..." : "Sign Out"}
    </button>
  );
}
