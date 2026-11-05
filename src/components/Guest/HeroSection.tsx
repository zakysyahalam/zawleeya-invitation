import React, { useState, useEffect } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { Calendar, Clock, ChevronDown, RotateCcw } from 'lucide-react';

const parseAkadDate = (dateValue: string, timeValue: string) => {
  const isoMatch = dateValue?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  let date: Date;
  if (isoMatch) date = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  else {
    const match = dateValue?.match(/(?:Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu),?\s+(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i);
    const months: Record<string,number> = { januari:0,februari:1,maret:2,april:3,mei:4,juni:5,juli:6,agustus:7,september:8,oktober:9,november:10,desember:11 };
    date = match ? new Date(Number(match[3]), months[match[2].toLowerCase()], Number(match[1])) : new Date();
  }
  const time = timeValue?.match(/(\d{1,2}):(\d{2})/);
  if (time) date.setHours(Number(time[1]), Number(time[2]), 0, 0);
  return date;
};

export const HeroSection: React.FC = () => {
  const { data, closeCover } = useWedding();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPassed: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const akadDate = parseAkadDate(data.events.akad.date, data.events.akad.time);
      const difference = +akadDate - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          isPassed: false,
        });
      } else {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isPassed: true,
        });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [data.events.akad.date, data.events.akad.time]);

  const eventDate = parseAkadDate(data.events.akad.date, data.events.akad.time);
  const formattedWeddingDate = eventDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Google Calendar URL generator
  const createGoogleCalendarUrl = () => {
    const title = encodeURIComponent(`Lamaran ${data.groom.nickname} & ${data.bride.nickname}`);
    const details = encodeURIComponent(
      `Acara lamaran ${data.groom.name} & ${data.bride.name}.\nLokasi: ${data.events.akad.venue}`
    );
    const location = encodeURIComponent(`${data.events.resepsi.venue}, ${data.events.resepsi.address}`);
    // Format YYYYMMDDTHHmmssZ
    const startDate = eventDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endDate = new Date(eventDate.getTime() + 3 * 3600 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center text-center text-stone-100 overflow-hidden px-4 py-16">
      {/* Background Image with Contrast Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src={data.heroImage}
          alt="Lamaran Zaky & Aulia"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover brightness-[0.45] scale-100 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/60 via-stone-900/30 to-stone-950/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-700">
        <div className="space-y-2">
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-amber-300/90 font-light">
            The Engagement Of
          </p>
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-amber-50 drop-shadow-md">
            {data.groom.nickname} <span className="text-amber-400 font-script font-normal text-5xl sm:text-7xl">&amp;</span> {data.bride.nickname}
          </h1>
          <p className="text-sm sm:text-base text-stone-200 font-serif italic pt-1">
            {formattedWeddingDate}
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="pt-2">
          <p className="text-xs uppercase tracking-widest text-amber-300/80 mb-3">
            {timeLeft.isPassed ? 'Hari Bahagia Telah Tiba' : 'Menghitung Hari Menuju Hari Bahagia'}
          </p>
          <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto">
            <div className="p-3 sm:p-4 rounded-xl bg-stone-950/60 border border-amber-500/20 backdrop-blur-sm shadow-md">
              <span className="block text-2xl sm:text-3xl font-serif font-bold text-amber-200 tabular-nums">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider">
                Hari
              </span>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-stone-950/60 border border-amber-500/20 backdrop-blur-sm shadow-md">
              <span className="block text-2xl sm:text-3xl font-serif font-bold text-amber-200 tabular-nums">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider">
                Jam
              </span>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-stone-950/60 border border-amber-500/20 backdrop-blur-sm shadow-md">
              <span className="block text-2xl sm:text-3xl font-serif font-bold text-amber-200 tabular-nums">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider">
                Menit
              </span>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-stone-950/60 border border-amber-500/20 backdrop-blur-sm shadow-md">
              <span className="block text-2xl sm:text-3xl font-serif font-bold text-amber-200 tabular-nums">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider">
                Detik
              </span>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href={createGoogleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600/90 hover:bg-amber-600 text-white text-xs sm:text-sm font-medium border border-amber-400/40 shadow-sm transition-all"
          >
            <Calendar className="w-4 h-4 text-amber-200" />
            <span>Simpan ke Google Calendar</span>
          </a>
          <button
            onClick={closeCover}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-stone-300 text-xs sm:text-sm border border-stone-700 transition-colors"
            title="Tampilkan kembali sampul pembuka"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
            <span>Lihat Sampul</span>
          </button>
        </div>

        {/* Scroll down indicator */}
        <div className="pt-8 flex flex-col items-center justify-center text-stone-400 text-xs animate-bounce">
          <span className="tracking-widest uppercase text-[10px]">Gulir ke bawah</span>
          <ChevronDown className="w-4 h-4 mt-1" />
        </div>
      </div>
    </section>
  );
};
