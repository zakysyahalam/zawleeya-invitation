import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { WeddingData, RSVPMessage, ThemeSettings } from '../types/wedding';
import { INITIAL_WEDDING_DATA, THEME_PRESETS } from '../utils/defaultData';
import { proceduralWeddingSynth, MUSIC_PRESETS } from '../utils/audioHelper';

interface WeddingContextType {
  data: WeddingData;
  updateData: (updater: Partial<WeddingData> | ((prev: WeddingData) => WeddingData)) => void;
  resetData: () => void;
  savePublishedData: () => Promise<void>;
  publishTextOverrides: (overrides: Record<string, string>) => Promise<void>;
  mode: 'guest' | 'master';
  setMode: (mode: 'guest' | 'master') => void;
  guestName: string;
  setGuestName: (name: string) => void;
  isCoverOpen: boolean;
  openCover: () => void;
  closeCover: () => void;
  isAudioPlaying: boolean;
  toggleAudio: () => void;
  playAudio: (presetId?: string, presetOverride?: { id: string; title?: string; artist?: string; url?: string; youtubeId?: string; isProcedural?: boolean }) => Promise<void>;
  pauseAudio: () => void;
  audioVolume: number;
  setAudioVolume: (vol: number) => void;
  currentSongInfo: { title: string; artist: string };
  addRSVP: (rsvp: Omit<RSVPMessage, 'id' | 'createdAt'>) => void;
  updateRSVP: (id: string, changes: Partial<Omit<RSVPMessage, 'id' | 'createdAt'>>) => void;
  deleteRSVP: (id: string) => void;
  exportConfigJson: () => void;
  importConfigJson: (jsonString: string) => boolean;
  setThemePreset: (presetId: string) => void;
}

const STORAGE_KEY = 'nusantara_wedding_data_v1';

const WeddingContext = createContext<WeddingContextType | undefined>(undefined);

// Compress every previously stored inline image before publishing. This also
// repairs older uploads that were saved before upload-time compression existed.
const optimizeInlineImage = (src: string): Promise<string> => new Promise((resolve) => {
  if (!src.startsWith('data:image/') || src.length < 180_000 || src.startsWith('data:image/svg')) {
    resolve(src);
    return;
  }
  const image = new Image();
  image.onload = () => {
    try {
      const maxDimension = 1400;
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) { resolve(src); return; }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const optimized = canvas.toDataURL('image/webp', 0.68);
      resolve(optimized.length < src.length ? optimized : src);
    } catch { resolve(src); }
  };
  image.onerror = () => resolve(src);
  image.src = src;
});

const optimizeImageFields = async (value: any): Promise<any> => {
  if (typeof value === 'string') return optimizeInlineImage(value);
  if (Array.isArray(value)) return Promise.all(value.map(optimizeImageFields));
  if (value && typeof value === 'object') {
    const entries = await Promise.all(Object.entries(value).map(async ([key, child]) => [key, await optimizeImageFields(child)] as const));
    return Object.fromEntries(entries);
  }
  return value;
};

export const WeddingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read initial data from localStorage if exists
  const [data, setData] = useState<WeddingData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const legacy = String(parsed.title || '').toLowerCase().includes('wedding') || ['Dimas', 'Raisa'].includes(parsed.groom?.nickname) || ['Dimas', 'Raisa'].includes(parsed.bride?.nickname);
        const source = legacy ? { ...parsed, title: INITIAL_WEDDING_DATA.title, weddingDate: INITIAL_WEDDING_DATA.weddingDate, quote: INITIAL_WEDDING_DATA.quote, quoteSource: INITIAL_WEDDING_DATA.quoteSource, groom: INITIAL_WEDDING_DATA.groom, bride: INITIAL_WEDDING_DATA.bride, events: INITIAL_WEDDING_DATA.events, dressCode: INITIAL_WEDDING_DATA.dressCode, gifts: [], rsvps: [] } : parsed;
        return {
          ...INITIAL_WEDDING_DATA,
          ...source,
          groom: { ...INITIAL_WEDDING_DATA.groom, ...(source.groom || {}) },
          bride: { ...INITIAL_WEDDING_DATA.bride, ...(source.bride || {}) },
          events: { ...INITIAL_WEDDING_DATA.events, ...(source.events || {}) },
          music: { ...INITIAL_WEDDING_DATA.music, ...(source.music || {}) },
          referencePhotos: { ...INITIAL_WEDDING_DATA.referencePhotos, ...(source.referencePhotos || {}), dressCode: Array.isArray(source.referencePhotos?.dressCode) ? source.referencePhotos.dressCode : source.referencePhotos?.dressCode ? [source.referencePhotos.dressCode] : [] },
          theme: source.theme || INITIAL_WEDDING_DATA.theme,
        };
      }
    } catch (e) {
      console.warn('Failed to parse saved wedding data', e);
    }
    return INITIAL_WEDDING_DATA;
  });

  // URL query parameter parsing for mode & recipient name
  const [mode, setModeState] = useState<'guest' | 'master'>('guest');
  const [remotePresets, setRemotePresets] = useState<any[]>(MUSIC_PRESETS);
  const youtubeFrameRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => { fetch('/api/music-presets').then(r => r.ok ? r.json() : null).then(items => { if (Array.isArray(items)) setRemotePresets(items); }).catch(() => {}); }, []);
  // Always hydrate the invitation from the latest published server version, so every guest sees the same content.
  useEffect(() => {
    fetch('/api/wedding-data', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(saved => {
        if (saved && typeof saved === 'object') {
          const legacyWedding = String(saved.title || '').toLowerCase().includes('wedding') || ['Dimas', 'Raisa'].includes(saved.groom?.nickname) || ['Dimas', 'Raisa'].includes(saved.bride?.nickname);
          const source = legacyWedding ? {
            ...saved,
            title: INITIAL_WEDDING_DATA.title,
            weddingDate: INITIAL_WEDDING_DATA.weddingDate,
            quote: INITIAL_WEDDING_DATA.quote,
            quoteSource: INITIAL_WEDDING_DATA.quoteSource,
            groom: { ...saved.groom, ...INITIAL_WEDDING_DATA.groom },
            bride: { ...saved.bride, ...INITIAL_WEDDING_DATA.bride },
            events: INITIAL_WEDDING_DATA.events,
            dressCode: INITIAL_WEDDING_DATA.dressCode,
            gifts: [],
            rsvps: [],
          } : saved;
          setData({
            ...INITIAL_WEDDING_DATA, ...source,
            groom: { ...INITIAL_WEDDING_DATA.groom, ...(source.groom || {}) },
            bride: { ...INITIAL_WEDDING_DATA.bride, ...(source.bride || {}) },
            events: { ...INITIAL_WEDDING_DATA.events, ...(source.events || {}) },
            music: { ...INITIAL_WEDDING_DATA.music, ...(source.music || {}) },
            referencePhotos: { ...INITIAL_WEDDING_DATA.referencePhotos, ...(source.referencePhotos || {}), dressCode: Array.isArray(source.referencePhotos?.dressCode) ? source.referencePhotos.dressCode : source.referencePhotos?.dressCode ? [source.referencePhotos.dressCode] : [] },
            theme: source.theme || INITIAL_WEDDING_DATA.theme,
          });
        }
      }).catch(err => console.warn('Could not load published invitation', err));
  }, []);

  const [guestName, setGuestName] = useState<string>('Tamu Undangan');
  const [isCoverOpen, setIsCoverOpen] = useState(false);

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioVolume, setAudioVolumeState] = useState<number>(data.music.volume || 0.65);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('Could not save to localStorage', err);
    }
  }, [data]);

  // Read URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const toParam = params.get('to');
    if (toParam) setGuestName(toParam);
    // Preserve literal '+' characters in the invitation token. URLSearchParams.get()
    // converts them to spaces, which changes the Redis key and breaks the lookup.
    const rawInvite = window.location.search.match(/[?&]invite=([^&]*)/);
    const inviteToken = rawInvite ? rawInvite[1] : '';
    if (inviteToken) fetch(`/api/invitations/${encodeURIComponent(inviteToken)}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(invite => { if (invite?.name) setGuestName(invite.name); }).catch(() => {});
    // URL parameters never grant Master access. Authentication is verified by the server.
  }, []);

  const setMode = (newMode: 'guest' | 'master') => {
    setModeState(newMode);
    const url = new URL(window.location.href);
    if (newMode === 'master') {
      url.searchParams.set('mode', 'master');
      setIsCoverOpen(true);
    } else {
      url.searchParams.set('mode', 'guest');
    }
    window.history.replaceState({}, '', url.toString());
  };

  // Audio Playback handling
  const getAudioSourceUrl = (presetId = data.music.presetId): { type: 'procedural' | 'url'; src?: string } => {
    if (data.music.source === 'upload' && data.music.customAudioData) {
      return { type: 'url', src: data.music.customAudioData };
    }
    if (data.music.source === 'url' && data.music.customUrl) {
      return { type: 'url', src: data.music.customUrl };
    }
    const preset = remotePresets.find((p) => p.id === presetId) || MUSIC_PRESETS.find((p) => p.id === presetId);
    if (preset?.isProcedural || !preset?.url || preset.url === 'procedural') {
      return { type: 'procedural' };
    }
    return { type: 'url', src: preset.url };
  };

  const playAudio = async (requestedPresetId?: string, presetOverride?: any) => {
    const targetPresetId = requestedPresetId || data.music.presetId;
    let availablePresets = remotePresets;
    let selectedPreset: any = presetOverride || availablePresets.find((p) => p.id === targetPresetId);

    // Refresh presets on demand so newly added YouTube songs are playable immediately,
    // even when the context mounted before the Master added them.
    if (!presetOverride && (requestedPresetId || data.music.source === 'preset') && targetPresetId && !selectedPreset) {
      try {
        const response = await fetch('/api/music-presets', { cache: 'no-store' });
        if (response.ok) {
          const items = await response.json();
          if (Array.isArray(items)) {
            availablePresets = items;
            setRemotePresets(items);
            selectedPreset = items.find((p: any) => p.id === targetPresetId);
          }
        }
      } catch (error) {
        console.warn('Could not refresh music presets', error);
      }
    }

    // Stop the previous source before starting a different one.
    if (youtubeFrameRef.current) {
      youtubeFrameRef.current.src = 'about:blank';
      youtubeFrameRef.current.remove();
      youtubeFrameRef.current = null;
    }
    proceduralWeddingSynth.stop();
    if (audioRef.current) audioRef.current.pause();

    if (selectedPreset?.youtubeId && (requestedPresetId || data.music.source === 'preset')) {
      const frame = document.createElement('iframe');
      frame.title = `YouTube music player: ${selectedPreset.title || 'selected song'}`;
      frame.allow = 'autoplay; encrypted-media; picture-in-picture';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      // Keep the YouTube player mounted for audio playback, but never show its
      // video/player UI over the invitation. Use a 200x200 player viewport and
      // move it off-screen rather than displaying a visible mini-video.
      frame.style.position = 'fixed';
      frame.style.width = '200px';
      frame.style.height = '200px';
      frame.style.left = '-220px';
      frame.style.bottom = '0';
      frame.style.zIndex = '-1';
      frame.style.border = '0';
      frame.style.borderRadius = '0';
      frame.style.opacity = '0';
      frame.style.pointerEvents = 'none';
      const videoId = encodeURIComponent(selectedPreset.youtubeId);
      // YouTube only loops a single video when its ID is also supplied as playlist.
      frame.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&controls=0&loop=1&playlist=${videoId}&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
      document.body.appendChild(frame);
      youtubeFrameRef.current = frame;
      setIsAudioPlaying(true);
      return;
    }

    const audioSource = (requestedPresetId || data.music.source === 'preset')
      ? (selectedPreset?.isProcedural || selectedPreset?.url === 'procedural'
          ? { type: 'procedural' as const }
          : selectedPreset?.url
            ? { type: 'url' as const, src: selectedPreset.url }
            : { type: 'procedural' as const })
      : getAudioSourceUrl(targetPresetId);

    if (audioSource.type === 'procedural') {
      proceduralWeddingSynth.start(audioVolume);
      setIsAudioPlaying(true);
    } else if (audioSource.src) {
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.loop = data.music.loop ?? false;
      const resolvedAudioSrc = new URL(audioSource.src, window.location.href).href;
      if (audioRef.current.src !== resolvedAudioSrc) audioRef.current.src = resolvedAudioSrc;
      audioRef.current.volume = audioVolume;
      try {
        await audioRef.current.play();
        setIsAudioPlaying(true);
      } catch (err) {
        console.warn('Audio play failed', err);
        setIsAudioPlaying(false);
      }
    }
  };

  useEffect(() => {
    if (isCoverOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overflow = 'hidden';
    const unlock = () => { if (data.music.autoplayOnOpen) void playAudio(); };
    // Browsers may block audible autoplay; retry on the first gesture without requiring
    // the guest to press the dedicated "Buka Undangan" button.
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    if (data.music.autoplayOnOpen) void playAudio();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [isCoverOpen, remotePresets, data.music]);
  const pauseAudio = () => {
    if (youtubeFrameRef.current?.contentWindow) youtubeFrameRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
    proceduralWeddingSynth.stop();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsAudioPlaying(false);
  };

  const toggleAudio = () => {
    if (isAudioPlaying) { pauseAudio(); return; }
    if (youtubeFrameRef.current?.contentWindow) {
      youtubeFrameRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
      setIsAudioPlaying(true); return;
    }
    playAudio();
  };

  const setAudioVolume = (vol: number) => {
    setAudioVolumeState(vol);
    proceduralWeddingSynth.setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  // Re-adjust audio volume when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioVolume;
    }
    proceduralWeddingSynth.setVolume(audioVolume);
  }, [audioVolume]);



  // Handle cover opening & autoplay
  const openCover = () => { setIsCoverOpen(true); };

  const closeCover = () => {
    setIsCoverOpen(false);
  };

  const updateData = (updater: Partial<WeddingData> | ((prev: WeddingData) => WeddingData)) => {
    setData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      return next;
    });
  };

  const savePublishedData = async () => {
    // Re-compress all inline images already present in the invitation, not only
    // the newly selected file (older gallery/menu/dresscode images may be large).
    const optimizedData = await optimizeImageFields(data) as WeddingData;
    const payload = JSON.stringify({ data: optimizedData });
    const payloadBytes = new Blob([payload]).size;
    // Vercel serverless requests have a lower practical body ceiling than the
    // Express JSON parser limit; leave headroom for headers/platform overhead.
    if (payloadBytes > 4 * 1024 * 1024) {
      throw new Error(`Ukuran data undangan setelah kompresi masih ${(payloadBytes / (1024 * 1024)).toFixed(2)} MB. Kurangi jumlah foto atau gunakan URL foto.`);
    }
    const response = await fetch('/api/wedding-data', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: payload,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 413) throw new Error(`Server menolak data undangan (${(payloadBytes / (1024 * 1024)).toFixed(2)} MB). Gunakan URL untuk foto berukuran besar atau kurangi jumlah foto.`);
      throw new Error(result.error || `Gagal menyimpan undangan (HTTP ${response.status}).`);
    }
    setData(optimizedData);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(optimizedData)); } catch {}
  };

  const publishTextOverrides = async (overrides: Record<string, string>) => {
    const nextData = { ...data, textOverrides: overrides };
    const response = await fetch('/api/wedding-data', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: nextData }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Gagal menyimpan perubahan teks.');
    setData(nextData);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData)); } catch {}
  };

  const resetData = () => {
    pauseAudio();
    localStorage.removeItem(STORAGE_KEY);
    setData(INITIAL_WEDDING_DATA);
  };

  const addRSVP = (rsvp: Omit<RSVPMessage, 'id' | 'createdAt'>) => {
    const newRecord: RSVPMessage = {
      ...rsvp,
      id: 'rsvp_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    updateData((prev) => ({
      ...prev,
      rsvps: [newRecord, ...prev.rsvps],
    }));
  };

  const updateRSVP = (id: string, changes: Partial<Omit<RSVPMessage, 'id' | 'createdAt'>>) => {
    updateData((prev) => ({ ...prev, rsvps: prev.rsvps.map((r) => r.id === id ? { ...r, ...changes } : r) }));
  };

  const deleteRSVP = (id: string) => {
    updateData((prev) => ({ ...prev, rsvps: prev.rsvps.filter((r) => r.id !== id) }));
  };

  const setThemePreset = (presetId: string) => {
    const preset = THEME_PRESETS[presetId];
    if (preset) {
      updateData({ theme: preset });
    }
  };

  const exportConfigJson = () => {
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', `undangan-${data.groom.nickname}-${data.bride.nickname}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importConfigJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.groom && parsed.bride && parsed.events) {
        setData(parsed);
        return true;
      }
    } catch (e) {
      console.error('Invalid json configuration', e);
    }
    return false;
  };

  return (
    <WeddingContext.Provider
      value={{
        data,
        updateData,
        resetData,
        savePublishedData,
        publishTextOverrides,
        mode,
        setMode,
        guestName,
        setGuestName,
        isCoverOpen,
        openCover,
        closeCover,
        isAudioPlaying,
        toggleAudio,
        playAudio,
        pauseAudio,
        audioVolume,
        setAudioVolume,
        currentSongInfo: {
          title: data.music.title,
          artist: data.music.artist,
        },
        addRSVP,
        updateRSVP,
        deleteRSVP,
        exportConfigJson,
        importConfigJson,
        setThemePreset,
      }}
    >
      {children}
    </WeddingContext.Provider>
  );
};

export const useWedding = () => {
  const context = useContext(WeddingContext);
  if (!context) {
    throw new Error('useWedding must be used within a WeddingProvider');
  }
  return context;
};
