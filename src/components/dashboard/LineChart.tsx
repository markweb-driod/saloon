export default function LineChart({
  data,
  color = "#c9a24b",
  id = "chart",
}: {
  data: { label: string; value: number }[];
  color?: string;
  id?: string;
}) {
  const width = 600;
  const height = 220;
  const padding = 28;
  const max = Math.max(...data.map((d) => d.value), 1);
  const stepX = (width - padding * 2) / Math.max(data.length - 1, 1);
  const points = data.map((d, i) => ({
    x: padding + i * stepX,
    y: height - padding - (d.value / max) * (height - padding * 2),
  }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const last = points[points.length - 1];
  const first = points[0];
  const areaPath = `${linePath} L${last.x},${height - padding} L${first.x},${height - padding} Z`;
  const gradientId = `${id}-fill`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={padding}
          x2={width - padding}
          y1={padding + f * (height - padding * 2)}
          y2={padding + f * (height - padding * 2)}
          stroke="#10142b"
          strokeOpacity="0.05"
        />
      ))}
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} stroke="white" strokeWidth="1.5" />
      ))}
      {data.map((d, i) => (
        <text key={i} x={points[i].x} y={height - 6} fontSize="11" textAnchor="middle" fill="#6f7690">
          {d.label}
        </text>
      ))}
    </svg>
  );
}
