import { useSyncExternalStore } from "react";

export const ORDER_KEY = "iax-member-orders";
export type MemberOrder = {
  id: string; memberId: string; member: string; phone: string; steamhex: string;
  vehicle: string; slug: string; image?: string; quantity: number; unitPrice: number;
  total: number; currency: string; salesId?: string; salesName?: string; status: string; createdAt: string;
  spk?: { number: string; createdAt: string; createdBy: string; creatorName: string; creatorRole: string; paymentStatus: "BELUM BAYAR" | "LUNAS"; paidAt?: string; paidBy?: string; payerName?: string };
};

export function createOrderSpk(orderId: string, operator: { id: string; displayName: string; role: string }) {
  const orders: MemberOrder[] = JSON.parse(localStorage.getItem(ORDER_KEY) || "[]");
  const order = orders.find((item) => item.id === orderId);
  if (!order) throw new Error("Pesanan tidak ditemukan.");
  if (order.spk) throw new Error("SPK untuk pesanan ini sudah dibuat.");
  order.spk = { number: `SPK-${order.id}`, createdAt: new Date().toISOString(), createdBy: operator.id, creatorName: operator.displayName, creatorRole: operator.role, paymentStatus: "BELUM BAYAR" };
  order.status = "SPK Dibuat";
  localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
  window.dispatchEvent(new Event("iax-orders-updated"));
}

export function receiveSpkPayment(orderId: string, operator: { id: string; displayName: string; role: string }) {
  if (!["ADMIN", "CASHIER"].includes(operator.role)) throw new Error("Role ini tidak dapat menerima pembayaran.");
  const orders: MemberOrder[] = JSON.parse(localStorage.getItem(ORDER_KEY) || "[]");
  const order = orders.find((item) => item.id === orderId);
  if (!order?.spk) throw new Error("SPK tidak ditemukan.");
  if (order.spk.paymentStatus === "LUNAS") throw new Error("SPK sudah lunas.");
  order.spk = { ...order.spk, paymentStatus: "LUNAS", paidAt: new Date().toISOString(), paidBy: operator.id, payerName: operator.displayName };
  order.status = "Selesai";
  localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
  window.dispatchEvent(new Event("iax-orders-updated"));
}
export function deleteOrderSpk(orderId: string, operator: { username?: string; role: string }) {
  if (operator.role !== "ADMIN" && operator.username !== "dev") throw new Error("Role ini tidak dapat menghapus SPK.");
  const orders: MemberOrder[] = JSON.parse(localStorage.getItem(ORDER_KEY) || "[]");
  const order = orders.find((item) => item.id === orderId);
  if (!order?.spk) throw new Error("SPK tidak ditemukan.");
  localStorage.setItem(ORDER_KEY, JSON.stringify(orders.filter((item) => item.id !== orderId)));
  window.dispatchEvent(new Event("iax-orders-updated"));
}
function subscribe(callback: () => void) {
  const storage = (e: StorageEvent) => { if (e.key === ORDER_KEY || e.key === null) callback(); };
  window.addEventListener("storage", storage);
  window.addEventListener("iax-orders-updated", callback);
  return () => { window.removeEventListener("storage", storage); window.removeEventListener("iax-orders-updated", callback); };
}
export function useMemberOrders(): MemberOrder[] {
  const raw = useSyncExternalStore(subscribe, () => localStorage.getItem(ORDER_KEY) || "[]");
  try { const data = JSON.parse(raw); return Array.isArray(data) ? data : []; } catch { return []; }
}
