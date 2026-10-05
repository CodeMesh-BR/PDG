import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  pageSize: number;
  totalItems: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

type PageItem = number | "ellipsis-start" | "ellipsis-end";

/** First, last and the pages around the current one; gaps collapse into "…". */
function getPageItems(page: number, lastPage: number): PageItem[] {
  if (lastPage <= 7) {
    return Array.from({ length: lastPage }, (_, i) => i + 1);
  }

  const start = Math.max(2, Math.min(page - 1, lastPage - 4));
  const end = Math.min(lastPage - 1, Math.max(page + 1, 5));
  const items: PageItem[] = [1];

  if (start > 2) items.push("ellipsis-start");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < lastPage - 1) items.push("ellipsis-end");

  items.push(lastPage);
  return items;
}

const navButtonClass =
  "flex h-9 items-center gap-1 rounded-md border border-gray-300 px-2 text-sm text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800";

export default function ListPagination({
  page,
  pageSize,
  totalItems,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const lastPage = Math.max(1, Math.ceil(totalItems / pageSize));
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t border-gray-200 px-2 py-3 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span>
          Showing {from}–{to} of {totalItems}
        </span>

        <label className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-400">Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={navButtonClass}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {getPageItems(page, lastPage).map((item) =>
          typeof item === "number" ? (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-label={`Page ${item}`}
              aria-current={item === page ? "page" : undefined}
              className={`h-9 min-w-[2.25rem] rounded-md px-2 text-sm transition ${
                item === page
                  ? "bg-gray-900 font-medium text-white dark:bg-white dark:text-gray-900"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {item}
            </button>
          ) : (
            <span
              key={item}
              className="px-1 text-gray-400"
              aria-hidden="true"
            >
              …
            </span>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= lastPage}
          className={navButtonClass}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
