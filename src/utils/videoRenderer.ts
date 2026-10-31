import type { PhotoItem } from '../types';

export type AspectRatio = '9:16' | '16:9' | '1:1';
export type TransitionType = 'kenburns' | 'fade' | 'slide' | 'zoom';

export interface RenderOptions {
  photos: PhotoItem[];
  durationPerPhoto: number; // in seconds
  aspectRatio: AspectRatio;
  transition: TransitionType;
  titleText: string;
  subtitleText: string;
  includeAudio?: boolean;
  audioBlobOrUrl?: string | null;
  onProgress?: (progress: number, status: string) => void;
}

export class BirthdayVideoRenderer {
  private isCancelled = false;

  public cancel() {
    this.isCancelled = true;
  }

  public getSupportedMimeType(): string {
    const types = [
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  }

  public async renderVideo(options: RenderOptions): Promise<{ blob: Blob; url: string; extension: string }> {
    this.isCancelled = false;
    const { photos, durationPerPhoto, aspectRatio, transition, titleText, subtitleText, onProgress } = options;

    if (!photos || photos.length === 0) {
      throw new Error('Please select at least one photo for the video.');
    }

    // Determine dimensions based on aspect ratio
    let width = 1080;
    let height = 1920;
    if (aspectRatio === '16:9') {
      width = 1920;
      height = 1080;
    } else if (aspectRatio === '1:1') {
      width = 1080;
      height = 1080;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not initialize canvas context');

    onProgress?.(5, 'Preloading photos...');

    // Preload all images safely
    const loadedImages: HTMLImageElement[] = [];
    for (let i = 0; i < photos.length; i++) {
      if (this.isCancelled) throw new Error('Video rendering cancelled');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        img.onload = () => {
          loadedImages.push(img);
          resolve();
        };
        img.onerror = () => {
          console.warn('Failed to load image for video, using fallback', photos[i].url);
          loadedImages.push(img);
          resolve();
        };
        img.src = photos[i].url;
      });
      onProgress?.(5 + Math.floor((i / photos.length) * 15), `Loaded photo ${i + 1}/${photos.length}`);
    }

    const fps = 30;
    const framesPerPhoto = Math.round(durationPerPhoto * fps);
    const transitionFrames = Math.min(Math.round(0.8 * fps), Math.floor(framesPerPhoto / 2));
    const totalFrames = framesPerPhoto * loadedImages.length;

    // Setup MediaStream
    const canvasStream = canvas.captureStream(fps);
    const combinedStream = new MediaStream(canvasStream.getVideoTracks());

    // Setup Audio if requested
    let audioContext: AudioContext | null = null;
    let audioBuffer: AudioBuffer | null = null;
    let audioSourceNode: AudioBufferSourceNode | null = null;

    if (options.includeAudio && options.audioBlobOrUrl) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContext = new AudioCtx();
        const response = await fetch(options.audioBlobOrUrl);
        const arrayBuf = await response.arrayBuffer();
        audioBuffer = await audioContext.decodeAudioData(arrayBuf);

        const dest = audioContext.createMediaStreamDestination();
        audioSourceNode = audioContext.createBufferSource();
        audioSourceNode.buffer = audioBuffer;
        audioSourceNode.loop = true;
        audioSourceNode.connect(dest);
        audioSourceNode.start(0);

        const audioTrack = dest.stream.getAudioTracks()[0];
        if (audioTrack) {
          combinedStream.addTrack(audioTrack);
        }
      } catch (err) {
        console.warn('Could not attach audio track:', err);
      }
    }

    const mimeType = this.getSupportedMimeType();
    if (!mimeType) {
      throw new Error('MediaRecorder is not supported in this browser.');
    }
    const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';

    const recordedChunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: 4_500_000,
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    const recordingPromise = new Promise<{ blob: Blob; url: string; extension: string }>((resolve, reject) => {
      mediaRecorder.onstop = () => {
        if (audioSourceNode) {
          try { audioSourceNode.stop(); } catch (_) {}
        }
        if (audioContext) {
          try { audioContext.close(); } catch (_) {}
        }

        const finalBlob = new Blob(recordedChunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(finalBlob);
        resolve({ blob: finalBlob, url: videoUrl, extension });
      };
      mediaRecorder.onerror = (e) => reject(e);
    });

    mediaRecorder.start();

    // Render loop
    for (let frame = 0; frame < totalFrames; frame++) {
      if (this.isCancelled) {
        mediaRecorder.stop();
        throw new Error('Video rendering cancelled by user');
      }

      const photoIndex = Math.floor(frame / framesPerPhoto);
      const frameInPhoto = frame % framesPerPhoto;
      const progressInPhoto = frameInPhoto / framesPerPhoto;

      const currentImg = loadedImages[photoIndex];
      const nextImg = loadedImages[(photoIndex + 1) % loadedImages.length];
      const currentPhotoMeta = photos[photoIndex];

      // Draw background
      ctx.fillStyle = '#fdfaf6';
      ctx.fillRect(0, 0, width, height);

      // Subtle warm pastel gradient background
      const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.1, width / 2, height / 2, width * 0.8);
      grad.addColorStop(0, '#fff0f5');
      grad.addColorStop(0.5, '#fce7f3');
      grad.addColorStop(1, '#f3e8ff');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Determine transition alpha / transform
      let currentAlpha = 1;
      let nextAlpha = 0;
      const isTransitioning = frameInPhoto >= (framesPerPhoto - transitionFrames);
      if (isTransitioning) {
        const transProgress = (frameInPhoto - (framesPerPhoto - transitionFrames)) / transitionFrames;
        currentAlpha = 1 - transProgress;
        nextAlpha = transProgress;
      }

      // Draw photo with Ken Burns or transition
      const drawPhotoFrame = (img: HTMLImageElement, alpha: number, scaleOffset: number, dx = 0) => {
        if (!img.complete || img.naturalWidth === 0) return;
        ctx.save();
        ctx.globalAlpha = alpha;

        const maxPhotoW = width * 0.82;
        const maxPhotoH = height * 0.65;
        let scale = Math.min(maxPhotoW / img.naturalWidth, maxPhotoH / img.naturalHeight);

        if (transition === 'kenburns') {
          scale *= (1 + scaleOffset * 0.08);
        } else if (transition === 'zoom') {
          scale *= (1 + scaleOffset * 0.15);
        }

        const renderW = img.naturalWidth * scale;
        const renderH = img.naturalHeight * scale;
        const cx = width / 2 + dx;
        const cy = height * 0.45;

        // Draw Polaroid card backing
        const padX = 24;
        const padTop = 24;
        const padBottom = 80;
        const cardW = renderW + padX * 2;
        const cardH = renderH + padTop + padBottom;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((currentPhotoMeta?.rotation || 0) * (Math.PI / 180));

        // Drop shadow
        ctx.shadowColor = 'rgba(236, 72, 153, 0.25)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 15;

        // White card
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 12);
        ctx.fill();

        ctx.shadowColor = 'transparent';

        // Draw image
        const imgX = -cardW / 2 + padX;
        const imgY = -cardH / 2 + padTop;
        ctx.drawImage(img, imgX, imgY, renderW, renderH);

        // Polaroid tape at top
        ctx.fillStyle = 'rgba(254, 205, 211, 0.9)';
        ctx.fillRect(-60, -cardH / 2 - 12, 120, 24);

        // Photo Caption
        ctx.fillStyle = '#4b5563';
        ctx.font = `bold ${Math.round(width * 0.032)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(currentPhotoMeta?.caption || 'Bestie Memory', 0, cardH / 2 - 32);

        ctx.restore();
        ctx.restore();
      };

      // Draw current photo
      drawPhotoFrame(currentImg, currentAlpha, progressInPhoto);

      // If transitioning to next photo, draw next photo
      if (isTransitioning && nextImg) {
        const transProgress = (frameInPhoto - (framesPerPhoto - transitionFrames)) / transitionFrames;
        drawPhotoFrame(nextImg, nextAlpha, transProgress, transition === 'slide' ? (1 - transProgress) * width * 0.5 : 0);
      }

      // Draw Title and Subtitle overlays
      ctx.save();
      // Top banner
      ctx.fillStyle = '#ec4899';
      ctx.font = `bold ${Math.round(width * 0.045)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 8;
      ctx.fillText(titleText, width / 2, height * 0.09);

      // Subtitle
      ctx.fillStyle = '#9333ea';
      ctx.font = `${Math.round(width * 0.026)}px sans-serif`;
      ctx.fillText(subtitleText, width / 2, height * 0.13);

      // Bottom Sparkle / Birthday Stamp
      ctx.fillStyle = '#f43f5e';
      ctx.font = `bold ${Math.round(width * 0.028)}px sans-serif`;
      ctx.fillText(`✨ BURUSEEEE'S BIRTHDAY SLIDESHOW ✨`, width / 2, height * 0.88);

      // Cute animated hearts floating
      for (let h = 0; h < 6; h++) {
        const heartX = (width * 0.15) + (h * (width * 0.14));
        const heartY = (height * 0.93) + Math.sin((frame * 0.08) + h) * 12;
        ctx.font = `${Math.round(width * 0.03)}px sans-serif`;
        ctx.fillText(['💖', '🌸', '✨', '🎂', '💕', '🎀'][h % 6], heartX, heartY);
      }
      ctx.restore();

      // Progress reporting
      const pct = 20 + Math.round((frame / totalFrames) * 75);
      if (frame % 10 === 0 || frame === totalFrames - 1) {
        onProgress?.(pct, `Rendering video frames (${frame + 1}/${totalFrames})...`);
        await new Promise((r) => setTimeout(r, 2));
      }
    }

    onProgress?.(96, 'Finalizing video file...');
    mediaRecorder.stop();

    return recordingPromise;
  }
}
