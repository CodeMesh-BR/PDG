

export interface Company {
  id: number;
  name: string;
  display_name: string | null;
  email: string;
  address: string | null;
  phone: string | null;
  created_at: string;
  default_service_id?: number | null;
  services?: Service[];
}

export interface Service {
  id: number;
  type: string;
  description: string;
  value: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  current_page: number;
  last_page: number;
}

export interface OcrResponse {
  plate: string;
  score: number;

  debug_raw_google?: string;
  debug_vehicle_box?: any;
  debug_plate_zone?: any;

  error?: string;
  message?: string;
}

export interface ServiceLog {
  id: number;
  company_id: number;
  service_id: number;
  car_plate: string;
  performed_at: string;
  quantity: number;
  notes: string | null;

  company: {
    id: number;
    name: string;
    display_name: string | null;
  };

  service: {
    id: number;
    type: string;
    description: string;
    value: string;
  };
}

export interface StartServicePayload {
  company_id: number;
  service_id: number;
  car_plate: string;
  date: string;
  quantity?: number;
  notes?: string | null;
  force?: boolean;
}

export interface StartServiceResponse {
  message: string;
  data?: {
    id: number;
    company_id: number;
    service_id: number;
    car_plate: string;
    performed_at: string;
    quantity: number;
    notes: string | null;
  };
  needs_confirmation?: boolean;
}
