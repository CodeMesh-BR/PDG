import { cn } from "@/lib/utils";

import type { ServicesSummary, SummaryBucket } from "./api";
import { money, num, shortDate } from "./columns";

type Props = {
  summary: ServicesSummary | null;
  loading: boolean;
  showCosts: boolean;
};

const cardClass =
  "rounded-xl border border-stroke bg-white shadow-sm dark:border-stroke-dark dark:bg-gray-dark";

export function SummaryBlocks({ summary, loading, showCosts }: Props) {
  if (loading) {
    return (
      <section className={cn(cardClass, "mb-6 p-6")}>
        <p className="text-center text-sm text-dark-5 dark:text-dark-6">
          Loading breakdowns…
        </p>
      </section>
    );
  }

  if (!summary) return null;

  const totals = summary.grand_totals;

  const figures: { label: string; value: string }[] = [
    { label: "Entries", value: String(totals.total_entries ?? 0) },
    { label: "Vehicles", value: String(totals.distinct_vehicles ?? 0) },
    { label: "Days worked", value: String(totals.days_worked ?? 0) },
    { label: "Avg. ticket", value: money(totals.average_ticket) },
    { label: "Avg. per day", value: money(totals.average_per_day) },
  ];

  if (showCosts) {
    figures.push(
      { label: "Margin", value: money(totals.total_margin) },
      {
        label: "Margin %",
        value: `${num(totals.margin_percent).toFixed(1)}%`,
      },
    );
  }

  return (
    <>
      <section className={cn(cardClass, "mb-6 p-5 md:p-6")}>
        <h2 className="mb-4 text-base font-semibold text-dark dark:text-white">
          Key figures
        </h2>

        <dl className="grid gap-4 sm:grid-cols-3 lg:grid-cols-7">
          {figures.map((figure) => (
            <div
              key={figure.label}
              className="rounded-lg border border-stroke bg-gray-1 px-4 py-3 dark:border-stroke-dark dark:bg-dark-2"
            >
              <dt className="text-[11px] font-medium uppercase tracking-wide text-dark-5 dark:text-dark-6">
                {figure.label}
              </dt>
              <dd className="mt-1 text-lg font-bold tabular-nums text-dark dark:text-white">
                {figure.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <BucketTable
          title="By company"
          labelHeader="Company"
          label={(b) => b.company_name ?? "—"}
          rows={summary.totals_by_company}
          showCosts={showCosts}
        />
        <BucketTable
          title="By employee"
          labelHeader="Employee"
          label={(b) => b.display_name ?? b.full_name ?? "—"}
          rows={summary.totals_by_user}
          showCosts={showCosts}
        />
        <BucketTable
          title="By service"
          labelHeader="Service"
          label={(b) => b.service_type ?? "—"}
          rows={summary.totals_by_service}
          showCosts={showCosts}
        />
        <BucketTable
          title="By department"
          labelHeader="Department"
          label={(b) => b.department_name ?? "—"}
          rows={summary.totals_by_department}
          showCosts={showCosts}
        />
        <BucketTable
          title="By vehicle condition"
          labelHeader="Condition"
          label={(b) => b.vehicle_condition ?? "—"}
          rows={summary.totals_by_condition}
          showCosts={showCosts}
        />
        <BucketTable
          title="By day"
          labelHeader="Date"
          label={(b) => shortDate(b.performed_at)}
          rows={summary.totals_by_day}
          showCosts={showCosts}
        />
      </div>
    </>
  );
}

function BucketTable({
  title,
  labelHeader,
  label,
  rows,
  showCosts,
}: {
  title: string;
  labelHeader: string;
  label: (bucket: SummaryBucket) => string;
  rows: SummaryBucket[];
  showCosts: boolean;
}) {
  if (!rows?.length) return null;

  return (
    <section className={cn(cardClass, "overflow-hidden")}>
      <h3 className="border-b border-stroke px-5 py-3 text-sm font-semibold text-dark dark:border-stroke-dark dark:text-white">
        {title}
      </h3>

      <div className="max-h-80 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-1 text-left text-xs uppercase tracking-wide text-dark-5 dark:bg-dark-2 dark:text-dark-6">
            <tr>
              <th className="px-5 py-2.5 font-semibold">{labelHeader}</th>
              <th className="px-3 py-2.5 text-center font-semibold">Qty</th>
              <th className="px-3 py-2.5 text-right font-semibold">Revenue</th>
              {showCosts && (
                <th className="px-5 py-2.5 text-right font-semibold">Margin</th>
              )}
            </tr>
          </thead>

          <tbody>
            {rows.map((bucket, index) => {
              const amount = num(bucket.total_amount);
              const cost = num(bucket.total_cost_amount);

              return (
                <tr
                  key={index}
                  className="border-t border-stroke dark:border-stroke-dark"
                >
                  <td className="px-5 py-2.5 text-dark dark:text-white">
                    {label(bucket)}
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums text-dark dark:text-white">
                    {num(bucket.total_quantity)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-dark dark:text-white">
                    {money(amount)}
                  </td>
                  {showCosts && (
                    <td className="px-5 py-2.5 text-right tabular-nums text-dark dark:text-white">
                      {money(amount - cost)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
