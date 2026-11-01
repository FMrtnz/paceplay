/** One badge line. `prefix` and `opacity` let the result and progress pages share it. */
export default function BadgeCard({ name, prefix = '', opacity }: { name: string; prefix?: string; opacity?: number }) {
  return <div className="card" style={opacity === undefined ? undefined : { opacity }}>🏅 {prefix}{name}</div>;
}
