"use client";

import { useParams } from "react-router-dom";
import EditCompanyPage from "./EditCompanyPage";

export default function Page() {
  const { id } = useParams<{ id: string }>();

  return <EditCompanyPage id={Number(id)} />;
}
