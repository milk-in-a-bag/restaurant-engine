import { Router } from "express";
import { createCustomerSchema } from "../schemas/customerSchemas.js";
import {
  findOrCreateCustomer,
  updateCustomerName,
} from "../services/customers.js";

export const customersRouter = Router();

customersRouter.post("/", async (req, res) => {
  const parsed = createCustomerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues });
  }

  const { phone_number, name } = parsed.data;
  const customerId = await findOrCreateCustomer(phone_number);

  if (name) {
    await updateCustomerName(customerId, name);
  }

  res.status(200).json({ customer_id: customerId });
});
