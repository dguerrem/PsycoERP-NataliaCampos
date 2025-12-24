/**
 * Modelos de datos para el módulo de facturación
 */

export interface ClinicTotal {
  clinic_name: string;
  total_sessions: number;
  total_gross: number;
  clinic_percentage: number;
  total_net: number;
  total_bonuses: number;
  bonuses_revenue: number;
}

export interface InvoiceKPIs {
  filters_applied: {
    month: number;
    year: number;
  };
  card1_total_invoices_issued: number;
  card2_total_gross_historic: number;
  card3_total_gross_filtered: number;
  card4_total_net_filtered: number;
  card5_total_net_by_clinic: ClinicTotal[];
}

export interface ClinicInfo {
  clinic_name: string;
  color: string;
}

export interface SessionDetail {
  session_id: number;
  session_date: string;
  price: number;
  payment_method?: string;
}

/**
 * Datos de un progenitor
 */
export interface ProgenitorData {
  full_name: string | null;
  dni: string | null;
  phone: string | null;
}

/**
 * Datos de progenitores para pacientes menores
 */
export interface ProgenitorsData {
  progenitor1: ProgenitorData;
  progenitor2: ProgenitorData;
}

export interface PendingInvoice {
  patient_id: number | null; // Puede ser null en llamadas (personas no registradas)
  patient_full_name: string;
  dni: string;
  email: string;
  patient_address_line1: string;
  patient_address_line2: string;
  clinic_name: string;
  sessions: SessionDetail[];
  pending_sessions_count: number;
  total_gross: number;
  progenitors_data?: ProgenitorsData;
  /** Tipo de factura: 'session' para sesiones, 'call' para llamadas */
  invoice_type?: 'session' | 'call';
}

export interface PendingInvoicesResponse {
  filters_applied: {
    month: number;
    year: number;
  };
  pending_invoices: PendingInvoice[];
  /** Llamadas pendientes de facturar (misma estructura que pending_invoices) */
  pending_calls: PendingInvoice[];
}

export interface ExistingInvoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  patient_id: number | null; // Puede ser null en facturas de llamadas
  patient_full_name: string;
  dni: string;
  email: string;
  patient_address_line1: string;
  patient_address_line2: string;
  sessions: SessionDetail[];
  sessions_count: number;
  total: number;
  concept: string;
  progenitors_data?: ProgenitorsData;
  /** Tipo de factura: 'session' para sesiones, 'call' para llamadas */
  invoice_type?: 'session' | 'call';
}

export interface ExistingInvoicesResponse {
  filters_applied: {
    month: number;
    year: number;
  };
  total_invoices: number;
  invoices: ExistingInvoice[];
  /** Número total de facturas de llamadas */
  total_call_invoices: number;
  /** Facturas de llamadas ya generadas */
  call_invoices: ExistingInvoice[];
}

export interface ApiResponse<T> {
  data: T;
}

/**
 * Request para crear una factura individual
 */
export interface CreateInvoiceRequest {
  invoice_number: string;
  invoice_date: string;
  patient_id: number | null; // Puede ser null para llamadas de personas no registradas
  session_ids: number[];
  concept: string;
}

/**
 * Request para crear facturas en bulk
 */
export type CreateBulkInvoicesRequest = CreateInvoiceRequest[];

/**
 * Response de creación de factura
 */
export interface CreateInvoiceResponse {
  success: boolean;
  message: string;
  invoice_id?: number;
}

/**
 * Desglose de sesiones por precio unitario
 */
export interface SessionsByPrice {
  unit_price: number;
  sessions_count: number;
  total_net: number;
  concept: string;
}

/**
 * Datos de facturación pendiente por clínica
 */
export interface ClinicInvoiceData {
  clinic_id: number;
  clinic_name: string;
  fiscal_name?: string;
  cif?: string;
  billing_address?: string;
  total_sessions: number;
  total_net_clinic: number;
  sessions_data: SessionsByPrice[];
}

/**
 * Response de facturas pendientes de clínicas
 * El API devuelve directamente un array en el campo data
 */
export type PendingClinicInvoicesResponse = ClinicInvoiceData[];

/**
 * Datos agregados de facturas de clínica por período
 * Representa un resumen de todas las facturas de una clínica en un mes/año específico
 */
export interface ExistingClinicInvoice {
  clinic_id: number;
  clinic_name: string;
  fiscal_name: string;
  cif: string;
  billing_address: string;
  invoice_numbers: string[];
  last_invoice_date: string;
  concepts: string[];
  total_invoices: number;
  total_sessions: number;
  total_net_clinic: number;
  total_invoiced: number;
  sessions_data: SessionsByPrice[];
}

/**
 * Response de facturas existentes de clínicas
 */
export interface ExistingClinicInvoicesResponse {
  filters_applied: {
    month: number;
    year: number;
  };
  total_clinics: number;
  clinics: ExistingClinicInvoice[];
}

/**
 * Bono pendiente de facturar
 */
export interface PendingBonusInvoice {
  bonus_id: number;
  patient_id: number;
  patient_full_name: string;
  dni: string;
  email: string;
  patient_address_line1: string;
  patient_address_line2: string;
  clinic_name: string;
  sessions_number: number;
  total_gross: number;
  progenitors_data?: ProgenitorsData;
}

/**
 * Response de bonos pendientes de facturar
 */
export interface PendingBonusInvoicesResponse {
  filters_applied: {
    month: number;
    year: number;
  };
  pending_invoices: PendingBonusInvoice[];
}

/**
 * Factura de bono existente
 */
export interface ExistingBonusInvoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  bonus_id: number;
  patient_id: number;
  patient_full_name: string;
  dni: string;
  email: string;
  patient_address_line1: string;
  patient_address_line2: string;
  sessions_number: number;
  total: number;
  concept: string;
}

/**
 * Response de facturas de bonos existentes
 */
export interface ExistingBonusInvoicesResponse {
  filters_applied: {
    month: number;
    year: number;
  };
  total_invoices: number;
  invoices: ExistingBonusInvoice[];
}

/**
 * Request para generar factura de bono
 */
export interface GenerateBonusInvoiceRequest {
  invoice_number: string;
  invoice_date: string;
  bonus_id: number;
  concept: string;
}
