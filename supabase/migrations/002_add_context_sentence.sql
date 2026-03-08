-- Add context_sentence column to words table (VOCAB-07)
alter table public.words add column context_sentence text;

-- Add 'text' and 'topic' source types
alter table public.words drop constraint words_source_type_check;
alter table public.words add constraint words_source_type_check
  check (source_type in ('manual', 'photo', 'audio', 'conversation', 'text', 'topic'));
