export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled';

/** Opens the phone's share sheet with the image, or downloads it when sharing files is not supported.
 *  Call it straight from a tap (iOS requires a user gesture), with an image that is already rendered. */
export async function shareImageFile(blob: Blob, filename: string, text: string): Promise<ShareOutcome> {
  const file = new File([blob], filename, { type: 'image/png' });
  const nav = navigator as any;
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text });
      return 'shared';
    } catch (e: any) {
      if (e?.name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return 'downloaded';
}
