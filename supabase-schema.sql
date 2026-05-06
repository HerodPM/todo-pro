-- =============================================
-- Schéma Supabase pour todo-pro
-- À exécuter dans l'éditeur SQL de Supabase
-- =============================================

-- Table des catégories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  macro text not null check (macro in ('interne', 'mission')),
  color text not null default '#6366f1',
  created_at timestamp with time zone default now()
);

-- Table des tâches
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category_id uuid references categories(id) on delete cascade,
  importance int not null default 2 check (importance in (1, 2, 3)),
  urgence int not null default 2 check (urgence in (1, 2, 3)),
  deadline date,
  done boolean not null default false,
  position int not null default 0,
  created_at timestamp with time zone default now()
);

-- Désactiver RLS (accès public, pas d'auth)
alter table categories disable row level security;
alter table tasks disable row level security;

-- Index utiles
create index if not exists tasks_category_id_idx on tasks(category_id);
create index if not exists tasks_position_idx on tasks(position);
create index if not exists tasks_importance_urgence_idx on tasks(importance, urgence);

-- Données de démo (optionnel, à supprimer si vous voulez démarrer vide)
-- insert into categories (name, macro, color) values
--   ('Communication', 'interne', '#6366f1'),
--   ('RH', 'interne', '#8b5cf6'),
--   ('Client A', 'mission', '#f43f5e'),
--   ('Client B', 'mission', '#f97316');
