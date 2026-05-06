'use client';

import { useState, useEffect } from 'react';
import { Task, Category, PriorityLevel, PRIORITY_LABELS } from '@/lib/types';
import { format } from 'date-fns';

interface TaskModalProps {
  task?: Task | null;
  categories: Category[];
  defaultCategoryId?: string;
  defaultImportance?: PriorityLevel;
  defaultUrgence?: PriorityLevel;
  onSave: (data: Omit<Task, 'id' | 'created_at'>) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export default function TaskModal({
  task,
  categories,
  defaultCategoryId,
  defaultImportance = 2,
  defaultUrgence = 2,
  onSave,
  onDelete,
  onClose,
}: TaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [categoryId, setCategoryId] = useState(
    task?.category_id ?? defaultCategoryId ?? categories[0]?.id ?? ''
  );
  const [importance, setImportance] = useState<PriorityLevel>(task?.importance ?? defaultImportance);
  const [urgence, setUrgence] = useState<PriorityLevel>(task?.urgence ?? defaultUrgence);
  const [deadline, setDeadline] = useState<string>(task?.deadline ?? '');
  const [done, setDone] = useState(task?.done ?? false);

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !categoryId) return;
    onSave({
      title: title.trim(),
      category_id: categoryId,
      importance,
      urgence,
      deadline: deadline || null,
      done,
      position: task?.position ?? 0,
    });
  };

  const PrioritySelector = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: PriorityLevel;
    onChange: (v: PriorityLevel) => void;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2">
        {([1, 2, 3] as PriorityLevel[]).map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border ${
              value === level
                ? level === 1
                  ? 'bg-green-100 border-green-400 text-green-800'
                  : level === 2
                  ? 'bg-amber-100 border-amber-400 text-amber-800'
                  : 'bg-red-100 border-red-400 text-red-800'
                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
            }`}
          >
            {PRIORITY_LABELS[level]}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {task ? 'Modifier la tâche' : 'Nouvelle tâche'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nom de la tâche..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              required
            >
              {['interne', 'mission'].map((macro) => {
                const cats = categories.filter((c) => c.macro === macro);
                if (cats.length === 0) return null;
                return (
                  <optgroup key={macro} label={macro === 'interne' ? 'Interne' : 'Mission'}>
                    {cats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          {/* Importance */}
          <PrioritySelector
            label="Importance"
            value={importance}
            onChange={setImportance}
          />

          {/* Urgence */}
          <PrioritySelector
            label="Urgence"
            value={urgence}
            onChange={setUrgence}
          />

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Statut si édition */}
          {task && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={done}
                onChange={(e) => setDone(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-500"
              />
              <span className="text-sm text-gray-700">Marquer comme terminée</span>
            </label>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {task && onDelete && (
              <button
                type="button"
                onClick={() => { onDelete(task.id); onClose(); }}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
              >
                Supprimer
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              {task ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
