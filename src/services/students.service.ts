import { createClient } from '@/lib/supabase/client';
import { toStudent, toStudentInsert } from '@/lib/supabase/mappers';
import { Student } from '@/types';

export async function fetchStudents(): Promise<Student[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching students:', error);
    throw error;
  }

  return (data || []).map(toStudent);
}

export async function createStudent(student: Partial<Student>): Promise<Student> {
  const supabase = createClient();
  const row = toStudentInsert(student);
  
  const { data, error } = await supabase
    .from('students')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('Error creating student:', error);
    throw error;
  }

  return toStudent(data);
}

export async function updateStudent(id: string, student: Partial<Student>): Promise<Student> {
  const supabase = createClient();
  const row = toStudentInsert(student);
  delete (row as any).id; // don't overwrite id

  const { data, error } = await supabase
    .from('students')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating student ${id}:`, error);
    throw error;
  }

  return toStudent(data);
}

export async function deleteStudent(id: string, soft: boolean = true): Promise<void> {
  const supabase = createClient();

  if (soft) {
    const { error } = await supabase
      .from('students')
      .update({ status: 'Apagado' })
      .eq('id', id);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
