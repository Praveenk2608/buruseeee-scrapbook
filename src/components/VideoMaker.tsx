import { useState, useRef, useEffect } from 'react';
import { 
  Film, Play, Pause, Download, Settings, Sparkles, RefreshCw, 
  CheckCircle, AlertCircle, Clock, Layers, Smartphone, Monitor, Square
} from 'lucide-react';
import type { PhotoItem } from '../types';
import { BirthdayVideoRenderer, type AspectRatio, type TransitionType } from '../utils/videoRenderer';
import { triggerBirthdayConfetti } from '../utils/confetti';

interface VideoMakerProps {
  photos: PhotoItem[];
  recipientName: string;
}

export const VideoMaker: React.FC<VideoMakerProps> = ({ photos, recipientName }) => {
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [durationPerPhoto, setDurationPerPhoto] = useState<number>(2.5);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [transition, setTransition] = useState<TransitionType>('kenburns');
  const [titleText, setTitleText] = useState(`Happy Birthday ${recipientName}! 💖`);
  const [subtitleText, setSubtitleText] = useState('Forever My Bestie • Unbreakable Bond');
  const [includeMusic] = useState(true);

  // Live Canvas Preview state
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewFrame, setPreviewFrame] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  // Render & Export state
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState('');
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportedVideoExtension, setExportedVideoExtension] = useState<string>('webm');
  const [renderError, setRenderError] = useState<string | null>(null);

  const videoRenderer = useRef(new BirthdayVideoRenderer()).current;

  // By default, select the first 8 photos
  useEffect(() => {
    if (photos.length > 0 && selectedPhotoIds.length === 0) {
      setSelectedPhotoIds(photos.slice(0, Math.min(8, photos.length)).map((p) => p.id));
    }
  }, [photos]);

  const activePhotos = photos.filter((p) => selectedPhotoIds.includes(p.id));

  // Toggle selection
  const togglePhotoSelect = (id: string) => {
    if (selectedPhotoIds.includes(id)) {
      if (selectedPhotoIds.length <= 1) {
        alert('Please keep at least 1 photo selected for the video!');
        return;
      }
      setSelectedPhotoIds(selectedPhotoIds.filter((pid) => pid !== id));
    } else {
      setSelectedPhotoIds([...selectedPhotoIds, id]);
    }
  };

  const selectAll = () => setSelectedPhotoIds(photos.map((p) => p.id));
  const deselectAll = () => setSelectedPhotoIds(photos.slice(0, 1).map((p) => p.id));

  // Live Canvas Preview Loop
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || activePhotos.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas internal resolution based on ratio
    const width = aspectRatio === '16:9' ? 640 : aspectRatio === '1:1' ? 480 : 360;
    const height = aspectRatio === '16:9' ? 360 : aspectRatio === '1:1' ? 480 : 640;
    canvas.width = width;
    canvas.height = height;

    const fps = 30;
    const framesPerSlide = Math.round(durationPerPhoto * fps);
    const totalFrames = framesPerSlide * activePhotos.length;

    let currentFrame = previewFrame;

    const drawFrame = (frame: number) => {
      const photoIdx = Math.floor(frame / framesPerSlide) % activePhotos.length;
      const progressInPhoto = (frame % framesPerSlide) / framesPerSlide;
      const currentPhoto = activePhotos[photoIdx];

      // Draw background
      ctx.fillStyle = '#fce7f3';
      ctx.fillRect(0, 0, width, height);

      const grad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.7);
      grad.addColorStop(0, '#fff0f5');
      grad.addColorStop(1, '#f3e8ff');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw photo
      const img = new Image();
      img.src = currentPhoto.url;
      if (img.complete && img.naturalWidth > 0) {
        const maxW = width * 0.8;
        const maxH = height * 0.6;
        let scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);

        if (transition === 'kenburns' || transition === 'zoom') {
          scale *= (1 + progressInPhoto * 0.08);
        }

        const rw = img.naturalWidth * scale;
        const rh = img.naturalHeight * scale;
        const cx = width / 2;
        const cy = height * 0.45;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.shadowColor = 'rgba(236, 72, 153, 0.25)';
        ctx.shadowBlur = 15;

        // Card frame
        ctx.fillStyle = '#ffffff';
        const cardW = rw + 20;
        const cardH = rh + 50;
        ctx.beginPath();
        ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.drawImage(img, -rw / 2, -cardH / 2 + 10, rw, rh);

        // Caption
        ctx.fillStyle = '#4b5563';
        ctx.font = `bold ${Math.round(width * 0.038)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(currentPhoto.caption || 'Memory', 0, cardH / 2 - 16);

        ctx.restore();
      }

      // Overlays
      ctx.fillStyle = '#ec4899';
      ctx.font = `bold ${Math.round(width * 0.048)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(titleText, width / 2, height * 0.1);

      ctx.fillStyle = '#9333ea';
      ctx.font = `${Math.round(width * 0.028)}px sans-serif`;
      ctx.fillText(subtitleText, width / 2, height * 0.14);

      // Timeline indicator
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(0, height - 4, (frame / totalFrames) * width, 4);
    };

    if (isPlayingPreview) {
      const renderNext = () => {
        currentFrame = (currentFrame + 1) % totalFrames;
        setPreviewFrame(currentFrame);
        drawFrame(currentFrame);
        animationFrameRef.current = requestAnimationFrame(renderNext);
      };
      animationFrameRef.current = requestAnimationFrame(renderNext);
    } else {
      drawFrame(currentFrame);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlayingPreview, previewFrame, activePhotos, durationPerPhoto, aspectRatio, transition, titleText, subtitleText]);

  // Start Real Video Rendering & Export
  const handleStartRender = async () => {
    if (activePhotos.length === 0) {
      alert('Please select at least 1 photo for your birthday video.');
      return;
    }

    setIsRendering(true);
    setRenderError(null);
    setRenderProgress(0);
    setRenderStatus('Initializing video encoder...');
    setExportedVideoUrl(null);

    try {
      const result = await videoRenderer.renderVideo({
        photos: activePhotos,
        durationPerPhoto,
        aspectRatio,
        transition,
        titleText,
        subtitleText,
        includeAudio: includeMusic,
        onProgress: (pct, status) => {
          setRenderProgress(pct);
          setRenderStatus(status);
        },
      });

      setExportedVideoUrl(result.url);
      setExportedVideoExtension(result.extension);
      setIsRendering(false);
      triggerBirthdayConfetti();
    } catch (err: unknown) {
      console.error('Video rendering error:', err);
      setRenderError(err instanceof Error ? err.message : 'Video export failed');
      setIsRendering(false);
    }
  };

  return (
    <section id="videomaker" className="py-20 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold uppercase tracking-wider mb-3">
          <Film size={13} />
          <span>Cinematic Birthday Video Maker</span>
        </div>
        <h2 className="font-romantic text-4xl sm:text-5xl md:text-6xl text-rose-800 font-bold mb-3">
          Birthday Movie Studio
        </h2>
        <p className="font-handwriting text-2xl text-neutral-600 max-w-xl mx-auto">
          Craft, animate, and export a personalized movie slideshow for {recipientName} in full HD! 🎬✨
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls & Customization Panel (Left) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 scrapbook-shadow border border-pink-100 space-y-6">
          <div className="flex items-center justify-between border-b border-pink-100 pb-3">
            <h3 className="font-serif-vintage text-xl font-bold text-neutral-800 flex items-center gap-2">
              <Settings size={18} className="text-pink-500" />
              <span>Video Settings</span>
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 bg-pink-50 text-pink-600 rounded-full">
              {activePhotos.length} Photos Selected
            </span>
          </div>

          {/* Aspect Ratio Switcher */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Aspect Ratio
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  aspectRatio === '9:16'
                    ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-xs'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <Smartphone size={16} />
                <span>9:16 Story</span>
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  aspectRatio === '16:9'
                    ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-xs'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <Monitor size={16} />
                <span>16:9 Cinema</span>
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('1:1')}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  aspectRatio === '1:1'
                    ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-xs'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <Square size={16} />
                <span>1:1 Post</span>
              </button>
            </div>
          </div>

          {/* Duration & Transitions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5 flex items-center gap-1">
                <Clock size={12} />
                <span>Slide Time</span>
              </label>
              <select
                value={durationPerPhoto}
                onChange={(e) => setDurationPerPhoto(parseFloat(e.target.value))}
                className="w-full text-xs font-semibold p-2 border border-pink-200 rounded-xl bg-white"
              >
                <option value={1.5}>1.5 Seconds</option>
                <option value={2.0}>2.0 Seconds</option>
                <option value={2.5}>2.5 Seconds</option>
                <option value={3.5}>3.5 Seconds</option>
                <option value={5.0}>5.0 Seconds</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5 flex items-center gap-1">
                <Layers size={12} />
                <span>Transition</span>
              </label>
              <select
                value={transition}
                onChange={(e) => setTransition(e.target.value as TransitionType)}
                className="w-full text-xs font-semibold p-2 border border-pink-200 rounded-xl bg-white"
              >
                <option value="kenburns">Ken Burns (Pan/Zoom)</option>
                <option value="fade">Smooth Crossfade</option>
                <option value="slide">Cinematic Slide</option>
                <option value="zoom">Dynamic Zoom</option>
              </select>
            </div>
          </div>

          {/* Text Overlays */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Title Overlay
              </label>
              <input
                type="text"
                value={titleText}
                onChange={(e) => setTitleText(e.target.value)}
                className="w-full p-2 text-xs font-bold border border-pink-200 rounded-xl focus:outline-pink-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Subtitle Overlay
              </label>
              <input
                type="text"
                value={subtitleText}
                onChange={(e) => setSubtitleText(e.target.value)}
                className="w-full p-2 text-xs border border-pink-200 rounded-xl focus:outline-pink-400"
              />
            </div>
          </div>

          {/* Select Photos for Video */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Choose Photos ({activePhotos.length}/{photos.length})
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-[11px] font-bold text-pink-600 hover:underline"
                >
                  All
                </button>
                <span className="text-neutral-300">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-[11px] font-bold text-neutral-500 hover:underline"
                >
                  Min
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 border border-pink-100 rounded-xl">
              {photos.map((p) => {
                const isSelected = selectedPhotoIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePhotoSelect(p.id)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-pink-500 ring-2 ring-pink-300'
                        : 'border-neutral-200 opacity-40 hover:opacity-80'
                    }`}
                  >
                    <img src={p.url} alt={p.caption} className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-pink-500 text-white rounded-full p-0.5">
                        <CheckCircle size={10} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Render Action Button */}
          <button
            onClick={handleStartRender}
            disabled={isRendering || activePhotos.length === 0}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 text-white font-bold text-sm shadow-md hover:shadow-xl hover:scale-102 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isRendering ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Rendering Movie ({renderProgress}%)...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Render & Download Birthday Movie</span>
              </>
            )}
          </button>
        </div>

        {/* Live Preview Canvas & Export Display (Right) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative w-full max-w-sm sm:max-w-md bg-neutral-900 rounded-3xl p-4 shadow-2xl flex flex-col items-center border-4 border-pink-200">
            {/* Live Preview Canvas */}
            <div className="relative overflow-hidden rounded-2xl flex items-center justify-center bg-black/50 shadow-inner">
              <canvas
                ref={previewCanvasRef}
                className="max-h-[500px] w-auto object-contain rounded-xl"
              />

              {/* Play / Pause Overlay Button */}
              <button
                onClick={() => setIsPlayingPreview(!isPlayingPreview)}
                className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-pink-500/80 hover:bg-pink-600 text-white flex items-center justify-center backdrop-blur-xs shadow-lg transition-transform hover:scale-110"
                title={isPlayingPreview ? 'Pause Preview' : 'Play Preview'}
              >
                {isPlayingPreview ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
              </button>
            </div>

            {/* Preview Controls Bar */}
            <div className="w-full flex items-center justify-between mt-3 px-2 text-white/90 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-pink-500/30 text-pink-300 font-mono text-[10px]">
                  {aspectRatio}
                </span>
                <span>Live Canvas Preview</span>
              </div>
              <span className="text-neutral-400 font-mono">
                {((activePhotos.length * durationPerPhoto) || 0).toFixed(1)}s runtime
              </span>
            </div>
          </div>

          {/* Render Progress Modal / Card */}
          {isRendering && (
            <div className="w-full max-w-md mt-6 bg-white rounded-2xl p-5 border border-pink-200 shadow-xl text-center">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-600 mb-2">
                <span className="flex items-center gap-1.5 text-pink-600">
                  <RefreshCw size={13} className="animate-spin" />
                  <span>{renderStatus}</span>
                </span>
                <span>{renderProgress}%</span>
              </div>
              <div className="w-full h-3 bg-pink-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-200"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-2">
                Processing frames with high-fidelity canvas transitions...
              </p>
            </div>
          )}

          {/* Export Ready Download Button */}
          {exportedVideoUrl && (
            <div className="w-full max-w-md mt-6 bg-gradient-to-r from-emerald-50 to-pink-50 rounded-2xl p-5 border border-emerald-200 shadow-xl text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-sm mb-2">
                <CheckCircle size={18} />
                <span>Birthday Movie Ready!</span>
              </div>
              <p className="text-xs text-neutral-600 mb-4">
                Encoded in high quality ({exportedVideoExtension.toUpperCase()}). Ready to share with {recipientName}!
              </p>
              <div className="flex items-center justify-center gap-3">
                <a
                  href={exportedVideoUrl}
                  download={`buruseeee-birthday-slideshow.${exportedVideoExtension}`}
                  className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-transform hover:scale-105"
                >
                  <Download size={15} />
                  <span>Download Video ({exportedVideoExtension.toUpperCase()})</span>
                </a>
              </div>
            </div>
          )}

          {/* Render Error */}
          {renderError && (
            <div className="w-full max-w-md mt-6 bg-rose-50 rounded-2xl p-4 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{renderError}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
