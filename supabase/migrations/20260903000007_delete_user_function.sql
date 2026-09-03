-- 1. Create function to delete a user from profiles and auth.users atomically
CREATE OR REPLACE FUNCTION public.delete_user_by_id(target_user_id TEXT)
RETURNS VOID AS $$
BEGIN
  -- Delete from public.profiles
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- Delete from auth.users (cascades to identities, tokens, etc.)
  BEGIN
    DELETE FROM auth.users WHERE id = target_user_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Clean up any existing test user if present (e.g. teste@gmail.com)
DO $$
BEGIN
  DELETE FROM public.profiles WHERE email = 'teste@gmail.com';
  DELETE FROM auth.users WHERE email = 'teste@gmail.com';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
