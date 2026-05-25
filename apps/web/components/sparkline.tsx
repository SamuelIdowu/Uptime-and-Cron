interface MiniSparklineProps {
  data?: number[];
  status?: "up" | "down" | "late" | "paused" | "pending";
}

export function MiniSparkline({ 
  data = [], 
  status = "up" 
}: MiniSparklineProps) {
  if (data.length === 0) {
    return <div className="w-[100px] h-[32px] border-b border-dashed border-border" />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 32;
  const width = 100;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  const fillPoints = `0,${height} ${points} ${width},${height}`;

  const colorMap = {
    up: "var(--status-up)",
    down: "var(--status-down)",
    late: "var(--status-late)",
    paused: "var(--status-paused)",
    pending: "var(--status-pending)",
  };

  const strokeColor = colorMap[status] || colorMap.up;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sparkline-gradient-${status}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={fillPoints}
        fill={`url(#sparkline-gradient-${status})`}
      />
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
