import { useState, type FormEvent } from "react";
import { Button } from "./ui";
import { currentMember } from "../data/members";
import type { ManagedVehicle } from "../data/vehicles";

export default function OrderConfirmation({ vehicle }: { vehicle: ManagedVehicle }) {
  const member = currentMember();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [created, setCreated] = useState("");
  const total = vehicle.price * quantity;
  const price = (n: number) => `${vehicle.jenis === "IMPORT" ? "E MAS" : "IDP $"} ${new Intl.NumberFormat("en-US").format(n)}`;
  function submit(e: FormEvent) {
    e.preventDefault(); setError("");
    if (!member) { setError("Silakan login sebagai member untuk membuat pesanan."); return; }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5) { setError("Jumlah pembelian harus 1–5 unit."); return; }
    try {
      const orders = JSON.parse(localStorage.getItem("iax-member-orders") || "[]");
      const now = new Date();
      const date = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "2-digit", year: "2-digit" }).format(now);
      const id = `${String(orders.length + 1).padStart(4, "0")} - ${date}`;
      orders.push({ id, memberId: member.id, member: member.name, phone: member.phone, steamhex: member.steamhex, vehicle: vehicle.name, image: vehicle.photos?.[0] || vehicle.image, slug: vehicle.slug, quantity, unitPrice: vehicle.price, total, currency: vehicle.jenis === "IMPORT" ? "E MAS" : "IDP $", status: "Baru", createdAt: new Date().toISOString() });
      localStorage.setItem("iax-member-orders", JSON.stringify(orders));
      window.dispatchEvent(new Event("iax-orders-updated"));
      setCreated(id);
    } catch { setError("Pesanan gagal disimpan. Silakan coba kembali."); }
  }
  if (created) return <div role="status"><h3>Pesanan berhasil dibuat</h3><p>{vehicle.name} · {quantity} unit · {price(total)}</p><Button to="/member/dashboard">Ke halaman member</Button></div>;
  return <form className="order-confirmation" onSubmit={submit}>
    <div className="summary-box"><b>{vehicle.name}</b><span>Harga satuan: {price(vehicle.price)}</span><span>Nama: {member?.name}</span><span>Nomor hape: {member?.phone}</span><span>SteamHEX: {member?.steamhex}</span></div>
    <label>Quantity pembelian<select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} unit</option>)}</select><small>Maksimal 5 unit per pesanan.</small></label>
    <strong>Total: {price(total)}</strong>
    {error && <p role="alert">{error}</p>}
    <button className="button" type="submit">BUAT PESANAN</button>
  </form>;
}
