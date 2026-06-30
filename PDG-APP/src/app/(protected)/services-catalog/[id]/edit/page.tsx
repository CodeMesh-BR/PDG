"use client";

import { useParams } from "react-router-dom";
import EditServicePage from "./EditServicesCatalogPage";

export default function Page() {
  const { id } = useParams<{ id: string }>();

  return <EditServicePage id={Number(id)} />;
}
