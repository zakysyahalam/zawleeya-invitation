import React from 'react';
import { useWedding } from '../../context/WeddingContext';
import { Heart, Settings } from 'lucide-react';
import { motion } from 'motion/react';

export const FooterSection: React.FC = () => {
  const { data, setMode } = useWedding();

  return (
    <footer className="py-16 px-4 sm:px-6 bg-stone-900 text-stone-300 text-center space-y-6">
      <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.25 }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-center gap-2 text-amber-400">
          <Heart className="w-4 h-4 fill-amber-400" />
        </div>

        <h3 className="font-serif text-2xl sm:text-3xl text-amber-100 font-semibold">
          {data.groom.nickname} &amp; {data.bride.nickname}
        </h3>

        <p className="text-xs text-stone-400 leading-relaxed max-w-md mx-auto">
          Ungkapan terima kasih yang tulus dari kami dan kedua keluarga besar atas kehadiran serta doa restu yang diberikan.
        </p>

        <p className="font-serif text-sm text-amber-200/80 italic">
          Wassalamu'alaikum Warahmatullahi Wabarakatuh
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.25 }} transition={{ duration: 1.05, delay: 0.18, ease: [0.22, 1, 0.36, 1] }} className="pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between max-w-4xl mx-auto text-xs text-stone-500 gap-3">
        <p>© 2026 Lamaran {data.groom.nickname} &amp; {data.bride.nickname}. All rights reserved.</p>

        <button
          onClick={() => setMode('master')}
          className="inline-flex items-center gap-1.5 text-stone-400 hover:text-amber-300 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Buka Panel Master (Pengelola Undangan)</span>
        </button>
      </motion.div>
    </footer>
  );
};
