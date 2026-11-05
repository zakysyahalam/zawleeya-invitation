import React, { useState } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { Eye, Settings, Share2, Check, ExternalLink, UserCheck, Sparkles } from 'lucide-react';

export const ModeBar: React.FC = () => {
  const { mode, setMode, guestName, setGuestName, data } = useWedding();
  const [copied, setCopied] = useState(false);
  const [isEditingGuest, setIsEditingGuest] = useState(false);
  const [tempGuestName, setTempGuestName] = useState(guestName);

  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('mode');
    if (guestName && guestName !== 'Tamu Undangan') {
      url.searchParams.set('to', guestName);
    }
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSaveGuestName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempGuestName.trim()) {
      setGuestName(tempGuestName.trim());
      const url = new URL(window.location.href);
      url.searchParams.set('to', tempGuestName.trim());
      window.history.replaceState({}, '', url.toString());
    }
    setIsEditingGuest(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-900/95 text-stone-100 backdrop-blur-md border-b border-stone-800 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-full bg-amber-600/30 border border-amber-500/50 flex items-center justify-center text-amber-300 font-serif font-bold text-sm">
            {data.groom.nickname[0]}&{data.bride.nickname[0]}
          </div>
          <div>
            <h1 className="font-serif text-sm sm:text-base font-semibold tracking-wide text-stone-100 whitespace-nowrap">
              {data.title}
            </h1>
            <p className="text-[11px] text-stone-400 hidden sm:block">
              {mode === 'guest' ? 'Mode Tamu Undangan' : 'Mode Master / Pengelola Acara'}
            </p>
          </div>
        </div>

        {/* Center: Guest Name Selector in Guest Mode */}
        {mode === 'guest' ? (
          <div className="hidden md:flex items-center gap-2 bg-stone-800/80 px-3 py-1 rounded-md border border-stone-700 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-stone-400">Undangan Untuk:</span>
            {isEditingGuest ? (
              <form onSubmit={handleSaveGuestName} className="flex items-center gap-1">
                <input
                  type="text"
                  value={tempGuestName}
                  onChange={(e) => setTempGuestName(e.target.value)}
                  className="bg-stone-900 border border-amber-500/60 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2 py-0.5 bg-amber-600 text-white rounded text-[11px] hover:bg-amber-500 transition-colors"
                >
                  Simpan
                </button>
              </form>
            ) : (
              <button
                onClick={() => {
                  setTempGuestName(guestName);
                  setIsEditingGuest(true);
                }}
                className="font-medium text-amber-300 hover:text-amber-200 underline decoration-dotted underline-offset-2 flex items-center gap-1"
                title="Klik untuk mengganti nama tamu uji coba"
              >
                <span>{guestName}</span>
                <span className="text-[10px] text-stone-400">(Ubah)</span>
              </button>
            )}
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 text-xs text-amber-300/90 bg-amber-950/40 border border-amber-800/50 px-3 py-1 rounded-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Kustomisasi Lagu, Foto &amp; Data Tersimpan Otomatis</span>
          </div>
        )}

        {/* Right: Mode Switch & Share */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors whitespace-nowrap"
            title="Salin link undangan tamu saat ini"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-stone-400" />
                <span className="hidden sm:inline">Salin Link Tamu</span>
              </>
            )}
          </button>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-stone-800 rounded-lg border border-stone-700">
            <button
              onClick={() => setMode('guest')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                mode === 'guest'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Guest View</span>
            </button>
            <button
              onClick={() => setMode('master')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                mode === 'master'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Master Panel</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
