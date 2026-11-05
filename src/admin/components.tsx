import { useEffect, useRef, type ReactNode } from "react";
import { X, ArrowUpRight } from "lucide-react";
import { brandAssets } from "../data/brand";
import { Link } from "react-router-dom";

export function AdminBrand() {
  return (
    <Link
      to="/admin"
      className="admin-brand"
      aria-label="IAX 2026 Control Center"
    >
      {brandAssets.indoprideLogo && (
        <img src={brandAssets.indoprideLogo} alt="INDOPRIDE" />
      )}
      <span className="admin-wordmark">
        IAX<span>2026</span>
      </span>
      <span className="admin-brand-caption">
        INDOPRIDE AUTO EXPO
        <br />
        <b>ADMIN CONTROL CENTER</b>
      </span>
    </Link>
  );
}
export function DemoNotice() {
  return (
    <div className="admin-demo">
      <span>DEMO DATA</span>
      <p>
        Data operasional ilustratif. Aksi bisnis hanya simulasi dan tidak
        disimpan.
      </p>
    </div>
  );
}
export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="admin-intro">
      <div>
        <div className="admin-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function StatCards({
  items,
}: {
  items: {
    label: string;
    value: string | number;
    note: string;
    icon: ReactNode;
  }[];
}) {
  return (
    <div className="admin-stats">
      {items.map((item) => (
        <article className="admin-stat" key={item.label}>
          <div>
            <span>{item.label}</span>
            <span className="admin-stat-icon">{item.icon}</span>
          </div>
          <strong>{item.value}</strong>
          <small>
            <ArrowUpRight size={13} />
            {item.note}
          </small>
        </article>
      ))}
    </div>
  );
}
export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={
        "admin-badge status-" + status.toLowerCase().replaceAll(" ", "-")
      }
    >
      {status.toUpperCase()}
    </span>
  );
}
export function AdminDataTable({
  headers,
  children,
  empty = false,
}: {
  headers: string[];
  children: ReactNode;
  empty?: boolean;
}) {
  return (
    <div
      className="admin-table-scroll"
      tabIndex={0}
      role="region"
      aria-label="Tabel data, dapat digulir horizontal"
    >
      <table className="admin-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {empty ? (
            <tr>
              <td colSpan={headers.length}>
                <div className="admin-empty">
                  Data tidak ditemukan. Coba ubah atau reset filter.
                </div>
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}
export function Drawer({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    callback = useRef(onClose);
  callback.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={"admin-drawer" + (wide ? " wide" : "")}
      onCancel={(e) => {
        e.preventDefault();
        callback.current();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            callback.current();
        }
      }}
      aria-label={title}
    >
      <div className="admin-drawer-head">
        <div>
          <span className="admin-eyebrow">IAX CONTROL CENTER</span>
          <h2>{title}</h2>
        </div>
        <button
          className="admin-icon"
          aria-label="Tutup detail"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <div className="admin-drawer-body">{children}</div>
    </dialog>
  );
}
export function DetailList({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="admin-details">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
