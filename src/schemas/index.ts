import { z } from 'zod';

const money = (max = 999999.99) =>
  z.number()
   .min(0, 'Não pode ser negativo')
   .max(max, `Máximo R$${max.toLocaleString('pt-BR')}`)
   .multipleOf(0.01, 'Máximo 2 casas decimais');

const safeStr = (max: number) =>
  z.string()
   .max(max, `Máximo ${max} caracteres`)
   .refine(
     v => !/<script|javascript:|on\w+=/i.test(v),
     'Conteúdo não permitido'
   );

export const userSchema = z.object({
  uid: z.string().uuid(),
  email: z.string().email().max(254),
  role: z.enum(['admin', 'seller']),
  displayName: safeStr(100).optional(),
  photoURL: z.string().url().max(500).optional(),
});

export const saleSchema = z.object({
  sellerId: z.string().max(128),
  sellerName: safeStr(100),
  amount: money(),
  paymentMethod: z.enum(['cash', 'credit', 'debit', 'pix', 'link', 'store-credit', 'mixed', 'payment-link', 'exchange-voucher']),
  source: z.enum(['physical-store', 'whatsapp', 'instagram', 'site']),
  timestamp: z.any(), // Firestore Timestamp
});

export const cashSessionSchema = z.object({
  userId: z.string().max(128),
  openingTimestamp: z.any(),
  openingAmount: money(),
  status: z.enum(['open', 'closed']),
  userName: safeStr(100).optional(),
  closingTimestamp: z.any().optional(),
  closingAmount: money().optional(),
  expectedAmount: money().optional(),
  difference: z.number().min(-999999).max(999999).optional(),
  observations: safeStr(500).optional(),
});
