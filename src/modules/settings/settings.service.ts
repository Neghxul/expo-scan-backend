import { prisma } from "../../config/prisma";

const DEFAULT_MANUAL_EVENT = "pack0626";

export async function getAppSettings() {
  const settings = await prisma.appSetting.findMany();
  const map = Object.fromEntries(settings.map((item) => [item.key, item.value]));

  return {
    manualEventDefault: map.manual_event_default || DEFAULT_MANUAL_EVENT,
    nextManualBadgeNumber: `MAN${String(Number(map.manual_badge_sequence || "1")).padStart(3, "0")}`,
    chatEnabled: map.chat_enabled === "true",
  };
}

export async function updateAppSettings(params: { manualEventDefault?: string; chatEnabled?: boolean }) {
  if (params.manualEventDefault !== undefined) {
    await prisma.appSetting.upsert({
      where: { key: "manual_event_default" },
      update: { value: params.manualEventDefault.trim() || DEFAULT_MANUAL_EVENT },
      create: { key: "manual_event_default", value: params.manualEventDefault.trim() || DEFAULT_MANUAL_EVENT },
    });
  }
  if (params.chatEnabled !== undefined) {
    await prisma.appSetting.upsert({
      where: { key: "chat_enabled" },
      update: { value: params.chatEnabled ? "true" : "false" },
      create: { key: "chat_enabled", value: params.chatEnabled ? "true" : "false" },
    });
  }

  return getAppSettings();
}

export async function isChatEnabled() {
  const setting = await prisma.appSetting.findUnique({ where: { key: "chat_enabled" } });
  return setting?.value === "true";
}

export async function reserveManualBadgeNumber() {
  return prisma.$transaction(async (tx) => {
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

export async function getManualEventDefault() {
  const setting = await prisma.appSetting.findUnique({ where: { key: "manual_event_default" } });
  return setting?.value || DEFAULT_MANUAL_EVENT;
}
