
"use client";

import { useEffect, useState } from "react";
import {
  Company,
  Service,
  ServiceLog,
  OcrResponse,
} from "./types";
import {
  fetchCompanies,
  fetchCompanyServices,
  fetchTodayLogs,
  sendOcrImage,
  startServiceLog,
} from "./api";

export interface UseStartServiceResult {
  logs: ServiceLog[];
  total: number;
  loadingLogs: boolean;
  errorLogs: string | null;
  refreshLogs: () => Promise<void>;
  companies: Company[];
  services: Service[];
  selectedCompany: number | null;
  selectedService: number | null;
  loadingCompanies: boolean;
  loadingServices: boolean;
  setSelectedCompany: (id: number | null) => void;
  setSelectedService: (id: number | null) => void;
  vehicleImage: File | null;
  ocrData: OcrResponse | null;
  loadingOcr: boolean;
  plate?: string;
  setPlate: (value: string) => void;
  handleImageChange: (file: File | null) => Promise<void>;
  saving: boolean;
  duplicateWarning: boolean;
  setDuplicateWarning: (value: boolean) => void;
  handleStart: () => Promise<{ success?: boolean; needsConfirmation?: boolean } | void>;
  confirmStart: () => Promise<void>;
}

export function useStartService(): UseStartServiceResult {
  const [logs, setLogs] = useState<ServiceLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [errorLogs, setErrorLogs] = useState<string | null>(null);

  const refreshLogs = async () => {
    try {
      setLoadingLogs(true);
      setErrorLogs(null);
      const result = await fetchTodayLogs();
      setLogs(result.data);
      setTotal(result.total);
    } catch {
      setErrorLogs("Erro ao carregar serviços de hoje.");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    void refreshLogs();
  }, []);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  const [selectedCompany, setSelectedCompanyState] = useState<number | null>(
    null
  );
  const [selectedService, setSelectedServiceState] = useState<number | null>(
    null
  );

  const setSelectedCompany = (id: number | null) => {
    setSelectedCompanyState(id);
    setSelectedServiceState(null);
    setServices([]);
  };

  const setSelectedService = (id: number | null) => {
    setSelectedServiceState(id);
  };

  useEffect(() => {
    const load = async () => {
      setLoadingCompanies(true);
      try {
        const result = await fetchCompanies();
        setCompanies(result.data);
      } finally {
        setLoadingCompanies(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!selectedCompany) {
      setServices([]);
      return;
    }

    const load = async () => {
      setLoadingServices(true);
      try {
        const srv = await fetchCompanyServices(selectedCompany);
        setServices(Array.isArray(srv) ? srv : []);
      } finally {
        setLoadingServices(false);
      }
    };
    void load();
  }, [selectedCompany]);

  const [vehicleImage, setVehicleImage] = useState<File | null>(null);
  const [ocrData, setOcrData] = useState<OcrResponse | null>(null);
  const [loadingOcr, setLoadingOcr] = useState(false);
  const [plate, setPlate] = useState("");

  const handleImageChange = async (file: File | null) => {
    setVehicleImage(file);

    if (!file) {
      setOcrData(null);
      setPlate("");
      return;
    }

    setLoadingOcr(true);
    try {
      const { status, data } = await sendOcrImage(file);

      if (status !== 200 || !data) {
        setOcrData(null);
        setPlate("");
        return;
      }

      setOcrData(data);
      setPlate(data.plate !== '' ? data.plate : data.debug_raw_google || '');
    } finally {
      setLoadingOcr(false);
    }
  };

  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleStart = async (): Promise<{
    success?: boolean;
    needsConfirmation?: boolean;
  } | void> => {
    if (!selectedCompany || !selectedService || !plate) return;

    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);

    const { status, data } = await startServiceLog({
      company_id: selectedCompany,
      service_id: selectedService,
      car_plate: plate,
      date: today,
    });

    setSaving(false);

    if (status === 409 && data?.needs_confirmation) {
      setDuplicateWarning(true);
      return { needsConfirmation: true };
    }

    if (status >= 200 && status < 300) {
      return { success: true };
    }

    return;
  };

  const confirmStart = async (): Promise<void> => {
    if (!selectedCompany || !selectedService || !plate) return;

    const today = new Date().toISOString().slice(0, 10);

    await startServiceLog({
      company_id: selectedCompany,
      service_id: selectedService,
      car_plate: plate,
      date: today,
      force: true,
    });
  };

  return {
    logs,
    total,
    loadingLogs,
    errorLogs,
    refreshLogs,

    companies,
    services,
    selectedCompany,
    selectedService,
    loadingCompanies,
    loadingServices,
    setSelectedCompany,
    setSelectedService,

    vehicleImage,
    ocrData,
    loadingOcr,
    plate,
    setPlate,
    handleImageChange,

    saving,
    duplicateWarning,
    setDuplicateWarning,
    handleStart,
    confirmStart,
  };
}
