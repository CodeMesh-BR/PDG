"use client";

import { use } from "react";
import EditServicePage from "./EditServicesCatalogPage";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return <EditServicePage id={Number(id)} />;
}
