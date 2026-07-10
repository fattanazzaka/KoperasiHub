import { devCommodities, type DevCommodity } from "@/lib/dev-fixture";

export const demandRoles = ["demand", "supply"] as const;
export type DemandRole = (typeof demandRoles)[number];

export const windowOptions = [
  { id: "week", label: "Minggu ini" },
  { id: "two-weeks", label: "Dalam 14 hari" },
  { id: "month", label: "Bulan ini" },
] as const;

export type WindowOption = (typeof windowOptions)[number]["id"];

export type DemandSubmission = {
  role: DemandRole;
  commodity: DevCommodity;
  volume: number;
  price: number;
  windowOption: WindowOption;
  windowStart: string;
  windowEnd: string;
};

export type DemandFieldErrors = Partial<
  Record<"role" | "commodity" | "volume" | "price" | "window", string>
>;

export type DemandValidationResult =
  | { success: true; data: DemandSubmission }
  | { success: false; errors: DemandFieldErrors };

const jakartaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function toDateString(date: Date): string {
  const parts = Object.fromEntries(
    jakartaDateFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function startOfJakartaDay(): Date {
  return new Date(`${toDateString(new Date())}T00:00:00+07:00`);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function resolveWindow(option: WindowOption): {
  windowStart: string;
  windowEnd: string;
} {
  const today = startOfJakartaDay();

  if (option === "month") {
    const dateParts = toDateString(today).split("-").map(Number);
    const [year, month] = dateParts;
    const firstDay = new Date(Date.UTC(year, month - 1, 1));
    const lastDay = new Date(Date.UTC(year, month, 0));

    return {
      windowStart: toDateString(firstDay),
      windowEnd: toDateString(lastDay),
    };
  }

  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekdayName = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
  }).format(today);
  const weekday = weekdayNames.indexOf(weekdayName);
  const daysSinceMonday = (weekday + 6) % 7;
  const monday = addDays(today, -daysSinceMonday);
  const duration = option === "two-weeks" ? 13 : 6;

  return {
    windowStart: toDateString(monday),
    windowEnd: toDateString(addDays(monday, duration)),
  };
}

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readPositiveInteger(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

export function validateDemandForm(formData: FormData): DemandValidationResult {
  const roleValue = readText(formData, "role");
  const commodityId = readText(formData, "commodity");
  const volumeValue = readText(formData, "volume");
  const priceValue = readText(formData, "price");
  const windowValue = readText(formData, "window");
  const errors: DemandFieldErrors = {};

  const role = demandRoles.find((candidate) => candidate === roleValue);
  const commodity = devCommodities.find((item) => item.id === commodityId);
  const volume = readPositiveInteger(volumeValue);
  const price = readPositiveInteger(priceValue);
  const windowOption = windowOptions.find((item) => item.id === windowValue)?.id;

  if (!role) {
    errors.role = "Pilih peran pengajuan.";
  }

  if (!commodity) {
    errors.commodity = "Pilih komoditas yang tersedia.";
  }

  if (!volume || volume > 1_000_000) {
    errors.volume = "Volume harus berupa angka 1–1.000.000.";
  }

  if (!price || price > 1_000_000_000) {
    errors.price = "Harga harus berupa angka lebih dari Rp0.";
  }

  if (!windowOption) {
    errors.window = "Pilih jendela waktu pengadaan.";
  }

  if (!role || !commodity || !volume || !price || !windowOption) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      role,
      commodity,
      volume,
      price,
      windowOption,
      ...resolveWindow(windowOption),
    },
  };
}
