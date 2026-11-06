import { useEffect, useRef, useState, type FormEvent } from "react";
import { CarFront, Edit3, ImagePlus, Plus, Trash2, Upload, X } from "lucide-react";
import { AdminDataTable, Drawer, PageIntro, StatusBadge } from "./components";
import { formatVehiclePrice, readManagedVehicles, vehicleSlug, writeManagedVehicles, type ManagedVehicle } from "../data/vehicles";

const blank: Omit<ManagedVehicle, "slug" | "createdAt"> = {
  name: "", brand: "", category: "", price: 0, jenis: "DEALER", vehicleType: "ONROAD", photos: [], image: "", power: 0, badge: "Baru",
  description: "", seats: 2, published: true,
};

export default function VehiclesPage({ canManage }: { canManage: boolean }) {
  const [vehicles, setVehicles] = useState(readManagedVehicles);
  const [editing, setEditing] = useState<ManagedVehicle | null | "new">(null);
  const [query, setQuery] = useState("");
  const refresh = () => setVehicles(readManagedVehicles());
  useEffect(() => { window.addEventListener("iax-vehicles-updated", refresh); return () => window.removeEventListener("iax-vehicles-updated", refresh); }, []);
  const filtered = vehicles.filter((v) => `${v.name} ${v.category} ${v.jenis} ${v.vehicleType}`.toLowerCase().includes(query.toLowerCase()));
  function remove(vehicle: ManagedVehicle) {
    if (!canManage || !confirm(`Hapus ${vehicle.name}?`)) return;
    const next = vehicles.filter((v) => v.slug !== vehicle.slug); writeManagedVehicles(next); setVehicles(next);
  }
  return <>
    <PageIntro eyebrow="CONTENT / KENDARAAN" title="Kendaraan" description="Kelola koleksi kendaraan yang tampil di katalog publik."
      action={canManage ? <button className="admin-button primary" onClick={() => setEditing("new")}><Plus size={16} /> Tambah kendaraan</button> : undefined} />
    <section className="admin-panel vehicle-manager">
      <div className="vehicle-manager-toolbar"><div><h2>Koleksi kendaraan</h2><p>{vehicles.length} kendaraan tersimpan · {vehicles.filter((v) => v.published).length} tampil publik</p></div><input aria-label="Cari kendaraan" placeholder="Cari kendaraan…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
      <AdminDataTable headers={["KENDARAAN", "KATEGORI", "SPESIFIKASI", "STATUS", "AKSI"]} empty={!filtered.length}>
        {filtered.map((v) => <tr key={v.slug}><td><div className="admin-vehicle-cell"><div className="vehicle-thumb">{v.image ? <img src={v.image} alt="" /> : <CarFront size={18} />}</div><div><strong>{v.name}</strong><small>{v.price ? formatVehiclePrice(v) : "Harga belum diatur"}</small></div></div></td><td>{v.vehicleType}</td><td><strong>{v.jenis}</strong><small>{v.category || "Kategori belum diatur"}</small></td><td><StatusBadge status={v.published ? "Publik" : "Draft"} /></td><td><div className="admin-row-actions">{canManage && <><button className="admin-row-button" aria-label={`Edit ${v.name}`} onClick={() => setEditing(v)}><Edit3 size={16} /></button><button className="admin-row-button danger-icon" aria-label={`Hapus ${v.name}`} onClick={() => remove(v)}><Trash2 size={16} /></button></>}</div></td></tr>)}
      </AdminDataTable>
      {!canManage && <p className="admin-message">Role kamu hanya dapat melihat data kendaraan. Hubungi admin untuk melakukan perubahan.</p>}
    </section>
    {editing && <VehicleDrawer initial={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={(next) => { writeManagedVehicles(next); setVehicles(next); setEditing(null); }} vehicles={vehicles} />}
  </>;
}

function VehicleDrawer({ initial, vehicles, onClose, onSaved }: { initial: ManagedVehicle | null; vehicles: ManagedVehicle[]; onClose: () => void; onSaved: (v: ManagedVehicle[]) => void }) {
  const [form, setForm] = useState<Omit<ManagedVehicle, "slug" | "createdAt">>(initial ? { ...initial } : blank);
  const [error, setError] = useState(""); const [photoSlot, setPhotoSlot] = useState(0); const file = useRef<HTMLInputElement>(null);
  const update = (key: keyof typeof form, value: string | number | boolean | string[]) => setForm((x) => ({ ...x, [key]: value }));
  function upload(e: React.ChangeEvent<HTMLInputElement>) { const f = e.target.files?.[0]; if (!f) return; if (f.size > 2.5 * 1024 * 1024) { setError("Ukuran gambar maksimal 2.5 MB."); return; } if (!f.type.startsWith("image/")) { setError("File harus berupa gambar."); return; } const reader = new FileReader(); reader.onload = () => { const value = String(reader.result); const next = [...(form.photos || [])]; next[photoSlot] = value; update("photos", next); if (photoSlot === 0) update("image", value); }; reader.readAsDataURL(f); setError(""); }
  function submit(e: FormEvent) { e.preventDefault(); if (!form.name.trim()) return setError("Nama model wajib diisi."); const slug = initial?.slug || vehicleSlug(form.name); const item = { ...form, slug, createdAt: initial?.createdAt || new Date().toISOString() } as ManagedVehicle; onSaved(initial ? vehicles.map((v) => v.slug === initial.slug ? item : v) : [item, ...vehicles]); }
  return <Drawer title={initial ? "Edit kendaraan" : "Tambah kendaraan"} onClose={onClose} wide><form className="admin-form vehicle-form" onSubmit={submit}><div className="vehicle-form-grid"><label>Nama model<input value={form.name} onChange={(e) => update("name", e.target.value)} required placeholder="Contoh: 911 GT3 RS" /></label><label>Jenis<select value={form.jenis} onChange={(e) => update("jenis", e.target.value)}><option value="IMPORT">IMPORT — E MAS</option><option value="DEALER">DEALER — IDP $</option></select></label><label>Type<select value={form.vehicleType} onChange={(e) => update("vehicleType", e.target.value)}><option value="ONROAD">ONROAD</option><option value="OFFROAD">OFFROAD</option><option value="RALLY">RALLY</option></select></label><label>Kategori<input value={form.category} onChange={(e) => update("category", e.target.value)} placeholder="Sports Car" /></label><label>Nominal harga<input type="number" min="0" value={form.price || ""} onChange={(e) => update("price", Number(e.target.value))} /></label><label>Jumlah kursi<input type="number" min="1" value={form.seats || ""} onChange={(e) => update("seats", Number(e.target.value))} /></label></div><label>Deskripsi<textarea rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Ceritakan karakter kendaraan…" /></label><div className="image-upload"><span className="upload-label">Foto kendaraan <small>Foto 1 menjadi hero picture · JPG, PNG, WEBP · maksimal 2.5 MB per foto</small></span><input ref={file} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} /><div className="vehicle-photo-slots">{[0, 1, 2].map((slot) => { const photo = form.photos?.[slot] || (slot === 0 ? form.image : ""); return <div className="vehicle-photo-slot" key={slot}><button type="button" className="upload-dropzone" onClick={() => { setPhotoSlot(slot); file.current?.click(); }}>{photo ? <img src={photo} alt={`Preview foto ${slot + 1}`} /> : <><ImagePlus size={25} /><span>Foto {slot + 1}{slot === 0 ? " · Hero" : ""}</span><small>Maks. 2.5 MB</small></>}</button>{photo && <button type="button" className="remove-image" onClick={() => { const next = [...(form.photos || [])]; next[slot] = ""; update("photos", next); if (slot === 0) update("image", ""); }}><X size={14} /> Hapus</button>}</div>; })}</div></div><label className="toggle-field"><input type="checkbox" checked={form.published} onChange={(e) => update("published", e.target.checked)} /><span><strong>Tampilkan di halaman publik</strong><small>Matikan untuk menyimpan sebagai draft.</small></span></label>{error && <p className="admin-error" role="alert">{error}</p>}<div className="admin-drawer-actions"><button type="button" className="admin-button" onClick={onClose}>Batal</button><button className="admin-button primary"><Upload size={15} /> Simpan kendaraan</button></div></form></Drawer>;
}
