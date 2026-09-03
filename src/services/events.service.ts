import { createClient } from '@/lib/supabase/client';
import { toEvent, toEventInsert, toEventUpdate } from '@/lib/supabase/mappers';
import { ManualEvent } from '@/types';

export async function fetchEvents(): Promise<ManualEvent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }

  return (data || []).map(toEvent);
}

export async function createEvent(event: Partial<ManualEvent>): Promise<ManualEvent> {
  const supabase = createClient();
  const row = toEventInsert(event);

  const { data, error } = await supabase
    .from('events')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('Error creating event:', error);
    throw error;
  }

  return toEvent(data);
}

export async function updateEvent(id: string, event: Partial<ManualEvent>): Promise<ManualEvent> {
  const supabase = createClient();
  const row = toEventUpdate(event);

  const { data, error } = await supabase
    .from('events')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating event ${id}:`, error);
    throw error;
  }

  return toEvent(data);
}

export async function deleteEvent(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting event ${id}:`, error);
    throw error;
  }
}
