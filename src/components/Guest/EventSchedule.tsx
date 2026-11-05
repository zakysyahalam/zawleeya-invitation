import React, { useState } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { Calendar, Clock, MapPin, ExternalLink, Sparkles, Shirt, X, Maximize2 } from 'lucide-react';
import { motion } from 'motion/react';

export const EventSchedule: React.FC = () => {
  const { data } = useWedding();
  const [activePhoto, setActivePhoto] = useState<{ url: string; caption?: string; title: string } | null>(null);
  const normalizePhoto = (photo: string | { url: string; caption?: string }, title: string) => typeof photo === 'string' ? { url: photo, title } : { ...photo, title };

  return (
    <section className="py-20 px-4 sm:px-6 bg-stone-100 border-y border-stone-200">
      <div className="max-w-5xl mx-auto space-y-14">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.2 }} transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }} className="text-center max-w-xl mx-auto space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-800 font-semibold">
            Waktu &amp; Lokasi Acara
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight">
            Acara Lamaran Zaky & Aulia
          </h2>
          <p className="text-sm text-stone-600">
            Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir pada:
          </p>
        </motion.div>

        {/* Satu kartu lokasi untuk keseluruhan acara lamaran */}
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.16 }} transition={{ duration: 1.125, ease: [0.22, 1, 0.36, 1] }} className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Lamaran</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-stone-900">{data.events.akad.title}</h3>
              <div className="space-y-3 text-sm text-stone-700">
                <div className="flex items-start gap-3"><Calendar className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" /><p className="font-medium">{data.events.akad.date}</p></div>
                <div className="flex items-start gap-3"><Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" /><p className="font-medium">{data.events.akad.time}</p></div>
                <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" /><div><p className="font-semibold text-stone-900">{data.events.akad.venue}</p><p className="text-xs text-stone-500 mt-0.5">{data.events.akad.address}</p></div></div>
              </div>
              {data.events.akad.note && <div className="p-3 bg-stone-50 rounded-lg text-xs text-stone-600 italic border border-stone-100">{data.events.akad.note}</div>}
            </div>
            <div className="pt-4 border-t border-stone-100"><a href={data.events.akad.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition-colors"><MapPin className="w-3.5 h-3.5 text-amber-400"/><span>Buka Petunjuk Lokasi (Google Maps)</span><ExternalLink className="w-3 h-3 text-stone-400"/></a></div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.14 }} transition={{ duration: 1.125, delay: 0.12, ease: [0.22, 1, 0.36, 1] }} className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-5">
          <div className="text-center"><p className="text-xs uppercase tracking-[0.2em] text-amber-800 font-semibold">Susunan Acara</p><h3 className="font-serif text-2xl font-bold text-stone-900 mt-1">Rundown Lamaran</h3></div>
          <div className="max-w-3xl mx-auto divide-y divide-stone-100">
            {[
              ['12.30–13.00', 'Kedatangan keluarga dan penyerahan hantaran'],
              ['13.00–13.10', 'Pembukaan oleh pihak perempuan (Wa Abah)'],
              ['13.10–13.20', 'Penyampaian maksud kedatangan (Papa Zaky / Zaky)'],
              ['13.20–13.30', 'Jawaban lamaran (Papa Aulia)'],
              ['13.30–13.40', 'Pemasangan cincin Aulia & Zaky (Mama Zaky & Aulia)'],
              ['13.40–13.50', 'Pembacaan doa (Wa Abah)'],
              ['13.50–14.30', 'Makan bersama'],
              ['14.30–14.45', 'Dokumentasi'],
              ['14.45–14.50', 'Penutup'],
            ].map(([time, activity]) => <div key={time} className="flex gap-4 py-3 text-sm"><span className="w-28 shrink-0 font-semibold text-amber-800 tabular-nums">{time}</span><span className="text-stone-700">{activity}</span></div>)}
          </div>
        </motion.div>

        {/* Dress Code Section */}
        {data.dressCode && (
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.15 }} transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }} className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                <Shirt className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif text-lg font-bold text-stone-900">
                  {data.dressCode.title}
                </h4>
                <p className="text-xs text-stone-600 max-w-lg mt-0.5">
                  {data.dressCode.description}
                </p>
              </div>
            </div>

            {/* Color Swatches */}
            <div className="flex items-center gap-3">
              {data.dressCode.colors.map((color, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 h-8 rounded-full shadow-sm border border-black/10"
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                  <span className="text-[10px] text-stone-500 font-medium whitespace-nowrap">
                    {color.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {(['dressCode'] as const).map((kind) => {
          const photos = (data.referencePhotos?.[kind] || []).map((photo, index) => normalizePhoto(photo, `${kind === 'dressCode' ? 'Dresscode' : 'Menu'} ${index + 1}`));
          if (!photos.length) return null;
          const heading = kind === 'dressCode' ? 'Referensi Dresscode' : 'Referensi Menu Konsumsi';
          return (
            <motion.div key={kind} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.12 }} transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }} className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
              <h4 className="font-serif text-lg font-bold text-stone-900 text-center">{heading}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                  <motion.button type="button" key={`${photo.url}-${index}`} onClick={() => setActivePhoto(photo)} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }} transition={{ duration: 0.9, delay: Math.min(index * 0.06, 0.3), ease: [0.22, 1, 0.36, 1] }} whileHover={{ y: -4 }} className="group relative overflow-hidden rounded-2xl cursor-pointer bg-stone-200 border border-stone-200 shadow-sm hover:shadow-md transition-all text-left h-64 sm:h-56 lg:h-[222px]">
                    <img src={photo.url} alt={photo.caption || photo.title} referrerPolicy="no-referrer" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end text-white">
                      <div className="flex items-center justify-between"><p className="text-xs font-serif italic truncate pr-2">{photo.caption || photo.title}</p><Maximize2 className="w-4 h-4 text-amber-300 shrink-0" /></div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
      {activePhoto && <div role="dialog" aria-modal="true" aria-label="Foto referensi" onClick={() => setActivePhoto(null)} className="fixed inset-0 z-[100] bg-black/95 p-4 sm:p-8 flex items-center justify-center animate-in fade-in duration-200"><button type="button" onClick={() => setActivePhoto(null)} className="absolute top-6 right-6 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50"><X className="w-6 h-6" /></button><div className="max-w-4xl max-h-[85vh] flex flex-col items-center" onClick={e => e.stopPropagation()}><img src={activePhoto.url} alt={activePhoto.caption || activePhoto.title} className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl" />{activePhoto.caption && <p className="text-stone-300 font-serif italic text-sm sm:text-base mt-4 text-center px-4">&quot;{activePhoto.caption}&quot;</p>}</div></div>}
    </section>
  );
};
