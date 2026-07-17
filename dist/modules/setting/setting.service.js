import { prisma } from "../../config/db.js";
export async function getSettingService(key) {
    const setting = await prisma.setting.findUnique({
        where: { key },
    });
    if (!setting && key === "standar_plan_price") {
        return { key, value: "500000" };
    }
    return setting;
}
export async function getSettingsService() {
    const settings = await prisma.setting.findMany();
    // Ensure standar_plan_price is present in list if not in DB
    const hasPrice = settings.some(s => s.key === "standar_plan_price");
    if (!hasPrice) {
        settings.push({
            key: "standar_plan_price",
            value: "500000",
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
    return settings;
}
export async function updateSettingService(key, value) {
    return await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
    });
}
//# sourceMappingURL=setting.service.js.map