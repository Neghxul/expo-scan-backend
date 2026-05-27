"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppSettings = getAppSettings;
exports.updateAppSettings = updateAppSettings;
exports.reserveManualBadgeNumber = reserveManualBadgeNumber;
exports.getManualEventDefault = getManualEventDefault;
const prisma_1 = require("../../config/prisma");
const DEFAULT_MANUAL_EVENT = "pack0626";
async function getAppSettings() {
    const settings = await prisma_1.prisma.appSetting.findMany();
    const map = Object.fromEntries(settings.map((item) => [item.key, item.value]));
    return {
        manualEventDefault: map.manual_event_default || DEFAULT_MANUAL_EVENT,
        nextManualBadgeNumber: `MAN${String(Number(map.manual_badge_sequence || "1")).padStart(3, "0")}`,
    };
}
async function updateAppSettings(params) {
    if (params.manualEventDefault !== undefined) {
        await prisma_1.prisma.appSetting.upsert({
            where: { key: "manual_event_default" },
            update: { value: params.manualEventDefault.trim() || DEFAULT_MANUAL_EVENT },
            create: { key: "manual_event_default", value: params.manualEventDefault.trim() || DEFAULT_MANUAL_EVENT },
        });
    }
    return getAppSettings();
}
async function reserveManualBadgeNumber() {
    return prisma_1.prisma.$transaction(async (tx) => {
        const setting = await tx.appSetting.findUnique({ where: { key: "manual_badge_sequence" } });
        const current = Number(setting?.value || "1");
        const next = Number.isFinite(current) && current > 0 ? current : 1;
        await tx.appSetting.upsert({
            where: { key: "manual_badge_sequence" },
            update: { value: String(next + 1) },
            create: { key: "manual_badge_sequence", value: String(next + 1) },
        });
        return `MAN${String(next).padStart(3, "0")}`;
    });
}
async function getManualEventDefault() {
    const setting = await prisma_1.prisma.appSetting.findUnique({ where: { key: "manual_event_default" } });
    return setting?.value || DEFAULT_MANUAL_EVENT;
}
