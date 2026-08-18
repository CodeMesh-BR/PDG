import { useState } from "react";

import { ChevronUpIcon } from "@/assets/icons";
import { Dropdown, DropdownContent, DropdownTrigger } from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";

import { DETAILED_COLUMN_OPTIONS } from "./columns";

type ColumnsMenuProps = {
  showCosts: boolean;
  visible: Set<string>;
  onToggle: (key: string) => void;
};

export function ColumnsMenu({ showCosts, visible, onToggle }: ColumnsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const options = DETAILED_COLUMN_OPTIONS.filter(
    (o) => !o.costOnly || showCosts,
  );
  const visibleCount = options.filter((o) => visible.has(o.key)).length;

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger
        className="flex h-9 items-center gap-x-1.5 rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-dark-5 outline-none transition hover:text-dark dark:border-stroke-dark dark:bg-dark-2 dark:text-dark-6 dark:hover:text-white [&[data-state='open']>svg]:rotate-0"
      >
        <span>
          Columns ({visibleCount}/{options.length})
        </span>
        <ChevronUpIcon className="size-4 rotate-180 transition-transform" />
      </DropdownTrigger>

      <DropdownContent
        align="end"
        className="min-w-[13rem] rounded-lg border border-stroke bg-white p-2 shadow-md dark:border-stroke-dark dark:bg-dark-2"
      >
        <ul className="flex flex-col gap-0.5">
          {options.map((option) => (
            <li key={option.key}>
              <label
                className={cn(
                  "flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-sm text-dark hover:bg-gray-1 dark:text-white dark:hover:bg-dark-3",
                )}
              >
                <input
                  type="checkbox"
                  checked={visible.has(option.key)}
                  onChange={() => onToggle(option.key)}
                  className="size-4 rounded border-stroke text-primary focus:ring-primary dark:border-stroke-dark"
                />
                {option.label}
              </label>
            </li>
          ))}
        </ul>
      </DropdownContent>
    </Dropdown>
  );
}
