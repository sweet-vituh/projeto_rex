import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, "Usuário deve ter pelo menos 3 caracteres")
    .max(50, "Usuário deve ter no máximo 50 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Usuário deve conter apenas letras, números e underscore"),
  password: z
    .string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .max(100, "Senha deve ter no máximo 100 caracteres"),
});

export const requisitionSchema = z.object({
  area: z.string().min(1, "Área é obrigatória").max(100),
  equipment: z.string().min(1, "Equipamento é obrigatório").max(200),
  item_description: z.string().min(1, "Descrição do item é obrigatória").max(500),
  item_code: z.string().max(50).optional(),
  quantity: z.number().int().positive("Quantidade deve ser maior que 0").max(9999),
  priority: z.enum(["Baixa", "Normal", "Urgente"]),
  problem_description: z
    .string()
    .min(10, "Descrição do problema deve ter pelo menos 10 caracteres")
    .max(2000, "Descrição do problema deve ter no máximo 2000 caracteres"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RequisitionFormData = z.infer<typeof requisitionSchema>;
