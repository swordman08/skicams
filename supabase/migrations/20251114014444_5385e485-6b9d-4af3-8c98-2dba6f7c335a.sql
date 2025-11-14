-- Create resorts table
CREATE TABLE public.resorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  location TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create cameras table
CREATE TABLE public.cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resort_id UUID NOT NULL REFERENCES public.resorts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  elevation_ft INTEGER,
  source_type TEXT NOT NULL, -- 'roundshot', 'verkada', 'direct'
  source_url TEXT NOT NULL,
  source_metadata JSONB DEFAULT '{}'::jsonb,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(resort_id, slug)
);

-- Create snapshots table
CREATE TABLE public.snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID NOT NULL REFERENCES public.cameras(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL,
  time_slot TEXT NOT NULL, -- '7:30 AM', '10:30 AM', '1:30 PM', '4:00 PM'
  file_size_bytes BIGINT,
  weather_conditions TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_snapshots_camera_id ON public.snapshots(camera_id);
CREATE INDEX idx_snapshots_captured_at ON public.snapshots(captured_at DESC);
CREATE INDEX idx_snapshots_time_slot ON public.snapshots(time_slot);
CREATE INDEX idx_cameras_resort_id ON public.cameras(resort_id);

-- Enable Row Level Security
ALTER TABLE public.resorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies (public read access since this is a public webcam viewer)
CREATE POLICY "Anyone can view resorts"
  ON public.resorts FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view cameras"
  ON public.cameras FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view snapshots"
  ON public.snapshots FOR SELECT
  USING (true);

-- Insert Crystal Mountain resort
INSERT INTO public.resorts (name, slug, location, website_url)
VALUES (
  'Crystal Mountain Washington',
  'crystal-mountain-wa',
  'Washington',
  'https://www.crystalmountainresort.com'
);

-- Insert cameras for Crystal Mountain
WITH resort AS (
  SELECT id FROM public.resorts WHERE slug = 'crystal-mountain-wa' LIMIT 1
)
INSERT INTO public.cameras (resort_id, name, slug, description, elevation_ft, source_type, source_url, display_order)
SELECT 
  resort.id,
  'Summit Cam',
  'summit-cam',
  'Top of Mt. Rainier Gondola',
  6872,
  'roundshot',
  'https://backend.roundshot.com/cams/c2f78ac81cb0409e225110379c74582f/default',
  1
FROM resort
UNION ALL
SELECT 
  resort.id,
  'Snow Stake',
  'snow-stake',
  'Mid-mountain snow stake (cleared daily before 4pm)',
  NULL,
  'verkada',
  'https://command.verkada.com/embed.html',
  2
FROM resort
UNION ALL
SELECT 
  resort.id,
  'Gold Hills',
  'gold-hills',
  'Top of Gold Hills Chair',
  5044,
  'verkada',
  'https://command.verkada.com/embed.html',
  3
FROM resort
UNION ALL
SELECT 
  resort.id,
  'Northway Lift Cam',
  'northway-lift-cam',
  'Top of Northway chairlift, facing south towards Snorting Elk bowl',
  6776,
  'verkada',
  'https://command.verkada.com/embed.html',
  4
FROM resort;