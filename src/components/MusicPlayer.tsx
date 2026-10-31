import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  Music, Play, Pause, Volume2, VolumeX, Upload, ExternalLink, 
  QrCode, Radio, Heart 
} from 'lucide-react';
import { soundManager } from '../utils/audioSynthesizer';

interface MusicPlayerProps {
  spotifyUrl: string;
  youtubeUrl: string;
}

interface Track {
  id: string;
  name: string;
  artist: string;
  type: 'synth' | 'uploaded';
  url?: string;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ spotifyUrl, youtubeUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [selectedLinkType, setSelectedLinkType] = useState<'spotify' | 'youtube'>('spotify');
  
  const [tracks, setTracks] = useState<Track[]>([
    { id: 'track-1', name: 'Sweet Birthday Acoustic Chimes', artist: 'Bestie Melodies', type: 'synth' },
    { id: 'track-2', name: 'Pastel Dreams & Lo-Fi Hugs', artist: 'Antigravity Studio', type: 'synth' },
  ]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate QR Code dynamically
  useEffect(() => {
    const targetUrl = selectedLinkType === 'spotify' ? spotifyUrl : youtubeUrl;
    QRCode.toDataURL(targetUrl, {
      width: 240,
      margin: 2,
      color: {
        dark: '#ec4899', // Pink dots
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.warn('QR Code generation error:', err));
  }, [spotifyUrl, youtubeUrl, selectedLinkType]);

  const currentTrack = tracks[currentTrackIndex];

  // Play / Pause handling
  const togglePlay = () => {
    if (isPlaying) {
      if (currentTrack.type === 'synth') {
        soundManager.stopBackgroundMelody(setIsPlaying);
      } else if (audioElRef.current) {
        audioElRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      if (currentTrack.type === 'synth') {
        soundManager.startBackgroundMelody(setIsPlaying);
      } else if (audioElRef.current) {
        audioElRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    soundManager.setVolume(newVol);
    if (audioElRef.current) {
      audioElRef.current.volume = newVol;
    }
  };

  // Upload Custom Audio (.mp3, .wav, .m4a)
  const handleAudioUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const objectUrl = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    const newTrack: Track = {
      id: `uploaded-${Date.now()}`,
      name: cleanName,
      artist: 'Buruseeee & Bestie Special',
      type: 'uploaded',
      url: objectUrl,
    };

    setTracks([newTrack, ...tracks]);
    setCurrentTrackIndex(0);

    // Stop synth if running
    soundManager.stopBackgroundMelody();
    setIsPlaying(false);
  };

  // Switch track
  const selectTrack = (index: number) => {
    soundManager.stopBackgroundMelody();
    if (audioElRef.current) {
      audioElRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentTrackIndex(index);
  };

  return (
    <section id="music" className="py-20 px-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider mb-3">
          <Music size={13} />
          <span>Bestie Soundtrack & QR Jukebox</span>
        </div>
        <h2 className="font-romantic text-4xl sm:text-5xl md:text-6xl text-amber-900 font-bold mb-3">
          Our Melody Vault
        </h2>
        <p className="font-handwriting text-2xl text-neutral-600 max-w-xl mx-auto">
          Every memory has a song. Listen here or scan the QR code to open our Spotify playlist on your phone! 🎶
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white/90 rounded-3xl p-6 sm:p-10 scrapbook-shadow border border-pink-100">
        {/* Left: Vintage Vinyl Record & Controls (7 cols) */}
        <div className="md:col-span-7 flex flex-col items-center sm:items-start space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
            {/* Spinning Vinyl Record Disc */}
            <div className="relative group shrink-0">
              <div
                className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-neutral-900 p-2 shadow-2xl flex items-center justify-center border-4 border-neutral-800 ${
                  isPlaying ? 'animate-spin' : ''
                }`}
                style={{ animationDuration: '6s', animationTimingFunction: 'linear' }}
              >
                {/* Vinyl Grooves */}
                <div className="w-full h-full rounded-full border-2 border-neutral-700/60 flex items-center justify-center p-4">
                  <div className="w-full h-full rounded-full border-2 border-neutral-700/60 flex items-center justify-center p-4">
                    {/* Vinyl Center Label */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-pink-400 via-rose-400 to-purple-400 flex items-center justify-center text-white shadow-inner border-2 border-white/60">
                      <Heart size={18} className="fill-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tonearm needle decoration */}
              <div
                className={`absolute -top-3 -right-2 w-8 h-16 origin-top-right transition-transform duration-500 pointer-events-none ${
                  isPlaying ? 'rotate-18' : 'rotate-0'
                }`}
              >
                <div className="w-1.5 h-14 bg-neutral-400 rounded-full shadow-md ml-auto" />
                <div className="w-3 h-3 bg-neutral-600 rounded-full -mt-1 ml-auto mr-[-3px]" />
              </div>
            </div>

            {/* Track Info & Main Play Button */}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <span className="px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 font-mono text-[10px] uppercase font-bold tracking-wider inline-block mb-1.5">
                {currentTrack.type === 'synth' ? 'Built-in Melody' : 'Custom Bestie Song'}
              </span>
              <h3 className="font-serif-vintage text-xl font-bold text-neutral-800 truncate">
                {currentTrack.name}
              </h3>
              <p className="text-xs text-neutral-500 font-semibold mb-4">
                {currentTrack.artist}
              </p>

              {/* Play & Volume Bar */}
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                </button>

                {/* Volume Slider */}
                <div className="flex items-center gap-2 bg-pink-50/80 px-3 py-1.5 rounded-full border border-pink-100">
                  <button
                    onClick={() => handleVolumeChange(volume > 0 ? 0 : 0.8)}
                    className="text-neutral-500 hover:text-pink-600"
                  >
                    {volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-16 sm:w-20 accent-pink-500 cursor-pointer h-1.5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Playlist & Upload Row */}
          <div className="w-full space-y-2 pt-2 border-t border-pink-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Track List
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1"
              >
                <Upload size={12} />
                <span>Upload Audio File (.mp3)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => handleAudioUpload(e.target.files)}
              />
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {tracks.map((t, idx) => (
                <button
                  key={t.id}
                  onClick={() => selectTrack(idx)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    currentTrackIndex === idx
                      ? 'bg-pink-100/80 text-pink-700 font-bold'
                      : 'bg-neutral-50 text-neutral-600 hover:bg-pink-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Radio size={13} className={currentTrackIndex === idx ? 'text-pink-500' : 'text-neutral-400'} />
                    <span className="truncate">{t.name}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 shrink-0 ml-2">
                    {t.type === 'synth' ? 'Synthesizer' : 'MP3'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Dynamic Spotify QR Code & Link (5 cols) */}
        <div className="md:col-span-5 flex flex-col items-center bg-gradient-to-b from-pink-50/60 to-purple-50/60 p-6 rounded-2xl border border-pink-200/80 text-center">
          <div className="flex items-center gap-2 mb-3">
            <QrCode size={18} className="text-pink-600" />
            <h4 className="font-serif-vintage text-base font-bold text-neutral-800">
              Scan to Play on Phone
            </h4>
          </div>

          {/* Toggle between Spotify and YouTube QR */}
          <div className="flex rounded-full bg-white p-1 border border-pink-200 mb-4 text-xs font-bold shadow-xs">
            <button
              onClick={() => setSelectedLinkType('spotify')}
              className={`px-3 py-1 rounded-full transition-colors ${
                selectedLinkType === 'spotify'
                  ? 'bg-emerald-500 text-white'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              Spotify Playlist
            </button>
            <button
              onClick={() => setSelectedLinkType('youtube')}
              className={`px-3 py-1 rounded-full transition-colors ${
                selectedLinkType === 'youtube'
                  ? 'bg-rose-500 text-white'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              YouTube Music
            </button>
          </div>

          {/* Rendered QR Code */}
          <div className="p-3 bg-white rounded-2xl shadow-md border-2 border-pink-200 mb-3">
            {qrCodeDataUrl ? (
              <img src={qrCodeDataUrl} alt="Playlist QR Code" className="w-36 h-36 sm:w-40 sm:h-40" />
            ) : (
              <div className="w-40 h-40 flex items-center justify-center text-xs text-neutral-400">
                Generating QR...
              </div>
            )}
          </div>

          <p className="text-[11px] text-neutral-500 font-sans max-w-xs mb-3">
            Point your mobile camera at this code to immediately open our curated birthday soundtrack!
          </p>

          {/* Direct Link button */}
          <a
            href={selectedLinkType === 'spotify' ? spotifyUrl : youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-pink-200 text-xs font-bold text-pink-600 hover:bg-pink-50 shadow-xs transition-transform hover:scale-105"
          >
            <span>Open in {selectedLinkType === 'spotify' ? 'Spotify' : 'YouTube'}</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Hidden audio element for custom uploaded audio files */}
      {currentTrack.type === 'uploaded' && currentTrack.url && (
        <audio
          ref={audioElRef}
          src={currentTrack.url}
          onEnded={() => setIsPlaying(false)}
        />
      )}
    </section>
  );
};
