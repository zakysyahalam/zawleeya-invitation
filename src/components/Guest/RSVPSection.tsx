import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Utensils, Users, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useWedding } from '../../context/WeddingContext';

const MENUS = [
  'Ayam Saos Mentega',
  'Nasi Tongseng Sapi',
  'Crispy Chicken Wings',
  'Nasi Goreng Bistik Bumbu',
  'Lidah Sambal Ijo',
  'Katsu Mentai Butter Rice',
  'Tidak memesan makan/minum',
];
type Invitation = { token: string; name: string; quota: number; attendance: 'hadir' | 'tidak_hadir' | null; respondedAt?: string | null };
type GuestbookEntry = { id: string; name: string; avatarId?: string; message: string; createdAt: string };
type GuestbookAvatar = { id: string; label: string; emoji: string; color: string; image: string };
const DEFAULT_AVATARS: GuestbookAvatar[] = [{ id: 'cat-1', label: 'Milo', emoji: '😺', color: '#FDE7C7', image: '/avatars/cat-1.webp' }, { id: 'cat-2', label: 'Mimi', emoji: '😸', color: '#F8DDE7', image: '/avatars/cat-2.webp' }, { id: 'cat-3', label: 'Mochi', emoji: '😻', color: '#E5E7F9', image: '/avatars/cat-3.webp' }, { id: 'cat-4', label: 'Oyen', emoji: '😽', color: '#DDF2E5', image: '/avatars/cat-4.webp' }, { id: 'cat-5', label: 'Luna', emoji: '🙀', color: '#F2E4D8', image: '/avatars/cat-5.webp' }];

export const RSVPSection: React.FC = () => {
  const { data } = useWedding();
  const menuPhotos = data.referencePhotos?.menu || [];
  const token = useMemo(() => { const match = window.location.search.match(/[?&]invite=([^&]*)/); return match ? decodeURIComponent(match[1]) : ''; }, []);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<'hadir' | 'tidak_hadir' | null>(null);
  const [foodChoices, setFoodChoices] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [guestMessage, setGuestMessage] = useState('');
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>([]);
  const [avatars, setAvatars] = useState<GuestbookAvatar[]>(DEFAULT_AVATARS);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const loadGuestbook = () => fetch('/api/guestbook', { cache: 'no-store' }).then(r => r.ok ? r.json() : []).then(rows => setGuestbook(Array.isArray(rows) ? rows : [])).catch(() => {});
  useEffect(() => { void loadGuestbook(); fetch('/api/guestbook/avatars', { cache: 'no-store' }).then(r => r.ok ? r.json() : DEFAULT_AVATARS).then(rows => { if (Array.isArray(rows) && rows.length === 5) setAvatars(rows); }).catch(() => {}); }, []);

  useEffect(() => {
    if (!token) { setLoading(false); setMessage('Silakan gunakan link undangan khusus yang diberikan oleh keluarga.'); return; }
    fetch(`/api/invitations/${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async r => { const body = await r.json(); if (!r.ok) throw new Error(body.error || 'Undangan tidak ditemukan.'); setInvitation(body); })
      .catch(e => setMessage(e instanceof Error ? e.message : 'Gagal memuat undangan.'))
      .finally(() => setLoading(false));
  }, [token]);

  const submit = async () => {
    if (!invitation || !attendance) return;
    if (!selectedAvatar) { setMessage('Silakan pilih avatar kucing untuk ucapan Anda.'); return; }
    if (attendance === 'hadir' && (foodChoices.length !== invitation.quota || foodChoices.some(v => !v))) {
      setMessage(`Silakan pilih hidangan atau opsi tidak memesan untuk seluruh ${invitation.quota} orang.`); return;
    }
    setShowConfirm(false);
    setSaving(true); setMessage('');
    try {
      const response = await fetch(`/api/invitations/${encodeURIComponent(token)}/rsvp`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ attendance, foodChoices: attendance === 'hadir' ? foodChoices : [], message: guestMessage, avatarId: selectedAvatar }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Konfirmasi gagal dikirim.');
      setInvitation({ ...invitation, attendance, respondedAt: new Date().toISOString() });
      setMessage('Konfirmasi dan ucapan berhasil dikirim. Terima kasih!');
      await loadGuestbook();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Konfirmasi gagal dikirim.'); }
    finally { setSaving(false); }
  };

  return <section id="rsvp" className="py-20 px-4 sm:px-6 max-w-3xl mx-auto">
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.2 }} transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }} className="text-center mb-9 space-y-3">
      <p className="text-xs uppercase tracking-[0.25em] text-amber-800 font-semibold">Konfirmasi Kehadiran</p>
      <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900">Sampai Bertemu di Hari Lamaran</h2>
      <p className="text-sm text-stone-600">Mohon konfirmasi kehadiran dan pilihan hidangan sebelum acara.</p>
    </motion.div>
    <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.12 }} transition={{ duration: 1.125, delay: 0.09, ease: [0.22, 1, 0.36, 1] }} className="bg-white p-6 sm:p-9 rounded-3xl border border-stone-200 shadow-sm space-y-6">
      {loading ? <p className="text-center text-sm text-stone-500">Memuat undangan...</p> : !invitation ? <p className="text-center text-sm text-stone-600">{message}</p> : <>
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 flex items-center gap-3">
          <Users className="w-5 h-5 text-amber-800" />
          <div><p className="text-xs text-stone-500">Undangan untuk</p><p className="font-semibold text-stone-900">{invitation.name}</p><p className="text-xs text-stone-600">Kuota {invitation.quota} orang</p></div>
        </div>
        {invitation.respondedAt ? <div className="text-center py-6 space-y-3"><CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto"/><h3 className="font-serif text-2xl text-stone-900">Konfirmasi Terkirim</h3><p className="text-sm text-stone-600">Status: <b>{invitation.attendance === 'hadir' ? 'Hadir' : 'Tidak Hadir'}</b></p><p className="text-xs text-stone-500">Terima kasih atas konfirmasinya.</p></div> : <>
          <div className="space-y-3"><h3 className="font-semibold text-stone-900 text-sm">Apakah Anda akan hadir?</h3><div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => { setAttendance('hadir'); setMessage(''); }} className={`rounded-xl border px-4 py-4 text-sm font-semibold flex items-center justify-center gap-2 ${attendance === 'hadir' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-500'}`}><CheckCircle2 className="w-4 h-4"/>Hadir</button>
            <button type="button" onClick={() => { setAttendance('tidak_hadir'); setMessage(''); }} className={`rounded-xl border px-4 py-4 text-sm font-semibold flex items-center justify-center gap-2 ${attendance === 'tidak_hadir' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-700 border-stone-200 hover:border-stone-500'}`}><XCircle className="w-4 h-4"/>Tidak Hadir</button>
          </div></div>
          {attendance === 'hadir' && <div className="space-y-4 border-t border-stone-100 pt-5">{menuPhotos.length > 0 && <div className="space-y-2"><h3 className="text-sm font-semibold text-stone-900">Foto Menu</h3><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{menuPhotos.map((photo: any, i: number) => { const item = typeof photo === 'string' ? { url: photo, caption: '' } : photo; return <figure key={`${item.url}-${i}`} className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50"><img src={item.url} alt={item.caption || `Menu ${i + 1}`} className="h-32 w-full object-cover" />{item.caption && <figcaption className="p-2 text-xs text-stone-600">{item.caption}</figcaption>}</figure>; })}</div></div>}<div className="flex items-center gap-2"><Utensils className="w-5 h-5 text-amber-800"/><div><h3 className="font-semibold text-stone-900 text-sm">Pilihan Menu Konsumsi</h3><p className="text-xs text-stone-500">Pilih satu menu untuk setiap orang. Pilihan boleh berbeda.</p></div></div>
            {Array.from({ length: invitation.quota }, (_, i) => <div key={i} className="space-y-2"><label className="text-xs font-semibold text-stone-700">Menu untuk orang ke-{i + 1}</label><select value={foodChoices[i] || ''} onChange={e => setFoodChoices(prev => { const next = [...prev]; next[i] = e.target.value; return next; })} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"><option value="">Pilih hidangan</option>{MENUS.map(menu => <option key={menu} value={menu}>{menu === 'Tidak memesan makan/minum' ? menu : `${menu} & Ice Tropical Tea`}</option>)}</select></div>)}
          </div>}
          <div className="space-y-3 border-t border-stone-100 pt-5"><div><p className="text-sm font-semibold text-stone-900">Pilih Avatar Anda</p><p className="text-xs text-stone-500">Pilih satu karakter kucing untuk ditampilkan bersama ucapan.</p></div><div className="grid grid-cols-5 gap-2">{avatars.map(avatar => <button key={avatar.id} type="button" onClick={() => { setSelectedAvatar(avatar.id); setMessage(''); }} aria-pressed={selectedAvatar === avatar.id} className={`rounded-2xl border-2 p-2 flex flex-col items-center gap-1 transition ${selectedAvatar === avatar.id ? 'border-amber-600 bg-amber-50 ring-2 ring-amber-200' : 'border-stone-100 bg-stone-50 hover:border-amber-300'}`}><img src={avatar.image} alt={avatar.label} className="h-14 w-14 rounded-full object-cover ring-2 ring-white shadow-sm"/><span className="text-[10px] font-medium text-stone-600">{avatar.label}</span></button>)}</div></div><div className="space-y-2 border-t border-stone-100 pt-5"><label htmlFor="guest-message" className="block text-sm font-semibold text-stone-900">Ucapan &amp; Doa</label><textarea id="guest-message" value={guestMessage} onChange={e => setGuestMessage(e.target.value)} maxLength={1000} rows={4} placeholder="Tuliskan ucapan dan doa untuk kedua mempelai..." className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30" required /><p className="text-right text-[10px] text-stone-400">{guestMessage.length}/1000</p></div>
          {message && <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">{message}</p>}
          <button disabled={!attendance || !selectedAvatar || !guestMessage.trim() || saving} onClick={() => { if (attendance === 'hadir' && (foodChoices.length !== invitation.quota || foodChoices.some(v => !v))) { setMessage(`Silakan pilih hidangan atau opsi tidak memesan untuk seluruh ${invitation.quota} orang.`); return; } setMessage(''); setShowConfirm(true); }} className="w-full rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-40 text-white py-3.5 text-sm font-semibold">Kirim Konfirmasi</button>
        </>}
      </>}
    </motion.div>
    <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.12 }} transition={{ duration: 1.125, delay: 0.12, ease: [0.22, 1, 0.36, 1] }} className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
      <div className="text-center"><p className="text-xs uppercase tracking-[0.2em] text-amber-800 font-semibold">Buku Tamu</p><h3 className="font-serif text-2xl font-semibold text-stone-900">Ucapan &amp; Doa</h3><p className="text-xs text-stone-500">Ucapan dari keluarga dan sahabat dapat dibaca bersama.</p></div>
      {guestbook.length ? <div className="space-y-3">{[...guestbook].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(entry => { const avatar = avatars.find(item => item.id === entry.avatarId) || avatars[0] || DEFAULT_AVATARS[0]; return <article key={entry.id} className="flex items-start gap-3 rounded-2xl border border-stone-100 bg-stone-50 p-4"><img src={avatar.image} alt={avatar.label} className="h-12 w-12 shrink-0 rounded-full object-cover"/><div className="min-w-0 flex-1 space-y-1"><div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><p className="text-sm font-semibold text-stone-900">{entry.name}</p><time className="text-[10px] text-stone-400">{new Date(entry.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</time></div><p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-stone-700">{entry.message}</p></div></article>; })}</div> : <p className="text-center text-sm text-stone-500 py-4">Belum ada ucapan. Jadilah yang pertama memberikan doa.</p>}
    </motion.div>
    {showConfirm && (
      <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="rsvp-confirm-title">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></div>
          <h3 id="rsvp-confirm-title" className="text-center font-serif text-2xl font-semibold text-stone-900">Periksa Kembali Pilihan Anda</h3>
          <p className="text-center text-sm leading-relaxed text-stone-600">Mohon cek kembali pilihan kehadiran dan menu Anda. Opsi ini tidak dapat diubah setelah disubmit karena akan digunakan untuk pendataan peserta dan pemesanan konsumsi.</p>
          <div className="rounded-xl bg-stone-50 p-4 text-sm text-stone-700 space-y-1"><p><b>Nama:</b> {invitation?.name}</p><p><b>Kehadiran:</b> {attendance === 'hadir' ? 'Hadir' : 'Tidak Hadir'}</p><p><b>Ucapan:</b> {guestMessage}</p>{attendance === 'hadir' && foodChoices.map((food, i) => <p key={i}><b>Menu {i + 1}:</b> {food}</p>)}</div>
          <div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setShowConfirm(false)} className="rounded-xl border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-700">Periksa Lagi</button><button type="button" disabled={saving} onClick={() => void submit()} className="rounded-xl bg-amber-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Mengirim...' : 'Ya, Submit'}</button></div>
        </div>
      </div>
    )}
  </section>;
};
