create table if not exists clash_notes (
  id serial primary key,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);
