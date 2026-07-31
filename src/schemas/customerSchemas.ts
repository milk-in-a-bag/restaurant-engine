import z from "zod";

export const createCustomerSchema = z.object({
  phone_number: z.string().min(10),
  name: z.string().min(1).optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
