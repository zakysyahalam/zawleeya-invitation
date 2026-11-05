import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { CoverEnvelope } from './CoverEnvelope';
import { HeroSection } from './HeroSection';
import { CoupleSection } from './CoupleSection';
import { EventSchedule } from './EventSchedule';
import { GallerySection } from './GallerySection';
import { LoveStorySection } from './LoveStorySection';
import { DigitalGiftSection } from './DigitalGiftSection';
import { RSVPSection } from './RSVPSection';
import { FooterSection } from './FooterSection';
import { FloatingMusicPlayer } from '../Audio/FloatingMusicPlayer';
import { Check, Save, X } from 'lucide-react';

const pathForNode = (root: HTMLElement, node: Node): string => {
  const parts: number[] = [];
  let current: Node | null = node;
  while (current && current !== root) {
    const parent: Node | null = current.parentNode;
    if (!parent) return '';
    parts.unshift(Array.prototype.indexOf.call(parent.childNodes, current));
    current = parent;
  }
  return current === root ? parts.join('.') : '';
};
const nodeAtPath = (root: HTMLElement, path: string): Node | null => {
  if (!path) return null;
  let current: Node = root;
  for (const part of path.split('.')) {
    const next = current.childNodes[Number(part)];
    if (!next) return null;
    current = next;
  }
  return current;
};

export const GuestView: React.FC<{ canEdit?: boolean }> = ({ canEdit = false }) => {
  const { isCoverOpen, data, publishTextOverrides } = useWedding();
  const rootRef = useRef<HTMLDivElement>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>(data.textOverrides || {});
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { setOverrides(data.textOverrides || {}); }, [data.textOverrides]);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    Object.entries(overrides).forEach(([path, value]) => {
      const node = nodeAtPath(root, path);
      if (node?.nodeType === Node.TEXT_NODE) node.textContent = value;
    });
  });

  const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!canEdit || saving) return;
    const target = event.target as HTMLElement;
    // Only edit simple text elements; avoid replacing buttons, links, or nested layouts.
    const element = target.closest<HTMLElement>('[data-editable-text]') || target;
    if (element.closest('button,a,input,textarea,select,[contenteditable="true"]')) return;
    if (element.children.length > 0 || !element.textContent?.trim()) return;
    const root = rootRef.current;
    if (!root) return;
    const textNode = Array.from(element.childNodes).find((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
    if (!textNode) return;
    const path = pathForNode(root, textNode);
    if (!path) return;
    setEditingPath(path);
    setDraft(textNode.textContent || '');
    // Native content editing gives the master a direct, Canva-like inline edit experience.
    element.setAttribute('contenteditable', 'true');
    element.focus();
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection?.removeAllRanges(); selection?.addRange(range);
  }, [canEdit, saving]);

  const cancelEdit = () => {
    const root = rootRef.current;
    const node = root && editingPath ? nodeAtPath(root, editingPath) : null;
    const parent = node?.parentElement;
    if (parent) { parent.removeAttribute('contenteditable'); parent.blur(); }
    if (root && editingPath) {
      const original = data.textOverrides?.[editingPath];
      if (node?.nodeType === Node.TEXT_NODE) node.textContent = original ?? node.textContent;
    }
    setEditingPath(null); setDraft('');
  };

  const saveEdit = async () => {
    if (!editingPath) return;
    const root = rootRef.current;
    const node = root ? nodeAtPath(root, editingPath) : null;
    const parent = node?.parentElement;
    const value = (node?.textContent ?? draft).trim();
    if (!value) { setMessage('Teks tidak boleh kosong.'); return; }
    if (parent) { parent.removeAttribute('contenteditable'); parent.blur(); }
    const next = { ...overrides, [editingPath]: value };
    setOverrides(next);
    setEditingPath(null); setDraft('');
    setMessage('Perubahan belum dipublikasikan. Tekan Simpan Perubahan Global.');
  };

  const saveGlobal = async () => {
    setSaving(true); setMessage('');
    try {
      // Include any active inline edit before publishing.
      let next = overrides;
      if (editingPath) next = { ...overrides, [editingPath]: draft.trim() };
      await publishTextOverrides(next);
      setOverrides(next); setEditingPath(null);
      setMessage('Perubahan berhasil disimpan dan diterapkan untuk semua guest.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal menyimpan perubahan.');
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-stone-100 selection:bg-amber-200 selection:text-amber-900">
      {canEdit && <div className="sticky top-[45px] z-40 flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50/95 px-4 py-2.5 text-sm text-stone-800 shadow-sm backdrop-blur">
        <div><strong>Mode Edit Teks</strong><span className="ml-2 text-xs text-stone-600">Double-click teks untuk mengubahnya seperti Canva. Simpan untuk menerapkan ke semua guest.</span></div>
        <div className="flex items-center gap-2"><button onClick={cancelEdit} disabled={!editingPath} className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs disabled:opacity-40"><X className="h-3.5 w-3.5"/>Batal Edit</button><button onClick={saveGlobal} disabled={saving} className="inline-flex items-center gap-1 rounded-lg bg-amber-700 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-60"><Save className="h-3.5 w-3.5"/>{saving ? 'Menyimpan...' : 'Simpan Perubahan Global'}</button></div>
        {message && <p className="basis-full text-xs" role="status">{message}</p>}
      </div>}
      <div ref={rootRef} onInput={(event) => { if (editingPath) setDraft((event.target as HTMLElement).textContent || ''); }} onDoubleClick={handleDoubleClick} className={canEdit ? '[&_h1]:cursor-text [&_h2]:cursor-text [&_h3]:cursor-text [&_p]:cursor-text [&_span]:cursor-text [&_div[contenteditable=true]]:rounded-sm [&_div[contenteditable=true]]:outline [&_div[contenteditable=true]]:outline-2 [&_div[contenteditable=true]]:outline-amber-500' : ''}>
        {!isCoverOpen && <CoverEnvelope />}
        <main className="transition-opacity duration-700"><HeroSection /><CoupleSection /><GallerySection /><EventSchedule /><RSVPSection /><FooterSection /></main>
        <FloatingMusicPlayer />
      </div>
    </div>
  );
};
