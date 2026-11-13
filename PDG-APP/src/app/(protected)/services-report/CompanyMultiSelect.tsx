import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type CompanyOption = { id: number; name?: string; display_name?: string | null };

interface Props {
  companies: CompanyOption[];
  value: number[];
  onChange: (ids: number[]) => void;
  className?: string;
  labelId?: string;
}

export const companyName = (c: CompanyOption) => c.display_name ?? c.name ?? "—";

/** Dropdown with checkboxes; an empty selection means "All companies". */
export function CompanyMultiSelect({
  companies,
  value,
  onChange,
  className,
  labelId,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggle = (id: number) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  const selected = companies.filter((c) => value.includes(c.id));
  const summary =
    selected.length === 0
      ? "All companies"
      : selected.length <= 2
        ? selected.map(companyName).join(", ")
        : `${selected.length} companies selected`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelId}
        onClick={() => setOpen((o) => !o)}
        className={cn("flex items-center justify-between gap-2 text-left", className)}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cn("shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-20 mt-1 max-h-64 w-full min-w-[14rem] overflow-y-auto rounded-lg border border-stroke bg-white py-1 shadow-lg dark:border-stroke-dark dark:bg-dark-2"
        >
          <button
            type="button"
            onClick={() => onChange([])}
            className="w-full px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-primary hover:bg-gray-1 dark:hover:bg-dark-3"
          >
            All companies
          </button>

          {companies.map((c) => (
            <label
              key={c.id}
              role="option"
              aria-selected={value.includes(c.id)}
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-dark hover:bg-gray-1 dark:text-white dark:hover:bg-dark-3"
            >
              <input
                type="checkbox"
                checked={value.includes(c.id)}
                onChange={() => toggle(c.id)}
              />
              {companyName(c)}
            </label>
          ))}

          {companies.length === 0 && (
            <p className="px-3 py-2 text-sm text-dark-5">No companies available.</p>
          )}
        </div>
      )}
    </div>
  );
}
