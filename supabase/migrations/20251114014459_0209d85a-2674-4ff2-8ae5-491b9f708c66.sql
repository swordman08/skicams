-- Create storage bucket for webcam snapshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('webcam-snapshots', 'webcam-snapshots', true);

-- Create storage policies for webcam snapshots
CREATE POLICY "Anyone can view webcam snapshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'webcam-snapshots');

CREATE POLICY "Service role can upload webcam snapshots"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'webcam-snapshots');