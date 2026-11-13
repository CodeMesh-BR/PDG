interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function SearchBox({ value, onChange, placeholder }: Props) {
  return (
    <div className="flex w-full gap-2 sm:w-[420px]">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
      />
      {value.trim() !== "" && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
        >
          Clear
        </button>
      )}
    </div>
  );
}
