export type BonusStatus = 'active' | 'expired' | 'consumed';

export interface Bonus {
  id: string;
  totalSessions: number;
  usedSessions: number;
  pricePerSession: number;
  totalPrice: number;
  purchaseDate: Date;
  expiryDate: Date;
  status: BonusStatus;
}

export interface BonusFormData {
  totalSessions: number;
  pricePerSession: number;
  totalPrice: number;
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
