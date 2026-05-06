import { createClient } from '@supabase/supabase-js';
import { Category, Task } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Categories ────────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as Category[];
}

export async function createCategory(
  name: string,
  macro: Category['macro'],
  color: string
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, macro, color })
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(
  id: string,
  updates: Partial<Pick<Category, 'name' | 'color'>>
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// ─── Tasks ─────────────────────────────────────────────────────────────────

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('position', { ascending: true });
  if (error) throw error;
  return data as Task[];
}

export async function createTask(task: Omit<Task, 'id' | 'created_at'>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(
  id: string,
  updates: Partial<Omit<Task, 'id' | 'created_at'>>
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function updateTaskPositions(
  updates: { id: string; position: number }[]
): Promise<void> {
  const promises = updates.map(({ id, position }) =>
    supabase.from('tasks').update({ position }).eq('id', id)
  );
  await Promise.all(promises);
}
