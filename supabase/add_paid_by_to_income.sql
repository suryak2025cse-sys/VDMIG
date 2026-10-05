-- Run this SQL in your Supabase Dashboard SQL Editor
-- This adds the 'paid_by' column to your existing 'income' table.

ALTER TABLE public.income ADD COLUMN IF NOT EXISTS paid_by TEXT;

-- Reload Supabase Schema Cache
NOTIFY pgrst, 'reload schema';
