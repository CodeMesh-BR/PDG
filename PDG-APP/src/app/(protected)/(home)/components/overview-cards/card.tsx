type PropsType = {
  label: string;
  data: {
    value: number | string;
  };
  Icon: React.ElementType;
};

export function OverviewCard({ label, data, Icon }: PropsType) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-1 dark:bg-gray-dark">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f3f3fe] text-[#5750f1]">
        <Icon size={28} />
      </div>

      <div>
        <dt className="text-2xl font-bold text-dark dark:text-white">
          {data.value}
        </dt>
        <dd className="text-sm font-medium text-dark-6">{label}</dd>
      </div>
    </div>
  );
}
