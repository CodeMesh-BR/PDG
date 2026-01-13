"use client";

import { useState } from "react";
import { useTodayByCompany } from "./useTodayByCompany";

export function CompaniesTodayList() {
  const { data, loading, error } = useTodayByCompany();
  const [open, setOpen] = useState(false);

  if (loading) return <p>Loading companies...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (data.length === 0) return null;

  const totalCompanies = data.length;

  return (
    <div className="mt-6 rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <h3 className="text-lg font-semibold">
          Companies – Today ({totalCompanies})
        </h3>
        <span className="text-sm">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <ul className="mt-4 space-y-3">
          {data.map((c) => (
            <li
              key={c.company_name}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2 dark:bg-gray-700"
            >
              <span className="font-medium">{c.company_name}</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {c.cars} services
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
