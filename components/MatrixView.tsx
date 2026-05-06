'use client';

import { useState } from 'react';
import { Task, Category, PriorityLevel, PRIORITY_LABELS } from '@/lib/types';
import { TaskCardOverlay } from './TaskCard';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCenter,
} from '@dnd-kit/core';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// ─── Matrix cell key ────────────────────────────────────────────────────────
const cellKey = (imp: PriorityLevel, urg: PriorityLevel) => `${imp}-${urg}`;

// ─── Draggable task mini-card ────────────────────────────────────────────────
function MatrixTaskCard({
  task,
  category,
  onToggleDone,
  onClick,
}: {
  task: Task;
  category?: Category;
  onToggleDone: (id: string, done: boolean) => void;
  onClick: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  const isOverdue =
    task.deadline && !task.done && isPast(parseISO(task.deadline)) && !isToday(parseISO(task.deadline));
  const isDueToday = task.deadline && isToday(parseISO(task.deadline));

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      className={`group bg-white rounded-lg px-2 py-1.5 shadow-sm border transition-all cursor-pointer select-none text-xs ${
        task.done ? 'opacity-50' : 'hover:shadow-md hover:border-indigo-200 border-gray-100'
      }`}
      onClick={() => onClick(task)}
    >
      <div className="flex items-start gap-1.5">
        {/* Drag handle */}
        <button
          {...listeners}
          {...attributes}
          className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </button>

        <input
          type="checkbox"
          checked={task.done}
          onChange={(e) => { e.stopPropagation(); onToggleDone(task.id, e.target.checked); }}
          className="mt-0.5 w-3 h-3 rounded accent-indigo-500 flex-shrink-0 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        />

        <div className="flex-1 min-w-0">
          <p className={`font-medium leading-tight text-gray-800 ${task.done ? 'line-through text-gray-400' : ''}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {category && (
              <span
                className="px-1 py-0.5 rounded text-white font-medium"
                style={{ backgroundColor: category.color, fontSize: '10px' }}
              >
                {category.name}
              </span>
            )}
            {task.deadline && (
              <span className={`flex items-center gap-0.5 ${isOverdue ? 'text-red-500 font-semibold' : isDueToday ? 'text-amber-500 font-semibold' : 'text-gray-400'}`} style={{ fontSize: '10px' }}>
                {format(parseISO(task.deadline), 'd MMM', { locale: fr })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Matrix cell ─────────────────────────────────────────────────────────────
function MatrixCell({
  importance,
  urgence,
  tasks,
  categories,
  onToggleDone,
  onClick,
  onAddTask,
}: {
  importance: PriorityLevel;
  urgence: PriorityLevel;
  tasks: Task[];
  categories: Category[];
  onToggleDone: (id: string, done: boolean) => void;
  onClick: (task: Task) => void;
  onAddTask: (imp: PriorityLevel, urg: PriorityLevel) => void;
}) {
  const id = cellKey(importance, urgence);
  const { isOver, setNodeRef } = useDroppable({ id });

  const activeTasks = tasks.filter((t) => !t.done);
  const doneTasks = tasks.filter((t) => t.done);

  // Cell color based on importance+urgence
  const getBgColor = () => {
    const score = importance + urgence;
    if (score >= 5) return 'bg-red-50 border-red-200';
    if (score === 4) return 'bg-amber-50 border-amber-200';
    if (score === 3) return 'bg-yellow-50 border-yellow-100';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div
      ref={setNodeRef}
      className={`relative rounded-xl border-2 p-2 min-h-28 transition-all ${getBgColor()} ${
        isOver ? 'ring-2 ring-indigo-400 ring-offset-1 scale-[1.01]' : ''
      }`}
    >
      {/* Add task button */}
      <button
        onClick={() => onAddTask(importance, urgence)}
        className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-white rounded transition-colors opacity-0 group-hover:opacity-100"
        style={{ opacity: undefined }}
        title="Ajouter une tâche"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <div className="space-y-1">
        {activeTasks.map((task) => (
          <MatrixTaskCard
            key={task.id}
            task={task}
            category={categories.find((c) => c.id === task.category_id)}
            onToggleDone={onToggleDone}
            onClick={onClick}
          />
        ))}
        {doneTasks.length > 0 && (
          <details>
            <summary className="text-gray-400 cursor-pointer select-none" style={{ fontSize: '10px' }}>
              {doneTasks.length} terminée{doneTasks.length > 1 ? 's' : ''}
            </summary>
            <div className="space-y-1 mt-1">
              {doneTasks.map((task) => (
                <MatrixTaskCard
                  key={task.id}
                  task={task}
                  category={categories.find((c) => c.id === task.category_id)}
                  onToggleDone={onToggleDone}
                  onClick={onClick}
                />
              ))}
            </div>
          </details>
        )}
        {tasks.length === 0 && (
          <p className="text-center text-gray-300 py-2" style={{ fontSize: '11px' }}>
            Déposer ici
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Matrix View ─────────────────────────────────────────────────────────
interface MatrixViewProps {
  tasks: Task[];
  categories: Category[];
  activeFilter: string;
  onTaskClick: (task: Task) => void;
  onToggleDone: (id: string, done: boolean) => void;
  onTaskUpdate: (id: string, importance: PriorityLevel, urgence: PriorityLevel) => void;
  onAddTask: (importance: PriorityLevel, urgence: PriorityLevel) => void;
}

const IMPORTANCE_LEVELS: PriorityLevel[] = [3, 2, 1];
const URGENCE_LEVELS: PriorityLevel[] = [1, 2, 3];

const impColors: Record<PriorityLevel, string> = {
  3: 'text-red-600 bg-red-50',
  2: 'text-amber-600 bg-amber-50',
  1: 'text-green-600 bg-green-50',
};
const urgColors: Record<PriorityLevel, string> = {
  1: 'text-green-600 bg-green-50',
  2: 'text-amber-600 bg-amber-50',
  3: 'text-red-600 bg-red-50',
};

export default function MatrixView({
  tasks,
  categories,
  activeFilter,
  onTaskClick,
  onToggleDone,
  onTaskUpdate,
  onAddTask,
}: MatrixViewProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Filter tasks based on sidebar selection
  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === 'all') return true;
    const cat = categories.find((c) => c.id === t.category_id);
    if (!cat) return false;
    if (activeFilter === 'interne' || activeFilter === 'mission') return cat.macro === activeFilter;
    return t.category_id === activeFilter;
  });

  const getTasksForCell = (imp: PriorityLevel, urg: PriorityLevel) =>
    filteredTasks.filter((t) => t.importance === imp && t.urgence === urg);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const overId = String(over.id);
    if (!overId.includes('-')) return;

    const [impStr, urgStr] = overId.split('-');
    const newImportance = parseInt(impStr) as PriorityLevel;
    const newUrgence = parseInt(urgStr) as PriorityLevel;

    const task = tasks.find((t) => t.id === active.id);
    if (!task) return;
    if (task.importance === newImportance && task.urgence === newUrgence) return;

    onTaskUpdate(String(active.id), newImportance, newUrgence);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-auto p-6">
        <div className="min-w-[700px]">
          {/* Column headers — Urgence */}
          <div className="flex mb-2">
            <div className="w-24 flex-shrink-0" />
            <div className="flex-1 flex items-center justify-center mb-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">→ Urgence</span>
            </div>
          </div>

          <div className="flex gap-2 mb-2">
            <div className="w-24 flex-shrink-0" />
            {URGENCE_LEVELS.map((urg) => (
              <div key={urg} className="flex-1 text-center">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${urgColors[urg]}`}>
                  {PRIORITY_LABELS[urg]}
                </span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {IMPORTANCE_LEVELS.map((imp, rowIdx) => (
            <div key={imp} className="flex gap-2 mb-2 group">
              {/* Row label — Importance */}
              <div className="w-24 flex-shrink-0 flex items-center justify-end pr-2">
                {rowIdx === 0 && (
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider absolute -translate-x-1 -rotate-90 whitespace-nowrap" style={{ writingMode: 'initial' }}>
                  </span>
                )}
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${impColors[imp]}`}>
                  {PRIORITY_LABELS[imp]}
                </span>
              </div>

              {/* Cells */}
              {URGENCE_LEVELS.map((urg) => (
                <div key={urg} className="flex-1 group">
                  <MatrixCell
                    importance={imp}
                    urgence={urg}
                    tasks={getTasksForCell(imp, urg)}
                    categories={categories}
                    onToggleDone={onToggleDone}
                    onClick={onTaskClick}
                    onAddTask={onAddTask}
                  />
                </div>
              ))}
            </div>
          ))}

          {/* Y axis label */}
          <div className="flex mt-1">
            <div className="w-24 flex-shrink-0 flex justify-end pr-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">↑ Importance</span>
            </div>
          </div>
        </div>
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
