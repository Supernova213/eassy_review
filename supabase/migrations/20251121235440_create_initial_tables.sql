-- Create daily_usage table to track user's daily API calls
CREATE TABLE public.daily_usage (
    id bigserial primary key,
    user_id uuid references auth.users(id) not null,
    usage_count integer default 1 not null,
    last_used_at timestamptz default now() not null
);

-- Create essay_reviews table to store interaction history
CREATE TABLE public.essay_reviews (
    id bigserial primary key,
    user_id uuid references auth.users(id) not null,
    original_text text,
    ai_question text,
    user_answer text,
    ai_feedback text,
    created_at timestamptz default now() not null
);

-- Enable Row Level Security for both tables
alter table public.daily_usage enable row level security;
alter table public.essay_reviews enable row level security;

-- Create policies for RLS
-- Users can see their own usage and reviews
create policy "Enable read access for own user" on public.daily_usage for select using (auth.uid() = user_id);
create policy "Enable read access for own user" on public.essay_reviews for select using (auth.uid() = user_id);

-- Users can insert their own usage and reviews
create policy "Enable insert for own user" on public.daily_usage for insert with check (auth.uid() = user_id);
create policy "Enable insert for own user" on public.essay_reviews for insert with check (auth.uid() = user_id);

-- Users can update their own usage
create policy "Enable update for own user" on public.daily_usage for update using (auth.uid() = user_id);
