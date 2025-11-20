"use client";

import { use } from "react";
import EditCompanyPage from "./EditCompanyPage";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return <EditCompanyPage id={Number(id)} />;
}
