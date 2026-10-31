import { useState } from 'react';
import { initialScrapbookConfig } from './config/scrapbookConfig';
import { defaultGalleryPhotos } from './utils/defaultPhotos';
import type { PhotoItem, StoryChapter, ScrapbookConfig } from './types';
import { FloatingDecorations } from './components/FloatingDecorations';
import { HeartCursor } from './components/HeartCursor';
import { HeaderNav } from './components/HeaderNav';
import { HeroEnvelope } from './components/HeroEnvelope';
import { StoryChapters } from './components/StoryChapters';
import { PhotoGallery } from './components/PhotoGallery';
import { FriendsWishesSection } from './components/FriendsWishesSection';
import { VideoMaker } from './components/VideoMaker';
import { MusicPlayer } from './components/MusicPlayer';
import { VoiceRecorder } from './components/VoiceRecorder';
import { GamesSection } from './components/GamesSection';
import { BirthdayCakeSection } from './components/BirthdayCakeSection';
import { OpenWhenLetters } from './components/OpenWhenLetters';
import { FinalSurprise } from './components/FinalSurprise';
import { ConfigModal } from './components/ConfigModal';
import { Heart } from 'lucide-react';

export function App() {
  const [config, setConfig] = useState<ScrapbookConfig>(initialScrapbookConfig);
  const [galleryPhotos, setGalleryPhotos] = useState<PhotoItem[]>(defaultGalleryPhotos);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Update a single chapter in state
  const handleUpdateChapter = (updatedChapter: StoryChapter) => {
    setConfig((prev) => ({
      ...prev,
      chapters: prev.chapters.map((c) => (c.id === updatedChapter.id ? updatedChapter : c)),
    }));
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetToDefaults = () => {
    if (confirm('Reset all scrapbook text and photos back to initial defaults?')) {
      setConfig(initialScrapbookConfig);
      setGalleryPhotos(defaultGalleryPhotos);
      setIsConfigModalOpen(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col font-sans selection:bg-[#F48FB1]/40 selection:text-[#75445A]">
      {/* Small Heart Cursor Trail Effect */}
      <HeartCursor />

      {/* Background Floating Scrapbook Emojis, Butterflies, Bows & Sparkles */}
      <FloatingDecorations />

      {/* Top Header Navigation with Baby Pink Bookmark Tabs */}
      <HeaderNav onOpenEditModal={() => setIsConfigModalOpen(true)} />

      {/* Main Scrapbook Body */}
      <main className="flex-1 relative z-10 space-y-16">
        {/* Feature 1: Animated Birthday Opening Envelope */}
        <HeroEnvelope config={config} />

        {/* Feature 2: 8 Friendship Story Chapters */}
        <StoryChapters
          chapters={config.chapters}
          onUpdateChapter={handleUpdateChapter}
        />

        {/* Feature 3: Photo Gallery (53 Real Memories, Polaroid Memory Wall, Lightbox) */}
        <PhotoGallery
          photos={galleryPhotos}
          onPhotosChange={setGalleryPhotos}
        />

        {/* Feature 4: MESSAGES FROM MY FAVOURITE PEOPLE 💌 (Friends' Video Wishes Section) */}
        <FriendsWishesSection recipientName={config.recipientName} />

        {/* Feature 5: Birthday Video Maker (Slideshow Canvas + MediaRecorder) */}
        <VideoMaker
          photos={galleryPhotos}
          recipientName={config.recipientName}
        />

        {/* Feature 6: Music Player with QR Code & Spotify / YouTube */}
        <MusicPlayer
          spotifyUrl={config.spotifyPlaylistUrl}
          youtubeUrl={config.youtubePlaylistUrl}
        />

        {/* Feature 7: Voice Message Recorder & Cassette Player */}
        <VoiceRecorder recipientName={config.recipientName} />

        {/* Feature 8: Four Bestie Games (Quiz, Match, Scratch, Wheel) */}
        <GamesSection
          quizQuestions={config.quizQuestions}
          wheelPrizes={config.wheelPrizes}
          recipientName={config.recipientName}
        />

        {/* Feature 9: Birthday Cake & Candle-Blowing Interaction */}
        <BirthdayCakeSection recipientName={config.recipientName} />

        {/* Feature 10: Open-When Letters */}
        <OpenWhenLetters letters={config.openWhenLetters} />

        {/* Feature 11: Grand Final Surprise (Gift Box, Spotlight Photo, Emotional Letter) */}
        <FinalSurprise
          recipientName={config.recipientName}
          senderName={config.senderName}
          finalLetter={config.finalLetter}
          onScrollToTop={handleScrollToTop}
        />
      </main>

      {/* In-App Live Editor Modal */}
      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={config}
        onSaveConfig={setConfig}
        onResetToDefaults={resetToDefaults}
      />

      {/* Baby Pink Scrapbook Footer */}
      <footer className="py-12 border-t border-[#F48FB1]/30 bg-white/80 backdrop-blur-xs text-center relative z-10 mt-20">
        <div className="max-w-xl mx-auto px-4 flex flex-col items-center">
          <div className="flex items-center gap-2 text-[#75445A] font-romantic text-3xl sm:text-4xl font-bold mb-1">
            <span>BURUSEEEE 🎀</span>
            <Heart size={18} className="fill-[#F48FB1] text-[#F48FB1] animate-pulse" />
          </div>
          <p className="font-handwriting text-2xl text-[#75445A]/90 mb-3">
            Handcrafted with endless love for the sweetest girl in the universe.
          </p>
          <p className="text-[11px] text-[#75445A]/60 font-sans uppercase tracking-widest">
            A Lifetime Friendship Contract • No Returns Allowed • Since 26.08.2016 ♾️
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
