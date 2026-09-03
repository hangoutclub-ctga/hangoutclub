import { createClient } from '@/lib/supabase/client';
import { toInventoryItem, toInventoryItemInsert } from '@/lib/supabase/mappers';
import { InventoryItem, StockMovement } from '@/types';

export async function fetchInventory(): Promise<InventoryItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching inventory:', error);
    throw error;
  }

  return (data || []).map(toInventoryItem);
}

export async function createInventoryItem(item: Partial<InventoryItem>): Promise<InventoryItem> {
  const supabase = createClient();
  const row = toInventoryItemInsert(item);

  const { data, error } = await supabase
    .from('inventory_items')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('Error creating inventory item:', error);
    throw error;
  }

  return toInventoryItem(data);
}

export async function updateInventoryItem(id: string, item: Partial<InventoryItem>): Promise<InventoryItem> {
  const supabase = createClient();
  const row = toInventoryItemInsert(item);
  delete (row as any).id;

  const { data, error } = await supabase
    .from('inventory_items')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating inventory item ${id}:`, error);
    throw error;
  }

  return toInventoryItem(data);
}

export async function addStockMovement(
  id: string,
  movement: StockMovement,
  newStock: number
): Promise<InventoryItem> {
  const supabase = createClient();

  // First fetch current movements
  const { data: current, error: fetchErr } = await supabase
    .from('inventory_items')
    .select('movements, recent_movements')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  const existingMovements = Array.isArray(current.movements) ? current.movements : [];
  const updatedMovements = [movement, ...existingMovements];
  const recentMovements = (current.recent_movements || 0) + 1;

  const { data, error } = await supabase
    .from('inventory_items')
    .update({
      stock: newStock,
      movements: updatedMovements as any,
      recent_movements: recentMovements,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toInventoryItem(data);
}

export async function deleteInventoryItem(id: string, soft: boolean = true): Promise<void> {
  const supabase = createClient();

  if (soft) {
    const { error } = await supabase
      .from('inventory_items')
      .update({ status: 'Apagado' })
      .eq('id', id);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
