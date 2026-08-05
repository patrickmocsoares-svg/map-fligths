ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS mile_value_ref numeric NOT NULL DEFAULT 0.05;