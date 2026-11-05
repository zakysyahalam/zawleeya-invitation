import React from 'react';
import { useWedding } from '../../context/WeddingContext';
import { Instagram, Heart } from 'lucide-react';
import { motion } from 'motion/react';

export const CoupleSection: React.FC = () => {
  const { data } = useWedding();

  return (
    <section className="py-20 px-4 sm:px-6 max-w-5xl mx-auto space-y-16">
      {/* Holy Verse / Quote */}
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.25 }} transition={{ duration: 1.125, ease: [0.22, 1, 0.36, 1] }} className="max-w-2xl mx-auto text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="h-[1px] w-12 bg-amber-300" />
          <Heart className="w-4 h-4 text-amber-600 fill-amber-100" />
          <div className="h-[1px] w-12 bg-amber-300" />
        </div>
        <blockquote className="font-serif text-lg sm:text-xl text-stone-700 italic leading-relaxed">
          "{data.quote}"
        </blockquote>
        <p className="text-xs uppercase tracking-widest text-amber-800 font-semibold">
          {data.quoteSource}
        </p>
      </motion.div>

      {/* Intro Greetings */}
      <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.25 }} transition={{ duration: 1.125, delay: 0.12, ease: [0.22, 1, 0.36, 1] }} className="text-center max-w-xl mx-auto space-y-2">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">
          Keluarga yang Berbahagia
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          Dengan memohon rahmat dan ridha Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menjadi saksi awal niat baik kami menuju jenjang pernikahan:
        </p>
      </motion.div>

      {/* Couple Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
        {/* Groom Card */}
        <motion.div initial={{ opacity: 0, y: 34 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.18 }} transition={{ duration: 1.2, delay: 0.075, ease: [0.22, 1, 0.36, 1] }} whileHover={{ y: -5 }} className="p-8 rounded-2xl bg-white border border-stone-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center space-y-5">
          <div className="w-44 h-44 rounded-full overflow-hidden border-4 border-amber-100 shadow-inner">
            <img
              src={data.groom.photoUrl}
              alt={data.groom.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
            />
          </div>

          <div className="space-y-1">
            <h3 className="font-serif text-2xl font-bold text-stone-900">
              {data.groom.name}
            </h3>
            <p className="text-xs text-amber-700 font-medium tracking-wide">
              — {data.groom.nickname} —
            </p>
          </div>

          <div className="text-xs text-stone-600 space-y-1">
            <p className="font-light">{data.groom.childOrder}</p>
            <p className="font-semibold text-stone-800">{data.groom.father}</p>
            <p className="text-stone-400">&amp;</p>
            <p className="font-semibold text-stone-800">{data.groom.mother}</p>
          </div>

          {data.groom.bio && (
            <p className="text-xs text-stone-500 italic max-w-xs">
              "{data.groom.bio}"
            </p>
          )}

          {data.groom.instagram && (
            <a
              href={`https://instagram.com/${data.groom.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
            >
              <Instagram className="w-3.5 h-3.5 text-stone-500" />
              <span>@{data.groom.instagram.replace('@', '')}</span>
            </a>
          )}
        </motion.div>

        {/* Bride Card */}
        <motion.div initial={{ opacity: 0, y: 34 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.18 }} transition={{ duration: 1.2, delay: 0.27, ease: [0.22, 1, 0.36, 1] }} whileHover={{ y: -5 }} className="p-8 rounded-2xl bg-white border border-stone-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center space-y-5">
          <div className="w-44 h-44 rounded-full overflow-hidden border-4 border-amber-100 shadow-inner">
            <img
              src={data.bride.photoUrl}
              alt={data.bride.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
            />
          </div>

          <div className="space-y-1">
            <h3 className="font-serif text-2xl font-bold text-stone-900">
              {data.bride.name}
            </h3>
            <p className="text-xs text-amber-700 font-medium tracking-wide">
              — {data.bride.nickname} —
            </p>
          </div>

          <div className="text-xs text-stone-600 space-y-1">
            <p className="font-light">{data.bride.childOrder}</p>
            <p className="font-semibold text-stone-800">{data.bride.father}</p>
            <p className="text-stone-400">&amp;</p>
            <p className="font-semibold text-stone-800">{data.bride.mother}</p>
          </div>

          {data.bride.bio && (
            <p className="text-xs text-stone-500 italic max-w-xs">
              "{data.bride.bio}"
            </p>
          )}

          {data.bride.instagram && (
            <a
              href={`https://instagram.com/${data.bride.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
            >
              <Instagram className="w-3.5 h-3.5 text-stone-500" />
              <span>@{data.bride.instagram.replace('@', '')}</span>
            </a>
          )}
        </motion.div>
      </div>
    </section>
  );
};
