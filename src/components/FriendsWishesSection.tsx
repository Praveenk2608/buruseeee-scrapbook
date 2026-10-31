import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Maximize2, Trash2, Edit3, Check, Upload, 
  Sparkles, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, 
  Clock, HardDrive, Download, AlertCircle, HelpCircle, X, Cloud, Lock, Unlock
} from 'lucide-react';
import { 
  type WishVideo, 
  loadWishVideosFromDB, 
  saveWishVideoToDB, 
  deleteWishVideoFromDB, 
  updateWishMetadataInDB, 
  updateVideosOrderInDB,
  extractVideoMeta,
  getStorageEstimate
} from '../utils/indexedDBStorage';
import { 
  isSupabaseConfigured,
  fetchCloudWishVideos,
  uploadCloudWishVideo,
  deleteCloudWishVideo,
  updateCloudWishMetadata,
  reorderCloudWishVideos,
  getIsAdminUnlocked,
  subscribeToRealtimeMedia
} from '../utils/supabaseClient';
import { AdminPinModal } from './AdminPinModal';
import { triggerBirthdayConfetti } from '../utils/confetti';

interface FriendsWishesSectionProps {
  recipientName: string;
}

export const FriendsWishesSection: React.FC<FriendsWishesSectionProps> = ({ recipientName }) => {
  // Envelope reveal state
  const [isEnvelopeOpened, setIsEnvelopeOpened] = useState(true);

  // Videos state
  const [videos, setVideos] = useState<WishVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Admin & Cloud state
  const [isAdmin, setIsAdmin] = useState(getIsAdminUnlocked());
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [pendingUploadFiles, setPendingUploadFiles] = useState<FileList | null>(null);

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editing metadata
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editFriendName, setEditFriendName] = useState('');
  const [editCaption, setEditCaption] = useState('');

  // Finished video heart burst effect
  const [finishedVideoId, setFinishedVideoId] = useState<string | null>(null);

  // Full-screen Theater Modal
  const [fullscreenVideo, setFullscreenVideo] = useState<WishVideo | null>(null);

  // "Play All Wishes" continuous player modal
  const [isPlayAllOpen, setIsPlayAllOpen] = useState(false);
  const [playAllIndex, setPlayAllIndex] = useState(0);
  const [isPlayAllAutoAdvance, setIsPlayAllAutoAdvance] = useState(true);

  // Cloud guide modal
  const [isCloudGuideOpen, setIsCloudGuideOpen] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{ usedMB: number; totalQuotaMB?: number }>({ usedMB: 0 });

  // Load videos on mount & subscribe to Realtime updates
  const loadAllMedia = async () => {
    setIsLoading(true);
    let combinedVideos: WishVideo[] = [];

    // 1. Fetch from Supabase Cloud if configured
    if (isSupabaseConfigured) {
      const cloudVideos = await fetchCloudWishVideos();
      combinedVideos = [...cloudVideos];
    }

    // 2. Also load local IndexedDB videos
    const localVideos = await loadWishVideosFromDB();

    // 3. Merge avoiding duplicates
    const cloudIds = new Set(combinedVideos.map((v) => v.id));
    const uniqueLocal = localVideos.filter((v) => !cloudIds.has(v.id));
    combinedVideos = [...combinedVideos, ...uniqueLocal];

    combinedVideos.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setVideos(combinedVideos);

    const estimate = await getStorageEstimate();
    setStorageInfo(estimate);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAllMedia();

    // Realtime listener for incoming uploads from other devices
    const unsubscribe = subscribeToRealtimeMedia(
      () => {
        // Videos changed in cloud
        loadAllMedia();
      },
      () => {}
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Format seconds to MM:SS
  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  // Handle Multi-file Upload
  const processUpload = async (files: FileList) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(10);
    setUploadStatus('Processing videos...');

    const validFiles: File[] = [];
    const supportedTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (supportedTypes.includes(file.type) || ['mp4', 'mov', 'webm', 'm4v'].includes(ext || '')) {
        validFiles.push(file);
      } else {
        setUploadError(`Skipped "${file.name}": Please upload MP4, MOV, or WEBM format.`);
      }
    }

    if (validFiles.length === 0) {
      setIsUploading(false);
      return;
    }

    const newVideos: WishVideo[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setUploadStatus(`Uploading ${file.name} (${i + 1} of ${validFiles.length})...`);
      setUploadProgress(20 + Math.round(((i + 0.5) / validFiles.length) * 75));

      try {
        if (isSupabaseConfigured) {
          // 1. Upload to Supabase Cloud Storage & Database
          const cloudVid = await uploadCloudWishVideo(
            file,
            cleanName.length > 25 ? cleanName.substring(0, 25) : cleanName || 'Loving Friend',
            'Wishing you the happiest birthday ever! 💖🎉'
          );
          if (cloudVid) {
            newVideos.push(cloudVid);
            // Also cache locally
            await saveWishVideoToDB(cloudVid, file);
          }
        } else {
          // 2. Fallback to local IndexedDB
          const { thumbnail, duration } = await extractVideoMeta(file);
          const objectUrl = URL.createObjectURL(file);

          const localVideo: WishVideo = {
            id: `wish-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
            friendName: cleanName.length > 25 ? cleanName.substring(0, 25) : cleanName || 'Loving Friend',
            caption: 'Wishing you the happiest birthday ever! 💖🎉',
            blob: file,
            url: objectUrl,
            thumbnail,
            duration,
            fileSize: file.size,
            fileName: file.name,
            fileType: file.type || 'video/mp4',
            createdAt: Date.now() + i,
            order: videos.length + i,
          };

          await saveWishVideoToDB(localVideo, file);
          newVideos.push(localVideo);
        }
      } catch (err: any) {
        console.error('Error saving video', err);
        setUploadError(`Failed to upload "${file.name}": ${err.message || 'Storage error'}`);
      }
    }

    setUploadProgress(100);
    setUploadStatus(isSupabaseConfigured ? 'Uploaded to Cloud Storage!' : 'Saved in browser database!');
    setVideos((prev) => [...prev, ...newVideos]);
    triggerBirthdayConfetti();

    const estimate = await getStorageEstimate();
    setStorageInfo(estimate);

    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }, 1200);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!isAdmin) {
      setPendingUploadFiles(files);
      setIsAdminModalOpen(true);
      return;
    }
    processUpload(files);
  };

  // Reorder videos
  const moveVideo = async (index: number, direction: 'left' | 'right') => {
    if (!isAdmin) {
      setIsAdminModalOpen(true);
      return;
    }

    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= videos.length) return;

    const newArr = [...videos];
    const [moved] = newArr.splice(index, 1);
    newArr.splice(targetIndex, 0, moved);

    setVideos(newArr);
    if (isSupabaseConfigured) {
      await reorderCloudWishVideos(newArr);
    }
    await updateVideosOrderInDB(newArr);
  };

  // Delete video
  const handleDeleteVideo = async (video: WishVideo, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isAdmin) {
      setIsAdminModalOpen(true);
      return;
    }

    if (confirm(`Remove birthday wish video from "${video.friendName}"?`)) {
      if (video.url && video.url.startsWith('blob:')) {
        URL.revokeObjectURL(video.url);
      }

      if (isSupabaseConfigured && video.url.startsWith('http')) {
        await deleteCloudWishVideo(video.id, video.url);
      }
      await deleteWishVideoFromDB(video.id);

      setVideos((prev) => prev.filter((v) => v.id !== video.id));
      if (fullscreenVideo?.id === video.id) setFullscreenVideo(null);

      const estimate = await getStorageEstimate();
      setStorageInfo(estimate);
    }
  };

  // Start editing friend name & caption
  const startEditing = (video: WishVideo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) {
      setIsAdminModalOpen(true);
      return;
    }
    setEditingVideoId(video.id);
    setEditFriendName(video.friendName);
    setEditCaption(video.caption);
  };

  // Save edit
  const saveEditing = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isSupabaseConfigured) {
      await updateCloudWishMetadata(id, {
        friendName: editFriendName,
        caption: editCaption,
      });
    }
    await updateWishMetadataInDB(id, {
      friendName: editFriendName,
      caption: editCaption,
    });
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, friendName: editFriendName, caption: editCaption } : v))
    );
    setEditingVideoId(null);
  };

  // When video ends, trigger special heart burst
  const handleVideoEnded = (id: string) => {
    setFinishedVideoId(id);
    triggerBirthdayConfetti();
    setTimeout(() => {
      setFinishedVideoId(null);
    }, 2800);
  };

  // Play All Wishes slideshow controls
  const handlePlayAllNext = () => {
    if (playAllIndex < videos.length - 1) {
      setPlayAllIndex((prev) => prev + 1);
    } else {
      setIsPlayAllOpen(false);
      triggerBirthdayConfetti();
    }
  };

  const handlePlayAllPrev = () => {
    if (playAllIndex > 0) {
      setPlayAllIndex((prev) => prev - 1);
    }
  };

  // Export backup metadata JSON
  const handleExportBackup = () => {
    const metadata = videos.map(({ id, friendName, caption, duration, fileSize, fileName, fileType, createdAt, order }) => ({
      id, friendName, caption, duration, fileSize, fileName, fileType, createdAt, order
    }));
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(metadata, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `buruseeee_birthday_wishes_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <section id="friends-wishes" className="py-20 px-4 max-w-7xl mx-auto scroll-mt-24">
      {/* Introduction Container */}
      <div className="text-center mb-10">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF0F5] border border-[#F48FB1]/40 text-[#75445A] text-xs font-bold uppercase tracking-widest mb-4 shadow-xs"
        >
          <Sparkles size={14} className="text-[#F48FB1]" />
          <span>Love Notes & Video Blessings</span>
          <span className="text-base">🎀</span>
        </motion.div>

        <h2 className="font-romantic text-4xl sm:text-6xl md:text-7xl text-[#75445A] font-bold mb-3 tracking-wide drop-shadow-xs">
          MESSAGES FROM MY FAVOURITE PEOPLE 💌
        </h2>

        <p className="font-handwriting text-2xl sm:text-3xl text-[#75445A]/90 max-w-2xl mx-auto mb-4">
          A little collection of love, laughter and wishes from everyone who makes your life special.
        </p>

        <div className="bg-white/80 backdrop-blur-xs border border-[#F48FB1]/30 rounded-2xl max-w-xl mx-auto p-4 mb-8 shadow-xs">
          <p className="font-serif-vintage italic text-[#75445A] text-base leading-relaxed">
            "Everyone has something special to tell you...<br />
            Here are little pieces of love from the people who are lucky to have you in their lives."
          </p>
        </div>

        {/* Envelope Toggle & Reveal Button */}
        <div className="flex justify-center mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEnvelopeOpened(!isEnvelopeOpened)}
            className="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-[#F48FB1] to-[#F06292] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
          >
            <span className="text-xl">{isEnvelopeOpened ? '💌' : '✉️'}</span>
            <span>{isEnvelopeOpened ? 'Close Wishes Envelope' : 'Open Wishes Envelope 🎀'}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/25 text-xs">
              {videos.length} {videos.length === 1 ? 'wish' : 'wishes'}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Main Wishes Content Wrapped in Envelope Animation */}
      <AnimatePresence>
        {isEnvelopeOpened && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.96 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.96 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {/* Top Toolbar: Upload, Play All, Cloud Info */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-[#F48FB1]/30 shadow-md mb-10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Left: Upload Button & Count */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#F48FB1] hover:bg-[#ec407a] text-white font-bold text-xs shadow-xs hover:shadow-md transition-all disabled:opacity-50"
                  >
                    <Upload size={14} />
                    <span>Upload Videos (MP4, MOV, WEBM)</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />

                  {videos.length > 0 && (
                    <button
                      onClick={() => {
                        setPlayAllIndex(0);
                        setIsPlayAllOpen(true);
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#E8DDF8] to-[#D1C4E9] text-[#512DA8] font-bold text-xs hover:shadow-md transition-all"
                    >
                      <Play size={14} className="fill-[#512DA8]" />
                      <span>Play All Wishes ({videos.length}) ✨</span>
                    </button>
                  )}
                </div>

                {/* Right: Storage info, Cloud guide, Export, Admin status */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 border ${
                      isSupabaseConfigured
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-[#FFF0F5] text-[#75445A] border-[#F48FB1]/20'
                    }`}
                  >
                    {isSupabaseConfigured ? <Cloud size={12} className="text-emerald-500" /> : <HardDrive size={12} className="text-[#F48FB1]" />}
                    <span>{isSupabaseConfigured ? 'Supabase Cloud Sync' : `Saved locally: ${storageInfo.usedMB} MB`}</span>
                  </span>

                  <button
                    onClick={() => setIsAdminModalOpen(true)}
                    className={`p-2 rounded-full border transition-colors ${
                      isAdmin
                        ? 'bg-purple-100 text-purple-700 border-purple-300'
                        : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200'
                    }`}
                    title={isAdmin ? 'Admin Mode Unlocked' : 'Unlock Admin Controls'}
                  >
                    {isAdmin ? <Unlock size={14} /> : <Lock size={14} />}
                  </button>

                  <button
                    onClick={() => setIsCloudGuideOpen(true)}
                    className="p-2 text-[#75445A] hover:text-[#F48FB1] rounded-full hover:bg-[#FFF0F5] transition-colors"
                    title="How to connect Supabase & Deploy"
                  >
                    <HelpCircle size={16} />
                  </button>

                  {videos.length > 0 && (
                    <button
                      onClick={handleExportBackup}
                      className="p-2 text-[#75445A] hover:text-[#F48FB1] rounded-full hover:bg-[#FFF0F5] transition-colors"
                      title="Download Backup Metadata"
                    >
                      <Download size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="mt-4 pt-4 border-t border-pink-100">
                  <div className="flex justify-between text-xs font-semibold text-[#75445A] mb-1.5">
                    <span>{uploadStatus}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-[#FFF0F5] h-2.5 rounded-full overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-[#F48FB1] to-[#E8DDF8] h-full rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Error Banner */}
              {uploadError && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{uploadError}</span>
                  <button onClick={() => setUploadError(null)} className="ml-auto text-rose-400 hover:text-rose-700">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Video Cards Gallery */}
            {isLoading ? (
              <div className="py-20 text-center">
                <div className="inline-block animate-spin text-[#F48FB1] text-3xl mb-3">🌸</div>
                <p className="font-handwriting text-2xl text-[#75445A]">Loading beautiful wishes...</p>
              </div>
            ) : videos.length === 0 ? (
              /* Cute Empty State Dropzone */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#F48FB1]/60 bg-white/70 hover:bg-white/95 rounded-3xl p-12 text-center cursor-pointer transition-all hover:border-[#F48FB1] hover:shadow-md mb-12"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#FFF0F5] flex items-center justify-center text-4xl shadow-inner animate-float-slow">
                  💌
                </div>
                <h3 className="font-romantic text-3xl sm:text-4xl text-[#75445A] font-bold mb-2">
                  No Videos Added Yet!
                </h3>
                <p className="font-handwriting text-2xl text-[#75445A]/80 max-w-md mx-auto mb-5">
                  Click here or drag & drop video files recorded by friends (MP4, MOV, WEBM) to start creating Buruseeee's video album!
                </p>
                <button className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#F48FB1] to-[#F06292] text-white font-bold text-xs shadow-md">
                  Browse Video Files 🎥
                </button>
                <p className="text-[11px] text-[#75445A]/60 mt-3">
                  {isSupabaseConfigured ? 'Connected to Supabase Cloud: visible on all devices!' : 'Saved in browser database: add Supabase credentials to sync across devices.'}
                </p>
              </div>
            ) : (
              /* Responsive Video Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                {videos.map((video, index) => {
                  const isEditing = editingVideoId === video.id;
                  const isFinished = finishedVideoId === video.id;

                  return (
                    <motion.div
                      key={video.id}
                      layout
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className="relative group bg-white rounded-3xl p-4 border border-[#F48FB1]/30 shadow-md hover:shadow-xl transition-all"
                    >
                      {/* Top Ribbon & Washi Accent */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded-full bg-gradient-to-r from-[#F48FB1] to-[#E8DDF8] text-white text-[11px] font-bold shadow-xs flex items-center gap-1 z-10">
                        <span>🎀</span>
                        <span>Wish #{index + 1}</span>
                      </div>

                      {/* Video Player Container */}
                      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/90 shadow-inner mt-2">
                        <video
                          id={`video-${video.id}`}
                          src={video.url}
                          poster={video.thumbnail}
                          controls
                          playsInline
                          preload="metadata"
                          onEnded={() => handleVideoEnded(video.id)}
                          className="w-full h-full object-contain"
                        />

                        {/* Special Heart Burst Overlay when video finishes */}
                        <AnimatePresence>
                          {isFinished && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-pink-500/30 backdrop-blur-xs flex flex-col items-center justify-center text-white pointer-events-none z-20"
                            >
                              <motion.div
                                animate={{ scale: [1, 1.4, 1], rotate: [0, -10, 10, 0] }}
                                transition={{ repeat: Infinity, duration: 1.2 }}
                                className="text-6xl drop-shadow-md"
                              >
                                💖
                              </motion.div>
                              <p className="font-romantic text-3xl font-bold mt-2 drop-shadow-md">
                                So Much Love!
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Top corner quick badges */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                          {video.duration > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-1">
                              <Clock size={10} />
                              <span>{formatDuration(video.duration)}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Body: Friend Name & Caption */}
                      <div className="pt-4 px-1">
                        {isEditing ? (
                          <div className="space-y-2 mb-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editFriendName}
                              onChange={(e) => setEditFriendName(e.target.value)}
                              placeholder="Friend's Name"
                              className="w-full px-3 py-1.5 text-xs font-bold border border-[#F48FB1]/50 rounded-lg focus:outline-[#F48FB1]"
                            />
                            <textarea
                              value={editCaption}
                              onChange={(e) => setEditCaption(e.target.value)}
                              placeholder="Heartfelt message or inside joke..."
                              rows={2}
                              className="w-full px-3 py-1.5 text-xs border border-[#F48FB1]/50 rounded-lg focus:outline-[#F48FB1]"
                            />
                            <button
                              onClick={(e) => saveEditing(video.id, e)}
                              className="w-full py-1 text-xs font-bold rounded-lg bg-[#F48FB1] text-white hover:bg-[#ec407a] flex items-center justify-center gap-1"
                            >
                              <Check size={13} />
                              <span>Save Details</span>
                            </button>
                          </div>
                        ) : (
                          <div className="mb-3">
                            <div className="flex items-baseline justify-between gap-2">
                              <h3 className="font-handwriting text-2xl font-bold text-[#75445A] truncate">
                                {video.friendName || 'Loving Friend'}
                              </h3>
                              {video.fileSize > 0 && (
                                <span className="text-[10px] text-[#75445A]/50 shrink-0">
                                  {formatFileSize(video.fileSize)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#75445A]/80 font-sans leading-relaxed mt-0.5 line-clamp-2">
                              {video.caption || 'Wishing you the happiest birthday!'}
                            </p>
                          </div>
                        )}

                        {/* Card Footer Controls: Reorder, Fullscreen, Edit, Delete */}
                        <div className="flex items-center justify-between pt-2 border-t border-pink-100/80 text-[#75445A]/70 text-xs">
                          {/* Reordering */}
                          <div className="flex items-center gap-1">
                            {isAdmin && (
                              <>
                                <button
                                  disabled={index === 0}
                                  onClick={() => moveVideo(index, 'left')}
                                  className="p-1 rounded hover:bg-[#FFF0F5] hover:text-[#F48FB1] disabled:opacity-30"
                                  title="Move Earlier"
                                >
                                  <ArrowLeft size={13} />
                                </button>
                                <button
                                  disabled={index === videos.length - 1}
                                  onClick={() => moveVideo(index, 'right')}
                                  className="p-1 rounded hover:bg-[#FFF0F5] hover:text-[#F48FB1] disabled:opacity-30"
                                  title="Move Later"
                                >
                                  <ArrowRight size={13} />
                                </button>
                              </>
                            )}
                          </div>

                          {/* Action icons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setFullscreenVideo(video)}
                              className="p-1.5 rounded-full hover:bg-[#FFF0F5] hover:text-[#F48FB1] transition-colors"
                              title="Full Screen Theater"
                            >
                              <Maximize2 size={14} />
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={(e) => startEditing(video, e)}
                                  className="p-1.5 rounded-full hover:bg-[#FFF0F5] hover:text-[#F48FB1] transition-colors"
                                  title="Edit Name & Caption"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteVideo(video, e)}
                                  className="p-1.5 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                  title="Delete Video"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* End of Videos Tribute Message */}
            {videos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center py-8 px-6 rounded-3xl bg-gradient-to-r from-[#FFF0F5] via-white to-[#E8DDF8] border border-[#F48FB1]/40 shadow-sm max-w-2xl mx-auto mb-8"
              >
                <div className="text-3xl mb-2">🥰✨</div>
                <h3 className="font-romantic text-3xl sm:text-4xl text-[#75445A] font-bold mb-1">
                  Look how many people love you, {recipientName}! You are truly special. ❤️
                </h3>
                <p className="font-handwriting text-xl text-[#75445A]/80">
                  Every message here represents a life you have made brighter just by being in it.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Screen Theater Modal */}
      <AnimatePresence>
        {fullscreenVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4"
            onClick={() => setFullscreenVideo(null)}
          >
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setFullscreenVideo(null)}
                className="p-2.5 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div
              className="max-w-4xl w-full bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-pink-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="aspect-video w-full bg-black">
                <video
                  src={fullscreenVideo.url}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                  onEnded={() => handleVideoEnded(fullscreenVideo.id)}
                />
              </div>

              <div className="p-6 bg-gradient-to-r from-[#FFF0F5] to-white text-[#75445A]">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-romantic text-3xl font-bold">
                    {fullscreenVideo.friendName || 'Loving Friend'}
                  </h3>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-pink-100 text-pink-700">
                    {formatDuration(fullscreenVideo.duration)}
                  </span>
                </div>
                <p className="font-handwriting text-xl text-[#75445A]/90">
                  {fullscreenVideo.caption}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "Play All Wishes" Continuous Slideshow Player */}
      <AnimatePresence>
        {isPlayAllOpen && videos[playAllIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6"
            onClick={() => setIsPlayAllOpen(false)}
          >
            <div
              className="relative max-w-4xl w-full bg-neutral-950 rounded-3xl overflow-hidden shadow-2xl border border-pink-400/40"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header inside modal */}
              <div className="px-6 py-4 bg-gradient-to-r from-[#FFF0F5] via-white to-[#E8DDF8] border-b border-pink-200/50 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-pink-600 uppercase tracking-wider">
                    Wish {playAllIndex + 1} of {videos.length}
                  </span>
                  <h4 className="font-romantic text-2xl sm:text-3xl font-bold text-[#75445A]">
                    {videos[playAllIndex].friendName}
                  </h4>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlayAllAutoAdvance(!isPlayAllAutoAdvance)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      isPlayAllAutoAdvance
                        ? 'bg-pink-500 text-white shadow-xs'
                        : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    Auto-Next: {isPlayAllAutoAdvance ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => setIsPlayAllOpen(false)}
                    className="p-2 rounded-full bg-white/80 hover:bg-white text-neutral-700"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Video Player */}
              <div className="aspect-video w-full bg-black relative flex items-center justify-center">
                <video
                  key={videos[playAllIndex].id}
                  src={videos[playAllIndex].url}
                  controls
                  autoPlay
                  playsInline
                  onEnded={() => {
                    handleVideoEnded(videos[playAllIndex].id);
                    if (isPlayAllAutoAdvance) {
                      setTimeout(() => handlePlayAllNext(), 1200);
                    }
                  }}
                  className="w-full h-full object-contain"
                />

                {/* Left/Right Overlaid navigation buttons */}
                {playAllIndex > 0 && (
                  <button
                    onClick={handlePlayAllPrev}
                    className="absolute left-4 p-3 rounded-full bg-black/60 text-white hover:bg-pink-500 transition-colors shadow-lg"
                    title="Previous Wish"
                  >
                    <ChevronLeft size={22} />
                  </button>
                )}
                {playAllIndex < videos.length - 1 && (
                  <button
                    onClick={handlePlayAllNext}
                    className="absolute right-4 p-3 rounded-full bg-black/60 text-white hover:bg-pink-500 transition-colors shadow-lg"
                    title="Next Wish"
                  >
                    <ChevronRight size={22} />
                  </button>
                )}
              </div>

              {/* Caption Footer */}
              <div className="p-4 bg-neutral-900 text-pink-100 flex items-center justify-between text-xs">
                <p className="font-handwriting text-lg truncate max-w-xl">
                  {videos[playAllIndex].caption || 'Happy Birthday! 🎉'}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={playAllIndex === 0}
                    onClick={handlePlayAllPrev}
                    className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30"
                  >
                    Prev
                  </button>
                  <button
                    onClick={handlePlayAllNext}
                    className="px-3 py-1 rounded-lg bg-pink-500 hover:bg-pink-600 font-bold"
                  >
                    {playAllIndex === videos.length - 1 ? 'Finish 💖' : 'Next Wish ⏩'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cloud Storage & Remote Deployment Guide Modal */}
      <AnimatePresence>
        {isCloudGuideOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsCloudGuideOpen(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-pink-200 text-[#75445A]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-pink-600 font-bold text-sm">
                  <Cloud size={20} />
                  <span>Supabase Cloud Storage Status</span>
                </div>
                <button
                  onClick={() => setIsCloudGuideOpen(false)}
                  className="p-1.5 rounded-full hover:bg-pink-50 text-neutral-400 hover:text-neutral-700"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs leading-relaxed font-sans">
                <div className={`p-3 rounded-xl border ${isSupabaseConfigured ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-pink-50/70 border-pink-200/60'}`}>
                  <p className="font-bold mb-1">
                    {isSupabaseConfigured ? '✅ Supabase Cloud Connected!' : '💾 Local Storage Mode'}
                  </p>
                  <p>
                    {isSupabaseConfigured
                      ? 'Uploaded photos and videos are saved to your Supabase Cloud Storage bucket and database, making them visible to anyone with the link on any phone or desktop!'
                      : 'All videos are currently stored in your browser’s IndexedDB. To share them across other phones and computers, simply add your Supabase URL & Anon Key!'}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-neutral-800 text-sm mb-1">
                    🚀 Simple Deployment Steps
                  </h4>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Create a free project at <strong>supabase.com</strong>.</li>
                    <li>Paste the included <code>supabase_setup.sql</code> in the SQL Editor.</li>
                    <li>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your Vercel Environment Variables.</li>
                    <li>Deploy directly to Vercel via GitHub with 1-click!</li>
                  </ol>
                </div>

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">
                    Local Cache: {storageInfo.usedMB} MB
                  </span>
                  <button
                    onClick={() => setIsCloudGuideOpen(false)}
                    className="px-5 py-2 rounded-full bg-pink-500 text-white font-bold hover:bg-pink-600 transition-colors"
                  >
                    Got It! 🎀
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Security PIN Modal */}
      <AdminPinModal
        isOpen={isAdminModalOpen}
        onClose={() => {
          setIsAdminModalOpen(false);
          setPendingUploadFiles(null);
        }}
        onUnlocked={() => {
          setIsAdmin(true);
          if (pendingUploadFiles) {
            processUpload(pendingUploadFiles);
            setPendingUploadFiles(null);
          }
        }}
      />
    </section>
  );
};
