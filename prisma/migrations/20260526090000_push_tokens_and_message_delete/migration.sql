ALTER TABLE `chat_messages`
  ADD COLUMN `deletedAt` DATETIME(3) NULL,
  ADD COLUMN `deletedById` VARCHAR(191) NULL;

CREATE TABLE `push_tokens` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `platform` VARCHAR(191) NULL,
  `deviceId` VARCHAR(191) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `push_tokens_token_key`(`token`),
  INDEX `push_tokens_userId_idx`(`userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `push_tokens`
  ADD CONSTRAINT `push_tokens_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
