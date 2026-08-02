import { z } from "zod";

export const CABINS = ["economy", "premium", "business", "first"] as const;

export const CABIN_LABELS: Record<(typeof CABINS)[number], string> = {
  economy: "Econômica",
  premium: "Premium Economy",
  business: "Executiva",
  first: "Primeira Classe",
};

const iata = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{3}$/, "Selecione um aeroporto válido");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

export const orderRequestSchema = z
  .object({
    fullName: z.string().trim().min(3, "Informe seu nome completo").max(120),
    email: z.string().trim().email("Informe um e-mail válido").max(160),
    phone: z
      .string()
      .trim()
      .min(8, "Informe um telefone/WhatsApp válido")
      .max(30),
    origin: iata,
    destination: iata,
    departDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data de ida"),
    returnDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    adults: z.number().int().min(1, "Ao menos 1 adulto").max(9),
    children: z.number().int().min(0).max(9).optional().default(0),
    infants: z.number().int().min(0).max(9).optional().default(0),
    cabin: z.enum(CABINS),
    preferredAirline: optionalText(80),
    preferredProgram: optionalText(80),
    flexibleDates: z.boolean().optional().default(false),
    budgetBRL: z.number().min(0).max(1_000_000).optional(),
    notes: optionalText(2000),
  })
  .refine((v) => v.origin.toUpperCase() !== v.destination.toUpperCase(), {
    message: "Origem e destino devem ser diferentes",
    path: ["destination"],
  })
  .refine((v) => !v.returnDate || v.returnDate >= v.departDate, {
    message: "A volta deve ser depois da ida",
    path: ["returnDate"],
  });

export type OrderRequestInput = z.input<typeof orderRequestSchema>;
export type OrderRequest = z.output<typeof orderRequestSchema>;

export type OrderCreated = {
  protocol: string;
  status: string;
  createdAt: string;
  summary: {
    origin: string;
    destination: string;
    departDate: string;
    returnDate?: string;
    adults: number;
    children: number;
    infants: number;
    cabin: string;
  };
};
