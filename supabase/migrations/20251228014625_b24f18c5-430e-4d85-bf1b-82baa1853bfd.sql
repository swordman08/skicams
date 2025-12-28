-- Create visitor_logs table for analytics
CREATE TABLE public.visitor_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  ip_partial TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  timezone TEXT,
  isp TEXT,
  browser TEXT,
  operating_system TEXT,
  device_type TEXT,
  screen_resolution TEXT,
  language TEXT,
  page_path TEXT NOT NULL,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert visitor logs (for tracking)
CREATE POLICY "Anyone can insert visitor logs"
ON public.visitor_logs
FOR INSERT
WITH CHECK (true);

-- Create index for querying by date
CREATE INDEX idx_visitor_logs_created_at ON public.visitor_logs(created_at DESC);

-- Create index for session grouping
CREATE INDEX idx_visitor_logs_session ON public.visitor_logs(session_id);