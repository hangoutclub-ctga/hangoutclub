import { createClient } from '@/lib/supabase/client';
import { toTransaction, toTransactionInsert, toFixedExpense, toFixedExpenseInsert } from '@/lib/supabase/mappers';
import { Transaction, FixedExpense } from '@/types';

export async function fetchTransactions(): Promise<Transaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }

  return (data || []).map(toTransaction);
}

export async function createTransaction(t: Partial<Transaction>): Promise<Transaction> {
  const supabase = createClient();
  const row = toTransactionInsert(t);

  const { data, error } = await supabase
    .from('transactions')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }

  return toTransaction(data);
}

export async function deleteTransaction(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting transaction ${id}:`, error);
    throw error;
  }
}

export async function fetchFixedExpenses(): Promise<FixedExpense[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('fixed_expenses')
    .select('*')
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Error fetching fixed expenses:', error);
    throw error;
  }

  return (data || []).map(toFixedExpense);
}

export async function createFixedExpense(fe: Partial<FixedExpense>): Promise<FixedExpense> {
  const supabase = createClient();
  const row = toFixedExpenseInsert(fe);

  const { data, error } = await supabase
    .from('fixed_expenses')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('Error creating fixed expense:', error);
    throw error;
  }

  return toFixedExpense(data);
}

export async function updateFixedExpense(id: string, fe: Partial<FixedExpense>): Promise<FixedExpense> {
  const supabase = createClient();
  const row = toFixedExpenseInsert(fe);
  delete (row as any).id;

  const { data, error } = await supabase
    .from('fixed_expenses')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating fixed expense ${id}:`, error);
    throw error;
  }

  return toFixedExpense(data);
}

export async function deleteFixedExpense(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('fixed_expenses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting fixed expense ${id}:`, error);
    throw error;
  }
}
