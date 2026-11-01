import { useEffect, useRef, useState } from 'react';
import type { RunResult } from '../models/progressModel';
import { buildShareCard } from '../models/shareCardModel';
import { MESSAGES } from '../models/vocabulary';
import { shareImageFile } from '../services/share';

export interface ShareView {
  open: boolean;
  previewUrl: string | null;
  busy: boolean;
  hasPhoto: boolean;
  message: string;
  openSheet: () => void;
  closeSheet: () => void;
  choosePhoto: (file: File) => void;
  useDefaultArt: () => void;
  share: () => void;
}

/** Share sheet for one match: default artwork or the user's photo, preview, then share or download. */
export function useShareController(match: RunResult | null): ShareView {
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const blob = useRef<Blob | null>(null);

  // A different match starts from a clean sheet
  useEffect(() => { setOpen(false); setPhoto(null); setMessage(''); }, [match?.date]);

  // (Re)draw the preview while the sheet is open. The drawing code is loaded on first use.
  useEffect(() => {
    if (!open || !match) return;
    let cancelled = false;
    setBusy(true);
    import('../services/shareImage')
      .then((m) => m.renderShareImage(buildShareCard(match), photo, match.date))
      .then((b) => {
        if (cancelled) return;
        blob.current = b;
        setPreviewUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(b); });
      })
      .catch(() => { if (!cancelled) setMessage(MESSAGES.shareFailed); })
      .finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [open, match?.date, photo]);

  // Release the preview when the sheet closes
  useEffect(() => {
    if (!open) setPreviewUrl((old) => { if (old) URL.revokeObjectURL(old); return null; });
  }, [open]);

  function choosePhoto(file: File) {
    setMessage('');
    import('../services/shareImage')
      .then((m) => m.loadPhoto(file))
      .then(setPhoto)
      .catch(() => setMessage(MESSAGES.photoFailed));
  }

  function share() {
    if (!blob.current || !match) return;
    shareImageFile(blob.current, `paceplay-${match.date}.png`, 'My PACEPLAY match').then((r) => {
      setMessage(r === 'downloaded' ? MESSAGES.imageSaved : '');
    });
  }

  return {
    open, previewUrl, busy, hasPhoto: photo !== null, message,
    openSheet: () => setOpen(true),
    closeSheet: () => setOpen(false),
    choosePhoto,
    useDefaultArt: () => setPhoto(null),
    share,
  };
}
