import { useState, useRef, useEffect } from 'react';
import { 
  Mic, Square, Play, Pause, Trash2, Upload, Download, 
  AlertCircle 
} from 'lucide-react';

interface VoiceRecorderProps {
  recipientName: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ recipientName }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Timer while recording
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  // Start Voice Recording
  const startRecording = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        // Stop audio tracks to turn off microphone light
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
    } catch (err: unknown) {
      console.error('Microphone access error:', err);
      setErrorMessage(
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access or upload an existing recording below.'
          : 'Could not start microphone. You can upload an audio file instead!'
      );
    }
  };

  // Stop Voice Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Toggle playback
  const togglePlay = () => {
    if (!audioElementRef.current) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  // Delete recording
  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setIsPlaying(false);
      setRecordingSeconds(0);
    }
  };

  // Handle uploaded voice memo file
  const handleUploadedMemo = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setIsPlaying(false);
    setErrorMessage(null);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <section id="voice" className="py-20 px-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-bold uppercase tracking-wider mb-3">
          <Mic size={13} />
          <span>Personal Voice Memo</span>
        </div>
        <h2 className="font-romantic text-4xl sm:text-5xl md:text-6xl text-pink-700 font-bold mb-3">
          Voice Message for {recipientName}
        </h2>
        <p className="font-handwriting text-2xl text-neutral-600 max-w-lg mx-auto">
          Sometimes written words aren't enough—record or upload a voice note straight from your heart! 🎙️
        </p>
      </div>

      {/* Cassette Tape Card Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 scrapbook-shadow border border-pink-100 max-w-xl mx-auto">
        {/* Retro Cassette Tape Design */}
        <div className="relative bg-gradient-to-b from-[#2d2a32] to-[#1e1c22] rounded-2xl p-5 shadow-2xl border-4 border-pink-200 mb-8 text-white">
          {/* Cassette Label Header */}
          <div className="bg-pink-100 text-pink-900 rounded-lg p-2.5 mb-4 border border-pink-300 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
              <span>SIDE A: FOR {recipientName.toUpperCase()}</span>
            </div>
            <span className="text-[10px] font-mono text-pink-700 font-bold">STEREO 60 MIN</span>
          </div>

          {/* Cassette Window & Spools */}
          <div className="relative bg-[#16141a] rounded-xl p-3 border border-neutral-700 flex items-center justify-around h-24">
            {/* Left Spool */}
            <div
              className={`w-14 h-14 rounded-full border-4 border-neutral-500 flex items-center justify-center bg-white/10 ${
                isPlaying ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '3s', animationTimingFunction: 'linear' }}
            >
              <div className="w-6 h-6 rounded-full border-2 border-dashed border-pink-400" />
            </div>

            {/* Center Tape Window with timer / status */}
            <div className="text-center font-mono text-xs">
              <span className="text-pink-400 font-bold text-sm block">
                {isRecording ? formatTime(recordingSeconds) : audioUrl ? 'AUDIO READY' : 'NO TAPE'}
              </span>
              <span className="text-[10px] text-neutral-400 block mt-0.5">
                {isRecording ? 'RECORDING IN PROGRESS' : isPlaying ? 'PLAYING BACK' : 'STANDBY'}
              </span>
            </div>

            {/* Right Spool */}
            <div
              className={`w-14 h-14 rounded-full border-4 border-neutral-500 flex items-center justify-center bg-white/10 ${
                isPlaying ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '3s', animationTimingFunction: 'linear' }}
            >
              <div className="w-6 h-6 rounded-full border-2 border-dashed border-pink-400" />
            </div>
          </div>
        </div>

        {/* Recording & Playback Controls */}
        <div className="flex flex-col items-center gap-4">
          {!audioUrl ? (
            /* Record Controls */
            <div className="flex flex-col items-center gap-3">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="px-8 py-3.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-sm shadow-md hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                >
                  <Mic size={18} />
                  <span>Start Voice Recording</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="px-8 py-3.5 rounded-full bg-rose-600 text-white font-bold text-sm shadow-lg animate-pulse flex items-center gap-2"
                >
                  <Square size={16} className="fill-white" />
                  <span>Stop & Save Recording ({formatTime(recordingSeconds)})</span>
                </button>
              )}

              <span className="text-neutral-400 text-xs">or</span>

              {/* Upload existing voice memo button */}
              <button
                onClick={() => uploadInputRef.current?.click()}
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <Upload size={13} />
                <span>Upload Audio Memo (.mp3, .m4a, .wav)</span>
              </button>
              <input
                ref={uploadInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => handleUploadedMemo(e.target.files)}
              />
            </div>
          ) : (
            /* Replay & Action Controls */
            <div className="w-full flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform"
                  title={isPlaying ? 'Pause' : 'Play voice note'}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                </button>

                <a
                  href={audioUrl}
                  download={`voice-note-for-${recipientName.toLowerCase()}.webm`}
                  className="p-3 rounded-full bg-pink-100 text-pink-700 hover:bg-pink-200 transition-colors"
                  title="Download Voice Memo"
                >
                  <Download size={18} />
                </a>

                <button
                  onClick={deleteRecording}
                  className="p-3 rounded-full bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors"
                  title="Delete & Re-record"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <p className="text-xs text-neutral-500 font-sans">
                Voice message saved! Tap Play to listen or Download to keep forever.
              </p>
            </div>
          )}

          {/* Error Message notice */}
          {errorMessage && (
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-amber-600" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hidden audio element for recorded memo */}
      {audioUrl && (
        <audio
          ref={audioElementRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
        />
      )}
    </section>
  );
};
