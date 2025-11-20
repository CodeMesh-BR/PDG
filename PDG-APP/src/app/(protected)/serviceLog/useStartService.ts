// app/services/start/useStartService.ts

import { useState, useEffect } from "react";
import {
  fetchCompanies,
  fetchCompanyServices,
  sendOcrImage,
  startServiceLog,
  fetchTodayLogs
} from "./api";

import {
  Company,
  Service,
  OcrResponse,
  ServiceLog
} from "./types";

export function useStartService() {
  // -------------------------
  // LISTAGEM
  // -------------------------
  const [logs, setLogs] = useState<ServiceLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [errorLogs, setErrorLogs] = useState("");
  const [total, setTotal] = useState(0);

  const refreshLogs = async () => {
    try {
      setLoadingLogs(true);
      const response = await fetchTodayLogs();
      setLogs(response.data);
      setTotal(response.total);
    } catch (err) {
      setErrorLogs("Erro ao carregar serviços de hoje.");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  // -------------------------
  // FORM: Companies / Services
  // -------------------------
  const [companies, setCompanies] = useState<Company[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<number | null>(null);

  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  useEffect(() => {
    async function load() {
      setLoadingCompanies(true);
      const result = await fetchCompanies();
      setCompanies(result.data.data ?? []);
      setLoadingCompanies(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedCompany) return;
    async function load() {
      setLoadingServices(true);
      const srv = await fetchCompanyServices(selectedCompany);
      setServices(srv);
      setLoadingServices(false);
    }
    load();
  }, [selectedCompany]);

  // -------------------------
  // FORM: OCR
  // -------------------------
  const [vehicleImage, setVehicleImage] = useState<File | null>(null);
 const [ocrData, setOcrData] = useState<OcrResponse | null>(null);
  const [loadingOcr, setLoadingOcr] = useState(false);
  const [plate, setPlate] = useState("");

const handleImageChange = async (file: File | null) => {
  setVehicleImage(file);

  if (!file) {
    setOcrData(null);
    return;
  }

  setLoadingOcr(true);
  try {
   const result = await sendOcrImage(file);
setOcrData(result);
setPlate(result.plate); 
  } finally {
    setLoadingOcr(false);
  }
};

  // -------------------------
  // FORM: Start service
  // -------------------------
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleStart = async () => {
    if (!selectedCompany || !selectedService || !ocrData) return;

    setSaving(true);

    const { status, data } = await startServiceLog({
      company_id: selectedCompany,
      service_id: selectedService,
      car_plate: plate,
      date: new Date().toISOString()
    });

    setSaving(false);

    if (status === 409 && data?.needs_confirmation) {
      setDuplicateWarning(true);
      return { needsConfirmation: true };
    }

    return { success: true };
  };

  const confirmStart = async () => {
    const { data } = await startServiceLog({
      company_id: selectedCompany!,
      service_id: selectedService!,
      car_plate: plate,
      date: new Date().toISOString(),
      force: true
    });

    return data;
  };

  return {
    // Listagem
    logs,
    loadingLogs,
    errorLogs,
    total,
    refreshLogs,

    // Form
    companies,
    services,
    selectedCompany,
    selectedService,
    vehicleImage,
    ocrData,
    duplicateWarning,

    loadingCompanies,
    loadingServices,
    loadingOcr,
    saving,

    // Setters
    setSelectedCompany,
    setSelectedService,
    setVehicleImage,
    setDuplicateWarning,

    // Handlers
    handleImageChange,
    handleStart,
    confirmStart,

    plate,
setPlate,
  };
}
