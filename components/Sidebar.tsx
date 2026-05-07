'use client';

import { useState } from 'react';
import { Category, MacroCategory, CATEGORY_COLORS, MACRO_LABELS } from '@/lib/types';

interface SidebarProps {
  categories: Category[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onAddCategory: (name: string, macro: MacroCategory, color: string) => void;
  onUpdateCategory: (id: string, name: string, color: string) => void;
  onDeleteCategory: (id: string) => void;
}

interface AddCategoryFormProps {
  macro: MacroCategory;
  onAdd: (name: string, color: string) => void;
  onCancel: () => void;
}

function AddCategoryForm({ macro, onAdd, onCancel }: AddCategoryFormProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(CATEGORY_COLORS[0]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) { onAdd(name.trim(), color); }
      }}
      className="mt-1 p-2 bg-gray-50 rounded-lg border border-gray-200"
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nom de la catégorie"
        className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 mb-2 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
      <div className="flex flex-wrap gap-1 mb-2">
        {CATEGORY_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={`w-5 h-5 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="flex gap-1">
        <button type="button" onClick={onCancel} className="flex-1 text-xs py-1 text-gray-500 hover:bg-gray-200 rounded">
          Annuler
        </button>
        <button type="submit" className="flex-1 text-xs py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          Ajouter
        </button>
      </div>
    </form>
  );
}

interface CategoryItemProps {
  category: Category;
  isActive: boolean;
  onSelect: () => void;
  onUpdate: (name: string, color: string) => void;
  onDelete: () => void;
}

function CategoryItem({ category, isActive, onSelect, onUpdate, onDelete }: CategoryItemProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [editColor, setEditColor] = useState(category.color);
  const [showMenu, setShowMenu] = useState(false);

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (editName.trim()) {
            onUpdate(editName.trim(), editColor);
            setEditing(false);
          }
        }}
        className="p-2 bg-gray-50 rounded-lg border border-gray-200 mt-0.5"
      >
        <input
          autoFocus
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 mb-2 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <div className="flex flex-wrap gap-1 mb-2">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setEditColor(c)}
              className={`w-4 h-4 rounded-full ${editColor === c ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={() => setEditing(false)} className="flex-1 text-xs py-1 text-gray-500 hover:bg-gray-200 rounded">Annuler</button>
          <button type="submit" className="flex-1 text-xs py-1 bg-indigo-600 text-white rounded">OK</button>
        </div>
      </form>
    );
  }

  return (
    <div
      className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
      }`}
      onClick={onSelect}
    >
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
      <span className="flex-1 text-sm truncate">{category.name}</span>
      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className="p-0.5 text-gray-400 hover:text-gray-700 rounded"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
        {showMenu && (
          <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-28 py-1">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); setEditing(true); }}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
            >
              Renommer
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(); }}
              className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
            >
              Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Sidebar({
  categories,
  activeFilter,
  onFilterChange,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: SidebarProps) {
  const [addingFor, setAddingFor] = useState<MacroCategory | null>(null);

  const macros: MacroCategory[] = ['interne', 'mission'];

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-sm">Tout doux</span>
        </div>
      </div>

      {/* Filtres globaux */}
      <div className="px-3 pt-4 pb-2 space-y-0.5">
        {[
          { id: 'all', label: 'Toutes les tâches', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => onFilterChange(item.id)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
              activeFilter === item.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            {item.label}
          </button>
        ))}
      </div>

      {/* Macro-catégories */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-4">
        {macros.map((macro) => {
          const cats = categories.filter((c) => c.macro === macro);
          return (
            <div key={macro}>
              <div className="flex items-center justify-between mb-1">
                <button
                  onClick={() => onFilterChange(macro)}
                  className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                    activeFilter === macro ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {MACRO_LABELS[macro]}
                </button>
                <button
                  onClick={() => setAddingFor(addingFor === macro ? null : macro)}
                  className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                  title="Ajouter une catégorie"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              <div className="space-y-0.5">
                {cats.map((cat) => (
                  <CategoryItem
                    key={cat.id}
                    category={cat}
                    isActive={activeFilter === cat.id}
                    onSelect={() => onFilterChange(cat.id)}
                    onUpdate={(name, color) => onUpdateCategory(cat.id, name, color)}
                    onDelete={() => onDeleteCategory(cat.id)}
                  />
                ))}
              </div>

              {addingFor === macro && (
                <AddCategoryForm
                  macro={macro}
                  onAdd={(name, color) => {
                    onAddCategory(name, macro, color);
                    setAddingFor(null);
                  }}
                  onCancel={() => setAddingFor(null)}
                />
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
