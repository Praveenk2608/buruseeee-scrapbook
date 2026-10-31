import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Upload, Trash2, Edit2, Maximize2, X, ChevronLeft, ChevronRight, 
  ArrowLeft, ArrowRight, Calendar, Download, ZoomIn, ZoomOut, Cloud, Lock, Unlock, AlertCircle
} from 'lucide-react';
import type { PhotoItem } from '../types';
import { 
  isSupabaseConfigured, 
  fetchCloudPhotos, 
  uploadCloudPhoto, 
  deleteCloudPhoto, 
  getIsAdminUnlocked 
} from '../utils/supabaseClient';
import { AdminPinModal } from './AdminPinModal';
import { triggerBirthdayConfetti } from '../utils/confetti';

interface PhotoGalleryProps {
  photos: PhotoItem[];
  onPhotosChange: (updatedPhotos: PhotoItem[]) => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, onPhotosChange }) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editDate, setEditDate] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(24);

  // Cloud & Admin state
  const [isAdmin, setIsAdmin] = useState(getIsAdminUnlocked());
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [pendingUploadFiles, setPendingUploadFiles] = useState<FileList | null>(null);

  // Upload progress
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch cloud photos on initial mount
  useEffect(() => {
    async function loadCloudMedia() {
      if (isSupabaseConfigured) {
        const cloudItems = await fetchCloudPhotos();
        if (cloudItems.length > 0) {
          const existingIds = new Set(photos.map((p: PhotoItem) => p.id));
          const newCloud = cloudItems.filter((cp: PhotoItem) => !existingIds.has(cp.id));
          if (newCloud.length > 0) {
            onPhotosChange([...photos, ...newCloud]);
          }
        }
      }
    }
    loadCloudMedia();
  }, []);

  // Handle file uploads (multi-selection)
  const processUpload = async (files: FileList) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(10);
    setUploadStatus('Preparing photos...');

    const validFiles: File[] = [];
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (supportedTypes.includes(f.type) || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic'].includes(f.name.split('.').pop()?.toLowerCase() || '')) {
        validFiles.push(f);
      }
    }

    if (validFiles.length === 0) {
      setUploadError('Please select JPG, PNG, WEBP or GIF image files.');
      setIsUploading(false);
      return;
    }

    const newPhotos: PhotoItem[] = [];
    const tapes: ('pink' | 'lavender' | 'peach' | 'mint')[] = ['pink', 'lavender', 'peach', 'mint'];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setUploadStatus(`Uploading ${file.name} (${i + 1} of ${validFiles.length})...`);
      setUploadProgress(20 + Math.round(((i + 1) / validFiles.length) * 75));

      try {
        if (isSupabaseConfigured) {
          // Upload to Supabase Cloud
          const cloudPhoto = await uploadCloudPhoto(file, {
            caption: cleanName.length > 35 ? cleanName.substring(0, 35) + '...' : cleanName || 'Sweet Bestie Memory 💖',
            tapeColor: tapes[i % tapes.length],
          });
          if (cloudPhoto) {
            newPhotos.push(cloudPhoto);
          }
        } else {
          // Fallback to local object URL
          const objectUrl = URL.createObjectURL(file);
          newPhotos.push({
            id: `photo-local-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
            url: objectUrl,
            caption: cleanName.length > 35 ? cleanName.substring(0, 35) + '...' : cleanName || 'Sweet Bestie Memory 💖',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            rotation: Math.random() * 6 - 3,
            tapeColor: tapes[i % tapes.length],
            pinned: true,
          });
        }
      } catch (err: any) {
        console.error('Error uploading photo:', err);
        setUploadError(`Failed to upload ${file.name}: ${err.message || 'Network error'}`);
      }
    }

    setUploadProgress(100);
    setUploadStatus(isSupabaseConfigured ? 'Uploaded to Cloud Storage!' : 'Saved in memory!');
    onPhotosChange([...photos, ...newPhotos]);
    triggerBirthdayConfetti();

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

  // Reordering helpers
  const movePhoto = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;

    const newArr = [...photos];
    const [moved] = newArr.splice(index, 1);
    newArr.splice(targetIndex, 0, moved);
    onPhotosChange(newArr);
  };

  // Delete photo
  const deletePhoto = async (photo: PhotoItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isAdmin) {
      setIsAdminModalOpen(true);
      return;
    }

    if (confirm('Remove this photo from your scrapbook?')) {
      if (isSupabaseConfigured && photo.url.startsWith('http')) {
        await deleteCloudPhoto(photo.id, photo.url);
      }
      onPhotosChange(photos.filter((p) => p.id !== photo.id));
      if (selectedPhotoIndex !== null && photos[selectedPhotoIndex]?.id === photo.id) {
        setSelectedPhotoIndex(null);
      }
    }
  };

  // Edit caption
  const startEditCaption = (photo: PhotoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) {
      setIsAdminModalOpen(true);
      return;
    }
    setEditingPhotoId(photo.id);
    setEditCaption(photo.caption);
    setEditDate(photo.date || '');
  };

  const saveEditCaption = (id: string) => {
    onPhotosChange(
      photos.map((p) => (p.id === id ? { ...p, caption: editCaption, date: editDate } : p))
    );
    setEditingPhotoId(null);
  };

  // Filtered photos
  const filteredPhotos = photos.filter((p) =>
    p.caption.toLowerCase().includes(filterQuery.toLowerCase()) ||
    (p.date && p.date.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  const displayedPhotos = filteredPhotos.slice(0, visibleCount);

  // Full-screen Lightbox handlers
  const openLightbox = (index: number) => {
    setSelectedPhotoIndex(index);
    setZoomScale(1);
  };

  const nextPhoto = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex + 1) % photos.length);
    setZoomScale(1);
  };

  const prevPhoto = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex - 1 + photos.length) % photos.length);
    setZoomScale(1);
  };

  return (
    <section id="gallery" className="py-20 px-4 max-w-7xl mx-auto scroll-mt-24">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF0F5] border border-[#F48FB1]/40 text-[#75445A] text-xs font-bold uppercase tracking-widest mb-3 shadow-xs">
          <Camera size={14} className="text-[#F48FB1]" />
          <span>Polaroid Memory Wall</span>
          <span className="text-base">📸</span>
        </div>
        <h2 className="font-romantic text-4xl sm:text-6xl md:text-7xl text-[#75445A] font-bold mb-3 tracking-wide drop-shadow-xs">
          Our Photo Gallery 🎀
        </h2>
        <p className="font-handwriting text-2xl sm:text-3xl text-[#75445A]/90 max-w-xl mx-auto mb-6">
          Supporting 100+ of our most iconic, chaotic, and heartwarming photos! ✨
        </p>

        {/* Action Controls & Upload Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-2xl mx-auto">
          {/* File Upload Trigger */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#F48FB1] to-[#F06292] text-white font-bold text-xs shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
          >
            <Upload size={14} />
            <span>Upload Photos (Multi-Select)</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />

          {/* Search / Filter input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search captions or dates..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="px-4 py-2 text-xs rounded-full border border-[#F48FB1]/30 bg-white/95 focus:outline-[#F48FB1] w-48 sm:w-60 shadow-xs text-[#75445A]"
            />
          </div>

          {/* Photo Count badge */}
          <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-[#FFF0F5] text-[#75445A] border border-[#F48FB1]/30">
            {photos.length} Memories Saved
          </span>

          {/* Cloud Sync indicator */}
          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 border ${
              isSupabaseConfigured
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
            title={isSupabaseConfigured ? 'Connected to Supabase Cloud Storage' : 'Running in Local Storage Mode'}
          >
            <Cloud size={13} />
            <span>{isSupabaseConfigured ? 'Cloud Sync On' : 'Local Storage'}</span>
          </span>

          {/* Admin Mode toggle */}
          <button
            onClick={() => setIsAdminModalOpen(true)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 border transition-colors ${
              isAdmin
                ? 'bg-purple-100 text-purple-700 border-purple-300'
                : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200'
            }`}
            title={isAdmin ? 'Admin Mode Unlocked' : 'Click to Unlock Admin Controls'}
          >
            {isAdmin ? <Unlock size={12} /> : <Lock size={12} />}
            <span>{isAdmin ? 'Admin' : 'Lock'}</span>
          </button>
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="mt-4 max-w-md mx-auto p-3 bg-white/90 rounded-2xl border border-pink-200 shadow-sm">
            <div className="flex justify-between text-xs font-semibold text-[#75445A] mb-1">
              <span>{uploadStatus}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-[#FFF0F5] h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#F48FB1] to-[#E8DDF8] h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload Error Banner */}
        {uploadError && (
          <div className="mt-3 max-w-md mx-auto p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle size={15} className="shrink-0" />
            <span>{uploadError}</span>
            <button onClick={() => setUploadError(null)} className="ml-auto text-rose-400 hover:text-rose-700">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingOver(false);
          handleFileUpload(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`mb-12 border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
          isDraggingOver
            ? 'border-[#F48FB1] bg-[#FFF0F5] scale-102'
            : 'border-[#F48FB1]/40 bg-white/70 hover:bg-white/95 hover:border-[#F48FB1]'
        }`}
      >
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#FFF0F5] border border-[#F48FB1]/30 flex items-center justify-center text-[#F48FB1]">
          <Upload size={20} />
        </div>
        <p className="font-sans font-bold text-[#75445A] text-sm mb-1">
          Drag & Drop Any 100+ Photos Here or Click to Browse
        </p>
        <p className="text-xs text-[#75445A]/70">
          Original quality is 100% preserved. Supports JPG, PNG, WEBP, GIF, and HEIC.
        </p>
      </div>

      {/* Polaroid Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
        {displayedPhotos.map((photo, index) => {
          const tapeClass =
            photo.tapeColor === 'lavender'
              ? 'washi-tape-lavender'
              : photo.tapeColor === 'peach'
              ? 'washi-tape-peach'
              : photo.tapeColor === 'mint'
              ? 'washi-tape-mint'
              : 'washi-tape-pink';

          return (
            <motion.div
              key={photo.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="relative group"
            >
              {/* Polaroid Frame */}
              <div
                className="polaroid-frame rounded-2xl cursor-pointer"
                style={{
                  transform: `rotate(${photo.rotation || 0}deg)`,
                }}
                onClick={() => openLightbox(index)}
              >
                {/* Washi tape */}
                <div className={`washi-tape ${tapeClass} -top-3 left-1/2 -translate-x-1/2`} />

                {/* Photo Image */}
                <div className="aspect-square w-full rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/50 shadow-inner relative">
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Hover Quick Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openLightbox(index);
                      }}
                      className="p-2 bg-white/90 text-neutral-700 rounded-full hover:bg-white hover:text-pink-600 transition-colors shadow-md"
                      title="View Fullscreen"
                    >
                      <Maximize2 size={16} />
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={(e) => startEditCaption(photo, e)}
                          className="p-2 bg-white/90 text-neutral-700 rounded-full hover:bg-white hover:text-purple-600 transition-colors shadow-md"
                          title="Edit Caption & Date"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => deletePhoto(photo, e)}
                          className="p-2 bg-white/90 text-neutral-700 rounded-full hover:bg-rose-500 hover:text-white transition-colors shadow-md"
                          title="Delete Photo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Caption & Date Bottom Area */}
                <div className="pt-3 text-center">
                  {editingPhotoId === photo.id ? (
                    <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        className="w-full text-xs font-bold border rounded p-1 text-center"
                        placeholder="Caption"
                      />
                      <input
                        type="text"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full text-[10px] border rounded p-1 text-center"
                        placeholder="Date (e.g. Oct 2024)"
                      />
                      <button
                        onClick={() => saveEditCaption(photo.id)}
                        className="w-full text-[10px] font-bold bg-[#F48FB1] text-white rounded py-1 hover:bg-[#F06292]"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="font-handwriting text-xl text-[#75445A] font-bold truncate px-1">
                        {photo.caption}
                      </p>
                      {photo.date && (
                        <p className="text-[11px] text-[#75445A]/60 font-sans flex items-center justify-center gap-1 mt-0.5">
                          <Calendar size={11} />
                          <span>{photo.date}</span>
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Reordering mini buttons */}
                {isAdmin && (
                  <div className="absolute -bottom-3 inset-x-0 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      disabled={index === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        movePhoto(index, 'left');
                      }}
                      className="p-1 rounded bg-white text-neutral-600 border border-neutral-200 hover:bg-pink-50 disabled:opacity-30 shadow-xs"
                      title="Move earlier"
                    >
                      <ArrowLeft size={11} />
                    </button>
                    <button
                      disabled={index === photos.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        movePhoto(index, 'right');
                      }}
                      className="p-1 rounded bg-white text-neutral-600 border border-neutral-200 hover:bg-pink-50 disabled:opacity-30 shadow-xs"
                      title="Move later"
                    >
                      <ArrowRight size={11} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Show more button if photos exceed visible count */}
      {filteredPhotos.length > visibleCount && (
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setVisibleCount((prev) => prev + 24)}
            className="px-6 py-3 rounded-full bg-[#FFF0F5] text-[#75445A] font-bold text-xs hover:bg-[#FCE4EC] transition-colors shadow-xs border border-[#F48FB1]/30"
          >
            Load More Photos ({filteredPhotos.length - visibleCount} remaining)
          </button>
          <button
            onClick={() => setVisibleCount(filteredPhotos.length)}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-[#F48FB1] to-[#E8DDF8] text-[#75445A] font-bold text-xs hover:opacity-95 transition-opacity shadow-xs"
          >
            Show All ({filteredPhotos.length}) ✨
          </button>
        </div>
      )}

      {/* Full-Screen Lightbox Modal */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedPhotoIndex(null)}
          >
            {/* Top Close & Download Controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setZoomScale((z) => Math.min(z + 0.25, 2.5))}
                className="p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20"
                title="Zoom in"
              >
                <ZoomIn size={18} />
              </button>
              <button
                onClick={() => setZoomScale((z) => Math.max(z - 0.25, 0.75))}
                className="p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20"
                title="Zoom out"
              >
                <ZoomOut size={18} />
              </button>
              <a
                href={photos[selectedPhotoIndex].url}
                download={`buruseeee_memory_${selectedPhotoIndex + 1}.jpg`}
                className="p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20"
                title="Download original photo"
              >
                <Download size={18} />
              </a>
              <button
                onClick={() => setSelectedPhotoIndex(null)}
                className="p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Prev/Next arrows */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevPhoto();
              }}
              className="absolute left-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
              title="Previous Photo"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextPhoto();
              }}
              className="absolute right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
              title="Next Photo"
            >
              <ChevronRight size={24} />
            </button>

            {/* Center Image Container */}
            <div
              className="max-w-4xl max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                key={photos[selectedPhotoIndex].id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: zoomScale, opacity: 1 }}
                src={photos[selectedPhotoIndex].url}
                alt={photos[selectedPhotoIndex].caption}
                className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-2xl transition-transform"
              />
              <div className="mt-4 text-center text-white">
                <p className="font-handwriting text-2xl font-bold">
                  {photos[selectedPhotoIndex].caption}
                </p>
                {photos[selectedPhotoIndex].date && (
                  <p className="text-xs text-white/60 mt-1">
                    {photos[selectedPhotoIndex].date}
                  </p>
                )}
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
