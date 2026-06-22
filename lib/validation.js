import { z } from 'zod';

export const transactionSchema = z.object({
  type: z.enum(['entrada', 'saida']),
  description: z.string().trim().min(1, 'Informe a descrição.'),
  amount: z.union([z.number().positive('Valor deve ser positivo.'), z.string().transform((v) => parseFloat(v.replace(',', '.')))]).pipe(z.number().positive('Valor deve ser positivo.')),
  date: z.string().min(1, 'Informe a data.'),
  category: z.string().trim().min(1, 'Informe a categoria.'),
  status: z.enum(['pago', 'pendente', 'vencido']),
  dueDate: z.string().optional(),
  client: z.string().optional()
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da categoria.'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida.')
});

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do produto.'),
  description: z.string().optional().default(''),
  purchasePrice: z.union([z.number().min(0), z.string().transform((v) => parseFloat(v.replace(',', '.')))]).pipe(z.number().min(0, 'Preço de compra inválido.')),
  salePrice: z.union([z.number().min(0), z.string().transform((v) => parseFloat(v.replace(',', '.')))]).pipe(z.number().min(0, 'Preço de venda inválido.'))
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.'),
  email: z.string().email('E-mail inválido.').transform((v) => v.toLowerCase().trim()),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.')
});

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido.').transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, 'Informe a senha.')
});

export const settingsSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.'),
  password: z.string().optional().refine((v) => !v || v.length >= 6, 'A senha deve ter pelo menos 6 caracteres.')
});
