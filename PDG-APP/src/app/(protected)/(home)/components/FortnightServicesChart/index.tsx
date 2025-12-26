"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
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

export function FortnightServicesChart({ data }: Props) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
        Services – Last 15 Days
      </h3>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke={SOFT_PURPLE} strokeDasharray="3 3" />

            <XAxis
              dataKey="date"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickFormatter={(v) =>
                new Date(v + "T12:00:00").getDate().toString()
              }
            />

            <YAxis
              allowDecimals={false}
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />

            <Tooltip
              cursor={{ stroke: PRIMARY_PURPLE, strokeWidth: 1 }}
              contentStyle={{
                backgroundColor: "#fff",
                borderRadius: 8,
                border: `1px solid ${SOFT_PURPLE}`,
              }}
              labelStyle={{ color: "#111827" }}
            />

            <Line
              type="monotone"
              dataKey="services"
              stroke={PRIMARY_PURPLE}
              strokeWidth={3}
              dot={{ r: 4, fill: PRIMARY_PURPLE }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
