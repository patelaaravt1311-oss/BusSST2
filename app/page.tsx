"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "../lib/auth-context";

export default function Home() {
  const router = useRouter();
  const { role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (role === "admin") {
      router.replace("/admin");
    } else {
      router.replace("/dashboard");
    }
  }, [role, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <Loader2 className="animate-spin text-slate-400" size={28} />
    </div>
  );
}
