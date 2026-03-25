-- Tabla: selecciones_dia
-- Guarda qué meal eligió cada usuario por tipo de comida por día.
-- Una fila por (user_id, fecha, tipo). upsert con onConflict.

create table if not exists selecciones_dia (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  fecha      date not null,
  tipo       text not null,  -- desayuno | comida | cena | snack
  meal_id    uuid not null references meals(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, fecha, tipo)
);

-- RLS
alter table selecciones_dia enable row level security;

create policy "users manage own selecciones"
  on selecciones_dia for all
  using (auth.uid() = user_id);
