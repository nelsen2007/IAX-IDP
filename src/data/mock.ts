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
export const vehicles: Vehicle[] = [
  {
    slug: "porsche-911-gt3",
    name: "911 GT3 RS",
    brand: "Porsche",
    category: "Sports Car",
    price: 4250000,
    image: "/images/vehicle-1.jpg",
    power: 518,
    badge: "Limited Edition",
  },
  {
    slug: "mercedes-amg-gt",
    name: "AMG GT 63",
    brand: "Mercedes-Benz",
    category: "Sports Car",
    price: 3800000,
    image: "/images/vehicle-2.jpg",
    power: 577,
    badge: "New Arrival",
  },
  {
    slug: "bmw-m4",
    name: "M4 Competition",
    brand: "BMW",
    category: "Sedan",
    price: 2150000,
    image: "/images/vehicle-3.jpg",
    power: 503,
    badge: "New Arrival",
  },
  {
    slug: "lamborghini-huracan",
    name: "Huracán EVO",
    brand: "Lamborghini",
    category: "Supercar",
    price: 6500000,
    image: "/images/vehicle-4.jpg",
    power: 630,
    badge: "Limited Edition",
  },
  {
    slug: "range-rover-sport",
    name: "Range Rover Sport",
    brand: "Land Rover",
    category: "SUV",
    price: 2800000,
    image: "/images/vehicle-5.jpg",
    power: 395,
    badge: "New Arrival",
  },
  {
    slug: "ford-raptor",
    name: "F-150 Raptor",
    brand: "Ford",
    category: "Off-Road",
    price: 1750000,
    image: "/images/vehicle-6.jpg",
    power: 450,
    badge: "New Arrival",
  },
  {
    slug: "audi-r8",
    name: "R8 V10 Performance",
    brand: "Audi",
    category: "Supercar",
    price: 4800000,
    image: "/images/vehicle-7.jpg",
    power: 602,
    badge: "Limited Edition",
  },
  {
    slug: "ducati-panigale",
    name: "Panigale V4",
    brand: "Ducati",
    category: "Motorcycle",
    price: 850000,
    image: "/images/vehicle-8.jpg",
    power: 215,
    badge: "New Arrival",
  },
];
export const money = (n: number) =>
  `RP $${new Intl.NumberFormat("en-US").format(n)}`;
export const orders = [
  {
    id: "IAX-260041",
    member: "Raka Pratama",
    citizen: "IDP-004182",
    vehicle: "911 GT3 RS",
    date: "2026-11-05",
    status: "Baru",
  },
  {
    id: "IAX-260040",
    member: "Alex Morgan",
    citizen: "IDP-002915",
    vehicle: "AMG GT 63",
    date: "2026-11-05",
    status: "Diproses",
  },
  {
    id: "IAX-260039",
    member: "Dimas Saputra",
    citizen: "IDP-008236",
    vehicle: "M4 Competition",
    date: "2026-11-04",
    status: "SPK Dibuat",
  },
  {
    id: "IAX-260038",
    member: "Sarah Wilson",
    citizen: "IDP-001052",
    vehicle: "Huracán EVO",
    date: "2026-11-04",
    status: "Selesai",
  },
  {
    id: "IAX-260037",
    member: "Kevin Adrian",
    citizen: "IDP-003718",
    vehicle: "Range Rover Sport",
    date: "2026-11-03",
    status: "Dibatalkan",
  },
];
