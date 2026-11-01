export const W = 1080;
export const H = 1350;
const GOLD = '#f2c14e';

/** Small seeded generator so the same match always gets the same starry sky. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
}

function drawSnitch(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath(); ctx.ellipse(x - 58 * s, y - 12 * s, 52 * s, 14 * s, -0.25, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 58 * s, y - 12 * s, 52 * s, 14 * s, 0.25, 0, Math.PI * 2); ctx.fill();
  const ball = ctx.createRadialGradient(x - 8 * s, y - 8 * s, 4 * s, x, y, 34 * s);
  ball.addColorStop(0, '#fff0a8');
  ball.addColorStop(1, '#d9a520');
  ctx.fillStyle = ball;
  ctx.beginPath(); ctx.arc(x, y, 32 * s, 0, Math.PI * 2); ctx.fill();
}

/** Default background: night sky, goal hoops, a golden Snitch and its trail. */
export function drawDefaultArt(ctx: CanvasRenderingContext2D, seed: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#070b1d');
  sky.addColorStop(0.55, '#18204a');
  sky.addColorStop(1, '#2a2f66');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const rand = rng(seed);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 140; i++) {
    ctx.globalAlpha = 0.3 + rand() * 0.7;
    ctx.beginPath(); ctx.arc(rand() * W, rand() * H * 0.8, 0.8 + rand() * 2.2, 0, Math.PI * 2); ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  for (const [x, y, r] of [[200, 1010, 62], [540, 960, 74], [880, 1010, 62]]) {
    ctx.beginPath(); ctx.ellipse(x, y, r, r, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x, H); ctx.stroke();
  }

  ctx.fillStyle = GOLD;
  for (let i = 0; i < 14; i++) {
    ctx.globalAlpha = Math.max(0.05, 0.6 - i * 0.04);
    ctx.beginPath(); ctx.arc(850 - i * 52, 250 + Math.sin(i * 0.7) * 40 + i * 8, Math.max(1, 6 - i * 0.3), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  drawSnitch(ctx, 900, 250, 1);

  const glow = ctx.createLinearGradient(0, H - 260, 0, H);
  glow.addColorStop(0, 'rgba(79,191,138,0)');
  glow.addColorStop(1, 'rgba(79,191,138,0.35)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, H - 260, W, 260);
}
