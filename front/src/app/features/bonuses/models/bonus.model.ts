export type BonusStatus = 'active' | 'expired' | 'consumed';

// Modelo de Bonus tal como viene del API
export interface Bonus {
  id: number;
  patient_id: number;
  patient_name: string;
  sessions_number: number;
  price_per_session: number;
  total_price: number;
  remaining_sessions: number;
  used_sessions: number;
  status: BonusStatus;
  expiration_date: string;
  created_at: string;
  updated_at: string;
  usage_history: BonusUsageHistory[];
}

// Historial de uso de sesiones
export interface BonusUsageHistory {
  usage_date: string;
  session_status: string;
}

// Datos para crear un nuevo bono
export interface CreateBonusRequest {
  patient_id: number;
  sessions_number: number;
  price_per_session: number;
  total_price: number;
  expiration_date: string; // ISO date string (YYYY-MM-DD)
}

// Datos para actualizar fecha de expiración
export interface UpdateBonusRequest {
  expiration_date: string; // ISO date string (YYYY-MM-DD)
}

// Paginación (igual que en otros componentes)
export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  recordsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

// Respuesta completa del API para listar bonos
export interface BonusesApiResponse {
  success: boolean;
  pagination: PaginationData;
  data: Bonus[];
}

// Respuesta del API para crear/actualizar bono
export interface BonusApiResponse {
  success: boolean;
  data: Bonus;
}

// Resumen de bonos para las tarjetas
export interface BonusSummary {
  total: number;
  active: number;
  consumed: number;
  expired: number;
}
