import { orders, vehicles } from "../data/mock";
export { money } from "../data/mock";
export const demoOrders = orders.map((order, i) => ({
  ...order,
  phone: `RP-DEMO-${100 + i}`,
  variant: "Performance",
  color: [
    "Arctic White",
    "Obsidian Black",
    "Racing Green",
    "Rosso Red",
    "Santorini Black",
  ][i],
  price: vehicles.find((v) => v.name === order.vehicle)?.price || 0,
  brand: vehicles.find((v) => v.name === order.vehicle)?.brand || "",
  image: vehicles.find((v) => v.name === order.vehicle)?.image || "",
  notes:
    i === 0
      ? "Konsultasi pilihan warna saat pameran."
      : "Tidak ada catatan tambahan.",
}));
export type DemoOrder = (typeof demoOrders)[number];
export const demoMembers = demoOrders.map((order, i) => ({
  id: `MBR-00${i + 1}`,
  name: order.member,
  citizen: order.citizen,
  phone: order.phone,
  joined: `2026-11-0${(i % 3) + 1}`,
  orders: 1,
  active: i !== 4,
}));
export type DemoMember = (typeof demoMembers)[number];
export const demoSpks: {
  number: string;
  date: string;
  order: DemoOrder;
  sales: string;
  status: string;
  discount: number;
  dp: number;
}[] = [];
export type DemoSpk = (typeof demoSpks)[number];
export const dateLabel = (date: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(date.length === 10 ? date + "T00:00:00+07:00" : date));
