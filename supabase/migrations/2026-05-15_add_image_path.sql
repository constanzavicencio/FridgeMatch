-- Migration: Add image_path column to ingredient_catalog and index
-- Date: 2026-05-15

BEGIN;

-- Add image_path column (stores storage path in Supabase bucket 'ingredientes')
ALTER TABLE IF EXISTS ingredient_catalog
  ADD COLUMN IF NOT EXISTS image_path text;

-- Index to speed up name lookups (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_ingredient_catalog_name_lower ON ingredient_catalog (lower(name));

COMMIT;

-- IMPORTANT NOTES:
-- 1) This migration only adds the column and an index. If you previously stored
--    images as base64 in a column named `image_data`, migrating those values
--    into Supabase Storage must be done manually (upload files to the bucket and
--    populate `image_path` with the storage path).

-- 2) Supabase Storage buckets are not managed by SQL. To create the bucket run:
--    supabase storage create-bucket ingredientes --public
--    or create it from the Supabase dashboard. Adjust the public/private
--    setting according to your desired access control.

-- 3) After this migration you can use server-side code like:
--    supabase.storage.from('ingredientes').upload(path, fileBuffer, { contentType: 'image/png' })
--    then save the returned `path` into `ingredient_catalog.image_path`.
