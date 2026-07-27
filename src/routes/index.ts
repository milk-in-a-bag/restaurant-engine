import { Router } from "express";
import { ordersRouter } from "./orders.js";

export const apiRouter = Router();

apiRouter.use("/orders", ordersRouter);
