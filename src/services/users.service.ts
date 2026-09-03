import { createClient } from '@/lib/supabase/client';
import { toUser, toUserInsert } from '@/lib/supabase/mappers';
import { User } from '@/types';

export async function fetchUsers(): Promise<User[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('nickname', { ascending: true });

  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }

  return (data || []).map(toUser);
}

export async function createUser(user: Partial<User>): Promise<User> {
  const supabase = createClient();

  // Try creating in Supabase Auth first so they have login credentials
  if (user.email) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: (user as any).password || 'Hangout@123',
        options: {
          data: {
            nickname: user.nickname || '',
            role: user.role || 'Professor',
            avatar: user.avatar || '',
            permissions: user.permissions || []
          }
        }
      });

      if (!authError && authData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profile) return toUser(profile);
      }
    } catch (e) {
      console.warn('Auth signUp skipped or failed, falling back to direct profiles insert:', e);
    }
  }

  const row = toUserInsert(user);
  const { data, error } = await supabase
    .from('profiles')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    throw error;
  }

  return toUser(data);
}

export async function updateUser(id: string, user: Partial<User>): Promise<User> {
  const supabase = createClient();
  const row = toUserInsert(user);
  delete (row as any).id;

  const { data, error } = await supabase
    .from('profiles')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating user ${id}:`, error);
    throw error;
  }

  return toUser(data);
}
