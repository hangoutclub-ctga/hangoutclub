-- Restore profiles from auth.users for any profiles with empty nickname/email
UPDATE public.profiles p
SET 
  nickname = COALESCE(NULLIF(u.raw_user_meta_data->>'nickname', ''), p.nickname, 'Colaborador'),
  email = COALESCE(NULLIF(u.email, ''), p.email),
  avatar = COALESCE(NULLIF(u.raw_user_meta_data->>'avatar', ''), p.avatar),
  role = COALESCE(NULLIF(u.raw_user_meta_data->>'role', ''), p.role, 'Professor')
FROM auth.users u
WHERE p.id = u.id::text
  AND (p.email IS NULL OR p.email = '' OR p.nickname IS NULL OR p.nickname = '');
