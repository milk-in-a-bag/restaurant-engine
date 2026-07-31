import { Router } from "express";
import { ordersRouter } from "./orders.js";
import { customersRouter } from "./customers.js";

export const apiRouter = Router();

apiRouter.use("/orders", ordersRouter);
apiRouter.use("/customers", customersRouter);
