import { createClient } from '@/lib/supabase/client';
import { toSystemCategory, toSystemCategoryInsert, toSystemCategoryUpdate } from '@/lib/supabase/mappers';
import { SystemCategory, SystemCategoryType } from '@/types';

export async function fetchSystemCategories(type?: SystemCategoryType): Promise<SystemCategory[]> {
  const supabase = createClient();
  let query = supabase
    .from('system_categories')
    .select('*')
    .order('created_at', { ascending: true });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching system categories:', error);
    throw error;
  }

  return (data || []).map(toSystemCategory);
}

export async function createSystemCategory(item: Partial<SystemCategory>): Promise<SystemCategory> {
  const supabase = createClient();
  const row = toSystemCategoryInsert(item);

  const { data, error } = await supabase
    .from('system_categories')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('Error creating system category:', error);
    throw error;
  }

  return toSystemCategory(data);
}

export async function updateSystemCategory(id: string, item: Partial<SystemCategory>): Promise<SystemCategory> {
  const supabase = createClient();
  const row = toSystemCategoryUpdate(item);

  const { data, error } = await supabase
    .from('system_categories')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating system category ${id}:`, error);
    throw error;
  }

  return toSystemCategory(data);
}

export async function deleteSystemCategory(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('system_categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting system category ${id}:`, error);
    throw error;
  }
}
