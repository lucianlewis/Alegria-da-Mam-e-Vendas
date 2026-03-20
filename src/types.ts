export type PaymentMethod = 'cash' | 'credit' | 'debit' | 'pix';
export type SaleSource = 'physical-store' | 'whatsapp' | 'instagram';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'seller';
}

export interface Sale {
  id?: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
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
