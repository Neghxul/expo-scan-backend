ALTER TABLE `records`
  ADD COLUMN `businessCardUrl` VARCHAR(191) NULL;

CREATE TABLE `app_settings` (
  `key` VARCHAR(191) NOT NULL,
  `value` VARCHAR(191) NOT NULL,
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `app_settings` (`key`, `value`, `updatedAt`) VALUES
  ('manual_event_default', 'pack0626', CURRENT_TIMESTAMP(3)),
  ('manual_badge_sequence', '1', CURRENT_TIMESTAMP(3));
