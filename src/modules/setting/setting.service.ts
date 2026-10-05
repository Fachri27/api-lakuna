import { prisma } from "../../config/db.js";

const DEFAULT_PRESETS = JSON.stringify([
  50000, 100000, 150000, 200000, 250000, 350000, 500000
]);

export async function getSettingService(key: string) {
  const setting = await prisma.setting.findUnique({
    where: { key },
  });
  if (!setting) {
    if (key === "standar_plan_price") {
      return { key, value: "500000" };
    }
    if (key === "photo_price_presets") {
      return { key, value: DEFAULT_PRESETS };
    }
    if (key === "contributor_share_percentage") {
      return { key, value: "70" };
    }
    if (key === "map_plate_photos") {
      return { key, value: "[]" };
    }
  }
  return setting;
}

export async function getSettingsService() {
  const settings = await prisma.setting.findMany();
  const ensure = (key: string, value: string) => {
    if (!settings.some(s => s.key === key)) {
      settings.push({ key, value, createdAt: new Date(), updatedAt: new Date() });
    }
  };
  ensure("standar_plan_price", "500000");
  ensure("photo_price_presets", DEFAULT_PRESETS);
  ensure("contributor_share_percentage", "70");
  return settings;
}

export async function updateSettingService(key: string, value: string) {
  return await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
