import * as z from 'zod';

export const complementaryOrderSchema = z
  .object({
    engine_serial: z.string().optional(),
    license_plate: z.string().optional(),
    gps_model: z.string().optional(),
    gps_number: z.string().optional(),
    imei: z.string().optional(),
    contract_date: z.string().optional(),
    chip: z.string().optional(),
    insurance_company: z.string().optional(),
    insurance_policy_number: z.string().optional(),
    insurance_due_date: z.string().optional(),
  })
  .partial();

export type FormValues = z.infer<typeof complementaryOrderSchema>;
