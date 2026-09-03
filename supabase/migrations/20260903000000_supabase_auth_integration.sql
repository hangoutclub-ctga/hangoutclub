-- 1. Temporarily detach FK on classes
ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_teacher_id_fkey;

-- 2. Delete legacy USR-* profile records FIRST so emails are free for the trigger
DELETE FROM profiles WHERE id LIKE 'USR-%';

-- 3. Create or update function to automatically create/update profile when auth.users is inserted
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, email, avatar, role, permissions)
  VALUES (
    NEW.id::text,
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar', 'https://picsum.photos/seed/' || NEW.id || '/100/100'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Professor'),
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'permissions')),
      ARRAY[]::text[]
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nickname = COALESCE(EXCLUDED.nickname, profiles.nickname),
    avatar = COALESCE(EXCLUDED.avatar, profiles.avatar),
    role = COALESCE(EXCLUDED.role, profiles.role);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Register the 5 initial staff users in auth.users and auth.identities
DO $$
DECLARE
  u_admin UUID := 'a0000000-0000-0000-0000-000000000001';
  u_sidney UUID := 'a0000000-0000-0000-0000-000000000002';
  u_patricia UUID := 'a0000000-0000-0000-0000-000000000003';
  u_maisa UUID := 'a0000000-0000-0000-0000-000000000004';
  u_celia UUID := 'a0000000-0000-0000-0000-000000000005';
  hashed_pw TEXT;
BEGIN
  hashed_pw := extensions.crypt('Hangout@123', extensions.gen_salt('bf'));

  -- Admin
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@hangout.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', u_admin, 'authenticated', 'authenticated',
      'admin@hangout.com', hashed_pw, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"nickname":"Hangout","role":"Admin","avatar":"https://picsum.photos/seed/admin/100/100","permissions":["nav:dashboard","nav:agenda","nav:students","nav:classes","nav:grades","nav:finance","nav:inventory","nav:communication","nav:trash"]}'::jsonb,
      now(), now()
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (u_admin, u_admin, format('{"sub":"%s","email":"%s"}', u_admin, 'admin@hangout.com')::jsonb, 'email', 'admin@hangout.com', now(), now(), now())
    ON CONFLICT (provider, provider_id) DO NOTHING;
  END IF;

  -- Sidney
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sidney@hangout.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', u_sidney, 'authenticated', 'authenticated',
      'sidney@hangout.com', hashed_pw, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"nickname":"Sidney Xisto","role":"Professor","avatar":"https://picsum.photos/seed/sidney/100/100"}'::jsonb,
      now(), now()
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (u_sidney, u_sidney, format('{"sub":"%s","email":"%s"}', u_sidney, 'sidney@hangout.com')::jsonb, 'email', 'sidney@hangout.com', now(), now(), now())
    ON CONFLICT (provider, provider_id) DO NOTHING;
  END IF;

  -- Patricia
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'patricia@hangout.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', u_patricia, 'authenticated', 'authenticated',
      'patricia@hangout.com', hashed_pw, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"nickname":"Patricia Lara","role":"Professor","avatar":"https://picsum.photos/seed/patricia/100/100"}'::jsonb,
      now(), now()
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (u_patricia, u_patricia, format('{"sub":"%s","email":"%s"}', u_patricia, 'patricia@hangout.com')::jsonb, 'email', 'patricia@hangout.com', now(), now(), now())
    ON CONFLICT (provider, provider_id) DO NOTHING;
  END IF;

  -- Maisa
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'maisa@hangout.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', u_maisa, 'authenticated', 'authenticated',
      'maisa@hangout.com', hashed_pw, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"nickname":"Maisa Gabriele","role":"Professor","avatar":"https://picsum.photos/seed/maisa/100/100"}'::jsonb,
      now(), now()
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (u_maisa, u_maisa, format('{"sub":"%s","email":"%s"}', u_maisa, 'maisa@hangout.com')::jsonb, 'email', 'maisa@hangout.com', now(), now(), now())
    ON CONFLICT (provider, provider_id) DO NOTHING;
  END IF;

  -- Celia
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'celia@hangout.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', u_celia, 'authenticated', 'authenticated',
      'celia@hangout.com', hashed_pw, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"nickname":"Celia Xisto","role":"Secretaria","avatar":"https://picsum.photos/seed/celia/100/100"}'::jsonb,
      now(), now()
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (u_celia, u_celia, format('{"sub":"%s","email":"%s"}', u_celia, 'celia@hangout.com')::jsonb, 'email', 'celia@hangout.com', now(), now(), now())
    ON CONFLICT (provider, provider_id) DO NOTHING;
  END IF;

END $$;

-- 6. Update classes teacher_id to match the new profiles UUID
UPDATE classes SET teacher_id = 'a0000000-0000-0000-0000-000000000002' WHERE teacher = 'Sidney Xisto' OR teacher_id = 'USR-002';
UPDATE classes SET teacher_id = 'a0000000-0000-0000-0000-000000000003' WHERE teacher = 'Patricia Lara' OR teacher_id = 'USR-003';

-- 7. Restore FK constraint on classes
ALTER TABLE classes ADD CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE SET NULL;
