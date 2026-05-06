'use client';

import { Task, Category, PriorityLevel } from '@/lib/types';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskCardProps {
  task: Task;
  category?: Category;
  showCategory?: boolean;
  onToggleDone: (id: string, done: boolean) => void;
  onClick: (task: Task) => void;
  isDragging?: boolean;
}

const priorityDot: Record<PriorityLevel, string> = {
  1: 'bg-green-400',
  2: 'bg-amber-400',
  3: 'bg-red-500',
};

export function TaskCard({
  task,
  category,
  showCategory = false,
  onToggleDone,
  onClick,
  isDragging = false,
}: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  const isOverdue =
    task.deadline && !task.done && isPast(parseISO(task.deadline)) && !isToday(parseISO(task.deadline));
  const isDueToday = task.deadline && isToday(parseISO(task.deadline));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white border rounded-xl px-3 py-2.5 shadow-sm hover:shadow-md transition-all cursor-pointer select-none ${
        task.done ? 'opacity-50' : ''
      } ${isDragging ? 'shadow-xl ring-2 ring-indigo-300 rotate-1' : 'border-gray-100 hover:border-indigo-200'}`}
      onClick={() => onClick(task)}
      {...attributes}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <div
          {...listeners}
          className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </div>

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={task.done}
          onChange={(e) => {
            e.stopPropagation();
            onToggleDone(task.id, e.target.checked);
          }}
          className="mt-0.5 w-3.5 h-3.5 rounded accent-indigo-500 flex-shrink-0 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium text-gray-800 leading-tight ${task.done ? 'line-through text-gray-400' : ''}`}>
            {task.title}
          </p>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* Category badge */}
            {showCategory && category && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-medium text-white"
                style={{ backgroundColor: category.color }}
              >
                {category.name}
              </span>
            )}

            {/* Deadline */}
            {task.deadline && (
              <span
                className={`text-xs flex items-center gap-1 ${
                  isOverdue
                    ? 'text-red-600 font-semibold'
                    : isDueToday
                    ? 'text-amber-600 font-semibold'
                    : 'text-gray-400'
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {format(parseISO(task.deadline), 'd MMM', { locale: fr })}
              </span>
            )}
          </div>
        </div>

        {/* Priority indicators */}
        <div className="flex flex-col gap-1 items-center flex-shrink-0" title={`Importance: ${task.importance} · Urgence: ${task.urgence}`}>
          <div className={`w-2 h-2 rounded-full ${priorityDot[task.importance]}`} title={`Importance: ${task.importance}`} />
          <div className={`w-2 h-2 rounded-full ${priorityDot[task.urgence]}`} title={`Urgence: ${task.urgence}`} />
        </div>
      </div>
    </div>
  );
}

// Overlay card shown while dragging
export function TaskCardOverlay({ task, category }: { task: Task; category?: Category }) {
  const isOverdue =
    task.deadline && !task.done && isPast(parseISO(task.deadline)) && !isToday(parseISO(task.deadline));

  return (
    <div className="bg-white border border-indigo-300 rounded-xl px-3 py-2.5 shadow-2xl ring-2 ring-indigo-300 rotate-2 cursor-grabbing">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 text-gray-300">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 leading-tight">{task.title}</p>
          {category && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-medium text-white mt-1 inline-block"
              style={{ backgroundColor: category.color }}
            >
              {category.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
