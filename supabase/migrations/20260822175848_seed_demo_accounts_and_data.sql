-- Create admin auth user
-- Using the Supabase auth admin function to create the user with password
DO $$
DECLARE
  admin_user_id uuid;
  student_profile_id uuid;
BEGIN
  -- Create admin auth user if not exists
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'aarav.26bcs10417@sst.scaler.com';
  IF admin_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_sso_user,
      email_change_confirm_status
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'aarav.26bcs10417@sst.scaler.com',
      crypt('12344321', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Aarav","role":"admin"}',
      false,
      0
    )
    RETURNING id INTO admin_user_id;
  END IF;

  -- Upsert admin profile
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (admin_user_id, 'Aarav', 'aarav.26bcs10417@sst.scaler.com', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Aarav';

  -- Get the existing student profile
  SELECT id INTO student_profile_id FROM public.profiles WHERE email = 'patelaaravt1311@gmail.com';

  -- Create student record if profile exists and student record doesn't
  IF student_profile_id IS NOT NULL THEN
    INSERT INTO public.students (
      profile_id, full_name, email, student_id,
      has_bus_service, assigned_route, bus_pass_status
    )
    VALUES (
      student_profile_id, 'Vraj', 'patelaaravt1311@gmail.com', '26BCS10417',
      true, 'UNI1_TO_SCALER', 'active'
    )
    ON CONFLICT DO NOTHING;

    -- Create bus pass for the student
    INSERT INTO public.bus_passes (student_id, pass_number, assigned_route, status, valid_from, valid_until)
    SELECT s.id, 'SST-BUS-2026-001', 'UNI1_TO_SCALER', 'active', '2026-01-01', '2026-12-31'
    FROM public.students s
    WHERE s.profile_id = student_profile_id
    AND NOT EXISTS (
      SELECT 1 FROM public.bus_passes bp WHERE bp.student_id = s.id
    );
  END IF;
END $$;
