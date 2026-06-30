"use client";

const PRIMARY_COLOR = "#5750f1";
const GRID_COLOR = "#f3f3fe";

type Props = {
  data: { date: string; services: number }[];
};

export function FortnightServicesChart({ data }: Props) {
  const width = 720;
  const height = 220;
  const padding = 24;
  const maxServices = Math.max(...data.map((item) => item.services), 1);
  const points = data.map((item, index) => {
    const x =
      padding +
      (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y =
      height -
      padding -
      (item.services / maxServices) * (height - padding * 2);

    return { ...item, x, y };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
        Services - Last 15 Days
      </h3>

      <div className="h-[260px] overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full"
          role="img"
          aria-label="Services in the last 15 days"
        >
          {[0, 1, 2, 3].map((line) => {
            const y = padding + line * ((height - padding * 2) / 3);

            return (
              <line
                key={line}
                x1={padding}
                x2={width - padding}
                y1={y}
                y2={y}
                stroke={GRID_COLOR}
                strokeDasharray="4 4"
              />
            );
          })}

          <polyline
            fill="none"
            points={polyline}
            stroke={PRIMARY_COLOR}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />

          {points.map((point) => (
            <g key={point.date}>
              <circle cx={point.x} cy={point.y} fill={PRIMARY_COLOR} r="4">
                <title>
                  {point.date}: {point.services}
                </title>
              </circle>
              <text
                fill="#6b7280"
                fontSize="11"
                textAnchor="middle"
                x={point.x}
                y={height - 4}
              >
                {new Date(point.date + "T12:00:00").getDate()}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
