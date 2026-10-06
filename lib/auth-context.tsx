"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase-client";

type Role = "student" | "admin" | null;

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: Role;
  loading: boolean;
  profile: Profile | null;
  signOut: () => Promise<void>;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  student_id: string | null;
  role: Role;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  role: null,
  loading: true,
  profile: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        (async () => {
          try {
            const { data, error } = await supabase
              .from("profiles")
              .select("id, full_name, email, student_id, role")
              .eq("id", session.user.id)
              .maybeSingle();
            if (error) throw error;
            if (data) {
              setProfile(data as Profile);
              setRole(data.role as Role);
            }
          } catch {
            // Profile fetch failed — still allow page to render
          }
          setLoading(false);
        })();
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setSession(null);
      setUser(null);
      setProfile(null);
      setRole(null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        (async () => {
          try {
            const { data, error } = await supabase
              .from("profiles")
              .select("id, full_name, email, student_id, role")
              .eq("id", session.user.id)
              .maybeSingle();
            if (error) throw error;
            if (data) {
              setProfile(data as Profile);
              setRole(data.role as Role);
            }
          } catch {
            // Profile fetch failed — still allow page to render
          }
          setLoading(false);
        })();
      } else {
        setProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, role, loading, profile, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
