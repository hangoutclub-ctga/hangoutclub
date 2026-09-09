import { createClient } from '@/lib/supabase/client';
import { toUser, toUserInsert, toUserUpdate } from '@/lib/supabase/mappers';
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

  // Call PostgreSQL RPC to create user in auth.users and profiles atomically
  if (user.email) {
    const { data, error } = await (supabase.rpc as any)('create_new_user', {
      user_email: user.email,
      user_password: (user as any).password || 'Hangout@123',
      user_nickname: user.nickname || '',
      user_role: user.role || 'Professor',
      user_avatar: user.avatar || '',
      user_dob: user.dob || null,
    });

    if (error) {
      console.error('Error in create_new_user RPC:', error);
      throw new Error(error.message || 'Erro ao cadastrar usuário.');
    }

    if (data) {
      return toUser(data);
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
  const row = toUserUpdate(user);

  // If password was provided and not empty, update it in auth.users via admin RPC
  const newPassword = (user as any).password;
  if (typeof newPassword === 'string' && newPassword.trim().length > 0) {
    const { error: pwErr } = await (supabase.rpc as any)('admin_update_user_password', {
      target_user_id: id,
      new_password: newPassword.trim(),
    });

    if (pwErr) {
      console.error(`Error updating password for user ${id}:`, pwErr);
      throw new Error(pwErr.message || 'Erro ao atualizar a senha do colaborador.');
    }
  }

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

export async function deleteUser(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await (supabase.rpc as any)('delete_user_by_id', {
    target_user_id: id
  });

  if (error) {
    console.error(`Error deleting user ${id} via rpc:`, error);
    // Fallback: direct delete from profiles
    const { error: pErr } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    if (pErr) throw pErr;
  }
}
