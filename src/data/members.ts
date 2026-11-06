export type RegisteredMember = {
  id: string;
  name: string;
  citizen: string;
  phone: string;
  steamhex: string;
  password: string;
  joined: string;
  orders: number;
  active: boolean;
};

const KEY = "iax-registered-members";
const CURRENT_KEY = "iax-current-member";
const ARCHIVE_KEY = "iax-archived-members";

export function readRegisteredMembers(): RegisteredMember[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}
export function saveRegisteredMember(member: RegisteredMember) {
  localStorage.setItem(KEY, JSON.stringify([...readRegisteredMembers(), member]));
  localStorage.setItem(CURRENT_KEY, JSON.stringify(member));
}
export function setCurrentMember(member: RegisteredMember) {
  localStorage.setItem(CURRENT_KEY, JSON.stringify(member));
}
export function findMember(phone: string, password: string) {
  return readRegisteredMembers().find((m) => m.phone === phone && m.password === password) || null;
}
export function currentMember(): RegisteredMember | null {
  try { return JSON.parse(localStorage.getItem(CURRENT_KEY) || "null"); } catch { return null; }
}
export function updateCurrentMember(changes: Partial<RegisteredMember>) {
  const current = currentMember();
  if (!current) return null;
  const updated = { ...current, ...changes };
  const members = readRegisteredMembers().map((m) => m.id === current.id ? updated : m);
  localStorage.setItem(KEY, JSON.stringify(members));
  localStorage.setItem(CURRENT_KEY, JSON.stringify(updated));
  return updated;
}
export function logoutMember() { localStorage.removeItem(CURRENT_KEY); }
export function readArchivedMembers(): RegisteredMember[] { try { const v = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } }
export function updateRegisteredMember(id: string, changes: Partial<RegisteredMember>) { const next = readRegisteredMembers().map((m) => m.id === id ? { ...m, ...changes } : m); localStorage.setItem(KEY, JSON.stringify(next)); return next; }
export function archiveRegisteredMember(id: string) { const members = readRegisteredMembers(); const removed = members.find((m) => m.id === id); if (!removed) return; localStorage.setItem(KEY, JSON.stringify(members.filter((m) => m.id !== id))); localStorage.setItem(ARCHIVE_KEY, JSON.stringify([removed, ...readArchivedMembers()])); }
