import { FormEvent, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { adminApi, ApiError, type AdminSession } from "./api";
import { Drawer } from "./components";

type Staff = {
  id: string;
  name: string;
  username: string;
  steamHex: string;
  role: "ADMIN" | "CASHIER" | "SALES";
  active: boolean;
  createdAt?: string;
};

const roleLabels = { ADMIN: "Admin", CASHIER: "Kasir", SALES: "Sales" };

export default function StaffPage({ session }: { session: AdminSession }) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [steamHex, setSteamHex] = useState("steam:");
  const [role, setRole] = useState<Staff["role"]>("SALES");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  async function load() {
    try {
      const result = await adminApi<{ staff: Staff[] }>("staff");
      setStaff(result.staff);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Data pengurus gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => void load(), []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const result = await adminApi<{ staff: Staff }>("staff", {
        csrf: session.csrf,
        body: { name, username, password, steamHex, role },
      });
      setStaff((items) => [result.staff, ...items]);
      setName("");
      setUsername("");
      setPassword("");
      setSteamHex("steam:");
      setRole("SALES");
      setMessage("Pengurus berhasil didaftarkan.");
      setFormOpen(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Pengurus gagal didaftarkan.");
    } finally {
      setSaving(false);
    }
  }
  async function remove(id: string) {
    if (!window.confirm("Hapus akses pengurus ini?")) return;
    try {
      await adminApi("staff/remove", { csrf: session.csrf, body: { id } });
      setStaff((items) => items.filter((item) => item.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pengurus gagal dihapus.");
    }
  }

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <div className="admin-eyebrow">PENGURUS</div>
          <h1>Kelola pengurus</h1>
          <p>Daftarkan identitas kerja untuk Admin, Kasir, dan Sales.</p>
        </div>
        <div className="admin-page-actions">
          <button className="admin-button primary" onClick={() => { setError(""); setMessage(""); setFormOpen(true); }}><Plus size={16} /> Daftarkan pengurus</button>
        </div>
      </div>
      <section className="admin-panel">
          <div className="admin-panel-heading"><div><h2>Pengurus terdaftar</h2><p>{staff.length} identitas tercatat</p></div></div>
          {loading ? <p className="admin-empty">Memuat data…</p> : staff.length === 0 ? <p className="admin-empty">Belum ada pengurus selain akun developer.</p> : <div className="admin-staff-list">{staff.map((item) => <div className="admin-staff-row" key={item.id}><span className="admin-avatar">{item.name.slice(0, 2).toUpperCase()}</span><div><strong>{item.name}</strong><small>{item.username} · {item.steamHex}</small></div><span className="admin-status-pill">{roleLabels[item.role]}</span><button className="admin-row-button danger-icon" aria-label={`Hapus ${item.name}`} title={`Hapus ${item.name}`} onClick={() => void remove(item.id)}><Trash2 size={16} /></button></div>)}</div>}
      </section>
      {formOpen && <Drawer title="Daftarkan pengurus" onClose={() => setFormOpen(false)}>
        <form className="admin-form" onSubmit={submit}>
          <p className="admin-muted">Login menggunakan username dan password tanpa MFA.</p>
          <label>Nama lengkap<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Budi Santoso" required /></label>
          <label>Username<input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="contoh: budi.sales" required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan password" required /></label>
          <label>SteamHex<input value={steamHex} onChange={(e) => setSteamHex(e.target.value)} placeholder="steam:110000112345678" required /></label>
          <label>Role<select value={role} onChange={(e) => setRole(e.target.value as Staff["role"])}><option value="ADMIN">Admin</option><option value="CASHIER">Kasir</option><option value="SALES">Sales</option></select></label>
          {error && <p className="admin-error" role="alert">{error}</p>}
          {message && <p className="admin-success" role="status">{message}</p>}
          <button className="admin-button primary" disabled={saving}>{saving ? "Menyimpan…" : "Daftarkan pengurus"}</button>
        </form>
      </Drawer>}
    </div>
  );
}
