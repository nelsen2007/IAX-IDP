import { useMemberOrders } from "../data/orders";
import type { DemoOrder } from "./data";

export function useAdminOrders(): DemoOrder[] {
  return useMemberOrders().filter((order) => !order.spk).map((order) => ({
    ...order,
    citizen: order.steamhex,
    date: order.createdAt,
    price: order.total,
    brand: "",
    image: order.image || "",
    variant: "",
    color: "",
    notes: "",
    realOrder: true,
  }));
}
