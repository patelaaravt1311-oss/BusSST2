import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase } from "../lib/supabase-client";
import { useAuth } from "../lib/auth-context";
import Link from "next/link";
import {
  Menu,
  Shield,
  House,
  Megaphone,
  ClipboardCheck,
  ScanFace,
  GraduationCap,
  Coins,
  Sparkles,
  Building2,
  BusFront,
  CalendarDays,
  CircleHelp,
  FileText,
  Bug,
  Gift,
  Moon,
  Bell,
  ArrowUpRight,
  TriangleAlert,
  ChevronDown,
  Lock,
} from "lucide-react";

const LiveMapTracker = dynamic(() => import("../components/live-map-tracker.jsx"), {
  ssr: false,
  loading: () => (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[14.5px] font-semibold text-slate-800">Live Map Tracker</h2>
        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          LIVE
        </span>
      </div>
      <div className="rounded-lg border border-slate-200 h-[320px] sm:h-[380px] flex items-center justify-center bg-slate-100 text-slate-400 text-[12px]">
        Loading map…
      </div>
    </div>
  ),
});

const NAV_ITEMS = [
  { label: "Home", icon: House },
  { label: "Announcements", icon: Megaphone },
  { label: "Attendance", icon: ClipboardCheck },
  { label: "Face Photos", icon: ScanFace },
  { label: "Results", icon: GraduationCap },
  { label: "Credits", icon: Coins },
  { label: "Immersion", icon: Sparkles },
  { label: "Hostel", icon: Building2 },
  { label: "Bus", icon: BusFront },
  { label: "Booking", icon: CalendarDays },
  { label: "Resolve", icon: CircleHelp },
  { label: "Policies", icon: FileText },
  { label: "Report Bug", icon: Bug },
];

const BUS_DATA = {
  "Uni 1": {
    outbound: "Scaler to Uni 1 (Hostel)",
    outboundTime: "10:30 AM",
    return: "Uni 1 (Hostel) to Scaler",
    returnTime: "11:00 AM",
    hostelLabel: "Uni 1",
    timetable: [
      {
        route: "Uni 1 to City Campus",
        timing: "am 09:00, am 10:00, pm 01:00, pm 03:00, pm 07:00, pm 09:00",
      },
      {
        route: "City Campus to Uni 1",
        timing: "am 09:00, am 10:00, pm 03:00, pm 05:00, pm 07:00, pm 09:00",
      },
    ],
  },
  "Uni 2": {
    outbound: "Scaler to Uni 2 (Hostel)",
    outboundTime: "10:45 AM",
    return: "Uni 2 (Hostel) to Scaler",
    returnTime: "11:15 AM",
    hostelLabel: "Uni 2",
    timetable: [
      {
        route: "Uni 2 to City Campus",
        timing: "am 09:00, am 10:00, pm 01:00, pm 03:00, pm 07:00, pm 09:00",
      },
      {
        route: "City Campus to Uni 2",
        timing: "am 09:00, am 10:00, pm 03:00, pm 05:00, pm 07:00, pm 09:00",
      },
    ],
  },
};

function Sidebar({ collapsed, setCollapsed }) {
  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 bg-white border-r border-slate-200 h-screen sticky top-0 transition-all duration-200 ${
        collapsed ? "w-[60px]" : "w-[168px]"
      }`}
    >
      <div className="flex items-center gap-2 px-3 h-[46px] border-b border-slate-100">
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label="Toggle sidebar"
          className="text-slate-500 hover:text-slate-700 shrink-0"
        >
          <Menu size={16} />
        </button>
        {!collapsed && (
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
              <Shield size={12} className="text-white" fill="currentColor" />
            </div>
            <span className="text-[13px] font-bold text-slate-900 truncate">
              SST Bus
            </span>
          </div>
        )}
      </div>
      {!collapsed && (
        <div className="px-3 pt-2.5 pb-1">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
            Student
          </span>
        </div>
      )}

      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-2 pt-2 pb-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.label === "Bus";
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[12.5px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                isActive
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={15}
                className={isActive ? "text-blue-600" : "text-slate-400"}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function TopHeader({ profile }) {
  const { signOut } = useAuth();
  return (
    <header className="h-[46px] bg-white border-b border-slate-200 flex items-center justify-end gap-2 px-4 sticky top-0 z-10">
      <button className="hidden sm:flex items-center gap-1 rounded-full pl-2.5 pr-3 py-[5px] bg-amber-50 border border-amber-200 text-amber-700 text-[11.5px] font-medium hover:bg-amber-100 transition-colors">
        <Gift size={13} />
        Refer &amp; Earn
      </button>
      <button className="hidden sm:flex items-center gap-1 rounded-full pl-2.5 pr-3 py-[5px] bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11.5px] font-medium hover:bg-emerald-100 transition-colors">
        <Sparkles size={13} />
        Your Wrapped
      </button>
      <Link
        href="/admin-login"
        className="hidden sm:flex items-center gap-1 rounded-full pl-2.5 pr-3 py-[5px] bg-slate-50 border border-slate-200 text-slate-500 text-[11.5px] font-medium hover:bg-slate-100 transition-colors"
        title="Admin access"
      >
        <Lock size={13} />
        Admin
      </Link>
      <button
        aria-label="Toggle dark mode"
        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <Moon size={16} />
      </button>
      <button
        aria-label="Notifications"
        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <Bell size={16} />
      </button>
      <div
        className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[12px] font-semibold"
        aria-label="User avatar"
      >
        {profile?.full_name?.charAt(0)?.toUpperCase() || "S"}
      </div>
      <button
        onClick={signOut}
        className="text-[11.5px] text-slate-500 hover:text-red-600 px-2 transition-colors"
      >
        Sign Out
      </button>
    </header>
  );
}

function HostelSelector({ hostel, setHostel }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg pl-3 pr-2.5 py-1.5 text-[12.5px] font-medium text-slate-700 hover:border-slate-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {hostel} Student
        <ChevronDown size={14} className="text-slate-400" />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 w-full min-w-[140px] bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden"
        >
          {Object.keys(BUS_DATA).map((h) => (
            <li key={h}>
              <button
                role="option"
                aria-selected={hostel === h}
                onClick={() => {
                  setHostel(h);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-[12.5px] hover:bg-slate-50 ${
                  hostel === h
                    ? "text-blue-600 font-medium bg-blue-50/60"
                    : "text-slate-600"
                }`}
              >
                {h} Student
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NextBusCard({ nextBus, loading }) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-[14.5px] font-semibold text-slate-800">Next Bus</h2>
          <ArrowUpRight size={16} className="text-slate-400" />
        </div>
        <p className="text-[12px] text-slate-400">Loading...</p>
      </div>
    );
  }
  if (!nextBus) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-[14.5px] font-semibold text-slate-800">Next Bus</h2>
          <ArrowUpRight size={16} className="text-slate-400" />
        </div>
        <p className="text-[12px] text-slate-400">No upcoming buses scheduled.</p>
      </div>
    );
  }
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-[14.5px] font-semibold text-slate-800">Next Bus</h2>
        <ArrowUpRight size={16} className="text-slate-400" />
      </div>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[12px] text-slate-500 leading-snug">
            {nextBus.routes?.route_name || "—"}
          </span>
          <span className="text-[14px] font-semibold text-slate-800 whitespace-nowrap">
            {nextBus.departure_time}
          </span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <span className="text-[12px] text-slate-500 leading-snug">
            Estimated Arrival
          </span>
          <span className="text-[14px] font-semibold text-slate-800 whitespace-nowrap">
            {nextBus.arrival_time}
          </span>
        </div>
      </div>
    </div>
  );
}

function NotificationsCard({ notifications }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5">
      <h2 className="text-[14.5px] font-semibold text-slate-800 mb-2.5">
        Notifications
      </h2>
      {notifications.length === 0 ? (
        <p className="text-[12px] text-slate-400">No notifications.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className="flex gap-2 bg-red-50 border border-red-100 rounded-lg p-2.5">
              <TriangleAlert size={15} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11.5px] leading-snug text-red-700">
                  <span className="font-medium">{n.title}:</span> {n.message}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DigitalBusPass({ studentData, busPass, profile }) {
  const hasBusService = studentData?.has_bus_service ?? false;
  const passActive = hasBusService && busPass?.status === "active";
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-[14.5px] font-semibold text-slate-800">
          Digital Bus Pass
        </h2>
        <span className={`flex items-center gap-1 text-[11.5px] font-medium ${passActive ? "text-emerald-600" : "text-slate-400"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${passActive ? "bg-emerald-500" : "bg-slate-300"}`} />
          {passActive ? "Activated" : "Inactive"}
        </span>
      </div>
      {hasBusService ? (
        <div className="rounded-lg bg-[#f5eee3] p-3 flex gap-3">
          <div className="w-14 h-14 rounded-md bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-[9px] text-slate-500">
            Photo
          </div>
          <div className="text-[11.5px] leading-relaxed">
            <div>
              <span className="text-slate-500">Name: </span>
              <span className="text-slate-800 font-medium">{profile?.full_name || studentData?.full_name || "—"}</span>
            </div>
            <div>
              <span className="text-slate-500">Roll Number: </span>
              <span className="text-slate-800 font-medium">{studentData?.student_id || "—"}</span>
            </div>
            <div>
              <span className="text-slate-500">Route: </span>
              <span className="text-slate-800 font-medium">{studentData?.assigned_route || "—"}</span>
            </div>
            <div>
              <span className="text-slate-500">Pass Status: </span>
              <span className="text-slate-800 font-medium">{busPass?.status || "inactive"}</span>
            </div>
            <div>
              <span className="text-slate-500">Valid: </span>
              <span className="text-slate-800 font-medium">
                {busPass?.valid_from ? `${busPass.valid_from} - ${busPass.valid_until || ""}` : "Not set"}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
          <p className="text-[11.5px] text-slate-500 leading-snug">
            You have not opted for the bus service. Contact the admin office to activate your bus pass.
          </p>
        </div>
      )}
    </div>
  );
}

function ReportIssueDialog({ open, onClose }) {
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-issue-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-sm p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="report-issue-title" className="text-[15px] font-semibold text-slate-800 mb-3">
          Report an Issue
        </h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="issue-type" className="block text-[11.5px] text-slate-500 mb-1">
              Issue type
            </label>
            <select
              id="issue-type"
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full text-[12.5px] border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <option value="">Select an issue type</option>
              <option value="delay">Bus delay</option>
              <option value="route">Wrong route</option>
              <option value="pass">Bus pass issue</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="issue-desc" className="block text-[11.5px] text-slate-500 mb-1">
              Description
            </label>
            <textarea
              id="issue-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full text-[12.5px] border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              placeholder="Describe the issue..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="text-[12.5px] px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="text-[12.5px] px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

function TimetableRoutes({ hostel, setDialogOpen, timetableRows, loading }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[14.5px] font-semibold text-slate-800">
          Timetable &amp; Routes
        </h2>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600 border border-slate-200 rounded-md px-2.5 py-1.5 hover:bg-slate-50 transition-colors"
        >
          <TriangleAlert size={13} />
          Report Issue
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        <select className="text-[12px] border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
          <option>Route: Select...</option>
          {timetableRows.map((t, i) => (
            <option key={i}>{t.route}</option>
          ))}
        </select>
        <select className="text-[12px] border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
          <option>Filter All</option>
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between px-1 py-1.5 text-[11.5px] font-medium text-slate-500 border-b border-slate-100">
          <span>Route</span>
          <span>Timing</span>
        </div>
        {loading ? (
          <p className="text-[12px] text-slate-400 py-3">Loading timetable...</p>
        ) : timetableRows.length === 0 ? (
          <p className="text-[12px] text-slate-400 py-3">No timetables found.</p>
        ) : (
          timetableRows.map((row, i) => (
            <div
              key={i}
              className={`flex items-center justify-between gap-4 px-1 py-2.5 text-[12px] ${
                i !== timetableRows.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <span className="text-slate-700 font-medium whitespace-nowrap">
                {row.route}
              </span>
              <span className="text-slate-500 text-right">{row.timing}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function BusDashboard({ hostel: initialHostel, studentData, profile }) {
  const [hostel, setHostel] = useState(initialHostel || "Uni 1");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [timetable, setTimetable] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [busPass, setBusPass] = useState(null);
  const [nextBus, setNextBus] = useState(null);
  const [dbLoading, setDbLoading] = useState(true);

  // Fetch dynamic data from database
  useEffect(() => {
    if (!studentData) {
      setDbLoading(false);
      return;
    }
    (async () => {
      // Fetch timetables for the student's route
      const routeCodes = hostel === "Uni 1"
        ? ["UNI1_TO_SCALER", "SCALER_TO_UNI1"]
        : ["UNI2_TO_SCALER", "SCALER_TO_UNI2"];
      const { data: routes } = await supabase
        .from("routes")
        .select("id, route_code, route_name")
        .in("route_code", routeCodes);
      const routeIds = (routes || []).map((r) => r.id);
      const { data: timetableData } = await supabase
        .from("timetables")
        .select("*, routes(route_code, route_name)")
        .in("route_id", routeIds)
        .eq("is_active", true)
        .order("departure_time", { ascending: true });
      setTimetable(timetableData || []);

      // Fetch notifications
      const { data: notifData } = await supabase
        .from("notifications")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);
      setNotifications(notifData || []);

      // Fetch bus pass
      const { data: passData } = await supabase
        .from("bus_passes")
        .select("*")
        .eq("student_id", studentData.id)
        .maybeSingle();
      setBusPass(passData);

      // Compute next bus from timetable
      if (timetableData && timetableData.length > 0) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const upcoming = timetableData.find((t) => {
          const [h, m] = t.departure_time.split(":").map(Number);
          return h * 60 + m >= currentMinutes;
        });
        setNextBus(upcoming || timetableData[0]);
      }

      setDbLoading(false);
    })();
  }, [hostel, studentData]);

  // Realtime subscription for notifications and timetables
  useEffect(() => {
    const notifChannel = supabase
      .channel("notifications-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        supabase
          .from("notifications")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(5)
          .then(({ data }) => data && setNotifications(data));
      })
      .subscribe();

    const timetableChannel = supabase
      .channel("timetable-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "timetables" }, () => {
        const routeCodes = hostel === "Uni 1"
          ? ["UNI1_TO_SCALER", "SCALER_TO_UNI1"]
          : ["UNI2_TO_SCALER", "SCALER_TO_UNI2"];
        supabase
          .from("routes")
          .select("id, route_code, route_name")
          .in("route_code", routeCodes)
          .then(({ data: routes }) => {
            const routeIds = (routes || []).map((r) => r.id);
            supabase
              .from("timetables")
              .select("*, routes(route_code, route_name)")
              .in("route_id", routeIds)
              .eq("is_active", true)
              .order("departure_time", { ascending: true })
              .then(({ data }) => data && setTimetable(data));
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(timetableChannel);
    };
  }, [hostel]);

  // Build dynamic timetable rows
  const timetableRows = timetable.map((t) => ({
    route: t.routes?.route_name || "—",
    timing: `${t.departure_time} - ${t.arrival_time}`,
  }));

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-slate-800">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="flex-1 min-w-0">
        <TopHeader profile={profile} />
        <main className="px-5 py-4 max-w-[1200px] mx-auto">
          <h1 className="text-[19px] font-bold text-slate-900 mb-3">
            Bus Dashboard
          </h1>

          <HostelSelector hostel={hostel} setHostel={setHostel} />

          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
            <LiveMapTracker hostel={hostel} />
            <div className="flex flex-col gap-4">
              <NextBusCard nextBus={nextBus} loading={dbLoading} />
              <NotificationsCard notifications={notifications} />
              <DigitalBusPass studentData={studentData} busPass={busPass} profile={profile} />
            </div>
          </div>

          <div className="mt-4">
            <TimetableRoutes hostel={hostel} setDialogOpen={setReportOpen} timetableRows={timetableRows} loading={dbLoading} />
          </div>
        </main>
      </div>

      <ReportIssueDialog open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
