-- create vector extension for future semantic search
create extension if not exists vector;

create table volunteers (
  id uuid primary key default uuid_generate_v4(),
  full_name text,
  cpf text,
  religion text,
  marital_status text,
  street text,
  number text,
  complement text,
  district text,
  city text,
  state text,
  cep text,
  hours_per_week int,
  days text[],
  specialties text[],
  about text,
  created_at timestamp default now()
);
