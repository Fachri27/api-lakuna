-- Drop old unique constraint and create new one with explicit name
-- This handles the NULL photoId case better
ALTER TABLE `License` DROP INDEX `License_userId_photoId_type_key`;
ALTER TABLE `License` ADD CONSTRAINT `uq_license_user_type_photo` UNIQUE (`userId`, `type`, `photoId`);
