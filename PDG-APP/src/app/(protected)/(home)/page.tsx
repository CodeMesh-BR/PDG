"use client";
import { Suspense } from "react";
import { OverviewCardsGroup } from "./components/overview-cards";
import { OverviewCardsSkeleton } from "./components/overview-cards/skeleton";
import { WeeklyServicesChart } from "./components/WeeklyServiceChart";
import { FortnightServicesChart } from "./components/FortnightServicesChart";
import { useDashboardOverview } from "./useDashboardOverview";
import { CompaniesTodayList } from "./components/CompanieTodayList";

export default function Home() {
  return (
    <Suspense fallback={<OverviewCardsSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { data } = useDashboardOverview();

  if (!data) return null;

  return (
    <>
      <OverviewCardsGroup today={data.today} />
      <CompaniesTodayList />
      <WeeklyServicesChart data={data.week} />
      <FortnightServicesChart data={data.fortnight} />
    </>
  );
}
