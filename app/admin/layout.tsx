"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../lib/auth-context";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!role) {
      router.replace("/admin-login");
    } else if (role === "student") {
      router.replace("/dashboard");
    }
  }, [role, loading, router]);

  if (loading || !role || role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="animate-spin text-slate-400" size={28} />
      </div>
    );
  }

  return <>{children}</>;
}
