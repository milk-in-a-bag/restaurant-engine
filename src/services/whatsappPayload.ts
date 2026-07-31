import { OrderItem } from "../schemas/orderSchemas.js";

interface BuildPayloadParams {
  restaurantWhatsappNumber: string;
  orderType: "dine_in" | "delivery";
  tableNumber?: string;
  deliveryAddress?: string;
  items: OrderItem[];
  totalPrice: number;
}

export function buildWhatsappPayload(params: BuildPayloadParams): {
  message: string;
  url: string;
} {
  const lines: string[] = [];

  lines.push("*New Order*");
  lines.push(
    params.orderType === "dine_in"
      ? `Table: ${params.tableNumber}`
      : `Delivery to: ${params.deliveryAddress}`,
  );
  lines.push("");

  for (const item of params.items) {
    lines.push(`${item.qty}x ${item.name} - KES ${item.price * item.qty}`);
  }

  lines.push("");
  lines.push(`*Total: KES ${params.totalPrice}*`);

  const message = lines.join("\n");
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${params.restaurantWhatsappNumber}?text=${encoded}`;

  return { message, url };
}
