-- Register Sidney, Patricia, Maisa, Celia with exact GoTrue structure
DO $$
DECLARE
  hashed_pw TEXT := extensions.crypt('Hangout@123', extensions.gen_salt('bf', 10));
  
  u_sidney UUID := 'a0000000-0000-0000-0000-000000000002';
  u_patricia UUID := 'a0000000-0000-0000-0000-000000000003';
  u_maisa UUID := 'a0000000-0000-0000-0000-000000000004';
  u_celia UUID := 'a0000000-0000-0000-0000-000000000005';
BEGIN
  -- Sidney
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sidney@hangout.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token,
      phone_change, phone_change_token, reauthentication_token, email_change_token_current,
      email_change_confirm_status, is_sso_user, is_anonymous
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', u_sidney, 'authenticated', 'authenticated',
      'sidney@hangout.com', hashed_pw, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'sub', u_sidney::text, 'email', 'sidney@hangout.com', 'email_verified', true, 'phone_verified', false,
        'nickname', 'Sidney Xisto', 'role', 'Professor', 'avatar', 'https://picsum.photos/seed/sidney/100/100', 'permissions', jsonb_build_array()
      ),
      now(), now(), '', '', '', '', '', '', '', '', 0, false, false
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), u_sidney, jsonb_build_object('sub', u_sidney::text, 'email', 'sidney@hangout.com', 'email_verified', true, 'phone_verified', false), 'email', u_sidney::text, now(), now(), now());
  END IF;

  -- Patricia
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'patricia@hangout.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token,
      phone_change, phone_change_token, reauthentication_token, email_change_token_current,
      email_change_confirm_status, is_sso_user, is_anonymous
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', u_patricia, 'authenticated', 'authenticated',
      'patricia@hangout.com', hashed_pw, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'sub', u_patricia::text, 'email', 'patricia@hangout.com', 'email_verified', true, 'phone_verified', false,
        'nickname', 'Patricia Lara', 'role', 'Professor', 'avatar', 'https://picsum.photos/seed/patricia/100/100', 'permissions', jsonb_build_array()
      ),
      now(), now(), '', '', '', '', '', '', '', '', 0, false, false
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), u_patricia, jsonb_build_object('sub', u_patricia::text, 'email', 'patricia@hangout.com', 'email_verified', true, 'phone_verified', false), 'email', u_patricia::text, now(), now(), now());
  END IF;

  -- Maisa
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'maisa@hangout.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token,
      phone_change, phone_change_token, reauthentication_token, email_change_token_current,
      email_change_confirm_status, is_sso_user, is_anonymous
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', u_maisa, 'authenticated', 'authenticated',
      'maisa@hangout.com', hashed_pw, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'sub', u_maisa::text, 'email', 'maisa@hangout.com', 'email_verified', true, 'phone_verified', false,
        'nickname', 'Maisa Gabriele', 'role', 'Professor', 'avatar', 'https://picsum.photos/seed/maisa/100/100', 'permissions', jsonb_build_array()
      ),
      now(), now(), '', '', '', '', '', '', '', '', 0, false, false
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), u_maisa, jsonb_build_object('sub', u_maisa::text, 'email', 'maisa@hangout.com', 'email_verified', true, 'phone_verified', false), 'email', u_maisa::text, now(), now(), now());
  END IF;

  -- Celia
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'celia@hangout.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token,
      phone_change, phone_change_token, reauthentication_token, email_change_token_current,
      email_change_confirm_status, is_sso_user, is_anonymous
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', u_celia, 'authenticated', 'authenticated',
      'celia@hangout.com', hashed_pw, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'sub', u_celia::text, 'email', 'celia@hangout.com', 'email_verified', true, 'phone_verified', false,
        'nickname', 'Celia Xisto', 'role', 'Secretaria', 'avatar', 'https://picsum.photos/seed/celia/100/100', 'permissions', jsonb_build_array()
      ),
      now(), now(), '', '', '', '', '', '', '', '', 0, false, false
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), u_celia, jsonb_build_object('sub', u_celia::text, 'email', 'celia@hangout.com', 'email_verified', true, 'phone_verified', false), 'email', u_celia::text, now(), now(), now());
  END IF;

  -- Update teacher_id in classes
  UPDATE classes SET teacher_id = u_sidney::text WHERE teacher = 'Sidney Xisto' OR teacher_id = 'USR-002';
  UPDATE classes SET teacher_id = u_patricia::text WHERE teacher = 'Patricia Lara' OR teacher_id = 'USR-003';

END $$;
