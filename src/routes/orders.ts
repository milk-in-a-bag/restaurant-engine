import { Router } from "express";
import z from "zod";
import { supabaseAdmin } from "../lib/supabaseClient.js";
import { findOrCreateCustomer } from "../services/customers.js";
import { buildWhatsappPayload } from "../services/whatsappPayload.js";

const orderItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
  qty: z.number().positive(),
});

const createOrderSchema = z
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

function calculateTotal(items: { price: number; qty: number }[]): number {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

export const ordersRouter = Router();

ordersRouter.post("/", async (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues });
  }

  const {
    branch_id,
    order_type,
    items,
    table_number,
    delivery_address,
    customer_phone,
  } = parsed.data;
  const totalPrice = calculateTotal(items);

  let customerId: string | undefined;

  if (customer_phone) {
    customerId = await findOrCreateCustomer(customer_phone);
  }

  const { data: branch, error: branchError } = await supabaseAdmin
    .from("branches")
    .select("id, restaurant_id, restaurants(whatsapp_number)")
    .eq("id", branch_id)
    .single();

  if (branchError || !branch) {
    return res.status(404).json({ error: "Branch not found" });
  }

  const restaurant = Array.isArray(branch.restaurants)
    ? branch.restaurants[0]
    : branch.restaurants;

  if (!restaurant?.whatsapp_number) {
    return res
      .status(500)
      .json({ error: "Restaurant has no WhatsApp number configured" });
  }

  const { message, url } = buildWhatsappPayload({
    restaurantWhatsappNumber: restaurant.whatsapp_number,
    orderType: order_type,
    tableNumber: table_number,
    deliveryAddress: delivery_address,
    items,
    totalPrice,
  });

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .insert({
      branch_id,
      customer_id: customerId ?? null,
      order_type,
      table_number: order_type === "dine_in" ? table_number : null,
      delivery_address: order_type === "delivery" ? delivery_address : null,
      items,
      total_price: totalPrice,
      whatsapp_payload: message,
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json({ order, whatsapp_url: url });
});
