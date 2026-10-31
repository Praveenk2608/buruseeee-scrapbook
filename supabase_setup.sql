-- ==============================================================================
-- BURUSEEEE'S BIRTHDAY SURPRISE WEBSITE - SUPABASE SETUP SCRIPT
-- Paste this entire script into your Supabase project's SQL Editor and click RUN.
-- ==============================================================================

-- 1. Create Storage Bucket for Birthday Photos & Videos (Public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'birthday-media',
  'birthday-media',
  true,
  104857600, -- 100 MB max file size per video/photo
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600;

-- Storage Policies: Public can read all media
CREATE POLICY "Public Read Media"
ON storage.objects FOR SELECT
USING (bucket_id = 'birthday-media');

-- Storage Policies: Allow uploads into birthday-media
CREATE POLICY "Public Upload Media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'birthday-media');

-- Storage Policies: Allow delete from birthday-media
CREATE POLICY "Public Delete Media"
ON storage.objects FOR DELETE
USING (bucket_id = 'birthday-media');

-- Storage Policies: Allow update in birthday-media
CREATE POLICY "Public Update Media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'birthday-media');


-- 2. Create Table for Friends' Birthday Wishes Videos
CREATE TABLE IF NOT EXISTS public.birthday_wishes_videos (
  id TEXT PRIMARY KEY,
  friend_name TEXT NOT NULL,
  caption TEXT DEFAULT '',
  video_url TEXT NOT NULL,
  thumbnail_url TEXT DEFAULT '',
  duration NUMERIC DEFAULT 0,
  file_size NUMERIC DEFAULT 0,
  file_name TEXT DEFAULT '',
  file_type TEXT DEFAULT 'video/mp4',
  display_order NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.birthday_wishes_videos ENABLE ROW LEVEL SECURITY;

-- Everyone (visitors, Buruseeee) can view all wishes
CREATE POLICY "Anyone can view birthday wishes"
ON public.birthday_wishes_videos FOR SELECT
USING (true);

-- Anyone with anon key (gated by Admin PIN in the frontend) can insert wishes
CREATE POLICY "Allowed users can insert birthday wishes"
ON public.birthday_wishes_videos FOR INSERT
WITH CHECK (true);

-- Allowed users can update wishes
CREATE POLICY "Allowed users can update birthday wishes"
ON public.birthday_wishes_videos FOR UPDATE
USING (true);

-- Allowed users can delete wishes
CREATE POLICY "Allowed users can delete birthday wishes"
ON public.birthday_wishes_videos FOR DELETE
USING (true);


-- 3. Create Table for Cloud Photo Gallery Additions
CREATE TABLE IF NOT EXISTS public.birthday_gallery_photos (
  id TEXT PRIMARY KEY,
  photo_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  photo_date TEXT DEFAULT '',
  location TEXT DEFAULT '',
  rotation NUMERIC DEFAULT 0,
  tape_color TEXT DEFAULT 'pink',
  display_order NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS
ALTER TABLE public.birthday_gallery_photos ENABLE ROW LEVEL SECURITY;

-- Everyone can view gallery photos
CREATE POLICY "Anyone can view gallery photos"
ON public.birthday_gallery_photos FOR SELECT
USING (true);

-- Allowed users can insert gallery photos
CREATE POLICY "Allowed users can insert gallery photos"
ON public.birthday_gallery_photos FOR INSERT
WITH CHECK (true);

-- Allowed users can update gallery photos
CREATE POLICY "Allowed users can update gallery photos"
ON public.birthday_gallery_photos FOR UPDATE
USING (true);

-- Allowed users can delete gallery photos
CREATE POLICY "Allowed users can delete gallery photos"
ON public.birthday_gallery_photos FOR DELETE
USING (true);

-- Enable Realtime so newly uploaded photos and videos appear instantly for all visitors!
ALTER PUBLICATION supabase_realtime ADD TABLE public.birthday_wishes_videos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.birthday_gallery_photos;
