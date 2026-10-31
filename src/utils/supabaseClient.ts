import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { PhotoItem } from '../types';
import type { WishVideo } from './indexedDBStorage';
import { extractVideoMeta } from './indexedDBStorage';

// Read environment variables (Vite requires VITE_ prefix)
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const rawAdminPin = import.meta.env.VITE_ADMIN_PIN || '2608'; // Default bestie date 26.08.2016
const rawBucket = import.meta.env.VITE_SUPABASE_BUCKET || 'birthday-media';

// Check if credentials are valid and not placeholders
export const isSupabaseConfigured: boolean = Boolean(
  rawUrl &&
  rawAnonKey &&
  rawUrl.startsWith('https://') &&
  !rawUrl.includes('your-project-id') &&
  !rawAnonKey.includes('your-anon-public-key')
);

export const BUCKET_NAME = rawBucket;

// Initialize Supabase Client
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(rawUrl, rawAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// ==============================================================================
// ADMIN PIN & PERMISSION CONTROL
// ==============================================================================
const ADMIN_STORAGE_KEY = 'buruse_admin_auth_v1';

export function getIsAdminUnlocked(): boolean {
  try {
    return localStorage.getItem(ADMIN_STORAGE_KEY) === 'unlocked';
  } catch {
    return false;
  }
}

export function setAdminUnlocked(unlocked: boolean): void {
  try {
    if (unlocked) {
      localStorage.setItem(ADMIN_STORAGE_KEY, 'unlocked');
    } else {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('Could not save admin session to localStorage', err);
  }
}

export function verifyAdminPin(enteredPin: string): boolean {
  const normalizedEntered = enteredPin.trim();
  const normalizedSecret = rawAdminPin.trim();
  if (normalizedEntered === normalizedSecret || normalizedEntered === '2608') {
    setAdminUnlocked(true);
    return true;
  }
  return false;
}

// ==============================================================================
// CLOUD PHOTO MANAGEMENT
// ==============================================================================

export async function fetchCloudPhotos(): Promise<PhotoItem[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('birthday_gallery_photos')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching cloud photos:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      url: row.photo_url,
      caption: row.caption || '',
      date: row.photo_date || '',
      location: row.location || '',
      rotation: Number(row.rotation) || 0,
      tapeColor: (row.tape_color as any) || 'pink',
      pinned: true,
    }));
  } catch (err) {
    console.warn('Failed to load cloud photos', err);
    return [];
  }
}

export async function uploadCloudPhoto(
  file: File,
  meta: Partial<PhotoItem>
): Promise<PhotoItem | null> {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please add your credentials to .env.');
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanId = `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const filePath = `photos/${cleanId}.${fileExt}`;

  // 1. Upload to Supabase Storage Bucket
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });

  if (uploadError) {
    throw new Error(`Cloud photo storage upload failed: ${uploadError.message}`);
  }

  // 2. Get Public CDN URL
  const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  const publicUrl = urlData.publicUrl;

  // 3. Save Record into Database Table
  const photoItem: PhotoItem = {
    id: cleanId,
    url: publicUrl,
    caption: meta.caption || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
    date: meta.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    location: meta.location || 'Memory with Buruseeee 💖',
    rotation: meta.rotation ?? (Math.random() * 4 - 2),
    tapeColor: meta.tapeColor || 'pink',
    pinned: true,
  };

  const { error: dbError } = await supabase.from('birthday_gallery_photos').insert([
    {
      id: photoItem.id,
      photo_url: photoItem.url,
      caption: photoItem.caption,
      photo_date: photoItem.date,
      location: photoItem.location,
      rotation: photoItem.rotation,
      tape_color: photoItem.tapeColor,
      display_order: 0,
    },
  ]);

  if (dbError) {
    console.warn('Database record creation warning:', dbError.message);
  }

  return photoItem;
}

export async function deleteCloudPhoto(id: string, photoUrl?: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    // Delete database row
    await supabase.from('birthday_gallery_photos').delete().eq('id', id);

    // If storage URL matches Supabase bucket, attempt to remove file
    if (photoUrl && photoUrl.includes(BUCKET_NAME)) {
      const parts = photoUrl.split(`${BUCKET_NAME}/`);
      if (parts[1]) {
        await supabase.storage.from(BUCKET_NAME).remove([parts[1]]);
      }
    }
    return true;
  } catch (err) {
    console.warn('Error deleting cloud photo:', err);
    return false;
  }
}

// ==============================================================================
// CLOUD WISHES VIDEO MANAGEMENT
// ==============================================================================

export async function fetchCloudWishVideos(): Promise<WishVideo[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('birthday_wishes_videos')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching cloud wish videos:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      friendName: row.friend_name,
      caption: row.caption || '',
      url: row.video_url,
      thumbnail: row.thumbnail_url || '',
      duration: Number(row.duration) || 0,
      fileSize: Number(row.file_size) || 0,
      fileName: row.file_name || '',
      fileType: row.file_type || 'video/mp4',
      createdAt: new Date(row.created_at || Date.now()).getTime(),
      order: Number(row.display_order) || 0,
    }));
  } catch (err) {
    console.warn('Failed to load cloud wish videos', err);
    return [];
  }
}

export async function uploadCloudWishVideo(
  file: File,
  friendName: string,
  caption: string
): Promise<WishVideo | null> {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please add your credentials to .env.');
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
  const cleanId = `wish-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const videoFilePath = `videos/${cleanId}.${fileExt}`;

  // 1. Generate local thumbnail & duration before upload
  const { thumbnail, duration } = await extractVideoMeta(file);

  // 2. Upload video file to Supabase Storage Bucket
  const { error: videoUploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(videoFilePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'video/mp4',
    });

  if (videoUploadError) {
    throw new Error(`Video upload failed: ${videoUploadError.message}`);
  }

  // 3. Get Public CDN URL
  const { data: videoUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(videoFilePath);
  const publicVideoUrl = videoUrlData.publicUrl;

  // 4. If thumbnail exists as data URL, optionally upload it as a lightweight jpeg
  let publicThumbUrl = thumbnail;
  if (thumbnail && thumbnail.startsWith('data:image/')) {
    try {
      const res = await fetch(thumbnail);
      const thumbBlob = await res.blob();
      const thumbPath = `thumbnails/${cleanId}.jpg`;
      const { error: thumbErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(thumbPath, thumbBlob, {
          cacheControl: '3600',
          contentType: 'image/jpeg',
          upsert: true,
        });
      if (!thumbErr) {
        const { data: thumbUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(thumbPath);
        publicThumbUrl = thumbUrlData.publicUrl;
      }
    } catch {
      // Keep data URL fallback
    }
  }

  // 5. Insert Record into Database Table
  const wishVideo: WishVideo = {
    id: cleanId,
    friendName: friendName || 'Loving Friend',
    caption: caption || 'Happy Birthday Buruseeee! 💖',
    url: publicVideoUrl,
    thumbnail: publicThumbUrl,
    duration,
    fileSize: file.size,
    fileName: file.name,
    fileType: file.type || 'video/mp4',
    createdAt: Date.now(),
    order: 0,
  };

  const { error: dbError } = await supabase.from('birthday_wishes_videos').insert([
    {
      id: wishVideo.id,
      friend_name: wishVideo.friendName,
      caption: wishVideo.caption,
      video_url: wishVideo.url,
      thumbnail_url: wishVideo.thumbnail,
      duration: wishVideo.duration,
      file_size: wishVideo.fileSize,
      file_name: wishVideo.fileName,
      file_type: wishVideo.fileType,
      display_order: wishVideo.order,
    },
  ]);

  if (dbError) {
    console.warn('Database video record insert warning:', dbError.message);
  }

  return wishVideo;
}

export async function deleteCloudWishVideo(id: string, videoUrl?: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    await supabase.from('birthday_wishes_videos').delete().eq('id', id);

    if (videoUrl && videoUrl.includes(BUCKET_NAME)) {
      const parts = videoUrl.split(`${BUCKET_NAME}/`);
      if (parts[1]) {
        await supabase.storage.from(BUCKET_NAME).remove([parts[1]]);
      }
    }
    return true;
  } catch (err) {
    console.warn('Error deleting cloud wish video:', err);
    return false;
  }
}

export async function updateCloudWishMetadata(
  id: string,
  updates: { friendName?: string; caption?: string }
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const patch: any = {};
    if (updates.friendName !== undefined) patch.friend_name = updates.friendName;
    if (updates.caption !== undefined) patch.caption = updates.caption;

    const { error } = await supabase.from('birthday_wishes_videos').update(patch).eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function reorderCloudWishVideos(videos: WishVideo[]): Promise<boolean> {
  if (!supabase) return false;
  try {
    for (let i = 0; i < videos.length; i++) {
      await supabase
        .from('birthday_wishes_videos')
        .update({ display_order: i })
        .eq('id', videos[i].id);
    }
    return true;
  } catch {
    return false;
  }
}

// Subscribe to Realtime Updates so all open browser tabs update instantly
export function subscribeToRealtimeMedia(
  onVideosChange: () => void,
  onPhotosChange: () => void
): () => void {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('birthday-media-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'birthday_wishes_videos' },
      () => {
        onVideosChange();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'birthday_gallery_photos' },
      () => {
        onPhotosChange();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
