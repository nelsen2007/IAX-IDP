import { brandAssets } from "../data/brand";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation, useSearchParams } from "react-router-dom";
import { currentMember, logoutMember, updateCurrentMember, type RegisteredMember } from "../data/members";
import {
  ArrowUpRight,
  Menu,
  X,
  Search,
  ChevronRight,
  LayoutDashboard,
  Car,
  FileText,
  Users,
  ChartNoAxesCombined,
  Settings,
  ShoppingBag,
  LogOut,
  Layers,
  Bell,
} from "lucide-react";
export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="IAX 2026 Beranda">
      {brandAssets.indoprideLogo && (
        <img
          className="official-logo"
          src={brandAssets.indoprideLogo}
          alt="INDOPRIDE"
        />
      )}
      <span className="brand-word">
        IAX<span>2026</span>
      </span>
      <span className="brand-sub">INDOPRIDE AUTO EXPO</span>
    </Link>
  );
}
export function Button({
  to,
  children,
  secondary = false,
  onClick,
  type = "button",
}: {
  to?: string;
  children: ReactNode;
  secondary?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const c = `button ${secondary ? "secondary" : ""}`;
  return to ? (
    <Link className={c} to={to}>
      {children}
    </Link>
  ) : (
    <button type={type} className={c} onClick={onClick}>
      {children}
    </button>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const previous = document.activeElement as HTMLElement;
    const timer = setTimeout(
      () => document.querySelector<HTMLElement>(".modal button")?.focus(),
      0,
    );
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal"
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            const els = e.currentTarget.querySelectorAll<HTMLElement>(
              "button,input,select,textarea,a[href]",
            );
            const first = els[0],
              last = els[els.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }}
      >
        <div className="section-line">
          <h2>{title}</h2>
          <button className="icon-button" aria-label="Tutup" onClick={onClose}>
            <X />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
const nav = [
  ["/", "Beranda"],
  ["/vehicles", "Katalog Kendaraan"],
  ["/schedule", "Jadwal & Info"],
  ["/about", "Tentang IAX"],
];
export function Header() {
  const [open, setOpen] = useState(false);
  const [member, setMember] = useState<RegisteredMember | null>(currentMember);
  const [profile, setProfile] = useState(false);
  const [editing, setEditing] = useState(false);
  const loc = useLocation();
  useEffect(() => { setOpen(false); setMember(currentMember()); }, [loc]);
  return (
    <header className="header">
      <div className="nav-wrap">
        <Brand />
        <nav
          aria-label="Navigasi utama"
          className={open ? "nav-links open" : "nav-links"}
        >
          {nav.map(([to, label]) => (
            <NavLink key={to} to={to} end>
              {label}
            </NavLink>
          ))}
          {!member && <Link className="mobile-login" to="/login">Masuk Member <ArrowUpRight size={16} /></Link>}
        </nav>
        <div className="nav-actions">
          <Link
            className="icon-button"
            to="/vehicles?search=1"
            aria-label="Cari kendaraan"
          >
            <Search size={19} />
          </Link>
          {member ? <div className="member-profile-wrap"><button className="member-profile-button" onClick={() => setProfile(!profile)} aria-expanded={profile}><span>{member.name.slice(0, 2).toUpperCase()}</span>{member.name}</button>{profile && <div className="member-profile-menu"><strong>{member.name}</strong><button onClick={() => { setEditing(true); setProfile(false); }}>Edit profil</button><button onClick={() => { logoutMember(); setMember(null); setProfile(false); }}>Keluar</button></div>}</div> : <><Link className="login-link" to="/login">Masuk</Link><Link className="nav-register" to="/register">Daftar Member <ArrowUpRight size={15} /></Link></>}
          <button
            className="menu-toggle icon-button"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {editing && member && <MemberProfileModal member={member} onClose={() => setEditing(false)} onSaved={(next) => { setMember(next); setEditing(false); }} />}
    </header>
  );
}

function MemberProfileModal({ member, onClose, onSaved }: { member: RegisteredMember; onClose: () => void; onSaved: (member: RegisteredMember) => void }) {
  return createPortal(<Modal title="Profil member" onClose={onClose}><form onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); const next = updateCurrentMember({ name: String(data.get("name")), phone: String(data.get("phone")), steamhex: String(data.get("steamhex")), password: String(data.get("password")) || member.password }); if (next) onSaved(next); }}><label>Nama<input name="name" defaultValue={member.name} required /></label><label>Nomor hape<input name="phone" defaultValue={member.phone} required /></label><label>SteamHEX<input name="steamhex" defaultValue={member.steamhex} required /></label><label>Password baru<input name="password" type="password" placeholder="Kosongkan jika tidak diubah" minLength={6} /></label><button className="button" type="submit">Simpan perubahan</button></form></Modal>, document.body);
}
export function Footer() {
  return (
    <footer className="footer">
      <Brand />
      <p>© 2026 INDOPRIDE Auto Expo. Yang penting ada.</p>
      <div>
        <Link to="/about">Tentang IAX</Link>
        <Link to="/sales/dashboard">
          Sales Area <ArrowUpRight size={13} />
        </Link>
      </div>
    </footer>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <div className="eyebrow">
        <span />
        {eyebrow}
      </div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
export function DashboardShell({
  role,
  children,
}: {
  role: "Sales" | "Admin";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const base = role === "Sales" ? "/sales/dashboard" : "/admin/dashboard";
  const menus =
    role === "Sales"
      ? [
          "Dashboard",
          "Pesanan Masuk",
          "Data SPK",
          "Kendaraan",
          "Member",
          "Laporan",
          "Pengaturan",
        ]
      : [
          "Dashboard",
          "Kelola Kendaraan",
          "Brand",
          "Member",
          "Sales",
          "Pemesanan",
          "SPK",
          "Konten Website",
          "Pengaturan",
        ];
  const icons = [
    LayoutDashboard,
    ShoppingBag,
    FileText,
    Car,
    Users,
    ChartNoAxesCombined,
    Settings,
    Layers,
    Settings,
  ];
  const [params] = useSearchParams();
  const active = params.get("view") || "Dashboard";
  return (
    <div className="workspace">
      <aside className={open ? "sidebar visible" : "sidebar"}>
        <Brand />
        <div className="sidebar-label">{role.toUpperCase()} WORKSPACE</div>
        {menus.map((m, i) => {
          const Icon = icons[i];
          return (
            <Link
              key={m}
              to={`${base}?view=${encodeURIComponent(m)}`}
              className={active === m ? "side-link selected" : "side-link"}
              onClick={() => {
                setOpen(false);
              }}
            >
              <Icon size={18} />
              {m}
              {m === "Pesanan Masuk" && <small>12</small>}
            </Link>
          );
        })}
        <div className="sidebar-bottom">
          <Link to="/">
            <LogOut size={17} /> Kembali ke website
          </Link>
          <small>Prototype frontend · Mode demo</small>
        </div>
      </aside>
      <div className="workspace-main">
        <div className="workspace-top">
          <button
            className="menu-toggle icon-button"
            aria-label="Buka sidebar"
            onClick={() => setOpen(!open)}
          >
            <Menu />
          </button>
          <span>
            IAX Workspace <ChevronRight size={14} /> {role}{" "}
            <ChevronRight size={14} /> {active}
          </span>
          <div>
            <Bell size={18} />
            <span className="avatar">{role === "Sales" ? "AP" : "AD"}</span>
            <b>{role === "Sales" ? "Ardi Putra" : "Administrator"}</b>
          </div>
        </div>
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
