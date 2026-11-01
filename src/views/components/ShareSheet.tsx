import type { ShareView } from '../../controllers/useShareController';

/** Modal to share a match as an image: default artwork or the user's own photo. */
export default function ShareSheet({ share }: { share: ShareView }) {
  return (
    <div className="sheet-backdrop" onClick={share.closeSheet}>
      <div className="sheet" role="dialog" aria-label="Share this match" onClick={(e) => e.stopPropagation()}>
        <h3>Share this match</h3>
        <div className="share-preview">
          {share.previewUrl ? <img src={share.previewUrl} alt="Preview of the share image" /> : <div className="muted">{share.busy ? 'Creating image…' : ''}</div>}
        </div>
        {share.message && <p className="muted">{share.message}</p>}
        <label className="pick">
          Use my photo
          <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) share.choosePhoto(f); e.target.value = ''; }} />
        </label>
        {share.hasPhoto && <button onClick={share.useDefaultArt}>Default artwork</button>}
        <button className="big" disabled={!share.previewUrl || share.busy} onClick={share.share}>Share</button>
        <button onClick={share.closeSheet}>Close</button>
        <p className="muted">Your photo stays on this device.</p>
      </div>
    </div>
  );
}
