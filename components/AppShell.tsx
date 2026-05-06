'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task, Category, MacroCategory, PriorityLevel } from '@/lib/types';
import {
  fetchCategories,
  fetchTasks,
  createCategory,
  updateCategory,
  deleteCategory,
  createTask,
  updateTask,
  deleteTask,
  updateTaskPositions,
} from '@/lib/supabase';
import Sidebar from './Sidebar';
import ListView from './ListView';
import MatrixView from './MatrixView';
import TaskModal from './TaskModal';

type ViewMode = 'liste' | 'matrice';

interface NewTaskDefaults {
  categoryId?: string;
  importance?: PriorityLevel;
  urgence?: PriorityLevel;
}

export default function AppShell() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<ViewMode>('liste');
  const [activeFilter, setActiveFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskDefaults, setNewTaskDefaults] = useState<NewTaskDefaults>({});

  // ─── Load data ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [cats, tks] = await Promise.all([fetchCategories(), fetchTasks()]);
        setCategories(cats);
        setTasks(tks);
      } catch (e) {
        setError('Erreur de connexion à Supabase. Vérifie tes variables d\'environnement.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ─── Category CRUD ──────────────────────────────────────────────────────
  const handleAddCategory = async (name: string, macro: MacroCategory, color: string) => {
    try {
      const cat = await createCategory(name, macro, color);
      setCategories((prev) => [...prev, cat]);
    } catch (e) { console.error(e); }
  };

  const handleUpdateCategory = async (id: string, name: string, color: string) => {
    try {
      const cat = await updateCategory(id, { name, color });
      setCategories((prev) => prev.map((c) => (c.id === id ? cat : c)));
    } catch (e) { console.error(e); }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Supprimer cette catégorie ? Les tâches associées seront supprimées.')) return;
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setTasks((prev) => prev.filter((t) => t.category_id !== id));
      if (activeFilter === id) setActiveFilter('all');
    } catch (e) { console.error(e); }
  };

  // ─── Task CRUD ──────────────────────────────────────────────────────────
  const openNewTask = (categoryId?: string, importance?: PriorityLevel, urgence?: PriorityLevel) => {
    setEditingTask(null);
    setNewTaskDefaults({ categoryId, importance, urgence });
    setModalOpen(true);
  };

  const handleSaveTask = async (data: Omit<Task, 'id' | 'created_at'>) => {
    try {
      if (editingTask) {
        const updated = await updateTask(editingTask.id, data);
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? updated : t)));
      } else {
        const maxPos = tasks.filter((t) => t.category_id === data.category_id).length;
        const created = await createTask({ ...data, position: maxPos });
        setTasks((prev) => [...prev, created]);
      }
      setModalOpen(false);
      setEditingTask(null);
    } catch (e) { console.error(e); }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (e) { console.error(e); }
  };

  const handleToggleDone = async (id: string, done: boolean) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
    try {
      await updateTask(id, { done });
    } catch (e) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !done } : t)));
    }
  };

  // ─── Reorder / move tasks ───────────────────────────────────────────────
  const handleTasksReorder = useCallback(
    async (updatedTasks: Task[]) => {
      setTasks(updatedTasks);
      const changed = updatedTasks.filter((t) => {
        const original = tasks.find((o) => o.id === t.id);
        return original && (original.position !== t.position || original.category_id !== t.category_id);
      });
      if (changed.length === 0) return;
      try {
        await Promise.all(
          changed.map((t) =>
            updateTask(t.id, { position: t.position, category_id: t.category_id })
          )
        );
      } catch (e) { console.error(e); }
    },
    [tasks]
  );

  // ─── Matrix task update (importance + urgence) ──────────────────────────
  const handleMatrixTaskUpdate = async (
    id: string,
    importance: PriorityLevel,
    urgence: PriorityLevel
  ) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, importance, urgence } : t))
    );
    try {
      await updateTask(id, { importance, urgence });
    } catch (e) { console.error(e); }
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Chargement…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Connexion impossible</h2>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const activeTasks = tasks.filter((t) => !t.done);
  const totalFiltered = tasks.filter((t) => {
    if (activeFilter === 'all') return !t.done;
    const cat = categories.find((c) => c.id === t.category_id);
    if (!cat) return false;
    if (activeFilter === 'interne' || activeFilter === 'mission') return cat.macro === activeFilter && !t.done;
    return t.category_id === activeFilter && !t.done;
  }).length;

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        categories={categories}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4 flex-shrink-0">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setView('liste')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === 'liste' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Liste
            </button>
            <button
              onClick={() => setView('matrice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === 'matrice' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Matrice
            </button>
          </div>

          {/* Task count */}
          <span className="text-sm text-gray-400">
            {totalFiltered} tâche{totalFiltered !== 1 ? 's' : ''} en cours
          </span>

          <div className="flex-1" />

          {/* New task button */}
          <button
            onClick={() => openNewTask(
              categories.find((c) =>
                activeFilter !== 'all' && activeFilter !== 'interne' && activeFilter !== 'mission'
                  ? c.id === activeFilter
                  : false
              )?.id
            )}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle tâche
          </button>
        </header>

        {/* View */}
        {view === 'liste' ? (
          <ListView
            tasks={tasks}
            categories={categories}
            activeFilter={activeFilter}
            onTaskClick={(task) => { setEditingTask(task); setModalOpen(true); }}
            onToggleDone={handleToggleDone}
            onTasksReorder={handleTasksReorder}
            onAddTask={(categoryId) => openNewTask(categoryId)}
          />
        ) : (
          <MatrixView
            tasks={tasks}
            categories={categories}
            activeFilter={activeFilter}
            onTaskClick={(task) => { setEditingTask(task); setModalOpen(true); }}
            onToggleDone={handleToggleDone}
            onTaskUpdate={handleMatrixTaskUpdate}
            onAddTask={(importance, urgence) => openNewTask(undefined, importance, urgence)}
          />
        )}
      </div>

      {/* Task modal */}
      {modalOpen && (
        <TaskModal
          task={editingTask}
          categories={categories}
          defaultCategoryId={newTaskDefaults.categoryId}
          defaultImportance={newTaskDefaults.importance}
          defaultUrgence={newTaskDefaults.urgence}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          onClose={() => { setModalOpen(false); setEditingTask(null); }}
        />
      )}
    </div>
  );
}
