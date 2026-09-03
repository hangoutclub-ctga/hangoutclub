
-- 1. Ensure handle_new_user trigger works cleanly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $func$
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
    role = COALESCE(EXCLUDED.role, profiles.role),
    permissions = COALESCE(EXCLUDED.permissions, profiles.permissions);

  RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Delete previous test/manual users
ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_teacher_id_fkey;
UPDATE classes SET teacher_id = NULL;
DELETE FROM public.profiles;
DELETE FROM auth.users;
ALTER TABLE classes ADD CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE SET NULL;
