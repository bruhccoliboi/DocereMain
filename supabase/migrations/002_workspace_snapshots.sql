-- Optional JSON snapshot sync for full workspace backup per user
create table if not exists workspace_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}',
  updated_at timestamptz default now()
);

alter table workspace_snapshots enable row level security;

create policy "Users own workspace snapshot" on workspace_snapshots
  for all using (auth.uid() = user_id);
