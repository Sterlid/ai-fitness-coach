create extension if not exists pgcrypto;

create type public.goal_type as enum ('general_wellness', 'fat_loss', 'maintenance', 'muscle_gain', 'performance');
create type public.meal_source as enum ('photo', 'description', 'photo_and_description', 'manual');
create type public.recommendation_status as enum ('suggested', 'saved', 'accepted', 'dismissed');
create type public.workout_status as enum ('planned', 'in_progress', 'completed', 'skipped');
create type public.feedback_type as enum ('positive', 'negative', 'correction', 'skip', 'difficulty', 'pain');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  units_system text not null default 'metric' check (units_system in ('metric', 'imperial')),
  timezone text not null default 'UTC',
  birth_year integer check (birth_year between 1900 and extract(year from now())::integer),
  height_cm numeric(5,2) check (height_cm > 0),
  current_weight_kg numeric(6,2) check (current_weight_kg > 0),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_type public.goal_type not null,
  target_weight_kg numeric(6,2) check (target_weight_kg > 0),
  daily_calorie_target integer check (daily_calorie_target > 0),
  daily_protein_target_g numeric(6,2) check (daily_protein_target_g >= 0),
  starts_on date not null default current_date,
  ends_on date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);

create unique index one_active_goal_per_user on public.user_goals(user_id) where is_active;

create table public.food_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dietary_patterns text[] not null default '{}',
  allergies text[] not null default '{}',
  disliked_foods text[] not null default '{}',
  preferred_cuisines text[] not null default '{}',
  available_equipment text[] not null default '{}',
  workout_limitations text[] not null default '{}',
  training_experience text check (training_experience in ('beginner', 'intermediate', 'advanced')),
  preferred_workout_minutes integer check (preferred_workout_minutes between 5 and 240),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.daily_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_date date not null,
  calorie_target integer check (calorie_target > 0),
  protein_target_g numeric(6,2) check (protein_target_g >= 0),
  carbs_target_g numeric(6,2) check (carbs_target_g >= 0),
  fat_target_g numeric(6,2) check (fat_target_g >= 0),
  source text not null default 'system' check (source in ('system', 'user', 'coach')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, target_date)
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  eaten_at timestamptz not null default now(),
  name text,
  source public.meal_source not null,
  description text,
  image_path text,
  estimated_calories integer check (estimated_calories >= 0),
  protein_g numeric(7,2) check (protein_g >= 0),
  carbs_g numeric(7,2) check (carbs_g >= 0),
  fat_g numeric(7,2) check (fat_g >= 0),
  confidence_score integer check (confidence_score between 0 and 100),
  is_user_confirmed boolean not null default false,
  analysis_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index meals_user_eaten_at_idx on public.meals(user_id, eaten_at desc);

create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  name text not null,
  quantity numeric(8,2) check (quantity > 0),
  unit text,
  calories integer check (calories >= 0),
  protein_g numeric(7,2) check (protein_g >= 0),
  carbs_g numeric(7,2) check (carbs_g >= 0),
  fat_g numeric(7,2) check (fat_g >= 0),
  confidence_score integer check (confidence_score between 0 and 100),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meal_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recommended_for timestamptz not null default now(),
  title text not null,
  rationale text not null,
  estimated_calories integer check (estimated_calories >= 0),
  protein_g numeric(7,2) check (protein_g >= 0),
  ingredients jsonb not null default '[]'::jsonb,
  instructions jsonb not null default '[]'::jsonb,
  status public.recommendation_status not null default 'suggested',
  model_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index meal_recommendations_user_date_idx on public.meal_recommendations(user_id, recommended_for desc);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scheduled_for date not null default current_date,
  title text not null,
  rationale text,
  duration_minutes integer check (duration_minutes between 1 and 360),
  intensity text check (intensity in ('recovery', 'low', 'moderate', 'high')),
  equipment text[] not null default '{}',
  status public.workout_status not null default 'planned',
  perceived_difficulty integer check (perceived_difficulty between 1 and 10),
  soreness_notes text,
  pain_reported boolean not null default false,
  model_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workouts_user_date_idx on public.workouts(user_id, scheduled_for desc);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  name text not null,
  sets integer check (sets > 0),
  reps text,
  duration_seconds integer check (duration_seconds > 0),
  rest_seconds integer check (rest_seconds >= 0),
  instructions text,
  muscle_groups text[] not null default '{}',
  sort_order integer not null default 0,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  measured_at timestamptz not null default now(),
  weight_kg numeric(6,2) check (weight_kg > 0),
  body_fat_percent numeric(5,2) check (body_fat_percent between 0 and 100),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index body_measurements_user_date_idx on public.body_measurements(user_id, measured_at desc);

create table public.feedback_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type public.feedback_type not null,
  entity_type text not null,
  entity_id uuid,
  rating integer check (rating between 1 and 5),
  reason text,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index feedback_events_user_date_idx on public.feedback_events(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''));
  insert into public.food_preferences (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles', 'user_goals', 'food_preferences', 'daily_targets', 'meals',
    'meal_items', 'meal_recommendations', 'workouts', 'workout_exercises', 'body_measurements'
  ] loop
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.user_goals enable row level security;
alter table public.food_preferences enable row level security;
alter table public.daily_targets enable row level security;
alter table public.meals enable row level security;
alter table public.meal_items enable row level security;
alter table public.meal_recommendations enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.body_measurements enable row level security;
alter table public.feedback_events enable row level security;

create policy "Users manage their profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users manage their goals" on public.user_goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their preferences" on public.food_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their targets" on public.daily_targets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their meals" on public.meals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their meal recommendations" on public.meal_recommendations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their workouts" on public.workouts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their measurements" on public.body_measurements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their feedback" on public.feedback_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage items in their meals" on public.meal_items
  for all
  using (exists (select 1 from public.meals where meals.id = meal_items.meal_id and meals.user_id = auth.uid()))
  with check (exists (select 1 from public.meals where meals.id = meal_items.meal_id and meals.user_id = auth.uid()));

create policy "Users manage exercises in their workouts" on public.workout_exercises
  for all
  using (exists (select 1 from public.workouts where workouts.id = workout_exercises.workout_id and workouts.user_id = auth.uid()))
  with check (exists (select 1 from public.workouts where workouts.id = workout_exercises.workout_id and workouts.user_id = auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meal-images', 'meal-images', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Users read their meal images" on storage.objects for select
  using (bucket_id = 'meal-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users upload their meal images" on storage.objects for insert
  with check (bucket_id = 'meal-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users update their meal images" on storage.objects for update
  using (bucket_id = 'meal-images' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'meal-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete their meal images" on storage.objects for delete
  using (bucket_id = 'meal-images' and (storage.foldername(name))[1] = auth.uid()::text);

