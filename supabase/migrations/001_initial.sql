-- Profiles: extends auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  native_lang text not null default 'en',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Language Environments
create table public.language_environments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  target_lang text not null,
  is_active boolean not null default false,
  color text not null default '#007AFF',
  icon text not null default '🌍',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.language_environments enable row level security;

create policy "Users can view own environments"
  on public.language_environments for select using (auth.uid() = user_id);
create policy "Users can insert own environments"
  on public.language_environments for insert with check (auth.uid() = user_id);
create policy "Users can update own environments"
  on public.language_environments for update using (auth.uid() = user_id);
create policy "Users can delete own environments"
  on public.language_environments for delete using (auth.uid() = user_id);

-- Decks
create table public.decks (
  id uuid primary key default gen_random_uuid(),
  environment_id uuid references public.language_environments(id) on delete cascade not null,
  name text not null,
  color text not null default '#007AFF',
  icon text not null default '📚',
  word_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.decks enable row level security;

create policy "Users can view own decks"
  on public.decks for select using (
    exists (
      select 1 from public.language_environments
      where id = decks.environment_id and user_id = auth.uid()
    )
  );
create policy "Users can insert own decks"
  on public.decks for insert with check (
    exists (
      select 1 from public.language_environments
      where id = decks.environment_id and user_id = auth.uid()
    )
  );
create policy "Users can update own decks"
  on public.decks for update using (
    exists (
      select 1 from public.language_environments
      where id = decks.environment_id and user_id = auth.uid()
    )
  );
create policy "Users can delete own decks"
  on public.decks for delete using (
    exists (
      select 1 from public.language_environments
      where id = decks.environment_id and user_id = auth.uid()
    )
  );

-- Words
create table public.words (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid references public.decks(id) on delete cascade not null,
  word text not null,
  translation text not null,
  source_type text not null default 'manual' check (source_type in ('manual', 'photo', 'audio', 'conversation')),
  ease_factor real not null default 2.5,
  interval_days integer not null default 0,
  repetitions integer not null default 0,
  next_review_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.words enable row level security;

create policy "Users can view own words"
  on public.words for select using (
    exists (
      select 1 from public.decks d
      join public.language_environments e on d.environment_id = e.id
      where d.id = words.deck_id and e.user_id = auth.uid()
    )
  );
create policy "Users can insert own words"
  on public.words for insert with check (
    exists (
      select 1 from public.decks d
      join public.language_environments e on d.environment_id = e.id
      where d.id = words.deck_id and e.user_id = auth.uid()
    )
  );
create policy "Users can update own words"
  on public.words for update using (
    exists (
      select 1 from public.decks d
      join public.language_environments e on d.environment_id = e.id
      where d.id = words.deck_id and e.user_id = auth.uid()
    )
  );
create policy "Users can delete own words"
  on public.words for delete using (
    exists (
      select 1 from public.decks d
      join public.language_environments e on d.environment_id = e.id
      where d.id = words.deck_id and e.user_id = auth.uid()
    )
  );

-- Auto-update deck word_count
create or replace function public.update_deck_word_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.decks set word_count = word_count + 1, updated_at = now()
    where id = new.deck_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.decks set word_count = word_count - 1, updated_at = now()
    where id = old.deck_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_word_inserted
  after insert on public.words
  for each row execute function public.update_deck_word_count();

create trigger on_word_deleted
  after delete on public.words
  for each row execute function public.update_deck_word_count();

-- Training Sessions
create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  environment_id uuid references public.language_environments(id) on delete cascade not null,
  deck_id uuid references public.decks(id) on delete set null,
  mode text not null check (mode in ('flashcard', 'multiple_choice', 'typing')),
  correct integer not null default 0,
  incorrect integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.training_sessions enable row level security;

create policy "Users can view own sessions"
  on public.training_sessions for select using (
    exists (
      select 1 from public.language_environments
      where id = training_sessions.environment_id and user_id = auth.uid()
    )
  );
create policy "Users can insert own sessions"
  on public.training_sessions for insert with check (
    exists (
      select 1 from public.language_environments
      where id = training_sessions.environment_id and user_id = auth.uid()
    )
  );
create policy "Users can update own sessions"
  on public.training_sessions for update using (
    exists (
      select 1 from public.language_environments
      where id = training_sessions.environment_id and user_id = auth.uid()
    )
  );

-- Review Logs
create table public.review_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.training_sessions(id) on delete cascade not null,
  word_id uuid references public.words(id) on delete cascade not null,
  quality integer not null check (quality >= 0 and quality <= 5),
  was_correct boolean not null,
  created_at timestamptz not null default now()
);

alter table public.review_logs enable row level security;

create policy "Users can view own review logs"
  on public.review_logs for select using (
    exists (
      select 1 from public.training_sessions ts
      join public.language_environments e on ts.environment_id = e.id
      where ts.id = review_logs.session_id and e.user_id = auth.uid()
    )
  );
create policy "Users can insert own review logs"
  on public.review_logs for insert with check (
    exists (
      select 1 from public.training_sessions ts
      join public.language_environments e on ts.environment_id = e.id
      where ts.id = review_logs.session_id and e.user_id = auth.uid()
    )
  );

-- Indexes for performance
create index idx_environments_user on public.language_environments(user_id);
create index idx_decks_environment on public.decks(environment_id);
create index idx_words_deck on public.words(deck_id);
create index idx_words_next_review on public.words(next_review_at);
create index idx_sessions_environment on public.training_sessions(environment_id);
create index idx_review_logs_session on public.review_logs(session_id);
