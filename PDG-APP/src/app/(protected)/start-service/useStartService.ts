"use client";

import { useEffect, useState } from "react";
import { Company, Service, ServiceLog, OcrResponse } from "./types";
import {
  fetchCompanies,
  fetchCompanyServices,
  fetchServiceLogs,
  sendOcrImage,
  startServiceLog,
} from "./api";

const OCR_MAX_DIMENSION = 3072;
const OCR_MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const OCR_OUTPUT_QUALITY = 0.9;

function normalizePlateValue(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const compact = cleaned.replace(/-+/g, "-").replace(/^-|-$/g, "");
  return compact;
}

function extractPlateCandidate(rawText: string): string {
  if (!rawText) return "";

  const upper = rawText.toUpperCase();
  const directMatches = upper.match(/[A-Z0-9-]{4,10}/g) ?? [];
  const parts = upper.match(/[A-Z0-9]{1,10}/g) ?? [];

  const joinedMatches: string[] = [];
  for (let start = 0; start < parts.length; start++) {
    let noSep = "";
    let withSep = "";
    for (let end = start; end < parts.length && end < start + 3; end++) {
      noSep += parts[end];
      withSep = withSep === "" ? parts[end] : `${withSep}-${parts[end]}`;
      joinedMatches.push(noSep, withSep);
    }
  }

  const scored = [...directMatches, ...joinedMatches]
    .map((token) => normalizePlateValue(token))
    .filter((token) => {
      const plain = token.replace(/-/g, "");
      return (
        plain.length >= 4 &&
        plain.length <= 10 &&
        /[A-Z]/.test(plain) &&
        /\d/.test(plain)
      );
    })
    .sort((a, b) => {
      const plainA = a.replace(/-/g, "");
      const plainB = b.replace(/-/g, "");
      const scoreA =
        (/[A-Z]/.test(plainA) && /\d/.test(plainA) ? 10 : 0) -
        Math.abs(7 - plainA.length);
      const scoreB =
        (/[A-Z]/.test(plainB) && /\d/.test(plainB) ? 10 : 0) -
        Math.abs(7 - plainB.length);
      return scoreA - scoreB;
    });

  return scored.at(-1) ?? "";
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image_load_failed"));
    };

    image.src = url;
  });
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });
}

async function prepareImageForOcr(file: File): Promise<File> {
  if (typeof window === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;

  let width = 0;
  let height = 0;
  let drawSource: CanvasImageSource;
  let bitmap: ImageBitmap | null = null;

  try {
    const image = await loadImage(file);
    width = image.naturalWidth || image.width;
    height = image.naturalHeight || image.height;
    drawSource = image;
  } catch {
    if (typeof createImageBitmap !== "function") return file;
    try {
      bitmap = await createImageBitmap(file);
      width = bitmap.width;
      height = bitmap.height;
      drawSource = bitmap;
    } catch {
      return file;
    }
  }

  if (width <= 0 || height <= 0) {
    if (bitmap) bitmap.close();
    return file;
  }

  const scale = Math.min(1, OCR_MAX_DIMENSION / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const isHeic =
    /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
  const isCommonType =
    file.type === "image/jpeg" ||
    file.type === "image/jpg" ||
    file.type === "image/png" ||
    file.type === "image/webp";
  const needsResize =
    width > OCR_MAX_DIMENSION ||
    height > OCR_MAX_DIMENSION ||
    file.size > OCR_MAX_SOURCE_BYTES;

  if (!needsResize && isCommonType && !isHeic) {
    if (bitmap) bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    if (bitmap) bitmap.close();
    return file;
  }

  ctx.drawImage(drawSource, 0, 0, targetWidth, targetHeight);
  if (bitmap) bitmap.close();

  const blob = await canvasToJpegBlob(canvas, OCR_OUTPUT_QUALITY);
  canvas.width = 0;
  canvas.height = 0;

  if (!blob) return file;

  const baseName = file.name.replace(/\.[^/.]+$/, "") || "plate";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export interface UseStartServiceResult {
  logs: ServiceLog[];
  total: number;
  loadingLogs: boolean;
  errorLogs: string | null;
  refreshLogs: () => Promise<void>;
  selectedDate: string;
  setSelectedDate: (value: string) => void;
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
  handleStart: () => Promise<{
    success?: boolean;
    needsConfirmation?: boolean;
  } | void>;
  confirmStart: () => Promise<void>;
  ocrError: boolean;
  ocrDebugId: string | null;
}

export function useStartService(): UseStartServiceResult {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [logs, setLogs] = useState<ServiceLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [errorLogs, setErrorLogs] = useState<string | null>(null);

  const refreshLogs = async () => {
    try {
      setLoadingLogs(true);
      setErrorLogs(null);
      const result = await fetchServiceLogs(selectedDate);
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
  }, [selectedDate]);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  const [selectedCompany, setSelectedCompanyState] = useState<number | null>(
    null,
  );
  const [selectedService, setSelectedServiceState] = useState<number | null>(
    null,
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
  const [ocrError, setOcrError] = useState(false);
  const [ocrDebugId, setOcrDebugId] = useState<string | null>(null);

  const handleImageChange = async (file: File | null) => {
    setOcrError(false);

    if (!file) {
      setVehicleImage(null);
      setOcrData(null);
      setPlate("");
      setOcrDebugId(null);
      return;
    }

    const uploadFile = await prepareImageForOcr(file);
    setVehicleImage(uploadFile);

    setLoadingOcr(true);
    try {
      let { status, data } = await sendOcrImage(uploadFile);

      if ((status !== 200 || !data) && uploadFile !== file) {
        const retry = await sendOcrImage(file);
        status = retry.status;
        data = retry.data;
        setVehicleImage(file);
      }

      if (status !== 200 || !data) {
        setOcrData(null);
        setPlate("");
        setOcrDebugId(data?.debug_request_id ?? null);
        setOcrError(true);
        return;
      }

      const detectedPlate = normalizePlateValue(data.plate ?? "");
      const fallbackPlate = extractPlateCandidate(data.debug_raw_google ?? "");

      setOcrData(data);
      setPlate(detectedPlate || fallbackPlate);
      setOcrDebugId(data.debug_request_id ?? null);
      setOcrError(detectedPlate === "" && fallbackPlate === "");
    } catch {
      setOcrData(null);
      setPlate("");
      setOcrDebugId(null);
      setOcrError(true);
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
    selectedDate,
    setSelectedDate,

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
    ocrError,
    ocrDebugId,
  };
}
