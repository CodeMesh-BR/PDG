"use client";

const PRIMARY_COLOR = "#5750f1";

type Props = {
  data: { date: string; services: number }[];
};

export function WeeklyServicesChart({ data }: Props) {
  const maxServices = Math.max(...data.map((item) => item.services), 1);

  return (
    <div className="mb-6 mt-6 rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
        Services - Last 7 Days
      </h3>

      <div className="flex h-[260px] items-end gap-3 border-b border-l px-2 pb-8 pt-4 dark:border-gray-700">
        {data.map((item) => {
          const height = Math.max((item.services / maxServices) * 100, 4);
          const label = new Date(item.date + "T12:00:00").toLocaleDateString(
            "en-US",
            { weekday: "short" },
          );

          return (
            <div
              key={item.date}
              className="flex h-full flex-1 flex-col justify-end"
            >
              <div className="relative flex flex-1 items-end justify-center">
                <div
                  className="w-full max-w-12 rounded-t-md"
                  style={{
                    height: `${height}%`,
                    backgroundColor: PRIMARY_COLOR,
                  }}
                  title={`${label}: ${item.services}`}
                />
              </div>
              <span className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
