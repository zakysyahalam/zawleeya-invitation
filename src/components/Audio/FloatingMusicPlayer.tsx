import React, { useState } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { Play, Pause, Volume2, VolumeX, Music, Disc3, ChevronDown, ChevronUp } from 'lucide-react';

export const FloatingMusicPlayer: React.FC = () => {
  const { isAudioPlaying, toggleAudio, audioVolume, setAudioVolume, currentSongInfo, isCoverOpen } = useWedding();
  const [isExpanded, setIsExpanded] = useState(false);

  // If cover envelope hasn't been opened yet, keep the player subtle or hidden until user clicks "Buka Undangan"
  if (!isCoverOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Pop-out detailed controls */}
      {isExpanded && (
        <div className="mb-2 w-72 bg-stone-900/95 backdrop-blur-md text-stone-100 p-4 rounded-xl border border-stone-800 shadow-xl space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between gap-2 border-b border-stone-800 pb-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Music className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-stone-100 truncate">
                  {currentSongInfo.title}
                </p>
                <p className="text-[11px] text-stone-400 truncate">
                  {currentSongInfo.artist}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-stone-400 hover:text-white p-1 rounded transition-colors"
              title="Tutup detail lagu"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 text-stone-300 text-xs">
            <button
              onClick={() => setAudioVolume(audioVolume > 0 ? 0 : 0.6)}
              className="text-stone-400 hover:text-white transition-colors"
            >
              {audioVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-amber-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioVolume}
              onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-stone-700 rounded-lg cursor-pointer"
            />
            <span className="text-[11px] tabular-nums text-stone-400 w-8 text-right">
              {Math.round(audioVolume * 100)}%
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
            <span>Status Musik:</span>
            <span className={isAudioPlaying ? 'text-emerald-400 font-medium' : 'text-stone-400'}>
              {isAudioPlaying ? 'Sedang Diputar' : 'Dihentikan'}
            </span>
          </div>
        </div>
      )}

      {/* Main floating circle button */}
      <div className="flex items-center gap-2">
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-stone-900/90 text-stone-200 backdrop-blur-md rounded-full border border-stone-700 text-xs shadow-md hover:bg-stone-800 transition-colors"
          >
            <Music className="w-3.5 h-3.5 text-amber-400" />
            <span className="max-w-[120px] truncate">{currentSongInfo.title}</span>
            <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
          </button>
        )}

        <button
          onClick={toggleAudio}
          className={`relative group w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform transform active:scale-95 ${
            isAudioPlaying
              ? 'bg-amber-600 text-white ring-4 ring-amber-500/30'
              : 'bg-stone-900 text-stone-300 border border-stone-700 ring-2 ring-stone-800'
          }`}
          aria-label={isAudioPlaying ? 'Jeda Musik' : 'Putar Musik'}
          title={isAudioPlaying ? 'Klik untuk menjeda lagu' : 'Klik untuk memutar lagu'}
        >
          {isAudioPlaying ? (
            <div className="relative flex items-center justify-center">
              <Disc3 className="w-7 h-7 text-white animate-spin-slow" />
              <Pause className="w-3.5 h-3.5 text-amber-200 absolute opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ) : (
            <Play className="w-5 h-5 ml-0.5 text-amber-400" />
          )}

          {/* Equalizer animation wave dots when playing */}
          {isAudioPlaying && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
