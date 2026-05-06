export type MacroCategory = 'interne' | 'mission';
export type PriorityLevel = 1 | 2 | 3;

export interface Category {
  id: string;
  name: string;
  macro: MacroCategory;
  color: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  category_id: string;
  importance: PriorityLevel;
  urgence: PriorityLevel;
  deadline: string | null;
  done: boolean;
  position: number;
  created_at: string;
}

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  1: 'Faible',
  2: 'Moyenne',
  3: 'Haute',
};

export const MACRO_LABELS: Record<MacroCategory, string> = {
  interne: 'Interne',
  mission: 'Mission',
};

export const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#a855f7', '#84cc16',
];
