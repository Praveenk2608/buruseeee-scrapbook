import React, { useState, useEffect } from 'react';
import { BookOpen, Camera, Film, Music, Mic, Gamepad2, Cake, Mail, Gift, Edit3, Volume2, VolumeX, Heart } from 'lucide-react';
import { soundManager } from '../utils/audioSynthesizer';

interface HeaderNavProps {
  onOpenEditModal: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ onOpenEditModal }) => {
  const [scrolled, setScrolled] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleSound = () => {
    if (isPlayingAudio) {
      soundManager.stopBackgroundMelody(setIsPlayingAudio);
    } else {
      soundManager.startBackgroundMelody(setIsPlayingAudio);
    }
  };

  const navItems = [
    { label: 'Story', href: '#story', icon: BookOpen },
    { label: 'Gallery', href: '#gallery', icon: Camera },
    { label: 'Wishes 💌', href: '#friends-wishes', icon: Mail },
    { label: 'Video Maker', href: '#videomaker', icon: Film },
    { label: 'Music', href: '#music', icon: Music },
    { label: 'Voice Memo', href: '#voice', icon: Mic },
    { label: 'Arcade', href: '#games', icon: Gamepad2 },
    { label: 'Birthday Cake', href: '#cake', icon: Cake },
    { label: 'Letters', href: '#letters', icon: Heart },
    { label: 'Gift', href: '#surprise', icon: Gift },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md shadow-xs border-b border-[#F48FB1]/20 py-2.5'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Scrapbook Stamp Logo */}
        <a href="#envelope" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F48FB1] to-[#E8DDF8] flex items-center justify-center text-white shadow-md transform group-hover:rotate-12 transition-transform border border-white">
            <span className="font-script text-2xl font-bold">B</span>
          </div>
          <div>
            <span className="font-romantic text-2xl md:text-3xl font-bold text-[#75445A] tracking-wide block leading-none">
              Buruseeee 🎀
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#F48FB1] block">
              Baby Pink Birthday Scrapbook
            </span>
          </div>
        </a>

        {/* Navigation Ribbon Tabs for Desktop */}
        <nav className="hidden xl:flex items-center gap-1 bg-[#FFF0F5] px-3 py-1.5 rounded-full border border-[#F48FB1]/30 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#75445A] rounded-full transition-all hover:bg-white hover:text-[#F48FB1] hover:shadow-xs"
              >
                <Icon size={12} className="text-[#F48FB1]" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Action Controls: Audio toggle & Edit modal */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            aria-label="Toggle background music"
            className={`p-2 rounded-full border transition-all ${
              isPlayingAudio
                ? 'bg-[#F48FB1] text-white border-[#F48FB1] shadow-md animate-pulse'
                : 'bg-white text-[#75445A] border-[#F48FB1]/30 hover:bg-[#FFF0F5]'
            }`}
            title={isPlayingAudio ? 'Pause sweet background tune' : 'Play sweet background tune'}
          >
            {isPlayingAudio ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            onClick={onOpenEditModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#F48FB1] to-[#F06292] text-white text-xs font-bold rounded-full shadow-xs hover:shadow-md hover:scale-105 transition-all"
            title="Edit Scrapbook Text & Names"
          >
            <Edit3 size={13} />
            <span className="hidden sm:inline">Edit Text</span>
          </button>
        </div>
      </div>
    </header>
  );
};
