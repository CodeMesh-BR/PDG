"use client";

import { useEffect, useState } from "react";
import {
  Company,
  Service,
  ServiceLog,
  OcrResponse,
  VehicleCondition,
} from "./types";
import {
  fetchCompanies,
  fetchCompanyServices,
  fetchServiceLogs,
  sendOcrImage,
  startServiceLog,
} from "./api";
import { useDepartments, Department } from "../departments/useDepartments";

const OCR_MAX_DIMENSION = 1024;
const OCR_MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const OCR_OUTPUT_QUALITY = 0.8;

function normalizePlateValue(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const compact = cleaned.replace(/-+/g, "-").replace(/^-|-$/g, "");
  return compact;
}

function normalizeStockNumber(input: string): string {
  return input.trim().toUpperCase();
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

function extractStockNumberCandidate(rawText: string, plate: string): string {
  if (!rawText) return "";

  const platePlain = plate.replace(/-/g, "").toUpperCase();
  const lines = rawText.toUpperCase().split(/\r?\n/);
  const labelPattern = /\b(STOCK|STK|S\/N|INV(?:ENTORY)?|UNIT)\b/;

  for (const line of lines) {
    if (!labelPattern.test(line)) continue;

    const matches = line.match(/[A-Z0-9][A-Z0-9-]{2,19}/g) ?? [];
    for (const match of matches) {
      const candidate = normalizeStockNumber(match);
      const plain = candidate.replace(/-/g, "");

      if (
        plain.length >= 3 &&
        plain.length <= 20 &&
        /\d/.test(plain) &&
        plain !== platePlain &&
        !["STOCK", "STK", "NUMBER", "UNIT", "INVENTORY", "INV"].includes(plain)
      ) {
        return candidate;
      }
    }
  }

  return "";
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

async function prepareImageForOcr(
  file: File,
  log?: (msg: string) => void,
): Promise<File> {
  if (typeof window === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;

  const isHeic =
    /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
  const isCommonType =
    file.type === "image/jpeg" ||
    file.type === "image/jpg" ||
    file.type === "image/png" ||
    file.type === "image/webp";

  let width = 0;
  let height = 0;
  let drawSource: CanvasImageSource;
  let bitmap: ImageBitmap | null = null;

  // Prefer createImageBitmap: it handles EXIF orientation natively and uses
  // less memory than HTMLImageElement on mobile devices.
  try {
    if (typeof createImageBitmap === "function") {
      bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      width = bitmap.width;
      height = bitmap.height;
      drawSource = bitmap;
      log?.(`Decoded via createImageBitmap: ${width}x${height}`);
    } else {
      throw new Error("createImageBitmap not available");
    }
  } catch {
    try {
      const image = await loadImage(file);
      width = image.naturalWidth || image.width;
      height = image.naturalHeight || image.height;
      drawSource = image;
      log?.(`Decoded via HTMLImageElement: ${width}x${height}`);
    } catch {
      console.warn("[OCR prep] Could not decode image", {
        name: file.name,
        size: file.size,
        type: file.type,
      });
      return file;
    }
  }

  if (width <= 0 || height <= 0) {
    if (bitmap) bitmap.close();
    return file;
  }

  const needsResize =
    width > OCR_MAX_DIMENSION ||
    height > OCR_MAX_DIMENSION ||
    file.size > OCR_MAX_SOURCE_BYTES;

  if (!needsResize && isCommonType && !isHeic) {
    log?.(
      `No resize needed: ${width}x${height}, ${(file.size / 1024).toFixed(0)}KB`,
    );
    if (bitmap) bitmap.close();
    return file;
  }

  const scale = Math.min(1, OCR_MAX_DIMENSION / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  console.info("[OCR prep] Resizing image", {
    original: `${width}x${height}`,
    target: `${targetWidth}x${targetHeight}`,
    originalSize: file.size,
    type: file.type,
  });

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

  // Try toBlob at progressively lower quality — on mobile browsers toBlob can
  // return null when the canvas pixel budget is exceeded.
  let blob = await canvasToJpegBlob(canvas, OCR_OUTPUT_QUALITY);
  if (!blob) {
    log?.(`toBlob null at quality ${OCR_OUTPUT_QUALITY}, retrying 0.7`);
    console.warn(
      "[OCR prep] toBlob returned null at quality",
      OCR_OUTPUT_QUALITY,
    );
    blob = await canvasToJpegBlob(canvas, 0.7);
  }
  if (!blob) {
    log?.("toBlob null at 0.7, retrying 0.5");
    console.warn("[OCR prep] toBlob returned null at quality 0.7");
    blob = await canvasToJpegBlob(canvas, 0.5);
  }

  canvas.width = 0;
  canvas.height = 0;

  if (!blob) {
    log?.("ALL toBlob attempts failed — sending original file");
    console.warn("[OCR prep] All toBlob attempts failed, using original file", {
      name: file.name,
      size: file.size,
    });
    return file;
  }

  log?.(`Resize OK: ${(blob.size / 1024).toFixed(0)}KB`);
  console.info("[OCR prep] Resize complete", { outputSize: blob.size });

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
  departments: Department[];
  loadingDepartments: boolean;
  selectedDepartment: number | null;
  setSelectedDepartment: (id: number | null) => void;
  requiresNewUsed: boolean;
  refreshDepartments: () => Promise<void>;
  vehicleImage: File | null;
  ocrData: OcrResponse | null;
  loadingOcr: boolean;
  plate?: string;
  setPlate: (value: string) => void;
  vehicleCondition: VehicleCondition | "";
  setVehicleCondition: (value: VehicleCondition | "") => void;
  stockNumber: string;
  setStockNumber: (value: string) => void;
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
  debugLogs: string[];
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

  const {
    departments,
    loading: loadingDepartments,
    refresh: refreshDepartments,
  } = useDepartments();
  const [selectedDepartment, setSelectedDepartmentState] = useState<
    number | null
  >(null);

  const setSelectedDepartment = (id: number | null) => {
    setSelectedDepartmentState(id);
  };

  const setSelectedCompany = (id: number | null) => {
    setSelectedCompanyState(id);
    setSelectedServiceState(null);
    setSelectedDepartmentState(null);
    setServices([]);
    setPlate("");
    setVehicleCondition("");
    setStockNumber("");
  };

  const setSelectedService = (id: number | null) => {
    setSelectedServiceState(id);
    setVehicleCondition("");
    setStockNumber("");
    setPlate("");

    const svc = services.find((item) => item.id === id);
    setSelectedDepartmentState(svc?.department_id ?? null);
  };

  const selectedServiceData =
    services.find((item) => item.id === selectedService) ?? null;

  const effectiveDepartment: Department | null =
    departments.find((d) => d.id === selectedDepartment) ??
    selectedServiceData?.department ??
    null;

  const requiresNewUsed = effectiveDepartment?.name === "New / Used";

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
  const [vehicleCondition, setVehicleCondition] = useState<VehicleCondition | "">("");
  const [stockNumber, setStockNumberState] = useState("");
  const [ocrError, setOcrError] = useState(false);
  const [ocrDebugId, setOcrDebugId] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addDebugLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setDebugLogs((prev) => [...prev, `[${ts}] ${msg}`]);
  };

  const setStockNumber = (value: string) => {
    setStockNumberState(normalizeStockNumber(value));
  };

  const handleImageChange = async (file: File | null) => {
    setOcrError(false);
    setDebugLogs([]);

    if (!file) {
      setVehicleImage(null);
      setOcrData(null);
      setPlate("");
      setOcrDebugId(null);
      return;
    }

    addDebugLog(
      `Input: ${file.name} | ${file.type} | ${(file.size / 1024).toFixed(0)}KB`,
    );
    const uploadFile = await prepareImageForOcr(file, addDebugLog);

    addDebugLog(
      uploadFile !== file
        ? `Resized: ${(uploadFile.size / 1024).toFixed(0)}KB (${uploadFile.type})`
        : `No resize needed (${(file.size / 1024).toFixed(0)}KB)`,
    );

    console.info("[OCR] Image prepared", {
      originalSize: file.size,
      originalType: file.type,
      uploadSize: uploadFile.size,
      uploadType: uploadFile.type,
      wasResized: uploadFile !== file,
    });

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
      const finalPlate = detectedPlate || fallbackPlate;
      const detectedStockNumber = normalizeStockNumber(data.stock_number ?? "");
      const fallbackStockNumber = extractStockNumberCandidate(
        data.debug_raw_google ?? "",
        finalPlate,
      );

      addDebugLog(
        `OCR response: plate="${data.plate ?? ""}" stock="${data.stock_number ?? ""}" raw="${(data.debug_raw_google ?? "").slice(0, 80)}`,
      );
      addDebugLog(
        `Detected plate: "${detectedPlate}" Fallback plate: "${fallbackPlate}" Stock: "${detectedStockNumber || fallbackStockNumber}"`,
      );

      setOcrData(data);
      setPlate(finalPlate);
      setStockNumber(detectedStockNumber || fallbackStockNumber);
      setOcrDebugId(data.debug_request_id ?? null);
      setOcrError(finalPlate === "" && (detectedStockNumber || fallbackStockNumber) === "");
    } catch (err) {
      addDebugLog(
        `OCR error: ${err instanceof Error ? err.message : String(err)}`,
      );
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
    if (!selectedCompany || !selectedService) return;

    const normalizedStockNumber = normalizeStockNumber(stockNumber);

    if (requiresNewUsed) {
      if (!vehicleCondition || !normalizedStockNumber) return;
      if (vehicleCondition === "used" && !plate) return;
    } else if (!plate) {
      return;
    }

    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    const payloadVehicleCondition = requiresNewUsed
      ? (vehicleCondition as VehicleCondition)
      : null;

    const { status, data } = await startServiceLog({
      company_id: selectedCompany,
      service_id: selectedService,
      department_id: selectedDepartment,
      car_plate: requiresNewUsed && vehicleCondition === "new" ? null : plate,
      vehicle_condition: payloadVehicleCondition,
      stock_number: requiresNewUsed ? normalizedStockNumber : null,
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
    if (!selectedCompany || !selectedService) return;

    const normalizedStockNumber = normalizeStockNumber(stockNumber);

    if (requiresNewUsed) {
      if (!vehicleCondition || !normalizedStockNumber) return;
      if (vehicleCondition === "used" && !plate) return;
    } else if (!plate) {
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const payloadVehicleCondition = requiresNewUsed
      ? (vehicleCondition as VehicleCondition)
      : null;

    await startServiceLog({
      company_id: selectedCompany,
      service_id: selectedService,
      department_id: selectedDepartment,
      car_plate: requiresNewUsed && vehicleCondition === "new" ? null : plate,
      vehicle_condition: payloadVehicleCondition,
      stock_number: requiresNewUsed ? normalizedStockNumber : null,
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
    departments,
    loadingDepartments,
    selectedDepartment,
    setSelectedDepartment,
    requiresNewUsed,
    refreshDepartments,

    vehicleImage,
    ocrData,
    loadingOcr,
    plate,
    setPlate,
    vehicleCondition,
    setVehicleCondition,
    stockNumber,
    setStockNumber,
    handleImageChange,

    saving,
    duplicateWarning,
    setDuplicateWarning,
    handleStart,
    confirmStart,
    ocrError,
    ocrDebugId,
    debugLogs,
  };
}
