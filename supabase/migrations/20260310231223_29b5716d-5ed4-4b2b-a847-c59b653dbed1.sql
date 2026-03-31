
-- Create storage bucket for vehicle photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-photos', 'vehicle-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create table to track vehicle images
CREATE TABLE IF NOT EXISTS public.vehicle_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  url text NOT NULL,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS policies for vehicle_images
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicle_images_authenticated_access"
ON public.vehicle_images
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Storage policies: allow authenticated users to manage vehicle photos
CREATE POLICY "vehicle_photos_select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'vehicle-photos');

CREATE POLICY "vehicle_photos_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehicle-photos');

CREATE POLICY "vehicle_photos_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vehicle-photos');

-- Public read access for vehicle photos (since bucket is public)
CREATE POLICY "vehicle_photos_public_read"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'vehicle-photos');
