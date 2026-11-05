import React, { useState, useRef, useEffect } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { PhotoItem } from '../../types/wedding';
import {
  Music,
  Image as ImageIcon,
  User,
  Share2,
  MessageSquare,
  Sparkles,
  Play,
  Pause,
  Upload,
  Plus,
  Trash2,
  Pencil,
  Check,
  Eye,
  Download,
  RotateCcw,
  Volume2,
  Link as LinkIcon,
  Copy,
  ShieldCheck,
  Mail,
} from 'lucide-react';

const toDateInputValue = (value: string) => {
  if (!value) return '';
  const iso = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return `${parsed.getFullYear()}-${String(parsed.getMonth()+1).padStart(2,'0')}-${String(parsed.getDate()).padStart(2,'0')}`;
  const match = value.match(/(?:Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu),?\s+(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i);
  if (!match) return '';
  const months: Record<string,string> = { januari:'01',februari:'02',maret:'03',april:'04',mei:'05',juni:'06',juli:'07',agustus:'08',september:'09',oktober:'10',november:'11',desember:'12' };
  return `${match[3]}-${months[match[2].toLowerCase()]}-${match[1].padStart(2,'0')}`;
};
const formatDateForDisplay = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

export const MasterDashboard: React.FC = () => {
  const [musicPresets, setMusicPresets] = useState<any[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [presetBusy, setPresetBusy] = useState(false);
  const [presetMessage, setPresetMessage] = useState('');
  useEffect(() => { fetch('/api/music-presets').then(r => r.ok ? r.json() : null).then(items => { if (Array.isArray(items)) setMusicPresets(items); }).catch(() => {}); }, []);
  const addYoutubePreset = async () => {
    setPresetBusy(true); setPresetMessage('');
    try { const response = await fetch('/api/music-presets', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: youtubeUrl }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Gagal menambahkan preset.'); setMusicPresets(prev => [...prev, result]); setYoutubeUrl(''); setPresetMessage('Preset berhasil ditambahkan.'); } catch (e) { setPresetMessage(e instanceof Error ? e.message : 'Gagal menambahkan preset.'); } finally { setPresetBusy(false); }
  };
  const deleteYoutubePreset = async (id: string) => {
    if (!window.confirm('Hapus preset lagu ini?')) return; setPresetBusy(true); setPresetMessage('');
    try { const response = await fetch(`/api/music-presets/${encodeURIComponent(id)}`, { method: 'DELETE' }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Gagal menghapus preset.'); setMusicPresets(result); setPresetMessage('Preset dihapus.'); } catch (e) { setPresetMessage(e instanceof Error ? e.message : 'Gagal menghapus preset.'); } finally { setPresetBusy(false); }
  };
  const {
    data,
    updateData,
    resetData,
    setMode,
    isAudioPlaying,
    toggleAudio,
    playAudio,
    pauseAudio,
    audioVolume,
    setAudioVolume,
    updateRSVP,
    deleteRSVP,
    exportConfigJson,
    importConfigJson,
    savePublishedData,
  } = useWedding();

  const [activeTab, setActiveTab] = useState<'music' | 'photos' | 'details' | 'rsvps' | 'share' | 'whitelist'>('share');
  const [whitelistEmails, setWhitelistEmails] = useState<string[]>([]);
  const [whitelistInput, setWhitelistInput] = useState('');
  const [whitelistBusy, setWhitelistBusy] = useState(false);
  const [whitelistMessage, setWhitelistMessage] = useState<{ text: string; error: boolean } | null>(null);

  const loadWhitelist = async () => {
    setWhitelistBusy(true); setWhitelistMessage(null);
    try {
      const response = await fetch('/api/master/whitelist', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal memuat whitelist email.');
      setWhitelistEmails(Array.isArray(result) ? result : []);
    } catch (error) { setWhitelistMessage({ text: error instanceof Error ? error.message : 'Gagal memuat whitelist email.', error: true }); }
    finally { setWhitelistBusy(false); }
  };

  useEffect(() => { if (activeTab === 'whitelist') void loadWhitelist(); }, [activeTab]);

  const addWhitelistEmail = async () => {
    const email = whitelistInput.trim().toLowerCase();
    if (!email) { setWhitelistMessage({ text: 'Masukkan alamat email terlebih dahulu.', error: true }); return; }
    setWhitelistBusy(true); setWhitelistMessage(null);
    try {
      const response = await fetch('/api/master/whitelist', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menambahkan email.');
      setWhitelistEmails(Array.isArray(result) ? result : []); setWhitelistInput('');
      setWhitelistMessage({ text: `Email ${email} berhasil ditambahkan ke whitelist.`, error: false });
    } catch (error) { setWhitelistMessage({ text: error instanceof Error ? error.message : 'Gagal menambahkan email.', error: true }); }
    finally { setWhitelistBusy(false); }
  };

  const removeWhitelistEmail = async (email: string) => {
    if (!window.confirm(`Hapus ${email} dari whitelist Master? Email ini tidak bisa login lagi setelah sesi berakhir.`)) return;
    setWhitelistBusy(true); setWhitelistMessage(null);
    try {
      const response = await fetch(`/api/master/whitelist/${encodeURIComponent(email)}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menghapus email.');
      setWhitelistEmails(Array.isArray(result) ? result : []);
      setWhitelistMessage({ text: `Email ${email} berhasil dihapus dari whitelist.`, error: false });
    } catch (error) { setWhitelistMessage({ text: error instanceof Error ? error.message : 'Gagal menghapus email.', error: true }); }
    finally { setWhitelistBusy(false); }
  };


  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Music upload handler
  const musicFileInputRef = useRef<HTMLInputElement>(null);
  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a)$/i)) {
      showToast('Harap pilih file audio (.mp3, .wav, .ogg, .m4a)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      const cleanFileName = file.name.replace(/\.[^/.]+$/, '');
      updateData({
        music: {
          ...data.music,
          source: 'upload',
          customAudioData: base64Data,
          title: cleanFileName,
          artist: 'Koleksi Pribadi',
        },
      });
      showToast(`Audio "${cleanFileName}" berhasil diunggah!`);
      // Start playing to preview
      setTimeout(() => playAudio(), 200);
    };
    reader.readAsDataURL(file);
  };

  // Compress uploaded photos before storing them in the invitation JSON.
  // This prevents large dresscode/menu photos from exceeding the API's 15 MB body limit.
  const compressPhoto = (file: File): Promise<string> => new Promise((resolve, reject) => {
    if (file.size <= 900 * 1024) {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('File foto tidak dapat dibaca.'));
      reader.readAsDataURL(file);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        const maxDimension = 1600;
        const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Browser tidak mendukung pemrosesan foto.');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/webp', 0.82);
        URL.revokeObjectURL(objectUrl);
        resolve(compressed);
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Format foto tidak dapat diproses.'));
    };
    image.src = objectUrl;
  });

  // Generic image upload helper shared by gallery, dresscode and menu photos.
  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (base64Url: string) => void
  ) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Harap pilih file gambar (.jpg, .png, .webp)');
      input.value = '';
      return;
    }

    try {
      const imageData = await compressPhoto(file);
      callback(imageData);
      showToast('Gambar berhasil diunggah dan dioptimalkan!');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Gagal memproses foto.');
    } finally {
      input.value = '';
    }
  };

  const handleMultiplePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (urls: string[]) => void) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const invalid = files.some(file => !file.type.startsWith('image/'));
    if (invalid) { showToast('Semua file harus berupa gambar.'); e.target.value = ''; return; }
    Promise.all(files.map(file => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Gagal membaca salah satu foto.'));
      reader.readAsDataURL(file);
    }))).then(urls => { callback(urls); showToast(`${urls.length} foto berhasil diunggah!`); }).catch(() => showToast('Gagal mengunggah foto.'));
    e.target.value = '';
  };

  // Add new gallery photo state
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const dressCodePhotoRef = useRef<HTMLInputElement>(null);
  const menuPhotoRef = useRef<HTMLInputElement>(null);
  const [dressCodePhotoUrl, setDressCodePhotoUrl] = useState('');
  const [menuPhotoUrl, setMenuPhotoUrl] = useState('');
  const [dressCodePhotoCaption, setDressCodePhotoCaption] = useState('');
  const [menuPhotoCaption, setMenuPhotoCaption] = useState('');

  const handleAddGalleryPhoto = (url: string) => {
    if (!url.trim()) return;
    const newPhoto: PhotoItem = {
      id: 'gallery_' + Date.now(),
      url: url.trim(),
      caption: newPhotoCaption.trim() || undefined,
      ratio: 'wide',
    };
    updateData((prev) => ({
      ...prev,
      gallery: [newPhoto, ...prev.gallery],
    }));
    setNewPhotoUrl('');
    setNewPhotoCaption('');
    showToast('Foto baru ditambahkan ke galeri!');
  };

  const handleDeleteGalleryPhoto = (id: string) => {
    updateData((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((p) => p.id !== id),
    }));
    showToast('Foto dihapus dari galeri');
  };

  // Guest invitation share generator
  const [guestNameInput, setGuestNameInput] = useState('');
  const [guestQuota, setGuestQuota] = useState(1);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [guestbookEntries, setGuestbookEntries] = useState<any[]>([]);
  const [guestbookAvatars, setGuestbookAvatars] = useState<any[]>([{ id: 'cat-1', label: 'Milo', emoji: '😺', color: '#FDE7C7', image: '/avatars/cat-1.webp' }, { id: 'cat-2', label: 'Mimi', emoji: '😸', color: '#F8DDE7', image: '/avatars/cat-2.webp' }, { id: 'cat-3', label: 'Mochi', emoji: '😻', color: '#E5E7F9', image: '/avatars/cat-3.webp' }, { id: 'cat-4', label: 'Oyen', emoji: '😽', color: '#DDF2E5', image: '/avatars/cat-4.webp' }, { id: 'cat-5', label: 'Luna', emoji: '🙀', color: '#F2E4D8', image: '/avatars/cat-5.webp' }]);
  const loadGuestbookEntries = async () => { try { const [r, ar] = await Promise.all([fetch('/api/master/guestbook', { cache: 'no-store' }), fetch('/api/master/guestbook/avatars', { cache: 'no-store' })]); const v = await r.json(); const av = await ar.json(); if (r.ok) setGuestbookEntries(Array.isArray(v) ? v : []); if (ar.ok && Array.isArray(av) && av.length === 5) setGuestbookAvatars(av); } catch {} };
  const saveGuestbookAvatars = async () => { try { const r = await fetch('/api/master/guestbook/avatars', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ avatars: guestbookAvatars }) }); const v = await r.json(); if (!r.ok) throw new Error(v.error || 'Gagal menyimpan avatar.'); setGuestbookAvatars(v); showToast('Pilihan avatar kucing berhasil diperbarui.'); } catch (e) { showToast(e instanceof Error ? e.message : 'Gagal menyimpan avatar.'); } };
  const deleteGuestbookEntry = async (id: string) => { if (!window.confirm('Hapus ucapan ini dari buku tamu?')) return; try { const r = await fetch(`/api/master/guestbook/${encodeURIComponent(id)}`, { method: 'DELETE' }); const v = await r.json(); if (!r.ok) throw new Error(v.error || 'Gagal menghapus ucapan.'); await loadGuestbookEntries(); showToast('Ucapan berhasil dihapus.'); } catch (e) { showToast(e instanceof Error ? e.message : 'Gagal menghapus ucapan.'); } };
  const [invitationBusy, setInvitationBusy] = useState(false);
  const loadInvitations = async () => { try { const r = await fetch('/api/master/invitations', { cache: 'no-store' }); const v = await r.json(); if (r.ok) setInvitations(Array.isArray(v) ? [...v].sort((a, b) => new Date(b.createdAt || b.respondedAt || 0).getTime() - new Date(a.createdAt || a.respondedAt || 0).getTime()) : []); } catch {} };
  useEffect(() => { if (activeTab === 'share' || activeTab === 'rsvps') void loadInvitations(); if (activeTab === 'rsvps') void loadGuestbookEntries(); }, [activeTab]);
  const createInvitation = async () => {
    if (!guestNameInput.trim()) { showToast('Masukkan nama tamu terlebih dahulu.'); return; }
    setInvitationBusy(true);
    try { const r = await fetch('/api/master/invitations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: guestNameInput.trim(), quota: guestQuota }) }); const v = await r.json(); if (!r.ok) throw new Error(v.error || 'Gagal membuat undangan.'); await loadInvitations(); const url = `${window.location.origin}${window.location.pathname}?mode=guest&invite=${v.token}`; await navigator.clipboard.writeText(url); showToast(`Link undangan ${guestNameInput.trim()} berhasil dibuat dan disalin.`); setGuestNameInput(''); } catch (e) { showToast(e instanceof Error ? e.message : 'Gagal membuat undangan.'); } finally { setInvitationBusy(false); }
  };

  // RSVP Export
  const exportRSVPToCSV = () => {
    const headers = ['Nama', 'Kehadiran', 'Jumlah Tamu', 'Ucapan Doa', 'Tanggal'];
    const rows = data.rsvps.map((r) => [
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.attendance}"`,
      r.guestsCount,
      `"${r.message.replace(/"/g, '""')}"`,
      `"${new Date(r.createdAt).toLocaleString('id-ID')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rsvp-${data.groom.nickname}-${data.bride.nickname}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Data RSVP berhasil diekspor ke CSV!');
  };

  const handleSave = async () => {
    try {
      await savePublishedData();
      showToast('Berhasil disimpan dan dipublikasikan! Link undangan akan menampilkan versi terbaru.');
    } catch (error) {
      showToast(error instanceof Error ? `Gagal menyimpan: ${error.message}` : 'Gagal menyimpan perubahan.');
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 pb-20">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-amber-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-amber-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Master Top Bar Banner */}
      <div className="bg-stone-950 border-b border-stone-800 py-6 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Studio Pengelola Undangan (Master View)</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
              Pengaturan Musik, Foto &amp; Konten Undangan
            </h2>
            <p className="text-xs text-stone-400 mt-1 max-w-xl">
              Tentukan lagu latar, ganti foto mempelai &amp; galeri, sesuaikan rincian acara, serta pantau buku tamu secara langsung.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => void handleSave()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
            <button
              onClick={() => setMode('guest')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Lihat Tampilan Tamu (Live Preview)</span>
            </button>
            <button
              onClick={exportConfigJson}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs border border-stone-700 transition-colors"
              title="Unduh file backup JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor JSON</span>
            </button>
            <button
              onClick={() => {
                if (confirm('Kembalikan semua foto, lagu, dan data ke versi awal bawaan?')) {
                  resetData();
                  showToast('Data berhasil di-reset ke bawaan!');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-red-950 text-stone-400 hover:text-red-300 text-xs border border-stone-700 transition-colors"
              title="Reset ke pengaturan bawaan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-stone-800">
          <button
            onClick={() => setActiveTab('music')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'music'
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Lagu &amp; Audio</span>
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'photos'
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Foto &amp; Galeri</span>
          </button>

          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'details'
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Mempelai &amp; Acara</span>
          </button>



          <button
            onClick={() => setActiveTab('rsvps')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'rsvps'
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>RSVP &amp; Buku Tamu ({data.rsvps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('share')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'share'
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Generator Link Undangan</span>
          </button>

          <button
            onClick={() => setActiveTab('whitelist')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'whitelist' ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'}`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Whitelist Email</span>
          </button>


        </div>

        {/* Tab Content */}
        <div className="py-6">
          {/* TAB 1: MUSIC & AUDIO */}
          {activeTab === 'music' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="bg-stone-950 p-6 rounded-2xl border border-amber-500/30 space-y-4">
                <div><h3 className="font-serif text-base font-bold text-white">Kelola Preset YouTube</h3><p className="text-xs text-stone-400 mt-1">Tempel URL video YouTube. Judul dan nama channel akan diambil otomatis dari metadata YouTube.</p></div>
                <form onSubmit={(e) => { e.preventDefault(); void addYoutubePreset(); }} className="flex flex-col sm:flex-row gap-2"><input type="url" required value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="flex-1 px-3 py-2 text-sm bg-stone-900 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-amber-500"/><button disabled={presetBusy} className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold">{presetBusy ? 'Memproses...' : 'Tambah Preset'}</button></form>
                {presetMessage && <p className="text-xs text-amber-300">{presetMessage}</p>}
                <div className="space-y-2">{musicPresets.filter(p => p.youtubeId).map(p => <div key={p.id} className="flex items-center justify-between gap-3 bg-stone-900 border border-stone-800 rounded-lg p-3"><div className="min-w-0"><p className="text-xs font-semibold text-stone-100 truncate">{p.title}</p><p className="text-[11px] text-stone-400 truncate">{p.artist} · YouTube</p></div><button type="button" onClick={() => void deleteYoutubePreset(p.id)} disabled={presetBusy} className="p-2 text-red-300 hover:bg-red-950 rounded-lg" title="Hapus preset"><Trash2 className="w-4 h-4"/></button></div>)}</div>
              </div>

              {/* Music Player Live Monitor Card */}
              <div className="bg-stone-950 p-6 rounded-2xl border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
                    <Music className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">
                      Musik Latar Yang Aktif
                    </span>
                    <h3 className="font-serif text-lg font-bold text-white">
                      {data.music.title}
                    </h3>
                    <p className="text-xs text-stone-400">
                      Artis: {data.music.artist} · Sumber:{' '}
                      <span className="text-amber-300">
                        {data.music.source === 'upload'
                          ? 'File Unggahan Lokal'
                          : data.music.source === 'url'
                          ? 'Tautan Eksternal'
                          : 'Preset Romantis Bawaan'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleAudio}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-xs shadow-md transition-all ${
                      isAudioPlaying
                        ? 'bg-amber-600 text-white hover:bg-amber-500 ring-2 ring-amber-400/50'
                        : 'bg-stone-800 text-stone-200 hover:bg-stone-700'
                    }`}
                  >
                    {isAudioPlaying ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>Jeda Putar Uji Coba</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Uji Putar Musik Sekarang</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2 bg-stone-900 px-3 py-2 rounded-xl border border-stone-800">
                    <Volume2 className="w-4 h-4 text-stone-400" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={audioVolume}
                      onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                      className="w-24 accent-amber-500 cursor-pointer"
                    />
                    <span className="text-[11px] tabular-nums text-stone-400">
                      {Math.round(audioVolume * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Three Selection Modes */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Method 1: Curated Royalty-Free Presets */}
                <div className="bg-stone-950 p-6 rounded-2xl border border-stone-800 space-y-4">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-serif text-base font-bold text-white">
                      1. Pilih Preset YouTube
                    </h3>
                  </div>
                  <p className="text-xs text-stone-400">
                    Pilih salah satu lagu YouTube yang sudah ditambahkan di atas. Saat dipilih, lagu akan langsung berganti ke video tersebut.
                  </p>

                  <div className="space-y-2.5 pt-2">
                    {musicPresets.length === 0 ? <p className="rounded-xl border border-dashed border-stone-700 p-4 text-xs text-stone-400">Belum ada preset. Tambahkan 2–3 URL YouTube di bagian Kelola Preset YouTube di atas.</p> : musicPresets.map((preset) => {
                      const isSelected = data.music.source === 'preset' && data.music.presetId === preset.id;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => {
                            updateData({
                              music: {
                                ...data.music,
                                source: 'preset',
                                presetId: preset.id,
                                title: preset.title,
                                artist: preset.artist,
                              },
                            });
                            showToast(`Lagu diganti ke: ${preset.title}`);
                            void playAudio(preset.id, preset);
                          }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-amber-950/40 border-amber-500/60 text-white'
                              : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:bg-stone-800/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-semibold">{preset.title}</p>
                              <p className="text-[11px] text-stone-400">{preset.artist} · {preset.genre}</p>
                            </div>
                            {isSelected && (
                              <span className="text-[10px] font-semibold text-amber-400 bg-amber-900/60 px-1.5 py-0.5 rounded border border-amber-600/40">
                                Aktif
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Method 2: Custom Audio Upload */}
                <div className="bg-stone-950 p-6 rounded-2xl border border-stone-800 space-y-4">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Upload className="w-5 h-5" />
                    <h3 className="font-serif text-base font-bold text-white">
                      2. Unggah File Musik Sendiri (.mp3)
                    </h3>
                  </div>
                  <p className="text-xs text-stone-400">
                    Punya lagu favorit Anda dan pasangan? Unggah langsung file MP3 / WAV dari komputer atau ponsel Anda.
                  </p>

                  <div
                    onClick={() => musicFileInputRef.current?.click()}
                    className="mt-4 border-2 border-dashed border-stone-700 hover:border-amber-500/80 rounded-xl p-6 text-center cursor-pointer bg-stone-900/40 hover:bg-stone-900/80 transition-all space-y-3"
                  >
                    <input
                      type="file"
                      ref={musicFileInputRef}
                      onChange={handleMusicUpload}
                      accept="audio/*,.mp3,.wav,.ogg,.m4a"
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-amber-600/20 text-amber-400 mx-auto flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-stone-200">
                        Klik untuk Memilih File Audio
                      </p>
                      <p className="text-[11px] text-stone-500 mt-1">
                        Format didukung: MP3, WAV, M4A, OGG
                      </p>
                    </div>
                  </div>

                  {data.music.source === 'upload' && data.music.customAudioData && (
                    <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-200">
                      <p className="font-semibold">File Unggahan Aktif:</p>
                      <p className="text-[11px] text-stone-300 truncate mt-0.5">{data.music.title}</p>
                    </div>
                  )}
                </div>

                {/* Method 3: Audio URL & Metadata */}
                <div className="bg-stone-950 p-6 rounded-2xl border border-stone-800 space-y-4">
                  <div className="flex items-center gap-2 text-amber-400">
                    <LinkIcon className="w-5 h-5" />
                    <h3 className="font-serif text-base font-bold text-white">
                      3. Tautan URL Audio &amp; Detail
                    </h3>
                  </div>
                  <p className="text-xs text-stone-400">
                    Atau tempel URL streaming audio langsung dari hosting atau cloud storage Anda.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                        URL Audio Langsung (.mp3)
                      </label>
                      <input
                        type="url"
                        value={data.music.customUrl || ''}
                        onChange={(e) =>
                          updateData({
                            music: {
                              ...data.music,
                              source: 'url',
                              customUrl: e.target.value,
                            },
                          })
                        }
                        placeholder="https://example.com/lagu-nikah.mp3"
                        className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                        Judul Lagu yang Ditampilkan ke Tamu
                      </label>
                      <input
                        type="text"
                        value={data.music.title}
                        onChange={(e) =>
                          updateData({
                            music: { ...data.music, title: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                        Nama Artis / Penyanyi
                      </label>
                      <input
                        type="text"
                        value={data.music.artist}
                        onChange={(e) =>
                          updateData({
                            music: { ...data.music, artist: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Autoplay & Loop Options */}
                    <div className="pt-2 space-y-2 border-t border-stone-800">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300">
                        <input
                          type="checkbox"
                          checked={data.music.autoplayOnOpen}
                          onChange={(e) =>
                            updateData({
                              music: { ...data.music, autoplayOnOpen: e.target.checked },
                            })
                          }
                          className="accent-amber-500 rounded"
                        />
                        <span>Putar otomatis saat tombol "Buka Undangan" ditekan</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300">
                        <input
                          type="checkbox"
                          checked={data.music.loop}
                          onChange={(e) =>
                            updateData({
                              music: { ...data.music, loop: e.target.checked },
                            })
                          }
                          className="accent-amber-500 rounded"
                        />
                        <span>Putar ulang terus-menerus (Looping)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PHOTOS & GALLERY */}
          {activeTab === 'photos' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Main Key Photos: Hero, Groom, Bride */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Hero Cover Photo */}
                <div className="bg-stone-950 p-5 rounded-2xl border border-stone-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-serif text-sm font-bold text-white flex items-center justify-between">
                      <span>Foto Sampul &amp; Hero Utama</span>
                      <span className="text-[10px] text-amber-400 font-sans font-normal">Rasio 16:9</span>
                    </h3>
                    <div className="h-40 rounded-xl overflow-hidden border border-stone-700 bg-stone-900">
                      <img
                        src={data.heroImage}
                        alt="Hero"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs cursor-pointer border border-stone-700 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>Unggah Foto Hero Baru</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handlePhotoUpload(e, (url) => updateData({ heroImage: url }))
                        }
                      />
                    </label>

                    <input
                      type="url"
                      value={data.heroImage}
                      onChange={(e) => updateData({ heroImage: e.target.value })}
                      placeholder="Atau tempel URL gambar..."
                      className="w-full px-2.5 py-1.5 text-[11px] bg-stone-900 border border-stone-700 rounded-lg text-white"
                    />
                  </div>
                </div>

                {/* 2. Groom Photo */}
                <div className="bg-stone-950 p-5 rounded-2xl border border-stone-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-serif text-sm font-bold text-white flex items-center justify-between">
                      <span>Foto Mempelai Pria (Groom)</span>
                      <span className="text-[10px] text-amber-400 font-sans font-normal">Rasio 1:1</span>
                    </h3>
                    <div className="h-40 w-40 mx-auto rounded-full overflow-hidden border-2 border-stone-700 bg-stone-900">
                      <img
                        src={data.groom.photoUrl}
                        alt={data.groom.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs cursor-pointer border border-stone-700 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>Unggah Foto Pria</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handlePhotoUpload(e, (url) =>
                            updateData((prev) => ({
                              ...prev,
                              groom: { ...prev.groom, photoUrl: url },
                            }))
                          )
                        }
                      />
                    </label>

                    <input
                      type="url"
                      value={data.groom.photoUrl}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          groom: { ...prev.groom, photoUrl: e.target.value },
                        }))
                      }
                      placeholder="Atau tempel URL gambar..."
                      className="w-full px-2.5 py-1.5 text-[11px] bg-stone-900 border border-stone-700 rounded-lg text-white"
                    />
                  </div>
                </div>

                {/* 3. Bride Photo */}
                <div className="bg-stone-950 p-5 rounded-2xl border border-stone-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-serif text-sm font-bold text-white flex items-center justify-between">
                      <span>Foto Mempelai Wanita (Bride)</span>
                      <span className="text-[10px] text-amber-400 font-sans font-normal">Rasio 1:1</span>
                    </h3>
                    <div className="h-40 w-40 mx-auto rounded-full overflow-hidden border-2 border-stone-700 bg-stone-900">
                      <img
                        src={data.bride.photoUrl}
                        alt={data.bride.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs cursor-pointer border border-stone-700 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>Unggah Foto Wanita</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handlePhotoUpload(e, (url) =>
                            updateData((prev) => ({
                              ...prev,
                              bride: { ...prev.bride, photoUrl: url },
                            }))
                          )
                        }
                      />
                    </label>

                    <input
                      type="url"
                      value={data.bride.photoUrl}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          bride: { ...prev.bride, photoUrl: e.target.value },
                        }))
                      }
                      placeholder="Atau tempel URL gambar..."
                      className="w-full px-2.5 py-1.5 text-[11px] bg-stone-900 border border-stone-700 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Gallery Photos Section */}
              <div className="bg-stone-950 p-6 rounded-2xl border border-stone-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-white">
                      Foto Lamaran & Galeri ({data.gallery.length} Foto)
                    </h3>
                    <p className="text-xs text-stone-400">
                      Foto-foto ini akan tampil di bagian galeri kenangan tamu dengan efek lightbox layar penuh.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer shadow-sm transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Unggah Foto ke Galeri</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={galleryFileInputRef}
                        onChange={(e) =>
                          handlePhotoUpload(e, (url) => handleAddGalleryPhoto(url))
                        }
                      />
                    </label>
                  </div>
                </div>

                {/* Form to add photo by URL */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-stone-900/60 rounded-xl border border-stone-800 items-end">
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                      Atau Tambah Foto lewat URL Tautan
                    </label>
                    <input
                      type="url"
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      placeholder="https://example.com/foto-wedding.jpg"
                      className="w-full px-3 py-2 text-xs bg-stone-950 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                      Keterangan / Caption (Opsional)
                    </label>
                    <input
                      type="text"
                      value={newPhotoCaption}
                      onChange={(e) => setNewPhotoCaption(e.target.value)}
                      placeholder="Momen berkesan..."
                      className="w-full px-3 py-2 text-xs bg-stone-950 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => handleAddGalleryPhoto(newPhotoUrl)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-white text-xs font-medium border border-stone-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-stone-800 pt-5">
                  <div className="rounded-xl border border-stone-800 bg-stone-900 p-4 space-y-3">
                    <div><h4 className="text-sm font-semibold text-white">Foto Contoh Dresscode</h4><p className="text-[11px] text-stone-400">Tambahkan foto melalui upload atau URL, lalu isi keterangan opsional seperti pada Galeri Kenangan.</p></div>
                    <input ref={dressCodePhotoRef} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, url => { updateData(prev => ({ ...prev, referencePhotos: { ...prev.referencePhotos, dressCode: [...(prev.referencePhotos?.dressCode || []).map(photo => typeof photo === 'string' ? { url: photo } : photo), { url, caption: dressCodePhotoCaption.trim() || undefined }] } })); setDressCodePhotoCaption(''); })} />
                    <button type="button" onClick={() => dressCodePhotoRef.current?.click()} className="rounded-lg bg-amber-700 px-3 py-2 text-xs text-white"><Upload className="inline w-3 h-3 mr-1"/>Unggah Foto Dresscode</button>
                    <input value={dressCodePhotoUrl} onChange={e => setDressCodePhotoUrl(e.target.value)} placeholder="https://.../dresscode.jpg" className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-xs text-white" />
                    <input value={dressCodePhotoCaption} onChange={e => setDressCodePhotoCaption(e.target.value)} placeholder="Keterangan / Caption (Opsional)" className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-xs text-white" />
                    <button type="button" onClick={() => { if (!dressCodePhotoUrl.trim()) return; updateData(prev => ({ ...prev, referencePhotos: { ...prev.referencePhotos, dressCode: [...(prev.referencePhotos?.dressCode || []).map(photo => typeof photo === 'string' ? { url: photo } : photo), { url: dressCodePhotoUrl.trim(), caption: dressCodePhotoCaption.trim() || undefined }] } })); setDressCodePhotoUrl(''); setDressCodePhotoCaption(''); showToast('Foto referensi dresscode disimpan.'); }} className="rounded-lg border border-stone-700 px-3 py-2 text-xs text-white">Simpan Foto</button>
                    {!!data.referencePhotos?.dressCode?.length && <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{data.referencePhotos.dressCode.map((photo, i) => { const item = typeof photo === 'string' ? { url: photo, caption: '' } : photo; return <div key={`${item.url}-${i}`} className="relative rounded-xl border border-stone-700 bg-stone-950 p-2"><img src={item.url} className="h-28 w-full rounded-lg object-cover object-center"/><p className="mt-1 text-[10px] text-stone-400 truncate">{item.caption || `Dresscode ${i + 1}`}</p><button type="button" onClick={() => updateData(prev => ({ ...prev, referencePhotos: { ...prev.referencePhotos, dressCode: (prev.referencePhotos?.dressCode || []).filter((_, index) => index !== i) } }))} className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white"><Trash2 className="h-3 w-3"/></button></div>})}</div>}
                  </div>
                  <div className="rounded-xl border border-stone-800 bg-stone-900 p-4 space-y-3">
                    <div><h4 className="text-sm font-semibold text-white">Foto List Menu Konsumsi</h4><p className="text-[11px] text-stone-400">Tambahkan foto melalui upload atau URL, lalu isi keterangan opsional seperti pada Galeri Kenangan.</p></div>
                    <input ref={menuPhotoRef} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, url => { updateData(prev => ({ ...prev, referencePhotos: { ...prev.referencePhotos, menu: [...(prev.referencePhotos?.menu || []).map(photo => typeof photo === 'string' ? { url: photo } : photo), { url, caption: menuPhotoCaption.trim() || undefined }] } })); setMenuPhotoCaption(''); })} />
                    <button type="button" onClick={() => menuPhotoRef.current?.click()} className="rounded-lg bg-amber-700 px-3 py-2 text-xs text-white"><Upload className="inline w-3 h-3 mr-1"/>Unggah Foto Menu</button>
                    <input value={menuPhotoUrl} onChange={e => setMenuPhotoUrl(e.target.value)} placeholder="https://.../menu.jpg" className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-xs text-white" />
                    <input value={menuPhotoCaption} onChange={e => setMenuPhotoCaption(e.target.value)} placeholder="Keterangan / Caption (Opsional)" className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-xs text-white" />
                    <button type="button" onClick={() => { if (!menuPhotoUrl.trim()) return; updateData(prev => ({ ...prev, referencePhotos: { ...prev.referencePhotos, menu: [...(prev.referencePhotos?.menu || []).map(photo => typeof photo === 'string' ? { url: photo } : photo), { url: menuPhotoUrl.trim(), caption: menuPhotoCaption.trim() || undefined }] } })); setMenuPhotoUrl(''); setMenuPhotoCaption(''); showToast('Foto menu ditambahkan.'); }} className="rounded-lg border border-stone-700 px-3 py-2 text-xs text-white">Simpan Foto</button>
                    {!!data.referencePhotos?.menu?.length && <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{data.referencePhotos.menu.map((photo, i) => { const item = typeof photo === 'string' ? { url: photo, caption: '' } : photo; return <div key={`${item.url}-${i}`} className="relative rounded-xl border border-stone-700 bg-stone-950 p-2"><img src={item.url} className="h-28 w-full rounded-lg object-cover object-center"/><p className="mt-1 text-[10px] text-stone-400 truncate">{item.caption || `Menu ${i + 1}`}</p><button type="button" onClick={() => updateData(prev => ({ ...prev, referencePhotos: { ...prev.referencePhotos, menu: (prev.referencePhotos?.menu || []).filter((_, index) => index !== i) } }))} className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white"><Trash2 className="h-3 w-3"/></button></div>})}</div>}
                  </div>
                </div>

                {/* Photos List Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {data.gallery.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="group relative bg-stone-900 rounded-xl border border-stone-800 overflow-hidden space-y-2 pb-2"
                    >
                      <div className="h-36 overflow-hidden relative">
                        <img
                          src={photo.url}
                          alt={photo.caption || `Foto ${index + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleDeleteGalleryPhoto(photo.id)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 cursor-pointer shadow-md"
                          title="Hapus foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="px-2.5">
                        <input
                          type="text"
                          value={photo.caption || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateData((prev) => ({
                              ...prev,
                              gallery: prev.gallery.map((p) =>
                                p.id === photo.id ? { ...p, caption: val } : p
                              ),
                            }));
                          }}
                          placeholder="Tulis caption..."
                          className="w-full text-[11px] bg-transparent border-b border-stone-700 focus:border-amber-400 text-stone-300 py-1 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DETAILS (COUPLE & EVENTS) */}
          {activeTab === 'details' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Couple Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Groom Info */}
                <div className="bg-stone-950 p-6 rounded-2xl border border-stone-800 space-y-4">
                  <h3 className="font-serif text-base font-bold text-white border-b border-stone-800 pb-2">
                    Informasi Mempelai Pria (Groom)
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">Nama Lengkap &amp; Gelar</label>
                      <input
                        type="text"
                        value={data.groom.name}
                        onChange={(e) =>
                          updateData((prev) => ({
                            ...prev,
                            groom: { ...prev.groom, name: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-stone-400 mb-1">Nama Panggilan</label>
                        <input
                          type="text"
                          value={data.groom.nickname}
                          onChange={(e) =>
                            updateData((prev) => ({
                              ...prev,
                              groom: { ...prev.groom, nickname: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-stone-400 mb-1">Urutan Anak</label>
                        <input
                          type="text"
                          value={data.groom.childOrder}
                          onChange={(e) =>
                            updateData((prev) => ({
                              ...prev,
                              groom: { ...prev.groom, childOrder: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-stone-400 mb-1">Nama Ayah</label>
                        <input
                          type="text"
                          value={data.groom.father}
                          onChange={(e) =>
                            updateData((prev) => ({
                              ...prev,
                              groom: { ...prev.groom, father: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-stone-400 mb-1">Nama Ibu</label>
                        <input
                          type="text"
                          value={data.groom.mother}
                          onChange={(e) =>
                            updateData((prev) => ({
                              ...prev,
                              groom: { ...prev.groom, mother: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">Akun Instagram</label>
                      <input
                        type="text"
                        value={data.groom.instagram || ''}
                        onChange={(e) =>
                          updateData((prev) => ({
                            ...prev,
                            groom: { ...prev.groom, instagram: e.target.value },
                          }))
                        }
                        placeholder="contoh: dimas.pratama"
                        className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Bride Info */}
                <div className="bg-stone-950 p-6 rounded-2xl border border-stone-800 space-y-4">
                  <h3 className="font-serif text-base font-bold text-white border-b border-stone-800 pb-2">
                    Informasi Mempelai Wanita (Bride)
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">Nama Lengkap &amp; Gelar</label>
                      <input
                        type="text"
                        value={data.bride.name}
                        onChange={(e) =>
                          updateData((prev) => ({
                            ...prev,
                            bride: { ...prev.bride, name: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-stone-400 mb-1">Nama Panggilan</label>
                        <input
                          type="text"
                          value={data.bride.nickname}
                          onChange={(e) =>
                            updateData((prev) => ({
                              ...prev,
                              bride: { ...prev.bride, nickname: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-stone-400 mb-1">Urutan Anak</label>
                        <input
                          type="text"
                          value={data.bride.childOrder}
                          onChange={(e) =>
                            updateData((prev) => ({
                              ...prev,
                              bride: { ...prev.bride, childOrder: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-stone-400 mb-1">Nama Ayah</label>
                        <input
                          type="text"
                          value={data.bride.father}
                          onChange={(e) =>
                            updateData((prev) => ({
                              ...prev,
                              bride: { ...prev.bride, father: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-stone-400 mb-1">Nama Ibu</label>
                        <input
                          type="text"
                          value={data.bride.mother}
                          onChange={(e) =>
                            updateData((prev) => ({
                              ...prev,
                              bride: { ...prev.bride, mother: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">Akun Instagram</label>
                      <input
                        type="text"
                        value={data.bride.instagram || ''}
                        onChange={(e) =>
                          updateData((prev) => ({
                            ...prev,
                            bride: { ...prev.bride, instagram: e.target.value },
                          }))
                        }
                        placeholder="contoh: raisa.amanda"
                        className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Akad & Resepsi Events */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Akad */}
                <div className="bg-stone-950 p-6 rounded-2xl border border-stone-800 space-y-4">
                  <h3 className="font-serif text-base font-bold text-white border-b border-stone-800 pb-2">
                    Jadwal Acara Lamaran
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">Hari &amp; Tanggal</label>
                      <input
                        type="date"
                        value={toDateInputValue(data.events.akad.date)}
                        onChange={(e) =>
                          updateData((prev) => ({
                            ...prev,
                            events: {
                              ...prev.events,
                              akad: { ...prev.events.akad, date: e.target.value ? formatDateForDisplay(e.target.value) : '' },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">Waktu</label>
                      <input
                        type="text"
                        value={data.events.akad.time}
                        onChange={(e) =>
                          updateData((prev) => ({
                            ...prev,
                            events: {
                              ...prev.events,
                              akad: { ...prev.events.akad, time: e.target.value },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">Nama Tempat / Gedung</label>
                      <input
                        type="text"
                        value={data.events.akad.venue}
                        onChange={(e) =>
                          updateData((prev) => ({
                            ...prev,
                            events: {
                              ...prev.events,
                              akad: { ...prev.events.akad, venue: e.target.value },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">Alamat Lengkap</label>
                      <textarea
                        rows={2}
                        value={data.events.akad.address}
                        onChange={(e) =>
                          updateData((prev) => ({
                            ...prev,
                            events: {
                              ...prev.events,
                              akad: { ...prev.events.akad, address: e.target.value },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">Link Google Maps</label>
                      <input
                        type="url"
                        value={data.events.akad.mapsUrl}
                        onChange={(e) =>
                          updateData((prev) => ({
                            ...prev,
                            events: {
                              ...prev.events,
                              akad: { ...prev.events.akad, mapsUrl: e.target.value },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Resepsi */}
                <div className="bg-stone-950 p-6 rounded-2xl border border-stone-800 space-y-4">
                  <h3 className="font-serif text-base font-bold text-white border-b border-stone-800 pb-2">
                    Jadwal Makan Bersama
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">Hari &amp; Tanggal</label>
                      <input
                        type="date"
                        value={toDateInputValue(data.events.resepsi.date)}
                        onChange={(e) =>
                          updateData((prev) => ({
                            ...prev,
                            events: {
                              ...prev.events,
                              resepsi: { ...prev.events.resepsi, date: e.target.value ? formatDateForDisplay(e.target.value) : '' },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">Waktu</label>
                      <input
                        type="text"
                        value={data.events.resepsi.time}
                        onChange={(e) =>
                          updateData((prev) => ({
                            ...prev,
                            events: {
                              ...prev.events,
                              resepsi: { ...prev.events.resepsi, time: e.target.value },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">Nama Tempat / Gedung</label>
                      <input
                        type="text"
                        value={data.events.resepsi.venue}
                        onChange={(e) =>
                          updateData((prev) => ({
                            ...prev,
                            events: {
                              ...prev.events,
                              resepsi: { ...prev.events.resepsi, venue: e.target.value },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">Alamat Lengkap</label>
                      <textarea
                        rows={2}
                        value={data.events.resepsi.address}
                        onChange={(e) =>
                          updateData((prev) => ({
                            ...prev,
                            events: {
                              ...prev.events,
                              resepsi: { ...prev.events.resepsi, address: e.target.value },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">Link Google Maps</label>
                      <input
                        type="url"
                        value={data.events.resepsi.mapsUrl}
                        onChange={(e) =>
                          updateData((prev) => ({
                            ...prev,
                            events: {
                              ...prev.events,
                              resepsi: { ...prev.events.resepsi, mapsUrl: e.target.value },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GIFTS & BANK ACCOUNTS */}
          {activeTab === 'rsvps' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {(() => {
                const hadir = invitations.filter(inv => inv.attendance === 'hadir');
                const tidakHadir = invitations.filter(inv => inv.attendance === 'tidak_hadir');
                const belum = invitations.filter(inv => !inv.attendance);
                const pax = (rows: any[]) => rows.reduce((sum, inv) => sum + Number(inv.quota || 0), 0);
                return <section className="rounded-2xl border border-stone-800 bg-stone-950 p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3"><div><h3 className="font-serif text-lg font-bold text-white">Rekap RSVP</h3><p className="text-xs text-stone-400">Ringkasan konfirmasi berdasarkan jumlah link dan total kuota tamu.</p></div><button type="button" onClick={() => void loadInvitations()} className="text-xs text-amber-400">Refresh</button></div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[{label:'Hadir', rows:hadir, color:'text-emerald-300', border:'border-emerald-900/60'},{label:'Tidak Hadir', rows:tidakHadir, color:'text-rose-300', border:'border-rose-900/60'},{label:'Belum Konfirmasi', rows:belum, color:'text-amber-300', border:'border-amber-900/60'}].map(item => <div key={item.label} className={`rounded-xl border ${item.border} bg-stone-900 p-4`}><p className={`text-sm font-semibold ${item.color}`}>{item.label}</p><p className="mt-2 text-2xl font-bold text-white">{item.rows.length} <span className="text-xs font-normal text-stone-400">link</span></p><p className="text-xs text-stone-400">{pax(item.rows)} tamu · total kuota</p></div>)}
                  </div>
                  <div className="space-y-3"><h4 className="text-sm font-semibold text-white">Rincian Pesanan &amp; Kehadiran</h4>
                    {invitations.length ? invitations.map(inv => <div key={inv.token} className="rounded-xl border border-stone-800 bg-stone-900 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold text-white">{inv.name}</p><p className="text-xs text-stone-400">Kuota {inv.quota} orang · {inv.attendance === 'hadir' ? 'Hadir' : inv.attendance === 'tidak_hadir' ? 'Tidak hadir' : 'Belum konfirmasi'}</p></div><p className="text-[10px] text-stone-500">{inv.respondedAt ? new Date(inv.respondedAt).toLocaleString('id-ID') : 'Belum ada konfirmasi'}</p></div>{inv.attendance === 'hadir' ? <div className="mt-2 space-y-1">{(inv.foodChoices || []).map((food: string, i: number) => <p key={`${inv.token}-${i}`} className="text-xs text-emerald-200">Tamu {i + 1}: {food}</p>)}</div> : <p className="mt-2 text-xs text-stone-500">{inv.attendance === 'tidak_hadir' ? 'Tidak ada pesanan menu.' : 'Menunggu konfirmasi tamu.'}</p>}</div>) : <p className="text-xs text-stone-500">Belum ada link undangan.</p>}
                  </div>
                </section>;
              })()}
              <div className="bg-stone-950 rounded-2xl border border-stone-800 p-5 space-y-4">
                <div className="flex items-center justify-between gap-3"><div><h3 className="font-serif text-lg font-bold text-white">Buku Tamu · Ucapan &amp; Doa</h3><p className="text-xs text-stone-400">Ucapan yang tampil untuk seluruh pengunjung undangan.</p></div><span className="rounded-full bg-stone-800 px-3 py-1 text-xs text-stone-300">{guestbookEntries.length} ucapan</span></div>
                <div className="rounded-xl border border-stone-800 bg-stone-900 p-4 space-y-3">
                  <div><h4 className="text-sm font-semibold text-white">Pengaturan 5 Avatar Kucing</h4><p className="text-xs text-stone-400">Master dapat mengganti nama, mengunggah gambar sendiri, atau memasukkan URL gambar untuk setiap avatar.</p></div>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">{guestbookAvatars.map((avatar, index) => <div key={avatar.id} className="rounded-xl border border-stone-700 p-3 space-y-2">
                    <img src={avatar.image} alt={avatar.label} className="mx-auto h-16 w-16 rounded-full object-cover bg-stone-800" />
                    <label className="block text-[10px] text-stone-400">Nama avatar<input value={avatar.label} onChange={e => setGuestbookAvatars(prev => prev.map((item, i) => i === index ? { ...item, label: e.target.value } : item))} maxLength={24} className="mt-1 w-full rounded-lg border border-stone-700 bg-stone-950 px-2 py-2 text-xs text-white" /></label>
                    <label className="block text-[10px] text-stone-400">URL gambar<input value={avatar.image.startsWith('data:') ? '' : avatar.image} onChange={e => setGuestbookAvatars(prev => prev.map((item, i) => i === index ? { ...item, image: e.target.value } : item))} placeholder="https://.../avatar.jpg" className="mt-1 w-full rounded-lg border border-stone-700 bg-stone-950 px-2 py-2 text-xs text-white" /></label>
                    <label className="block text-center rounded-lg border border-stone-700 px-2 py-2 text-xs text-stone-200 cursor-pointer hover:border-amber-500"> <Upload className="inline h-3 w-3 mr-1"/>Upload foto<input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, url => setGuestbookAvatars(prev => prev.map((item, i) => i === index ? { ...item, image: url } : item)))} /></label>
                  </div>)}</div>
                  <button type="button" onClick={() => void saveGuestbookAvatars()} className="rounded-lg bg-amber-700 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600">Simpan Pilihan Avatar</button>
                </div>
                {guestbookEntries.length ? <div className="space-y-3">{[...guestbookEntries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(entry => { const avatar = guestbookAvatars.find(item => item.id === entry.avatarId) || guestbookAvatars[0]; return <div key={entry.id} className="flex items-start gap-3 rounded-xl border border-stone-800 bg-stone-900 p-4"><img src={avatar?.image || '/avatars/cat-1.webp'} alt="Avatar kucing" className="h-11 w-11 shrink-0 rounded-full object-cover"/><div className="min-w-0 flex-1 space-y-1"><div className="flex flex-wrap items-baseline justify-between gap-2"><p className="text-sm font-semibold text-white">{entry.name}</p><p className="text-[10px] text-stone-500">{new Date(entry.createdAt).toLocaleString('id-ID')}</p></div><p className="whitespace-pre-wrap break-words text-sm text-stone-300">{entry.message}</p></div><button type="button" onClick={() => void deleteGuestbookEntry(entry.id)} className="inline-flex shrink-0 items-center gap-1 text-xs text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5"/>Hapus</button></div>; })}</div> : <p className="text-center text-xs text-stone-500 py-4">Belum ada ucapan dari tamu.</p>}
              </div>
            </div>
          )}

          {activeTab === 'share' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-stone-950 p-6 rounded-2xl border border-stone-800 space-y-5">
                <div><h3 className="font-serif text-lg font-bold text-white">Buat Undangan Tamu</h3><p className="text-xs text-stone-400 mt-1">Setiap link memiliki nama dan kuota tetap. Tamu tidak dapat menambah jumlah orang sendiri.</p></div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-7"><label className="block text-xs text-stone-400 mb-1">Nama tamu / keluarga</label><input value={guestNameInput} onChange={e => setGuestNameInput(e.target.value)} placeholder="Contoh: Papa & Mama" className="w-full rounded-xl bg-stone-900 border border-stone-700 px-3 py-3 text-sm text-white" /></div>
                  <div className="sm:col-span-2"><label className="block text-xs text-stone-400 mb-1">Jumlah orang</label><input type="number" min={1} max={30} value={guestQuota} onChange={e => setGuestQuota(Math.max(1, Math.min(30, Number(e.target.value))))} className="w-full rounded-xl bg-stone-900 border border-stone-700 px-3 py-3 text-sm text-white" /></div>
                  <button disabled={invitationBusy || !guestNameInput.trim()} onClick={() => void createInvitation()} className="sm:col-span-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 px-4 py-3 text-sm font-semibold text-white">{invitationBusy ? 'Membuat...' : 'Generate & Salin Link'}</button>
                </div>
              </div>
              <div className="bg-stone-950 p-6 rounded-2xl border border-stone-800 space-y-4"><div className="flex items-center justify-between"><h3 className="font-serif text-lg font-bold text-white">Daftar Undangan</h3><button onClick={() => { void loadInvitations(); void loadGuestbookEntries(); }} className="text-xs text-amber-400">Refresh</button></div>
                {invitations.length === 0 ? <p className="text-sm text-stone-500">Belum ada link undangan yang dibuat.</p> : invitations.map(inv => { const url = `${window.location.origin}${window.location.pathname}?mode=guest&invite=${inv.token}`; return <div key={inv.token} className="rounded-xl border border-stone-800 bg-stone-900 p-4 space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold text-white">{inv.name}</p><p className="text-xs text-stone-400">Kuota {inv.quota} orang · {inv.attendance === 'hadir' ? 'Hadir' : inv.attendance === 'tidak_hadir' ? 'Tidak hadir' : 'Belum konfirmasi'}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => { void navigator.clipboard.writeText(url); showToast('Link undangan disalin.'); }} className="rounded-lg bg-amber-700 px-3 py-2 text-xs text-white"><Copy className="inline w-3 h-3 mr-1"/>Salin Link</button><button type="button" onClick={async () => { const name = window.prompt('Nama tamu / keluarga:', inv.name); if (name === null) return; const quotaText = window.prompt('Kuota orang (1–30):', String(inv.quota)); if (quotaText === null) return; const response = await fetch(`/api/master/invitations/${encodeURIComponent(inv.token)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: name.trim(), quota: Number(quotaText) }) }); const result = await response.json(); if (!response.ok) { showToast(result.error || 'Gagal memperbarui undangan.'); return; } await loadInvitations(); showToast('Undangan berhasil diperbarui.'); }} className="rounded-lg border border-stone-700 px-3 py-2 text-xs text-stone-200"><Pencil className="inline w-3 h-3 mr-1"/>Edit</button><button type="button" onClick={async () => { if (!window.confirm(`Hapus link undangan untuk ${inv.name}?`)) return; const response = await fetch(`/api/master/invitations/${encodeURIComponent(inv.token)}`, { method: 'DELETE' }); const result = await response.json(); if (!response.ok) { showToast(result.error || 'Gagal menghapus undangan.'); return; } await loadInvitations(); showToast('Link undangan berhasil dihapus.'); }} className="rounded-lg border border-red-900/70 px-3 py-2 text-xs text-red-300"><Trash2 className="inline w-3 h-3 mr-1"/>Hapus</button></div></div>{inv.attendance === 'hadir' && <div className="text-xs text-emerald-300">Pilihan menu: {(inv.foodChoices || []).map((f: string, i: number) => `${i+1}. ${f}`).join(' · ')}</div>}<p className="text-[10px] text-stone-500 break-all">{url}</p></div>; })}
              </div>
            </div>
          )}

          {activeTab === 'whitelist' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-stone-950 p-6 rounded-2xl border border-amber-500/30 space-y-5">
                <div>
                  <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-amber-400" /> Whitelist Email Master</h3>
                  <p className="text-sm text-stone-400 mt-2">Hanya email yang terdaftar di sini yang diizinkan login ke Master Panel. Perubahan berlaku pada pemeriksaan akses berikutnya.</p>
                </div>
                <form className="flex flex-col sm:flex-row gap-3" onSubmit={(event) => { event.preventDefault(); void addWhitelistEmail(); }}>
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                    <input type="email" required value={whitelistInput} onChange={(event) => setWhitelistInput(event.target.value)} placeholder="nama@email.com" className="w-full rounded-xl border border-stone-700 bg-stone-900 pl-10 pr-4 py-3 text-sm text-white placeholder:text-stone-500 outline-none focus:border-amber-500" />
                  </div>
                  <button type="submit" disabled={whitelistBusy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 px-5 py-3 text-sm font-semibold text-white"><Plus className="w-4 h-4" /> Tambah Email</button>
                </form>
                {whitelistMessage && <div role="status" className={`rounded-lg px-4 py-3 text-sm ${whitelistMessage.error ? 'bg-red-950/60 text-red-300 border border-red-900' : 'bg-emerald-950/60 text-emerald-300 border border-emerald-900'}`}>{whitelistMessage.text}</div>}
                <div className="rounded-xl border border-stone-800 overflow-hidden">
                  <div className="flex items-center justify-between gap-3 bg-stone-900 px-4 py-3"><div><p className="text-sm font-semibold text-white">Email yang diizinkan</p><p className="text-xs text-stone-500 mt-0.5">{whitelistEmails.length} email terdaftar</p></div><button type="button" onClick={() => void loadWhitelist()} disabled={whitelistBusy} className="rounded-lg border border-stone-700 px-3 py-2 text-xs text-stone-300 hover:bg-stone-800 disabled:opacity-50"><RotateCcw className="inline w-3.5 h-3.5 mr-1.5" />Muat ulang</button></div>
                  {whitelistBusy && whitelistEmails.length === 0 ? <p className="px-4 py-6 text-sm text-stone-400">Memuat whitelist...</p> : whitelistEmails.length === 0 ? <p className="px-4 py-6 text-sm text-stone-400">Belum ada email di whitelist. Pastikan setidaknya satu email Master tetap terdaftar.</p> : <div className="divide-y divide-stone-800">{whitelistEmails.map((email) => <div key={email} className="flex items-center justify-between gap-3 px-4 py-3"><div className="min-w-0 flex items-center gap-3"><div className="w-9 h-9 shrink-0 rounded-full bg-stone-800 flex items-center justify-center"><Mail className="w-4 h-4 text-stone-400" /></div><span className="break-all text-sm text-stone-200">{email}</span></div><button type="button" onClick={() => void removeWhitelistEmail(email)} disabled={whitelistBusy || whitelistEmails.length <= 1} title={whitelistEmails.length <= 1 ? 'Tambahkan email Master lain sebelum menghapus email terakhir.' : 'Hapus email dari whitelist'} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-red-900/70 px-3 py-2 text-xs text-red-300 hover:bg-red-950/60 disabled:opacity-40 disabled:cursor-not-allowed"><Trash2 className="w-3.5 h-3.5" />Hapus</button></div>)}</div>}
                </div>
                <p className="text-xs leading-relaxed text-stone-500">Keamanan: email yang sedang digunakan tidak dapat menghapus dirinya sendiri. Sebagai perlindungan tambahan, antarmuka ini juga menonaktifkan penghapusan email terakhir agar akses Master tidak terkunci.</p>
              </div>
            </div>
          )}

          {activeTab !== 'whitelist' && <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-stone-700 bg-stone-950 p-4">
            <div>
              <p className="text-sm font-semibold text-white">Simpan halaman {({ music: 'Lagu & Audio', photos: 'Foto & Galeri', details: 'Mempelai & Acara', rsvps: 'RSVP', share: 'Generator Link', whitelist: 'Whitelist Email' } as Record<string, string>)[activeTab]}</p>
              <p className="text-xs text-stone-400 mt-1">Perubahan baru tampil di link tamu setelah berhasil disimpan.</p>
            </div>
            <button onClick={() => void handleSave()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 px-5 py-3 text-white text-xs font-semibold">
              <Check className="w-4 h-4" /> Simpan & Publikasikan
            </button>
          </div>}
        </div>
      </div>
    </div>
  );
};
