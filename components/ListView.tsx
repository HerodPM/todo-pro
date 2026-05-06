'use client';

import { useState } from 'react';
import { Task, Category, MacroCategory } from '@/lib/types';
import { TaskCard, TaskCardOverlay } from './TaskCard';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';

interface ListViewProps {
  tasks: Task[];
  categories: Category[];
  activeFilter: string;
  onTaskClick: (task: Task) => void;
  onToggleDone: (id: string, done: boolean) => void;
  onTasksReorder: (tasks: Task[]) => void;
  onAddTask: (categoryId?: string) => void;
}

function CategoryColumn({
  category,
  tasks,
  allCategories,
  onTaskClick,
  onToggleDone,
  onAddTask,
}: {
  category: Category;
  tasks: Task[];
  allCategories: Category[];
  onTaskClick: (task: Task) => void;
  onToggleDone: (id: string, done: boolean) => void;
  onAddTask: (categoryId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `cat-${category.id}` });
  const doneTasks = tasks.filter((t) => t.done);
  const activeTasks = tasks.filter((t) => !t.done);

  return (
    <div className="flex flex-col min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color }} />
          <h3 className="font-semibold text-gray-700 text-sm">{category.name}</h3>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
            {activeTasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(category.id)}
          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="Ajouter une tâche"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-1.5 min-h-16 rounded-xl p-1 transition-colors ${
          isOver ? 'bg-indigo-50 ring-2 ring-indigo-200 ring-dashed' : ''
        }`}
      >
        <SortableContext
          items={activeTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {activeTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              category={allCategories.find((c) => c.id === task.category_id)}
              showCategory={false}
              onToggleDone={onToggleDone}
              onClick={onTaskClick}
            />
          ))}
        </SortableContext>

        {activeTasks.length === 0 && !isOver && (
          <div className="text-xs text-gray-300 text-center py-4">Aucune tâche</div>
        )}

        {/* Done tasks (collapsed) */}
        {doneTasks.length > 0 && (
          <details className="mt-2">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 px-1 py-1 select-none">
              {doneTasks.length} tâche{doneTasks.length > 1 ? 's' : ''} terminée{doneTasks.length > 1 ? 's' : ''}
            </summary>
            <div className="space-y-1.5 mt-1.5">
              {doneTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  category={allCategories.find((c) => c.id === task.category_id)}
                  showCategory={false}
                  onToggleDone={onToggleDone}
                  onClick={onTaskClick}
                />
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

export default function ListView({
  tasks,
  categories,
  activeFilter,
  onTaskClick,
  onToggleDone,
  onTasksReorder,
  onAddTask,
}: ListViewProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Filtered categories based on sidebar selection
  const filteredCategories = categories.filter((c) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'interne' || activeFilter === 'mission') return c.macro === activeFilter;
    return c.id === activeFilter;
  });

  // Group tasks by category
  const getTasksForCategory = (categoryId: string) =>
    tasks.filter((t) => t.category_id === categoryId).sort((a, b) => a.position - b.position);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Dropped on a category droppable
    if (String(over.id).startsWith('cat-')) {
      const newCategoryId = String(over.id).replace('cat-', '');
      if (activeTask.category_id !== newCategoryId) {
        const updated = tasks.map((t) =>
          t.id === activeTask.id ? { ...t, category_id: newCategoryId } : t
        );
        onTasksReorder(updated);
      }
      return;
    }

    // Dropped on another task (reorder)
    const overTask = tasks.find((t) => t.id === over.id);
    if (!overTask) return;

    if (activeTask.category_id === overTask.category_id) {
      // Same category — reorder
      const catTasks = tasks
        .filter((t) => t.category_id === activeTask.category_id)
        .sort((a, b) => a.position - b.position);
      const oldIndex = catTasks.findIndex((t) => t.id === active.id);
      const newIndex = catTasks.findIndex((t) => t.id === over.id);
      const reordered = arrayMove(catTasks, oldIndex, newIndex).map((t, i) => ({
        ...t,
        position: i,
      }));
      const updated = tasks.map((t) => reordered.find((r) => r.id === t.id) ?? t);
      onTasksReorder(updated);
    } else {
      // Different category — move task
      const updated = tasks.map((t) =>
        t.id === activeTask.id ? { ...t, category_id: overTask.category_id } : t
      );
      onTasksReorder(updated);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-y-auto p-6">
        {filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Aucune catégorie — crée-en une dans la barre latérale.</p>
          </div>
        ) : (
          <div
            className="grid gap-5"
            style={{
              gridTemplateColumns: `repeat(${Math.min(filteredCategories.length, 4)}, minmax(200px, 1fr))`,
            }}
          >
            {filteredCategories.map((category) => (
              <CategoryColumn
                key={category.id}
                category={category}
                tasks={getTasksForCategory(category.id)}
                allCategories={categories}
                onTaskClick={onTaskClick}
                onToggleDone={onToggleDone}
                onAddTask={onAddTask}
              />
            ))}
          </div>
        )}
      </div>

      <DragOverlay>
        {activeTask && (
          <TaskCardOverlay
            task={activeTask}
            category={categories.find((c) => c.id === activeTask.category_id)}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
