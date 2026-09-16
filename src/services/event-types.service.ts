import { createClient } from '@/lib/supabase/client';
import { toEventType, toEventTypeInsert, toEventTypeUpdate } from '@/lib/supabase/mappers';
import { EventType } from '@/types';

export async function fetchEventTypes(): Promise<EventType[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('event_types')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching event types:', error);
    throw error;
  }

  return (data || []).map(toEventType);
}

export async function createEventType(eventType: Partial<EventType>): Promise<EventType> {
  const supabase = createClient();
  const row = toEventTypeInsert(eventType);

  const { data, error } = await supabase
    .from('event_types')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('Error creating event type:', error);
    throw error;
  }

  return toEventType(data);
}

export async function updateEventType(id: string, eventType: Partial<EventType>): Promise<EventType> {
  const supabase = createClient();
  const row = toEventTypeUpdate(eventType);

  const { data, error } = await supabase
    .from('event_types')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating event type ${id}:`, error);
    throw error;
  }

  return toEventType(data);
}

export async function deleteEventType(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('event_types')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting event type ${id}:`, error);
    throw error;
  }
}
