"use client";

import { compactFormat } from "@/lib/format-number";
import { OverviewCard } from "./card";
import { Car, DollarSign } from "lucide-react";

type Props = {
  today: {
    cars: number;
    companies: number;
    revenue: number;
  };
};

export function OverviewCardsGroup({ today }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <OverviewCard
        label="Cars Today"
        data={{ value: compactFormat(today.cars) }}
        Icon={Car}
      />

      <OverviewCard
        label="Today Revenue"
        data={{ value: "$" + compactFormat(today.revenue) }}
        Icon={DollarSign}
      />
    </div>
  );
}
