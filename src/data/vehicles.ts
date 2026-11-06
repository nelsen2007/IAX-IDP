import type { Vehicle } from "./mock";

export type ManagedVehicle = Vehicle & {
  jenis: "IMPORT" | "DEALER";
  vehicleType: "ONROAD" | "OFFROAD" | "RALLY";
  photos: string[];
  description: string;
  seats: number;
  published: boolean;
  createdAt: string;
};

const STORAGE_KEY = "iax-managed-vehicles";

export function formatVehiclePrice(vehicle: Pick<ManagedVehicle, "price" | "jenis">) {
  return `${vehicle.jenis === "IMPORT" ? "E MAS" : "IDP $"} ${new Intl.NumberFormat("en-US").format(vehicle.price)}`;
}

export function readManagedVehicles(): ManagedVehicle[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function writeManagedVehicles(vehicles: ManagedVehicle[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
  window.dispatchEvent(new CustomEvent("iax-vehicles-updated"));
}

export function vehicleSlug(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
