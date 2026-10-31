import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Edit3, Check, Heart, MessageCircle } from 'lucide-react';
import type { StoryChapter } from '../types';

interface StoryChaptersProps {
  chapters: StoryChapter[];
  onUpdateChapter: (updatedChapter: StoryChapter) => void;
}

export const StoryChapters: React.FC<StoryChaptersProps> = ({ chapters, onUpdateChapter }) => {
  const [editingChapterId, setEditingChapterId] = useState<number | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [tempSubtitle, setTempSubtitle] = useState('');
  const [tempContent0, setTempContent0] = useState('');
  const [tempContent1, setTempContent1] = useState('');
  const [tempFunnyMemory, setTempFunnyMemory] = useState('');

  const startEdit = (chapter: StoryChapter) => {
    setEditingChapterId(chapter.id);
    setTempTitle(chapter.title);
    setTempSubtitle(chapter.subtitle);
    setTempContent0(chapter.content[0] || '');
    setTempContent1(chapter.content[1] || '');
    setTempFunnyMemory(chapter.funnyMemory || '');
  };

  const saveEdit = (chapter: StoryChapter) => {
    const updated: StoryChapter = {
      ...chapter,
      title: tempTitle,
      subtitle: tempSubtitle,
      content: [tempContent0, tempContent1].filter(Boolean),
      funnyMemory: tempFunnyMemory,
    };
    onUpdateChapter(updated);
    setEditingChapterId(null);
  };

  return (
    <section id="story" className="py-20 px-4 max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles size={13} />
          <span>8 Chapters Of Pure Bestie Lore</span>
        </div>
        <h2 className="font-romantic text-4xl sm:text-5xl md:text-6xl text-purple-900 font-bold mb-3">
          Our Unforgettable Journey
        </h2>
        <p className="font-handwriting text-2xl text-neutral-600 max-w-xl mx-auto">
          Every chapter was written with laughter, tears, food comas, and an unbreakable bond 💖
        </p>
      </div>

      {/* Chapters Timeline List */}
      <div className="space-y-20 relative">
        {/* Scrapbook spine line for desktop */}
        <div className="hidden lg:block absolute left-1/2 top-4 bottom-4 w-1 bg-gradient-to-b from-pink-300 via-purple-300 to-peach-300 -translate-x-1/2 rounded-full dashed opacity-50" />

        {chapters.map((chapter, index) => {
          const isEven = index % 2 === 0;
          const isEditing = editingChapterId === chapter.id;

          const tapeClass =
            chapter.tapeColor === 'lavender'
              ? 'washi-tape-lavender'
              : chapter.tapeColor === 'peach'
              ? 'washi-tape-peach'
              : chapter.tapeColor === 'mint'
              ? 'washi-tape-mint'
              : 'washi-tape-pink';

          return (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7 }}
              className={`flex flex-col lg:flex-row items-center gap-8 ${
                isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
              }`}
            >
              {/* Text Card Spread */}
              <div className="w-full lg:w-1/2">
                <div className="relative bg-white/95 rounded-3xl p-6 sm:p-8 scrapbook-shadow border border-pink-100 transition-all hover:shadow-xl">
                  {/* Washi Tape on Top */}
                  <div className={`washi-tape ${tapeClass} -top-3 left-8 -rotate-2`} />

                  {/* Chapter number badge & edit button */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-pink-50 border border-pink-200/80 rounded-full text-xs font-bold text-pink-600 uppercase tracking-wider flex items-center gap-1.5">
                      <span>{chapter.sticker}</span>
                      <span>Chapter {chapter.id}</span>
                    </span>

                    <button
                      onClick={() => (isEditing ? saveEdit(chapter) : startEdit(chapter))}
                      className="flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg border transition-colors bg-neutral-50 text-neutral-600 hover:text-pink-600 hover:bg-pink-50 border-neutral-200"
                    >
                      {isEditing ? (
                        <>
                          <Check size={13} className="text-emerald-500" />
                          <span>Save</span>
                        </>
                      ) : (
                        <>
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Title & Subtitle */}
                  {isEditing ? (
                    <div className="space-y-3 mb-4">
                      <input
                        type="text"
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        className="w-full p-2 text-sm font-bold border rounded-lg focus:outline-pink-400"
                        placeholder="Chapter Title"
                      />
                      <input
                        type="text"
                        value={tempSubtitle}
                        onChange={(e) => setTempSubtitle(e.target.value)}
                        className="w-full p-2 text-xs border rounded-lg focus:outline-pink-400"
                        placeholder="Subtitle"
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="font-serif-vintage text-2xl sm:text-3xl font-bold text-neutral-800 mb-1 leading-snug">
                        {chapter.title}
                      </h3>
                      <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 mb-4">
                        {chapter.subtitle} • <span className="text-neutral-400">{chapter.dateRange}</span>
                      </p>
                    </>
                  )}

                  {/* Chapter Content / Paragraphs */}
                  {isEditing ? (
                    <div className="space-y-2 mb-4">
                      <textarea
                        value={tempContent0}
                        onChange={(e) => setTempContent0(e.target.value)}
                        rows={3}
                        className="w-full p-2 text-xs border rounded-lg focus:outline-pink-400 font-sans"
                        placeholder="Paragraph 1"
                      />
                      <textarea
                        value={tempContent1}
                        onChange={(e) => setTempContent1(e.target.value)}
                        rows={3}
                        className="w-full p-2 text-xs border rounded-lg focus:outline-pink-400 font-sans"
                        placeholder="Paragraph 2"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3 text-neutral-600 font-sans text-sm leading-relaxed mb-5">
                      {chapter.content.map((p, pIdx) => (
                        <p key={pIdx}>{p}</p>
                      ))}
                    </div>
                  )}

                  {/* Highlight Quote */}
                  <blockquote className="border-l-4 border-pink-400 pl-4 py-1.5 my-4 bg-pink-50/50 rounded-r-xl">
                    <p className="font-romantic text-2xl text-pink-700 italic font-semibold">
                      {chapter.highlightQuote}
                    </p>
                  </blockquote>

                  {/* Sticky Note: Funny Memory */}
                  <div className="mt-4 p-4 sticky-note rounded-xl border border-yellow-200/80 relative">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1">
                      <MessageCircle size={14} />
                      <span>Behind-The-Scenes Chaos:</span>
                    </div>
                    {isEditing ? (
                      <textarea
                        value={tempFunnyMemory}
                        onChange={(e) => setTempFunnyMemory(e.target.value)}
                        rows={2}
                        className="w-full p-2 text-xs border rounded-lg bg-white/70"
                        placeholder="Funny Memory or Inside Joke"
                      />
                    ) : (
                      <p className="font-handwriting text-lg text-neutral-800">
                        {chapter.funnyMemory}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Photo & Sticker Spread */}
              <div className="w-full lg:w-1/2 flex justify-center">
                <div className="relative max-w-sm w-full">
                  {/* Polaroid Card */}
                  <div
                    className="polaroid-frame rounded-2xl cursor-pointer"
                    style={{
                      transform: `rotate(${chapter.photos[0]?.rotation || (isEven ? -2 : 3)}deg)`,
                    }}
                  >
                    {/* Washi tape over photo */}
                    <div className={`washi-tape ${tapeClass} -top-3 right-10 rotate-3`} />

                    {/* Image container */}
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/60 shadow-inner">
                      <img
                        src={chapter.photos[0]?.url}
                        alt={chapter.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>

                    {/* Polaroid Bottom Caption */}
                    <div className="pt-3 text-center">
                      <p className="font-handwriting text-2xl text-neutral-700 font-bold">
                        {chapter.photos[0]?.caption || 'Bestie Memory'}
                      </p>
                      <p className="text-[11px] text-neutral-400 font-sans flex items-center justify-center gap-1 mt-0.5">
                        <Heart size={11} className="text-pink-400 fill-pink-400" />
                        <span>Chapter {chapter.id} Exclusive</span>
                      </p>
                    </div>
                  </div>

                  {/* Decorative Cute Stamp / Sticker */}
                  <div
                    className={`absolute -bottom-4 ${
                      isEven ? '-right-4' : '-left-4'
                    } w-16 h-16 rounded-full bg-gradient-to-tr from-pink-400 to-purple-400 flex items-center justify-center text-white text-2xl shadow-lg border-2 border-white select-none animate-float-slow`}
                  >
                    {chapter.sticker}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
