import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, RotateCcw, Sparkles, Download } from 'lucide-react';
import type { ScrapbookConfig } from '../types';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ScrapbookConfig;
  onSaveConfig: (newConfig: ScrapbookConfig) => void;
  onResetToDefaults: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onResetToDefaults,
}) => {
  const [recipientName, setRecipientName] = useState(config.recipientName);
  const [nickname, setNickname] = useState(config.nickname);
  const [senderName, setSenderName] = useState(config.senderName);
  const [birthdayDate, setBirthdayDate] = useState(config.birthdayDate);
  const [tagline, setTagline] = useState(config.tagline);
  const [spotifyUrl, setSpotifyUrl] = useState(config.spotifyPlaylistUrl);
  const [youtubeUrl, setYoutubeUrl] = useState(config.youtubePlaylistUrl);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig({
      ...config,
      recipientName,
      nickname,
      senderName,
      birthdayDate,
      tagline,
      spotifyPlaylistUrl: spotifyUrl,
      youtubePlaylistUrl: youtubeUrl,
    });
    onClose();
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'buruseeee-scrapbook-config.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 scrapbook-shadow border border-pink-200 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-100 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-serif-vintage text-xl font-bold text-neutral-800">
                Customize Scrapbook Content
              </h3>
              <p className="text-xs text-neutral-400">
                Personalize names, dates, links, and messages instantly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-pink-600 rounded-full hover:bg-pink-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block uppercase tracking-wider text-neutral-500 mb-1">
              Best Friend's Name / Nickname
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full p-2.5 border border-pink-200 rounded-xl focus:outline-pink-400 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block uppercase tracking-wider text-neutral-500 mb-1">
              Her Title / Nickname Phrase
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full p-2.5 border border-pink-200 rounded-xl focus:outline-pink-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block uppercase tracking-wider text-neutral-500 mb-1">
                Your Name / Sign-off
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full p-2.5 border border-pink-200 rounded-xl focus:outline-pink-400"
              />
            </div>
            <div>
              <label className="block uppercase tracking-wider text-neutral-500 mb-1">
                Birthday Date
              </label>
              <input
                type="text"
                value={birthdayDate}
                onChange={(e) => setBirthdayDate(e.target.value)}
                className="w-full p-2.5 border border-pink-200 rounded-xl focus:outline-pink-400"
              />
            </div>
          </div>

          <div>
            <label className="block uppercase tracking-wider text-neutral-500 mb-1">
              Cover Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full p-2.5 border border-pink-200 rounded-xl focus:outline-pink-400"
            />
          </div>

          <div>
            <label className="block uppercase tracking-wider text-neutral-500 mb-1">
              Spotify Playlist / Song URL
            </label>
            <input
              type="text"
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              className="w-full p-2.5 border border-pink-200 rounded-xl focus:outline-pink-400"
            />
          </div>

          <div>
            <label className="block uppercase tracking-wider text-neutral-500 mb-1">
              YouTube Music URL
            </label>
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="w-full p-2.5 border border-pink-200 rounded-xl focus:outline-pink-400"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-pink-100">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              title="Download configuration JSON backup"
            >
              <Download size={13} />
              <span>Backup JSON</span>
            </button>
            <button
              onClick={onResetToDefaults}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-600 hover:bg-rose-50"
              title="Reset to default text and photos"
            >
              <RotateCcw size={13} />
              <span>Reset Defaults</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-6 py-2 rounded-full bg-pink-500 text-white font-bold text-xs shadow-md hover:bg-pink-600 transition-colors"
            >
              <Save size={13} />
              <span>Apply Changes</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
