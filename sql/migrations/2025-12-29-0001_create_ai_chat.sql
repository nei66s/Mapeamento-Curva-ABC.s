-- Migration: Create tables to store AI chat conversations and messages
-- Run this in Supabase/Postgres. Requires `pgcrypto` or `gen_random_uuid()` available.

create extension if not exists "pgcrypto";

-- Conversations table: one per chat session
create table if not exists ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  profile_id text,
  title text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_conversations_user_id on ai_conversations(user_id);

-- Messages table: messages belonging to a conversation
create table if not exists ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  role text not null,
  content text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_messages_conversation_id on ai_messages(conversation_id);
create index if not exists idx_ai_messages_created_at on ai_messages(created_at);

-- Trigger to keep conversation.updated_at in sync
create or replace function ai_update_conversation_updated_at() returns trigger as $$
begin
  update ai_conversations set updated_at = now() where id = NEW.conversation_id;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_ai_messages_update_conversation on ai_messages;
create trigger trg_ai_messages_update_conversation
  after insert on ai_messages
  for each row
  execute procedure ai_update_conversation_updated_at();
