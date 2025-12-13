"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const PRIMARY_PURPLE = "#5750f1";
const SOFT_PURPLE = "#f3f3fe";

type Props = {
  data: { date: string; services: number }[];
};

export function WeeklyServicesChart({ data }: Props) {
  return (
    <div className="mb-6 mt-6 rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
        Services – Last 7 Days
      </h3>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke={SOFT_PURPLE} strokeDasharray="3 3" />

            <XAxis
              dataKey="date"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickFormatter={(v) =>
                new Date(v + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "short",
                })
              }
            />

            <YAxis
              allowDecimals={false}
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />

            <Tooltip
              cursor={{ fill: SOFT_PURPLE }}
              contentStyle={{
                backgroundColor: "#fff",
                borderRadius: 8,
                border: `1px solid ${SOFT_PURPLE}`,
              }}
              labelStyle={{ color: "#111827" }}
            />

            <Bar
              dataKey="services"
              fill={PRIMARY_PURPLE}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
