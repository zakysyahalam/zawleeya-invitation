import React, { useState } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { Gift, Copy, Check, CreditCard, QrCode, X, MessageSquareHeart } from 'lucide-react';

export const DigitalGiftSection: React.FC = () => {
  const { data } = useWedding();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeQrisUrl, setActiveQrisUrl] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <section className="py-20 px-4 sm:px-6 bg-stone-100 border-t border-stone-200">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800">
            <Gift className="w-6 h-6" />
          </div>
          <p className="text-xs uppercase tracking-[0.25em] text-amber-800 font-semibold">
            Tanda Kasih
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight">
            Amplop Digital
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            Doa restu Anda merupakan karunia terindah bagi kami. Namun jika Anda bermaksud memberikan tanda kasih, Anda dapat mengirimkannya melalui:
          </p>
        </div>

        {/* Bank & Gift Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {data.gifts.map((gift) => (
            <div
              key={gift.id}
              className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-amber-700" />
                    <span className="font-semibold text-sm text-stone-800">{gift.bankName}</span>
                  </div>
                  {gift.qrisUrl && (
                    <button
                      onClick={() => setActiveQrisUrl(gift.qrisUrl || null)}
                      className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 font-medium cursor-pointer"
                      title="Lihat Kode QRIS"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Lihat QRIS</span>
                    </button>
                  )}
                </div>

                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 space-y-1">
                  <p className="text-[11px] text-stone-500 uppercase tracking-wider">
                    Nomor Rekening / Akun:
                  </p>
                  <p className="font-mono text-lg font-bold text-stone-900 tracking-wider select-all">
                    {gift.accountNumber}
                  </p>
                  <p className="text-xs text-stone-600">
                    a.n. <span className="font-semibold text-stone-800">{gift.accountHolder}</span>
                  </p>
                </div>
              </div>

              <div>
                <button
                  onClick={() => handleCopy(gift.id, gift.accountNumber)}
                  className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium transition-all ${
                    copiedId === gift.id
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-stone-900 hover:bg-stone-800 text-white'
                  }`}
                >
                  {copiedId === gift.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Nomor Rekening Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-300" />
                      <span>Salin Nomor Rekening</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* WhatsApp confirmation option */}
        <div className="text-center pt-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Halo ${data.groom.nickname} & ${data.bride.nickname}, selamat atas pernikahannya! Saya ingin konfirmasi telah mengirimkan tanda kasih / amplop digital.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-stone-600 hover:text-amber-800 underline decoration-dotted underline-offset-4 transition-colors"
          >
            <MessageSquareHeart className="w-4 h-4 text-amber-600" />
            <span>Konfirmasi Kiriman Hadiah via WhatsApp</span>
          </a>
        </div>
      </div>

      {/* QRIS Modal */}
      {activeQrisUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setActiveQrisUrl(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveQrisUrl(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-serif text-lg font-bold text-stone-900">
              QRIS Amplop Digital
            </h3>
            <div className="border border-stone-200 rounded-xl overflow-hidden p-2 bg-stone-50">
              <img
                src={activeQrisUrl}
                alt="QRIS Code"
                className="w-full h-auto object-contain rounded"
              />
            </div>
            <p className="text-xs text-stone-500">
              Dapat dipindai melalui BCA Mobile, GoPay, OVO, Dana, ShopeePay, dan aplikasi perbankan lainnya.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
