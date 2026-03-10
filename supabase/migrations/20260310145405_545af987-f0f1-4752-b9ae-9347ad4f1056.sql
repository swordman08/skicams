DROP POLICY IF EXISTS "Service role can upload webcam snapshots" ON storage.objects;

CREATE POLICY "Block public uploads to webcam-snapshots"
  ON storage.objects FOR INSERT
  WITH CHECK (false);