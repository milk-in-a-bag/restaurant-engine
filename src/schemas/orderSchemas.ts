import { z } from "zod";

export const orderItemSchema = z.object({
  cms_item_id: z.string().min(1),
  qty: z.number().int().positive(),
});

export const createOrderSchema = z
  .object({
    branch_id: z.string().uuid(),
    order_type: z.enum(["dine_in", "delivery"]),
    table_number: z.string().optional(),
    delivery_address: z.string().optional(),
    customer_phone: z.string().min(7).optional(),
    items: z.array(orderItemSchema).min(1),
  })
  .refine(
    (data) =>
      data.order_type === "dine_in"
        ? !!data.table_number
        : !!data.delivery_address,
    {
      message:
        "table_number is required for dine_in orders, delivery_address is required for delivery orders",
      path: ["order_type"],
    },
  );

export type OrderItem = z.infer<typeof orderItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
