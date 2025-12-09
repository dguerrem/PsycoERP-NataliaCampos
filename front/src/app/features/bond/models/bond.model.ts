export type BonusStatus = 'active' | 'expired' | 'consumed';

export interface Bonus {
  id: string;
  patientId: number;
  patientName: string;
  totalSessions: number;
  usedSessions: number;
  pricePerSession: number;
  totalPrice: number;
  purchaseDate: Date;
  expiryDate: Date;
  status: BonusStatus;
}

export interface BonusFormData {
  patientId: number;
  totalSessions: number;
  pricePerSession: number;
  totalPrice: number;
  expiryDate: string; // ISO date string (YYYY-MM-DD)
}

export interface BonusHistorySession {
  date: string;
  session: string;
  professional: string;
  status: string;
}

export interface BonusSummary {
  total: number;
  active: number;
  consumed: number;
  expired: number;
}
