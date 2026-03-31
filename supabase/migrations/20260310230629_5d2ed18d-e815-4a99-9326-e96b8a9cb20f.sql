
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS version text,
  ADD COLUMN IF NOT EXISTS condition text,
  ADD COLUMN IF NOT EXISTS engine text,
  ADD COLUMN IF NOT EXISTS power text,
  ADD COLUMN IF NOT EXISTS leather_seats boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sunroof boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS electric_trunk boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS fuel text,
  ADD COLUMN IF NOT EXISTS armored boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS armor_type text,
  ADD COLUMN IF NOT EXISTS armor_company text,
  ADD COLUMN IF NOT EXISTS glass_brand text;
