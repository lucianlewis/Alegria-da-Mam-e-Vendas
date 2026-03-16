export type PaymentMethod = 'cash' | 'credit' | 'debit' | 'pix';

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
  timestamp: any; // Firestore Timestamp
  breakdown?: {
    coins: Record<string, number>;
    bills: Record<string, number>;
  };
}

export interface Goal {
  id?: string;
  title: string;
  target: number;
  current: number;
  status: 'on-track' | 'behind' | 'completed';
}
