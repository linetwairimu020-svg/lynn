const chartItems = [
  { key: 'projects', label: 'Projects', color: '#371d35' },
  { key: 'services', label: 'Services', color: '#8a526f' },
  { key: 'skills', label: 'Skills', color: '#c06e62' },
  { key: 'profile', label: 'Profile', color: '#c39a58' },
  { key: 'messages', label: 'Messages', color: '#668d80' },
];

export default function ContentOverviewChart({ stats }) {
  const values = chartItems.map(({ key }) => Math.max(0, Number(stats?.[key]) || 0));
  const maxValue = Math.max(4, Math.ceil(Math.max(...values) / 4) * 4);
  const chart = { width: 640, height: 300, top: 24, right: 16, bottom: 56, left: 44 };
  const plotWidth = chart.width - chart.left - chart.right;
  const plotHeight = chart.height - chart.top - chart.bottom;
  const step = maxValue / 4;
  const barWidth = 48;
  const slotWidth = plotWidth / chartItems.length;
  const y = (value) => chart.top + plotHeight - (value / maxValue) * plotHeight;

  return (
    <section className="content-overview-chart mt-4" aria-labelledby="content-overview-chart-heading">
      <h2 className="h5 mb-3" id="content-overview-chart-heading">Content overview</h2>
      <div className="content-overview-chart-canvas">
        <svg
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          role="img"
          aria-label={`Content counts: ${chartItems.map(({ label }, index) => `${label} ${values[index]}`).join(', ')}`}
        >
          {[0, 1, 2, 3, 4].map((tick) => {
            const value = tick * step;
            const yPosition = y(value);
            return (
              <g key={value}>
                <line
                  x1={chart.left}
                  x2={chart.width - chart.right}
                  y1={yPosition}
                  y2={yPosition}
                  className="content-overview-gridline"
                />
                <text x={chart.left - 10} y={yPosition + 4} textAnchor="end" className="content-overview-axis-label">
                  {value}
                </text>
              </g>
            );
          })}
          {chartItems.map(({ key, label, color }, index) => {
            const x = chart.left + slotWidth * index + (slotWidth - barWidth) / 2;
            const barY = y(values[index]);
            const barHeight = chart.top + plotHeight - barY;
            return (
              <g key={key}>
                <rect x={x} y={barY} width={barWidth} height={barHeight} rx="6" fill={color} />
                <text x={x + barWidth / 2} y={Math.max(chart.top + 14, barY - 8)} textAnchor="middle" className="content-overview-value">
                  {values[index]}
                </text>
                <text x={x + barWidth / 2} y={chart.height - 22} textAnchor="middle" className="content-overview-category">
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
