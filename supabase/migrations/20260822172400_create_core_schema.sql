/*
# SST Bus System — Core Schema

## Overview
Creates the complete database schema for the SST college bus management platform:
authentication profiles, student records, bus routes, timetables, notifications,
bus passes, live buses, and admin activity logs — all with Row Level Security.

## New Tables
1. profiles — extends auth.users with role (student/admin), full_name, student_id
2. routes — the 4 bus routes (Uni1↔Scaler, Uni2↔Scaler)
3. students — student bus-service records linked to profiles
4. timetables — schedule entries per route
5. notifications — targeted announcements
6. bus_passes — digital passes linked to students
7. buses — live bus tracking records with lat/lng
8. admin_activity_logs — audit trail for admin actions

## Security
- RLS enabled on every table.
- Students read only their own data; admins manage everything.
- is_admin() SECURITY DEFINER function checks role safely.
- handle_new_user trigger auto-creates a profile on signup.
*/

-- ============================================================
-- 1. profiles (table only, policies after is_admin)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  student_id text,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTION: is_admin() (after profiles table exists)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Now create profiles policies
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
CREATE POLICY "profiles_insert_admin" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- ============================================================
-- 2. routes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_code text UNIQUE NOT NULL,
  route_name text NOT NULL,
  start_location text NOT NULL,
  end_location text NOT NULL,
  route_type text NOT NULL DEFAULT 'regular',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "routes_select_all" ON public.routes;
CREATE POLICY "routes_select_all" ON public.routes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "routes_insert_admin" ON public.routes;
CREATE POLICY "routes_insert_admin" ON public.routes
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "routes_update_admin" ON public.routes;
CREATE POLICY "routes_update_admin" ON public.routes
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "routes_delete_admin" ON public.routes;
CREATE POLICY "routes_delete_admin" ON public.routes
  FOR DELETE TO authenticated USING (public.is_admin());

-- ============================================================
-- 3. students
-- ============================================================

CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  student_id text,
  phone_number text,
  has_bus_service boolean NOT NULL DEFAULT false,
  assigned_route text,
  bus_pass_status text NOT NULL DEFAULT 'inactive' CHECK (bus_pass_status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_select_own_or_admin" ON public.students;
CREATE POLICY "students_select_own_or_admin" ON public.students
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "students_insert_admin" ON public.students;
CREATE POLICY "students_insert_admin" ON public.students
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "students_update_admin" ON public.students;
CREATE POLICY "students_update_admin" ON public.students
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "students_delete_admin" ON public.students;
CREATE POLICY "students_delete_admin" ON public.students
  FOR DELETE TO authenticated USING (public.is_admin());

-- ============================================================
-- 4. timetables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.timetables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES public.routes(id) ON DELETE CASCADE,
  departure_time text NOT NULL,
  arrival_time text NOT NULL,
  day_of_week text NOT NULL DEFAULT 'all',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id)
);

ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "timetables_select_all" ON public.timetables;
CREATE POLICY "timetables_select_all" ON public.timetables
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "timetables_insert_admin" ON public.timetables;
CREATE POLICY "timetables_insert_admin" ON public.timetables
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "timetables_update_admin" ON public.timetables;
CREATE POLICY "timetables_update_admin" ON public.timetables
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "timetables_delete_admin" ON public.timetables;
CREATE POLICY "timetables_delete_admin" ON public.timetables
  FOR DELETE TO authenticated USING (public.is_admin());

-- ============================================================
-- 5. notifications
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  target_type text NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'bus_users', 'route', 'student')),
  target_route text,
  target_student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_relevant_or_admin" ON public.notifications;
CREATE POLICY "notifications_select_relevant_or_admin" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (
      is_active = true
      AND (
        target_type = 'all'
        OR (
          target_type = 'bus_users'
          AND EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.profile_id = auth.uid() AND s.has_bus_service = true
          )
        )
        OR (
          target_type = 'route'
          AND EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.profile_id = auth.uid()
            AND s.assigned_route = notifications.target_route
          )
        )
        OR (
          target_type = 'student'
          AND target_student_id IN (
            SELECT s.id FROM public.students s WHERE s.profile_id = auth.uid()
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS "notifications_insert_admin" ON public.notifications;
CREATE POLICY "notifications_insert_admin" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "notifications_update_admin" ON public.notifications;
CREATE POLICY "notifications_update_admin" ON public.notifications
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "notifications_delete_admin" ON public.notifications;
CREATE POLICY "notifications_delete_admin" ON public.notifications
  FOR DELETE TO authenticated USING (public.is_admin());

-- ============================================================
-- 6. bus_passes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bus_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  pass_number text UNIQUE,
  assigned_route text,
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
  valid_from date,
  valid_until date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bus_passes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bus_passes_select_own_or_admin" ON public.bus_passes;
CREATE POLICY "bus_passes_select_own_or_admin" ON public.bus_passes
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = bus_passes.student_id AND s.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "bus_passes_insert_admin" ON public.bus_passes;
CREATE POLICY "bus_passes_insert_admin" ON public.bus_passes
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "bus_passes_update_admin" ON public.bus_passes;
CREATE POLICY "bus_passes_update_admin" ON public.bus_passes
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "bus_passes_delete_admin" ON public.bus_passes;
CREATE POLICY "bus_passes_delete_admin" ON public.bus_passes
  FOR DELETE TO authenticated USING (public.is_admin());

-- ============================================================
-- 7. buses
-- ============================================================

CREATE TABLE IF NOT EXISTS public.buses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_number text NOT NULL,
  assigned_route text,
  status text NOT NULL DEFAULT 'On Time' CHECK (status IN ('On Time', 'Delayed', 'Arriving', 'Inactive')),
  latitude double precision,
  longitude double precision,
  last_updated timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "buses_select_all" ON public.buses;
CREATE POLICY "buses_select_all" ON public.buses
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "buses_insert_admin" ON public.buses;
CREATE POLICY "buses_insert_admin" ON public.buses
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "buses_update_admin" ON public.buses;
CREATE POLICY "buses_update_admin" ON public.buses
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "buses_delete_admin" ON public.buses;
CREATE POLICY "buses_delete_admin" ON public.buses
  FOR DELETE TO authenticated USING (public.is_admin());

-- ============================================================
-- 8. admin_activity_logs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "logs_select_admin" ON public.admin_activity_logs;
CREATE POLICY "logs_select_admin" ON public.admin_activity_logs
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "logs_insert_admin" ON public.admin_activity_logs;
CREATE POLICY "logs_insert_admin" ON public.admin_activity_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS routes_updated_at ON public.routes;
CREATE TRIGGER routes_updated_at BEFORE UPDATE ON public.routes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS students_updated_at ON public.students;
CREATE TRIGGER students_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS timetables_updated_at ON public.timetables;
CREATE TRIGGER timetables_updated_at BEFORE UPDATE ON public.timetables
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS bus_passes_updated_at ON public.bus_passes;
CREATE TRIGGER bus_passes_updated_at BEFORE UPDATE ON public.bus_passes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_students_profile_id ON public.students(profile_id);
CREATE INDEX IF NOT EXISTS idx_students_assigned_route ON public.students(assigned_route);
CREATE INDEX IF NOT EXISTS idx_timetables_route_id ON public.timetables(route_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target_type ON public.notifications(target_type);
CREATE INDEX IF NOT EXISTS idx_bus_passes_student_id ON public.bus_passes(student_id);
CREATE INDEX IF NOT EXISTS idx_buses_assigned_route ON public.buses(assigned_route);
CREATE INDEX IF NOT EXISTS idx_logs_admin_id ON public.admin_activity_logs(admin_id);