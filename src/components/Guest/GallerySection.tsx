import React, { useState } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { PhotoItem } from '../../types/wedding';
import { X, ChevronLeft, ChevronRight, Maximize2, Camera } from 'lucide-react';
import { motion } from 'motion/react';

export const GallerySection: React.FC = () => {
  const { data } = useWedding();
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setActivePhotoIndex(index);
  };

  const closeLightbox = () => {
    setActivePhotoIndex(null);
  };

  const nextPhoto = () => {
    if (activePhotoIndex !== null) {
      setActivePhotoIndex((activePhotoIndex + 1) % data.gallery.length);
    }
  };

  const prevPhoto = () => {
    if (activePhotoIndex !== null) {
      setActivePhotoIndex((activePhotoIndex - 1 + data.gallery.length) % data.gallery.length);
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto space-y-12">
      {/* Title */}
      <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.25 }} transition={{ duration: 1.125, ease: [0.22, 1, 0.36, 1] }} className="text-center max-w-xl mx-auto space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-amber-800 font-semibold">
          Galeri Kenangan
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight">
          Momen Indah Menuju Bahagia
        </h2>
        <p className="text-sm text-stone-600">
          Setiap bingkai mengabadikan langkah, tatap, dan cinta yang telah menyatukan kami.
        </p>
      </motion.div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.gallery.map((photo, index) => {
          // Dynamic spans for bento aesthetics
          const isWide = index === 0;
          return (
            <motion.div
              key={photo.id}
              onClick={() => openLightbox(index)}
              initial={{ opacity: 0, y: 30, scale: 0.985 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.12 }}
              transition={{ duration: 1.05, delay: Math.min(index * 0.07, 0.35), ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer bg-stone-200 border border-stone-200 shadow-sm hover:shadow-md transition-all ${
                isWide ? 'sm:col-span-2 sm:row-span-2 h-80 sm:h-[460px]' : 'h-64 sm:h-56 lg:h-[222px]'
              }`}
            >
              <img
                src={photo.url}
                alt={photo.caption || `Galeri foto ${index + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Hover overlay with caption */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end text-white">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-serif italic truncate pr-2">
                    {photo.caption || 'Momen Indah'}
                  </p>
                  <Maximize2 className="w-4 h-4 text-amber-300 shrink-0" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {activePhotoIndex !== null && data.gallery[activePhotoIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50 cursor-pointer"
            title="Tutup (ESC)"
          >
            <X className="w-6 h-6" />
          </button>

          {data.gallery.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevPhoto();
                }}
                className="absolute left-4 sm:left-8 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50 cursor-pointer"
                title="Foto Sebelumnya"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextPhoto();
                }}
                className="absolute right-4 sm:right-8 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50 cursor-pointer"
                title="Foto Selanjutnya"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div
            className="max-w-4xl max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={data.gallery[activePhotoIndex].url}
              alt={data.gallery[activePhotoIndex].caption || 'Foto Galeri'}
              referrerPolicy="no-referrer"
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
            />
            {data.gallery[activePhotoIndex].caption && (
              <p className="text-stone-300 font-serif italic text-sm sm:text-base mt-4 text-center px-4">
                "{data.gallery[activePhotoIndex].caption}"
              </p>
            )}
            <p className="text-stone-500 text-xs mt-1 tabular-nums">
              {activePhotoIndex + 1} dari {data.gallery.length} foto
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
