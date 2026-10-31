export interface PhotoItem {
  id: string;
  url: string;
  caption: string;
  date?: string;
  location?: string;
  tag?: string;
  rotation?: number; // Subtle scrapbook tilt in degrees (-4 to 4)
  tapeColor?: 'pink' | 'lavender' | 'peach' | 'mint';
  pinned?: boolean;
}

export interface StoryChapter {
  id: number;
  title: string;
  subtitle: string;
  dateRange: string;
  content: string[];
  highlightQuote: string;
  sticker: string;
  tapeColor: 'pink' | 'lavender' | 'peach' | 'mint';
  photos: PhotoItem[];
  funnyMemory: string;
}

export interface OpenWhenLetter {
  id: string;
  title: string;
  emoji: string;
  envelopeColor: string;
  teaser: string;
  letter: string;
  quote: string;
  sticker: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  funnyFailMessage: string;
}

export interface WheelPrize {
  id: number;
  text: string;
  emoji: string;
  color: string;
  description: string;
}

export interface ScrapbookConfig {
  recipientName: string;
  nickname: string;
  senderName: string;
  birthdayDate: string;
  turningAge: string;
  tagline: string;
  heroGreeting: string;
  spotifyPlaylistUrl: string;
  youtubePlaylistUrl: string;
  chapters: StoryChapter[];
  openWhenLetters: OpenWhenLetter[];
  quizQuestions: QuizQuestion[];
  wheelPrizes: WheelPrize[];
  finalLetter: {
    title: string;
    paragraphs: string[];
    signOff: string;
    favouriteMemoryPhoto: PhotoItem;
  };
}
