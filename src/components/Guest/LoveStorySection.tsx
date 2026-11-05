import React from 'react';
import { useWedding } from '../../context/WeddingContext';
import { Heart } from 'lucide-react';

export const LoveStorySection: React.FC = () => {
  const { data } = useWedding();

  if (!data.stories || data.stories.length === 0) return null;

  return (
    <section className="py-20 px-4 sm:px-6 bg-stone-50 border-t border-stone-200">
      <div className="max-w-4xl mx-auto space-y-14">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-800 font-semibold">
            Kisah Kami
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight">
            Perjalanan Dua Hati
          </h2>
          <p className="text-sm text-stone-600">
            Sebuah untaian waktu yang membawa kami saling menemukan dan berlabuh.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative border-l-2 border-amber-200 ml-4 sm:ml-32 space-y-10 pl-6 sm:pl-8">
          {data.stories.map((story) => (
            <div key={story.id} className="relative group">
              {/* Dot / Heart Marker */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-white border-2 border-amber-600 flex items-center justify-center text-amber-700 shadow-xs">
                <Heart className="w-2.5 h-2.5 fill-amber-500" />
              </div>

              {/* Year on Desktop */}
              <span className="hidden sm:block absolute -left-36 top-1.5 text-right w-24 font-serif text-lg font-bold text-amber-900 tabular-nums">
                {story.year}
              </span>

              {/* Content Box */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
                <span className="sm:hidden inline-block text-xs font-bold text-amber-800 font-serif">
                  Tahun {story.year}
                </span>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  {story.title}
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {story.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
