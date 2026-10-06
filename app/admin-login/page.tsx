"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase-client";
import { useAuth } from "../../lib/auth-context";

export default function AdminLoginPage() {
  const router = useRouter();
  const { role, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && role === "admin") {
      router.replace("/admin");
    }
  }, [role, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;

      // Fetch profile to check role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!profile || profile.role !== "admin") {
        await supabase.auth.signOut();
        throw new Error("This account does not have admin access.");
      }

      router.replace("/admin");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="animate-spin text-slate-400" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <Shield size={18} className="text-white" fill="currentColor" />
          </div>
          <span className="text-[18px] font-bold text-slate-900">SST Admin</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h1 className="text-[16px] font-semibold text-slate-800 mb-4">
            Admin Sign In
          </h1>

          {error && (
            <div className="flex items-start gap-2 mb-3 p-2.5 rounded-lg bg-red-50 border border-red-100">
              <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11.5px] text-slate-500 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-[13px] border border-slate-200 rounded-md px-3 py-2 text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-[11.5px] text-slate-500 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-[13px] border border-slate-200 rounded-md px-3 py-2 text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                placeholder="Min 6 characters"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full text-[13px] font-medium py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Sign In
            </button>
          </form>
        </div>

        <p className="text-[10.5px] text-slate-400 text-center mt-3">
          Admin access only. Students use the main dashboard.
        </p>
      </div>
    </div>
  );
}
