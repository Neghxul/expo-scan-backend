INSERT INTO `app_settings` (`key`, `value`, `updatedAt`) VALUES
  ('chat_enabled', 'false', CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `value` = `value`;
