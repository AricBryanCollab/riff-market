DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum enum_value
    JOIN pg_type enum_type ON enum_type.oid = enum_value.enumtypid
    WHERE enum_type.typname = 'MediaCleanupJobSourceType'
      AND enum_value.enumlabel = 'PRODUCT'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_enum enum_value
    JOIN pg_type enum_type ON enum_type.oid = enum_value.enumtypid
    WHERE enum_type.typname = 'MediaCleanupJobSourceType'
      AND enum_value.enumlabel = 'LISTING'
  ) THEN
    ALTER TYPE "MediaCleanupJobSourceType" RENAME VALUE 'PRODUCT' TO 'LISTING';
  END IF;
END $$;
