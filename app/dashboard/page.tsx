"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase-client";
import { useAuth } from "../../lib/auth-context";
import BusDashboard from "../bus-dashboard";

const DEMO_STUDENT = {
  id: "demo-student",
  profile_id: null,
  full_name: "Vraj",
  email: "patelaaravt1311@gmail.com",
  student_id: "DEMO-001",
  phone_number: "",
  has_bus_service: true,
  assigned_route: "UNI1_TO_SCALER",
  bus_pass_status: "active",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEMO_PROFILE = {
  id: "demo-profile",
  full_name: "Vraj",
  email: "patelaaravt1311@gmail.com",
  student_id: "DEMO-001",
  role: "student" as const,
};

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      (async () => {
        const { data: student } = await supabase
          .from("students")
          .select("*")
          .eq("profile_id", user.id)
          .maybeSingle();
        setStudentData(student);
        setLoading(false);
      })();
    } else {
      setStudentData(DEMO_STUDENT);
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <p className="text-slate-400 text-sm">Loading your dashboard...</p>
      </div>
    );
  }

  const hostel = studentData?.assigned_route?.includes("UNI1") ? "Uni 1" : "Uni 2";

  return <BusDashboard hostel={hostel} studentData={studentData} profile={profile || DEMO_PROFILE} />;
}
