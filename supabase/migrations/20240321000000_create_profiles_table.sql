
-- Create a table for user profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  full_name text,
  username text unique,
  email_notifications boolean default true,
  marketing_emails boolean default true
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Create a policy that allows users to view their own profile
create policy "Users can view their own profile" 
  on profiles for select 
  using ( auth.uid() = id );

-- Create a policy that allows users to update their own profile
create policy "Users can update their own profile" 
  on profiles for update 
  using ( auth.uid() = id );

-- Create a trigger to create a profile when a user signs up
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email_notifications, marketing_emails)
  values (new.id, true, true);
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger that fires when a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
