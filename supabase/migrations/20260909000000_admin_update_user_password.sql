-- Function to allow admin to update a user's password in auth.users
CREATE OR REPLACE FUNCTION public.admin_update_user_password(
  target_user_id TEXT,
  new_password TEXT
)
RETURNS VOID AS $$
DECLARE
  hashed_pw TEXT;
  final_pw TEXT := trim(new_password);
BEGIN
  IF final_pw IS NULL OR final_pw = '' THEN
    RETURN;
  END IF;

  hashed_pw := extensions.crypt(final_pw, extensions.gen_salt('bf', 10));

  UPDATE auth.users
  SET encrypted_password = hashed_pw,
      updated_at = now()
  WHERE id = target_user_id::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
