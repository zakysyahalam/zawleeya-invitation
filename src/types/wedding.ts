export interface PersonInfo {
  name: string;
  nickname: string;
  father: string;
  mother: string;
  childOrder: string; // e.g. "Putra pertama dari"
  instagram?: string;
  photoUrl: string;
  bio?: string;
}

export interface EventDetail {
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "09:00 - 11:00 WIB"
  venue: string;
  address: string;
  mapsUrl: string;
  note?: string;
}

export interface MusicPreset {
  id: string;
  title: string;
  artist: string;
  genre: string;
  url: string; // Audio file url or procedural synth indicator
  isProcedural?: boolean;
  youtubeId?: string;
}

export interface MusicConfig {
  source: 'preset' | 'upload' | 'url';
  presetId: string;
  customUrl?: string;
  customAudioData?: string; // Base64 data URI if uploaded
  title: string;
  artist: string;
  autoplayOnOpen: boolean;
  loop: boolean;
  volume: number; // 0.0 - 1.0
}

export interface PhotoItem {
  id: string;
  url: string;
  caption?: string;
  ratio?: 'square' | 'wide' | 'portrait';
}

export interface StoryItem {
  id: string;
  year: string;
  title: string;
  description: string;
}

export interface BankGift {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  qrisUrl?: string;
}

export interface RSVPMessage {
  id: string;
  name: string;
  attendance: 'hadir' | 'tidak_hadir' | 'ragu';
  guestsCount: number;
  message: string;
  createdAt: string;
}

export type ThemePresetId = 'classic_gold' | 'sage_green' | 'rose_terracotta' | 'monochrome_luxury';

export interface ThemeSettings {
  id: ThemePresetId;
  name: string;
  primaryBg: string;
  secondaryBg: string;
  accentText: string;
  accentBg: string;
  cardBg: string;
  borderColor: string;
  ringColor: string;
}

export interface ReferencePhoto { url: string; caption?: string }

export interface WeddingData {
  /** Published text edits keyed by stable DOM text-node paths. */
  textOverrides?: Record<string, string>;
  title: string;
  weddingDate: string; // YYYY-MM-DDTHH:mm:ss for countdown
  quote: string;
  quoteSource: string;
  heroImage: string;
  groom: PersonInfo;
  bride: PersonInfo;
  events: {
    akad: EventDetail;
    resepsi: EventDetail;
  };
  dressCode: {
    title: string;
    description: string;
    colors: { name: string; hex: string }[];
  };
  music: MusicConfig;
  gallery: PhotoItem[];
  referencePhotos: { dressCode?: (ReferencePhoto | string)[]; menu?: (ReferencePhoto | string)[] };
  stories: StoryItem[];
  gifts: BankGift[];
  rsvps: RSVPMessage[];
  theme: ThemeSettings;
}
