import React, { useEffect, useState } from 'react';
import { WeddingProvider, useWedding } from './context/WeddingContext';
import { ModeBar } from './components/Navigation/ModeBar';
import { GuestView } from './components/Guest/GuestView';
import { MasterDashboard } from './components/Master/MasterDashboard';
import { ShieldCheck, LogIn, LogOut, AlertTriangle, Eye } from 'lucide-react';

type AuthState = { loading: boolean; authenticated: boolean; email: string | null; error: string | null };
const MasterLogin: React.FC<{ error: string | null }> = ({ error }) => (
  <div className="min-h-screen bg-stone-100 flex items-center justify-center p-5">
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-200 p-8 text-center">
      <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-700"><ShieldCheck className="w-7 h-7" /></div>
      <h1 className="font-serif text-2xl text-stone-900">Master Dashboard</h1>
      <p className="mt-2 text-sm text-stone-600">Login dengan akun Google yang terdaftar pada whitelist Master.</p>
      {error && <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm flex gap-2 text-left"><AlertTriangle className="w-5 h-5 shrink-0" />{error === 'not-whitelisted' ? 'Email Google ini belum diizinkan sebagai Master. Hubungi administrator.' : 'Login Google gagal atau dibatalkan. Silakan coba lagi.'}</div>}
      <a href="/api/auth/login" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-3 text-white text-sm font-medium hover:bg-stone-800"><LogIn className="w-4 h-4" /> Lanjutkan dengan Google</a>
      <a href="/?mode=guest" className="mt-4 inline-block text-sm text-stone-500 hover:text-stone-900">Kembali ke undangan tamu</a>
    </div>
  </div>
);
const LoginChoice: React.FC = () => (
  <div className="min-h-screen bg-stone-100 flex items-center justify-center p-5">
    <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-stone-200 p-8 sm:p-10 text-center">
      <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-700"><ShieldCheck className="w-7 h-7" /></div>
      <h1 className="font-serif text-3xl text-stone-900 mt-2">Selamat Datang</h1>
      <p className="mt-3 text-sm text-stone-600">Pilih cara masuk untuk melihat atau mengelola undangan.</p>
      <div className="grid gap-3 mt-7">
        <a href="/?mode=guest" className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3.5 text-white text-sm font-semibold hover:bg-amber-500"><Eye className="w-4 h-4" /> Guest View Mode — Lihat Undangan</a>
        <a href="/?mode=master" className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3.5 text-white text-sm font-semibold hover:bg-stone-800"><LogIn className="w-4 h-4" /> Master Login</a>
      </div>
    </div>
  </div>
);
const AppContent: React.FC = () => {
  const { mode, setMode } = useWedding();
  const [auth, setAuth] = useState<AuthState>({ loading: true, authenticated: false, email: null, error: null });
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('authError');
    fetch('/api/auth/me').then(r => r.json()).then((result) => {
      const authenticated = !!result.authenticated;
      setAuth({ loading: false, authenticated, email: result.email || null, error: authError });
      if (params.get('mode') === 'master' && authenticated) setMode('master');
      else if (mode === 'master' && !authenticated) setMode('guest');
      if (authError) { params.delete('authError'); params.delete('mode'); window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? `?${params}` : ''}`); }
    }).catch(() => setAuth({ loading: false, authenticated: false, email: null, error: authError }));
  }, []);
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); setAuth({ loading: false, authenticated: false, email: null, error: null }); setMode('guest'); window.history.replaceState({}, '', window.location.pathname + window.location.search.replace(/([?&])mode=master(&|$)/, '$1').replace(/[?&]$/, '')); };
  if (auth.loading) return <div className="min-h-screen bg-stone-100 flex items-center justify-center text-stone-600 text-sm">Memeriksa sesi...</div>;
  const requestedMaster = new URLSearchParams(window.location.search).get('mode') === 'master';
  const params = new URLSearchParams(window.location.search);
  const explicitGuest = params.get('mode') === 'guest' || params.has('to') || params.has('invite');
  // Show OAuth/whitelist errors before the default login-choice screen.
  // Otherwise the callback URL loses its query parameters and the user appears
  // to loop back to the initial login page without seeing the validation message.
  if (auth.error && !auth.authenticated) return <MasterLogin error={auth.error} />;

  if (!requestedMaster && !explicitGuest && mode !== 'master') return <LoginChoice />;

  if ((mode === 'master' || requestedMaster) && !auth.authenticated) return <MasterLogin error={auth.error} />;
  return <div className="min-h-screen bg-stone-100 flex flex-col">
    {mode === 'master' && auth.authenticated && <div className="sticky top-0 z-50 bg-stone-950 text-stone-300 px-4 py-2 flex items-center justify-end gap-3 text-xs"><span>Master: {auth.email}</span><button onClick={logout} className="flex items-center gap-1.5 rounded bg-stone-800 hover:bg-stone-700 px-3 py-1.5"><LogOut className="w-3.5 h-3.5" /> Keluar</button></div>}
    {auth.authenticated && <ModeBar />}
    <div className="flex-1">{mode === 'master' && auth.authenticated ? <MasterDashboard /> : <GuestView canEdit={auth.authenticated} />}</div>
  </div>;
};
export default function App() { return <WeddingProvider><AppContent /></WeddingProvider>; }
