export type Vehicle = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  image: string;
  power: number;
  badge: string;
};

// Mockup dikosongkan; data bisnis tidak ditampilkan sebagai contoh.
export const vehicles: Vehicle[] = [];

export const money = (n: number) =>
  `RP $${new Intl.NumberFormat("en-US").format(n)}`;

export const orders: {
  id: string;
  member: string;
  citizen: string;
  vehicle: string;
  date: string;
  status: string;
}[] = [];
