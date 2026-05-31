-- Docere Supabase Schema
-- Run in Supabase SQL Editor after creating a project

create extension if not exists "uuid-ossp";

create table educator_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  educator_type text not null,
  custom_educator_type text,
  teaching_format text not null check (teaching_format in ('one-on-one', 'group', 'both')),
  onboarding_completed boolean default false,
  currency text default 'INR',
  learning_structure_labels jsonb default '{"items":"Learning items","categories":"Categories"}',
  created_at timestamptz default now()
);

create table learners (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  photo_url text,
  email text,
  phone text,
  goals text[] default '{}',
  notes text default '',
  start_date date,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table billing_profiles (
  id uuid primary key default uuid_generate_v4(),
  learner_id uuid references learners(id) on delete cascade not null unique,
  model text not null,
  fee_amount numeric not null default 0,
  currency text default 'INR',
  due_day_of_month int,
  payment_frequency text,
  payment_method text,
  notes text default '',
  package_sessions_total int,
  package_sessions_remaining int,
  package_expires_at timestamptz,
  custom_rules text,
  makeup_policy_student_miss text default 'makeup_required',
  makeup_policy_teacher_miss text default 'makeup_required',
  makeup_policy_custom text
);

create table learning_items (
  id uuid primary key default uuid_generate_v4(),
  learner_id uuid references learners(id) on delete cascade not null,
  title text not null,
  category text not null,
  status text default 'active',
  notes text default '',
  created_at timestamptz default now()
);

create table teaching_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  learner_id uuid references learners(id) on delete cascade not null,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text default 'scheduled',
  attendance text default 'scheduled',
  is_group boolean default false,
  recurring_rule_id uuid,
  rescheduled_from_id uuid references teaching_sessions(id),
  rescheduled_to_id uuid references teaching_sessions(id),
  location text,
  created_at timestamptz default now()
);

create table session_notes (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references teaching_sessions(id) on delete cascade not null,
  learner_id uuid references learners(id) on delete cascade not null,
  quick_note text default '',
  detailed_note text default '',
  voice_note_url text,
  voice_transcript text,
  summary text default '',
  progress text default '',
  homework text default '',
  next_session_focus text default '',
  created_at timestamptz default now()
);

create table payments (
  id uuid primary key default uuid_generate_v4(),
  learner_id uuid references learners(id) on delete cascade not null,
  amount numeric not null,
  currency text default 'INR',
  date timestamptz not null,
  method text not null,
  status text not null,
  notes text default '',
  created_at timestamptz default now()
);

create table makeup_obligations (
  id uuid primary key default uuid_generate_v4(),
  learner_id uuid references learners(id) on delete cascade not null,
  original_session_id uuid references teaching_sessions(id),
  replacement_session_id uuid references teaching_sessions(id),
  reason text not null,
  status text default 'owed',
  notes text default '',
  created_at timestamptz default now(),
  completed_at timestamptz
);

alter table educator_profiles enable row level security;
alter table learners enable row level security;
alter table billing_profiles enable row level security;
alter table learning_items enable row level security;
alter table teaching_sessions enable row level security;
alter table session_notes enable row level security;
alter table payments enable row level security;
alter table makeup_obligations enable row level security;

create policy "Users own educator profile" on educator_profiles
  for all using (auth.uid() = user_id);

create policy "Users own learners" on learners
  for all using (auth.uid() = user_id);

create policy "Users own sessions" on teaching_sessions
  for all using (auth.uid() = user_id);
