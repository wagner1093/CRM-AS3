-- Migration: Add media_url and media_type fields to messages

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS media_type text;
