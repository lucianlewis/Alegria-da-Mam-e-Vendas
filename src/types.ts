export type PaymentMethod = 'cash' | 'credit' | 'debit' | 'pix' | 'payment-link' | 'exchange-voucher';
export type SaleSource = 'physical-store' | 'whatsapp' | 'instagram';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'seller';
}

export interface SalePayment {
  method: PaymentMethod;
  amount: number;
  cashDetails?: {
    bills: Record<string, number>;
    coins: Record<string, number>;
    total: number;
  };
}

export interface Sale {
  id?: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  paymentMethod: PaymentMethod; // Primary or legacy method
  payments?: SalePayment[]; // Support for multiple payments
  source: SaleSource;
  timestamp: any; // Firestore Timestamp
  cashDetails?: {
    bills: Record<string, number>; // e.g., { '100': 2, '50': 1 }
    coins: Record<string, number>; // e.g., { '1': 5, '0.5': 2 }
    total: number;
  };
}

export interface Goal {
  id?: string;
  title: string;
  target: number;
  current: number;
  status: 'on-track' | 'behind' | 'completed';
}

export interface Seller {
  id?: string;
  name: string;
  email?: string;
  phone: string;
  goal: number;
  observations: string;
  photoURL: string;
  createdAt?: any;
}

export type CashMovementType = 'sangria' | 'reforco';

export interface CashMovement {
  id?: string;
  type: CashMovementType;
  amount: number;
  observation: string;
  timestamp: any; // Firestore Timestamp
  cashDetails: {
    bills: Record<string, number>;
    coins: Record<string, number>;
    total: number;
  };
  userId: string;
  userName: string;
}

export interface CashSession {
  id?: string;
  userId: string;
  userName: string;
  openingTimestamp: any;
  closingTimestamp?: any;
  openingAmount: number;
  closingAmount?: number;
  expectedAmount?: number;
  difference?: number;
  status: 'open' | 'closed';
  openingDetails: {
    bills: Record<string, number>;
    coins: Record<string, number>;
    total: number;
  };
  closingDetails?: {
    bills: Record<string, number>;
    coins: Record<string, number>;
    total: number;
    credit?: number;
    debit?: number;
    pix?: number;
    paymentLink?: number;
    exchangeVoucher?: number;
  };
  observations?: string;
  transactionHash?: string;
  previousSessionId?: string;
}
