-- RPC function to let users delete their own account.
-- Runs as security definer (superuser) so it can delete from auth.users.
-- All user data cascades automatically via foreign keys.
create or replace function public.delete_own_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

-- Allow authenticated users to call this function
grant execute on function public.delete_own_account() to authenticated;
