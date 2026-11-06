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
export function findMember(phone: string, password: string) {
  return readRegisteredMembers().find((m) => m.phone === phone && m.password === password) || null;
}
export function currentMember(): RegisteredMember | null {
  try { return JSON.parse(localStorage.getItem(CURRENT_KEY) || "null"); } catch { return null; }
}
