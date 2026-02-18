"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  fetchServiceLog,
  updateServiceLog,
  fetchCompanyServices,
  fetchCompanies,
} from "../../api";
import { ServiceLog, Company, Service } from "../../types";
import { Button } from "@/components/ui-elements/button";

export default function EditServicePage() {
  const router = useRouter();
  const { id } = useParams();

  const [log, setLog] = useState<ServiceLog | null>(null);
  const [loading, setLoading] = useState(true);

  const [company, setCompany] = useState<number | null>(null);
  const [service, setService] = useState<number | null>(null);
  const [plate, setPlate] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");

  const [companyList, setCompanyList] = useState<Company[]>([]);
  const [serviceList, setServiceList] = useState<Service[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const result = await fetchServiceLog(Number(id));
      setLog(result);
      setLoading(false);

      if (result) {
        setCompany(result.company_id);
        setService(result.service_id);
        setPlate(result.car_plate);
        setQuantity(result.quantity);
        setNotes(result.notes ?? "");
      }
    };
    void load();
  }, [id]);

  useEffect(() => {
    void fetchCompanies().then((res) => setCompanyList(res.data));
  }, []);

  useEffect(() => {
    if (!company) return;
    void fetchCompanyServices(company).then(setServiceList);
  }, [company]);

  const handleSave = async () => {
    if (!company || !service || !plate) return;

    setSaving(true);

    await updateServiceLog(Number(id), {
      company_id: company,
      service_id: service,
      car_plate: plate,
      quantity,
      notes,
    });

    setSaving(false);
    router.push("/start-service");
  };

  if (loading) return <p className="p-6">Carregando...</p>;

  if (!log) return <p className="p-6 text-red-500">Serviço não encontrado.</p>;

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">Edit service #{log.id}</h1>

      <label className="mb-1 block">Company</label>
      <select
        value={company ?? ""}
        onChange={(e) => setCompany(Number(e.target.value))}
        className="mb-4 w-full border p-2"
      >
        <option value="">Select...</option>
        {companyList.map((c) => (
          <option key={c.id} value={c.id}>
            {c.display_name ?? c.name}
          </option>
        ))}
      </select>

      <label className="mb-1 block">Service</label>
      <select
        value={service ?? ""}
        onChange={(e) => setService(Number(e.target.value))}
        className="mb-4 w-full border p-2"
      >
        <option value="">Select...</option>
        {serviceList.map((s) => (
          <option key={s.id} value={s.id}>
            {s.type}
          </option>
        ))}
      </select>

      <label className="mb-1 block">Plate</label>
      <input
        className="mb-4 w-full border p-2 uppercase"
        value={plate}
        onChange={(e) => setPlate(e.target.value.toUpperCase())}
      />

      <label className="mb-1 block">Quantity</label>
      <input
        type="number"
        className="mb-4 w-full border p-2"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
      />

      <label className="mb-1 block">Notes</label>
      <textarea
        className="mb-6 w-full border p-2"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <Button
        label={saving ? "Saving..." : "Save"}
        onClick={handleSave}
        disabled={saving}
      />
    </div>
  );
}
