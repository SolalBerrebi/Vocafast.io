-- Notification preferences per user
create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,

  -- Master toggle
  notifications_enabled boolean not null default true,

  -- Daily goal
  daily_goal_enabled boolean not null default true,
  daily_goal_words integer not null default 20,
  daily_goal_sessions integer not null default 1,

  -- Reminder schedule
  reminder_enabled boolean not null default true,
  reminder_time time not null default '09:00',
  reminder_days boolean[] not null default '{true,true,true,true,true,true,true}', -- Mon-Sun

  -- Streak reminders
  streak_reminder_enabled boolean not null default true,
  streak_reminder_time time not null default '20:00',

  -- Review due notifications
  review_due_enabled boolean not null default true,

  -- Achievement notifications
  achievements_enabled boolean not null default true,

  -- Inactivity nudge (days before nudge)
  inactivity_nudge_enabled boolean not null default true,
  inactivity_nudge_days integer not null default 3,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "Users can view own notification preferences"
  on public.notification_preferences for select using (auth.uid() = user_id);
create policy "Users can insert own notification preferences"
  on public.notification_preferences for insert with check (auth.uid() = user_id);
create policy "Users can update own notification preferences"
  on public.notification_preferences for update using (auth.uid() = user_id);

-- Auto-create default preferences on signup (extend existing trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');

  insert into public.notification_preferences (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;
