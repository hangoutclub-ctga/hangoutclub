import { createClient } from '@/lib/supabase/client';
import { toClass, toClassInsert, toClassUpdate } from '@/lib/supabase/mappers';
import { Class } from '@/types';

export async function fetchClasses(): Promise<Class[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching classes:', error);
    throw error;
  }

  return (data || []).map(toClass);
}

export async function createClass(c: Partial<Class>): Promise<Class> {
  const supabase = createClient();
  const row = toClassInsert(c);

  const { data, error } = await supabase
    .from('classes')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('Error creating class:', error);
    throw error;
  }

  return toClass(data);
}

export async function updateClass(id: string, c: Partial<Class>): Promise<Class> {
  const supabase = createClient();
  const row = toClassUpdate(c);

  const { data, error } = await supabase
    .from('classes')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating class ${id}:`, error);
    throw error;
  }

  return toClass(data);
}

export async function deleteClass(id: string, soft: boolean = true): Promise<void> {
  const supabase = createClient();

  if (soft) {
    const { error } = await supabase
      .from('classes')
      .update({ status: 'Apagado' })
      .eq('id', id);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
