
CREATE POLICY "Users read own scan images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'scans' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own scan images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'scans' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own scan images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'scans' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own scan images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'scans' AND auth.uid()::text = (storage.foldername(name))[1]);
