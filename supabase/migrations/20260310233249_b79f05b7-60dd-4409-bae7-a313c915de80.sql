ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS purchase_price numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS commission_as3 numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS commission_external numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS commission_armor numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS commission_financing numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cost_repairs numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cost_detailing numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cost_documentation numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cost_other numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notes_internal text DEFAULT NULL;