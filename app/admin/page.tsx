"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  Route,
  Clock,
  Bell,
  BusFront,
  Settings,
  Menu,
  Shield,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  Activity,
} from "lucide-react";
import { supabase } from "../../lib/supabase-client";
import { useAuth } from "../../lib/auth-context";

const NAV = [
  { label: "Overview", icon: LayoutDashboard, key: "overview" },
  { label: "Students", icon: Users, key: "students" },
  { label: "Routes", icon: Route, key: "routes" },
  { label: "Timetable", icon: Clock, key: "timetable" },
  { label: "Notifications", icon: Bell, key: "notifications" },
  { label: "Bus Management", icon: BusFront, key: "buses" },
  { label: "Settings", icon: Settings, key: "settings" },
];

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [active, setActive] = useState("overview");
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-slate-800">
      <aside
        className={`hidden md:flex flex-col shrink-0 bg-white border-r border-slate-200 h-screen sticky top-0 transition-all duration-200 ${
          collapsed ? "w-[60px]" : "w-[180px]"
        }`}
      >
        <div className="flex items-center gap-2 px-3 h-[46px] border-b border-slate-100">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-slate-500 hover:text-slate-700 shrink-0"
          >
            <Menu size={16} />
          </button>
          {!collapsed && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center">
                <Shield size={12} className="text-white" fill="currentColor" />
              </div>
              <span className="text-[13px] font-bold text-slate-900">SST Admin</span>
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto px-2 pt-2 pb-3 space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[12.5px] transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <Icon size={15} className={isActive ? "text-blue-600" : "text-slate-400"} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
        {!collapsed && (
          <div className="px-3 pb-3">
            <button
              onClick={signOut}
              className="text-[11.5px] text-slate-500 hover:text-red-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </aside>

      <div className="flex-1 min-w-0">
        <header className="h-[46px] bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-10">
          <span className="text-[13px] font-medium text-slate-700">
            {NAV.find((n) => n.key === active)?.label}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] text-slate-500">{profile?.email}</span>
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[12px] font-semibold">
              {profile?.full_name?.charAt(0)?.toUpperCase() || "A"}
            </div>
          </div>
        </header>

        <main className="px-5 py-4 max-w-[1200px] mx-auto">
          {active === "overview" && <OverviewSection />}
          {active === "students" && <StudentsSection />}
          {active === "routes" && <RoutesSection />}
          {active === "timetable" && <TimetableSection />}
          {active === "notifications" && <NotificationsSection />}
          {active === "buses" && <BusesSection />}
          {active === "settings" && <SettingsSection />}
        </main>
      </div>
    </div>
  );
}

// --- Overview ---
function OverviewSection() {
  const [stats, setStats] = useState({
    total: 0,
    busUsers: 0,
    nonBusUsers: 0,
    uni1: 0,
    uni2: 0,
    activeRoutes: 0,
    activeNotifications: 0,
    activePasses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { count: total } = await supabase.from("students").select("*", { count: "exact", head: true });
      const { count: busUsers } = await supabase.from("students").select("*", { count: "exact", head: true }).eq("has_bus_service", true);
      const { count: nonBusUsers } = await supabase.from("students").select("*", { count: "exact", head: true }).eq("has_bus_service", false);
      const { count: uni1 } = await supabase.from("students").select("*", { count: "exact", head: true }).eq("assigned_route", "UNI1_TO_SCALER");
      const { count: uni2 } = await supabase.from("students").select("*", { count: "exact", head: true }).eq("assigned_route", "UNI2_TO_SCALER");
      const { count: activeRoutes } = await supabase.from("routes").select("*", { count: "exact", head: true }).eq("is_active", true);
      const { count: activeNotifications } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("is_active", true);
      const { count: activePasses } = await supabase.from("bus_passes").select("*", { count: "exact", head: true }).eq("status", "active");

      setStats({
        total: total || 0,
        busUsers: busUsers || 0,
        nonBusUsers: nonBusUsers || 0,
        uni1: uni1 || 0,
        uni2: uni2 || 0,
        activeRoutes: activeRoutes || 0,
        activeNotifications: activeNotifications || 0,
        activePasses: activePasses || 0,
      });
      setLoading(false);
    })();
  }, []);

  const cards = [
    { label: "Total Students", value: stats.total, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "Using Bus", value: stats.busUsers, icon: BusFront, color: "text-emerald-600 bg-emerald-50" },
    { label: "Not Using Bus", value: stats.nonBusUsers, icon: Users, color: "text-slate-500 bg-slate-100" },
    { label: "Uni 1 Students", value: stats.uni1, icon: Route, color: "text-indigo-600 bg-indigo-50" },
    { label: "Uni 2 Students", value: stats.uni2, icon: Route, color: "text-purple-600 bg-purple-50" },
    { label: "Active Routes", value: stats.activeRoutes, icon: Route, color: "text-blue-600 bg-blue-50" },
    { label: "Active Notifications", value: stats.activeNotifications, icon: Bell, color: "text-amber-600 bg-amber-50" },
    { label: "Active Bus Passes", value: stats.activePasses, icon: Check, color: "text-emerald-600 bg-emerald-50" },
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-slate-400" size={24} /></div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-3.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${c.color}`}>
              <Icon size={16} />
            </div>
            <p className="text-[22px] font-bold text-slate-800">{c.value}</p>
            <p className="text-[11px] text-slate-500">{c.label}</p>
          </div>
        );
      })}
    </div>
  );
}

// --- Students ---
function StudentsSection() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<any | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const fetchStudents = useCallback(async () => {
    let query = supabase.from("students").select("*");
    if (filter === "bus_users") query = query.eq("has_bus_service", true);
    else if (filter === "non_bus_users") query = query.eq("has_bus_service", false);
    else if (filter === "uni1") query = query.eq("assigned_route", "UNI1_TO_SCALER");
    else if (filter === "uni2") query = query.eq("assigned_route", "UNI2_TO_SCALER");
    else if (filter === "active_pass") query = query.eq("bus_pass_status", "active");
    else if (filter === "inactive_pass") query = query.eq("bus_pass_status", "inactive");

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,student_id.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data } = await query.order("created_at", { ascending: false });
    setStudents(data || []);
    setLoading(false);
  }, [filter, search]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const updateStudent = async (id: string, updates: Record<string, unknown>) => {
    await supabase.from("students").update(updates).eq("id", id);
    fetchStudents();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-[12.5px] border border-slate-200 rounded-md pl-8 pr-3 py-2 text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-[12px] border border-slate-200 rounded-md px-2.5 py-2 text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <option value="all">All Students</option>
          <option value="bus_users">Bus Users</option>
          <option value="non_bus_users">Non-Bus Users</option>
          <option value="uni1">Uni 1</option>
          <option value="uni2">Uni 2</option>
          <option value="active_pass">Active Pass</option>
          <option value="inactive_pass">Inactive Pass</option>
        </select>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-[12px] font-medium text-white bg-blue-600 rounded-md px-3 py-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={14} /> Add Student
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-slate-400" size={24} /></div>
      ) : students.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <Users size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-[13px] text-slate-400">No students found.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-3 py-2.5 font-medium text-slate-500">Name</th>
                  <th className="text-left px-3 py-2.5 font-medium text-slate-500">Student ID</th>
                  <th className="text-left px-3 py-2.5 font-medium text-slate-500">Email</th>
                  <th className="text-left px-3 py-2.5 font-medium text-slate-500">Bus Service</th>
                  <th className="text-left px-3 py-2.5 font-medium text-slate-500">Route</th>
                  <th className="text-left px-3 py-2.5 font-medium text-slate-500">Pass</th>
                  <th className="text-left px-3 py-2.5 font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/30">
                    <td className="px-3 py-2.5 text-slate-700 font-medium">{s.full_name}</td>
                    <td className="px-3 py-2.5 text-slate-600">{s.student_id || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600">{s.email}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium ${s.has_bus_service ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                        {s.has_bus_service ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{s.assigned_route || "—"}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium ${s.bus_pass_status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                        {s.bus_pass_status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditing(s)} className="p-1 text-slate-400 hover:text-blue-600">
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => updateStudent(s.id, { has_bus_service: !s.has_bus_service })}
                          className={`p-1 ${s.has_bus_service ? "text-emerald-500 hover:text-emerald-600" : "text-slate-300 hover:text-emerald-500"}`}
                          title="Toggle bus service"
                        >
                          <BusFront size={13} />
                        </button>
                        <button
                          onClick={() => updateStudent(s.id, { bus_pass_status: s.bus_pass_status === "active" ? "inactive" : "active" })}
                          className="p-1 text-slate-400 hover:text-emerald-600"
                          title="Toggle bus pass"
                        >
                          <Check size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(editing || showAdd) && (
        <StudentEditModal
          student={editing}
          onClose={() => { setEditing(null); setShowAdd(false); }}
          onSave={async (data: Record<string, unknown>) => {
            if (editing) {
              await supabase.from("students").update(data).eq("id", editing.id);
            } else {
              await supabase.from("students").insert(data);
            }
            setEditing(null);
            setShowAdd(false);
            fetchStudents();
          }}
        />
      )}
    </div>
  );
}

function StudentEditModal({ student, onClose, onSave }: { student: any; onClose: () => void; onSave: (data: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({
    full_name: student?.full_name || "",
    email: student?.email || "",
    student_id: student?.student_id || "",
    phone_number: student?.phone_number || "",
    has_bus_service: student?.has_bus_service ?? false,
    assigned_route: student?.assigned_route || "",
    bus_pass_status: student?.bus_pass_status || "inactive",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4" onClick={onClose}>
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold text-slate-800">{student ? "Edit Student" : "Add Student"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <input className="w-full text-[12.5px] border border-slate-200 rounded-md px-3 py-2" placeholder="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <input className="w-full text-[12.5px] border border-slate-200 rounded-md px-3 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="w-full text-[12.5px] border border-slate-200 rounded-md px-3 py-2" placeholder="Student ID" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} />
          <input className="w-full text-[12.5px] border border-slate-200 rounded-md px-3 py-2" placeholder="Phone" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
          <select className="w-full text-[12.5px] border border-slate-200 rounded-md px-3 py-2" value={form.assigned_route} onChange={(e) => setForm({ ...form, assigned_route: e.target.value })}>
            <option value="">No Route</option>
            <option value="UNI1_TO_SCALER">Uni 1 → Scaler</option>
            <option value="SCALER_TO_UNI1">Scaler → Uni 1</option>
            <option value="UNI2_TO_SCALER">Uni 2 → Scaler</option>
            <option value="SCALER_TO_UNI2">Scaler → Uni 2</option>
          </select>
          <label className="flex items-center gap-2 text-[12.5px] text-slate-600">
            <input type="checkbox" checked={form.has_bus_service} onChange={(e) => setForm({ ...form, has_bus_service: e.target.checked })} />
            Has Bus Service
          </label>
          <select className="w-full text-[12.5px] border border-slate-200 rounded-md px-3 py-2" value={form.bus_pass_status} onChange={(e) => setForm({ ...form, bus_pass_status: e.target.value })}>
            <option value="inactive">Pass Inactive</option>
            <option value="active">Pass Active</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="text-[12.5px] px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={() => onSave(form)} className="text-[12.5px] px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700">Save</button>
        </div>
      </div>
    </div>
  );
}

// --- Routes ---
function RoutesSection() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("routes").select("*").order("route_code").then(({ data }) => {
      setRoutes(data || []);
      setLoading(false);
    });
  }, []);

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("routes").update({ is_active: !current }).eq("id", id);
    setRoutes((prev) => prev.map((r) => r.id === id ? { ...r, is_active: !current } : r));
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-slate-400" size={24} /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {routes.map((r) => (
        <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Route size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-800">{r.route_name}</p>
                <p className="text-[11px] text-slate-500">{r.route_code}</p>
              </div>
            </div>
            <button
              onClick={() => toggleActive(r.id, r.is_active)}
              className={`px-2.5 py-1 rounded-full text-[10.5px] font-medium ${r.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}
            >
              {r.is_active ? "Active" : "Inactive"}
            </button>
          </div>
          <p className="text-[11.5px] text-slate-500">{r.start_location} → {r.end_location}</p>
        </div>
      ))}
    </div>
  );
}

// --- Timetable ---
function TimetableSection() {
  const [timetables, setTimetables] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchTimetables = useCallback(async () => {
    const { data } = await supabase.from("timetables").select("*, routes(route_code, route_name)").order("departure_time");
    setTimetables(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.from("routes").select("*").then(({ data }) => setRoutes(data || []));
    fetchTimetables();
  }, [fetchTimetables]);

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("timetables").update({ is_active: !current }).eq("id", id);
    fetchTimetables();
  };

  const deleteEntry = async (id: string) => {
    await supabase.from("timetables").delete().eq("id", id);
    fetchTimetables();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-slate-400" size={24} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-semibold text-slate-800">Timetable Management</h2>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-[12px] font-medium text-white bg-blue-600 rounded-md px-3 py-2 hover:bg-blue-700">
          <Plus size={14} /> Add Entry
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-3 py-2.5 font-medium text-slate-500">Route</th>
              <th className="text-left px-3 py-2.5 font-medium text-slate-500">Departure</th>
              <th className="text-left px-3 py-2.5 font-medium text-slate-500">Arrival</th>
              <th className="text-left px-3 py-2.5 font-medium text-slate-500">Day</th>
              <th className="text-left px-3 py-2.5 font-medium text-slate-500">Status</th>
              <th className="text-left px-3 py-2.5 font-medium text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {timetables.map((t) => (
              <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/30">
                <td className="px-3 py-2.5 text-slate-700">{t.routes?.route_name || "—"}</td>
                <td className="px-3 py-2.5 text-slate-600">{t.departure_time}</td>
                <td className="px-3 py-2.5 text-slate-600">{t.arrival_time}</td>
                <td className="px-3 py-2.5 text-slate-600">{t.day_of_week}</td>
                <td className="px-3 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium ${t.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                    {t.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive(t.id, t.is_active)} className="p-1 text-slate-400 hover:text-emerald-600"><Check size={13} /></button>
                    <button onClick={() => deleteEntry(t.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <TimetableAddModal
          routes={routes}
          onClose={() => setShowAdd(false)}
          onSave={async (data: Record<string, unknown>) => {
            await supabase.from("timetables").insert(data);
            setShowAdd(false);
            fetchTimetables();
          }}
        />
      )}
    </div>
  );
}

function TimetableAddModal({ routes, onClose, onSave }: { routes: any[]; onClose: () => void; onSave: (data: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ route_id: "", departure_time: "", arrival_time: "", day_of_week: "all" });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4" onClick={onClose}>
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-sm p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold text-slate-800">Add Timetable Entry</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <select className="w-full text-[12.5px] border border-slate-200 rounded-md px-3 py-2" value={form.route_id} onChange={(e) => setForm({ ...form, route_id: e.target.value })}>
            <option value="">Select Route</option>
            {routes.map((r) => <option key={r.id} value={r.id}>{r.route_name}</option>)}
          </select>
          <input type="time" className="w-full text-[12.5px] border border-slate-200 rounded-md px-3 py-2" value={form.departure_time} onChange={(e) => setForm({ ...form, departure_time: e.target.value })} placeholder="Departure" />
          <input type="time" className="w-full text-[12.5px] border border-slate-200 rounded-md px-3 py-2" value={form.arrival_time} onChange={(e) => setForm({ ...form, arrival_time: e.target.value })} placeholder="Arrival" />
          <select className="w-full text-[12.5px] border border-slate-200 rounded-md px-3 py-2" value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}>
            <option value="all">All Days</option>
            <option value="mon">Monday</option>
            <option value="tue">Tuesday</option>
            <option value="wed">Wednesday</option>
            <option value="thu">Thursday</option>
            <option value="fri">Friday</option>
            <option value="sat">Saturday</option>
            <option value="sun">Sunday</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="text-[12.5px] px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={() => onSave(form)} className="text-[12.5px] px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700">Add</button>
        </div>
      </div>
    </div>
  );
}

// --- Notifications ---
function NotificationsSection() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchNotifs = useCallback(async () => {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false });
    setNotifications(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifs();
    supabase.from("students").select("id, full_name, student_id").then(({ data }) => setStudents(data || []));
  }, [fetchNotifs]);

  const deleteNotif = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    fetchNotifs();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("notifications").update({ is_active: !current }).eq("id", id);
    fetchNotifs();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-slate-400" size={24} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-semibold text-slate-800">Notification Management</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-[12px] font-medium text-white bg-blue-600 rounded-md px-3 py-2 hover:bg-blue-700">
          <Plus size={14} /> Create Notification
        </button>
      </div>

      <div className="space-y-2">
        {notifications.map((n) => (
          <div key={n.id} className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[13px] font-semibold text-slate-800">{n.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${n.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                  {n.is_active ? "Active" : "Inactive"}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600">{n.target_type}</span>
              </div>
              <p className="text-[11.5px] text-slate-500">{n.message}</p>
              <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => toggleActive(n.id, n.is_active)} className="p-1 text-slate-400 hover:text-emerald-600"><Check size={13} /></button>
              <button onClick={() => deleteNotif(n.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <NotificationFormModal
          students={students}
          onClose={() => setShowForm(false)}
          onSave={async (data: Record<string, unknown>) => {
            await supabase.from("notifications").insert(data);
            setShowForm(false);
            fetchNotifs();
          }}
        />
      )}
    </div>
  );
}

function NotificationFormModal({ students, onClose, onSave }: { students: any[]; onClose: () => void; onSave: (data: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ title: "", message: "", target_type: "all", target_route: "", target_student_id: "" });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4" onClick={onClose}>
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold text-slate-800">Create Notification</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <input className="w-full text-[12.5px] border border-slate-200 rounded-md px-3 py-2" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="w-full text-[12.5px] border border-slate-200 rounded-md px-3 py-2" rows={3} placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <select className="w-full text-[12.5px] border border-slate-200 rounded-md px-3 py-2" value={form.target_type} onChange={(e) => setForm({ ...form, target_type: e.target.value })}>
            <option value="all">All Students</option>
            <option value="bus_users">Bus Users Only</option>
            <option value="route">Specific Route</option>
            <option value="student">Specific Student</option>
          </select>
          {form.target_type === "route" && (
            <select className="w-full text-[12.5px] border border-slate-200 rounded-md px-3 py-2" value={form.target_route} onChange={(e) => setForm({ ...form, target_route: e.target.value })}>
              <option value="">Select Route</option>
              <option value="UNI1_TO_SCALER">Uni 1 → Scaler</option>
              <option value="SCALER_TO_UNI1">Scaler → Uni 1</option>
              <option value="UNI2_TO_SCALER">Uni 2 → Scaler</option>
              <option value="SCALER_TO_UNI2">Scaler → Uni 2</option>
            </select>
          )}
          {form.target_type === "student" && (
            <select className="w-full text-[12.5px] border border-slate-200 rounded-md px-3 py-2" value={form.target_student_id} onChange={(e) => setForm({ ...form, target_student_id: e.target.value })}>
              <option value="">Select Student</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.student_id || "no ID"})</option>)}
            </select>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="text-[12.5px] px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={() => onSave(form)} className="text-[12.5px] px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700">Send</button>
        </div>
      </div>
    </div>
  );
}

// --- Buses ---
function BusesSection() {
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("buses").select("*").then(({ data }) => {
      setBuses(data || []);
      setLoading(false);
    });
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("buses").update({ status, last_updated: new Date().toISOString() }).eq("id", id);
    setBuses((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-slate-400" size={24} /></div>;

  const statusColors: Record<string, string> = {
    "On Time": "bg-emerald-50 text-emerald-600",
    "Delayed": "bg-red-50 text-red-600",
    "Arriving": "bg-blue-50 text-blue-600",
    "Inactive": "bg-slate-100 text-slate-500",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {buses.map((b) => (
        <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <BusFront size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-800">{b.bus_number}</p>
                <p className="text-[11px] text-slate-500">{b.assigned_route || "Unassigned"}</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-medium ${statusColors[b.status]}`}>
              {b.status}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <p className="text-[10.5px] text-slate-400 mr-2">Set status:</p>
            {["On Time", "Delayed", "Arriving", "Inactive"].map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(b.id, s)}
                className={`text-[10.5px] px-2 py-1 rounded-md border transition-colors ${
                  b.status === s ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {b.latitude && b.longitude && (
            <p className="text-[10px] text-slate-400 mt-2">
              GPS: {b.latitude.toFixed(4)}, {b.longitude.toFixed(4)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// --- Settings ---
function SettingsSection() {
  const { profile } = useAuth();
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-md">
      <h2 className="text-[14px] font-semibold text-slate-800 mb-3">Admin Settings</h2>
      <div className="space-y-2 text-[12px]">
        <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="text-slate-700 font-medium">{profile?.full_name || "—"}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="text-slate-700 font-medium">{profile?.email || "—"}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Role</span><span className="text-slate-700 font-medium">Admin</span></div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-2">
          <Activity size={14} className="text-slate-400" />
          <p className="text-[12px] text-slate-500">System Status</p>
        </div>
        <p className="text-[11px] text-slate-400">All systems operational. Database connected with real-time subscriptions active.</p>
      </div>
    </div>
  );
}
