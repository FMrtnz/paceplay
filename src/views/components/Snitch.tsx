export default function Snitch({ P }: { P: number }) {
  const x = 40 + (1 - P) * 120;
  const y = 30 + 6 * Math.sin(P * 40);
  return (
    <svg viewBox="0 0 200 70" width="100%">
      <circle cx="20" cy="45" r="8" fill="#7fd1ff" />
      <g transform={`translate(${x} ${y})`}>
        <ellipse className="wing" cx="-14" cy="-4" rx="12" ry="5" fill="#fff8" />
        <ellipse className="wing" cx="14" cy="-4" rx="12" ry="5" fill="#fff8" />
        <circle r="9" fill="#f5c542" />
      </g>
    </svg>
  );
}
