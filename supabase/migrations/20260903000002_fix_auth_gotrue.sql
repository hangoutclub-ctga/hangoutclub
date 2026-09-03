-- Fix auth.identities and auth.users for GoTrue compatibility
UPDATE auth.identities
SET 
  provider_id = user_id::text,
  identity_data = jsonb_build_object(
    'sub', user_id::text,
    'email', email,
    'email_verified', true,
    'phone_verified', false
  )
WHERE provider = 'email';

UPDATE auth.users
SET
  encrypted_password = extensions.crypt('Hangout@123', extensions.gen_salt('bf', 10)),
  is_super_admin = false,
  is_sso_user = false,
  is_anonymous = false,
  phone_change = '',
  email_change = '',
  recovery_token = '',
  phone_change_token = '',
  email_change_token_new = '',
  reauthentication_token = '',
  email_change_token_current = '',
  email_change_confirm_status = 0,
  email_confirmed_at = now()
WHERE email LIKE '%@hangout.com';

-- Clean up debug function
DROP FUNCTION IF EXISTS public.debug_inspect_auth();
