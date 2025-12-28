-- Remove the overly permissive insert policy and add more restrictive ones
DROP POLICY IF EXISTS "Anyone can insert visitor logs" ON public.visitor_logs;

-- Allow inserts but with basic validation (session_id and page_path required)
CREATE POLICY "Allow visitor tracking inserts"
ON public.visitor_logs
FOR INSERT
WITH CHECK (
  session_id IS NOT NULL 
  AND page_path IS NOT NULL 
  AND length(session_id) <= 100
  AND length(page_path) <= 500
);

-- No SELECT policy means no one can read via the API (only service role/admin can access directly)
-- This protects visitor privacy while still allowing data collection