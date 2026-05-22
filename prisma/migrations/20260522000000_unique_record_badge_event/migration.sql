CREATE UNIQUE INDEX IF NOT EXISTS "records_badge_event_unique"
ON "records" ("badgeNumber", "eventName")
WHERE "badgeNumber" IS NOT NULL AND "eventName" IS NOT NULL;
