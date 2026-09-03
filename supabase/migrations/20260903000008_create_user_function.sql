-- Function to allow creating a user in auth.users and public.profiles atomically with confirmed email
CREATE OR REPLACE FUNCTION public.create_new_user(
  user_email TEXT,
  user_password TEXT DEFAULT 'Hangout@123',
  user_nickname TEXT DEFAULT '',
  user_role TEXT DEFAULT 'Professor',
  user_avatar TEXT DEFAULT '',
  user_dob TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  new_uid UUID := gen_random_uuid();
  hashed_pw TEXT;
  final_pw TEXT := COALESCE(NULLIF(trim(user_password), ''), 'Hangout@123');
  res_user JSONB;
BEGIN
  -- Check if email already exists in auth.users or profiles
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = lower(trim(user_email))) THEN
    RAISE EXCEPTION 'O e-mail % já está cadastrado no sistema.', user_email;
  END IF;

  hashed_pw := extensions.crypt(final_pw, extensions.gen_salt('bf', 10));

  -- 1. Insert into auth.users with email_confirmed_at = now() so login works immediately without email verification roadblock
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
    new_uid,
    'authenticated',
    'authenticated',
    lower(trim(user_email)),
    hashed_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'sub', new_uid::text,
      'email', lower(trim(user_email)),
      'email_verified', true,
      'phone_verified', false,
      'nickname', user_nickname,
      'role', user_role,
      'avatar', COALESCE(NULLIF(user_avatar, ''), 'https://picsum.photos/seed/' || new_uid || '/100/100'),
      'permissions', '[]'::jsonb
    ),
    now(),
    now(),
    '', '', '', '', '', '', '', '', 0, false, false
  );

  -- 2. Insert into auth.identities
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
    new_uid,
    jsonb_build_object(
      'sub', new_uid::text,
      'email', lower(trim(user_email)),
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    new_uid::text,
    now(),
    now(),
    now()
  );

  -- 3. Update dob if provided (the on_auth_user_created trigger already created the profile)
  IF user_dob IS NOT NULL THEN
    UPDATE public.profiles SET dob = user_dob WHERE id = new_uid::text;
  END IF;

  SELECT to_jsonb(p) INTO res_user FROM public.profiles p WHERE p.id = new_uid::text;
  RETURN res_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
