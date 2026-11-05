import React from 'react';
import { useWedding } from '../../context/WeddingContext';
import confetti from 'canvas-confetti';
import { MailOpen, Heart, Calendar } from 'lucide-react';

export const CoverEnvelope: React.FC = () => {
  const { data, guestName, openCover, playAudio } = useWedding();

  const handleOpen = () => {
    // Start audio directly from this user gesture so playback is not deferred
    // until after the invitation cover has opened.
    if (data.music.autoplayOnOpen) void playAudio();
    // Fire festive subtle gold and champagne confetti
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#F5E6BE', '#C5A059', '#FFFFFF'],
    });
    openCover();
  };

  const formattedDate = new Date(data.weddingDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-950 overflow-hidden">
      {/* Background with subtle zoom and romantic scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src={data.heroImage}
          alt="Wedding Cover"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-35 scale-105 filter blur-xs transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-stone-950/90" />
      </div>

      {/* Decorative Ornaments & Frame */}
      <div className="relative z-10 max-w-lg w-full mx-4 p-8 sm:p-10 text-center text-stone-100 border border-amber-500/30 rounded-2xl bg-stone-900/75 backdrop-blur-md shadow-2xl space-y-6">
        {/* Top Ornament */}
        <div className="flex items-center justify-center gap-3">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-amber-400" />
          <Heart className="w-4 h-4 text-amber-400 fill-amber-400/20" />
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-amber-400" />
        </div>

        <div>
          <p className="text-xs tracking-[0.25em] uppercase text-amber-300/80 font-sans font-light">
            Undangan Lamaran
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-amber-100 font-semibold mt-2 tracking-wide">
            {data.groom.nickname} &amp; {data.bride.nickname}
          </h2>
        </div>

        {/* Guest Recipient Box */}
        <div className="py-4 px-6 rounded-xl bg-stone-950/60 border border-amber-500/20 space-y-1">
          <p className="text-xs text-stone-400 font-light">
            Kepada Yth. Bapak/Ibu/Saudara/i:
          </p>
          <p className="text-base sm:text-lg font-serif font-medium text-amber-200">
            {guestName}
          </p>
          <p className="text-[11px] text-stone-500 italic">
            *Mohon maaf bila ada kesalahan penulisan nama/gelar
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-stone-400 font-sans">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>{formattedDate}</span>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleOpen}
            className="group relative inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium text-sm shadow-lg shadow-amber-900/30 transition-all transform active:scale-95 cursor-pointer ring-1 ring-amber-400/40"
          >
            <MailOpen className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span>Buka Undangan</span>
          </button>
        </div>

        <p className="text-[11px] text-stone-400">
          Dengan penuh hormat, kami mengundang Anda untuk hadir
        </p>
      </div>
    </div>
  );
};
