
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-recordings', 'audio-recordings', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload audio" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'audio-recordings');

CREATE POLICY "Anyone can read audio" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'audio-recordings');
