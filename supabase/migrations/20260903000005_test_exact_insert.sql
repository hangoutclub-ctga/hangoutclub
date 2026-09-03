
DO $$
DECLARE
  uid UUID := 'a0000000-0000-0000-0000-000000000001';
  hashed_pw TEXT := extensions.crypt('Hangout@123', extensions.gen_salt('bf', 10));
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    phone_change,
    phone_change_token,
    reauthentication_token,
    email_change_token_current,
    email_change_confirm_status,
    is_sso_user,
    is_anonymous
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    uid,
    'authenticated',
    'authenticated',
    'admin@hangout.com',
    hashed_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'sub', uid::text,
      'email', 'admin@hangout.com',
      'email_verified', true,
      'phone_verified', false,
      'nickname', 'Hangout',
      'role', 'Admin',
      'avatar', 'https://picsum.photos/seed/admin/100/100',
      'permissions', jsonb_build_array('nav:dashboard','nav:agenda','nav:students','nav:classes','nav:grades','nav:finance','nav:inventory','nav:communication','nav:trash')
    ),
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    0,
    false,
    false
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    uid,
    jsonb_build_object(
      'sub', uid::text,
      'email', 'admin@hangout.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    uid::text,
    now(),
    now(),
    now()
  );
END $$;
