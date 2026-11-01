import type { ShareCard } from '../models/shareCardModel';
import { H, W, drawDefaultArt } from './shareArt';

// Loaded on demand (import()): drawing code is only needed when someone opens the share sheet.
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, system-ui, 'Segoe UI', sans-serif";
const GOLD = '#f2c14e';

/** Reads a photo chosen by the user. It never leaves the device. The browser applies the EXIF rotation. */
export async function loadPhoto(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  await img.decode();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return img;
}

/** Draws the photo to cover the whole card, then darkens it so the figures stay readable. */
function drawPhoto(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  const shade = ctx.createLinearGradient(0, 0, 0, H);
  shade.addColorStop(0, 'rgba(5,8,20,0.55)');
  shade.addColorStop(0.5, 'rgba(5,8,20,0.35)');
  shade.addColorStop(1, 'rgba(5,8,20,0.8)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
}

function text(ctx: CanvasRenderingContext2D, str: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'left') {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

/** Largest font size (down to 80 px) at which `str` fits in `maxWidth`. */
function fitSize(ctx: CanvasRenderingContext2D, str: string, weight: string, start: number, maxWidth: number) {
  let size = start;
  ctx.font = `${weight} ${size}px ${SANS}`;
  while (size > 80 && ctx.measureText(str).width > maxWidth) { size -= 10; ctx.font = `${weight} ${size}px ${SANS}`; }
  return size;
}

function drawTexts(ctx: CanvasRenderingContext2D, card: ShareCard) {
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 12;
  text(ctx, 'PACEPLAY', 72, 110, `700 40px ${SANS}`, GOLD);
  text(ctx, card.rank.toUpperCase(), W - 72, 110, `600 34px ${SANS}`, '#dfe6ff', 'right');
  text(ctx, card.headline, 72, 250, `italic 700 78px ${SERIF}`, '#ffffff');
  text(ctx, card.date, 72, 305, `400 36px ${SANS}`, '#c9d1f5');

  const size = fitSize(ctx, card.distanceKm, '800', 300, W - 144);
  text(ctx, card.distanceKm, W / 2, 700, `800 ${size}px ${SANS}`, '#ffffff', 'center');
  text(ctx, 'KILOMETRES', W / 2, 770, `600 38px ${SANS}`, GOLD, 'center');

  card.kpis.forEach((k, i) => {
    const x = i % 2 ? 580 : 72, y = i < 2 ? 910 : 1090;
    text(ctx, k.label, x, y, `600 28px ${SANS}`, '#aab4e6');
    text(ctx, k.value, x, y + 85, `800 78px ${SANS}`, '#ffffff');
  });
  if (card.highlight) text(ctx, card.highlight, W / 2, 1255, `600 38px ${SANS}`, GOLD, 'center');
  ctx.shadowBlur = 0;
}

/** Renders the share card as a 1080×1350 PNG. `seed` varies the default artwork. */
export function renderShareImage(card: ShareCard, photo: HTMLImageElement | null, seed: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Canvas not supported'));
  if (photo) drawPhoto(ctx, photo); else drawDefaultArt(ctx, seed);
  drawTexts(ctx, card);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Image export failed'))), 'image/png'));
}
